import { randomUUID } from "node:crypto";

const MODEL_PRICE_SOURCE = "https://www.volcengine.com/product/doubao";
const MODEL_LIST_SOURCE = "https://www.volcengine.com/docs/82379/1330310";
const ARK_RUNTIME_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DEFAULT_MODEL_ID = "doubao-seed-2.1-turbo";
const MODEL_ID_PATTERN = /^[A-Za-z0-9._:-]{1,200}$/;

const BUILTIN_MODEL_DEFINITIONS = [
  {
    id: "doubao-seed-2.1-turbo",
    env: "ARK_TEXT_MODEL_TURBO",
    name: "Doubao Seed 2.1 Turbo",
    shortName: "Seed 2.1 Turbo",
    vendor: "豆包",
    category: "doubao",
    recommended: true,
    tier: "balanced",
    description: "速度、质量和成本更均衡，适合日常剧本拆解与批量分镜。",
    pricing: { inputPerMillion: 3, outputPerMillion: 15, currency: "CNY" },
    freeQuota: "50 万 tokens 试用额度",
    billing: "trial_then_paid",
    supportsJsonMode: true,
    supportsThinkingControl: true
  },
  {
    id: "doubao-seed-2.1-pro",
    env: "ARK_TEXT_MODEL_PRO",
    name: "Doubao Seed 2.1 Pro",
    shortName: "Seed 2.1 Pro",
    vendor: "豆包",
    category: "doubao",
    recommended: false,
    tier: "quality",
    description: "复杂人物关系、长线伏笔和高要求结构化创作优先。",
    pricing: { inputPerMillion: 6, outputPerMillion: 30, currency: "CNY" },
    freeQuota: "50 万 tokens 试用额度",
    billing: "trial_then_paid",
    supportsJsonMode: true
  },
  {
    id: "doubao-seed-evolving",
    env: "ARK_TEXT_MODEL_EVOLVING",
    name: "Doubao Seed Evolving",
    shortName: "Seed Evolving",
    vendor: "豆包",
    category: "doubao",
    recommended: false,
    tier: "agent",
    description: "持续演进的 Agent 模型，适合复杂生产规则和多步任务编排。",
    pricing: { inputPerMillion: 6, outputPerMillion: 30, currency: "CNY" },
    freeQuota: "50 万 tokens 试用额度",
    billing: "trial_then_paid",
    supportsJsonMode: true
  },
  {
    id: "deepseek-v3.2",
    env: "ARK_TEXT_MODEL_DEEPSEEK",
    name: "DeepSeek V3.2",
    shortName: "DeepSeek V3.2",
    vendor: "DeepSeek",
    category: "third-party",
    recommended: false,
    tier: "reasoning",
    description: "适合复杂因果、悬疑推理和长线伏笔校验。",
    pricing: null,
    priceLabel: "方舟控制台计价",
    freeQuota: "免费与试用额度以方舟账号为准",
    billing: "account",
    supportsJsonMode: false
  },
  {
    id: "kimi-k2.5",
    env: "ARK_TEXT_MODEL_KIMI",
    name: "Kimi K2.5",
    shortName: "Kimi K2.5",
    vendor: "Moonshot AI",
    category: "third-party",
    recommended: false,
    tier: "long-context",
    description: "适合长原稿、全季上下文和跨集连续性整理。",
    pricing: null,
    priceLabel: "方舟控制台计价",
    freeQuota: "免费与试用额度以方舟账号为准",
    billing: "account",
    supportsJsonMode: false
  },
  {
    id: "glm-4.7",
    env: "ARK_TEXT_MODEL_GLM",
    name: "GLM-4.7",
    shortName: "GLM-4.7",
    vendor: "智谱 AI",
    category: "third-party",
    recommended: false,
    tier: "structured",
    description: "适合结构化剧本拆解、角色关系和生产任务规划。",
    pricing: null,
    priceLabel: "方舟控制台计价",
    freeQuota: "免费与试用额度以方舟账号为准",
    billing: "account",
    supportsJsonMode: false
  }
];

