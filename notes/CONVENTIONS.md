# 笔记约定

本目录是知识库的**唯一事实来源（source of truth）**。根目录下的静态站点仅用于浏览，不反向生成笔记内容。

## 目录结构

```
notes/
├── CONVENTIONS.md          # 本约定
├── cpp/                    # C++ 语言与工程（learncpp/、cherno/、cpp-sort/ 等系列）
├── graphics/               # 图形学（foundation/ 课程向 + 根目录专题短文）
├── gpu/                    # GPU / 并行计算 / API
├── linux/                  # Linux / 系统知识（内存布局、工具链与防护等）
├── ai/                     # AI 史（AI 史记五体导读 + 结构化年表；长文外链上游）
├── opensource/             # 开源精选阅读（HelloGitHub、FCL、OMPL 等；按来源分子目录）
└── daily/                  # 日常节奏 / 习惯 / 长期原则（与技术分栏）
```

- 每个主题一个文件夹：`cpp/`、`graphics/`、`gpu/`、`linux/`、`ai/`、`opensource/`、`daily/`。
- 笔记为 Markdown 文件（`.md`），文件名使用短横线小写，例如 `raii-basics.md`。
- 系列课程可再建子目录（如 `cpp/learncpp/`、`cpp/cpp-sort/`、`graphics/foundation/`、`opensource/hellogithub/`、`opensource/fcl/`、`opensource/ompl/`）；浏览页按系列排序。
- 配图放在 `public/notes-assets/<topic>/`，正文用相对站点根的 `notes-assets/...` 路径引用。
- 不要把生成物、截图缓存或站点构建产物放进 `notes/`。

## Frontmatter

每篇笔记文件开头必须包含 YAML frontmatter：

```yaml
---
title: 笔记标题
tags: [tag-a, tag-b]
topic: cpp          # 必须是 cpp | graphics | gpu | linux | ai | opensource | daily，与所在文件夹一致
updated: 2026-10-31 # ISO 日期 YYYY-MM-DD
---
```

字段说明：

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 显示标题 |
| `tags` | 是 | 字符串数组；浏览页按 tag 筛选 |
| `topic` | 是 | `cpp` / `graphics` / `gpu` / `linux` / `ai` / `opensource` / `daily`，须与父文件夹名一致 |
| `updated` | 是 | 最后更新日期 |
| `source` | 否 | 教材/视频等可写 **URL**；开源阅读笔记写 **短名称**（如 `HelloGitHub`），配合 `sourceUrl` |
| `sourceUrl` | 否 | 原文 URL（开源阅读主题建议填；其它主题可省略） |
| `issue` | 否 | 月刊/期号（开源阅读主题可选） |
| `order` | 否 | 浏览列表中的数字排序键；省略时由文件名推断（`ch12-...`、`00-...` 等） |

## 列表排序

浏览首页按 **topic → 系列目录（`cpp` 下：`learncpp` → `cherno` → `cpp-sort`）→ 章节号 `order` → 路径** 排序，不按修改日期或标题字符串。系列内文件名建议带数字前缀，例如 `ch00-...`、`ch01-...`、`01-welcome-...`。

## 正文建议

