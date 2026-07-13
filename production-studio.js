(() => {
  const TYPE_LABELS = {
    story: '故事', character: '角色', scene: '场景', shot: '分镜', audio: '声音',
    storyboard: '分镜', video: '视频', script: '剧本'
  };
  const TYPE_ICONS = { story: '文', character: '角', scene: '景', shot: '镜', audio: '声' };
  const SOURCE_TARGETS = { story: '#season', character: '#cast', scene: '#cast', shot: '#storyboard', audio: '#cast' };
  const runtime = {
    initialized: false,
    selectedNodeId: null,
    selectedAssetId: null,
    assetFilter: 'all',
    assetQuery: '',
    drag: null
  };

  function productionState() {
    const previous = projectMetadata.productionStudio || {};
    const canvas = previous.canvas || {};
    projectMetadata.productionStudio = {
      version: 1,
      mode: ['series', 'single', 'comic', 'realistic'].includes(previous.mode) ? previous.mode : 'series',
      source: previous.source && typeof previous.source === 'object' ? previous.source : { text: '', fileName: '', analysis: null },
      canvas: {
        zoom: Number.isFinite(Number(canvas.zoom)) ? Math.max(.55, Math.min(1.5, Number(canvas.zoom))) : 1,
        seeded: Boolean(canvas.seeded),
        nodes: Array.isArray(canvas.nodes) ? canvas.nodes : []
      },
      assets: Array.isArray(previous.assets) ? previous.assets : []
    };
    return projectMetadata.productionStudio;
  }

  function makeId(prefix, value = '') {
    const clean = String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42);
    return `${prefix}-${clean || hashString(value) || Date.now()}`;
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function cleanText(value, max = 180) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max - 3)}...` : text;
  }

  function analyzeSourceText(source, mode = productionState().mode) {
    const text = String(source || '').replace(/\r/g, '').trim();
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const excludedNames = new Set(['第一章', '第二章', '第三章', '第四章', '第五章', '与此同时', '第二天', '这时', '随后', '旁白', '场景', '镜头', '画面']);
    const names = new Set();
    const sceneHeadingPattern = /^(?:场景[一二三四五六七八九十百0-9]*|第[一二三四五六七八九十百0-9]+场|内景|外景|INT\.|EXT\.)\s*[：:.·-]*/i;
    const dialoguePattern = /^([\u4e00-\u9fa5]{2,6})\s*[：:]/;
    lines.forEach(line => {
      if (sceneHeadingPattern.test(line)) return;
      const match = line.match(dialoguePattern);
      if (match && !excludedNames.has(match[1]) && !/^(?:场景|内景|外景)/.test(match[1])) names.add(match[1]);
    });
    for (const match of text.matchAll(/(?:主角|主人公|名叫|叫做|饰演)\s*([\u4e00-\u9fa5]{2,5})/g)) {
      if (!excludedNames.has(match[1])) names.add(match[1]);
    }
    Object.values(characters).forEach(character => {
      if (character.name && text.includes(character.name)) names.add(character.name);
    });
    if (!names.size) Object.values(characters).slice(0, 2).forEach(character => names.add(character.name));

    const sceneNames = [];
    const scenePattern = /^(?:场景[一二三四五六七八九十百0-9]*|第[一二三四五六七八九十百0-9]+场|内景|外景|INT\.|EXT\.)\s*[：:.·-]*\s*(.+)$/i;
    lines.forEach(line => {
      const match = line.match(scenePattern);
      if (match) sceneNames.push(cleanText(match[1], 28));
    });
    for (const match of text.matchAll(/(?:来到|走进|回到|位于|抵达)([\u4e00-\u9fa5]{2,10}(?:室|厅|站|街|城|楼|家|店|院|学校|公司|仓库|码头|公寓|电台))/g)) {
      sceneNames.push(match[1]);
    }
    const uniqueScenes = [...new Set(sceneNames)].slice(0, 12);
    if (!uniqueScenes.length) uniqueScenes.push('核心故事场景');

    const dialogueCount = lines.filter(line => !sceneHeadingPattern.test(line) && dialoguePattern.test(line)).length;
    const titleMatch = text.match(/《([^》]{2,30})》/) || text.match(/^(?:标题|剧名)\s*[：:]\s*(.{2,30})$/m);
    const storyLine = lines.find(line => !/^《[^》]+》$/.test(line) && !sceneHeadingPattern.test(line) && !dialoguePattern.test(line));
    const firstSentence = storyLine || (text.match(/[^。！？!?\n]{8,160}[。！？!?]?/) || [cleanText(text, 150)])[0];
    const premise = cleanText(firstSentence || $('#briefInput')?.value || DEFAULT_SEASON_PREMISE, 260);
    const protagonist = [...names][0] || '主角';
    const style = mode === 'comic' ? 'AI 漫剧' : mode === 'realistic' ? 'AI 仿真人剧' : '竖屏短剧';
    return {
      title: cleanText(titleMatch?.[1] || `${protagonist}的故事`, 30),
      premise,
      protagonist,
      characters: [...names].slice(0, 12),
      scenes: uniqueScenes,
      dialogueCount,
      sourceLength: text.length,
      lineCount: lines.length,
      mode,
      style,
      episodeTarget: mode === 'single' ? 1 : 60,
      analyzedAt: new Date().toISOString()
    };
  }

  function createAdaptiveSeasonPlan(input) {
    const analysis = typeof input === 'string' ? analyzeSourceText(input) : input;
    const protagonist = analysis.protagonist || '主角';
    const premise = analysis.premise || DEFAULT_SEASON_PREMISE;
    const scene = analysis.scenes?.[0] || '核心场景';
    const modeRule = analysis.mode === 'comic'
      ? '保持角色线稿、配色、服装纹样和漫画分格方向一致。'
      : analysis.mode === 'realistic'
        ? '保持演员面部、发型、服装、光向和镜头焦段一致。'
        : '保持角色造型、场景方位、关键道具和光线方向一致。';
    const acts = [
      { title: '第一章 · 异常入场', range: 'EP01—12', summary: '用最短时间建立人物欲望、异常事件与必须继续追看的问题。', state: `${protagonist}从原有秩序被推入无法回避的困局。` },
      { title: '第二章 · 目标与结盟', range: 'EP13—24', summary: '建立阶段目标、关键关系和第一轮看似可信的答案。', state: `${protagonist}主动追查，并与最不该信任的人形成临时同盟。` },
      { title: '第三章 · 真相翻面', range: 'EP25—36', summary: '让证据、身份和关系同时反转，迫使主角重新选择立场。', state: `${protagonist}发现自己也是谜题的一部分，原有判断全面失效。` },
      { title: '第四章 · 代价倒计时', range: 'EP37—48', summary: '把外部危机变成不可逆的个人代价，持续压缩选择空间。', state: `${protagonist}必须公开承担代价，并失去最重要的保护层。` },
      { title: '第五章 · 终局重写', range: 'EP49—60', summary: '回收伏笔、完成核心选择，并为下一季留下新的问题。', state: `${protagonist}从被动承受者成为规则的改写者。` }
    ].map((act, index) => ({ id: index + 1, title: act.title, range: act.range, summary: act.summary, characterState: act.state }));
    const beatNames = ['异常信号', '拒绝相信', '证据出现', '第一次试探', '错误答案', '关系推进', '代价显形', '秘密交换', '行动失败', '立场反转', '逼近真相', '章末爆点'];
    const actions = ['撞见打破日常的异常', '试图维持原有秩序却付出代价', '拿到一条无法解释的证据', '以一个小行动验证自己的怀疑', '相信了最合理也最危险的解释', '与关键关系人交换条件', '发现每次推进都会失去某样东西', '用秘密换取继续行动的资格', '在目标近在眼前时遭遇失败', '发现盟友和敌人的位置发生互换', '把零散证据拼成新的因果链', '在答案揭晓前看见更大的问题'];
    let previousHook = `${protagonist}在${scene}发现第一条异常线索。`;
    const episodes = [];
    acts.forEach((act, actIndex) => {
      beatNames.forEach((beat, beatIndex) => {
        const number = actIndex * 12 + beatIndex + 1;
        const title = actIndex === 0 && beatIndex === 0 ? analysis.title : `${beat}${actIndex ? `·${actIndex + 1}` : ''}`;
        const hook = beatIndex === 11
          ? `${protagonist}确认此前的答案只是真相的一层，下一章的目标被彻底改写。`
          : `${protagonist}刚得到阶段答案，却出现一条与之冲突的新证据。`;
        episodes.push({
          id: `ep-${String(number).padStart(2, '0')}`,
          number,
          act: actIndex + 1,
          actTitle: act.title,
          title,
          story: `${protagonist}${actions[beatIndex]}。围绕「${cleanText(premise, 72)}」，本集完成一个明确行动，并在两分钟内形成一次信息增量。`,
          hook,
          previousHook,
          characterState: act.characterState,
          animationAnchor: `${modeRule} 本章主要空间为「${analysis.scenes?.[actIndex % analysis.scenes.length] || scene}」。`,
          handoff: `下一集直接承接「${hook}」，保留人物情绪、手持道具与最后一个镜头方向。`,
          duration: 120,
          status: 'outlined'
        });
        previousHook = hook;
      });
    });
    if (analysis.episodeTarget === 1) {
      const singleAct = { id: 1, title: '单集 · 完整叙事', range: 'EP01', summary: '在一集内完成建立、升级、反转和余味。', characterState: `${protagonist}在一次不可回避的选择中完成关键转变。` };
      const singleEpisode = {
        id: 'ep-01', number: 1, act: 1, actTitle: singleAct.title, title: analysis.title,
        story: `${protagonist}因「${cleanText(premise, 90)}」进入困局，在两分钟内完成目标、受阻、反转和代价四个节拍。`,
        hook: `${protagonist}完成本集选择，但最后一个画面揭示这并不是事件的全部。`,
        previousHook: `${protagonist}的日常被异常事件打破。`,
        characterState: singleAct.characterState,
        animationAnchor: `${modeRule} 主要空间为「${scene}」。`,
        handoff: '单集叙事已闭环；最后一个镜头可作为续集或传播切片的开放钩子。',
        duration: 120,
        status: 'outlined'
      };
      return {
        version: 2, premise, episodeCount: 1, episodeDurationMinutes: 2, totalMinutes: 2,
        continuityScore: Math.min(98, 92 + Math.min(analysis.characters?.length || 0, 3)),
        generatedAt: new Date().toISOString(), sourceAnalysis: analysis, acts: [singleAct], episodes: [singleEpisode]
      };
    }
    return {
      version: 2,
      premise,
      episodeCount: 60,
      episodeDurationMinutes: 2,
      totalMinutes: 120,
      continuityScore: Math.min(98, 90 + Math.min(analysis.characters?.length || 0, 4) + Math.min(analysis.scenes?.length || 0, 4)),
      generatedAt: new Date().toISOString(),
      sourceAnalysis: analysis,
      acts,
      episodes
    };
  }

  function assetFingerprint(asset) {
    return hashString(JSON.stringify({ name: asset.name, description: asset.description, sourceId: asset.sourceId, previewUrl: asset.previewUrl, tags: asset.tags }));
  }

  function upsertAsset(input, options = {}) {
    const state = productionState();
    const now = new Date().toISOString();
    const next = {
      id: input.id || makeId(input.type || 'asset', input.sourceId || input.name),
      type: input.type || 'storyboard',
      name: input.name || '未命名素材',
      description: input.description || '',
      status: input.status || 'draft',
      locked: Boolean(input.locked),
      version: Number(input.version) || 1,
      origin: input.origin || 'manual',
      sourceId: String(input.sourceId || ''),
      tags: Array.isArray(input.tags) ? input.tags : [],
      usedBy: Array.isArray(input.usedBy) ? input.usedBy : [],
      previewUrl: input.previewUrl || '',
      previewClass: input.previewClass || input.type || 'storyboard',
      reviewStatus: input.reviewStatus || 'pending',
      createdAt: input.createdAt || now,
      updatedAt: now
    };
    next.fingerprint = assetFingerprint(next);
    const existingIndex = state.assets.findIndex(asset => asset.id === next.id);
    if (existingIndex >= 0) {
      const previous = state.assets[existingIndex];
      const changed = previous.fingerprint && previous.fingerprint !== next.fingerprint;
      const versionedChange = changed && previous.locked && options.preserveLock !== false;
      const history = Array.isArray(previous.history) ? [...previous.history] : [];
      if (versionedChange) {
        history.unshift({
          version: previous.version,
          name: previous.name,
          description: previous.description,
          fingerprint: previous.fingerprint,
          lockedAt: previous.updatedAt
        });
      }
      state.assets[existingIndex] = {
        ...previous,
        ...next,
        locked: options.preserveLock === false ? next.locked : versionedChange ? false : Boolean(previous.locked),
        status: options.preserveLock === false ? next.status : versionedChange ? next.status : previous.locked ? 'locked' : next.status,
        version: versionedChange ? (Number(previous.version) || 1) + 1 : Number(previous.version) || 1,
        history: history.slice(0, 12),
        createdAt: previous.createdAt || next.createdAt
      };
      if (versionedChange) invalidateDownstream(state.assets[existingIndex]);
      return state.assets[existingIndex];
    }
    state.assets.unshift(next);
    state.assets = state.assets.slice(0, 100);
    return next;
  }

  function characterAsset(id, character) {
    return {
      id: `character-${id}`,
      type: 'character',
      name: character.name,
      description: `${character.role}；视觉锚点：${character.anchor}`,
      status: character.draft ? 'draft' : 'ready',
      locked: !character.draft,
      origin: '角色圣经',
      sourceId: id,
      tags: [character.look, character.tone, character.voice].filter(Boolean),
      usedBy: Object.keys(shots).map(key => `镜头 ${shots[key].id}`),
      previewUrl: character.image || '',
      previewClass: 'character'
    };
  }

  function shotAsset(id, shot) {
    return {
      id: `storyboard-${id}`,
      type: 'storyboard',
      name: `镜头 ${shot.id} · ${shot.title}`,
      description: shot.prompt,
      status: 'ready',
      origin: 'AI 分镜台',
      sourceId: String(id),
      tags: [shot.size, shot.movement, shot.emotion].filter(Boolean),
      usedBy: [`EP${String(selectedSeasonEpisode || 1).padStart(2, '0')}`, '视频生成队列'],
      previewClass: 'storyboard'
    };
  }

  function syncCoreAssets({ render = true } = {}) {
    Object.entries(characters).forEach(([id, character]) => {
      upsertAsset(characterAsset(id, character));
      upsertAsset({
        id: `audio-${id}`,
        type: 'audio',
        name: `${character.name} · 角色声线`,
        description: character.voice || '待选择授权音色',
        status: character.voice?.includes('待') ? 'draft' : 'ready',
        origin: '角色圣经',
        sourceId: id,
        tags: [character.voice, character.tone].filter(Boolean),
        usedBy: ['台词轨', '分镜预演'],
        previewClass: 'audio'
      });
    });
    const rules = projectMetadata.worldRules || { time: $('#worldTime')?.textContent, palette: $('#worldPalette')?.textContent, constraints: $('#worldConstraints')?.textContent };
    upsertAsset({
      id: 'scene-world-main', type: 'scene', name: '主世界 · 核心场景规则',
      description: [rules.time, rules.palette, rules.constraints].filter(Boolean).join('；'), status: 'locked', locked: true,
      origin: '世界圣经', sourceId: 'world-main', tags: [rules.time, rules.palette].filter(Boolean), usedBy: Object.keys(shots).map(key => `镜头 ${shots[key].id}`), previewClass: 'scene'
    });
    Object.entries(shots).forEach(([id, shot]) => upsertAsset(shotAsset(id, shot)));
    const preview = projectMetadata.preview || {};
    if (preview.taskId || preview.videoUrl || preview.mode === 'animatic') syncVideoAsset(preview, { render: false });
    if (render) renderAssets();
    return productionState().assets;
  }

  function nodeId(type, sourceId) {
    return `${type}-${String(sourceId).replace(/[^A-Za-z0-9_-]/g, '-')}`;
  }

  function addCanvasNode(input, options = {}) {
    const canvas = productionState().canvas;
    const id = input.id || nodeId(input.type, input.sourceId || Date.now());
    const existing = canvas.nodes.find(node => node.id === id);
    if (existing) {
      Object.assign(existing, input, { id, x: existing.x, y: existing.y });
      return existing;
    }
    const count = canvas.nodes.length;
    const node = {
      id,
      type: input.type || 'story',
      title: input.title || '未命名节点',
      summary: input.summary || '',
      sourceId: String(input.sourceId || ''),
      status: input.status || 'draft',
      assetIds: Array.isArray(input.assetIds) ? input.assetIds : [],
      x: Number.isFinite(Number(input.x)) ? Number(input.x) : 42 + (count % 4) * 245,
      y: Number.isFinite(Number(input.y)) ? Number(input.y) : 38 + Math.floor(count / 4) * 126
    };
    canvas.nodes.push(node);
    if (options.render !== false) renderCanvas();
    return node;
  }

  function seedCanvas() {
    const canvas = productionState().canvas;
    if (canvas.seeded) return;
    canvas.nodes = [];
    addCanvasNode({ id: 'story-season', type: 'story', title: '全季故事引擎', summary: cleanText($('#briefInput')?.value, 76), sourceId: 'season', status: 'ready', assetIds: [] }, { render: false });
    Object.entries(characters).forEach(([id, character], index) => addCanvasNode({ id: nodeId('character', id), type: 'character', title: character.name, summary: character.role, sourceId: id, status: character.draft ? 'draft' : 'locked', assetIds: [`character-${id}`, `audio-${id}`], x: 290, y: 38 + index * 112 }, { render: false }));
    addCanvasNode({ id: 'scene-world-main', type: 'scene', title: '主世界视觉规则', summary: $('#worldTime')?.textContent || '核心故事场景', sourceId: 'world-main', status: 'locked', assetIds: ['scene-world-main'], x: 290, y: 310 }, { render: false });
    Object.entries(shots).slice(0, 4).forEach(([id, shot], index) => addCanvasNode({ id: nodeId('shot', id), type: 'shot', title: `镜头 ${shot.id} · ${shot.title}`, summary: shot.prompt, sourceId: id, status: 'ready', assetIds: [`storyboard-${id}`], x: 570 + (index % 2) * 230, y: 38 + Math.floor(index / 2) * 130 }, { render: false }));
    addCanvasNode({ id: 'audio-master', type: 'audio', title: '声音制作轨', summary: '角色声线、台词、环境与配乐', sourceId: selectedCharacter, status: 'ready', assetIds: Object.keys(characters).map(id => `audio-${id}`), x: 570, y: 330 }, { render: false });
    canvas.seeded = true;
  }

  function canvasNodeById(id) { return productionState().canvas.nodes.find(node => node.id === id); }
  function selectedCanvasNode() { return canvasNodeById(runtime.selectedNodeId); }
  function assetById(id) { return productionState().assets.find(asset => asset.id === id); }
  function selectedAsset() { return assetById(runtime.selectedAssetId); }

  function renderCanvas() {
    const canvas = productionState().canvas;
    const container = $('#canvasNodes');
    const board = $('#canvasBoard');
    if (!container || !board) return;
    board.style.transform = `scale(${canvas.zoom})`;
    setText('#canvasZoomValue', `${Math.round(canvas.zoom * 100)}%`);
    container.replaceChildren();
    canvas.nodes.forEach(node => {
      const button = document.createElement('button');
      button.className = `canvas-node${node.id === runtime.selectedNodeId ? ' selected' : ''}`;
      button.dataset.nodeId = node.id;
      button.dataset.type = node.type;
      button.style.left = `${node.x}px`;
      button.style.top = `${node.y}px`;
      const icon = document.createElement('span');
      icon.className = 'canvas-node-icon';
      icon.textContent = TYPE_ICONS[node.type] || '资';
      const copy = document.createElement('span');
      copy.className = 'canvas-node-copy';
      const title = document.createElement('b');
      title.textContent = node.title;
      const summary = document.createElement('small');
      summary.textContent = node.summary || '待补充节点说明';
      copy.append(title, summary);
      const status = document.createElement('span');
      status.className = 'canvas-node-status';
      const stateText = document.createElement('span');
      const dot = document.createElement('i');
      dot.className = node.status;
      stateText.append(dot, document.createTextNode(statusLabel(node.status)));
      const assetText = document.createElement('span');
      assetText.textContent = `${node.assetIds.length} assets`;
      status.append(stateText, assetText);
      button.append(icon, copy, status);
      button.addEventListener('click', () => selectCanvasNode(node.id));
      button.addEventListener('pointerdown', event => startNodeDrag(event, node, button));
      button.addEventListener('pointermove', event => moveNodeDrag(event, node, button));
      button.addEventListener('pointerup', event => endNodeDrag(event, node, button));
      button.addEventListener('pointercancel', event => endNodeDrag(event, node, button));
      container.append(button);
    });
    $('#canvasEmpty')?.toggleAttribute('hidden', canvas.nodes.length > 0);
    drawCanvasLinks();
    renderCanvasInspector();
  }

  function statusLabel(status) {
    return { ready: '可生产', locked: '已锁定', draft: '待补充', stale: '需重生成', generating: '生成中', failed: '失败', archived: '已归档' }[status] || status || '待补充';
  }

  function drawCanvasLinks() {
    const svg = $('#canvasLinks');
    if (!svg) return;
    svg.replaceChildren();
    const nodes = productionState().canvas.nodes;
    const story = nodes.find(node => node.type === 'story');
    const scene = nodes.find(node => node.type === 'scene');
    const audio = nodes.find(node => node.type === 'audio');
    const links = [];
    nodes.filter(node => ['character', 'scene'].includes(node.type)).forEach(node => { if (story) links.push([story, node]); });
    nodes.filter(node => node.type === 'shot').forEach((node, index) => {
      const characterNodes = nodes.filter(item => item.type === 'character');
      if (characterNodes.length) links.push([characterNodes[index % characterNodes.length], node]);
      if (scene) links.push([scene, node]);
      if (audio) links.push([audio, node]);
    });
    links.forEach(([from, to]) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const startX = from.x + 190;
      const startY = from.y + 37;
      const endX = to.x;
      const endY = to.y + 37;
      const middle = Math.max(35, Math.abs(endX - startX) * .45);
      path.setAttribute('d', `M ${startX} ${startY} C ${startX + middle} ${startY}, ${endX - middle} ${endY}, ${endX} ${endY}`);
      path.setAttribute('class', `canvas-link${runtime.selectedNodeId && [from.id, to.id].includes(runtime.selectedNodeId) ? ' active' : ''}`);
      svg.append(path);
    });
  }

  function startNodeDrag(event, node, element) {
    if (event.button !== 0) return;
    runtime.drag = { id: node.id, startX: event.clientX, startY: event.clientY, nodeX: node.x, nodeY: node.y, moved: false };
    element.setPointerCapture?.(event.pointerId);
  }

  function moveNodeDrag(event, node, element) {
    if (!runtime.drag || runtime.drag.id !== node.id) return;
    const zoom = productionState().canvas.zoom;
    const dx = (event.clientX - runtime.drag.startX) / zoom;
    const dy = (event.clientY - runtime.drag.startY) / zoom;
    if (Math.abs(dx) + Math.abs(dy) > 3) runtime.drag.moved = true;
    node.x = Math.max(8, Math.min(890, runtime.drag.nodeX + dx));
    node.y = Math.max(8, Math.min(590, runtime.drag.nodeY + dy));
    element.style.left = `${node.x}px`;
    element.style.top = `${node.y}px`;
    drawCanvasLinks();
  }

  function endNodeDrag(event, node, element) {
    if (!runtime.drag || runtime.drag.id !== node.id) return;
    element.releasePointerCapture?.(event.pointerId);
    const moved = runtime.drag.moved;
    runtime.drag = null;
    if (moved) scheduleProjectSave();
  }

  function selectCanvasNode(id) {
    runtime.selectedNodeId = id;
    $$('.canvas-node').forEach(node => node.classList.toggle('selected', node.dataset.nodeId === id));
    drawCanvasLinks();
    renderCanvasInspector();
  }

  function renderCanvasInspector() {
    const node = selectedCanvasNode();
    const controls = ['#locateCanvasSource', '#materializeCanvasNode', '#deleteCanvasNode'];
    controls.forEach(selector => { if ($(selector)) $(selector).disabled = !node; });
    if (!node) {
      setText('#canvasNodeType', 'NODE INSPECTOR');
      setText('#canvasNodeTitle', '选择一个节点');
      setText('#canvasNodeSummary', '查看它引用的角色、场景、分镜和素材版本。');
      setText('#canvasNodeStatus', '—'); setText('#canvasNodeSource', '—'); setText('#canvasNodeAssets', '0');
      return;
    }
    setText('#canvasNodeType', `${TYPE_LABELS[node.type] || '生产'} NODE`);
    setText('#canvasNodeTitle', node.title);
    setText('#canvasNodeSummary', node.summary || '暂无节点说明。');
    setText('#canvasNodeStatus', statusLabel(node.status));
    setText('#canvasNodeSource', node.sourceId || '手动节点');
    setText('#canvasNodeAssets', String(node.assetIds.length));
  }

  function arrangeCanvas() {
    const columns = { story: 30, character: 245, scene: 460, shot: 675, audio: 890 };
    const rows = {};
    productionState().canvas.nodes.forEach(node => {
      const row = rows[node.type] || 0;
      node.x = columns[node.type] ?? 40;
      node.y = 38 + row * 112;
      rows[node.type] = row + 1;
    });
    renderCanvas();
    scheduleProjectSave();
    notify('画布已按故事、角色、场景、分镜和声音依赖重新排布。');
  }

  function setCanvasZoom(value) {
    productionState().canvas.zoom = Math.max(.55, Math.min(1.5, Number(value) || 1));
    renderCanvas();
    scheduleProjectSave();
  }

  function fitCanvas() {
    const viewport = $('#canvasViewport');
    if (!viewport) return;
    const fit = Math.max(.55, Math.min(1, (viewport.clientWidth - 24) / 1100));
    setCanvasZoom(fit);
    viewport.scrollTo?.({ left: 0, top: 0, behavior: 'smooth' });
  }

  function locateCanvasSource() {
    const node = selectedCanvasNode();
    if (!node) return;
    if (node.type === 'character' && characters[node.sourceId]) selectCharacter(node.sourceId, true);
    if (node.type === 'shot' && shots[node.sourceId]) selectShot(node.sourceId);
    const target = $(SOURCE_TARGETS[node.type] || '#dashboard');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notify(`已定位到「${node.title}」的源数据。`);
  }

  function materializeCanvasNode() {
    const node = selectedCanvasNode();
    if (!node) return;
    let asset;
    if (node.type === 'character' && characters[node.sourceId]) asset = upsertAsset(characterAsset(node.sourceId, characters[node.sourceId]));
    else if (node.type === 'shot' && shots[node.sourceId]) asset = upsertAsset(shotAsset(node.sourceId, shots[node.sourceId]));
    else if (node.type === 'scene') asset = assetById('scene-world-main') || syncCoreAssets({ render: false }).find(item => item.id === 'scene-world-main');
    else if (node.type === 'audio') asset = upsertAsset({ id: `audio-track-${node.id}`, type: 'audio', name: node.title, description: node.summary, status: 'ready', origin: '创作画布', sourceId: node.id, usedBy: ['声音制作轨'], previewClass: 'audio' });
    else asset = upsertAsset({ id: `storyboard-${node.id}`, type: 'storyboard', name: node.title, description: node.summary, status: 'ready', origin: '创作画布', sourceId: node.id, usedBy: ['全季故事总控'], previewClass: 'storyboard' });
    if (asset && !node.assetIds.includes(asset.id)) node.assetIds.push(asset.id);
    node.status = asset?.locked ? 'locked' : 'ready';
    renderCanvas(); renderAssets(); scheduleProjectSave();
    notify(`「${node.title}」已同步为素材版本 v${asset?.version || 1}。`);
  }

  function deleteCanvasNode() {
    const node = selectedCanvasNode();
    if (!node) return;
    productionState().canvas.nodes = productionState().canvas.nodes.filter(item => item.id !== node.id);
    runtime.selectedNodeId = null;
    renderCanvas(); scheduleProjectSave();
    notify('节点已从画布移除，源数据与素材版本仍然保留。');
  }

  function filteredAssets() {
    const query = runtime.assetQuery.trim().toLowerCase();
    return productionState().assets.filter(asset => {
      if (runtime.assetFilter !== 'all' && asset.type !== runtime.assetFilter) return false;
      if (!query) return true;
      return [asset.name, asset.description, asset.origin, ...(asset.tags || [])].join(' ').toLowerCase().includes(query);
    });
  }

  function appendAssetPreview(container, asset) {
    container.className = `${container.className.split(' ')[0]} ${asset.previewClass || asset.type}`;
    if (asset.previewUrl) {
      const image = document.createElement('img');
      image.src = asset.previewUrl;
      image.alt = `${asset.name} 预览`;
      container.append(image);
    } else {
      const label = document.createElement('span');
      label.textContent = (TYPE_LABELS[asset.type] || '素材').toUpperCase();
      container.append(label);
    }
  }

  function renderAssets() {
    const grid = $('#assetGrid');
    if (!grid) return;
    const assets = filteredAssets();
    grid.replaceChildren();
    if (!assets.length) {
      const empty = document.createElement('div');
      empty.className = 'asset-empty';
      empty.textContent = '当前筛选下没有素材。';
      grid.append(empty);
    }
    assets.forEach(asset => {
      const card = document.createElement('button');
      card.className = `asset-card${asset.id === runtime.selectedAssetId ? ' selected' : ''}`;
      card.dataset.assetId = asset.id;
      const preview = document.createElement('span');
      preview.className = 'asset-card-preview';
      appendAssetPreview(preview, asset);
      const badge = document.createElement('em');
      badge.textContent = TYPE_LABELS[asset.type] || asset.type;
      preview.append(badge);
      const copy = document.createElement('span');
      copy.className = 'asset-card-copy';
      const title = document.createElement('b'); title.textContent = asset.name;
      const origin = document.createElement('small'); origin.textContent = asset.origin;
      const meta = document.createElement('span'); meta.className = 'asset-card-meta';
      const state = document.createElement('span'); const dot = document.createElement('i'); dot.className = asset.locked ? 'locked' : asset.status; state.append(dot, document.createTextNode(statusLabel(asset.locked ? 'locked' : asset.status)));
      const version = document.createElement('span'); version.textContent = `v${asset.version}`;
      meta.append(state, version); copy.append(title, origin, meta); card.append(preview, copy);
      card.addEventListener('click', () => selectAsset(asset.id));
      grid.append(card);
    });
    setText('#assetCount', `${assets.length} / ${productionState().assets.length} 项素材`);
    setText('#assetNavCount', String(productionState().assets.length).padStart(2, '0'));
    renderAssetInspector();
  }

  function selectAsset(id) {
    runtime.selectedAssetId = id;
    $$('.asset-card').forEach(card => card.classList.toggle('selected', card.dataset.assetId === id));
    renderAssetInspector();
  }

  function renderAssetInspector() {
    const asset = selectedAsset();
    const preview = $('#assetInspectorPreview');
    if (preview) { preview.replaceChildren(); preview.className = 'asset-inspector-preview'; }
    ['#toggleAssetLock', '#addAssetToCanvas', '#deleteAsset'].forEach(selector => { if ($(selector)) $(selector).disabled = !asset; });
    if (!asset) {
      if (preview) { const label = document.createElement('span'); label.textContent = 'ASSET'; preview.append(label); }
      setText('#assetInspectorType', 'SELECT AN ASSET'); setText('#assetInspectorTitle', '选择素材查看详情'); setText('#assetInspectorDescription', '素材会记录来源、版本、锁定状态与下游使用位置。');
      setText('#assetInspectorVersion', '—'); setText('#assetInspectorStatus', '—'); setText('#assetInspectorOrigin', '—'); setText('#assetInspectorUsage', '—');
      return;
    }
    if (preview) appendAssetPreview(preview, asset);
    setText('#assetInspectorType', `${TYPE_LABELS[asset.type] || asset.type} ASSET`);
    setText('#assetInspectorTitle', asset.name);
    setText('#assetInspectorDescription', asset.description || '暂无素材说明。');
    setText('#assetInspectorVersion', `v${asset.version}`);
    setText('#assetInspectorStatus', statusLabel(asset.locked ? 'locked' : asset.status));
    setText('#assetInspectorOrigin', asset.origin);
    setText('#assetInspectorUsage', asset.usedBy?.join(' / ') || '尚未引用');
    setText('#toggleAssetLock', asset.locked ? '解锁并创建新版本' : '锁定当前版本');
  }

  function toggleAssetLock() {
    const asset = selectedAsset();
    if (!asset) return;
    const wasLocked = asset.locked;
    if (wasLocked) {
      asset.history = Array.isArray(asset.history) ? asset.history : [];
      asset.history.unshift({ version: asset.version, name: asset.name, description: asset.description, fingerprint: asset.fingerprint, lockedAt: asset.updatedAt });
      asset.history = asset.history.slice(0, 12);
    }
    asset.locked = !wasLocked;
    asset.status = asset.locked ? 'locked' : 'ready';
    if (wasLocked) asset.version += 1;
    asset.updatedAt = new Date().toISOString();
    if (wasLocked) invalidateDownstream(asset);
    productionState().canvas.nodes.forEach(node => {
      if (node.assetIds.includes(asset.id)) node.status = asset.locked ? 'locked' : 'ready';
    });
    renderAssets(); renderCanvas(); scheduleProjectSave();
    notify(asset.locked ? `已锁定「${asset.name}」v${asset.version}，下游任务将固定引用此版本。` : `已为「${asset.name}」创建可编辑版本 v${asset.version}。`);
  }

  function invalidateDownstream(sourceAsset) {
    const assets = productionState().assets;
    const affectsAllShots = ['character', 'scene', 'audio'].includes(sourceAsset.type);
    assets.forEach(asset => {
      const sameShot = String(asset.sourceId) === String(sourceAsset.sourceId);
      if (asset.type === 'video' && (affectsAllShots || sameShot)) {
        asset.locked = false;
        asset.status = 'stale';
        asset.reviewStatus = 'needs-regeneration';
      }
      if (asset.type === 'storyboard' && affectsAllShots) {
        asset.locked = false;
        asset.status = 'stale';
        asset.reviewStatus = 'needs-regeneration';
      }
    });
    projectMetadata.reviewPassed = false;
    if (typeof renderQualityState === 'function') renderQualityState();
  }

  function buildShotGenerationContext(shotId, basePrompt = '') {
    const id = String(shotId);
    const assets = productionState().assets;
    const storyboard = assetById(`storyboard-${id}`);
    const lockedCharacters = assets.filter(asset => asset.type === 'character' && asset.locked);
    const lockedScenes = assets.filter(asset => asset.type === 'scene' && asset.locked);
    const references = [storyboard, ...lockedCharacters, ...lockedScenes].filter(Boolean);
    const constraints = references.map(asset => `${TYPE_LABELS[asset.type] || asset.type}「${asset.name}」v${asset.version}：${cleanText(asset.description, 140)}`);
    const prompt = cleanText([
      basePrompt,
      constraints.length ? `必须继承以下已锁定项目资产：${constraints.join('；')}` : '',
      '保持角色身份、服装、场景方位、光线方向和关键道具连续，不得擅自改写已锁定设定。'
    ].filter(Boolean).join('。'), 1450);
    return { prompt, assetIds: references.map(asset => asset.id), assetVersions: references.map(asset => ({ id: asset.id, version: asset.version })) };
  }

  function addAssetToCanvas() {
    const asset = selectedAsset();
    if (!asset) return;
    const type = asset.type === 'storyboard' || asset.type === 'video' ? 'shot' : asset.type === 'audio' ? 'audio' : asset.type;
    const node = addCanvasNode({
      id: `asset-node-${asset.id}`,
      type: TYPE_ICONS[type] ? type : 'story',
      title: asset.name,
      summary: asset.description,
      sourceId: asset.sourceId || asset.id,
      status: asset.locked ? 'locked' : asset.status,
      assetIds: [asset.id]
    });
    runtime.selectedNodeId = node.id;
    renderCanvas(); scheduleProjectSave();
    $('#canvas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notify(`「${asset.name}」已放入创作画布。`);
  }

  function deleteAsset() {
    const asset = selectedAsset();
    if (!asset) return;
    productionState().assets = productionState().assets.filter(item => item.id !== asset.id);
    productionState().canvas.nodes.forEach(node => { node.assetIds = node.assetIds.filter(id => id !== asset.id); });
    runtime.selectedAssetId = null;
    renderAssets(); renderCanvas(); scheduleProjectSave();
    notify('素材已从当前项目库删除；重新同步生产资产可以恢复源数据生成的素材。');
  }

  function uploadAsset(file) {
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'scene' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'storyboard';
    const complete = previewUrl => {
      const asset = upsertAsset({
        id: makeId('upload', `${file.name}-${file.lastModified}`), type, name: file.name,
        description: `用户导入 · ${(file.size / 1024).toFixed(1)} KB`, status: 'ready', origin: '用户上传', sourceId: file.name,
        tags: [file.type || 'unknown'], usedBy: [], previewUrl, previewClass: type
      });
      runtime.selectedAssetId = asset.id;
      renderAssets(); scheduleProjectSave();
      notify(`「${file.name}」已进入项目素材库。`);
    };
    const embeddedSize = productionState().assets.reduce((total, asset) => total + (asset.previewUrl?.startsWith('data:') ? asset.previewUrl.length : 0), 0);
    if (file.type.startsWith('image/') && file.size <= 35_000 && embeddedSize < 50_000) {
      const reader = new FileReader();
      reader.addEventListener('load', () => complete(String(reader.result || '')));
      reader.addEventListener('error', () => complete(''));
      reader.readAsDataURL(file);
    } else complete('');
  }

  function addDetectedCharacters(analysis) {
    analysis.characters.forEach(name => {
      const existing = Object.entries(characters).find(([, character]) => character.name === name);
      if (existing) return;
      const id = makeId('source', name);
      characters[id] = {
        code: `C-${String(Object.keys(characters).length + 1).padStart(2, '0')}`,
        name, en: 'SOURCE CHARACTER', role: '从原稿识别的角色 · 待确认故事职责', image: './assets/character-shen-qingyan.png',
        alt: `${name} 的角色概念草案`, tone: '待分析 / 待确认', voice: '待选择 · 需授权', anchor: '待从原稿锁定视觉记忆点', look: '概念造型', draft: true
      };
    });
    renderCharacterRail();
  }

  function addAnalysisNodes(analysis) {
    addCanvasNode({ id: 'story-season', type: 'story', title: analysis.title, summary: analysis.premise, sourceId: 'season', status: 'ready', assetIds: [] }, { render: false });
    Object.entries(characters).forEach(([id, character]) => addCanvasNode({ id: nodeId('character', id), type: 'character', title: character.name, summary: character.role, sourceId: id, status: character.draft ? 'draft' : 'locked', assetIds: [`character-${id}`, `audio-${id}`] }, { render: false }));
    analysis.scenes.forEach((sceneName, index) => {
      const assetId = `scene-source-${hashString(sceneName)}`;
      upsertAsset({ id: assetId, type: 'scene', name: sceneName, description: `从原稿识别的场景线索 · ${analysis.style}`, status: 'draft', origin: '原稿解析', sourceId: sceneName, tags: [analysis.style], usedBy: [], previewClass: 'scene' });
      addCanvasNode({ id: nodeId('scene', hashString(sceneName)), type: 'scene', title: sceneName, summary: '从原稿识别，待补充空间、光线和禁用元素', sourceId: sceneName, status: 'draft', assetIds: [assetId], x: 290, y: 310 + index * 112 }, { render: false });
    });
    arrangeCanvas();
  }

  function analyzeAndBuildProduction() {
    const source = $('#sourceMaterial')?.value.trim() || $('#briefInput')?.value.trim();
    if (!source) return notify('请先粘贴原稿或填写创作指令。');
    const state = productionState();
    const analysis = analyzeSourceText(source, state.mode);
    state.source.text = source.slice(0, 40_000);
    state.source.analysis = analysis;
    $('#briefInput').value = analysis.premise;
    addDetectedCharacters(analysis);
    projectMetadata.seasonPlan = createAdaptiveSeasonPlan(analysis);
    selectedSeasonEpisode = 1;
    seasonFilter = 'all';
    renderSeasonPlan();
    syncCoreAssets({ render: false });
    seedCanvas();
    addAnalysisNodes(analysis);
    renderAssets(); renderAnalysis();
    addFeed('制作编排器', `已从原稿识别 ${analysis.characters.length} 个人物、${analysis.scenes.length} 个场景，并建立 60 集依赖图。`, 'purple');
    scheduleProjectSave();
    notify('原稿已转为生产工程：故事总控、画布节点和素材引用已经联动。');
  }

  function renderAnalysis() {
    const state = productionState();
    const analysis = state.source.analysis;
    if ($('#sourceMaterial') && document.activeElement !== $('#sourceMaterial')) $('#sourceMaterial').value = state.source.text || '';
    setText('#sourceFileName', state.source.fileName || 'TXT / MD');
    $$('[data-production-mode]').forEach(button => button.classList.toggle('active', button.dataset.productionMode === state.mode));
    const metrics = $$('#analysisMetrics > div b');
    const values = analysis ? [analysis.characters.length, analysis.scenes.length, analysis.dialogueCount, '工程已建立'] : [0, 0, 0, '未解析'];
    metrics.forEach((node, index) => { node.textContent = String(values[index]); });
    setText('#sourceAnalysisSummary', analysis
      ? `《${analysis.title}》· ${analysis.style} · ${analysis.sourceLength} 字。人物、场景与分镜将按版本引用。`
      : '等待原稿。解析后会建立人物、场景、分镜和素材引用。');
  }

  function syncCharacterAsset(id, { render = true } = {}) {
    const character = characters[id];
    if (!character) return null;
    const asset = upsertAsset(characterAsset(id, character));
    const node = addCanvasNode({ id: nodeId('character', id), type: 'character', title: character.name, summary: character.role, sourceId: id, status: character.draft ? 'draft' : asset.locked ? 'locked' : 'ready', assetIds: [asset.id, `audio-${id}`] }, { render: false });
    if (render) { renderAssets(); renderCanvas(); }
    return node;
  }

  function syncShotAsset(id, { render = true } = {}) {
    const shot = shots[id];
    if (!shot) return null;
    const asset = upsertAsset(shotAsset(id, shot));
    const node = addCanvasNode({ id: nodeId('shot', id), type: 'shot', title: `镜头 ${shot.id} · ${shot.title}`, summary: shot.prompt, sourceId: String(id), status: asset.locked ? 'locked' : 'ready', assetIds: [asset.id] }, { render: false });
    if (render) { renderAssets(); renderCanvas(); }
    return node;
  }

  function archiveShot(id) {
    const asset = assetById(`storyboard-${id}`);
    if (asset) { asset.status = 'archived'; asset.locked = false; asset.updatedAt = new Date().toISOString(); }
    productionState().canvas.nodes = productionState().canvas.nodes.filter(node => node.id !== nodeId('shot', id));
    renderAssets(); renderCanvas(); scheduleProjectSave();
  }

  function syncWorldAsset() {
    syncCoreAssets({ render: false });
    const asset = assetById('scene-world-main');
    const node = productionState().canvas.nodes.find(item => item.id === 'scene-world-main');
    if (node && asset) { node.summary = asset.description; node.assetIds = [asset.id]; node.status = 'locked'; }
    renderAssets(); renderCanvas();
  }

  function syncVideoAsset(preview = projectMetadata.preview || {}, { render = true } = {}) {
    const shotId = String(preview.shotId || selectedShot || 'unknown').replace(/^0+/, '') || '0';
    const status = preview.videoUrl ? 'ready' : preview.mode === 'seedance' || preview.taskId ? 'generating' : preview.mode === 'animatic' ? 'ready' : 'draft';
    const asset = upsertAsset({
      id: `video-${shotId}`,
      type: 'video',
      name: `${shots[shotId]?.title || `镜头 ${shotId}`} · ${preview.videoUrl ? '成片' : preview.mode === 'animatic' ? '动态预演' : '生成任务'}`,
      description: preview.status || '视频生成任务',
      status,
      origin: preview.videoUrl ? 'Seedance' : preview.mode === 'animatic' ? '动态分镜预演' : 'Seedance 队列',
      sourceId: shotId,
      tags: [preview.taskId, preview.mode, ...(preview.referenceAssetIds || [])].filter(Boolean),
      usedBy: ['样片与审片', `镜头 ${shots[shotId]?.id || shotId}`],
      previewUrl: '',
      previewClass: 'video',
      reviewStatus: projectMetadata.reviewPassed ? 'passed' : 'pending',
      locked: Boolean(projectMetadata.reviewPassed && status === 'ready')
    }, { preserveLock: false });
    const node = productionState().canvas.nodes.find(item => item.id === nodeId('shot', shotId));
    if (node && !node.assetIds.includes(asset.id)) node.assetIds.push(asset.id);
    if (render) { renderAssets(); renderCanvas(); }
    return asset;
  }

  function syncReviewState() {
    productionState().assets.filter(asset => ['video', 'storyboard'].includes(asset.type)).forEach(asset => {
      asset.reviewStatus = projectMetadata.reviewPassed ? 'passed' : 'pending';
      if (projectMetadata.reviewPassed && asset.type === 'video' && asset.status === 'ready') { asset.locked = true; asset.status = 'locked'; }
    });
    renderAssets(); renderCanvas(); scheduleProjectSave();
  }

  function hydrate() {
    productionState();
    syncCoreAssets({ render: false });
    seedCanvas();
    renderAnalysis(); renderCanvas(); renderAssets();
  }

  function init() {
    if (runtime.initialized) return hydrate();
    runtime.initialized = true;
    $('#sourceMaterial')?.addEventListener('input', event => {
      productionState().source.text = event.currentTarget.value.slice(0, 40_000);
      scheduleProjectSave();
    });
    $('#sourceFile')?.addEventListener('change', async event => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      productionState().source.fileName = file.name;
      try {
        const text = (await file.text()).slice(0, 40_000);
        productionState().source.text = text;
        $('#sourceMaterial').value = text;
        renderAnalysis(); scheduleProjectSave();
        notify(`已导入 ${file.name}，可以开始结构化解析。`);
      } catch { notify('原稿读取失败，请重新选择 TXT/Markdown 文件。'); }
    });
    $$('[data-production-mode]').forEach(button => button.addEventListener('click', () => {
      productionState().mode = button.dataset.productionMode;
      renderAnalysis(); scheduleProjectSave();
    }));
    $('#analyzeSource')?.addEventListener('click', analyzeAndBuildProduction);
    $$('[data-add-node]').forEach(button => button.addEventListener('click', () => {
      const type = button.dataset.addNode;
      if (type === 'character') return openCharacterModal();
      if (type === 'scene') return openWorldModal();
      if (type === 'shot') syncShotAsset(selectedShot);
      else addCanvasNode({ type, title: type === 'story' ? '新故事节点' : '新声音节点', summary: '待补充生产约束', sourceId: `manual-${Date.now()}`, status: 'draft', assetIds: [] });
      scheduleProjectSave();
    }));
    $('#arrangeCanvas')?.addEventListener('click', arrangeCanvas);
    $('#canvasZoomOut')?.addEventListener('click', () => setCanvasZoom(productionState().canvas.zoom - .1));
    $('#canvasZoomIn')?.addEventListener('click', () => setCanvasZoom(productionState().canvas.zoom + .1));
    $('#fitCanvas')?.addEventListener('click', fitCanvas);
    $('#locateCanvasSource')?.addEventListener('click', locateCanvasSource);
    $('#materializeCanvasNode')?.addEventListener('click', materializeCanvasNode);
    $('#deleteCanvasNode')?.addEventListener('click', deleteCanvasNode);
    $$('#assetFilters button').forEach(button => button.addEventListener('click', () => {
      runtime.assetFilter = button.dataset.assetFilter;
      $$('#assetFilters button').forEach(item => item.classList.toggle('active', item === button));
      renderAssets();
    }));
    $('#assetSearch')?.addEventListener('input', event => { runtime.assetQuery = event.currentTarget.value; renderAssets(); });
    $('#assetUpload')?.addEventListener('change', event => uploadAsset(event.currentTarget.files?.[0]));
    $('#syncAssetLibrary')?.addEventListener('click', () => {
      syncCoreAssets(); renderCanvas(); scheduleProjectSave();
      notify('角色、世界、分镜和当前视频任务已同步到项目素材库。');
    });
    $('#toggleAssetLock')?.addEventListener('click', toggleAssetLock);
    $('#addAssetToCanvas')?.addEventListener('click', addAssetToCanvas);
    $('#deleteAsset')?.addEventListener('click', deleteAsset);
    hydrate();
  }

  function exportState() {
    return JSON.parse(JSON.stringify(productionState()));
  }

  window.YingjieProduction = {
    init,
    hydrate,
    analyzeSource: analyzeSourceText,
    createSeasonPlan: input => createAdaptiveSeasonPlan(typeof input === 'string' ? analyzeSourceText(input) : input),
    syncCoreAssets,
    syncCharacter: syncCharacterAsset,
    syncShot: syncShotAsset,
    archiveShot,
    syncWorld: syncWorldAsset,
    syncVideo: syncVideoAsset,
    syncReview: syncReviewState,
    buildShotGenerationContext,
    exportState
  };
})();
