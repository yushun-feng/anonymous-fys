---
title: 开源精选：阅读架与扩展约定
tags: [opensource, reading, roadmap]
topic: opensource
updated: 2026-11-07
order: 0
---

# 开源精选：阅读架与扩展约定

本主题（`opensource` / UI：**开源**）收集**可读、可检索的开源精选摘录**——先从 [HelloGitHub](https://github.com/521xueweihan/HelloGitHub)（[hellogithub.com](https://hellogithub.com)）月刊起步，之后可挂其他杂志、周刊、榜单。浏览页用 Topic 筛选；轻索引见 [`#/opensource`](#/opensource)。

> 定位：**概念/项目兴趣消化**，不是杂志原文镜像。每篇写自己的中文摘要与「为何值得一看」；正文标明出处，**勿**整期照搬 HelloGitHub 或其它来源原文。

## 当前货架

| 来源 | 子目录 | 状态 |
|------|--------|------|
| HelloGitHub 月刊 | [`hellogithub/`](./hellogithub/) | 已摘录若干期 |
| （待定）其它杂志 / Awesome 列表 / 周刊 | `notes/opensource/<source-slug>/` | 规划中 |

## 如何新增一篇摘录

1. 在 `notes/opensource/<source-slug>/` 下新建 `.md`（新来源先建子目录；HelloGitHub 继续放 `hellogithub/`）。
2. 填齐 frontmatter（见下表），`topic` 必须是 `opensource`。
3. 正文写**原创中文**摘录：期号/月份、5–10 个项目亮点（一行「为什么有意思」+ 仓库链接），并链回原文。
4. 本地 `npm run dev`，确认首页 Topic「开源」、[`#/opensource`](#/opensource) 与笔记页都正常。

### Frontmatter（本主题）

```yaml
---
title: HelloGitHub 第 N 期摘录
tags: [opensource, hellogithub, reading]
topic: opensource
updated: YYYY-MM-DD
order: N            # 建议用期号，列表按数字排
source: HelloGitHub # 短标签，索引页按此分组（非 URL）
sourceUrl: https://hellogithub.com/periodical/volume/N
issue: "N"          # 可选；月刊/期号
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` / `tags` / `topic` / `updated` | 是 | 与全库约定一致；`topic: opensource` |
| `order` | 建议 | 同系列内排序；月刊可用期号 |
| `source` | 建议 | **短名称**（如 `HelloGitHub`），供 `#/opensource` 分组 |
| `sourceUrl` | 建议 | 原文/期次页 URL |
| `issue` | 否 | 期号字符串，便于检索 |

> 说明：其它主题里历史字段 `source` 常直接写 URL；本主题用「名称 + `sourceUrl`」分开，方便按来源浏览。

## 阅读约定

- 摘录服务于**快速扫货架**：先看亮点，再决定是否点进仓库深挖。
- 项目链接优先指向 **GitHub / 官方仓库**；必要时再附 HelloGitHub 期次页。
- 后续加新来源时：复制本路线图表格一行 + 新建子目录即可，**不必**改站点路由（Topic 已是 `opensource`）。
