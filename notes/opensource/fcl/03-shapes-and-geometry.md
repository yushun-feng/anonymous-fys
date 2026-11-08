---
title: FCL 形状、BVH 与 CollisionGeometry
tags: [opensource, fcl, shapes, bvh, geometry]
topic: opensource
updated: 2026-11-08
order: 3
source: FCL
sourceUrl: https://github.com/flexible-collision-library/fcl/tree/master/include/fcl/geometry
---

# FCL 形状、BVH 与 CollisionGeometry

> **出处**：仓库 [`include/fcl/geometry/`](https://github.com/flexible-collision-library/fcl/tree/master/include/fcl/geometry) · README Interfaces · [Doxygen Classes](https://flexible-collision-library.github.io/annotated.html)  
> **说明**：上游**无** Tutorials 系列；本页从头文件 / README 消化几何层。类型常模板化标量 `S`，示例里的 `*f` 后缀对应 `float` 特化。

## 几何家族

所有可碰撞体最终落在 **`CollisionGeometry`**。常见两支：

| 支 | 代表 | 直觉 |
|----|------|------|
| **解析形状** `geometry/shape/` | `Box` `Sphere` `Ellipsoid` `Capsule` `Cone` `Cylinder` `Convex` `Halfspace` `Plane` `TriangleP` | 直接参数化；凸体窄阶段常走 libccd / GJK |
| **网格 BVH** `geometry/bvh/` | `BVHModel<BV>` | 三角 soup / 点云（点云视为退化网格）的包围体层次 |
| **八叉树** `geometry/octree/` | `OcTree` | 包装 OctoMap；可编码传感器不确定性（见 [05](#/note/opensource/fcl/05-octree-and-tests)） |

`ShapeBase` 是解析形状基类；`utility` / `representation` 辅助几何表示与转换。另有 `geometric_shape_to_BVH_model` 把头文件级工具把形状转成 BVH（需要网格近似时）。

## 解析形状怎么用（心智）

1. `std::make_shared<Sphere>(radius)`（或 Box 半边长等）  
2. 配 `Transform3`  
3. `CollisionObject(geom, tf)`  
4. 走 [02](#/note/opensource/fcl/02-proximity-api) 的 request/result  

窄阶段对特定形状对有专用算法（`narrowphase/detail/primitive_shape_algorithm/`：`sphere_sphere`、`sphere_box`、`box_box`、`capsule_capsule`、`halfspace` / `plane` 等）；其余更多依赖 GJK/EPA 矩阵分发。

## BVHModel

头文件 brief：描述 **mesh 或点云** 的包围层次。

```cpp
typedef BVHModel<OBBRSSf> Model;
std::shared_ptr<Model> geom = std::make_shared<Model>();
geom->beginModel();
geom->addSubModel(vertices, triangles);
geom->endModel();
```

- 模板参数 `BV`：常见 `OBB` / `RSS` / `OBBRSS` / `kIOS` 等（以 Doxygen / 头文件为准）  
- README 默认示例：`OBBRSSf`  
- 构建后可通过 `getBV` / `getNumBVs` 访问节点（为将来压缩留扩展）  
- Frontlist 加速见测试 `test_fcl_frontlist.cpp`

不要求输入网格带邻接或流形拓扑——**三角形列表即可**。

## CollisionObject 边界

`CollisionObject` = 几何 + 位姿。查询 API 吃的是对象指针对，而不是「裸形状」。CCD 还有 `ContinuousCollisionObject` 与目标位姿参数（见 02）。

## 练习指引

1. 同一场景分别用 `Box`/`Sphere` 解析体与等效粗 BVH，对比 `collide` 耗时。  
2. 打开 `test_fcl_geometric_shapes.cpp` / `test/geometry/shape/test_*.cpp`，列一张「形状 ↔ 构造参数」表。  

下一章：[宽阶段管理器目录](#/note/opensource/fcl/04-broadphase-managers)
