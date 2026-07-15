import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadModelControls({ gateway = '', catalog } = {}) {
  const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const modelControlSource = appSource.slice(0, appSource.indexOf('function createSeasonPlan'));
  const select = {
    value: 'doubao-seed-2.1-turbo',
    groups: [],
    get options() { return this.groups.flatMap(group => group.children || [group]); },
    replaceChildren() { this.groups = []; },
    append(group) { this.groups.push(group); },
    addEventListener() {}
  };
  const billing = { textContent: '', className: '' };
  const elements = {
    '#toast': { classList: { add() {}, remove() {} } },
    '#productionModel': select,
    '#modelBilling': billing
  };
  const document = {
    querySelector: selector => elements[selector] || null,
    querySelectorAll: () => [],
    createElement: type => type === 'optgroup'
      ? { label: '', children: [], append(option) { this.children.push(option); } }
      : { value: '', textContent: '', disabled: false }
  };
  const context = vm.createContext({
    window: {
      YINGJIE_CONFIG: { studioApiBaseUrl: gateway },
      location: { hostname: 'example.com' }
    },
    document,
    fetch: async () => ({ ok: true, json: async () => catalog }),
    console,
    clearTimeout,
    setTimeout
  });
  vm.runInContext(modelControlSource, context, { filename: 'app.js' });
  await vm.runInContext('initializeModelCatalog()', context);
  return { select, billing };
}

const remoteModels = [{
  id: 'doubao-seed-2.1-turbo',
  name: 'Doubao Seed 2.1 Turbo',
  shortName: 'Seed 2.1 Turbo',
  vendor: '豆包',
  category: 'doubao',
  recommended: true,
  pricing: { inputPerMillion: 3, outputPerMillion: 15 },
  freeQuota: '50 万 tokens 试用额度',
  available: true,
  endpointConfigured: true
}];

test('offline studio only shows the free local draft instead of static placeholder models', async () => {
  const { select, billing } = await loadModelControls();
  assert.equal(select.value, 'local-rules');
  assert.equal(select.options.some(option => option.value === 'doubao-seed-2.1-turbo'), false);
  assert.match(billing.textContent, /尚未配置模型网关/);
});

test('configured model service keeps the recommended Ark model available', async () => {
  const { select, billing } = await loadModelControls({
    gateway: 'https://studio.example.com',
    catalog: { configured: true, defaultModel: 'doubao-seed-2.1-turbo', models: remoteModels }
  });
  assert.equal(select.value, 'doubao-seed-2.1-turbo');
  assert.equal(select.options[0].disabled, false);
  assert.match(billing.textContent, /可调用/);
});

test('reachable but unconfigured gateway also falls back locally', async () => {
  const { select, billing } = await loadModelControls({
    gateway: 'https://studio.example.com',
    catalog: {
      configured: false,
      defaultModel: 'local-rules',
      models: remoteModels.map(model => ({ ...model, available: false }))
    }
  });
  assert.equal(select.value, 'local-rules');
  assert.match(billing.textContent, /免费，不调用模型/);
});
