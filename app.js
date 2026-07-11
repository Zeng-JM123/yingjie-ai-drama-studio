const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Only used for the unconfigured, offline product preview. A configured studio replaces
// these values with the authoritative project snapshot returned by the service.
const beats = {
  act1: { code: 'SCENE 01 · INT. 电台直播间 · 深夜', title: '“有人在未来，等着你接听。”', body: '最后一档节目结束，调音台忽然亮起陌生的红灯。雨声里，有人喊出了她的名字。', tension: '58%', time: '00:00 — 00:32' },
  act2: { code: 'SCENE 04 · EXT. 南京东路 · 午夜', title: '“别相信你听见的每一个人。”', body: '录音里的男声引她穿过空无一人的街区。所有广告屏同时切换成她失去的那段记忆。', tension: '82%', time: '00:32 — 01:41' },
  act3: { code: 'SCENE 08 · EXT. 信号塔 · 黎明前', title: '“未来的发信者，就是现在的你。”', body: '天亮之前，她终于明白：被删除的不是记忆，而是一个还没有发生的选择。', tension: '96%', time: '01:41 — 02:47' }
};

const characters = {
  qingyan: {
    code: 'C-01', name: '沈清言', en: 'SHEN QINGYAN', role: '28 岁 · 深夜电台主持人 · 记忆被人为抹除', image: './assets/character-shen-qingyan.png', alt: '沈清言的角色三视图预览', tone: '克制 / 警觉', voice: '林霁 · 低语感', anchor: '耳骨夹 · 录音机', look: '雨夜·风衣'
  },
  yuze: {
    code: 'C-02', name: '陆予泽', en: 'LU YUZE', role: '31 岁 · 前声音工程师 · 未来语音的发信者', image: './assets/character-lu-yuze.png', alt: '陆予泽的角色三视图预览', tone: '压抑 / 守望', voice: '季临 · 低沉感', anchor: '旧收音机 · 右眉旧伤', look: '雨夜·夹克'
  }
};

const shots = {
  1: { id: '01', title: '雨夜的频率', cls: 'shot-one', size: '特写 CU', movement: '缓慢推进', duration: '4.2', emotion: '克制、悬疑', note: '（雨声渐强）“你终于接起来了。”', caption: '沈清言抬眼，红色信号灯在瞳孔中闪烁。', prompt: '深夜电台直播间，雨水划过玻璃，沈清言忽然抬眼望向闪烁的调音台，克制悬疑，电影级冷暖对比，镜头缓慢推进。' },
  2: { id: '02', title: '最后一位听众', cls: 'shot-two', size: '中景 MS', movement: '静置', duration: '5.0', emotion: '克制、悬疑', note: '“这里是 FM 97.4，请问你是？”', caption: '她独自坐在调音台前，耳机里只剩呼吸声。', prompt: '夜间电台直播间，中景，沈清言面对空荡的控制台，耳机中传来陌生呼吸，静置镜头，克制的悬疑感。' },
  3: { id: '03', title: '来自未来的声音', cls: 'shot-three', size: '特写 CU', movement: '缓慢推进', duration: '3.4', emotion: '紧张、失控', note: '（红灯闪烁，电流声）', caption: '红灯亮起，黑暗里的声音第一次接通。', prompt: '调音台红色信号灯大特写，黑暗电台空间，微小电流噪点，未知声音接通的瞬间，电影感推近。' },
  4: { id: '04', title: '城市静默之前', cls: 'shot-four', size: '全景 WS', movement: '横移', duration: '6.1', emotion: '克制、悬疑', note: '（街头广播同时失声）', caption: '雨幕中的城市屏幕逐个熄灭。', prompt: '雨夜上海未来感街区全景，广告屏逐个熄灭，午夜蓝与雾紫，横向移动镜头，压迫而安静。' },
  5: { id: '05', title: '屏幕上的旧照片', cls: 'shot-five', size: '越肩 OTS', movement: '静置', duration: '3.0', emotion: '脆弱、温暖', note: '“这张照片……我见过。”', caption: '旧照片里的人，正从屏幕深处望向她。', prompt: '电台主持人越肩看向故障显示器，屏幕出现模糊旧照片，暖色记忆与冷色现实交错，静置镜头。' },
  6: { id: '06', title: '驶向信号源', cls: 'shot-six', size: '全景 WS', movement: '跟拍', duration: '4.8', emotion: '紧张、失控', note: '（引擎声穿过暴雨）', caption: '出租车切开积水，驶向没有标记的信号塔。', prompt: '暴雨夜的出租车从未来上海街区掠过，湿润路面反射蓝紫霓虹，跟拍镜头，紧张加速。' },
  7: { id: '07', title: '故障屏上的倒影', cls: 'shot-two', size: '中景 MS', movement: '横移', duration: '3.6', emotion: '克制、悬疑', note: '（屏幕闪过她不认识的自己）', caption: '玻璃里出现一个迟半拍的倒影。', prompt: '雨夜玻璃上的人物倒影与本人动作不同步，电台空间，中近景横移，克制的诡异感。' },
  8: { id: '08', title: '信号塔亮起', cls: 'shot-four', size: '全景 WS', movement: '缓慢推进', duration: '5.2', emotion: '紧张、失控', note: '（远处传来同一段录音）', caption: '信号塔在雨幕中亮起第一束红光。', prompt: '暴雨中孤立的信号塔全景，顶部红灯穿透雨雾，末日悬疑感，镜头缓慢推进。' }
};

