const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const beats = {
  act1: { code: 'SCENE 01 · INT. 电台直播间 · 深夜', title: '“有人在未来，等着你接听。”', body: '雨水顺着落地窗拉出银色的线。沈清言结束最后一档深夜节目，调音台忽然亮起一盏陌生的红灯。', tension: '58%', time: '01:12–02:04' },
  act2: { code: 'SCENE 06 · EXT. 南京东路 · 午夜', title: '“别相信你听见的每一个人。”', body: '录音里的男声引她穿过空无一人的街区。所有广告屏同时切换成她失去的那段记忆。', tension: '82%', time: '02:04–04:35' },
  act3: { code: 'SCENE 11 · INT. 信号塔顶 · 黎明前', title: '“未来的发信者，就是现在的你。”', body: '天亮之前，她终于明白：被删除的不是记忆，而是一个还没有发生的选择。', tension: '96%', time: '04:35–07:42' }
};

const toast = $('#toast');
let toastTimer;
function notify(message) {
  $('#toastText').textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
}

$('#closeToast').addEventListener('click', () => toast.classList.remove('show'));

$$('.chip').forEach(chip => chip.addEventListener('click', () => {
  chip.classList.toggle('active');
  notify(chip.classList.contains('active') ? `已加入标签：${chip.textContent}` : `已移除标签：${chip.textContent}`);
}));

$$('.nav-item').forEach(link => link.addEventListener('click', () => {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  link.classList.add('active');
}));

$$('.act-tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.act-tab').forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  const beat = beats[tab.dataset.act];
  const beatEl = $('#scriptBeat');
  beatEl.style.opacity = '0';
  setTimeout(() => {
    beatEl.innerHTML = `<span class="scene-code">${beat.code}</span><h3>${beat.title}</h3><p>${beat.body}</p><div class="beat-meta"><span>△ 叙事张力 <i style="width:${beat.tension}"></i></span><span>${beat.time}</span></div>`;
    beatEl.style.opacity = '1';
  }, 150);
}));

$$('.asset-card').forEach(card => card.addEventListener('click', () => {
  $$('.asset-card').forEach(item => { item.classList.remove('selected'); const icon = $('i', item); if (icon) icon.remove(); });
  card.classList.add('selected');
  card.insertAdjacentHTML('beforeend', '<i>✓</i>');
  notify(`已将「${$('b', card).textContent}」设为当前角色资产`);
}));

function selectShot(card) {
  $$('.shot-card').forEach(item => item.classList.remove('selected'));
  card.classList.add('selected');
  const title = $('.shot-copy b', card).textContent;
  $('.editor-fields h3').textContent = title;
  $('.editor-shot-preview').className = `editor-shot-preview ${$('.shot-visual', card).className.split(' ').slice(1, 2).join(' ')}`;
  $('.editor-shot-preview').innerHTML = `<span>${$('.shot-visual span', card).textContent}</span>`;
}
$$('.shot-card').forEach(card => card.addEventListener('click', () => selectShot(card)));

let extraShot = 4;
$('#addShot').addEventListener('click', () => {
  extraShot += 1;
  const angle = ['仰拍', '俯拍', '摇镜', '跟拍'][extraShot % 4];
  const shot = document.createElement('article');
  shot.className = 'shot-card';
  shot.innerHTML = `<div class="shot-visual shot-${['one','two','three','four'][extraShot % 4]}"><span>${String(extraShot).padStart(2, '0')}</span><i>${angle.slice(0,2).toUpperCase()}</i><div class="scan-line"></div></div><div class="shot-copy"><b>新增叙事镜头</b><small>${angle} · 待设定 · 3.0s</small></div>`;
  $('#shotGrid').appendChild(shot);
  shot.addEventListener('click', () => selectShot(shot));
  $('#shotMetric').textContent = 24 + extraShot - 4;
  notify('已添加空白镜头，请在下方补充镜头语言');
});

$('#deleteShot').addEventListener('click', () => {
  const selected = $('.shot-card.selected');
  if ($$('.shot-card').length <= 1) return notify('至少保留一个镜头');
  selected.remove();
  $('.shot-card').classList.add('selected');
  notify('镜头已移入历史版本，可随时恢复');
});

$('#splitShot').addEventListener('click', () => notify('已将当前镜头拆分为两个 2.1 秒子镜头'));
$('#regenerateShots').addEventListener('click', () => {
  const button = $('#regenerateShots');
  button.textContent = '✦ 编排中…';
  button.disabled = true;
  setTimeout(() => { button.textContent = '↻ 重新编排'; button.disabled = false; notify('镜头导演已生成一套新的节奏方案'); }, 1400);
});

