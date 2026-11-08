---
title: OMPL 概览
tags: [opensource, ompl, planning, overview]
topic: opensource
updated: 2026-11-08
order: 1
source: OMPL
sourceUrl: https://github.com/ompl/ompl
---

# OMPL 概览

> **出处**：[ompl/ompl](https://github.com/ompl/ompl) README · [文档站](https://ompl.kavrakilab.org)  
> **说明**：原创中文消化。仓库**未启用** GitHub Wiki（无可迁移 Wiki 页），见 [00-roadmap](#/note/opensource/ompl/00-roadmap)。

## 它解决什么问题

**OMPL** 是面向**采样式运动规划（sampling-based motion planning）**的开源库：在状态空间里采样、连边、搜索，求从起点到目标的可行（或近似最优）路径。

README 级卖点（数量随版本变，以仓库为准）：

- **大量**采样式算法（RRT-Connect、PRM、KPIECE、RRT* 等）  
- **多种**状态空间（欧氏、SE(3) 等）  
- 可扩展：自定义规划器（C++ / Python）、自定义状态空间（C++）  
- 可选 **VAMP**（Vector-Accelerated Motion Planning）做 SIMD 加速碰撞相关路径，追求毫秒级规划  

它**不**自带完整机器人学栈：碰撞几何、正运动学、可视化通常由应用或 MoveIt 等集成层提供。碰撞一侧常见搭档是 [FCL](#/note/opensource/fcl/01-overview)。

## 依赖直觉

**必需**（README）：Boost（≥ 1.68）、CMake（≥ 3.12）、Eigen（≥ 3.3）。

**常见可选**：VAMP（默认启用倾向）、Doxygen、FLANN、Spot（LTL）、yaml-cpp（部分 demo）等。

源码构建骨架：

```bash
git submodule update --init --recursive
mkdir -p build/Release && cd build/Release
cmake ../..
make -j"$(nproc)"
```

Python：仓库亦提供 `pip install ./py-bindings` 路径与 PyPI 包名 `ompl`（以当前 README 为准）。

## 与「完整运动栈」的边界

| 层 | OMPL 角色 | 常见外部 |
|----|-----------|----------|
| 状态空间 / 采样 / 搜索 | 核心 | — |
| 状态是否合法 | 你实现 `StateValidityChecker`（常 internally 调碰撞） | FCL、物理引擎、占栅 |
| 机械臂 / 场景 | 集成 | MoveIt、自研 FK |
| 基准与对比 | Benchmarking 设施 | [Planner Arena](http://plannerarena.org) |

## 何时值得 clone

- 要在**自己的状态空间**上试多种采样规划器，而不是锁死单一算法实现。  
- 需要最优规划 / 约束流形 / 多层规划等文档站已覆盖的进阶主题入口。  
- 做规划器研究：统一 `Planner` / `ProblemDefinition` / benchmark 接口。

## 练习指引

1. 在文档站打开 [Tutorials](https://ompl.kavrakilab.org/tutorials.html)，只看 Beginner 列表，标出你会先跑的两个 demo。  
2. 画一张图：`StateSpace` → `SpaceInformation` → `Planner`，标出你必须自己写的类。  
3. 对照 FCL 概览，写一句「合法性检查」里碰撞库与规划库的分工。

下一章：[官方文档地图](#/note/opensource/ompl/02-docs-map)。
