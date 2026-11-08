---
title: 通用规划上下文装配
tags: [opensource, ompl, tutorials, intermediate, setup]
topic: opensource
updated: 2026-11-08
order: 13
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/genericPlanning.html
---

# 通用规划上下文装配

> **出处**：[Tutorials · Generic instructions for setting up a planning context](https://ompl.kavrakilab.org/genericPlanning.html)  
> **说明**：把「空间 →（控制）→ SpaceInformation → ProblemDefinition → Planner」串成清单；日常仍优先 `SimpleSetup`。

## 1. 状态空间

选 / 实现 `ob::StateSpace`（见 [14](#/note/opensource/ompl/14-implementing-state-spaces)）。改采样或距离可再特化。

```cpp
ob::StateSpacePtr space(new ob::SE2StateSpace());
// setBounds ...
```

## 2. 控制空间（有微分约束时）

`oc::ControlSpace`，常用 `RealVectorControlSpace`。须实现 / 设置 `propagate`（继承或 `setPropagationFunction`）。

```cpp
oc::ControlSpacePtr cspace(new oc::RealVectorControlSpace(space));
// set bounds for cspace
```

## 3. SpaceInformation

几何：`ob::SpaceInformation(space)`；带控制：`oc::SpaceInformation` 还需 control space。配置：

- `StateValidityChecker`（类或 `StateValidityCheckerFn`）；未设则全合法  
- 若用默认 `DiscreteMotionValidator`：`setStateValidityCheckingResolution`（未设默认约 1% maximum extent）  
- 最后 `setup()`

```cpp
si->setStateValidityChecker(/* class or fn */);
si->setStateValidityCheckingResolution(0.03);
si->setup();
```

## 4. ProblemDefinition

- ≥1 个起点：`addStartState`  
- `setGoal`（`Goal` / `GoalRegion` / `GoalSampleableRegion` / `GoalState` / `GoalStates`…）  
- 或快捷 `setStartAndGoalStates`（清旧设置、一个起点 + `GoalState`）

状态填法见 [05](#/note/opensource/ompl/05-working-with-states)；目标层级见 [15](#/note/opensource/ompl/15-goal-representation)。

## 5. Planner

构造时注入 SI → `setProblemDefinition` → `setup` → 可反复 `solve(time)`（续算）→ `clear()` 回到 solve 前状态。

```cpp
ob::PlannerPtr planner(new og::SBL(si));
planner->setProblemDefinition(pdef);
planner->solve(1.0);
planner->clear();
```

`og::SimpleSetup` / `oc::SimpleSetup` 可一站式装配上述对象。

## 练习指引

1. 不用 SimpleSetup，手写完整 SE2 几何问题。  
2. 同一 SI 上连续两次 `solve`，再 `clear` 后对比行为。  

下一章：[实现新状态空间](#/note/opensource/ompl/14-implementing-state-spaces)
