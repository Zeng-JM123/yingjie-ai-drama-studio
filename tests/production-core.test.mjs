import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadProductionCore() {
  const source = await readFile(new URL('../production-studio.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    window: {},
    projectMetadata: {},
    characters: {
      qingyan: { name: '沈清言' },
      yuze: { name: '陆予泽' }
    },
    shots: {},
    selectedSeasonEpisode: 1,
    selectedCharacter: 'qingyan',
    selectedShot: '1',
    DEFAULT_SEASON_PREMISE: '一个人遭遇改变命运的异常事件。',
    $: () => null,
    $$: () => [],
    console,
    Date,
    JSON,
    Math,
    Object,
    String,
    Number,
    Array,
    Set,
    RegExp
  });
  vm.runInContext(source, context, { filename: 'production-studio.js' });
  return { production: context.window.YingjieProduction, context };
}

const sampleScript = `
《倒计时合约》
场景一：旧城区律师事务所
林夏：这份合约不是我签的。
周野：可上面的指纹属于三天后的你。
外景：跨江大桥深夜
林夏来到废弃仓库，发现失踪多年的父亲留下了一段录像。
`;

test('source analysis extracts production entities', async () => {
  const { production } = await loadProductionCore();
  const analysis = production.analyzeSource(sampleScript, 'series');

  assert.equal(analysis.title, '倒计时合约');
  assert.equal(analysis.episodeTarget, 60);
  assert.ok(analysis.characters.includes('林夏'));
  assert.ok(analysis.characters.includes('周野'));
  assert.ok(analysis.scenes.length >= 2);
  assert.equal(analysis.dialogueCount, 2);
});

test('adaptive plan creates a complete 60 episode handoff graph', async () => {
  const { production } = await loadProductionCore();
  const plan = production.createSeasonPlan(sampleScript);

  assert.equal(plan.version, 2);
  assert.equal(plan.acts.length, 5);
  assert.equal(plan.episodes.length, 60);
  assert.deepEqual(Array.from(new Set(plan.episodes.map(episode => episode.act))), [1, 2, 3, 4, 5]);
  assert.ok(plan.episodes.every(episode => episode.duration === 120));
  assert.ok(plan.episodes.every(episode => episode.hook && episode.handoff && episode.animationAnchor));
  assert.equal(plan.episodes[0].number, 1);
  assert.equal(plan.episodes.at(-1).number, 60);
  assert.match(plan.episodes[0].story, /林夏/);
  assert.ok(JSON.stringify({ seasonPlan: plan, source: sampleScript }).length < 120_000);
});

test('single episode mode closes the story in one production unit', async () => {
  const { production } = await loadProductionCore();
  const analysis = production.analyzeSource(sampleScript, 'single');
  const plan = production.createSeasonPlan(analysis);

  assert.equal(plan.episodeCount, 1);
  assert.equal(plan.totalMinutes, 2);
  assert.equal(plan.acts.length, 1);
  assert.equal(plan.episodes.length, 1);
  assert.match(plan.episodes[0].handoff, /单集叙事已闭环/);
});

test('brief character list rebuilds story-specific episode shots', async () => {
  const { production } = await loadProductionCore();
  const brief = '孙悟空、哪吒、猪八戒、唐僧四个人打麻将';
  const analysis = production.analyzeSource(brief, 'series');
  const plan = production.createSeasonPlan(analysis);
  const episode = production.createEpisodeProduction(plan.episodes[0], analysis);
  const serialized = JSON.stringify(episode);

  assert.deepEqual(Array.from(analysis.characters), ['孙悟空', '哪吒', '猪八戒', '唐僧']);
  assert.equal(analysis.scenes[0], '麻将桌旁');
  assert.match(plan.episodes[0].story, /孙悟空.*打麻将/);
  assert.match(serialized, /孙悟空/);
  assert.match(serialized, /哪吒/);
  assert.match(serialized, /猪八戒/);
  assert.match(serialized, /唐僧/);
  assert.equal(Object.keys(episode.shots).length, 8);
  assert.doesNotMatch(serialized, /沈清言|陆予泽|电台直播间/);
});

test('video generation prompt inherits locked asset versions', async () => {
  const { production, context } = await loadProductionCore();
  context.projectMetadata.productionStudio = {
    version: 1,
    mode: 'series',
    source: { text: '', fileName: '', analysis: null },
    canvas: { zoom: 1, seeded: true, nodes: [] },
    assets: [
      { id: 'storyboard-1', type: 'storyboard', name: '镜头 01', description: '雨夜近景', locked: true, version: 3 },
      { id: 'character-linxia', type: 'character', name: '林夏', description: '黑色风衣，右眉细疤', locked: true, version: 2 },
      { id: 'scene-office', type: 'scene', name: '律师事务所', description: '冷白顶光，木质文件柜', locked: true, version: 1 }
    ]
  };

  const generation = production.buildShotGenerationContext('1', '林夏推开办公室的门。');
  assert.deepEqual(Array.from(generation.assetIds), ['storyboard-1', 'character-linxia', 'scene-office']);
  assert.match(generation.prompt, /林夏.*v2/);
  assert.match(generation.prompt, /律师事务所.*v1/);
});
