import assert from "node:assert/strict";
import test from "node:test";

import { buildProductionPrompt, generateProductionWithArk, modelCatalog, parseProductionResponse } from "../video-service/production-service.mjs";

test("model catalog exposes trial quota and paid unit prices", () => {
  const catalog = modelCatalog(true, {});
  assert.equal(catalog.models.length, 3);
  assert.equal(catalog.models[0].recommended, true);
  assert.equal(catalog.models[0].billing, "trial_then_paid");
  assert.equal(catalog.models[0].freeQuota, "50 万 tokens 试用额度");
  assert.equal(catalog.models[0].pricing.inputPerMillion, 3);
  assert.equal(catalog.models[1].pricing.outputPerMillion, 30);
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