- **LearnCpp（`cpp/learncpp/`）**：写**完整、专业的中文学习笔记**，覆盖对应教程章节——概念讲解、关键语法/API、可运行示例、易错点、练习指引。允许较长的教材式篇幅；用自己的话组织，勿逐字照搬源站。与 The Cherno C++ 视频重叠的主题，在章内用「**Cherno 视角补充**」融入工程直觉（改写，不照抄公开笔记仓库）。与《C++那些事》（[Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) / [在线站](https://light-city.github.io/stories_things/)）重叠的主题，在章内用「**《C++那些事》视角补充**」融入面试/深挖口径（改写织入，**不**另建镜像目录树、不整篇搬迁）。
- **Cherno（`cpp/cherno/`）**：**剧集索引 / 薄交叉链接**——指向播放列表与 LearnCpp 落点章，避免与 LearnCpp 长文重复；详细讲解以 LearnCpp 为准。
- **cpp-sort（`cpp/cpp-sort/`）**：[Morwenn/cpp-sort](https://github.com/Morwenn/cpp-sort) Wiki 的**全量中文学习笔记**（[路线图](#/note/cpp/cpp-sort/00-roadmap) 覆盖 Home / Quickstart / Sorters / Adapters / Probes / 教程 / Tooling / Benchmarks / Changelog / Research 等全部内容页）。阶段 A 建心智模型，阶段 B–D 按 Wiki 侧栏消化。原创改写并链上游；**勿**整页镜像英文文档。系列内互链用 `#/note/cpp/cpp-sort/...` hash 路由（Pages 安全），勿用相对 `.md` 路径。
- **图形学基础（`graphics/foundation/`）**：以 [LearnOpenGL](https://learnopengl.com/) 与 *Fundamentals of Computer Graphics*（第 5 版，简称 FoCG）为主线的**完整中文学习笔记**——概念、坐标/矩阵约定、OpenGL/GLSL 要点、易错、练习指引；理论（FoCG）与实践（LearnOpenGL）在章内交织改写，**勿**整章照搬教材或教程原文。专题速览（如 PBR）可放在 `graphics/` 根下，并与 foundation 路线互链。
- **Linux / 系统（`linux/`）**：用户态与相关系统知识的**中文速查与心智模型**（进程虚存布局、栈帧、寄存器直觉、防护标志词典、网络协议速览等）。安全相关只写结构与防护动机，**不**写可复现利用步骤。优先配 Mermaid 结构图；可与 `cpp/` 生命周期/堆笔记互链。网络协议可链到站内 [`#/protocols`](#/protocols) 交互演示。
- **日常（`daily/`）**：节奏、微习惯、长期原则等**非技术**短文；与 C++/图形等分栏。宜短小、可检索；可嵌原图，正文仍应用文字对照方便搜索。勿塞隐私或未公开材料。
- **开源精选（`opensource/`）**：HelloGitHub 等杂志/列表的**原创中文摘录**（期号 + 若干项目亮点与仓库链接），以及个别上游库导读（如 `fcl/`、`ompl/`：路线 + 概览；若 GitHub Wiki 有内容则迁为中文 digest，否则改写 README / 官方文档站并在路线页标明 Wiki 覆盖）。按来源分子目录；填短名称 `source`（供 [`#/opensource`](#/opensource) 分组）+ `sourceUrl` / 可选 `issue`。互链用 `#/note/opensource/...`。勿整期或整仓照搬原文。
- **AI 史（`ai/`）**：以 [AI 史记](https://zsjunai.github.io/history-of-ai/)（[zsjunai/history-of-ai](https://github.com/zsjunai/history-of-ai)，CC BY-SA 4.0）为上游。站内保留五体目录：`annals/` 本纪导读、`houses/` / `biographies/` / `treatises/` 索引；大事年表结构化数据在 `src/ai-timeline-data.js`，浏览页 [`#/ai`](#/ai)。**勿**整篇镜像上游本纪/列传长文；事件短句可在署名与 ShareAlike 下导入。见 `notes/ai/ATTRIBUTION.md`。
- 其他主题笔记宜短小、可检索：一题一文，避免无关杂记。
- 代码块标明语言：`cpp`、`glsl`、`hlsl` 等，站点会做高亮。
- **流程图 / 结构图**：优先用 ` ```mermaid ` 代码块（浏览页会渲染）；若环境无法渲染，可辅以 ASCII。图形学笔记（尤其管线章）宜配阶段流程图。
- **数学公式**：浏览页用 KaTeX 渲染。推荐 `$...$`（行内）与 `$$...$$`（独立成行）；亦兼容 LaTeX 风格 `\(...\)` / `\[...\]`（站点会规范化后再渲染）。
- **图形学侧栏**：`topic: graphics` 笔记页右侧为 WebGL 练习面板（VS/FS 或短 JS + 实时画布）；其他 topic 仍为 JS/TS/C++ Playground。
- 可在正文中互链其他笔记。浏览站点路由以 frontmatter / 笔记 id 为准；**系列笔记优先用 `#/note/<id>`**（例如 `#/note/cpp/cpp-sort/00-roadmap`、`#/note/opensource/fcl/00-roadmap`），避免相对 `.md` 在 GitHub Pages 上 404。

## 公开仓库与隐私

本仓库为 **public**，`notes/` 与站点构建结果会对所有人可见。请勿提交：

- 密钥、token、密码、证书、`.env` 等凭据
- 真实邮箱、电话、住址、证件号等个人标识
- 本机绝对路径（如 `/Users/...`、`C:\Users\...`）或内网地址
- 未公开的公司/项目内部材料

示例笔记只放**通用技术占位**内容。若误提交敏感信息，应轮换凭据，并考虑从 git 历史中清除（仅改当前文件不够）。

## 新增笔记流程

1. 在对应 `notes/<topic>/` 下新建 `.md`。
2. 填齐 frontmatter。
3. 本地 `npm run dev` 确认首页列表与详情页渲染正常。
4. 发布前自查：无隐私/密钥，正文保持技术性、可公开。

