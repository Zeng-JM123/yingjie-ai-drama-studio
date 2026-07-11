import { createServer } from "node:http";

const port = Number(process.env.PORT || 8787);
const arkBaseUrl = "https://ark.cn-beijing.volces.com/api/v3";
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "https://zeng-jm123.github.io,http://localhost:4173,http://127.0.0.1:4173")
    .split(",").map(origin => origin.trim()).filter(Boolean)
);
const supportedRatios = new Set(["9:16", "16:9", "1:1", "3:4", "4:3", "21:9", "adaptive"]);
const supportedDurations = new Set([2, 3, 4, 5, 6, 8, 10, 12]);

function respond(response, status, body, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin" };
  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function configured() {
  return Boolean(process.env.ARK_API_KEY && process.env.ARK_VIDEO_ENDPOINT_ID);
}

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 32_000) throw new Error("Request body is too large.");
  }
  try { return JSON.parse(raw || "{}"); } catch { throw new Error("Request body must be valid JSON."); }
}

function assertHttpUrl(value, name) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch { throw new Error(`${name} must be an HTTP(S) URL.`); }
}

function addSeedanceControls(prompt, { ratio, duration, resolution }) {
  const controls = [];
  if (!/--ratio\s+\S+/i.test(prompt)) controls.push(`--ratio ${ratio}`);
  if (!/--duration\s+\d+/i.test(prompt)) controls.push(`--duration ${duration}`);
  if (resolution && !/--resolution\s+\S+/i.test(prompt)) controls.push(`--resolution ${resolution}`);
  return [prompt.trim(), ...controls].join(" ");
}

async function arkRequest(path, options = {}) {
  const response = await fetch(`${arkBaseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.ARK_API_KEY}`, ...options.headers },
    signal: AbortSignal.timeout(30_000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || "Seedance request failed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function normalizeTask(payload) {
  return {
    id: payload.id,
    status: payload.status,
    model: payload.model,
    videoUrl: payload.content?.video_url || payload.content?.videoUrl || null,
    lastFrameUrl: payload.content?.last_frame_url || null,
    error: payload.error?.message || payload.error || null,
    createdAt: payload.created_at || null,
    updatedAt: payload.updated_at || null
  };
}

async function createVideoJob(input) {
  const prompt = String(input.prompt || "").trim();
  if (prompt.length < 8 || prompt.length > 1_500) throw new Error("prompt must contain 8–1500 characters.");
  const ratio = input.ratio || "9:16";
  const duration = Number(input.duration || 5);
  const resolution = input.resolution || "720p";
  if (!supportedRatios.has(ratio)) throw new Error("Unsupported aspect ratio.");
  if (!supportedDurations.has(duration)) throw new Error("Unsupported duration.");
  if (!["480p", "720p", "1080p"].includes(resolution)) throw new Error("Unsupported resolution.");

  const firstFrameUrl = assertHttpUrl(input.firstFrameUrl, "firstFrameUrl");
  const lastFrameUrl = assertHttpUrl(input.lastFrameUrl, "lastFrameUrl");
  const content = [{ type: "text", text: addSeedanceControls(prompt, { ratio, duration, resolution }) }];
  if (firstFrameUrl) content.push({ type: "image_url", image_url: { url: firstFrameUrl }, role: "first_frame" });
  if (lastFrameUrl) content.push({ type: "image_url", image_url: { url: lastFrameUrl }, role: "last_frame" });

  const requestBody = { model: process.env.ARK_VIDEO_ENDPOINT_ID, content };
  if (input.generateAudio === true) requestBody.generate_audio = true;
  return normalizeTask(await arkRequest("/contents/generations/tasks", { method: "POST", body: JSON.stringify(requestBody) }));
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === "OPTIONS") return respond(response, 204, {}, origin);
  if (origin && !allowedOrigins.has(origin)) return respond(response, 403, { error: "Origin is not allowed." }, origin);
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "GET" && url.pathname === "/healthz") return respond(response, 200, { ok: true, provider: "Seedance", configured: configured() }, origin);
  if (!configured()) return respond(response, 503, { error: "Video service is not configured. Set ARK_API_KEY and ARK_VIDEO_ENDPOINT_ID." }, origin);
  try {
    if (request.method === "POST" && url.pathname === "/v1/video-jobs") return respond(response, 202, await createVideoJob(await readJson(request)), origin);
    const taskMatch = url.pathname.match(/^\/v1\/video-jobs\/(cgt-[A-Za-z0-9-]+)$/);
    if (request.method === "GET" && taskMatch) return respond(response, 200, normalizeTask(await arkRequest(`/contents/generations/tasks/${taskMatch[1]}`)), origin);
    return respond(response, 404, { error: "Not found." }, origin);
  } catch (error) {
    const status = error.status && error.status < 500 ? error.status : 502;
    return respond(response, status, { error: error.message || "Video generation failed." }, origin);
  }
});

server.listen(port, () => console.log(`映界 Seedance video service listening on :${port}`));