function optionalText(value, fallback, maxLength = 120) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function customPricing(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const inputPerMillion = Number(value.inputPerMillion);
  const outputPerMillion = Number(value.outputPerMillion);
  if (!Number.isFinite(inputPerMillion) || inputPerMillion < 0 || !Number.isFinite(outputPerMillion) || outputPerMillion < 0) return null;
  return { inputPerMillion, outputPerMillion, currency: value.currency === "USD" ? "USD" : "CNY" };
}

function customModelConfig(env) {
  const raw = typeof env.ARK_TEXT_MODELS_JSON === "string" ? env.ARK_TEXT_MODELS_JSON.trim() : "";
  if (!raw) return { models: [], warnings: [] };
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { return { models: [], warnings: ["ARK_TEXT_MODELS_JSON 不是有效 JSON，已忽略自定义模型。"] }; }
  if (!Array.isArray(parsed)) return { models: [], warnings: ["ARK_TEXT_MODELS_JSON 必须是模型数组，已忽略自定义模型。"] };
  const warnings = [];
  const models = parsed.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      warnings.push(`自定义模型第 ${index + 1} 项不是对象，已忽略。`);
      return [];
    }
    const id = optionalText(item.id, "", 80);
    const providerModel = optionalText(item.providerModel, "", 200);
    if (!MODEL_ID_PATTERN.test(id) || !MODEL_ID_PATTERN.test(providerModel)) {
      warnings.push(`自定义模型第 ${index + 1} 项缺少有效 id 或 providerModel，已忽略。`);
      return [];
    }
    return [{
      id,
      providerModel,
      name: optionalText(item.name, id, 80),
      shortName: optionalText(item.shortName, item.name || id, 50),
      vendor: optionalText(item.vendor, "方舟自定义", 50),
      category: "custom",
      recommended: item.recommended === true,
      tier: optionalText(item.tier, "custom", 30),
      description: optionalText(item.description, "由部署环境配置的方舟文本生成模型。", 180),
      pricing: customPricing(item.pricing),
      priceLabel: optionalText(item.priceLabel, "方舟控制台计价", 60),
      freeQuota: optionalText(item.freeQuota, "免费与试用额度以方舟账号为准", 80),
      billing: ["free", "paid", "trial_then_paid", "account"].includes(item.billing) ? item.billing : "account",
      supportsJsonMode: item.supportsJsonMode === true,
      source: "environment"
    }];
  });
  return { models, warnings };
}

function resolvedModelDefinitions(env = process.env) {
  const custom = customModelConfig(env);
  const modelsById = new Map(BUILTIN_MODEL_DEFINITIONS.map(model => [model.id, {
    ...model,
    providerModel: optionalText(env[model.env], model.defaultProviderModel || "", 200),
    source: "builtin"
  }]));
  custom.models.forEach(model => modelsById.set(model.id, { ...(modelsById.get(model.id) || {}), ...model }));
  return { models: [...modelsById.values()], warnings: custom.warnings };
}

export function modelCatalog(configured = false, env = process.env, options = {}) {
  const resolved = resolvedModelDefinitions(env);
  const discoveredProviderModels = Array.isArray(options.providerModelIds)
    ? new Set(options.providerModelIds.filter(id => typeof id === "string" && MODEL_ID_PATTERN.test(id)))
    : null;
  const models = resolved.models.map(({ env: _env, defaultProviderModel: _defaultProviderModel, providerModel, supportsJsonMode: _supportsJsonMode, supportsThinkingControl: _supportsThinkingControl, ...model }) => ({
    ...model,
    // Endpoint IDs are account-owned aliases and are not returned by /models.
    // Direct Model IDs must still be present in the live Ark response to be selectable.
    available: configured && Boolean(providerModel) && (!discoveredProviderModels || providerModel.startsWith("ep-") || discoveredProviderModels.has(providerModel)),
    endpointConfigured: Boolean(providerModel),
    liveVerified: discoveredProviderModels ? providerModel.startsWith("ep-") || discoveredProviderModels.has(providerModel) : null
  }));
  const defaultModel = models.find(model => model.recommended && model.available)?.id || models.find(model => model.available)?.id || "local-rules";
  return {
    provider: "volcengine-ark",
    configured,
    updatedAt: options.fetchedAt || new Date().toISOString(),
    defaultModel,
    discovery: {
      source: discoveredProviderModels ? "ark-api" : "configuration",
      providerModelCount: discoveredProviderModels?.size || 0
    },
    priceNotice: "模型是否免费、试用额度和实际单价以方舟账号与接入点为准；页面中的已知价格仅作参考。",
    priceSource: MODEL_PRICE_SOURCE,
    listSource: MODEL_LIST_SOURCE,
    configurationWarnings: resolved.warnings,
    models
  };
}

