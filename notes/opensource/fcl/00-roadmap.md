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

按上游 **Flexible Collision Library** 整理的中文阅读架。规范仓库：[flexible-collision-library/fcl](https://github.com/flexible-collision-library/fcl)（组织首页 [flexible-collision-library](https://github.com/flexible-collision-library)；API 站点 [flexible-collision-library.github.io](https://flexible-collision-library.github.io/)）。许可证 **BSD**（Willow Garage / Open Source Robotics Foundation，见上游 `LICENSE`）。

> **定位**：概念与接口消化，**不是** README / Doxygen 镜像。站内互链一律 `#/note/opensource/fcl/...`。

## Wiki / Tutorials 覆盖情况

| 项 | 状态（核查于 2026-11-08） |
|----|---------------------------|
| GitHub Wiki 开关 | `has_wiki: true` |
| Wiki 内容 | **空**：`/wiki` 占位；`fcl.wiki.git` **不存在**（ls-remote 失败） |
| 可迁移 Wiki 页 | **0** |
| **Tutorials 系列** | **无**：仓库无 `tutorials/` / `docs/` 教程树；Doxygen Related Pages 仅 Todo / Deprecated |
| 文档替代入口 | [README](https://github.com/flexible-collision-library/fcl/blob/master/README.md) Interfaces · [Doxygen Classes/Files](https://flexible-collision-library.github.io/) · `test/test_fcl_*.cpp`（充当可运行示例） |

因此：**无 Wiki / 无官方教程页级 digest**；本系列加深改写 README + 头文件 brief + 测试地图。若用户口中的「Tutorials」指其它站内仓库，默认仍按 FCL/OMPL 对（与 OMPL Tutorials 同 PR）。

## 建议路径

```mermaid
flowchart LR
  R[00 本路线] --> O[01 概览]
  O --> Q[02 邻近查询管线]
  Q --> S[03 形状与 BVH]
  S --> B[04 宽阶段目录]
  B --> T[05 OcTree 与测试地图]
```

1. [01 概览](#/note/opensource/fcl/01-overview)：能力边界、依赖。  
2. [02 邻近查询](#/note/opensource/fcl/02-proximity-api)：Request/Result + 宽阶段用法。  
3. [03 形状 / BVH](#/note/opensource/fcl/03-shapes-and-geometry) → [04 宽阶段实现](#/note/opensource/fcl/04-broadphase-managers) → [05 OcTree / 测试地图](#/note/opensource/fcl/05-octree-and-tests)。  
4. 上游深挖：对应 `test_fcl_*.cpp` + Doxygen 类页。

## 章节地图

| 章 | 主题 | 笔记 | 上游 |
|----|------|------|------|
| 0 | 本路线 + 文档覆盖 | 本页 | 仓库元数据 / Wiki 占位 |
| 1 | 库概览 | [01](#/note/opensource/fcl/01-overview) | README 能力与安装 |
| 2 | 查询 API 心智模型 | [02](#/note/opensource/fcl/02-proximity-api) | README Interfaces |
| 3 | 形状、BVH、CollisionGeometry | [03](#/note/opensource/fcl/03-shapes-and-geometry) | `geometry/` 头文件 |
| 4 | 宽阶段管理器目录 | [04](#/note/opensource/fcl/04-broadphase-managers) | `broadphase/` |
| 5 | OcTree + 测试/文档地图 | [05](#/note/opensource/fcl/05-octree-and-tests) | `OcTree` · `test/` · Doxygen |

## 站内交叉

- 开源索引：[`#/opensource`](#/opensource)（按 `source: FCL` 分组）  
- 阅读架总约：[opensource/00-roadmap](#/note/opensource/00-roadmap)  
- 运动规划常与 FCL 搭配：[OMPL 路线](#/note/opensource/ompl/00-roadmap)（含官方 Tutorials 全量 digest）
