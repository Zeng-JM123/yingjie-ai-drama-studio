# 映界 · AI 短剧工场

一个面向 AI 短剧生产的交互式平台原型。它把「创作指令 → 剧本 → 角色与场景 → 分镜 → 动画 → 配音 → 交付」呈现在同一条多 Agent 制作链中。

## 在线体验

推送后，GitHub Actions 会将根目录静态站点发布到 GitHub Pages。部署完成后访问：

`https://<GitHub 用户名>.github.io/<仓库名>/`

## 体验内容

- 创作 Brief 输入与题材/时长/画幅标签
- 剧本架构师、视觉设定师、镜头导演、动画导演、声音总监的联动状态
- 三幕剧本节点、角色资产、世界观视觉锚点
- 可选、可新增、可拆分的分镜工作台
- 渲染队列、声音控制台、样片预览与项目 JSON 导出
- 小屏自适应布局

这是一个零依赖的前端原型：双击 `index.html` 即可体验；也可以用任意静态 Web Server 在仓库根目录启动。

## 发布到 GitHub Pages

1. 创建 GitHub 仓库并推送本目录的 `main` 分支。
2. 在 GitHub 仓库的 **Settings → Pages** 中将 Source 设为 **GitHub Actions**。
3. 等待 `Deploy static site to GitHub Pages` 工作流完成。

仓库中已含 Pages 工作流，无需构建或安装依赖。

## 技术方案

完整的生产架构、Agent 职责、数据合同、服务边界、安全治理和迭代计划见：[技术方案](./docs/技术方案.md)。

## 项目结构

```text
.
├── index.html                 # 单页产品原型
├── styles.css                 # 视觉系统与响应式布局
├── app.js                     # Agent 制作链交互模拟
├── docs/技术方案.md            # 平台生产级技术方案
└── .github/workflows/pages.yml # GitHub Pages 部署
```

## 说明

原型中的 Agent 状态、视频与配音为前端交互模拟，不会调用模型或生成真实媒体。生产版接入方式和验收链路已写入技术方案，真实调用需要在服务端托管供应商密钥。