export async function fetchArkModelCatalog(options = {}) {
  const env = options.env || process.env;
  const apiKey = options.apiKey || env.ARK_API_KEY;
  if (!apiKey) return modelCatalog(false, env);
  const fetchImpl = options.fetchImpl || fetch;
  const baseUrl = String(options.baseUrl || ARK_RUNTIME_BASE_URL).replace(/\/$/, "");
  let response;
  try {
    response = await fetchImpl(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000)
    });
  } catch {
    throw serviceError("无法从方舟获取当前账号的模型目录。", 502);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw serviceError(payload?.error?.message || payload?.message || "方舟模型目录请求失败。", response.status >= 400 && response.status < 500 ? response.status : 502);
  const providerModelIds = Array.isArray(payload?.data)
    ? payload.data.map(item => item?.id).filter(id => typeof id === "string" && MODEL_ID_PATTERN.test(id))
    : [];
  if (!providerModelIds.length) throw serviceError("方舟未返回可用模型目录。", 502);
  return modelCatalog(true, env, { providerModelIds, fetchedAt: new Date().toISOString() });
}

export function selectedModel(modelId, env = process.env) {
  const definition = resolvedModelDefinitions(env).models.find(model => model.id === modelId);
  if (!definition) throw serviceError("不支持所选方舟模型。", 400);
  if (!definition.providerModel) throw serviceError(`所选模型 ${definition.name} 尚未配置方舟 Model ID 或 Endpoint ID。`, 503);
  return definition;
}

function cleanInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw serviceError("请求体必须是 JSON 对象。", 400);
  const source = typeof input.source === "string" ? input.source.trim() : "";
  if (source.length < 8 || source.length > 40_000) throw serviceError("创作输入必须包含 8-40000 个字符。", 400);
  const mode = ["series", "single", "comic", "realistic"].includes(input.mode) ? input.mode : "series";
  const scope = input.scope === "episode" ? "episode" : "project";
  const episodeNumber = Number.isInteger(input.episodeNumber) && input.episodeNumber > 0 ? input.episodeNumber : 1;
  const episodeContext = input.episodeContext && typeof input.episodeContext === "object" && !Array.isArray(input.episodeContext)
    ? input.episodeContext
    : null;
  if (episodeContext && JSON.stringify(episodeContext).length > 12_000) throw serviceError("分集上下文内容过大。", 400);
  return { source, mode, scope, episodeNumber, episodeContext, model: String(input.model || DEFAULT_MODEL_ID) };
}

function modeDescription(mode) {
  return {
    series: "多集竖屏短剧",
    single: "单集竖屏短剧",
    comic: "AI 动态漫剧",
    realistic: "AI 仿真人短剧"
  }[mode] || "多集竖屏短剧";
}

