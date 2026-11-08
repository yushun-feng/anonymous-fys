---
title: 约束运动规划
tags: [opensource, ompl, tutorials, beginner, constrained]
topic: opensource
updated: 2026-11-08
order: 11
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/constrainedPlanningTutorial.html
---

# 约束运动规划

> **出处**：[Constrained Planning 导读](https://ompl.kavrakilab.org/constrainedPlanning.html) · [Tutorial](https://ompl.kavrakilab.org/constrainedPlanningTutorial.html)  
> **demo**：`demos/constraint/`（Sphere / Torus / ImplicitChain … + Blender 可视化）

## 导读：问题与三种空间

任务 / 运动学常要求 \(f(q)=\mathbf{0}\)。满足集 \(X=\{q\mid f(q)=0\}\) 是低维子流形，直接在 ambient 空间采样几乎采不到。OMPL 用**增强状态空间**包装 ambient，使插值等原语自动留在 \(X\) 上——任意采样规划器（含渐进最优）都可复用。

实现 `ob::Constraint`：必写 `function`，**强烈建议**解析 Jacobian（否则中心差分，贵）。多约束可用 `ConstraintIntersection`。另有 SymPy 脚本 `ConstraintGeneration.py`。

三种 `ConstrainedStateSpace`：

| 空间 | 直觉 |
|------|------|
| `ProjectedStateSpace` | 投影算子；通常对超参最不敏感，适合先验证问题可解 |
| `AtlasStateSpace` | 规划中建切空间 atlas（分段线性近似） |
| `TangentBundleStateSpace` | 类似 atlas，懒评估 |

### 使用限制（导读要点）

- 状态内存须为**连续** `double` 数组（`RealVector` OK；**`CompoundStateSpace` 不行**——不保证邻接）  
- \(f\) 宜连续可微；奇点在 atlas / TB 中当障碍处理  
- 可执行路径请 `PathGeometric::interpolate()`；离散测地可能因曲率 / 奇点失败  
- 超参敏感：`Constraint::setTolerance`、`ConstrainedStateSpace::setDelta`、atlas 的 \(\epsilon,\rho\)、exploration 等  

勿与 KPIECE 等用的 `ProjectionEvaluator` 混淆：约束投影是映到流形；coverage 投影是降到 \(\mathbb{R}^k\) 估覆盖——二者正交，可并用。

## Tutorial：球面约束 \(f(q)=\|q\|-1\)

```cpp
class Sphere : public ob::Constraint
{
public:
    Sphere() : ob::Constraint(3, 1) {}  // ambient dim 3, co-dim 1
    // 或 Sphere() : ob::Constraint(3, 1, 1e-3) 指定 tolerance

    void function(const Eigen::Ref<const Eigen::VectorXd> &x,
                  Eigen::Ref<Eigen::VectorXd> out) const override
    {
        out[0] = x.norm() - 1;
    }

    void jacobian(const Eigen::Ref<const Eigen::VectorXd> &x,
                  Eigen::Ref<Eigen::MatrixXd> out) const override
    {
        out = x.transpose().normalized();
    }
};
```

可覆盖 `project()`（球面上直接归一化；机械臂可用 IK）。

```cpp
auto rvss = std::make_shared<ob::RealVectorStateSpace>(3);
ob::RealVectorBounds bounds(3);
bounds.setLow(-2); bounds.setHigh(2);
rvss->setBounds(bounds);

auto constraint = std::make_shared<Sphere>();
auto css = std::make_shared<ob::ProjectedStateSpace>(rvss, constraint);
auto csi = std::make_shared<ob::ConstrainedSpaceInformation>(css);
auto ss = std::make_shared<og::SimpleSetup>(csi);

bool obstacle(const ob::State *state)
{
    const Eigen::Map<Eigen::VectorXd> &x =
        *state->as<ob::ConstrainedStateSpace::StateType>();
    if (-0.1 < x[2] && x[2] < 0.1)
    {
        if (-0.05 < x[0] && x[0] < 0.05)
            return x[1] < 0;
        return false;
    }
    return true;
}
ss->setStateValidityChecker(obstacle);

Eigen::VectorXd sv(3), gv(3);
sv << 0, 0, -1;  gv << 0, 0, 1;  // 须满足约束
ob::ScopedState<> start(css), goal(css);
start->as<ob::ConstrainedStateSpace::StateType>()->copy(sv);
goal->as<ob::ConstrainedStateSpace::StateType>()->copy(gv);
// Atlas/TB 还需 anchorChart(start/goal)
ss->setStartAndGoalStates(start, goal);

ss->setPlanner(std::make_shared<og::PRM>(csi));
ss->setup();
if (ss->solve(5.))
{
    ss->simplifySolution(5.);
    auto path = ss->getSolutionPath();
    path.interpolate();  // 约束空间上几乎总需要
}
```

## 练习指引

1. 先跑 `ProjectedStateSpace`，再换 `AtlasStateSpace` 对比构图。  
2. 故意给不满足 \(f=0\) 的起点，观察失败模式。  

下一章：[多层规划](#/note/opensource/ompl/12-multilevel-planning)