let isRunning = false;
const runBtn = $('#runPipeline');
const runStages = [
  ['剧本架构师', '正在校验人物弧光与冲突密度…'],
  ['视觉设定师', '正在将世界观锚点写入资产圣经…'],
  ['镜头导演', '正在依据节奏曲线重排镜头序列…'],
  ['动画导演', '正在为角色绑定可控动作轨迹…'],
  ['声音总监', '正在匹配角色声线与环境声层次…']
];
function setAgentState(agentName, state) {
  const card = $(`[data-agent="${agentName}"]`);
  if (!card) return;
  card.classList.remove('completed', 'working', 'queued');
  card.classList.add(state);
  const status = $('.agent-status', card);
  status.innerHTML = state === 'working' ? '<i></i>执行中' : state === 'completed' ? '已完成' : '待命';
}
function runPipeline() {
  if (isRunning) return;
  isRunning = true;
  const brief = $('#briefInput').value.trim();
  if (!brief) { notify('请先写下一句创作指令'); isRunning = false; return; }
  runBtn.innerHTML = '<span class="spark">✦</span> Agent 协作中…';
  runBtn.disabled = true;
  runStages.forEach(([name]) => setAgentState(name, 'queued'));
  let index = 0;
  const runNext = () => {
    if (index > 0) setAgentState(runStages[index - 1][0], 'completed');
    if (index === runStages.length) {
      runBtn.innerHTML = '<span class="spark">✦</span> 再次运行 <kbd>⌘ ↵</kbd>';
      runBtn.disabled = false;
      isRunning = false;
      $('#queueCount').textContent = '24 / 24';
      notify('制作链运行完成：24 个镜头已进入交付检查');
      return;
    }
    const [name, message] = runStages[index];
    setAgentState(name, 'working');
    notify(`${name}：${message}`);
    index += 1;
    setTimeout(runNext, 1050);
  };
  runNext();
}
runBtn.addEventListener('click', runPipeline);
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runPipeline(); } });

$$('.inspect-agent').forEach(button => button.addEventListener('click', () => {
  const name = button.closest('.agent-card').dataset.agent;
  const targets = { '剧本架构师': 'script', '视觉设定师': 'world', '镜头导演': 'storyboard', '动画导演': 'factory', '声音总监': 'factory' };
  document.getElementById(targets[name]).scrollIntoView({ behavior: 'smooth', block: 'start' });
  notify(`已定位至「${name}」的可编辑产出`);
}));

const seedanceButton = $('#generateSeedance');
const videoGatewayStatus = $('#videoGatewayStatus');

function getVideoGateway() {
  const value = String(window.YINGJIE_CONFIG?.videoApiBaseUrl || '').trim().replace(/\/$/, '');
  if (!value) return { url: '', error: '尚未配置' };
  try {
    const url = new URL(value);
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!isLocal && url.protocol !== 'https:') throw new Error('生产环境必须使用 HTTPS');
    if (isLocal && !['http:', 'https:'].includes(url.protocol)) throw new Error('网关地址协议无效');
    return { url: url.toString().replace(/\/$/, ''), error: '' };
  } catch (error) {
    return { url: '', error: error.message || '网关地址格式无效' };
  }
}

const videoGatewayConfig = getVideoGateway();
const videoGateway = videoGatewayConfig.url;

function setGatewayStatus(message, state = '') {
  videoGatewayStatus.textContent = message;
  videoGatewayStatus.className = `gateway-status show${state ? ` ${state}` : ''}`;
}

if (videoGateway) {
  setGatewayStatus(`视频网关已配置：${new URL(videoGateway).host}`, 'ready');
} else {
  setGatewayStatus(`Seedance 网关${videoGatewayConfig.error}。部署 video-service 后，在 runtime-config.js 的 videoApiBaseUrl 填入 HTTPS 地址。`);
  setSeedanceButton('✦ 等待网关配置', true);
}

function currentShotPrompt() {
  const shotId = $('.editor-shot-preview span').textContent;
  return `《昨日信号》镜头 ${shotId}：${$('.editor-fields h3').textContent}。雨夜电台直播间，女主抬头望向闪烁的调音台，电影级冷暖对比，克制悬疑氛围，缓慢推进镜头，主体与场景保持一致。`;
}

function setSeedanceButton(label, disabled = false) {
  seedanceButton.textContent = label;
  seedanceButton.disabled = disabled;
}

async function readApiResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { error: `网关返回了无效响应（HTTP ${response.status}）` }; }
}

async function requestVideoGateway(path, options = {}) {
  try {
    const response = await fetch(`${videoGateway}${path}`, { ...options, signal: AbortSignal.timeout(35_000) });
    const payload = await readApiResponse(response);
    if (!response.ok) throw new Error(payload.error || `视频网关请求失败（HTTP ${response.status}）`);
    return payload;
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('视频网关响应超时，请稍后重试');
    if (error instanceof TypeError) throw new Error('无法连接视频网关。请检查 runtime-config.js 地址、HTTPS 和 CORS_ORIGINS 配置');
    throw error;
  }
}

