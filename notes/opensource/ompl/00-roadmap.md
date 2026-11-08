---
title: OMPL 阅读路线
tags: [opensource, ompl, roadmap, planning, robotics]
topic: opensource
updated: 2026-11-08
order: 0
source: OMPL
sourceUrl: https://github.com/ompl/ompl
---

# OMPL 阅读路线

按上游 **Open Motion Planning Library** 整理的中文阅读架。规范仓库：[ompl/ompl](https://github.com/ompl/ompl)；文档站 [ompl.kavrakilab.org](https://ompl.kavrakilab.org)；许可证 **3-clause BSD**（Rice University，见上游 `LICENSE`）。

> **定位**：采样式运动规划的概念与文档地图，**不是** Primer / Doxygen 全文镜像。站内互链一律 `#/note/opensource/ompl/...`。

## Wiki 覆盖情况

| 项 | 状态（核查于 2026-11-08） |
|----|---------------------------|
| GitHub Wiki 开关 | 仓库 `has_wiki: false` |
| `/wiki` URL | **302** 回仓库主页（无 Wiki） |
| `ompl.wiki.git` | 不存在 |
| 可迁移 Wiki 页 | **0** |
| 文档替代入口 | [ompl.kavrakilab.org](https://ompl.kavrakilab.org)（Installation / Tutorials / Planners / Spaces / API Overview 等）+ README |

因此本系列**无 Wiki 页级 digest**；概览与文档地图改写自 README 与官方文档站导航。

## 建议路径

```mermaid
flowchart LR
  R[00 本路线] --> O[01 概览]
  O --> D[02 官方文档地图]
  D --> Up[Tutorials / Primer / Demos]
```

1. [01 概览](#/note/opensource/ompl/01-overview)：库定位、依赖、与碰撞库分工。  
2. [02 官方文档地图](#/note/opensource/ompl/02-docs-map)：安装入口、规划器/状态空间分类、`SimpleSetup` 心智模型。  
3. 上游深挖：Tutorials → demos → 自写 planner / 约束规划章节。

## 章节地图

| 章 | 主题 | 笔记 | 上游 |
|----|------|------|------|
| 0 | 本路线 + Wiki 状态 | 本页 | 仓库元数据 |
| 1 | 库概览 | [01](#/note/opensource/ompl/01-overview) | README |
| 2 | 文档站消化 | [02](#/note/opensource/ompl/02-docs-map) | [文档站](https://ompl.kavrakilab.org) 导航页 |

## 站内交叉

- 开源索引：[`#/opensource`](#/opensource)（按 `source: OMPL` 分组）  
- 阅读架总约：[opensource/00-roadmap](#/note/opensource/00-roadmap)  
- 碰撞检测搭档：[FCL 路线](#/note/opensource/fcl/00-roadmap)
