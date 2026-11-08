---
title: 添加新规划器
tags: [opensource, ompl, tutorials, advanced, planner]
topic: opensource
updated: 2026-11-08
order: 19
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/newPlanner.html
---

# 添加新规划器

> **出处**：[Tutorials · Adding a new planner](https://ompl.kavrakilab.org/newPlanner.html)

## 硬性要求

1. 公有继承 `ob::Planner`  
2. 实现 `solve(const PlannerTerminationCondition &ptc)`

即可接入框架。

## 强烈建议

- 构造函数里填 `specs_`（`PlannerSpecs`）  
- 需要时重载 `setup()`（不保证每次 solve 前都调）  
- 找到路径 → `pdef_->addSolutionPath(...)`  
- 返回有意义的 `PlannerStatus`  
- 尊重 `ptc`：为真尽快返回  
- 多次 `solve` **续算**而非重头；`clear()` 释放并恢复到可再 solve 的状态  
- 实现 `getPlannerData` 便于调试  

## 模板骨架（精简）

```cpp
#include <ompl/base/Planner.h>
#include <ompl/util/RandomNumbers.h>
#include <ompl/tools/config/SelfConfig.h>

namespace ompl
{
class myNewPlanner : public base::Planner
{
public:
    myNewPlanner(const base::SpaceInformationPtr &si)
        : base::Planner(si, "the planner's name")
    {
        specs_.approximateSolutions = /* ... */;
        specs_.recognizedGoal = /* ... */;
    }

    base::PlannerStatus solve(const base::PlannerTerminationCondition &ptc) override
    {
        checkValidity();
        base::Goal *goal = pdef_->getGoal().get();

        while (const base::State *st = pis_.nextStart())
        {
            // clone 并插入内部结构
        }
        const base::State *gst = pis_.nextGoal(ptc);  // 或 nextGoal()

        while (!ptc())
        {
            // si_->allocStateSampler() / checkMotion / goal->isSatisfied ...
        }
        pdef_->addSolutionPath(/* ... */);
        return base::PlannerStatus::EXACT_SOLUTION;
    }

    void clear() override
    {
        Planner::clear();
        // free internal DS
    }

    void setup() override
    {
        Planner::setup();
        SelfConfig sc(si_, getName());
        // auto-config ...
    }

    void getPlannerData(base::PlannerData &data) const override
    {
        // 填探索图的状态与边
    }
};
}
```

## 练习指引

1. 用模板做一个「随机采样直到进目标」的玩具规划器并跑通 SimpleSetup。  
2. 实现 `getPlannerData`，在失败 run 后打印顶点数。  

下一章：[新规划器 Python 绑定](#/note/opensource/ompl/20-pybindings-planner)
