---
title: FCL 概览
tags: [opensource, fcl, collision, overview]
topic: opensource
updated: 2026-11-08
order: 1
source: FCL
sourceUrl: https://github.com/flexible-collision-library/fcl
---

# FCL 概览

> **出处**：[flexible-collision-library/fcl](https://github.com/flexible-collision-library/fcl) README · [API 文档站](https://flexible-collision-library.github.io/)  
> **说明**：原创中文消化；接口与版本以上游为准。GitHub Wiki 当前无内容页，见 [00-roadmap](#/note/opensource/fcl/00-roadmap)。

## 它解决什么问题

**FCL（Flexible Collision Library）** 面向由三角形（及若干解析形状）构成的几何模型对，做**邻近查询（proximity）**：

| 查询 | 直觉 |
|------|------|
| **Collision** | 是否相交；可选返回相交三角形对 |
| **Distance** | 最近距离 / 最近点对 |
| **Tolerance** | 是否近于 / 远于给定容差 |
| **Continuous collision（CCD）** | 运动过程中是否相碰；可选接触时刻 |
| **Contact info** | 碰撞 / CCD 时可返回法向、接触点等（更慢） |

输入模型**不要求**特殊拓扑或邻接表——有顶点与三角形列表即可（mesh soup）。

## 形状与可选能力

支持常见解析体与网格：box、sphere、ellipsoid、capsule、cone、cylinder、convex、half-space、plane、mesh；**octree** 为可选项（依赖 [OctoMap](https://octomap.github.io/)）。

## 依赖与构建直觉

- **必需**：Eigen、[libccd](https://github.com/danfis/libccd)（凸体碰撞；建议用 GitHub 源码树而非过期 zip）  
- **可选**：OctoMap（八叉树碰撞）  
- **构建**：CMake 生成 Linux Makefile 或 Windows VS 工程；`mkdir build && cd build && cmake ..` 后编译  

C++ 接口；跨 Linux / Windows 是上游明确目标。

## 何时值得 clone

- 机器人 / 仿真里需要**统一**离散碰撞、距离与 CCD，而不是只绑一家物理引擎。  
- 已有三角网格或 octomap 点云占据，想接到同一套 request/result API。  
- 与采样式规划库（如 [OMPL](#/note/opensource/ompl/01-overview)）分工：FCL 管「碰不碰 / 多远」，规划器管「怎么走」。

## 练习指引

1. 读 README 的 mesh → `BVHModel` → `CollisionObject` 片段，标出「几何」与「位姿」各自落在哪。  
2. 对照 `collide` / `distance` / `continuousCollide` 三个 request 结构，列出你会改的字段（只要布尔碰撞 vs 要接触点）。  
3. 打开 Doxygen Classes，搜 `BroadPhaseCollisionManager`，记下默认推荐的实现名。

下一章：[邻近查询与宽阶段](#/note/opensource/fcl/02-proximity-api)。
