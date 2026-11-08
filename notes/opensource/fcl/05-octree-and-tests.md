---
title: FCL OcTree 与测试 / 文档地图
tags: [opensource, fcl, octree, octomap, tests, docs]
topic: opensource
updated: 2026-11-08
order: 5
source: FCL
sourceUrl: https://github.com/flexible-collision-library/fcl/blob/master/include/fcl/geometry/octree/octree.h
---

# FCL OcTree 与测试 / 文档地图

> **出处**：`OcTree` 头文件 · README · `test/` · [Doxygen](https://flexible-collision-library.github.io/)  
> **Tutorials 核查**：仓库无 `tutorials/`；Wiki 空；站点 Related Pages 仅 Todo / Deprecated——**无独立教程系列**。本页把「可当教程用的官方材料」收成地图。

## OcTree

```text
OcTree : CollisionGeometry
```

- 用 [OctoMap](https://octomap.github.io/) 表示占用；brief：**可编码传感器数据的不确定性**  
- **仅当构建时找到 octomap** 才编译进库；安装后看 `fcl/config.h` 的 `FCL_HAVE_OCTOMAP`  
- 构造时可给分辨率；随后当作普通 `CollisionGeometry` 挂到 `CollisionObject`，与 mesh / 形状做碰撞或距离  

窄阶段有专门 traversal：`narrowphase/detail/traversal/octree/`（octree↔octree / mesh / shape 的 collision 与 distance）。

测试入口（名称以树内为准）：

- `test_fcl_octomap_collision.cpp`  
- `test_fcl_octomap_distance.cpp`  
- `test_fcl_octomap_cost.cpp`  

## 官方「教程」替代品：test 地图

| 主题 | 建议先读的测试 |
|------|----------------|
| 基础 collide / distance | `test_fcl_collision.cpp` · `test_fcl_distance.cpp` · `test_fcl_simple.cpp` |
| CollisionObject | `test_fcl_collision_object.cpp` |
| 宽阶段 | `test_fcl_broadphase_collision_*.cpp` · `test_fcl_broadphase_distance.cpp` · `test/broadphase/` |
| Frontlist | `test_fcl_frontlist.cpp` |
| BVH | `test_fcl_bvh_models.cpp` · `test_fcl_generate_bvh_model_deferred_finalize.cpp` |
| 形状一致性 | `test_fcl_geometric_shapes.cpp` · `test/geometry/shape/test_*.cpp` |
| 形状对算法 | `test_fcl_sphere_*.cpp` · `test_fcl_box_box.cpp` · `test_fcl_capsule_*.cpp` … |
| 符号距离等 | `test_fcl_signed_distance.cpp` |
| OctoMap | 上节三个 `octomap_*` |

README 还点名：`test_fcl_collision` / `distance` / `broadphase` / `frontlist` / `octomap`。

## 文档站能提供什么

| 入口 | 内容 |
|------|------|
| [Main Page](https://flexible-collision-library.github.io/) | Doxygen 门户 |
| [Classes](https://flexible-collision-library.github.io/annotated.html) | API 类表（主「手册」） |
| [Files](https://flexible-collision-library.github.io/files.html) | 头文件浏览 |
| Related Pages | **无教程**；Todo / Deprecated 列表 |

学习路径建议：本架 01→05 → 按上表打开对应 `test_*.cpp` → 回 Doxygen 查 Request 字段。

## 练习指引

1. 确认本地 / CI 的 `FCL_HAVE_OCTOMAP`，再决定是否跑 octomap 测试。  
2. 从 `test_fcl_simple.cpp` 抄最小 collide，改成自己的两个 `Sphere`。  

返回：[路线](#/note/opensource/fcl/00-roadmap) · 搭档：[OMPL Tutorials](#/note/opensource/ompl/00-roadmap)
