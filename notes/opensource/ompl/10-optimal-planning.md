---
title: 最优运动规划
tags: [opensource, ompl, tutorials, beginner, optimal, rrtstar]
topic: opensource
updated: 2026-11-08
order: 10
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/optimalPlanningTutorial.html
---

# 最优运动规划

> **出处**：[Optimal Planning 导读](https://ompl.kavrakilab.org/optimalPlanning.html) · [Tutorial](https://ompl.kavrakilab.org/optimalPlanningTutorial.html)  
> **配套**：[optimization objectives 教程](#/note/opensource/ompl/17-optimization-objectives) · demo `OptimalPlanning.cpp` · 并行：[CForest](#/note/opensource/ompl/18-cforest)

## 心智模型（导读）

要做最优规划需要两样：

1. **路径质量度量** → `ob::OptimizationObjective`  
2. **优化规划器**（若干具有渐进最优性保证，见 [Planners](https://ompl.kavrakilab.org/planners.html)；理论见 Karaman & Frazzoli）

预置目标：路径长度、最小 clearance、一般状态代价积分、机械功等。代价沿构型空间运动累积；可用 `MultiOptimizationObjective` 做加权多目标。

**限制**：代价用单个 `double` 表示。因此「最小化长度 + 最大化最小 clearance」这类**不同累积律**的目标无法精确组合（可用长度 + clearance 状态积分近似）。

## 与普通规划的两点差异

- 给 `ProblemDefinition` 设 `OptimizationObjective`  
- 使用优化规划器（如 `og::RRTstar`）

示例场景：\([0,1]^2\)，圆心 \((0.5,0.5)\)、半径 \(0.25\) 的圆障碍；起 \((0,0)\) → 终 \((1,1)\)。

```cpp
class ValidityChecker : public ob::StateValidityChecker
{
public:
    ValidityChecker(const ob::SpaceInformationPtr& si) : ob::StateValidityChecker(si) {}

    bool isValid(const ob::State* state) const override
    {
        return clearance(state) > 0.0;
    }

    double clearance(const ob::State* state) const override
    {
        const auto* s = state->as<ob::RealVectorStateSpace::StateType>();
        double x = s->values[0], y = s->values[1];
        return std::sqrt((x-0.5)*(x-0.5) + (y-0.5)*(y-0.5)) - 0.25;
    }
};

ob::StateSpacePtr space(new ob::RealVectorStateSpace(2));
space->as<ob::RealVectorStateSpace>()->setBounds(0.0, 1.0);
ob::SpaceInformationPtr si(new ob::SpaceInformation(space));
si->setStateValidityChecker(ob::StateValidityCheckerPtr(new ValidityChecker(si)));
si->setup();

ob::ScopedState<> start(space), goal(space);
start->as<ob::RealVectorStateSpace::StateType>()->values[0] = 0.0;
start->as<ob::RealVectorStateSpace::StateType>()->values[1] = 0.0;
goal->as<ob::RealVectorStateSpace::StateType>()->values[0] = 1.0;
goal->as<ob::RealVectorStateSpace::StateType>()->values[1] = 1.0;

ob::ProblemDefinitionPtr pdef(new ob::ProblemDefinition(si));
pdef->setStartAndGoalStates(start, goal);

ob::OptimizationObjectivePtr getPathLengthObjective(const ob::SpaceInformationPtr& si)
{
    return ob::OptimizationObjectivePtr(new ob::PathLengthOptimizationObjective(si));
}
pdef->setOptimizationObjective(getPathLengthObjective(si));

ob::PlannerPtr optimizingPlanner(new og::RRTstar(si));
optimizingPlanner->setProblemDefinition(pdef);
optimizingPlanner->setup();
ob::PlannerStatus solved = optimizingPlanner->solve(1.0);
```

注：`RRTstar` **默认**优化路径长度；换其它度量时必须显式 `setOptimizationObjective`。

## 停止条件与阈值

普通规划器找到可行解即可停；优化规划器要找到**满足目标**的解才停。默认长度阈值 \(0.0\) ⇒ 永不「满足」⇒ 总会跑满时限并返回期间最优。

```cpp
ob::OptimizationObjectivePtr getThresholdPathLengthObj(const ob::SpaceInformationPtr& si)
{
    ob::OptimizationObjectivePtr obj(new ob::PathLengthOptimizationObjective(si));
    obj->setCostThreshold(ob::Cost(1.51));
    return obj;
}
```

设阈值后一旦路径短于阈值即可提前结束。`Cost` 是代价的类型安全包装（避免误用裸 `double` 比较）。

## 练习指引

1. 同一问题对比无阈值 vs `Cost(1.51)` 的实际运行时间。  
2. 不设目标函数时确认 RRT\* 仍在优化长度。  

下一章：[约束规划](#/note/opensource/ompl/11-constrained-planning)
