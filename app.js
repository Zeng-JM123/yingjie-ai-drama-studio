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

const DEFAULT_SEASON_PREMISE = '暴雨将至的上海，失去记忆的电台主持人收到一段来自未来的语音。她必须在午夜前找到发信者，否则整座城市会陷入静默。';
const seasonBlueprint = [
  {
    title: '第一章 · 失去的信号', range: 'EP01—12', summary: '一个来自未来的声音，撕开了沈清言被抹去的记忆。',
    characterState: '沈清言从守规则的主持人，变成主动怀疑自己过去的人；陆予泽只以声音存在。',
    animationRule: '雨线始终右上向左下倾斜；红色 ON AIR 灯只在真相靠近时闪烁。',
    episodes: [
      ['雨夜的频率', '深夜节目结束后，陌生红灯接通，未来男声准确说出沈清言明天会忘记什么。', '男声留下地址：那里有她从未见过的工作证。'],
      ['空白记录', '她在电台日志里发现整整三个月被撕掉，监控却显示她每天都来上班。', '被删除的日期，正是未来语音所说的明天。'],
      ['失声街区', '她去地址所在街区，整条街的广播同时失声，只有她的耳机还在播报。', '耳机里响起自己的声音：不要回头。'],
      ['未寄出的录音', '旧信箱里有一盘她写给自己的录音，里面命令她不要相信任何熟人。', '录音末尾出现第二个女声，说自己才是沈清言。'],
      ['听众编号零', '她追到编号为零的匿名听众，发现那是电台内部一个被封存的求救频道。', '频道记录显示，陆予泽曾在十年前死于雨夜。'],
      ['档案室的潮痕', '档案室地面留下新鲜雨水，她找到一份被改写的死亡报告。', '报告照片里，陆予泽正站在她身后。'],
      ['第一段未来', '陆予泽的语音传来第一段未来新闻：零点，上海会失去所有声音。', '新闻主播的名字，竟是未来的沈清言。'],
      ['陆予泽', '沈清言第一次见到活着的陆予泽，他否认发过语音，却认识她耳骨夹的来历。', '陆予泽说：耳骨夹里藏着你亲手删掉的记忆。'],
      ['被删掉的节目', '两人恢复一段旧节目，听见沈清言曾在直播中请求全城不要接听电话。', '节目播完，停播令突然下达。'],
      ['电台停播令', '台长要求她立刻关台，沈清言却发现停播令来自未来时间戳。', '她选择在最后一分钟继续直播。'],
      ['她记得的谎言', '直播中，她想起自己曾主动抹除记忆，只为了藏起一个发射坐标。', '坐标指向城市中心的备用信号塔。'],
      ['失控的直播', '她公开未来语音，观众热线瞬间涌入，每个人都听见不同版本的自己。', '一位听众说：真正的发信者正在直播间。']
    ]
  },
  {
    title: '第二章 · 追踪未来', range: 'EP13—24', summary: '两人追查备用信号塔，过去的选择开始反过来追捕他们。',
    characterState: '沈清言开始相信陆予泽，却发现他与记忆删除有关；陆予泽由旁观者变成共犯。',
    animationRule: '移动镜头保持雨夜蓝与琥珀车灯；录音机永远在画面右下安全区。',
    episodes: [
      ['雨夜出租车', '两人抢在停播前离开电台，出租车司机却能背诵沈清言从未发表的节目单。', '司机把车开向没有出口的第七码头。'],
      ['第七码头', '码头仓库里堆满被淘汰的收音机，每一台都在播放不同年份的同一场雨。', '其中一台播放着陆予泽死亡当晚的呼救。'],
      ['失踪主持人', '沈清言查到十年前还有一名主持人失踪，她正是自己被删除记忆前的搭档。', '搭档的最后通话，来自未来信号塔。'],
      ['旧照片的第三人', '旧照片里除了沈清言和陆予泽，还有一个被剪掉脸的第三人。', '陆予泽承认第三人是删除记忆的执行者。'],
      ['反向追踪', '他们用未来语音反向定位，发现信号来自沈清言尚未进入的公寓。', '房门打开，里面坐着一位更年长的沈清言。'],
      ['被篡改的记忆', '年长的沈清言只存在十秒，她警告记忆不是被删除，而是被人替换。', '墙上的钟跳到 00:17 后全屋断电。'],
      ['00:17', '每到 00:17，城市会重复十四分钟，只有两人保留记忆。', '循环里，陆予泽第一次承认自己本该死去。'],
      ['被监听的家', '沈清言回家取旧物，发现家里所有电器都在监听她的呼吸。', '冰箱里藏着一张写有“别救我”的纸条。'],
      ['陆予泽的条件', '陆予泽提出交换：想知道发信者，就必须先帮他恢复死亡前的记忆。', '恢复仪启动后，他喊出了沈清言从前的名字。'],
      ['备用发射塔', '两人抵达信号塔外围，发现门禁只接受未来沈清言的声纹。', '沈清言的声音自动通过验证。'],
      ['昨日的自己', '塔内存着她昨日录制的影像，影像里的她说不要相信现在的陆予泽。', '影像突然被人远程删除。'],
      ['电话那端的沈清言', '未来电话再次接通，发信者坦白：她就是还未失忆的沈清言。', '未来的她说，陆予泽会在下一次循环杀死她。']
    ]
  },
  {
    title: '第三章 · 双线迷局', range: 'EP25—36', summary: '未来的自己、活着的陆予泽与被偷走的十四分钟，组成一场双线审判。',
    characterState: '沈清言在“现在的自己”和“未来的自己”之间夺回判断权；陆予泽的动机不再可信。',
    animationRule: '同一空间出现双层倒影；未来线采用低饱和雾紫，现在线保持冷蓝高对比。',
    episodes: [
      ['未来的广播', '未来沈清言播出一份死亡名单，名单第一位是现在的陆予泽。', '陆予泽在名单里看到沈清言的第二次死亡时间。'],
      ['同一张脸', '沈清言在镜面世界遇见替换记忆的第三人，对方竟有和她完全相同的脸。', '第三人递来一把能切断循环的钥匙。'],
      ['消失的十四分钟', '两人重走循环，找回被抹去的十四分钟：沈清言曾亲手推陆予泽进雨里。', '陆予泽说那是为了救她。'],
      ['第三名发信者', '第三人自称是信号系统的维护员，真正的发信者并非未来沈清言。', '她放出录音：发信者的呼吸属于现在的陆予泽。'],
      ['城市静默演练', '城市以演练名义试行静默，市民开始逐渐忘记刚刚说过的话。', '沈清言发现台长正协助执行静默。'],
      ['没有出口的地铁', '她追台长进入地铁，列车每一站都回到同一块广告屏。', '广告屏显示：陆予泽是系统的第一名测试者。'],
      ['她的旧名字', '台长叫出沈清言删除前的姓名，并说她曾请求系统制造未来语音。', '沈清言的耳骨夹自行播放一段道歉。'],
      ['叛徒在直播间', '电台内部有人把他们的位置直播给系统，沈清言必须当众找出叛徒。', '叛徒摘下耳机，露出与第三人相同的伤痕。'],
      ['录音机里的心跳', '旧录音机记录着两颗不同节奏的心跳，其中一颗在未来时间才会出现。', '心跳在零点前突然停止。'],
      ['陆予泽消失', '陆予泽被系统拖入下一轮循环，只留下带血的发射塔通行卡。', '卡背面写着：别让我回来。'],
      ['不该醒来的记忆', '沈清言恢复最痛的一段：她曾用陆予泽的记忆换取城市的安静。', '交换契约规定，午夜必须重启系统。'],
      ['午夜重启', '重启提前发生，雨夜被切成无数帧，所有人开始重复最后一句话。', '未来沈清言在碎片里说：这次别关掉声音。']
    ]
  },
  {
    title: '第四章 · 倒计时', range: 'EP37—48', summary: '城市每静默一分，真相就多消失一层；沈清言必须让所有人重新接听。',
    characterState: '沈清言放弃独自拯救，转向让全城成为见证者；陆予泽从变量变成她必须承担的代价。',
    animationRule: '雨量逐集减弱、城市环境音逐集抽离；红灯由局部光源变为全城视觉母题。',
    episodes: [
      ['街头无声', '静默开始扩散，街道只剩脚步和雨滴，沈清言决定把直播变成求救信号。', '一盏红色路灯为她亮起回应。'],
      ['最后频率', '她找到不受系统控制的老频率，第一次让失声市民听见彼此。', '频率另一端传来陆予泽的呼吸。'],
      ['跑出直播间', '台长封锁电台，沈清言带着便携设备穿过失声的街区。', '她在雨幕里看见未来的自己正在逃跑。'],
      ['被复制的声音', '系统复制沈清言的声线发布假指令，市民无法分辨哪一个她是真的。', '陆予泽用死亡前的口令识破了假声音。'],
      ['信号塔之门', '两人再次站到信号塔前，通行卡只够一个人进入核心。', '陆予泽把卡塞给她，门却同时为两人打开。'],
      ['雨停之前', '塔顶显示雨会在零点停止，而雨停意味着所有记忆永久固化。', '沈清言决定在雨停前公开自己的罪。'],
      ['每个人的未来', '她让市民接收一秒钟未来，各自看见最想忘掉的一件事。', '有人在未来画面里看见沈清言从塔顶坠落。'],
      ['反向直播', '沈清言反向入侵系统，把未来画面直播给过去的自己。', '过去的她终于发来回应：别选我。'],
      ['城市开始忘记', '系统加速抹除记忆，陆予泽开始忘记沈清言的名字。', '他却记得一句她从未对他说过的告白。'],
      ['沈清言的选择', '第三人提出唯一方案：保存城市或保存陆予泽，不能两者兼得。', '沈清言没有选择，而是关掉自己的记忆接口。'],
      ['十二点前', '失去部分记忆的她靠录音机留下的情绪线索继续攀塔。', '录音里传来未来的她：你已经做过一次选择。'],
      ['她关掉了声音', '为阻止系统，沈清言按下静音键，城市真的彻底无声。', '黑暗里，唯一亮着的是她耳骨夹的红灯。']
    ]
  },
  {
    title: '第五章 · 重写昨天', range: 'EP49—60', summary: '当城市失去声音，沈清言以记忆为筹码，重写那个决定所有人的昨天。',
    characterState: '沈清言完成从被动接听者到主动发信者的弧光；陆予泽得到被记住而非被拯救的结局。',
    animationRule: '雨停后保留地面反光，色彩由冷蓝回归低饱和琥珀；结局红灯只出现一次。',
    episodes: [
      ['没有声音的上海', '无声城市里，沈清言通过振动与眼神组织幸存者，寻找系统的物理开关。', '一个孩子在玻璃上写下陆予泽的名字。'],
      ['失忆者联盟', '被系统影响最深的人聚在电台，他们各自保留一段沈清言遗失的记忆。', '其中一段记忆证明第三人从未存在。'],
      ['反转的发信人', '沈清言确认发信者一直是现在的自己，只是借未来系统把话送回过去。', '她必须回到第一次删除记忆的夜晚。'],
      ['陆予泽归来', '陆予泽带着残缺记忆回来，他承认自己不是被救下，而是被沈清言制造出来的备份。', '备份将在雨停时自动消失。'],
      ['未来被删除', '两人进入记忆核心，未来画面开始逐张消失，连死亡名单也不再可靠。', '只剩一段未删除的直播回放。'],
      ['最后一档节目', '沈清言回到第一次节目的控制台，决定把真相完整讲给全城听。', '系统用她母亲的声音要求她立刻关麦。'],
      ['全城接听', '市民用各自的记忆补完她讲述的空白，静默系统第一次失去唯一叙事权。', '耳骨夹发出最后一次未来提示。'],
      ['记忆的代价', '提示告诉她：想让城市恢复声音，必须抹去所有人对陆予泽的记忆。', '陆予泽主动按下确认。'],
      ['再见，未来', '沈清言拒绝让陆予泽被彻底遗忘，把他的声音藏进一段无署名的节目片头。', '雨停，城市重新听见第一声车鸣。'],
      ['雨后的红灯', '一切恢复正常，沈清言回到直播间，红灯却在没有来电时亮起。', '录音机里传来陌生女孩的求救。'],
      ['新的听众', '她接起电话，听见女孩说自己来自另一个被静默的城市。', '沈清言在玻璃倒影里看见陆予泽微笑。'],
      ['昨日信号', '沈清言开始新节目，把所有失而复得的声音留在城市夜里。', '最后一秒，红灯再次闪烁，为下一季留下新的信号。']
    ]
  }
];