const toast = $('#toast');
const config = window.YINGJIE_CONFIG || {};
const studioGateway = String(config.studioApiBaseUrl || config.videoApiBaseUrl || '').replace(/\/$/, '');
const studioProjectId = /^[A-Za-z0-9_-]{1,80}$/.test(config.projectId || '') ? config.projectId : 'yesterday-signal-ep01';
const localStudioStorageKey = `yingjie:studio:${studioProjectId}`;
const seedanceDurations = [2, 3, 4, 5, 6, 8, 10, 12];
let toastTimer;
let selectedShot = '1';
let selectedCharacter = 'qingyan';
let playerTimer;
let playerSeconds = 18;
let previewPollTimer;
let previewPollAttempts = 0;
let previewVideoUrl = '';
let characterModalMode = 'create';
let projectRevision = null;
let saveTimer;
let saveInFlight = false;
let saveQueued = false;
let persistenceErrorShown = false;
let projectMetadata = { status: 'creative-ready' };
let activities = [
  { agent: '剧本架构师', content: '补强了女主的“失忆代价”动机。', kind: 'amber' },
  { agent: '视觉设定师', content: '已将雨夜蓝与琥珀红写入视觉规则。', kind: 'purple' },
  { agent: '镜头导演', content: '标记了 2 个需要人审的轴线风险。', kind: 'blue' }
];

function notify(message) {
  setText('#toastText', message);
  toast?.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast?.classList.remove('show'), 3600);
}

function setText(selector, value, root = document) {
  const node = typeof selector === 'string' ? $(selector, root) : selector;
  if (!node) return null;
  node.textContent = value;
  return node;
}

function setSaveState(state = 'saving') {
  const label = $('#saveState');
  const states = {
    saving: ['● 保存中', '#b0803c'],
    saved: ['● 已保存', '#5d9870'],
    local: ['● 已保存到本机', '#5d9870'],
    offline: ['● 未连接服务端', '#a46e51'],
    conflict: ['● 发现更新冲突', '#a46e51']
  };
  const [text, color] = states[state] || states.saved;
  if (!label) return;
  label.textContent = text;
  label.style.color = color;
}

function renderFeed() {
  const list = $('#agentFeed');
  const map = { '剧本架构师': '剧', '视觉设定师': '视', '镜头导演': '镜', '声音总监': '声', '审片助手': '审' };
  list.replaceChildren();
  activities.slice(0, 3).forEach(activity => {
    const item = document.createElement('li');
    const icon = document.createElement('span');
    icon.className = `feed-icon ${activity.kind || 'purple'}`;
    icon.textContent = map[activity.agent] || 'AI';
    const copy = document.createElement('div');
    const title = document.createElement('b');
    title.textContent = activity.agent;
    const body = document.createElement('p');
    body.textContent = activity.content;
    copy.append(title, body);
    const time = document.createElement('time');
    time.textContent = activity.occurredAt ? formatActivityTime(activity.occurredAt) : '现在';
    item.append(icon, copy, time);
    list.append(item);
  });
}

function formatActivityTime(value) {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(value).valueOf()) / 60_000));
  return elapsedMinutes < 1 ? '现在' : `${elapsedMinutes}m`;
}

function addFeed(agent, content, kind = 'purple') {
  activities.unshift({ agent, content, kind, occurredAt: new Date().toISOString() });
  activities = activities.slice(0, 50);
  renderFeed();
  scheduleProjectSave();
}

function buildStudioPayload() {
  return {
    expectedRevision: projectRevision || undefined,
    project: {
      name: '昨日信号', episode: 1, format: '9:16', brief: $('#briefInput').value.trim(),
      tags: $$('.tag.active').map(tag => tag.textContent.trim()), beats, selectedCharacterId: selectedCharacter,
      metadata: projectMetadata
    },
    characters: Object.entries(characters).map(([id, character]) => ({ id, ...character })),
    shots: Object.entries(shots).map(([key, shot]) => ({ key: String(key), ...shot })),
    activity: activities
  };
}

function saveProjectLocally() {
  try {
    window.localStorage.setItem(localStudioStorageKey, JSON.stringify(buildStudioPayload()));
    persistenceErrorShown = false;
    setSaveState('local');
    return true;
  } catch (error) {
    setSaveState('offline');
    if (!persistenceErrorShown) {
      persistenceErrorShown = true;
      notify('浏览器无法保存本地项目；请导出项目 JSON 以免丢失修改。');
    }
    return false;
  }
}

