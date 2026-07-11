import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const MAX_ITEMS = 100;
const MAX_ACTIVITY_ITEMS = 50;

export function createProjectStore(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      episode INTEGER NOT NULL,
      format TEXT NOT NULL,
      brief TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      beats_json TEXT NOT NULL,
      selected_character_id TEXT,
      metadata_json TEXT NOT NULL DEFAULT '{}',
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS characters (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      position INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (project_id, id)
    );
    CREATE TABLE IF NOT EXISTS shots (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      position INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (project_id, id)
    );
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      agent TEXT NOT NULL,
      content TEXT NOT NULL,
      kind TEXT NOT NULL,
      occurred_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS video_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      shot_id TEXT,
      provider_task_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      request_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS activities_by_project ON activities(project_id, occurred_at DESC);
    CREATE INDEX IF NOT EXISTS video_jobs_by_project ON video_jobs(project_id, updated_at DESC);
  `);

  const statements = {
    project: db.prepare("SELECT * FROM projects WHERE id = ?"),
    characters: db.prepare("SELECT id, payload_json FROM characters WHERE project_id = ? ORDER BY position ASC"),
    shots: db.prepare("SELECT id, payload_json FROM shots WHERE project_id = ? ORDER BY position ASC"),
    activities: db.prepare("SELECT id, agent, content, kind, occurred_at FROM activities WHERE project_id = ? ORDER BY occurred_at DESC LIMIT ?"),
    insertProject: db.prepare("INSERT INTO projects (id, name, episode, format, brief, tags_json, beats_json, selected_character_id, metadata_json, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"),
    updateProject: db.prepare("UPDATE projects SET name = ?, episode = ?, format = ?, brief = ?, tags_json = ?, beats_json = ?, selected_character_id = ?, metadata_json = ?, revision = ?, updated_at = ? WHERE id = ?"),
    deleteCharacters: db.prepare("DELETE FROM characters WHERE project_id = ?"),
    insertCharacter: db.prepare("INSERT INTO characters (project_id, id, position, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"),
    deleteShots: db.prepare("DELETE FROM shots WHERE project_id = ?"),
    insertShot: db.prepare("INSERT INTO shots (project_id, id, position, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"),
    deleteActivities: db.prepare("DELETE FROM activities WHERE project_id = ?"),
    insertActivity: db.prepare("INSERT INTO activities (id, project_id, agent, content, kind, occurred_at) VALUES (?, ?, ?, ?, ?, ?)"),
    projectExists: db.prepare("SELECT 1 FROM projects WHERE id = ?"),
    insertVideoJob: db.prepare("INSERT INTO video_jobs (id, project_id, shot_id, provider_task_id, status, request_json, result_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
    updateVideoJob: db.prepare("UPDATE video_jobs SET status = ?, result_json = ?, updated_at = ? WHERE provider_task_id = ?"),
    videoJobs: db.prepare("SELECT id, shot_id, provider_task_id, status, result_json, created_at, updated_at FROM video_jobs WHERE project_id = ? ORDER BY updated_at DESC LIMIT ?")
  };

  function readProject(projectId) {
    const row = statements.project.get(projectId);
    if (!row) return null;
    return {
      project: {
        id: row.id,
        name: row.name,
        episode: row.episode,
        format: row.format,
        brief: row.brief,
        tags: parseJson(row.tags_json, []),
        beats: parseJson(row.beats_json, {}),
        selectedCharacterId: row.selected_character_id,
        metadata: parseJson(row.metadata_json, {}),
        revision: row.revision,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      characters: statements.characters.all(projectId).map(({ id, payload_json }) => ({ id, ...parseJson(payload_json, {}) })),
      shots: statements.shots.all(projectId).map(({ id, payload_json }) => ({ key: id, ...parseJson(payload_json, {}) })),
      activity: statements.activities.all(projectId, MAX_ACTIVITY_ITEMS).map(row => ({
        id: row.id,
        agent: row.agent,
        content: row.content,
        kind: row.kind,
        occurredAt: row.occurred_at
      }))
    };
  }

  function writeStudio(projectId, input) {
    assertProjectId(projectId);
    const studio = normalizeStudio(input);
    const existing = statements.project.get(projectId);
    if (studio.expectedRevision !== undefined && existing && studio.expectedRevision !== existing.revision) {
      throw databaseError("项目已被其他编辑更新，请刷新后再保存。", 409);
    }

    const now = new Date().toISOString();
    const revision = (existing?.revision || 0) + 1;
    db.exec("BEGIN IMMEDIATE");
    try {
      if (existing) {
        statements.updateProject.run(
          studio.project.name, studio.project.episode, studio.project.format, studio.project.brief,
          JSON.stringify(studio.project.tags), JSON.stringify(studio.project.beats), studio.project.selectedCharacterId,
          JSON.stringify(studio.project.metadata), revision, now, projectId
        );
      } else {
        statements.insertProject.run(
          projectId, studio.project.name, studio.project.episode, studio.project.format, studio.project.brief,
          JSON.stringify(studio.project.tags), JSON.stringify(studio.project.beats), studio.project.selectedCharacterId,
          JSON.stringify(studio.project.metadata), revision, now, now
        );
      }

      statements.deleteCharacters.run(projectId);
      studio.characters.forEach((character, position) => statements.insertCharacter.run(
        projectId, character.id, position, JSON.stringify(withoutKey(character, "id")), now, now
      ));
      statements.deleteShots.run(projectId);
      studio.shots.forEach((shot, position) => statements.insertShot.run(
        projectId, shot.key, position, JSON.stringify(withoutKey(shot, "key")), now, now
      ));
      statements.deleteActivities.run(projectId);
      studio.activity.forEach((item, position) => statements.insertActivity.run(
        item.id || randomUUID(), projectId, item.agent, item.content, item.kind,
        item.occurredAt || new Date(Date.now() - position).toISOString()
      ));
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    return readProject(projectId);
  }

  function getStudio(projectId) {
    assertProjectId(projectId);
    return readProject(projectId);
  }

  function ensureSeed(projectId) {
    assertProjectId(projectId);
    if (!statements.project.get(projectId)) writeStudio(projectId, createSeedStudio());
    return readProject(projectId);
  }

  function recordVideoJob({ projectId, shotId, providerTaskId, input, task }) {
    if (!projectId || !statements.projectExists.get(projectId)) return;
    assertProjectId(projectId);
    const now = new Date().toISOString();
    statements.insertVideoJob.run(
      randomUUID(), projectId, cleanOptionalId(shotId, "shotId"), providerTaskId, task.status || "queued",
      JSON.stringify(input), JSON.stringify(task), now, now
    );
  }

  function updateVideoJob(providerTaskId, task) {
    statements.updateVideoJob.run(task.status || "unknown", JSON.stringify(task), new Date().toISOString(), providerTaskId);
  }

  function listVideoJobs(projectId) {
    assertProjectId(projectId);
    return statements.videoJobs.all(projectId, 50).map(row => ({
      id: row.id,
      shotId: row.shot_id,
      providerTaskId: row.provider_task_id,
      status: row.status,
      ...parseJson(row.result_json, {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  return { ensureSeed, getStudio, writeStudio, recordVideoJob, updateVideoJob, listVideoJobs };
}

function normalizeStudio(input) {
  if (!isRecord(input)) throw databaseError("请求体必须是 JSON 对象。");
  const project = isRecord(input.project) ? input.project : input;
  const characters = arrayOf(input.characters, "characters", MAX_ITEMS).map(normalizeCharacter);
  const shots = arrayOf(input.shots, "shots", MAX_ITEMS).map(normalizeShot);
  const activity = input.activity === undefined ? [] : arrayOf(input.activity, "activity", MAX_ACTIVITY_ITEMS).map(normalizeActivity);
  const characterIds = new Set(characters.map(item => item.id));
  if (characterIds.size !== characters.length) throw databaseError("角色标识不能重复。");
  if (new Set(shots.map(item => item.key)).size !== shots.length) throw databaseError("镜头标识不能重复。");
  const activityIds = activity.filter(item => item.id).map(item => item.id);
  if (new Set(activityIds).size !== activityIds.length) throw databaseError("制作日志标识不能重复。");
  if (project.selectedCharacterId && !characterIds.has(project.selectedCharacterId)) throw databaseError("当前角色必须属于此项目。");
  return {
    expectedRevision: optionalRevision(input.expectedRevision),
    project: {
      name: cleanText(project.name, "project.name", 120),
      episode: boundedInteger(project.episode, "project.episode", 1, 10_000),
      format: cleanText(project.format, "project.format", 20),
      brief: cleanText(project.brief, "project.brief", 10_000),
      tags: arrayOf(project.tags, "project.tags", 24).map(tag => cleanText(tag, "project.tags[]", 80)),
      beats: cleanObject(project.beats, "project.beats", 20_000),
      selectedCharacterId: project.selectedCharacterId ? cleanId(project.selectedCharacterId, "project.selectedCharacterId") : null,
      metadata: project.metadata === undefined ? {} : cleanObject(project.metadata, "project.metadata", 180_000)
    },
    characters,
    shots,
    activity
  };
}

function normalizeCharacter(value) {
  if (!isRecord(value)) throw databaseError("角色必须是对象。");
  return {
    id: cleanId(value.id, "character.id"),
    code: cleanText(value.code || "C-00", "character.code", 40),
    name: cleanText(value.name, "character.name", 120),
    en: cleanText(value.en || "", "character.en", 120),
    role: cleanText(value.role, "character.role", 500),
    image: cleanText(value.image || "", "character.image", 2_000),
    alt: cleanText(value.alt || "", "character.alt", 400),
    tone: cleanText(value.tone || "", "character.tone", 200),
    voice: cleanText(value.voice || "", "character.voice", 200),
    anchor: cleanText(value.anchor || "", "character.anchor", 500),
    look: cleanText(value.look || "", "character.look", 200),
    draft: Boolean(value.draft)
  };
}

function normalizeShot(value) {
  if (!isRecord(value)) throw databaseError("镜头必须是对象。");
  return {
    key: cleanId(value.key, "shot.key"),
    id: cleanText(value.id, "shot.id", 40),
    title: cleanText(value.title, "shot.title", 160),
    cls: cleanText(value.cls || "shot-one", "shot.cls", 80),
    size: cleanText(value.size, "shot.size", 80),
    movement: cleanText(value.movement, "shot.movement", 80),
    duration: cleanText(String(value.duration), "shot.duration", 20),
    emotion: cleanText(value.emotion, "shot.emotion", 120),
    note: cleanText(value.note || "", "shot.note", 1_000),
    caption: cleanText(value.caption || "", "shot.caption", 1_000),
    prompt: cleanText(value.prompt || "", "shot.prompt", 5_000)
  };
}

function normalizeActivity(value) {
  if (!isRecord(value)) throw databaseError("制作日志必须是对象。");
  return {
    id: value.id ? cleanId(value.id, "activity.id") : undefined,
    agent: cleanText(value.agent, "activity.agent", 80),
    content: cleanText(value.content, "activity.content", 1_000),
    kind: cleanText(value.kind || "purple", "activity.kind", 40),
    occurredAt: value.occurredAt ? cleanTimestamp(value.occurredAt) : undefined
  };
}

function createSeedStudio() {
  return {
    project: {
      name: "昨日信号", episode: 1, format: "9:16",
      brief: "暴雨将至的上海，失去记忆的电台主持人收到一段来自未来的语音。她必须在午夜前找到发信者，否则整座城市会陷入静默。",
      tags: ["都市悬疑", "女性向"],
      beats: {
        act1: { code: "SCENE 01 · INT. 电台直播间 · 深夜", title: "“有人在未来，等着你接听。”", body: "最后一档节目结束，调音台忽然亮起陌生的红灯。雨声里，有人喊出了她的名字。", tension: "58%", time: "00:00 — 00:32" },
        act2: { code: "SCENE 04 · EXT. 南京东路 · 午夜", title: "“别相信你听见的每一个人。”", body: "录音里的男声引她穿过空无一人的街区。所有广告屏同时切换成她失去的那段记忆。", tension: "82%", time: "00:32 — 01:41" },
        act3: { code: "SCENE 08 · EXT. 信号塔 · 黎明前", title: "“未来的发信者，就是现在的你。”", body: "天亮之前，她终于明白：被删除的不是记忆，而是一个还没有发生的选择。", tension: "96%", time: "01:41 — 02:47" }
      },
      selectedCharacterId: "qingyan",
      metadata: { status: "creative-ready" }
    },
    characters: [
      { id: "qingyan", code: "C-01", name: "沈清言", en: "SHEN QINGYAN", role: "28 岁 · 深夜电台主持人 · 记忆被人为抹除", image: "./assets/character-shen-qingyan.png", alt: "沈清言的角色三视图预览", tone: "克制 / 警觉", voice: "林霁 · 低语感", anchor: "耳骨夹 · 录音机", look: "雨夜·风衣", draft: false },
      { id: "yuze", code: "C-02", name: "陆予泽", en: "LU YUZE", role: "31 岁 · 前声音工程师 · 未来语音的发信者", image: "./assets/character-lu-yuze.png", alt: "陆予泽的角色三视图预览", tone: "压抑 / 守望", voice: "季临 · 低沉感", anchor: "旧收音机 · 右眉旧伤", look: "雨夜·夹克", draft: false }
    ],
    shots: [
      { key: "1", id: "01", title: "雨夜的频率", cls: "shot-one", size: "特写 CU", movement: "缓慢推进", duration: "4.2", emotion: "克制、悬疑", note: "（雨声渐强）“你终于接起来了。”", caption: "沈清言抬眼，红色信号灯在瞳孔中闪烁。", prompt: "深夜电台直播间，雨水划过玻璃，沈清言忽然抬眼望向闪烁的调音台，克制悬疑，电影级冷暖对比，镜头缓慢推进。" },
      { key: "2", id: "02", title: "最后一位听众", cls: "shot-two", size: "中景 MS", movement: "静置", duration: "5.0", emotion: "克制、悬疑", note: "“这里是 FM 97.4，请问你是？”", caption: "她独自坐在调音台前，耳机里只剩呼吸声。", prompt: "夜间电台直播间，中景，沈清言面对空荡的控制台，耳机中传来陌生呼吸，静置镜头，克制的悬疑感。" },
      { key: "3", id: "03", title: "来自未来的声音", cls: "shot-three", size: "特写 CU", movement: "缓慢推进", duration: "3.4", emotion: "紧张、失控", note: "（红灯闪烁，电流声）", caption: "红灯亮起，黑暗里的声音第一次接通。", prompt: "调音台红色信号灯大特写，黑暗电台空间，微小电流噪点，未知声音接通的瞬间，电影感推近。" },
      { key: "4", id: "04", title: "城市静默之前", cls: "shot-four", size: "全景 WS", movement: "横移", duration: "6.1", emotion: "克制、悬疑", note: "（街头广播同时失声）", caption: "雨幕中的城市屏幕逐个熄灭。", prompt: "雨夜上海未来感街区全景，广告屏逐个熄灭，午夜蓝与雾紫，横向移动镜头，压迫而安静。" },
      { key: "5", id: "05", title: "屏幕上的旧照片", cls: "shot-five", size: "越肩 OTS", movement: "静置", duration: "3.0", emotion: "脆弱、温暖", note: "“这张照片……我见过。”", caption: "旧照片里的人，正从屏幕深处望向她。", prompt: "电台主持人越肩看向故障显示器，屏幕出现模糊旧照片，暖色记忆与冷色现实交错，静置镜头。" },
      { key: "6", id: "06", title: "驶向信号源", cls: "shot-six", size: "全景 WS", movement: "跟拍", duration: "4.8", emotion: "紧张、失控", note: "（引擎声穿过暴雨）", caption: "出租车切开积水，驶向没有标记的信号塔。", prompt: "暴雨夜的出租车从未来上海街区掠过，湿润路面反射蓝紫霓虹，跟拍镜头，紧张加速。" },
      { key: "7", id: "07", title: "故障屏上的倒影", cls: "shot-two", size: "中景 MS", movement: "横移", duration: "3.6", emotion: "克制、悬疑", note: "（屏幕闪过她不认识的自己）", caption: "玻璃里出现一个迟半拍的倒影。", prompt: "雨夜玻璃上的人物倒影与本人动作不同步，电台空间，中近景横移，克制的诡异感。" },
      { key: "8", id: "08", title: "信号塔亮起", cls: "shot-four", size: "全景 WS", movement: "缓慢推进", duration: "5.2", emotion: "紧张、失控", note: "（远处传来同一段录音）", caption: "信号塔在雨幕中亮起第一束红光。", prompt: "暴雨中孤立的信号塔全景，顶部红灯穿透雨雾，末日悬疑感，镜头缓慢推进。" }
    ],
    activity: [
      { agent: "剧本架构师", content: "补强了女主的“失忆代价”动机。", kind: "amber" },
      { agent: "视觉设定师", content: "已将雨夜蓝与琥珀红写入视觉规则。", kind: "purple" },
      { agent: "镜头导演", content: "标记了 2 个需要人审的轴线风险。", kind: "blue" }
    ]
  };
}

function assertProjectId(value) { cleanId(value, "projectId"); }
function cleanOptionalId(value, name) { return value ? cleanId(value, name) : null; }
function cleanId(value, name) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw databaseError(`${name} 格式不正确。`);
  return value;
}
function cleanText(value, name, max) {
  if (typeof value !== "string") throw databaseError(`${name} 必须是字符串。`);
  const result = value.trim();
  if (result.length > max) throw databaseError(`${name} 不能超过 ${max} 个字符。`);
  return result;
}
function boundedInteger(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw databaseError(`${name} 必须在 ${min} 到 ${max} 之间。`);
  return value;
}
function optionalRevision(value) {
  if (value === undefined || value === null) return undefined;
  return boundedInteger(value, "expectedRevision", 1, Number.MAX_SAFE_INTEGER);
}
function arrayOf(value, name, max) {
  if (!Array.isArray(value) || value.length > max) throw databaseError(`${name} 必须是最多 ${max} 项的数组。`);
  return value;
}
function cleanObject(value, name, maxLength) {
  if (!isRecord(value)) throw databaseError(`${name} 必须是对象。`);
  const serialized = JSON.stringify(value);
  if (serialized.length > maxLength) throw databaseError(`${name} 内容过大。`);
  return value;
}
function cleanTimestamp(value) {
  const time = new Date(value);
  if (Number.isNaN(time.valueOf())) throw databaseError("activity.occurredAt 不是有效时间。");
  return time.toISOString();
}
function isRecord(value) { return value && typeof value === "object" && !Array.isArray(value); }
function parseJson(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
function withoutKey(value, key) { const { [key]: _, ...rest } = value; return rest; }
function databaseError(message, status = 400) { const error = new Error(message); error.status = status; return error; }
