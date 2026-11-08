---
title: 设置投影（ProjectionEvaluator）
tags: [opensource, ompl, tutorials, advanced, projection]
topic: opensource
updated: 2026-11-08
order: 21
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/projections.html
---

# 设置投影（ProjectionEvaluator）

> **出处**：[Tutorials · Setting up a projection](https://ompl.kavrakilab.org/projections.html)  
> **用途**：ProjEST / SBL / KPIECE1 等在低维欧氏空间上离散化以引导探索  
> **勿与** [约束投影](#/note/opensource/ompl/11-constrained-planning) 混淆

## 概念

`ProjectionEvaluator::project(state) → Eigen::VectorXd`。可用 `setCellSizes` 隐式网格；`computeCoordinates` 得格子坐标。未设 cell size 时 `setup()` 用采样使每维大约切成 20 份——仅默认，建议自定。

投影属于**状态空间**：宜在 `StateSpace::registerProjections()` 注册；多数空间有默认投影，有领域知识时应覆盖。

## 示例（\(\mathbb{R}^n\)）

```cpp
class MyProjection : public ob::ProjectionEvaluator
{
public:
    MyProjection(const ob::StateSpacePtr &space) : ob::ProjectionEvaluator(space) {}

    unsigned int getDimension() const override { return 2; }

    void defaultCellSizes() override
    {
        cellSizes_.resize(2);
        cellSizes_[0] = 0.1;
        cellSizes_[1] = 0.25;
    }

    void project(const ob::State *state,
                 Eigen::Ref<Eigen::VectorXd> projection) const override
    {
        const double *values = state->as<ob::RealVectorStateSpace::StateType>()->values;
        projection(0) = (values[0] + values[1]) / 2.0;
        projection(1) = (values[2] + values[3]) / 2.0;
    }
};

space->registerProjection("myProjection",
    ob::ProjectionEvaluatorPtr(new MyProjection(space)));
planner->as<og::KPIECE1>()->setProjectionEvaluator("myProjection");
// 或 registerDefaultProjection(...) 后规划器自动用默认投影
```

延伸阅读：Sucan & Kavraki, random linear projections for sampling-based planning (IROS 2009)。

## 练习指引

1. 为 4D 实向量空间注册 2D 投影，挂到 KPIECE1。  
2. 对比默认 cell sizes 与手调 cell sizes 的格子覆盖。  

返回：[Tutorials 路线](#/note/opensource/ompl/00-roadmap) · [文档地图](#/note/opensource/ompl/02-docs-map)