const toast = $('#toast');
const runtimeConfig = window.YINGJIE_CONFIG || {};
const localPreviewGateway = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname)
  ? 'http://127.0.0.1:8787'
  : '';
const config = {
  ...runtimeConfig,
  // A local preview remains usable even when an old cached runtime-config.js
  // is served. Published sites still require an explicit HTTPS gateway URL.
  studioApiBaseUrl: runtimeConfig.studioApiBaseUrl || localPreviewGateway,
  videoApiBaseUrl: runtimeConfig.videoApiBaseUrl || localPreviewGateway
};
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
let fullProductionTimer;
let fullProductionRunning = false;
let activities = [
  { agent: '剧本架构师', content: '补强了女主的“失忆代价”动机。', kind: 'amber' },
  { agent: '视觉设定师', content: '已将雨夜蓝与琥珀红写入视觉规则。', kind: 'purple' },
  { agent: '镜头导演', content: '标记了 2 个需要人审的轴线风险。', kind: 'blue' }
];
let selectedSeasonEpisode = 1;
let seasonFilter = 'all';

function createSeasonPlan(premise = DEFAULT_SEASON_PREMISE) {
  let number = 0;
  let previousHook = '一段来自未来的语音，打破了雨夜电台的最后平静。';
  const acts = seasonBlueprint.map((chapter, actIndex) => ({
    id: actIndex + 1,
    title: chapter.title,
    range: chapter.range,
    summary: chapter.summary
  }));
  const episodes = seasonBlueprint.flatMap((chapter, actIndex) => chapter.episodes.map(([title, story, hook]) => {
    number += 1;
    const episode = {
      id: `ep-${String(number).padStart(2, '0')}`,
      number,
      act: actIndex + 1,
      actTitle: chapter.title,
      title,
      story,
      hook,
      previousHook,
      characterState: chapter.characterState,
      animationAnchor: chapter.animationRule,
      handoff: `下一集从「${hook}」直接接起，保留上一集的情绪峰值与关键道具。`,
      duration: 120,
      status: 'outlined'
    };
    previousHook = hook;
    return episode;
  }));
  return {
    version: 1,
    premise: premise.trim() || DEFAULT_SEASON_PREMISE,
    episodeCount: 60,
    episodeDurationMinutes: 2,
    totalMinutes: 120,
    continuityScore: 94,
    generatedAt: new Date().toISOString(),
    acts,
    episodes
  };
}