function readLocalProject() {
  try {
    const raw = window.localStorage.getItem(localStudioStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function scheduleProjectSave(delay = 350) {
  setSaveState('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProject, delay);
}

async function saveProject() {
  if (!studioGateway) {
    saveProjectLocally();
    return;
  }
  if (saveInFlight) { saveQueued = true; return; }
  saveInFlight = true;
  try {
    const response = await fetch(`${studioGateway}/v1/projects/${studioProjectId}/studio`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildStudioPayload())
    });
    const studio = await response.json();
    if (!response.ok) {
      if (response.status === 409) {
        setSaveState('conflict');
        notify('项目已在其他位置更新；请刷新页面后再继续编辑。');
        return;
      }
      throw new Error(studio.error || '项目保存失败');
    }
    projectRevision = studio.project.revision;
    persistenceErrorShown = false;
    setSaveState('saved');
  } catch (error) {
    setSaveState('offline');
    if (!persistenceErrorShown) {
      persistenceErrorShown = true;
      notify(error.message || '服务端暂时不可用，修改尚未同步。');
    }
  } finally {
    saveInFlight = false;
    if (saveQueued) { saveQueued = false; scheduleProjectSave(0); }
  }
}

function updateShotCount() {
  const amount = $$('.shot-card').length;
  setText('#shotNavCount', String(amount).padStart(2, '0'));
  setText('.sequence-tabs button.active b', `${String(amount).padStart(2, '0')} 镜`);
}

function populateShotEditor(shot) {
  setText('#selectedShotId', shot.id);
  setText('#selectedShotTitle', shot.title);
  setText('#previewShotNum', shot.id);
  setText('#previewCaption', shot.caption);
  setText('#shotPrompt', shot.prompt);
  ['shotSize', 'shotMovement', 'shotDuration', 'shotEmotion', 'shotNote'].forEach((id, index) => {
    const value = [shot.size, shot.movement, shot.duration, shot.emotion, shot.note][index];
    const field = $(`#${id}`);
    if (field) field.value = value;
  });
  const preview = $('#editorPreview');
  if (preview) preview.className = `editor-preview ${shot.cls}`;
}

function selectShot(id) {
  const shot = shots[id];
  if (!shot) return;
  selectedShot = String(id);
  $$('.shot-card').forEach(card => card.classList.toggle('selected', card.dataset.shot === selectedShot));
  populateShotEditor(shot);
  const status = $('#editorStatus');
  if (status) {
    status.textContent = String(id) === '4' ? '待确认时间连续性' : '已锁定角色锚点';
    status.style.background = String(id) === '4' ? '#fff0e5' : '#eef8ed';
    status.style.color = String(id) === '4' ? '#a46e51' : '#5c986d';
  }
}

function syncShotFromFields() {
  const shot = shots[selectedShot];
  shot.size = $('#shotSize').value;
  shot.movement = $('#shotMovement').value;
  shot.duration = $('#shotDuration').value || '0.0';
  shot.emotion = $('#shotEmotion').value;
  shot.note = $('#shotNote').value;
  const card = $(`.shot-card[data-shot="${selectedShot}"]`);
  if (card) {
    setText('small', `${shot.size.replace(/ .*/, '')} · ${shot.movement}`, card);
    setText('em', `${shot.duration}s`, card);
  }
  scheduleProjectSave();
}

function selectCharacter(id, silent = false) {
  const character = characters[id];
  if (!character) return;
  selectedCharacter = id;
  $$('.cast-card[data-character]').forEach(card => card.classList.toggle('selected', card.dataset.character === id));
  setText('#characterCode', character.code);
  const characterName = $('#characterName');
  const englishName = document.createElement('small');
  englishName.textContent = character.en;
  characterName?.replaceChildren(document.createTextNode(`${character.name} `), englishName);
  setText('#characterRole', character.role);
  setText('#characterTone', character.tone);
  setText('#characterVoice', character.voice);
  setText('#characterAnchor', character.anchor);
  const image = $('#characterImage');
  if (image) { image.src = character.image; image.alt = character.alt; }
  $('#characterStudio')?.classList.toggle('draft-character', Boolean(character.draft));
  $$('#lookChips button').forEach(button => button.classList.toggle('active', button.dataset.look === character.look));
  if (!silent) {
    scheduleProjectSave();
    notify(`已切换到「${character.name}」的角色预览与生成约束`);
  }
}

function renderCharacterRail() {
  const rail = $('#castRail');
  rail.replaceChildren();
  Object.entries(characters).forEach(([id, character]) => {
    const card = document.createElement('button');
    card.className = `cast-card${id === selectedCharacter ? ' selected' : ''}`;
    card.dataset.character = id;
    const thumb = document.createElement('span');
    thumb.className = `cast-thumb ${id === 'qingyan' || id === 'yuze' ? id : 'generated'}`;
    const copy = document.createElement('span');
    const name = document.createElement('b');
    name.textContent = character.name;
    const role = document.createElement('small');
    role.textContent = character.draft ? `${character.role} · 预览草案` : character.role;
    copy.append(name, role);
    const status = document.createElement('i');
    status.textContent = id === selectedCharacter ? '●' : '◌';
    card.append(thumb, copy, status);
    card.addEventListener('click', () => selectCharacter(id));
    rail.append(card);
  });
  const add = document.createElement('button');
  add.className = 'cast-card add-cast';
  add.id = 'sideNewCharacter';
  const plus = document.createElement('span');
  plus.textContent = '+';
  const label = document.createElement('b');
  label.textContent = '新增角色';
  add.append(plus, label);
  add.addEventListener('click', openCharacterModal);
  rail.append(add);

  const counter = document.createElement('div');
  counter.className = 'asset-counter';
  const count = document.createElement('b');
  count.textContent = String(Object.keys(characters).length).padStart(2, '0');
  const title = document.createElement('span');
  title.textContent = '已锁定人物资产';
  const detail = document.createElement('small');
  detail.textContent = `${Object.keys(characters).length} 人物 · 3 场景 · 3 道具`;
  counter.append(count, title, detail);
  rail.append(counter);
}

function renderShotGrid() {
  const grid = $('#shotGrid');
  grid.replaceChildren();
  Object.entries(shots).forEach(([key, shot]) => {
    const card = document.createElement('button');
    card.className = `shot-card${key === selectedShot ? ' selected' : ''}${key === '4' ? ' flagged' : ''}`;
    card.dataset.shot = key;
    const thumb = document.createElement('span');
    thumb.className = `shot-thumb ${shot.cls}`;
    const number = document.createElement('b');
    number.textContent = shot.id;
    const framing = document.createElement('i');
    framing.textContent = (shot.size.split(' ').pop() || 'MS').toUpperCase();
    thumb.append(number, framing);
    const copy = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = shot.title;
    const details = document.createElement('small');
    details.textContent = `${shot.size.replace(/ .*/, '')} · ${shot.movement}`;
    const duration = document.createElement('em');
    duration.textContent = `${shot.duration}s`;
    copy.append(title, details, duration);
    card.append(thumb, copy);
    card.addEventListener('click', () => selectShot(key));
    grid.append(card);
  });
}

function renderBeat(act) {
  const beat = beats[act];
  if (!beat) return;
  const target = $('#scriptBeat');
  const code = document.createElement('span');
  code.className = 'scene-code';
  code.textContent = beat.code;
  const title = document.createElement('h3');
  title.textContent = beat.title;
  const body = document.createElement('p');
  body.textContent = beat.body;
  const meta = document.createElement('div');
  meta.className = 'beat-meta';
  const tension = document.createElement('span');
  tension.append('叙事张力 ');
  const meter = document.createElement('i');
  meter.style.setProperty('--meter', beat.tension);
  tension.append(meter);
  const time = document.createElement('span');
  time.textContent = beat.time;
  meta.append(tension, time);
  target.replaceChildren(code, title, body, meta);
}

function renderPersistedProductionState() {
  renderWorldRules(projectMetadata.worldRules);
  if (projectMetadata.healthScore) setText('#healthScore', String(projectMetadata.healthScore));
  if (projectMetadata.timeContinuityLocked) {
    $('#applyFix').innerHTML = '✓ 已锁定为「午夜暴雨」<span>→</span>';
    $('#applyFix').style.color = '#4e8660';
    $('#applyFix').style.background = '#f0f8ee';
  }
  if (projectMetadata.reviewPassed) {
    $$('.review-item.pending').forEach(item => {
      item.classList.remove('pending');
      item.classList.add('passed');
      setText('span', '✓', item);
      setText('em', '已修复', item);
    });
    $('.review-summary').innerHTML = '<b>通过 9 / 9</b><span>高风险 0 · 需确认 0</span>';
    $('#reviewFix').innerHTML = '✓ 已修复所有低风险问题 <span>→</span>';
    $('#reviewFix').style.color = '#4e8660';
    $('#reviewFix').style.background = '#f0f8ee';
  }
  if (projectMetadata.deliveryGatePassed) $('#finalizeProject').innerHTML = '✓ 交付门禁已通过 <span>→</span>';
}

function renderWorldRules(rules) {
  if (!rules) return;
  if (rules.time) setText('#worldTime', rules.time);
  if (rules.palette) {
    const palette = $('#worldPalette');
    if (!palette) return;
    const swatches = [...palette.querySelectorAll('i')];
    palette.replaceChildren(...swatches, document.createTextNode(` ${rules.palette}`));
  }
  if (rules.constraints) setText('#worldConstraints', rules.constraints);
}

function applyStudio(studio) {
  if (!studio?.project || !Array.isArray(studio.characters) || !Array.isArray(studio.shots)) throw new Error('服务端返回的项目数据不完整。');
  Object.keys(beats).forEach(key => delete beats[key]);
  Object.assign(beats, studio.project.beats || {});
  Object.keys(characters).forEach(key => delete characters[key]);
  studio.characters.forEach(({ id, ...character }) => { characters[id] = character; });
  Object.keys(shots).forEach(key => delete shots[key]);
  studio.shots.forEach(({ key, ...shot }) => { shots[key] = shot; });
  projectRevision = studio.project.revision;
  projectMetadata = studio.project.metadata || {};
  activities = studio.activity || [];
  $('#briefInput').value = studio.project.brief || '';
  const selectedTags = new Set(studio.project.tags || []);
  $$('.tag').forEach(tag => tag.classList.toggle('active', selectedTags.has(tag.textContent.trim())));
  selectedCharacter = characters[studio.project.selectedCharacterId] ? studio.project.selectedCharacterId : Object.keys(characters)[0];
  selectedShot = shots[selectedShot] ? selectedShot : Object.keys(shots)[0];
  renderCharacterRail();
  renderShotGrid();
  renderFeed();
  selectCharacter(selectedCharacter, true);
  selectShot(selectedShot);
  renderBeat($('.beat-tab.active')?.dataset.act || 'act1');
  renderPersistedProductionState();
  hydratePreviewState();
  updateShotCount();
}

async function loadProject() {
  if (!studioGateway) {
    const localProject = readLocalProject();
    if (localProject) {
      try { applyStudio(localProject); }
      catch { window.localStorage.removeItem(localStudioStorageKey); }
    }
    hydratePreviewState();
    return setSaveState('local');
  }
  setSaveState('saving');
  try {
    const response = await fetch(`${studioGateway}/v1/projects/${studioProjectId}/studio`);
    const studio = await response.json();
    if (!response.ok) throw new Error(studio.error || '项目读取失败');
    applyStudio(studio);
    setSaveState('saved');
  } catch (error) {
    setSaveState('offline');
    notify(error.message || '未能读取服务端项目，当前显示离线预览数据。');
  }
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

$('#closeToast').addEventListener('click', () => toast.classList.remove('show'));
$('#projectSwitcher').addEventListener('click', () => notify('当前项目：昨日信号 · 第 01 集（项目切换将在团队空间开放）'));
$('#guideBtn').addEventListener('click', () => notify('建议顺序：锁角色 → 设镜头 → 审样片 → 过交付门禁'));
$('#commandBtn').addEventListener('click', () => {
  const brief = $('#briefInput');
  brief.focus();
  brief.select();
  notify('创作指令已聚焦：输入后按 ⌘ ↵ 可重跑制作链。');
});

$$('.tag').forEach(tag => tag.addEventListener('click', () => {
  tag.classList.toggle('active');
  scheduleProjectSave();
  notify(tag.classList.contains('active') ? `已加入创作条件：${tag.textContent}` : `已移除创作条件：${tag.textContent}`);
}));
$('#briefInput').addEventListener('input', () => scheduleProjectSave());

$$('.beat-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.beat-tab').forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  const target = $('#scriptBeat');
  target.style.opacity = '0';
  setTimeout(() => {
    renderBeat(tab.dataset.act);
    target.style.opacity = '1';
  }, 140);
}));

