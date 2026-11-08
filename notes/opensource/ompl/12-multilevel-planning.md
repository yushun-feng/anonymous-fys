---
title: 多层抽象规划
tags: [opensource, ompl, tutorials, beginner, multilevel]
topic: opensource
updated: 2026-11-08
order: 12
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/multiLevelPlanningTutorial.html
---

# 多层抽象规划

> **出处**：[Multilevel Planning 导读](https://ompl.kavrakilab.org/multiLevelPlanning.html) · [Tutorial](https://ompl.kavrakilab.org/multiLevelPlanningTutorial.html)  
> **demo**：`MultiLevelPlanningRigidBody2D.cpp` · 100D HyperCube 基准

## 导读

高维直接规划易爆内存 / 时间。多层框架用**纤维丛**语言，把可接受的低维投影排成序列，让规划器利用抽象层快速找解。

你只需提供：`std::vector<SpaceInformationPtr>` + 各层 `StateValidityChecker`。要保留概率完备 / 渐进（近）最优，投影须 **admissible**：原空间可行解投影到低维后仍须可行。实践上靠约束松弛：缩小障碍 / 连杆、去掉非完整约束、去掉子系统或机器人等（如 PR2 去臂过走廊、Shadow Hand 去无关手指、飞机内接球等）。

相对「单一欧氏投影」更一般：可有限多层、投影到多种流形、多机器人与非完整。HyperCube 100D 上 QRRT 等可秒级，经典规划器常卡在 ~25D。

## Tutorial：SE(2) 两层 \(\{\mathbb{R}^2, SE(2)\}\)

经典：`si` + `pdef` + `Planner`。多层：`siVec`（**升维排序**，**最后**一项为原空间）+ 多层规划器（如 `ompl::multilevel::QRRT`）。

```cpp
auto SE2(std::make_shared<ob::SE2StateSpace>());
ob::RealVectorBounds bounds(2);
bounds.setLow(0); bounds.setHigh(1);
SE2->setBounds(bounds);
ob::SpaceInformationPtr si_SE2(std::make_shared<ob::SpaceInformation>(SE2));

auto R2(std::make_shared<ob::RealVectorStateSpace>(2));
R2->setBounds(0, 1);
ob::SpaceInformationPtr si_R2(std::make_shared<ob::SpaceInformation>(R2));

bool boxConstraint(const double values[])
{
    const double x = values[0] - 0.5, y = values[1] - 0.5;
    return std::sqrt(x * x + y * y) > 0.2;
}

bool isStateValid_SE2(const ob::State *state)
{
    const auto *SE2state = state->as<ob::SE2StateSpace::StateType>();
    const auto *R2 = SE2state->as<ob::RealVectorStateSpace::StateType>(0);
    const auto *SO2 = SE2state->as<ob::SO2StateSpace::StateType>(1);
    return boxConstraint(R2->values)
        && (SO2->value < boost::math::constants::pi<double>() / 2.0);
}

bool isStateValid_R2(const ob::State *state)
{
    const auto *R2 = state->as<ob::RealVectorStateSpace::StateType>();
    return boxConstraint(R2->values);
}

si_SE2->setStateValidityChecker(isStateValid_SE2);
si_R2->setStateValidityChecker(isStateValid_R2);

std::vector<ob::SpaceInformationPtr> siVec;
siVec.push_back(si_R2);
siVec.push_back(si_SE2);

auto planner = std::make_shared<ompl::multilevel::QRRT>(siVec);
planner->setProblemDefinition(pdef);
planner->setup();
planner->solve();
```

序列选择强烈影响耗时；单层 QRRT ≈ 经典 RRT。窄通道多时可试更多层（见 QRRT 论文）。

## PlannerData 注解

`PlannerDataVertexAnnotated`：`getLevel()` / `getMaxLevel()` / `getBaseState()` / `getState()`（原空间）。dynamic_cast 后读取即可。

## 练习指引

1. 只跑 `si_SE2` 一层 vs 加上 `R2` 抽象，对比时间。  
2. 故意让低维合法性**更严**（破坏 admissible），观察「宣称无解」风险。  

下一章（Intermediate）：[通用规划上下文](#/note/opensource/ompl/13-generic-planning)