export function buildProductionPrompt(rawInput) {
  const input = cleanInput(rawInput);
  const episodeTarget = input.mode === "single" ? 1 : 60;
  if (input.scope === "episode") {
    return `你是资深短剧导演和分镜师。请基于原始创作输入、已有分集信息，为第 ${input.episodeNumber} 集重新生成可直接进入制作系统的分镜数据。

必须只输出一个 JSON 对象，不要 Markdown，不要解释。结构必须为：
{"episodeProduction":{"episodeCode":"EP01","episodeTitle":"标题","beats":{"act1":{"code":"场景编码","title":"节拍标题","body":"剧情内容","tension":"58%","time":"00:00 — 00:40"},"act2":{},"act3":{}},"shots":[{"title":"镜头标题","size":"全景 WS","movement":"缓慢推进","duration":"4.0","emotion":"情绪","caption":"镜头中实际发生的动作","note":"台词或音效","prompt":"可用于图像或视频模型的完整中文提示词"}]}}

要求：shots 必须恰好 8 项；每一镜必须有可见动作、人物关系、景别、运镜、时长、声音和连续性约束；前后镜头动作能够接上；第 8 镜必须形成下一集钩子；不要写空泛的“关键动作发生”。

项目类型：${modeDescription(input.mode)}
目标分集：EP${String(input.episodeNumber).padStart(2, "0")}
已有分集信息：${JSON.stringify(input.episodeContext || {})}
原始创作输入：
${input.source}`;
  }

  return `你是中国竖屏短剧的总编剧、角色设定师和分镜导演。请把用户输入转成可直接写入制作系统的结构化项目数据，而不是泛泛建议。

必须只输出一个 JSON 对象，不要 Markdown，不要解释。顶层结构必须为：
{
  "analysis": {
    "title": "剧名",
    "premise": "完整故事前提",
    "protagonist": "主角名",
    "characters": [{"name":"姓名","role":"身份与戏剧功能","tone":"表演基调","anchor":"服装、外形和关键道具锚点"}],
    "scenes": [{"name":"场景名","time":"时间天气","visualRules":"空间、光线、色彩和连续性规则"}],
    "dialogueLines": ["人物：台词"],
    "storyLines": ["明确可拍摄的动作或剧情信息"],
    "style": "视觉与表演风格"
  },
  "worldRules": {"time":"时间天气规则","palette":"色彩与光线规则","constraints":"必须保持和禁止出现的元素"},
  "seasonPlan": {
    "premise":"全季故事前提","episodeCount":${episodeTarget},"episodeDurationMinutes":2,"totalMinutes":${episodeTarget * 2},"continuityScore":94,
    "acts":[{"id":1,"title":"章节标题","range":"EP01—12","summary":"章节任务","characterState":"人物弧光状态"}],
    "episodes":[{"id":"ep-01","number":1,"act":1,"actTitle":"章节标题","title":"本集标题","story":"本集明确目标、阻力和信息增量","hook":"结尾反转或悬念","previousHook":"承接上一集的钩子","characterState":"本集结束人物状态","animationAnchor":"造型、场景、道具、时间和动作连续性","handoff":"下一集如何直接承接","duration":120,"status":"outlined"}]
  },
  "episodeProduction": {
    "episodeCode":"EP01","episodeTitle":"标题",
    "beats":{"act1":{"code":"场景编码","title":"节拍标题","body":"剧情内容","tension":"58%","time":"00:00 — 00:40"},"act2":{},"act3":{}},
    "shots":[{"title":"镜头标题","size":"全景 WS","movement":"缓慢推进","duration":"4.0","emotion":"情绪","caption":"镜头中实际发生的动作","note":"台词或音效","prompt":"可用于图像或视频模型的完整中文提示词"}]
  }
}

硬性要求：
1. analysis 必须尊重用户输入，不得套用电台、未来语音等示例设定。
2. characters 和 scenes 必须来自输入并补全可生产信息；人物关系、动作因果和场景调度要具体。
3. seasonPlan.episodes 必须恰好 ${episodeTarget} 项，编号连续；${episodeTarget === 60 ? "acts 必须恰好 5 项，每章 12 集" : "acts 必须恰好 1 项"}。
4. episodeProduction 对应 EP01，shots 必须恰好 8 项；每镜要有实际动作和声音，前后动作可衔接，第 8 镜形成钩子。
5. prompt 必须包含角色身份锚点、场景、动作、景别、运镜、情绪、光线和连续性约束，能够直接交给后续图像或视频模型。
6. 所有字段使用简体中文；不得省略字段，不得使用“同上”“略”等占位词。

项目类型：${modeDescription(input.mode)}
目标集数：${episodeTarget}
原始创作输入：
${input.source}`;
}

function responseText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(item => item?.text || item?.content || "").join("");
  if (typeof payload?.output_text === "string") return payload.output_text;
  if (Array.isArray(payload?.output)) {
    return payload.output.flatMap(item => item?.content || []).map(item => item?.text || "").join("");
  }
  return "";
}