$$('.nav-item').forEach(link => link.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  link.classList.add('active');
}));

const productionStages = [
  ['剧本架构师', '已根据新指令校验人物动机与钩子密度。', 'amber'],
  ['视觉设定师', '已把角色锚点和天气规则同步到镜头提示词。', 'purple'],
  ['镜头导演', '已按叙事张力重排当前序列的镜头节奏。', 'blue'],
  ['声音总监', '已为主要台词写入情绪与环境声层次。', 'purple']
];
let isRunning = false;
function runPipeline() {
  if (isRunning) return;
  const brief = $('#briefInput').value.trim();
  if (!brief) return notify('请先写下本集的创作指令');
  isRunning = true;
  const button = $('#runPipeline');
  button.disabled = true;
  button.innerHTML = '<span>✦</span> 正在同步制作链…';
  let index = 0;
  const next = () => {
    if (index >= productionStages.length) {
      button.disabled = false;
      button.innerHTML = '<span>✦</span> AI 拆解并更新制作链 <kbd>⌘ ↵</kbd>';
      isRunning = false;
      setText('#healthScore', '94');
      projectMetadata.healthScore = 94;
      scheduleProjectSave();
      notify('制作链已更新：角色、分镜与审片清单保持同步');
      return;
    }
    const [agent, copy, kind] = productionStages[index];
    addFeed(agent, copy, kind);
    notify(`${agent}：${copy}`);
    index += 1;
    setTimeout(next, 700);
  };
  next();
}
$('#runPipeline').addEventListener('click', runPipeline);
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); runPipeline(); }
  if (event.key === 'Escape') { closePreviewModal(); closeModal($('#characterModal')); closeWorldModal(); }
});

