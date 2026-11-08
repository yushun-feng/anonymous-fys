---
title: FCL 宽阶段管理器目录
tags: [opensource, fcl, broadphase, aabb]
topic: opensource
updated: 2026-11-08
order: 4
source: FCL
sourceUrl: https://github.com/flexible-collision-library/fcl/tree/master/include/fcl/broadphase
---

# FCL 宽阶段管理器目录

> **出处**：[`include/fcl/broadphase/`](https://github.com/flexible-collision-library/fcl/tree/master/include/fcl/broadphase) · README Interfaces  
> **基类**：`BroadPhaseCollisionManager`——加速 N 物体间碰撞 / 距离，并支持自碰、自距离、与另一组 M 物体查询。

## 推荐默认

README：**`DynamicAABBTreeCollisionManager`** 通常性能最好。另有 array 变体 `DynamicAABBTreeCollisionManagerArray`。

## 实现一览（公开头文件）

| 类 | 头文件 | 一句话 |
|----|--------|--------|
| `NaiveCollisionManager` | `broadphase_bruteforce.h` | 暴力 N-body；对照基线 |
| `DynamicAABBTreeCollisionManager` | `broadphase_dynamic_AABB_tree.h` | 动态 AABB 树（首选） |
| `DynamicAABBTreeCollisionManagerArray` | `broadphase_dynamic_AABB_tree_array.h` | 动态 AABB 树数组版 |
| `SaPCollisionManager` | `broadphase_SaP.h` | Rigorous Sweep-and-Prune |
| `SSaPCollisionManager` | `broadphase_SSaP.h` | Simple SAP |
| `IntervalTreeCollisionManager` | `broadphase_interval_tree.h` | 区间树 |
| `SpatialHashingCollisionManager` | `broadphase_spatialhash.h` | 空间哈希 |
| （连续）`BroadPhaseContinuousCollisionManager` | `broadphase_continuous_collision_manager.h` | 宽阶段 CCD 管理器基类 |

默认回调与数据：`default_broadphase_callbacks.h`（README 中的 `DefaultCollisionFunction` / `DefaultDistanceFunction` 及 Data 容器）。

## 生命周期

```cpp
BroadPhaseCollisionManagerf* mgr = new DynamicAABBTreeCollisionManagerf();
mgr->registerObjects(objects);   // 或 registerObject 逐个
mgr->setup();                    // 按实现初始化加速结构
mgr->collide(other, &data, DefaultCollisionFunction);
mgr->update();                   // 物体动了要更新；可指定脏对象集合
// unregister / clear 按需
```

查询形态回顾：[02](#/note/opensource/fcl/02-proximity-api)——组对组、自碰、单物体对组。

## 选型直觉（非基准结论）

- 调试 / 正确性对照 → Naive  
- 一般动态场景 → Dynamic AABB Tree  
- 轴对齐、沿轴排序友好 → 试 SAP / SSaP  
- 均匀空间分布、单元大小好定 → Spatial Hash  
- 需要 CCD 宽阶段 → 看 continuous manager 头文件与测试  

真实选择以你场景下的 `test_fcl_broadphase_*` / 自测为准。

## 练习指引

1. 同一组物体对 Naive vs DynamicAABBTree 做 `collide` 计时曲线（物体数 10→1000）。  
2. 移动部分物体后只 `update` 脏集，确认结果与全量 `setup` 一致。  

下一章：[OcTree 与测试地图](#/note/opensource/fcl/05-octree-and-tests)