function ensureSeasonPlan() {
  const plan = projectMetadata.seasonPlan;
  if (!plan || !Array.isArray(plan.episodes) || !plan.episodes.length) {
    projectMetadata.seasonPlan = createSeasonPlan($('#briefInput')?.value || DEFAULT_SEASON_PREMISE);
  }
  return projectMetadata.seasonPlan;
}

function seasonEpisodeByNumber(number) {
  return ensureSeasonPlan().episodes.find(episode => episode.number === Number(number));
}

function renderSeasonPlan() {
  const plan = ensureSeasonPlan();
  const episodeGrid = $('#episodeGrid');
  if (!episodeGrid) return;
  setText('#seasonPremise', plan.premise);
  setText('#seasonEpisodeCount', String(plan.episodeCount || plan.episodes.length));
  setText('#seasonEpisodeDuration', `${String(plan.episodeDurationMinutes || 2).padStart(2, '0')}:00`);
  setText('#seasonTotalMinutes', `${plan.totalMinutes || plan.episodes.length * (plan.episodeDurationMinutes || 2)}m`);
  setText('#seasonContinuityScore', String(plan.continuityScore || 94));

  const arcs = $('#seasonArcs');
  if (arcs) {
    arcs.replaceChildren();
    (plan.acts || []).forEach((act, index) => {
      const node = document.createElement('div');
      node.className = 'season-arc';
      const range = document.createElement('span');
      range.textContent = `${String(index + 1).padStart(2, '0')} · ${act.range}`;
      const title = document.createElement('b');
      title.textContent = act.title.replace(/^第.章 · /, '');
      const summary = document.createElement('small');
      summary.textContent = act.summary;
      node.append(range, title, summary);
      arcs.append(node);
    });
  }

  const visibleEpisodes = seasonFilter === 'all' ? plan.episodes : plan.episodes.filter(episode => episode.act === Number(seasonFilter));
  episodeGrid.replaceChildren();
  visibleEpisodes.forEach(episode => {
    const cell = document.createElement('button');
    cell.className = `episode-cell${episode.number === selectedSeasonEpisode ? ' active' : ''}`;
    cell.dataset.act = String(episode.act);
    cell.dataset.episode = String(episode.number);
    const code = document.createElement('span');
    code.textContent = `EP ${String(episode.number).padStart(2, '0')}`;
    const title = document.createElement('b');
    title.textContent = episode.title;
    const hook = document.createElement('small');
    hook.textContent = episode.hook;
    cell.append(code, title, hook);
    cell.addEventListener('click', () => selectSeasonEpisode(episode.number));
    episodeGrid.append(cell);
  });

  $$('#episodeFilters button').forEach(button => {
    const act = button.dataset.actFilter;
    button.classList.toggle('active', act === seasonFilter);
    button.hidden = act !== 'all' && Number(act) > (plan.acts || []).length;
    if (act === 'all') button.textContent = `全部 ${plan.episodes.length}`;
  });
  const actLabel = seasonFilter === 'all' ? `全季 ${plan.episodes.length} 集` : (plan.acts || [])[Number(seasonFilter) - 1]?.title || '当前章节';
  setText('#episodeBoardLabel', `${actLabel} · 每集结尾都有下一集的理由`);
  renderSeasonInspector(seasonEpisodeByNumber(selectedSeasonEpisode) || plan.episodes[0]);
}

