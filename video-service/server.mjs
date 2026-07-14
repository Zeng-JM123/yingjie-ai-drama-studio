import { createServer } from "node:http";
import { resolve } from "node:path";
import { createProjectStore } from "./store.mjs";
import { generateProductionWithArk, modelCatalog } from "./production-service.mjs";

const port = Number(process.env.PORT || 8787);
const arkBaseUrl = "https://ark.cn-beijing.volces.com/api/v3";
const maxRequestBytes = 64_000;
const maxProjectRequestBytes = 1_000_000;
const databasePath = resolve(process.env.DATABASE_PATH || "./data/yingjie.db");
const projectStore = createProjectStore(databasePath);
const jobLimitWindowMs = positiveInteger(process.env.JOB_LIMIT_WINDOW_SECONDS, 300) * 1_000;
const jobLimitMax = positiveInteger(process.env.JOB_LIMIT_MAX, 3);
const trustProxy = process.env.TRUST_PROXY === "true";
const jobSlots = new Map();
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "https://zeng-jm123.github.io,http://localhost:4173,http://127.0.0.1:4173,http://localhost:8000,http://127.0.0.1:8000")
    .split(",").map(origin => origin.trim()).filter(Boolean)
);
const allowLoopbackOrigins = process.env.ALLOW_LOOPBACK_ORIGINS === "true";
const supportedRatios = new Set(["9:16", "16:9", "1:1", "3:4", "4:3", "21:9", "adaptive"]);
const supportedDurations = new Set([2, 3, 4, 5, 6, 8, 10, 12]);

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isAllowedOrigin(origin) {
  if (allowedOrigins.has(origin)) return true;
  if (!allowLoopbackOrigins) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

function respond(response, status, body, origin, extraHeaders = {}) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin", ...extraHeaders };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  response.writeHead(status, headers);
  response.end(JSON.stringify(body));
}

function videoConfigured() {
  return Boolean(process.env.ARK_API_KEY && process.env.ARK_VIDEO_ENDPOINT_ID);
}

function textConfigured() {
  return Boolean(process.env.ARK_API_KEY);
}

async function readJson(request, maxBytes = maxRequestBytes) {
  const contentLength = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) throw httpError("Request body is too large.", 413);
  let raw = "";
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw httpError("Request body is too large.", 413);
    raw += chunk;
  }
  try {
    const value = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw httpError("Request body must be a JSON object."); }
}

function assertHttpUrl(value, name) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) throw new Error();
    return url.toString();
  } catch { throw httpError(`${name} must be an HTTP(S) URL.`); }
}

