import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function runtimeConfigFor(location) {
  const source = await readFile(new URL("../runtime-config.js", import.meta.url), "utf8");
  const window = { location };
  vm.runInNewContext(source, { window });
  return window.YINGJIE_CONFIG;
}

test("direct file previews use the local private gateway", async () => {
  const config = await runtimeConfigFor({ hostname: "", protocol: "file:" });
  assert.equal(config.studioApiBaseUrl, "http://127.0.0.1:8787");
  assert.equal(config.videoApiBaseUrl, "http://127.0.0.1:8787");
});

test("published pages do not expose a local gateway", async () => {
  const config = await runtimeConfigFor({ hostname: "zeng-jm123.github.io", protocol: "https:" });
  assert.equal(config.studioApiBaseUrl, "");
});
