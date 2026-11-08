---
title: VAMP 真实机械臂规划
tags: [opensource, ompl, tutorials, beginner, vamp, python]
topic: opensource
updated: 2026-11-08
order: 6
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/vampPlanningTutorial.html
---

# VAMP 真实机械臂规划

> **出处**：[Tutorials · Motion planning for realistic robot arms with VAMP](https://ompl.kavrakilab.org/vampPlanningTutorial.html)  
> **说明**：用 [VAMP](https://github.com/KavrakiLab/vamp) 的 SIMD 碰撞 / FK，接到 OMPL 规划器。教程以 **Python** 为主；另有 C++ demo `VAMPPlanning.cpp`。

## 桥接三类

OMPL 不关心机器人几何；要接 VAMP，实现：

1. **状态空间**：`RealVectorStateSpace` 包装，关节维数与上下限来自 `vamp.robot`  
2. **合法性检查**：`robot.validate(config, env)`  
3. **运动检查**：`robot.validate_motion(c1, c2, env)`——整段边一次查完，**绕过**默认 `DiscreteMotionValidator`

demo 模块：`vamp_state_space.py`。

```python
from ompl import base as ob
import vamp

class VampStateSpace(ob.RealVectorStateSpace):
    def __init__(self, robot: vamp.robot):
        super().__init__(robot.dimension())
        self.robot = robot
        self.dimension = robot.dimension()
        bounds = ob.RealVectorBounds(self.dimension)
        upper = robot.upper_bounds()
        lower = robot.lower_bounds()
        for i in range(self.dimension):
            bounds.setLow(i, lower[i])
            bounds.setHigh(i, upper[i])
        self.setBounds(bounds)

class VampStateValidityChecker(ob.StateValidityChecker):
    def __init__(self, si, env, robot):
        super().__init__(si)
        self.env, self.robot = env, robot
        self.dimension = robot.dimension()

    def isValid(self, state) -> bool:
        config = state[0:self.dimension]
        return self.robot.validate(config, self.env)

class VampMotionValidator(ob.MotionValidator):
    def __init__(self, si, env, robot):
        super().__init__(si)
        self.env, self.robot = env, robot
        self.dimension = robot.dimension()

    def checkMotion(self, s1, s2) -> bool:
        return self.robot.validate_motion(
            s1[0:self.dimension], s2[0:self.dimension], self.env)
```

## 场景：Panda + 14 球笼

```python
import vamp
env = vamp.Environment()
radius = 0.2
centers = [  # 14 个球心，见上游页完整列表
    [0.55, 0, 0.25], [0.35, 0.35, 0.25],  # ...
]
for c in centers:
    env.add_sphere(vamp.Sphere(c, radius))

robot = vamp.panda
space = VampStateSpace(robot=robot)
si = ob.SpaceInformation(space)
si.setMotionValidator(VampMotionValidator(si, env, robot))
si.setStateValidityChecker(VampStateValidityChecker(si, env, robot))

from ompl import geometric as og
ss = og.SimpleSetup(si)
ss.setPlanner(og.RRTConnect(si))

a = [0., -0.785, 0., -2.356, 0., 1.571, 0.785]
b = [2.35, 1., 0., -0.8, 0, 2.5, 0.785]
start, goal = si.allocState(), si.allocState()
dim = robot.dimension()
start[0:dim], goal[0:dim] = a, b
ss.setStartAndGoalStates(start, goal)
result = ss.solve(5.0)
```

依赖：`pip install -r demos/vamp/requirements.txt` + OMPL Python 绑定。

## 基准与其它机器人

同一 `SimpleSetup` 上可 `ot.Benchmark` 对比 RRTConnect / RRT / KPIECE1 / LBKPIECE1（见上游片段）。换机器人只需换模块：`vamp.ur5` / `vamp.fetch` / `vamp.baxter`。更完整数据集见 MotionBenchMaker demo。

运行示例：

```bash
python3 vamp/vamp_planning.py
python3 vamp/vamp_planning.py --visualize
python3 vamp/vamp_planning.py --benchmark --n_trials 100
```

## 练习指引

1. 只换规划器，不换桥接类，对比毫秒级碰撞下的求解差异。  
2. 故意去掉自定义 `MotionValidator`，体会默认离散边检查与 VAMP 边检查的差别。  

相关：[04 合法性](#/note/opensource/ompl/04-state-validation) · [09 基准](#/note/opensource/ompl/09-benchmark)