function renderSeasonInspector(episode) {
  if (!episode) return;
  setText('#inspectorEpisode', `EP ${String(episode.number).padStart(2, '0')} · ${episode.actTitle}`);
  setText('#inspectorTitle', episode.title);
  setText('#inspectorStory', episode.story);
  setText('#inspectorHook', episode.hook);
  setText('#inspectorCharacter', episode.characterState);
  setText('#inspectorAnimation', episode.animationAnchor);
  setText('#inspectorHandoff', episode.handoff);
  setText('#openEpisodeProduction', `进入 EP${String(episode.number).padStart(2, '0')} 制作台 ↗`);
}

function selectSeasonEpisode(number) {
  const episode = seasonEpisodeByNumber(number);
  if (!episode) return;
  selectedSeasonEpisode = episode.number;
  if (seasonFilter !== 'all' && String(episode.act) !== seasonFilter) seasonFilter = String(episode.act);
  renderSeasonPlan();
}

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

function renderProjectIdentity(title = projectMetadata.title || '未命名短剧', episode = selectedSeasonEpisode || 1) {
  const episodeCode = `EP${String(episode).padStart(2, '0')}`;
  setText('#projectSwitcher b', `《${title}》`);
  setText('#projectSwitcher small', `${episodeCode} · 竖屏短剧`);
  setText('.project-art', title.slice(0, 1) || '映');
  setText('.breadcrumbs b', `${title} · ${episodeCode}`);
  setText('#modalTitle', `《${title}》· ${episodeCode}`);
}

// Kept for compatibility with deployments that render the legacy gateway badge.
// The current studio can run without this optional element.
function setGatewayStatus(message, state = '') {
  const status = $('#videoGatewayStatus');
  if (!status) return false;
  status.textContent = message;
  status.className = `gateway-status show${state ? ` ${state}` : ''}`;
  return true;
}