export function parseProductionResponse(payload) {
  const text = responseText(payload).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (!text) throw serviceError("方舟模型没有返回可用内容。", 502);
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw serviceError("方舟模型返回的生产数据不是有效 JSON，请重试。", 502); }
  const production = parsed?.production && typeof parsed.production === "object" ? parsed.production : parsed;
  if (!production || typeof production !== "object" || Array.isArray(production)) throw serviceError("方舟模型返回的生产数据结构不正确。", 502);
  return production;
}

function productionWarnings(production, input) {
  const warnings = [];
  if (input.scope === "episode") {
    if (!Array.isArray(production.episodeProduction?.shots) || production.episodeProduction.shots.length !== 8) warnings.push("模型未返回完整的 8 镜，客户端将补齐缺失字段。");
    return warnings;
  }
  const target = input.mode === "single" ? 1 : 60;
  if (!Array.isArray(production.analysis?.characters) || !production.analysis.characters.length) warnings.push("模型未返回人物列表。");
  if (!Array.isArray(production.analysis?.scenes) || !production.analysis.scenes.length) warnings.push("模型未返回场景列表。");
  if (!Array.isArray(production.seasonPlan?.episodes) || production.seasonPlan.episodes.length !== target) warnings.push(`模型返回的分集数不是 ${target}，客户端将补齐缺失分集。`);
  if (!Array.isArray(production.episodeProduction?.shots) || production.episodeProduction.shots.length !== 8) warnings.push("模型未返回完整的 8 镜，客户端将补齐缺失镜头。");
  return warnings;
}

export async function generateProductionWithArk(rawInput, options = {}) {
  const input = cleanInput(rawInput);
  const model = selectedModel(input.model, options.env || process.env);
  const fetchImpl = options.fetchImpl || fetch;
  const apiKey = options.apiKey || process.env.ARK_API_KEY;
  if (!apiKey) throw serviceError("文本模型服务未配置 ARK_API_KEY。", 503);
  const targetMaxTokens = input.scope === "episode" || input.mode === "single" ? 8_000 : 24_000;
  const configuredMaxTokens = Number(options.maxTokens || process.env.ARK_TEXT_MAX_TOKENS);
  const maxTokens = Math.max(2_000, Math.min(32_000, targetMaxTokens, Number.isFinite(configuredMaxTokens) && configuredMaxTokens > 0 ? configuredMaxTokens : targetMaxTokens));
  const targetTimeoutMs = input.scope === "episode" || input.mode === "single" ? 240_000 : 600_000;
  const configuredTimeoutMs = Number(options.timeoutMs || process.env.ARK_TEXT_TIMEOUT_MS);
  const timeoutMs = Math.max(30_000, Math.min(900_000, Number.isFinite(configuredTimeoutMs) && configuredTimeoutMs > 0 ? configuredTimeoutMs : targetTimeoutMs));
  const requestBody = {
    model: model.providerModel,
    messages: [
      { role: "system", content: "你是严谨的短剧生产系统，只返回符合用户约定结构的 JSON。" },
      { role: "user", content: buildProductionPrompt(input) }
    ],
    max_tokens: maxTokens
  };
  if (model.supportsJsonMode) requestBody.response_format = { type: "json_object" };
  if (model.supportsThinkingControl) requestBody.thinking = { type: "disabled" };
  const response = await fetchImpl("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || "方舟文本模型调用失败。";
    throw serviceError(message, response.status >= 400 && response.status < 500 ? response.status : 502);
  }
  const production = parseProductionResponse(payload);
  const usage = payload.usage || {};
  return {
    production,
    warnings: productionWarnings(production, input),
    generation: {
      id: payload.id || randomUUID(),
      provider: "volcengine-ark",
      modelId: model.id,
      modelName: model.name,
      providerModel: model.providerModel,
      scope: input.scope,
      inputTokens: Number(usage.prompt_tokens || usage.input_tokens) || 0,
      outputTokens: Number(usage.completion_tokens || usage.output_tokens) || 0,
      totalTokens: Number(usage.total_tokens) || Number(usage.prompt_tokens || usage.input_tokens || 0) + Number(usage.completion_tokens || usage.output_tokens || 0),
      generatedAt: new Date().toISOString()
    }
  };
}

function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}