function clientKey(request) {
  if (trustProxy) {
    const forwardedFor = request.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor) return forwardedFor.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function takeJobSlot(request) {
  const now = Date.now();
  if (jobSlots.size > 10_000) {
    for (const [key, slot] of jobSlots) if (now >= slot.resetAt) jobSlots.delete(key);
  }
  const key = clientKey(request);
  const current = jobSlots.get(key);
  if (!current || now >= current.resetAt) {
    jobSlots.set(key, { count: 1, resetAt: now + jobLimitWindowMs });
    return 0;
  }
  if (current.count >= jobLimitMax) return Math.ceil((current.resetAt - now) / 1_000);
  current.count += 1;
  return 0;
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

function buildVideoJobRequest(input) {
  if (typeof input.prompt !== "string") throw httpError("prompt must be a string.");
  const prompt = input.prompt.trim();
  if (prompt.length < 8 || prompt.length > 1_500) throw httpError("prompt must contain 8–1500 characters.");
  const ratio = input.ratio ?? "9:16";
  const duration = input.duration ?? 5;
  const resolution = input.resolution ?? "720p";
  if (typeof ratio !== "string" || !supportedRatios.has(ratio)) throw httpError("Unsupported aspect ratio.");
  if (!Number.isInteger(duration) || !supportedDurations.has(duration)) throw httpError("Unsupported duration.");
  if (typeof resolution !== "string" || !["480p", "720p", "1080p"].includes(resolution)) throw httpError("Unsupported resolution.");
  if (input.generateAudio !== undefined && typeof input.generateAudio !== "boolean") throw httpError("generateAudio must be a boolean.");

  const firstFrameUrl = assertHttpUrl(input.firstFrameUrl, "firstFrameUrl");
  const lastFrameUrl = assertHttpUrl(input.lastFrameUrl, "lastFrameUrl");
  const content = [{ type: "text", text: addSeedanceControls(prompt, { ratio, duration, resolution }) }];
  if (firstFrameUrl) content.push({ type: "image_url", image_url: { url: firstFrameUrl }, role: "first_frame" });
  if (lastFrameUrl) content.push({ type: "image_url", image_url: { url: lastFrameUrl }, role: "last_frame" });

  const requestBody = { model: process.env.ARK_VIDEO_ENDPOINT_ID, content };
  if (input.generateAudio === true) requestBody.generate_audio = true;
  return requestBody;
}

function projectScope(input) {
  if (input.projectId === undefined && input.shotId === undefined) return { projectId: null, shotId: null };
  if (typeof input.projectId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(input.projectId)) throw httpError("projectId must be a valid project identifier.");
  if (input.shotId !== undefined && (typeof input.shotId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(input.shotId))) throw httpError("shotId must be a valid shot identifier.");
  return { projectId: input.projectId, shotId: input.shotId || null };
}

async function createVideoJob(requestBody) {
  return normalizeTask(await arkRequest("/contents/generations/tasks", { method: "POST", body: JSON.stringify(requestBody) }));
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (request.method === "OPTIONS") return respond(response, 204, {}, origin);
  if (origin && !isAllowedOrigin(origin)) return respond(response, 403, { error: "Origin is not allowed." }, origin);
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === "GET" && url.pathname === "/healthz") return respond(response, 200, {
    ok: true,
    provider: "Volcengine Ark",
    configured: textConfigured() || videoConfigured(),
    textConfigured: textConfigured(),
    videoConfigured: videoConfigured(),
    database: "sqlite"
  }, origin);
  try {
    const studioMatch = url.pathname.match(/^\/v1\/projects\/([A-Za-z0-9_-]{1,80})\/studio$/);
    const jobsMatch = url.pathname.match(/^\/v1\/projects\/([A-Za-z0-9_-]{1,80})\/video-jobs$/);
    if (request.method === "GET" && studioMatch) return respond(response, 200, projectStore.ensureSeed(studioMatch[1]), origin);
    if (request.method === "PUT" && studioMatch) {
      const input = await readJson(request, maxProjectRequestBytes);
      return respond(response, 200, projectStore.writeStudio(studioMatch[1], input), origin);
    }
    if (request.method === "GET" && jobsMatch) return respond(response, 200, { jobs: projectStore.listVideoJobs(jobsMatch[1]) }, origin);

    if (request.method === "GET" && url.pathname === "/v1/models") {
      return respond(response, 200, modelCatalog(textConfigured()), origin, { "Cache-Control": "public, max-age=1800" });
    }
    if (request.method === "POST" && url.pathname === "/v1/production/generate") {
      if (!textConfigured()) return respond(response, 503, { error: "文本模型服务未配置。请设置 ARK_API_KEY。" }, origin);
      const retryAfter = takeJobSlot(request);
      if (retryAfter) return respond(response, 429, { error: "模型生成请求过于频繁，请稍后重试。" }, origin, { "Retry-After": String(retryAfter) });
      const input = await readJson(request);
      const result = await generateProductionWithArk(input);
      return respond(response, 200, result, origin);
    }

    if (!videoConfigured()) return respond(response, 503, { error: "视频服务未配置。请设置 ARK_API_KEY 和 ARK_VIDEO_ENDPOINT_ID。" }, origin);
    if (request.method === "POST" && url.pathname === "/v1/video-jobs") {
      const input = await readJson(request);
      const requestBody = buildVideoJobRequest(input);
      const scope = projectScope(input);
      const retryAfter = takeJobSlot(request);
      if (retryAfter) return respond(response, 429, { error: "Too many video jobs. Please try again later." }, origin, { "Retry-After": String(retryAfter) });
      const task = await createVideoJob(requestBody);
      if (scope.projectId) projectStore.recordVideoJob({ ...scope, providerTaskId: task.id, input, task });
      return respond(response, 202, task, origin);
    }
    const taskMatch = url.pathname.match(/^\/v1\/video-jobs\/(cgt-[A-Za-z0-9-]+)$/);
    if (request.method === "GET" && taskMatch) {
      const task = normalizeTask(await arkRequest(`/contents/generations/tasks/${taskMatch[1]}`));
      projectStore.updateVideoJob(taskMatch[1], task);
      return respond(response, 200, task, origin);
    }
    return respond(response, 404, { error: "Not found." }, origin);
  } catch (error) {
    const status = error.status && error.status < 500 ? error.status : 502;
    return respond(response, status, { error: error.message || "Video generation failed." }, origin);
  }
});

server.listen(port, () => console.log(`映界 Volcengine Ark gateway listening on :${port}`));