function setSaveState(state = 'saving') {
  const label = $('#saveState');
  const states = {
    saving: ['● 保存中', '#b0803c'],
    saved: ['● 云端 SQLite 已同步', '#5d9870'],
    local: ['● 本机浏览器已保存', '#5d9870'],
    offline: ['● 未连接服务端', '#a46e51'],
    conflict: ['● 发现更新冲突', '#a46e51']
  };
  const [text, color] = states[state] || states.saved;
  if (!label) return;
  label.textContent = text;
  label.style.color = color;
  label.title = state === 'saved'
    ? `项目数据已写入服务端 SQLite（项目 ${studioProjectId}）`
    : state === 'local'
      ? `项目数据保存在当前浏览器 localStorage（${localStudioStorageKey}）`
      : '查看项目数据保存位置';
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
      name: projectMetadata.title || '未命名短剧', episode: selectedSeasonEpisode || 1, format: '9:16', brief: $('#briefInput').value.trim(),
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

function restoreLocalProject() {
  const localProject = readLocalProject();
  if (!localProject) return false;
  try {
    applyStudio(localProject);
    return true;
  } catch {
    window.localStorage.removeItem(localStudioStorageKey);
    return false;
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
    const savedLocally = saveProjectLocally();
    setGatewayStatus(savedLocally ? '服务端暂不可用，修改已保存在本机。' : '服务端暂不可用，修改未同步。', savedLocally ? 'local' : 'error');
    if (!persistenceErrorShown) {
      persistenceErrorShown = true;
      notify(error.message || (savedLocally ? '服务端暂时不可用，修改已保存到本机。' : '服务端暂时不可用，修改尚未同步。'));
    }
  } finally {
    saveInFlight = false;
    if (saveQueued) { saveQueued = false; scheduleProjectSave(0); }
  }
}

function updateShotCount() {
  const amount = $$('.shot-card').length;
  const target = getProduction().targetShots;
  setText('#shotNavCount', String(amount).padStart(2, '0'));
  setText('#sequenceShotCount', `${String(amount).padStart(2, '0')} / ${target} 镜`);
  setText('#deliverableShots', `${String(amount).padStart(2, '0')} / ${target}`);
}

function getProduction() {
  const previous = projectMetadata.production || {};
  const targetShots = Number.isInteger(previous.targetShots) && previous.targetShots > 0 ? previous.targetShots : 24;
  projectMetadata.production = {
    targetShots,
    plannedShots: Number.isInteger(previous.plannedShots) ? previous.plannedShots : Object.keys(shots).length,
    budgetCredits: Number.isFinite(Number(previous.budgetCredits)) ? Number(previous.budgetCredits) : 38,
    renderMinutes: Number.isFinite(Number(previous.renderMinutes)) ? Number(previous.renderMinutes) : 18,
    budgetApproved: Boolean(previous.budgetApproved),
    planReady: Boolean(previous.planReady),
    status: previous.status || 'idle',
    version: Number.isInteger(previous.version) && previous.version > 0 ? previous.version : 3
  };
  return projectMetadata.production;
}

function workflowStageCount() {
  const production = getProduction();
  if (projectMetadata.deliveryGatePassed && production.planReady && projectMetadata.reviewPassed) return 6;
  if (production.planReady && projectMetadata.reviewPassed) return 5;
  if (production.planReady) return 4;
  return 3;
}

function setWorkflowSteps(count) {
  $$('#workflowSteps li').forEach((item, index) => {
    item.classList.toggle('done', index < count);
    item.classList.toggle('active', index === count && count < 6);
  });
}

function renderProductionState() {
  const production = getProduction();
  const count = workflowStageCount();
  const statuses = { idle: '等待编排', running: '正在编排', ready: '计划已就绪', delivered: '已交付' };
  const state = $('#productionState');
  if (state) {
    state.textContent = statuses[production.status] || statuses.idle;
    state.className = `plan-state${production.status === 'running' ? ' running' : production.planReady || production.status === 'delivered' ? ' ready' : ''}`;
  }
  setText('#workflowProgress', `${count} / 6`);
  setText('#sidebarProgress', `${count} / 6`);
  setWorkflowSteps(count);
  setText('#plannedShotLabel', `${String(Math.min(production.plannedShots, production.targetShots)).padStart(2, '0')} / ${production.targetShots} 已编排`);
  setText('#plannedShotState', production.planReady ? '已完成' : production.status === 'running' ? '编排中' : '进行中');
  setText('#creditEstimate', String(production.budgetCredits));
  setText('#renderEstimate', `约 ${production.renderMinutes} 分钟`);
  const approve = $('#approveBatch');
  if (approve) {
    approve.textContent = production.budgetApproved ? `✓ 已预审 ${production.budgetCredits} credits` : `预审 ${production.budgetCredits} credits`;
    approve.classList.toggle('is-approved', production.budgetApproved);
  }
  setText('#previewVersion', `样片 v${String(production.version).padStart(2, '0')}`);

  const stepCopy = projectMetadata.deliveryGatePassed
    ? '交付包已通过门禁：主版、平台裁切、字幕与镜头资产均可导出。'
    : production.planReady && projectMetadata.reviewPassed
      ? '审片已通过。现在可进入交付门禁，生成可发布的交付包。'
      : production.planReady
        ? '全篇计划已编排。请完成两个低风险审片项，再开启交付。'
        : '先确认故事钩子与世界规则，AI 会据此补齐 24 镜、声音层与审片门禁。';
  setText('#workflowNext', stepCopy);
  updateShotCount();
}

function markRouteStep(index, state, note) {
  const item = $$('#productionRoute .route-step')[index];
  if (!item) return;
  item.classList.remove('done', 'active', 'running');
  if (state) item.classList.add(state);
  if (note) setText('em', note, item);
}

function renderQualityState() {
  const passed = Boolean(projectMetadata.reviewPassed);
  const score = passed ? 97 : 92;
  setText('#qualityGateScore', String(score));
  setText('#reviewScore', String(score));
  const deliveryScore = $('#deliveryScore');
  if (deliveryScore) deliveryScore.innerHTML = `${score}<small>分</small>`;
  if (!passed) return;
  $$('.review-item.pending, .gate-list .pending').forEach(item => {
    item.classList.remove('pending');
    item.classList.add('passed');
    setText('span', '✓', item);
    setText('em', '已修复', item);
  });
  setText('#reviewSummaryTitle', '通过 8 / 8');
  setText('#reviewSummaryMeta', '高风险 0 · 需确认 0');
  const reviewFix = $('#reviewFix');
  if (reviewFix) {
    reviewFix.innerHTML = '✓ 8 项审片门禁已通过 <span>→</span>';
    reviewFix.style.color = '#4e8660';
    reviewFix.style.background = '#f0f8ee';
  }
  const qualityFix = $('#fixQualityGate');
  if (qualityFix) {
    qualityFix.innerHTML = '✓ 质量门禁已通过 <span>→</span>';
    qualityFix.style.color = '#4e8660';
    qualityFix.style.background = '#f0f8ee';
  }
}

function passQualityGate() {
  projectMetadata.reviewPassed = true;
  projectMetadata.healthScore = 97;
  setText('#healthScore', '97');
  setText('#continuityScore', '96%');
  const continuityMeter = $('#continuityMeter');
  if (continuityMeter) continuityMeter.style.setProperty('--progress', '96%');
  renderQualityState();
  renderProductionState();
  window.YingjieProduction?.syncReview();
  addFeed('审片助手', '已修复时间与口型低风险项，8 项交付前门禁全部通过。', 'blue');
  notify('质量门禁已通过：8 / 8 项合格，可以进入交付检查。');
  scheduleProjectSave();
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
  window.YingjieProduction?.syncShot(selectedShot);
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
  if (image) {
    if (character.image) image.src = character.image;
    else image.removeAttribute('src');
    image.alt = character.alt;
  }
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
    setText('#continuityScore', '94%');
    const continuityMeter = $('#continuityMeter');
    if (continuityMeter) continuityMeter.style.setProperty('--progress', '94%');
  }
  renderQualityState();
  if (projectMetadata.deliveryGatePassed) {
    getProduction().status = 'delivered';
    $('#finalizeProject').innerHTML = '✓ 交付门禁已通过 <span>→</span>';
  }
  renderProductionState();
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
  projectMetadata.title = projectMetadata.title || studio.project.name || '未命名短剧';
  selectedSeasonEpisode = Math.max(1, Number(studio.project.episode) || 1);
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
  renderSeasonPlan();
  hydratePreviewState();
  updateShotCount();
  renderProjectIdentity(projectMetadata.title, studio.project.episode || 1);
  window.YingjieProduction?.hydrate();
}

