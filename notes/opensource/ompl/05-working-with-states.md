---
title: 状态与状态空间操作
tags: [opensource, ompl, tutorials, beginner, states]
topic: opensource
updated: 2026-11-08
order: 5
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/workingWithStates.html
---

# 状态与状态空间操作

> **出处**：[Tutorials · Working with states and state spaces](https://ompl.kavrakilab.org/workingWithStates.html)  
> **说明**：日常代码优先 `ScopedState`；专家路径才手写 `allocState` / `freeState`。

## 分配：简单 vs 专家

```cpp
// 推荐：离开作用域自动释放
ob::StateSpacePtr space(new T());
ob::ScopedState<> state(space);
// 或带类型：ob::ScopedState<T> state(si);

// 专家：
ob::State *state = si->allocState();
// ...
si->freeState(state);
```

`State` 是抽象基类，结构依赖具体空间；复制 / 相等走 `copyState` / `equalStates`。优先经 `SpaceInformation` 分配，保证与规划用同一空间。

## 读写内容（ScopedState）

```cpp
ob::StateSpacePtr space(new ob::SE2StateSpace());
ob::ScopedState<ob::SE2StateSpace> state(space);
state->setX(0.1);
state->setY(0.2);
state->setYaw(0.0);

ob::ScopedState<> backup = state;  // 内部保持 State*，无 setX
state = backup;
```

复合空间需对分量再 `as<...>()`：

```cpp
ob::CompoundStateSpace *cs = new ob::CompoundStateSpace();
cs->addSubspace(ob::StateSpacePtr(new ob::SO2StateSpace()), 1.0);
cs->addSubspace(ob::StateSpacePtr(new ob::SO3StateSpace()), 1.0);
ob::StateSpacePtr space(cs);

ob::ScopedState<ob::CompoundStateSpace> state(space);
state->as<ob::SO2StateSpace::StateType>(0)->setIdentity();
```

也可用 `operator+` 拼空间：`space = so2 + so3`。

## 部分读写：`<<` / `>>`

SE(2) = \(\mathbb{R}^2\) + SO(2)。可只抽位置分量：

```cpp
ob::ScopedState<ob::SE2StateSpace> fullState(space);
fullState.random();

ob::ScopedState<> pos(space->as<ob::SE2StateSpace>()->getSubspace(0));
pos << fullState;   // 或 fullState >> pos
pos >> fullState;   // 写回
```

## 专家版：`as<>()` + alloc

```cpp
ob::StateSpacePtr space(new ob::RealVectorStateSpace(1));
ob::State *state = space->allocState();
state->as<ob::RealVectorStateSpace::StateType>()->values[0] = 0.1;
ob::State *copy = space->allocState();
space->copyState(copy, state);
space->freeState(state);
space->freeState(copy);
```

## 空间运算符（按**唯一名字**）

对非复合积木 `X,Y,Z,W`：

- `X + Y` → 复合 `C[X,Y]`  
- `C2 - C1` → 差集式去掉已有子空间  
- 状态：`sX >> sXZW` 按名字拷到对应槽；`sX ^ sY` 拼接后再比较  

细节与边界行为以上游页为准；直觉是「按空间名对齐槽位」，不是按下标盲拷。

## 练习指引

1. 用 `SE2` 随机一个状态，抽出 yaw（SO2 子空间）再写回。  
2. 手写 `CompoundStateSpace` 与 `r5 + so2` 各建一次机械臂式空间。  

下一章：[VAMP 机械臂](#/note/opensource/ompl/06-vamp-planning)
