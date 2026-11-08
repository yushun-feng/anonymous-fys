---
title: 实现新状态空间
tags: [opensource, ompl, tutorials, intermediate, statespace]
topic: opensource
updated: 2026-11-08
order: 14
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/implementingStateSpaces.html
---

# 实现新状态空间

> **出处**：[Tutorials · Implementing new state spaces](https://ompl.kavrakilab.org/implementingStateSpaces.html)

## 组合现有空间（最简）

机械臂例：有界 \(\mathbb{R}^5\) + 连续旋转 SO(2)：

```cpp
ob::StateSpacePtr r5(new ob::RealVectorStateSpace(5));
ob::StateSpacePtr so2(new ob::SO2StateSpace());
ob::StateSpacePtr newSpace = r5 + so2;  // 权重默认 1.0
```

或显式 `CompoundStateSpace::addSubspace(component, weight)` 设距离权重：

```cpp
auto *newSpace = new ob::CompoundStateSpace();
newSpace->addSubspace(ob::StateSpacePtr(new ob::RealVectorStateSpace(5)), 1.0);
newSpace->addSubspace(ob::StateSpacePtr(new ob::SO2StateSpace()), 0.5);
```

## 继承现有空间

从 `StateSpace` 或已有实现继承，实现纯虚函数。若引入新状态类型：

- 类型名必须为 **`StateType`**  
- 实现 `allocState` / `freeState`  
- 设唯一 `type_`  
- 常需 `copyState` / `equalStates`  
- 含实数分量可实现 `getValueAddressAtIndex`  
- 需要（反）序列化则实现 `serialize` / `deserialize`

## 继承 CompoundStateSpace

构造函数里 `addSubspace` 即可——`SE2StateSpace` 即此模式。可 `lock()` 防止用户再加子空间。可选在 `registerProjections()` 里注册默认 / 具名投影（供 KPIECE 等）。

完成后务必 `sanityChecks()`。

## 练习指引

1. 用 `+` 与 `addSubspace` 各建一次「5 关节 + 连续转」。  
2. 为自定复合空间注册一个 2D 默认投影（对照 [21](#/note/opensource/ompl/21-projections)）。  

下一章：[目标表示](#/note/opensource/ompl/15-goal-representation)