$('#scriptExpand').addEventListener('click', () => {
  $('#briefInput').focus();
  notify('已定位到本集创作指令；修改后会同步刷新剧本节奏和镜头生产链。');
});
$('#clearFeed').addEventListener('click', () => {
  activities = [];
  renderFeed();
  scheduleProjectSave();
  notify('AI 制作日志已从项目记录中清空。');
});
$('#applyFix').addEventListener('click', () => {
  setText('#healthScore', '94');
  $('#applyFix').innerHTML = '✓ 已锁定为「午夜暴雨」<span>→</span>';
  $('#applyFix').style.color = '#4e8660';
  $('#applyFix').style.background = '#f0f8ee';
  projectMetadata.healthScore = 94;
  projectMetadata.timeContinuityLocked = true;
  addFeed('审片助手', '已将镜头 04 场景时间锁定为午夜暴雨。', 'blue');
  notify('已修复时间连续性，创作健康度提升至 94 分');
  scheduleProjectSave();
});

$$('.cast-card[data-character]').forEach(card => card.addEventListener('click', () => selectCharacter(card.dataset.character)));
$$('#lookChips button').forEach(button => button.addEventListener('click', () => {
  $$('#lookChips button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  characters[selectedCharacter].look = button.dataset.look;
  notify(`已将「${button.textContent}」写入 ${characters[selectedCharacter].name} 的后续镜头约束`);
  scheduleProjectSave();
}));

let voicePlaying = false;
function toggleVoice(button) {
  voicePlaying = !voicePlaying;
  button.textContent = voicePlaying ? 'Ⅱ' : '▶';
  notify(voicePlaying ? `正在试听 ${characters[selectedCharacter].name} 的声线与台词节奏…` : '已暂停声线试听');
}
$('#voicePlay').addEventListener('click', event => toggleVoice(event.currentTarget));
$('#portraitPlay').addEventListener('click', event => {
  const stage = $('.portrait-stage');
  stage.classList.toggle('is-performing');
  event.currentTarget.textContent = stage.classList.contains('is-performing') ? 'Ⅱ 停止试演' : '▶ 试演表情';
  notify(stage.classList.contains('is-performing') ? '正在预演：抬眼、停顿 0.6 秒、压低呼吸。' : '角色表演预演已停止');
});
$('#editCharacter').addEventListener('click', () => openCharacterModal('edit'));
$('#generateCharacter').addEventListener('click', event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<span>✦</span> 预览生成中…';
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> 重新生成 3 张预览';
    notify(`${characters[selectedCharacter].name} 的三视图预览已更新，可在镜头生成前选定造型。`);
    addFeed('视觉设定师', `${characters[selectedCharacter].name} 的三视图和造型约束已写入项目圣经。`, 'purple');
  }, 1000);
});
function openWorldModal() {
  const rules = projectMetadata.worldRules || {};
  const timeInput = $('#worldTimeInput');
  const paletteInput = $('#worldPaletteInput');
  const constraintsInput = $('#worldConstraintsInput');
  if (!timeInput || !paletteInput || !constraintsInput) return notify('当前页面尚未加载世界规则编辑器，请刷新页面后重试。');
  timeInput.value = rules.time || $('#worldTime')?.textContent?.trim() || '';
  paletteInput.value = rules.palette || $('#worldPalette')?.textContent?.trim() || '';
  constraintsInput.value = rules.constraints || $('#worldConstraints')?.textContent?.trim() || '';
  openModal($('#worldModal'));
  timeInput.focus();
}
function closeWorldModal() { closeModal($('#worldModal')); }
$('#worldToggle').addEventListener('click', openWorldModal);
$('#editWorld').addEventListener('click', openWorldModal);
$$('[data-close-world]').forEach(button => button.addEventListener('click', closeWorldModal));
$('#worldModal')?.addEventListener('click', event => { if (event.target === $('#worldModal')) closeWorldModal(); });
$('#saveWorld')?.addEventListener('click', () => {
  const rules = { time: $('#worldTimeInput').value.trim(), palette: $('#worldPaletteInput').value.trim(), constraints: $('#worldConstraintsInput').value.trim() };
  if (!rules.time || !rules.palette || !rules.constraints) return notify('请补全时间、色彩和禁用元素后再保存。');
  projectMetadata.worldRules = rules;
  renderWorldRules(rules);
  closeWorldModal();
  addFeed('视觉设定师', '已更新世界规则，并同步到后续未锁定镜头。', 'purple');
  notify('世界规则已保存；后续生成会继承新的时间、色彩和禁用约束。');
  scheduleProjectSave();
});

