---
title: 刚体 SE(3) 几何规划入门
tags: [opensource, ompl, tutorials, beginner, se3, simplesetup]
topic: opensource
updated: 2026-11-08
order: 3
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/geometricPlanningSE3.html
---

# 刚体 SE(3) 几何规划入门

> **出处**：[Tutorials · Geometric planning for a rigid body in 3D](https://ompl.kavrakilab.org/geometricPlanningSE3.html)  
> **说明**：原创中文消化；推荐优先走 `SimpleSetup`。命名空间约定：`ob = ompl::base`，`og = ompl::geometric`。

## 你要做的五步

1. 选定空间：**SE(3)** → `ob::SE3StateSpace`  
2. 给其中的 \(\mathbb{R}^3\) 设 `RealVectorBounds`  
3. 定义状态合法性（`StateValidityChecker` / 函数）  
4. 给定点与目标表示  
5. 交给规划器求解（可选简化路径）

官方建议：**用 `og::SimpleSetup`**——内部自动装配 `SpaceInformation` 与 `ProblemDefinition`，不挡深入，也更少漏配。

## SimpleSetup 最短路径

```cpp
namespace ob = ompl::base;
namespace og = ompl::geometric;

bool isStateValid(const ob::State *state);

void planWithSimpleSetup()
{
    auto space(std::make_shared<ob::SE3StateSpace>());

    ob::RealVectorBounds bounds(3);
    bounds.setLow(-1);
    bounds.setHigh(1);
    space->setBounds(bounds);

    og::SimpleSetup ss(space);
    ss.setStateValidityChecker([](const ob::State *state) {
        return isStateValid(state);
    });

    ob::ScopedState<> start(space);
    start.random();
    ob::ScopedState<> goal(space);
    goal.random();
    ss.setStartAndGoalStates(start, goal);

    ob::PlannerStatus solved = ss.solve(1.0);
    if (solved)
    {
        ss.simplifySolution();
        ss.getSolutionPath().print(std::cout);
    }
}
```

`solve` 会触发 `SimpleSetup::setup()` → 默认规划器 → `Planner::setup()` → `SpaceInformation::setup()`（含合法性检查分辨率等运行时参数）。返回值可转布尔：真表示时限内找到解。

## 不用 SimpleSetup（显式装配）

```cpp
void plan()
{
    auto space(std::make_shared<ob::SE3StateSpace>());
    ob::RealVectorBounds bounds(3);
    bounds.setLow(-1);
    bounds.setHigh(1);
    space->setBounds(bounds);

    auto si(std::make_shared<ob::SpaceInformation>(space));
    si->setStateValidityChecker(isStateValid);

    ob::ScopedState<> start(space);
    start.random();
    ob::ScopedState<> goal(space);
    goal.random();

    auto pdef(std::make_shared<ob::ProblemDefinition>(si));
    pdef->setStartAndGoalStates(start, goal);

    auto planner(std::make_shared<og::RRTConnect>(si));
    planner->setProblemDefinition(pdef);
    planner->setup();

    ob::PlannerStatus solved = planner->ob::Planner::solve(1.0);
    if (solved)
    {
        ob::PathPtr path = pdef->getSolutionPath();
        path->print(std::cout);
        // 简化需另建 og::PathSimplifier
    }
}
```

## 练习指引

1. 把 `isStateValid` 先写成恒 `true`，再改成「远离原点某球外」合法，对比路径。  
2. 在 SimpleSetup 上显式 `setPlanner(std::make_shared<og::RRT>(si))`，只换规划器。  
3. 对照 [04 合法性检查](#/note/opensource/ompl/04-state-validation) 理解默认离散边检查分辨率。

下一章：[状态合法性检查](#/note/opensource/ompl/04-state-validation) · 路线：[00](#/note/opensource/ompl/00-roadmap)