async function pollSeedanceTask(taskId, attempts = 0) {
  if (attempts >= 60) {
    setSeedanceButton('✦ 重试 Seedance 生成');
    return notify(`Seedance 任务 ${taskId} 超过 5 分钟仍未完成`);
  }
  await new Promise(resolve => setTimeout(resolve, 5_000));
  try {
    const task = await requestVideoGateway(`/v1/video-jobs/${encodeURIComponent(taskId)}`);
    if (task.status === 'succeeded' && task.videoUrl) {
      setSeedanceButton('✓ Seedance 成片已就绪');
      $('#queueCount').textContent = '05 / 24';
      notify('Seedance 已生成镜头 01，点击“预览成片”可继续审阅');
      $('#previewTitle').textContent = '《昨日信号》· EP01 · Seedance 样片';
      const previewInfo = $('.preview-details p');
      previewInfo.textContent = 'Seedance 已完成生成。视频外链可能会过期，请及时转存到项目素材库。 ';
      const videoLink = document.createElement('a');
      videoLink.href = task.videoUrl;
      videoLink.target = '_blank';
      videoLink.rel = 'noopener';
      videoLink.textContent = '打开生成视频 ↗';
      previewInfo.append(videoLink);
      return;
    }
    if (['failed', 'cancelled', 'canceled'].includes(task.status)) {
      setSeedanceButton('✦ 重新使用 Seedance 生成');
      return notify(`Seedance 未能生成该镜头：${task.error || task.status}`);
    }
    setSeedanceButton(`✦ Seedance ${task.status || '生成中'}…`, true);
    return pollSeedanceTask(taskId, attempts + 1);
  } catch (error) {
    setSeedanceButton('✦ 重试 Seedance 生成');
    notify(error.message || '查询视频任务失败');
  }
}

async function generateWithSeedance() {
  if (!videoGateway) return notify('Seedance 网关尚未配置，请先部署 video-service 并更新 runtime-config.js');
  setSeedanceButton('✦ 正在提交 Seedance…', true);
  try {
    const task = await requestVideoGateway('/v1/video-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: currentShotPrompt(), ratio: '9:16', duration: 5, resolution: '720p', generateAudio: false })
    });
    if (!task.id) throw new Error(task.error || 'Seedance 未返回任务 ID');
    setSeedanceButton('✦ Seedance 排队中…', true);
    notify(`Seedance 已接收镜头 01，任务 ${task.id}`);
    pollSeedanceTask(task.id);
  } catch (error) {
    setSeedanceButton('✦ 使用 Seedance 生成');
    notify(error.message || 'Seedance 提交失败');
  }
}

seedanceButton.addEventListener('click', generateWithSeedance);
$('#queueAll').addEventListener('click', () => notify('批量出片会产生连续费用，请在生产服务的预算审批队列中执行'));
$$('.queue-play').forEach(button => button.addEventListener('click', () => {
  notify(`镜头 ${button.dataset.shot} 已选中；确认分镜后可单独提交 Seedance`);
}));

let voicePlaying = false;
$('#voicePlay').addEventListener('click', e => { voicePlaying = !voicePlaying; e.currentTarget.textContent = voicePlaying ? 'Ⅱ' : '▷'; notify(voicePlaying ? '正在试听角色音色与台词节奏…' : '已暂停试听'); });

const modal = $('#modalBackdrop');
function openModal() { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); }
function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }
$('#previewBtn').addEventListener('click', openModal);
$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
$('#modalPlay').addEventListener('click', e => { e.currentTarget.textContent = e.currentTarget.textContent === '▶' ? 'Ⅱ' : '▶'; notify('这是交互原型：接入视频生成服务后将在此播放样片'); });

function exportProject() {
  const project = { name: '昨日信号', format: '9:16', brief: $('#briefInput').value, shots: $$('.shot-card').length, status: 'prototype', exportedAt: new Date().toISOString() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'yingjie-project.json'; link.click(); URL.revokeObjectURL(url);
  notify('项目清单已导出，可交给生产服务继续执行');
}
$('#exportBtn').addEventListener('click', exportProject);
$('#modalExport').addEventListener('click', exportProject);
$('#finalizeProject').addEventListener('click', () => { $('#finalizeProject').innerHTML = '✓ 已锁定交付版本'; notify('交付版本已锁定，准备多平台导出包'); });
$('#scriptExpand').addEventListener('click', () => notify('完整剧本视图将在生产版中以可协作编辑器打开'));