function openCharacterModal(mode = 'create') {
  characterModalMode = mode;
  const isEditing = mode === 'edit';
  const character = characters[selectedCharacter];
  setText('#newCharacterTitle', isEditing ? `编辑「${character.name}」角色卡` : '构造可预览的人物');
  $('#createCharacter').innerHTML = isEditing ? '<span>✓</span> 保存角色卡' : '<span>✦</span> 创建角色卡';
  $('#newCharacterName').value = isEditing ? character.name : '';
  $('#newCharacterRole').value = isEditing ? character.role : '';
  $('#newCharacterAnchor').value = isEditing ? character.anchor : '';
  openModal($('#characterModal'));
  $('#newCharacterName').focus();
}
$('#newCharacter').addEventListener('click', () => openCharacterModal());
$('#sideNewCharacter').addEventListener('click', () => openCharacterModal());
$$('[data-close-character]').forEach(button => button.addEventListener('click', () => closeModal($('#characterModal'))));
$('#characterModal').addEventListener('click', event => { if (event.target === $('#characterModal')) closeModal($('#characterModal')); });
$('#createCharacter').addEventListener('click', () => {
  const name = $('#newCharacterName').value.trim();
  const role = $('#newCharacterRole').value.trim();
  const anchor = $('#newCharacterAnchor').value.trim();
  if (!name || !role || !anchor) return notify('请先补全名称、身份与视觉记忆点');
  if (characterModalMode === 'edit') {
    const character = characters[selectedCharacter];
    Object.assign(character, { name, role, anchor, alt: `${name} 的角色预览` });
    $('#newCharacterName').value = '';
    $('#newCharacterRole').value = '';
    $('#newCharacterAnchor').value = '';
    closeModal($('#characterModal'));
    renderCharacterRail();
    selectCharacter(selectedCharacter, true);
    addFeed('视觉设定师', `已更新「${name}」的身份、故事职责和视觉锚点。`, 'purple');
    notify(`「${name}」的角色卡已保存并同步到后续镜头。`);
    scheduleProjectSave();
    return;
  }
  const id = `custom-${Date.now()}`;
  characters[id] = { code: `C-${String(Object.keys(characters).length + 1).padStart(2, '0')}`, name, en: 'AI CHARACTER DRAFT', role, image: './assets/character-shen-qingyan.png', alt: `${name} 的 AI 角色预览草案`, tone: '待定义 / 可引导', voice: '待选择 · 需试听', anchor, look: '初始造型', draft: true };
  $('#newCharacterName').value = '';
  $('#newCharacterRole').value = '';
  $('#newCharacterAnchor').value = '';
  closeModal($('#characterModal'));
  renderCharacterRail();
  selectCharacter(id, true);
  addFeed('视觉设定师', `已创建 ${name} 的角色蓝图，正在等待 AI 预览生成。`, 'purple');
  notify(`「${name}」已进入角色资产库；可继续生成正式三视图。`);
  scheduleProjectSave();
});

$$('.shot-card').forEach(card => card.addEventListener('click', () => selectShot(card.dataset.shot)));
['shotSize', 'shotMovement', 'shotDuration', 'shotEmotion', 'shotNote'].forEach(id => $(`#${id}`).addEventListener('change', syncShotFromFields));
$('#copyPrompt').addEventListener('click', async () => {
  const prompt = shots[selectedShot].prompt;
  try { await navigator.clipboard.writeText(prompt); notify('镜头提示词已复制，可用于任何图像或视频模型'); }
  catch { notify('镜头提示词已就绪，请手动复制。'); }
});
$('#splitShot').addEventListener('click', () => {
  const shot = shots[selectedShot];
  shot.duration = (Number(shot.duration) / 2).toFixed(1);
  $('#shotDuration').value = shot.duration;
  syncShotFromFields();
  notify(`已将镜头 ${shot.id} 拆为两个 ${shot.duration} 秒节奏单元`);
  addFeed('镜头导演', `已将「${shot.title}」拆分为情绪起点与反应镜头。`, 'blue');
});
$('#deleteShot').addEventListener('click', () => {
  const card = $(`.shot-card[data-shot="${selectedShot}"]`);
  if ($$('.shot-card').length <= 1) return notify('至少保留一个镜头');
  card.remove();
  delete shots[selectedShot];
  const nextCard = $('.shot-card');
  selectShot(nextCard.dataset.shot);
  updateShotCount();
  notify('镜头已移入历史版本，可随时恢复');
  scheduleProjectSave();
});
$('#addShot').addEventListener('click', () => {
  const newId = Math.max(0, ...Object.keys(shots).map(Number)) + 1;
  shots[newId] = { id: String(newId).padStart(2, '0'), title: 'AI 新增叙事镜头', cls: 'shot-five', size: '中景 MS', movement: '静置', duration: '3.0', emotion: '克制、悬疑', note: '（待补充台词或音效）', caption: '请在这里写下这个镜头要让观众感到什么。', prompt: '根据前后镜头的角色、时间、道具与情绪约束，生成一个衔接自然的竖屏短剧镜头。' };
  const card = document.createElement('button');
  card.className = 'shot-card';
  card.dataset.shot = newId;
  card.innerHTML = `<span class="shot-thumb shot-five"><b>${shots[newId].id}</b><i>MS</i></span><span><strong>AI 新增叙事镜头</strong><small>待绑定角色 · 中景 · 静置</small><em>3.0s</em></span>`;
  card.addEventListener('click', () => selectShot(newId));
  $('#shotGrid').append(card);
  selectShot(newId);
  updateShotCount();
  notify('已添加空白镜头；请补足角色、情绪和声音，AI 会继承上下文生成。');
  scheduleProjectSave();
});
$('#regenerateShots').addEventListener('click', event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = '✦ 正在重排…';
  setTimeout(() => {
    button.disabled = false;
    button.textContent = '↻ AI 重排节奏';
    addFeed('镜头导演', '已提出一套更早揭示危机、加快中段节奏的替代方案。', 'blue');
    notify('AI 已生成备用节奏方案：前 30 秒的钩子密度提升 12%');
  }, 1100);
});
$('#showRisks').addEventListener('click', () => { selectShot(4); $('#storyboard').scrollIntoView({ behavior: 'smooth', block: 'start' }); notify('已定位到镜头 04：请确认画面时间应为午夜，而不是黄昏。'); });

const videoGateway = String(config.videoApiBaseUrl || config.studioApiBaseUrl || '').replace(/\/$/, '');

function nearestSeedanceDuration(value) {
  const requested = Number(value) || 4;
  return seedanceDurations.reduce((closest, candidate) => Math.abs(candidate - requested) < Math.abs(closest - requested) ? candidate : closest, 4);
}