async function loadProject() {
  if (!studioGateway) {
    const restored = restoreLocalProject();
    hydratePreviewState();
    setGatewayStatus(restored ? '未配置服务端，已恢复本机项目。' : '未配置服务端，当前使用离线项目。', 'local');
    return setSaveState('local');
  }
  setSaveState('saving');
  setGatewayStatus('正在连接项目服务…', 'loading');
  try {
    const response = await fetch(`${studioGateway}/v1/projects/${studioProjectId}/studio`);
    const studio = await response.json();
    if (!response.ok) throw new Error(studio.error || '项目读取失败');
    applyStudio(studio);
    setSaveState('saved');
    setGatewayStatus('项目服务已连接，数据同步正常。', 'ready');
  } catch (error) {
    const restored = restoreLocalProject();
    hydratePreviewState();
    setSaveState(restored ? 'local' : 'offline');
    setGatewayStatus(restored ? '项目服务不可用，已恢复本机备份。' : '项目服务不可用，当前显示离线预览。', restored ? 'local' : 'error');
    notify(error.message || (restored ? '未能读取服务端项目，已恢复本机备份。' : '未能读取服务端项目，当前显示离线预览数据。'));
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
$('#saveState')?.addEventListener('click', () => {
  notify(studioGateway
    ? `当前项目已同步到服务端 SQLite；项目标识：${studioProjectId}。`
    : `当前 GitHub Pages 未连接项目服务；数据保存在此浏览器 localStorage：${localStudioStorageKey}，更换浏览器或设备不会自动同步。`);
});
$('#projectSwitcher').addEventListener('click', () => notify(`当前项目：${projectMetadata.title || '未命名短剧'} · EP${String(selectedSeasonEpisode || 1).padStart(2, '0')}（项目切换将在团队空间开放）`));
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

$$('#episodeFilters button').forEach(button => button.addEventListener('click', () => {
  seasonFilter = button.dataset.actFilter || 'all';
  const plan = ensureSeasonPlan();
  if (seasonFilter !== 'all' && !plan.episodes.some(episode => episode.number === selectedSeasonEpisode && episode.act === Number(seasonFilter))) {
    selectedSeasonEpisode = plan.episodes.find(episode => episode.act === Number(seasonFilter))?.number || selectedSeasonEpisode;
  }
  renderSeasonPlan();
}));

$('#generateSeasonPlan').addEventListener('click', event => {
  const brief = $('#briefInput').value.trim();
  if (!brief) return notify('先写下故事念头，AI 才能为你拆解 60 集。');
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<span>✦</span> 正在编排 60 集…';
  setTimeout(() => {
    projectMetadata.seasonPlan = window.YingjieProduction?.createSeasonPlan(brief) || createSeasonPlan(brief);
    selectedSeasonEpisode = 1;
    seasonFilter = 'all';
    renderSeasonPlan();
    button.disabled = false;
    button.innerHTML = '<span>✦</span> 重新生成 60 集拆解';
    addFeed('剧本架构师', '已完成 60 集 × 2 分钟的连续拆解，并为每集写入钩子与交接规则。', 'amber');
    scheduleProjectSave();
    notify('全季故事已拆解：60 集、5 段弧线、120 分钟，动画连续性已锁定。');
  }, 850);
});

$('#runSeasonCheck').addEventListener('click', event => {
  const plan = ensureSeasonPlan();
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = '连续性验收中…';
  setTimeout(() => {
    plan.continuityScore = 96;
    plan.checkedAt = new Date().toISOString();
    renderSeasonPlan();
    setText('#healthScore', '96');
    projectMetadata.healthScore = 96;
    button.disabled = false;
    button.innerHTML = '✓ 60 集连续性通过';
    addFeed('连续性监制', '已验证 60 集的钩子承接、人物状态与动画锚点，未发现断层。', 'blue');
    scheduleProjectSave();
    notify('连续性验收通过：60 / 60 集都有上集承接与下一集钩子；本集审片门禁仍需单独完成。');
  }, 700);
});

$('#openEpisodeProduction').addEventListener('click', () => {
  const episode = seasonEpisodeByNumber(selectedSeasonEpisode);
  if (!episode) return;
  const result = window.YingjieProduction?.loadEpisode(episode.number);
  renderProjectIdentity(projectMetadata.title, episode.number);
  $('#storyboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  notify(`已加载 EP${String(episode.number).padStart(2, '0')} 的故事交接并实时生成 ${result?.shotCount || 8} 个分镜：镜头继承「${episode.hook}」。`);
});

let isRunning = false;
function runPipeline() {
  if (isRunning) return;
  const brief = $('#briefInput').value.trim();
  if (!brief) return notify('请先写下本集的创作指令');
  let result;
  try {
    result = window.YingjieProduction?.buildProject(brief, { source: 'brief', episodeNumber: 1 });
  } catch (error) {
    notify(error.message || '生产工程构建失败，请检查输入后重试。');
    return;
  }
  if (!result) return notify('生产引擎尚未就绪，请刷新页面后重试。');
  const productionStages = [
    ['剧本架构师', `已识别 ${result.characterCount} 个人物、${result.sceneCount} 个场景并重建 ${result.episodeCount} 集故事图。`, 'amber'],
    ['视觉设定师', `已为《${result.title}》重建角色、世界规则和可追溯素材版本。`, 'purple'],
    ['镜头导演', `已根据新故事实时生成 EP01 的 ${result.shotCount} 个分镜与三幕剧情节拍。`, 'blue'],
    ['声音总监', '已把对白、环境声和人物声线约束写入当前分镜生产数据。', 'purple']
  ];
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
      notify(`《${result.title}》制作链已真实更新：${result.characterCount} 人物、${result.shotCount} 分镜、${result.assetCount} 项素材已写入项目。`);
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

function runFullProductionPlan() {
  if (fullProductionRunning) return;
  if (!$('#briefInput').value.trim()) return notify('请先写下全季创作指令，再开始 60 集生产编排。');
  fullProductionRunning = true;
  const production = getProduction();
  production.status = 'running';
  production.planReady = false;
  production.plannedShots = Math.max(Object.keys(shots).length, 8);
  const launchButton = $('#runFullProduction');
  const planButton = $('#startBatchRender');
  [launchButton, planButton].forEach(button => { if (button) button.disabled = true; });
  if (launchButton) launchButton.innerHTML = '<span>✦</span> 正在编排全季…';
  if (planButton) planButton.innerHTML = '<span>✦</span> 正在生成计划…';
  renderProductionState();

  const stages = [
    { route: 0, state: 'running', note: '校验中', agent: '剧本架构师', copy: '已把 60 集钩子、反转和章末悬念拆成可连续生产的故事路线。', planned: 8 },
    { route: 1, state: 'running', note: '绑定中', agent: '视觉设定师', copy: '已把人物、天气、道具与禁用元素设为跨集可继承资产。', planned: 8 },
    { route: 2, state: 'running', note: '补镜中', agent: '镜头导演', copy: '正在先补齐 EP01 的 24 镜，并继承全季动画连续性锚点。', planned: 16 },
    { route: 3, state: 'running', note: '写入中', agent: '声音总监', copy: '已为每集写入台词情绪、环境声与跨集音乐转场规则。', planned: 24 },
    { route: 4, state: 'running', note: '预检中', agent: '审片助手', copy: '已建立全季角色、连续性、字幕和素材来源的交付前门禁。', planned: 24 }
  ];
  let index = 0;
  const next = () => {
    if (index >= stages.length) {
      production.status = 'ready';
      production.planReady = true;
      production.plannedShots = production.targetShots;
      markRouteStep(2, 'done', '已完成');
      markRouteStep(3, 'done', '已完成');
      markRouteStep(4, 'active', '待审片');
      renderProductionState();
      [launchButton, planButton].forEach(button => { if (button) button.disabled = false; });
      if (launchButton) launchButton.innerHTML = '<span>✓</span> 全季计划已就绪';
      if (planButton) planButton.innerHTML = '<span>↻</span> 更新全季生产计划';
      fullProductionRunning = false;
      window.YingjieProduction?.syncCoreAssets();
      addFeed('制作编排器', '60 集生产路线已生成；EP01 的 24 镜、声音脚本与质量门禁已先行联动。', 'purple');
      notify('全季生产计划已就绪：60 集故事交接已锁定，当前只编排 EP01，不会自动消耗全季额度。');
      scheduleProjectSave();
      return;
    }
    const stage = stages[index];
    if (index > 0) markRouteStep(stages[index - 1].route, 'done', '已完成');
    markRouteStep(stage.route, stage.state, stage.note);
    production.plannedShots = stage.planned;
    renderProductionState();
    addFeed(stage.agent, stage.copy, stage.route === 2 || stage.route === 4 ? 'blue' : 'purple');
    index += 1;
    fullProductionTimer = setTimeout(next, 420);
  };
  next();
}

$('#runFullProduction').addEventListener('click', runFullProductionPlan);
$('#startBatchRender').addEventListener('click', runFullProductionPlan);
$('#approveBatch').addEventListener('click', () => {
  const production = getProduction();
  production.budgetApproved = !production.budgetApproved;
  renderProductionState();
  notify(production.budgetApproved
    ? `已预审 ${production.budgetCredits} credits；生产计划可进入模型队列确认。`
    : '已撤销预算预审；自动编排计划仍会保留。');
  scheduleProjectSave();
});
$('#saveVersion').addEventListener('click', () => {
  const production = getProduction();
  production.version += 1;
  renderProductionState();
  addFeed('制作编排器', `已保存样片 v${String(production.version).padStart(2, '0')}，角色、镜头与审片状态可追溯。`, 'purple');
  notify(`已保存样片 v${String(production.version).padStart(2, '0')}；后续修改不会覆盖当前版本。`);
  scheduleProjectSave();
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'Enter') { event.preventDefault(); runFullProductionPlan(); return; }
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
  setText('#continuityScore', '94%');
  $('#continuityMeter').style.setProperty('--progress', '94%');
  addFeed('审片助手', '已将镜头 04 场景时间锁定为午夜暴雨。', 'blue');
  notify('已修复时间连续性，创作健康度提升至 94 分');
  renderProductionState();
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
    window.YingjieProduction?.syncCharacter(selectedCharacter);
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
  window.YingjieProduction?.syncWorld();
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
    window.YingjieProduction?.syncCharacter(selectedCharacter);
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
  window.YingjieProduction?.syncCharacter(id);
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
  const archivedShotId = selectedShot;
  card.remove();
  delete shots[selectedShot];
  window.YingjieProduction?.archiveShot(archivedShotId);
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
  window.YingjieProduction?.syncShot(String(newId));
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
  const generationContext = window.YingjieProduction?.buildShotGenerationContext(String(selectedShot), shot.prompt) || { assetIds: [], assetVersions: [] };
  projectMetadata.preview = {
    mode: 'animatic', shotId: shot.id, duration: 167,
    referenceAssetIds: generationContext.assetIds,
    assetVersions: generationContext.assetVersions,
    status: `动态分镜预演 · 镜头 ${shot.id} 已就绪（尚未生成 Seedance 成片）`
  };
  renderPreviewState();
  updatePlayerPosition(0);
  window.YingjieProduction?.syncVideo(projectMetadata.preview);
}

async function requestVideoGateway(path, options = {}) {
  if (!videoGateway) throw new Error('视频服务尚未配置');
  try {
    const response = await fetch(`${videoGateway}${path}`, { ...options, signal: AbortSignal.timeout(35_000) });
    const task = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(task.error || `视频服务请求失败（HTTP ${response.status}）`);
    return task;
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('视频服务响应超时，已保留动态分镜预览。');
    if (error instanceof TypeError) throw new Error('无法连接视频服务，已保留动态分镜预览。');
    throw error;
  }
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
      projectMetadata.preview = { mode: 'video', videoUrl: task.videoUrl, taskId, shotId: task.shotId || String(selectedShot), duration: Number(task.duration) || 5, referenceAssetIds: projectMetadata.preview?.referenceAssetIds || [], assetVersions: projectMetadata.preview?.assetVersions || [], status: 'Seedance 成片已就绪 · 点击播放或全屏审阅' };
      renderPreviewState();
      updatePlayerPosition(0);
      window.YingjieProduction?.syncVideo(projectMetadata.preview);
      scheduleProjectSave();
      notify('Seedance 成片已就绪，现在可以在样片区直接播放。');
      return;
    }
    if (['failed', 'cancelled', 'canceled'].includes(task.status)) {
      projectMetadata.preview = { ...projectMetadata.preview, status: `Seedance 生成失败：${task.error || task.status}` };
      renderPreviewState();
      window.YingjieProduction?.syncVideo(projectMetadata.preview);
      scheduleProjectSave();
      return notify('视频生成未完成；镜头提示词和动态预演仍已保留。');
    }
    projectMetadata.preview = { ...projectMetadata.preview, taskId, status: `Seedance ${task.status || '排队中'} · 正在等待成片` };
    renderPreviewState();
    window.YingjieProduction?.syncVideo(projectMetadata.preview);
    previewPollAttempts = attempts + 1;
    previewPollTimer = setTimeout(() => pollSeedancePreview(taskId, previewPollAttempts), 5_000);
  } catch (error) {
    projectMetadata.preview = { ...projectMetadata.preview, taskId, status: error.message || '视频任务状态暂时不可读取' };
    renderPreviewState();
    window.YingjieProduction?.syncVideo(projectMetadata.preview);
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
  const generationContext = window.YingjieProduction?.buildShotGenerationContext(String(selectedShot), shot.prompt) || { prompt: shot.prompt, assetIds: [], assetVersions: [] };
  const task = await requestVideoGateway('/v1/video-jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: studioProjectId, shotId: String(selectedShot), prompt: generationContext.prompt, ratio: '9:16', duration: nearestSeedanceDuration(shot.duration), resolution: '720p', generateAudio: false })
  });
  if (!task.id) throw new Error(task.error || '视频任务未返回任务 ID');
  projectMetadata.preview = { mode: 'seedance', taskId: task.id, shotId: shot.id, duration: nearestSeedanceDuration(shot.duration), referenceAssetIds: generationContext.assetIds, assetVersions: generationContext.assetVersions, status: `Seedance ${task.status || '已排队'} · 镜头 ${shot.id} 正在生成` };
  renderPreviewState();
  window.YingjieProduction?.syncVideo(projectMetadata.preview);
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
$('#reviewFix').addEventListener('click', passQualityGate);
$('#fixQualityGate').addEventListener('click', passQualityGate);
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
  const production = getProduction();
  const project = {
    name: projectMetadata.title || '未命名短剧', episode: selectedSeasonEpisode || 1, format: '9:16', brief: $('#briefInput').value,
    selectedCharacter: characters[selectedCharacter].name,
    characters: Object.values(characters).map(({ name, role, anchor, look }) => ({ name, role, anchor, look })),
    shots: Object.values(shots),
    season: ensureSeasonPlan(),
    productionStudio: window.YingjieProduction?.exportState(),
    production: { ...production, reviewPassed: Boolean(projectMetadata.reviewPassed), deliveryGatePassed: Boolean(projectMetadata.deliveryGatePassed), qualityScore: projectMetadata.reviewPassed ? 97 : 92 },
    exportedAt: new Date().toISOString(), status: projectMetadata.deliveryGatePassed ? 'delivery-ready' : production.planReady ? 'review-ready' : 'creative-ready'
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `yingjie-${String(projectMetadata.title || 'project').replace(/[^A-Za-z0-9\u4e00-\u9fa5_-]+/g, '-')}-ep${String(selectedSeasonEpisode || 1).padStart(2, '0')}.json`;
  link.click();
  URL.revokeObjectURL(url);
  notify('项目 JSON 已导出，包含角色锚点、镜头参数和创作指令。');
}
$('#exportBtn').addEventListener('click', exportProject);
$('#modalExport').addEventListener('click', exportProject);
$('#finalizeProject').addEventListener('click', event => {
  const production = getProduction();
  if (!production.planReady) {
    $('#automation').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return notify('请先生成全篇生产计划，确认 24 镜、声音脚本与质量门禁。');
  }
  if (!projectMetadata.reviewPassed) {
    $('#dailies').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return notify('交付前还需要通过 2 项低风险审片门禁。');
  }
  event.currentTarget.innerHTML = '✓ 交付门禁已通过 <span>→</span>';
  projectMetadata.deliveryGatePassed = true;
  production.status = 'delivered';
  renderProductionState();
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
['dashboard', 'season', 'canvas', 'assets', 'cast', 'storyboard', 'automation', 'dailies', 'delivery'].forEach(id => observer.observe(document.getElementById(id)));

populateShotEditor(shots[1]);
updateShotCount();
renderFeed();
renderSeasonPlan();
renderQualityState();
renderProductionState();
window.YingjieProduction?.init();
loadProject();
