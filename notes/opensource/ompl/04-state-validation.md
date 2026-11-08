---
title: 状态合法性与运动检查
tags: [opensource, ompl, tutorials, beginner, validity]
topic: opensource
updated: 2026-11-08
order: 4
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/stateValidation.html
---

# 状态合法性与运动检查

> **出处**：[Tutorials · Setting up state validity checking](https://ompl.kavrakilab.org/stateValidation.html)  
> **说明**：核心库**故意不含**碰撞几何；合法性由你或集成层（VAMP / MoveIt / 能量函数…）提供。实现须**线程安全**。

## 两个抽象

| 类 | 职责 |
|----|------|
| `ob::StateValidityChecker` | `isValid(state)`：单状态是否合法 |
| `ob::MotionValidator` | `checkMotion(s1,s2)`：两点间边是否合法 |

挂到 `SpaceInformation`：`setStateValidityChecker` / `setMotionValidator`。未指定合法性检查器时，默认 `AllValidStateValidityChecker`（全合法）。

## 合法性检查器：类或函数

```cpp
class myStateValidityCheckerClass : public ob::StateValidityChecker
{
public:
    myStateValidityCheckerClass(const ob::SpaceInformationPtr &si)
        : ob::StateValidityChecker(si) {}

    bool isValid(const ob::State *state) const override
    {
        return /* ... */;
    }
};

bool myStateValidityCheckerFunction(const ob::State *state)
{
    return /* ... */;
}

ob::SpaceInformationPtr si(space);
si->setStateValidityChecker(std::make_shared<myStateValidityCheckerClass>(si));
// 或：si->setStateValidityChecker(myStateValidityCheckerFunction);
si->setStateValidityCheckingResolution(0.03);  // 最大 extent 的 3%
si->setup();
```

## 默认边检查：离散采样

默认 `DiscreteMotionValidator`：**只靠** `StateValidityChecker`，把边按分辨率切段逐点查。

- 分辨率太粗 → 可能漏碰  
- 分辨率太细 → 极慢  

分辨率来自 `StateSpace::validSegmentCount()`；可用：

- `SpaceInformation::setStateValidityCheckingResolution(fraction)`（相对 `getMaximumExtent()`）  
- 或各空间 `setLongestValidSegmentFraction`；复合空间可分空间不同分辨率  

若有**连续碰撞检测**，应换自定义 `MotionValidator`，不要依赖离散切段。

```cpp
class myMotionValidator : public ob::MotionValidator
{
public:
    // 实现 checkMotion(...)
};

si->setMotionValidator(std::make_shared<myMotionValidator>(si));
si->setup();
```

## 与站内其它笔记

- VAMP 桥接自定义 SVC + MotionValidator：[06 VAMP](#/note/opensource/ompl/06-vamp-planning)  
- 碰撞库搭档：[FCL](#/note/opensource/fcl/01-overview)

## 练习指引

1. 故意把分辨率设成很大的分数，观察「看起来合法」的穿障路径。  
2. 同一问题对比默认离散边检查与恒真 SVC 的耗时直觉。  

下一章：[状态与状态空间](#/note/opensource/ompl/05-working-with-states)