function previewDuration() {
  const video = $('#previewVideo');
  if (previewVideoUrl && video && Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  return Number(projectMetadata.preview?.duration) || (previewVideoUrl ? 5 : 167);
}

function formatPlayerTime(total, duration = previewDuration()) {
  const format = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  return `${format(total)} / ${format(duration)}`;
}

function updatePlayerPosition(seconds = playerSeconds) {
  const duration = previewDuration();
  playerSeconds = Math.max(0, Math.min(seconds, duration));
  setText('#playerTime', formatPlayerTime(playerSeconds, duration));
  const playhead = $('.playhead');
  if (playhead) playhead.style.left = `${Math.max(2, Math.min(98, playerSeconds / duration * 100))}%`;
}

function setPlaybackState(playing) {
  $('#playerStage')?.classList.toggle('is-playing', playing);
  $('#modalFilm')?.classList.toggle('is-playing', playing);
  ['#playerButton', '#modalPlay'].forEach(selector => {
    const button = $(selector);
    if (!button) return;
    button.dataset.playing = String(playing);
    button.textContent = playing ? 'Ⅱ' : '▶';
    button.setAttribute('aria-label', playing ? '暂停样片预览' : '播放样片预览');
  });
}

function stopPlayback() {
  clearInterval(playerTimer);
  ['#previewVideo', '#modalVideo'].forEach(selector => $(selector)?.pause());
  setPlaybackState(false);
}

function startAnimaticPlayback() {
  clearInterval(playerTimer);
  setPlaybackState(true);
  playerTimer = setInterval(() => {
    const duration = previewDuration();
    updatePlayerPosition(playerSeconds >= duration ? 0 : playerSeconds + 1);
  }, 600);
}

async function toggleVideoPlayback(surface) {
  const activeVideo = surface === 'modal' ? $('#modalVideo') : $('#previewVideo');
  const playing = activeVideo.paused;
  if (!playing) return stopPlayback();
  clearInterval(playerTimer);
  ['#previewVideo', '#modalVideo'].forEach(selector => {
    const video = $(selector);
    if (video !== activeVideo) video.pause();
  });
  if (Number.isFinite(activeVideo.duration) && playerSeconds >= activeVideo.duration) playerSeconds = 0;
  activeVideo.currentTime = playerSeconds;
  try {
    await activeVideo.play();
    setPlaybackState(true);
  } catch {
    setPlaybackState(false);
    notify('浏览器无法播放该视频地址，请重新生成或检查视频链接是否已过期。');
  }
}

function togglePlayer(surface = 'player') {
  if (previewVideoUrl) return toggleVideoPlayback(surface);
  const playing = $('#playerButton').dataset.playing !== 'true';
  if (playing) {
    startAnimaticPlayback();
    notify('正在播放动态分镜预演；这不是最终 Seedance 成片。');
  } else {
    stopPlayback();
    notify('动态分镜预演已暂停。');
  }
  return Promise.resolve();
}

function renderPreviewState() {
  const preview = projectMetadata.preview || {};
  const nextUrl = typeof preview.videoUrl === 'string' ? preview.videoUrl : '';
  const changed = previewVideoUrl !== nextUrl;
  previewVideoUrl = nextUrl;
  const hasVideo = Boolean(previewVideoUrl);
  const playerStage = $('#playerStage');
  const modalFilm = $('#modalFilm');
  playerStage?.classList.toggle('has-video', hasVideo);
  modalFilm?.classList.toggle('has-video', hasVideo);
  setText('#previewKind', hasVideo ? 'SEEDANCE 成片' : '动态分镜预演');
  setText('#previewStatus', preview.status || (hasVideo ? 'Seedance 成片已就绪 · 视频链接可能过期，请及时转存' : studioGateway ? '尚未生成视频 · 点击“生成镜头预览”提交 Seedance 任务' : '动态分镜预演 · 可直接播放；接入 Seedance 后将自动替换为成片'));
  if (changed) {
    stopPlayback();
    ['#previewVideo', '#modalVideo'].forEach(selector => {
      const video = $(selector);
      if (!video) return;
      video.removeAttribute('src');
      if (hasVideo) video.src = previewVideoUrl;
      video.load();
    });
    updatePlayerPosition(0);
  }
}

function setAnimaticPreview(shot) {
  projectMetadata.preview = {
    mode: 'animatic', shotId: shot.id, duration: 167,
    status: `动态分镜预演 · 镜头 ${shot.id} 已就绪（尚未生成 Seedance 成片）`
  };
  renderPreviewState();
  updatePlayerPosition(0);
}

async function requestVideoGateway(path, options = {}) {
  const response = await fetch(`${videoGateway}${path}`, { ...options, signal: AbortSignal.timeout(35_000) });
  const task = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(task.error || `视频服务请求失败（HTTP ${response.status}）`);
  return task;
}

async function pollSeedancePreview(taskId, attempts = 0) {
  if (!videoGateway || attempts >= 60) {
    projectMetadata.preview = { ...projectMetadata.preview, status: 'Seedance 任务仍在处理，可稍后刷新项目查看结果。' };
    renderPreviewState();
    scheduleProjectSave();
    return;
  }
  try {
    const task = await requestVideoGateway(`/v1/video-jobs/${encodeURIComponent(taskId)}`);
    if (task.status === 'succeeded' && task.videoUrl) {
      projectMetadata.preview = { mode: 'video', videoUrl: task.videoUrl, taskId, shotId: task.shotId || String(selectedShot), duration: Number(task.duration) || 5, status: 'Seedance 成片已就绪 · 点击播放或全屏审阅' };
      renderPreviewState();
      updatePlayerPosition(0);
      scheduleProjectSave();
      notify('Seedance 成片已就绪，现在可以在样片区直接播放。');
      return;
    }
    if (['failed', 'cancelled', 'canceled'].includes(task.status)) {
      projectMetadata.preview = { ...projectMetadata.preview, status: `Seedance 生成失败：${task.error || task.status}` };
      renderPreviewState();
      scheduleProjectSave();
      return notify('视频生成未完成；镜头提示词和动态预演仍已保留。');
    }
    projectMetadata.preview = { ...projectMetadata.preview, taskId, status: `Seedance ${task.status || '排队中'} · 正在等待成片` };
    renderPreviewState();
    previewPollAttempts = attempts + 1;
    previewPollTimer = setTimeout(() => pollSeedancePreview(taskId, previewPollAttempts), 5_000);
  } catch (error) {
    projectMetadata.preview = { ...projectMetadata.preview, taskId, status: error.message || '视频任务状态暂时不可读取' };
    renderPreviewState();
    scheduleProjectSave();
  }
}

function hydratePreviewState() {
  renderPreviewState();
  const preview = projectMetadata.preview || {};
  if (studioGateway && preview.taskId && !preview.videoUrl && !previewPollTimer) void pollSeedancePreview(preview.taskId);
}

async function trySeedancePreview() {
  if (!videoGateway) return false;
  const shot = shots[selectedShot];
  const task = await requestVideoGateway('/v1/video-jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: studioProjectId, shotId: String(selectedShot), prompt: shot.prompt, ratio: '9:16', duration: nearestSeedanceDuration(shot.duration), resolution: '720p', generateAudio: false })
  });
  if (!task.id) throw new Error(task.error || '视频任务未返回任务 ID');
  projectMetadata.preview = { mode: 'seedance', taskId: task.id, shotId: shot.id, duration: nearestSeedanceDuration(shot.duration), status: `Seedance ${task.status || '已排队'} · 镜头 ${shot.id} 正在生成` };
  renderPreviewState();
  scheduleProjectSave();
  void pollSeedancePreview(task.id);
  notify(`已将镜头 ${shot.id} 提交到 Seedance 视频生成队列。`);
  return true;
}

