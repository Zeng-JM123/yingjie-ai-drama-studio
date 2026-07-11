# 映界 · AI 短剧工场

一个面向 AI 短剧生产的交互式平台原型。它把「创作指令 → 剧本 → 角色与场景 → 分镜 → 动画 → 配音 → 交付」呈现在同一条多 Agent 制作链中。

## 在线体验

推送后，GitHub Actions 会将根目录静态站点发布到 GitHub Pages。部署完成后访问：

`https://<GitHub 用户名>.github.io/<仓库名>/`

## 体验内容

- 创作 Brief 输入与题材/时长/画幅标签（自动保存）
- 60 集 × 2 分钟的连续故事总控：五段故事弧、逐集钩子、人物状态与动画连续性锚点
- 剧本架构师、视觉设定师、镜头导演、动画导演、声音总监的联动状态与制作日志
- 三幕剧本节点、角色资产、世界观视觉锚点（服务端持久化）
- 可选、可新增、可拆分的分镜工作台（服务端持久化）
- EP01 的 24 镜自动生产计划、额度预审、样片版本快照与 8 项交付前质量门禁
- Seedance 异步视频任务入口、渲染队列、声音控制台、样片预览与项目 JSON 导出
- 小屏自适应布局

## 创作能力测评

当前创作台按“从一个念头到 60 集连续短剧、单集生产计划与可审样片”的工作流测评为 **96 / 100**。完整维度、验收点和生产化补强建议见：[创作平台测评](./docs/创作平台测评.md)。

前端仍可双击 `index.html` 查看离线预览；要保存项目数据，需同时启动下方的数据服务并在 `runtime-config.js` 配置其 HTTPS 地址。

## 项目数据服务与数据库

`video-service/` 现在同时提供项目数据 API。它使用 Node.js 内置 SQLite（Node **22.13+**），首次读取项目时会写入一份服务端种子数据；之后角色、分镜、Brief、标签、制作日志、审片状态和交付状态都会在用户操作后自动保存。Seedance 视频任务的项目/镜头归属和任务状态也会入库。

数据库包含 `projects`、`characters`、`shots`、`activities`、`video_jobs` 五张表。项目写入以事务执行，并带 `revision` 乐观锁，避免两个编辑会话相互静默覆盖。

本地启动：

```bash
cd video-service
set -a; source .env; set +a
npm start
```

默认数据库位置为 `video-service/data/yingjie.db`；该目录已被 Git 忽略。启动静态网页时，将网页 Origin 加入 `CORS_ORIGINS`，例如 `http://localhost:8000`。然后在根目录设置：

```js
window.YINGJIE_CONFIG = {
  studioApiBaseUrl: "http://localhost:8787",
  videoApiBaseUrl: "http://localhost:8787",
  projectId: "yesterday-signal-ep01"
};
```

服务端项目接口：

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/v1/projects/{projectId}/studio` | 读取项目完整快照；不存在时初始化种子项目 |
| `PUT` | `/v1/projects/{projectId}/studio` | 原子保存项目、角色、分镜、日志与制作状态 |
| `GET` | `/v1/projects/{projectId}/video-jobs` | 读取已提交视频任务的持久化记录 |

容器部署务必为 `/data` 挂载平台的持久化卷；否则容器重建会丢失 SQLite 文件。公开多用户生产环境还需要在网关前接入登录态和项目级权限校验，CORS 本身不是认证机制。

## 发布到 GitHub Pages

1. 创建 GitHub 仓库并推送本目录的 `main` 分支。
2. 在 GitHub 仓库的 **Settings → Pages** 中将 Source 设为 **GitHub Actions**。
3. 等待 `Deploy static site to GitHub Pages` 工作流完成。

仓库中已含 Pages 工作流，无需构建或安装依赖。

## 技术方案

完整的生产架构、Agent 职责、数据合同、服务边界、安全治理和迭代计划见：[技术方案](./docs/技术方案.md)。Seedance 的服务端接入、环境变量、任务轮询和安全部署见：[Seedance 接入指南](./docs/Seedance接入指南.md)。

## 项目结构

```text
.
├── index.html                 # 单页产品原型
├── styles.css                 # 视觉系统与响应式布局
├── app.js                     # Agent 制作链交互模拟
├── runtime-config.js           # 仅公开的工作台/视频网关地址配置（不含密钥）
├── docs/技术方案.md            # 平台生产级技术方案
├── docs/Seedance接入指南.md    # Seedance 视频服务部署与接口合同
├── video-service/              # SQLite 项目服务与 Seedance 安全网关
└── .github/workflows/pages.yml # GitHub Pages 部署
```

## 说明

当 `runtime-config.js` 配置好已部署的 `video-service` 后，页面会从服务端加载项目，并自动保存创作数据；镜头生成会真实创建视频任务并记录任务归属。模型密钥只可保存在该服务的私密环境变量中，绝不能提交到仓库或写入 GitHub Pages。
