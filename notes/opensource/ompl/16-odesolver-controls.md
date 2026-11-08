---
title: ODESolver 控制规划
tags: [opensource, ompl, tutorials, intermediate, controls, ode]
topic: opensource
updated: 2026-11-08
order: 16
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/odeint.html
---

# ODESolver 控制规划

> **出处**：[Tutorials · Using ODESolver for Planning with Controls](https://ompl.kavrakilab.org/odeint.html)  
> **后端**：`boost::numeric::odeint`（无额外依赖）

## 理论直觉

求解 \(\dot{q}=f(q,u)\)。例：简化车，控制 \((v,\phi)\)，状态 \((x,y,\theta)\)：

\[
\dot{x}=v\cos\theta,\quad \dot{y}=v\sin\theta,\quad \dot{\theta}=v\tan\phi
\]

ODE 给的是增量，需数值积分。阶数越高局部误差越小、通常更贵。

## 定义 ODE

签名：`void ODE(const StateType& q, const Control* u, StateType& qdot)`，`StateType = vector<double>`，槽位对应 `ScopedState::reals`。

```cpp
namespace oc = ompl::control;

void SimpleCarODE(const oc::ODESolver::StateType& q, const oc::Control* c,
                  oc::ODESolver::StateType& qdot)
{
    const double *u = c->as<oc::RealVectorControlSpace::ControlType>()->values;
    const double velocity = u[0], steeringAngle = u[1];
    const double theta = q[2];  // SE2 内存：0:x 1:y 2:theta
    qdot.resize(q.size(), 0);
    qdot[0] = velocity * cos(theta);
    qdot[1] = velocity * sin(theta);
    qdot[2] = velocity * tan(steeringAngle);
}
```

## 接到 StatePropagator

```cpp
oc::ODESolverPtr odeSolver(new oc::ODEBasicSolver<>(si, &SimpleCarODE));
si->setStatePropagator(oc::ODESolver::getStatePropagator(odeSolver));
```

积分后回调可做界约束（如 SO2 `enforceBounds`）。**非实数**状态分量不会被 ODESolver 自动更新，须在 `postPropagate` 里从初态拷到结果。

```cpp
si->setStatePropagator(oc::ODESolver::getStatePropagator(odeSolver, &postPropagate));
```

## 三种求解器（均可换模板步进器）

| 类 | 默认 | 特点 |
|----|------|------|
| `ODEBasicSolver` | RK4 | 显式基础步进 |
| `ODEErrorSolver` | RK Cash-Karp 5(4) | 可取误差估计 |
| `ODEAdaptiveSolver` | 同上 + controlled | 自适应步长压误差 |

亦可自继承 `ODESolver` 接其它积分库。

## 练习指引

1. 用 SimpleCarODE + `ODEBasicSolver` 跑通一个 control SimpleSetup。  
2. 去掉 `postPropagate` 的角度归一，观察 \(\theta\) 越界。  

下一章：[自定义优化目标](#/note/opensource/ompl/17-optimization-objectives)