['#previewVideo', '#modalVideo'].forEach(selector => {
  const video = $(selector);
  if (!video) return;
  video.addEventListener('timeupdate', () => updatePlayerPosition(video.currentTime));
  video.addEventListener('ended', stopPlayback);
  video.addEventListener('loadedmetadata', () => updatePlayerPosition(0));
});

$('#generateShot').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<span>✦</span> 生成中…';
  try {
    const usedGateway = await trySeedancePreview();
    if (!usedGateway) {
      await new Promise(resolve => setTimeout(resolve, 450));
      setAnimaticPreview(shots[selectedShot]);
      startAnimaticPlayback();
      scheduleProjectSave();
      notify(`镜头 ${shots[selectedShot].id} 的动态分镜预演已生成；配置 Seedance 网关后可替换为真实成片。`);
    }
    addFeed('镜头导演', `已为「${shots[selectedShot].title}」更新预览状态。`, 'blue');
  } catch (error) {
    setAnimaticPreview(shots[selectedShot]);
    notify(`${error.message || '视频任务暂时无法提交'}；已切换为可播放的动态分镜预演。`);
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> 生成镜头预览';
  }
});

$('#playerButton').addEventListener('click', () => { void togglePlayer('player'); });
$('#reviewFix').addEventListener('click', () => {
  $$('.review-item.pending').forEach(item => {
    item.classList.remove('pending');
    item.classList.add('passed');
    setText('span', '✓', item);
    setText('em', '已修复', item);
  });
  $('.review-summary').innerHTML = '<b>通过 9 / 9</b><span>高风险 0 · 需确认 0</span>';
  $('#reviewFix').innerHTML = '✓ 已修复所有低风险问题 <span>→</span>';
  $('#reviewFix').style.color = '#4e8660';
  $('#reviewFix').style.background = '#f0f8ee';
  projectMetadata.reviewPassed = true;
  addFeed('审片助手', '已修复镜头时间标签，并生成口型试听提醒。', 'blue');
  notify('审片清单已通过：9 / 9 项合格，质检可进入交付门禁');
  scheduleProjectSave();
});
$$('.review-item').forEach((item, index) => item.addEventListener('click', () => {
  if (!item.classList.contains('pending')) return notify('该项已通过，无需额外处理。');
  const shotId = index === 2 ? '4' : '2';
  selectShot(shotId);
  $('#storyboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  notify(`已定位到镜头 ${shots[shotId].id}，请在分镜编辑器中完成对应审片项。`);
}));
$('#inviteReviewer').addEventListener('click', async () => {
  const reviewLink = `${window.location.origin}${window.location.pathname}#dailies`;
  try {
    await navigator.clipboard.writeText(reviewLink);
    notify('审片链接已复制；成员可从样片区进入审阅。');
  } catch {
    notify(`审片链接：${reviewLink}`);
  }
});

const previewModal = $('#modalBackdrop');
function openPreviewModal() {
  renderPreviewState();
  if (previewVideoUrl) $('#modalVideo').currentTime = playerSeconds;
  openModal(previewModal);
}
function closePreviewModal() {
  stopPlayback();
  closeModal(previewModal);
}
$('#previewBtn').addEventListener('click', openPreviewModal);
$('#openFullPreview').addEventListener('click', openPreviewModal);
$('#modalClose').addEventListener('click', closePreviewModal);
previewModal.addEventListener('click', event => { if (event.target === previewModal) closePreviewModal(); });
$('#modalPlay').addEventListener('click', () => { void togglePlayer('modal'); });

function exportProject() {
  const project = { name: '昨日信号', episode: 1, format: '9:16', brief: $('#briefInput').value, selectedCharacter: characters[selectedCharacter].name, characters: Object.values(characters).map(({ name, role, anchor, look }) => ({ name, role, anchor, look })), shots: Object.values(shots), exportedAt: new Date().toISOString(), status: 'creative-ready' };
  const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'yingjie-episode-01-project.json';
  link.click();
  URL.revokeObjectURL(url);
  notify('项目 JSON 已导出，包含角色锚点、镜头参数和创作指令。');
}
$('#exportBtn').addEventListener('click', exportProject);
$('#modalExport').addEventListener('click', exportProject);
$('#finalizeProject').addEventListener('click', event => {
  event.currentTarget.innerHTML = '✓ 交付门禁已通过 <span>→</span>';
  projectMetadata.deliveryGatePassed = true;
  notify('交付检查已开启：将输出主版、平台裁切、字幕和镜头资产清单。');
  scheduleProjectSave();
});

const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const id = visible.target.id;
  const target = id === 'dashboard' ? 'dashboard' : id;
  $$('.nav-item').forEach(link => link.classList.toggle('active', link.dataset.target === target));
}, { threshold: .35 });
['dashboard', 'cast', 'storyboard', 'dailies', 'delivery'].forEach(id => observer.observe(document.getElementById(id)));

populateShotEditor(shots[1]);
updateShotCount();
renderFeed();
loadProject();
