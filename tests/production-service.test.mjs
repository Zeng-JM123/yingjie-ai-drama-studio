import assert from "node:assert/strict";
import test from "node:test";

import { buildProductionPrompt, fetchArkModelCatalog, generateProductionWithArk, modelCatalog, parseProductionResponse, selectedModel } from "../video-service/production-service.mjs";

test("model catalog exposes multi-vendor models and known unit prices", () => {
  const catalog = modelCatalog(true, {});
  assert.equal(catalog.models.length, 6);
  assert.equal(catalog.models[0].recommended, true);
  assert.equal(catalog.models[0].billing, "trial_then_paid");
  assert.equal(catalog.models[0].freeQuota, "50 万 tokens 试用额度");
  assert.equal(catalog.models[0].pricing.inputPerMillion, 3);
  assert.equal(catalog.models[1].pricing.outputPerMillion, 30);
  assert.equal(catalog.models.find(model => model.id === "deepseek-v3.2").vendor, "DeepSeek");
  assert.equal(catalog.models.find(model => model.id === "deepseek-v3.2").available, false);
});

test("configured third-party and custom Ark endpoints become selectable", () => {
  const env = {
    ARK_TEXT_MODEL_DEEPSEEK: "ep-deepseek-test",
    ARK_TEXT_MODELS_JSON: JSON.stringify([{
      id: "my-story-model",
      providerModel: "ep-story-test",
      name: "我的故事模型",
      vendor: "自定义工作室",
      billing: "paid",
      priceLabel: "项目套餐计费"
    }])
  };
  const catalog = modelCatalog(true, env);
  assert.equal(catalog.models.find(model => model.id === "deepseek-v3.2").available, true);
  assert.equal(catalog.models.find(model => model.id === "my-story-model").category, "custom");
  assert.equal(catalog.models.find(model => model.id === "my-story-model").priceLabel, "项目套餐计费");
  assert.equal(selectedModel("my-story-model", env).providerModel, "ep-story-test");
});

test("invalid custom catalog entries are ignored with a configuration warning", () => {
  const catalog = modelCatalog(true, { ARK_TEXT_MODELS_JSON: "not-json" });
  assert.equal(catalog.models.length, 6);
  assert.equal(catalog.configurationWarnings.length, 1);
});

test("live Ark discovery only makes currently returned model IDs selectable", async () => {
  const catalog = await fetchArkModelCatalog({
    apiKey: "test-key",
    env: { ARK_TEXT_MODEL_TURBO: "doubao-seed-2-1-turbo-260628", ARK_TEXT_MODEL_PRO: "doubao-seed-2-1-pro-260628" },
    baseUrl: "https://ark.example.com/api/v3",
    fetchImpl: async (url, request) => {
      assert.equal(url, "https://ark.example.com/api/v3/models");
      assert.equal(request.headers.Authorization, "Bearer test-key");
      return { ok: true, status: 200, json: async () => ({ data: [{ id: "doubao-seed-2-1-turbo-260628" }] }) };
    }
  });
  assert.equal(catalog.discovery.source, "ark-api");
  assert.equal(catalog.models.find(model => model.id === "doubao-seed-2.1-turbo").available, true);
  assert.equal(catalog.models.find(model => model.id === "doubao-seed-2.1-pro").available, false);
});

test("project prompt requires a complete model-authored production contract", () => {
  const prompt = buildProductionPrompt({ source: "孙悟空、哪吒、猪八戒、唐僧四个人打麻将", mode: "series", model: "doubao-seed-2.1-turbo" });
  assert.match(prompt, /必须恰好 60 项/);
  assert.match(prompt, /shots 必须恰好 8 项/);
  assert.match(prompt, /孙悟空、哪吒、猪八戒、唐僧四个人打麻将/);
});

test("episode prompt includes the selected episode handoff", () => {
  const prompt = buildProductionPrompt({
    source: "林夏在雨夜收到来自未来的合约。",
    mode: "series",
    scope: "episode",
    episodeNumber: 7,
    episodeContext: { title: "第七份签名", hook: "签名来自明天" },
    model: "doubao-seed-2.1-turbo"
  });
  assert.match(prompt, /第 7 集/);
  assert.match(prompt, /签名来自明天/);
  assert.doesNotMatch(prompt, /seasonPlan\.episodes 必须/);
});

test("chat completion JSON is parsed without exposing markdown fences", () => {
  const production = parseProductionResponse({ choices: [{ message: { content: "```json\n{\"analysis\":{\"title\":\"测试\"}}\n```" } }] });
  assert.equal(production.analysis.title, "测试");
});

test("Ark generation returns provenance and token usage", async () => {
  const response = await generateProductionWithArk(
    { source: "林夏在雨夜收到来自未来的合约。", mode: "single", model: "doubao-seed-2.1-turbo" },
    {
      apiKey: "test-key",
      env: { ARK_TEXT_MODEL_TURBO: "ep-test-text" },
      fetchImpl: async (_url, request) => {
        const body = JSON.parse(request.body);
        assert.equal(body.model, "ep-test-text");
        assert.equal(body.max_tokens, 8_000);
        assert.deepEqual(body.response_format, { type: "json_object" });
        assert.deepEqual(body.thinking, { type: "disabled" });
        assert.equal(request.headers.Authorization, "Bearer test-key");
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "chatcmpl-test",
            choices: [{ message: { content: JSON.stringify({ analysis: { title: "倒计时合约", characters: [{ name: "林夏" }], scenes: [{ name: "律师事务所" }] }, seasonPlan: { episodes: [{}] }, episodeProduction: { shots: Array.from({ length: 8 }, () => ({})) } }) } }],
            usage: { prompt_tokens: 120, completion_tokens: 340, total_tokens: 460 }
          })
        };
      }
    }
  );
  assert.equal(response.generation.id, "chatcmpl-test");
  assert.equal(response.generation.modelId, "doubao-seed-2.1-turbo");
  assert.equal(response.generation.totalTokens, 460);
  assert.equal(response.production.analysis.title, "倒计时合约");
});

test("models without JSON mode still use the shared production contract", async () => {
  const response = await generateProductionWithArk(
    { source: "四位老友在台风夜争夺一封遗嘱。", mode: "single", model: "deepseek-v3.2" },
    {
      apiKey: "test-key",
      env: { ARK_TEXT_MODEL_DEEPSEEK: "ep-deepseek-test" },
      fetchImpl: async (_url, request) => {
        const body = JSON.parse(request.body);
        assert.equal(body.model, "ep-deepseek-test");
        assert.equal("response_format" in body, false);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: JSON.stringify({ analysis: { title: "台风遗嘱" }, seasonPlan: { episodes: [{}] }, episodeProduction: { shots: Array.from({ length: 8 }, () => ({})) } }) } }],
            usage: { total_tokens: 200 }
          })
        };
      }
    }
  );
  assert.equal(response.generation.modelName, "DeepSeek V3.2");
  assert.equal(response.generation.providerModel, "ep-deepseek-test");
});
