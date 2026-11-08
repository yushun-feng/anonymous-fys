---
title: 自定义优化目标
tags: [opensource, ompl, tutorials, intermediate, optimal, objectives]
topic: opensource
updated: 2026-11-08
order: 17
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/optimizationObjectivesTutorial.html
---

# 自定义优化目标

> **出处**：[Tutorials · Defining optimization objectives](https://ompl.kavrakilab.org/optimizationObjectivesTutorial.html)  
> **承接**：[10 最优规划](#/note/opensource/ompl/10-optimal-planning) 同一 2D 圆障场景

## Clearance 积分（继承 StateCostIntegralObjective）

默认目标是**最小化**路径代价。要「远离障碍」时，状态代价可用 clearance 的倒数：

```cpp
class ClearanceObjective : public ob::StateCostIntegralObjective
{
public:
    ClearanceObjective(const ob::SpaceInformationPtr& si)
        : ob::StateCostIntegralObjective(si, true)  // true = motion cost interpolation
    {}

    ob::Cost stateCost(const ob::State* s) const override
    {
        return ob::Cost(1 / si_->getStateValidityChecker()->clearance(s));
    }
};
```

构造参数 `true`：对远处状态插值再累加代价（更准、更慢），类似 `DiscreteMotionValidator`。

## 多目标加权

```cpp
ob::OptimizationObjectivePtr getBalancedObjective(const ob::SpaceInformationPtr& si)
{
    auto lengthObj = std::make_shared<ob::PathLengthOptimizationObjective>(si);
    auto clearObj = std::make_shared<ClearanceObjective>(si);
    // 等价写法：
    // auto *opt = new ob::MultiOptimizationObjective(si);
    // opt->addObjective(lengthObj, 10.0);
    // opt->addObjective(clearObj, 1.0);
    return 10.0 * lengthObj + clearObj;
}
```

## 最大化最小 clearance（完整 OptimizationObjective）

库已有 `MaximizeMinClearanceObjective`；自实现时需覆盖：

| 方法 | 本目标直觉 |
|------|------------|
| `stateCost` | 直接返回 clearance（越大越好） |
| `isCostBetterThan` | `c1.value() > c2.value()`（最大化） |
| `combineCosts` | `min(c1,c2)` |
| `motionCost` | 可用两端 `combineCosts(stateCost…)` 近似；更好插值见 `MinimaxObjective` |
| `identityCost` | \(+\infty\)（对 min 的单位元） |
| `infiniteCost` | \(-\infty\)（比一切更差） |

`Cost` 包装是为类型安全，避免误用 `<` 代替 `isCostBetterThan`。该目标上可试 `PRMstar`。

## 练习指引

1. 同一场景对比纯长度、ClearanceObjective、加权多目标的路径形态。  
2. 关掉 motion cost interpolation，观察远采样点下代价估计偏差。  

下一章：[CForest](#/note/opensource/ompl/18-cforest)
