import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createProjectStore } from '../video-service/store.mjs';

test('project store persists canvas nodes and versioned asset metadata', () => {
  const directory = mkdtempSync(join(tmpdir(), 'yingjie-production-store-'));
  try {
    const store = createProjectStore(join(directory, 'studio.db'));
    const seed = store.ensureSeed('production-contract-test');
    const productionStudio = {
      version: 1,
      mode: 'series',
      source: { text: '林夏在雨夜收到一份来自未来的合约。', fileName: '', analysis: { characters: ['林夏'], scenes: ['律师事务所'], dialogueCount: 0 } },
      canvas: { zoom: 1, seeded: true, nodes: [{ id: 'character-linxia', type: 'character', title: '林夏', sourceId: 'linxia', status: 'locked', assetIds: ['character-linxia'], x: 240, y: 40 }] },
      assets: [{ id: 'character-linxia', type: 'character', name: '林夏', status: 'locked', locked: true, version: 2, origin: '角色圣经', sourceId: 'linxia', tags: ['律师'], usedBy: ['镜头 01'], history: [{ version: 1, name: '林夏' }] }]
    };

    const saved = store.writeStudio('production-contract-test', {
      expectedRevision: seed.project.revision,
      project: { ...seed.project, metadata: { ...seed.project.metadata, productionStudio } },
      characters: seed.characters,
      shots: seed.shots,
      activity: seed.activity
    });

    assert.equal(saved.project.metadata.productionStudio.mode, 'series');
    assert.equal(saved.project.metadata.productionStudio.canvas.nodes[0].x, 240);
    assert.equal(saved.project.metadata.productionStudio.assets[0].version, 2);
    assert.equal(saved.project.metadata.productionStudio.assets[0].history[0].version, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
