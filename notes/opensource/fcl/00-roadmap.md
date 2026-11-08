---
title: FCL 阅读路线
tags: [opensource, fcl, roadmap, collision, robotics]
topic: opensource
updated: 2026-11-08
order: 0
source: FCL
sourceUrl: https://github.com/flexible-collision-library/fcl
---

# FCL 阅读路线

按上游 **Flexible Collision Library** 整理的中文阅读架。规范仓库确认为 [flexible-collision-library/fcl](https://github.com/flexible-collision-library/fcl)（组织首页 [flexible-collision-library](https://github.com/flexible-collision-library)；API 站点 [flexible-collision-library.github.io](https://flexible-collision-library.github.io/)）。许可证为 **BSD**（Willow Garage / Open Source Robotics Foundation 版权声明见上游 `LICENSE`）。

> **定位**：概念与接口消化，**不是** README / Doxygen 镜像。站内互链一律用 `#/note/opensource/fcl/...`（GitHub Pages 安全的 hash 路由）。

## Wiki 覆盖情况

| 项 | 状态（核查于 2026-11-08） |
|----|---------------------------|
| GitHub Wiki 开关 | 仓库 `has_wiki: true` |
| Wiki 内容页 | **空**：`/wiki` 仅为「Create the first」占位；`fcl.wiki.git` 不可克隆 |
| 可迁移 Wiki 页 | **0** |
| 文档替代入口 | 仓库 [README](https://github.com/flexible-collision-library/fcl/blob/master/README.md) + [Doxygen 站点](https://flexible-collision-library.github.io/) |

因此本系列**无 Wiki 页级 digest**；概览与邻近查询管线改写自 README。

## 建议路径

```mermaid
flowchart LR
  R[00 本路线] --> O[01 概览]
  O --> Q[02 邻近查询与宽阶段]
  Q --> Up[上游 README / Doxygen / 测试用例]
```

1. [01 概览](#/note/opensource/fcl/01-overview)：能力边界、形状、依赖。  
2. [02 邻近查询与宽阶段](#/note/opensource/fcl/02-proximity-api)：几何 + 位姿 → request/result 管线；宽阶段管理器。  
3. 上游深挖：`test/test_fcl_*.cpp`、Doxygen Classes。

## 章节地图

| 章 | 主题 | 笔记 | 上游 |
|----|------|------|------|
| 0 | 本路线 + Wiki 状态 | 本页 | 仓库元数据 / Wiki 占位 |
| 1 | 库概览 | [01](#/note/opensource/fcl/01-overview) | README 能力与安装 |
| 2 | 查询 API 心智模型 | [02](#/note/opensource/fcl/02-proximity-api) | README Interfaces |

## 站内交叉

- 开源索引：[`#/opensource`](#/opensource)（按 `source: FCL` 分组）  
- 阅读架总约：[opensource/00-roadmap](#/note/opensource/00-roadmap)  
- 运动规划常与 FCL 搭配：[OMPL 路线](#/note/opensource/ompl/00-roadmap)
