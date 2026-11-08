---
title: CForest 并行最优规划
tags: [opensource, ompl, tutorials, intermediate, cforest, parallel]
topic: opensource
updated: 2026-11-08
order: 18
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/CForest.html
---

# CForest 并行最优规划

> **出处**：[Tutorials · Parallel optimal planning using CForest](https://ompl.kavrakilab.org/CForest.html)  
> **论文**：Otte & Correll；OMPL 实现为 `og::CForest`  
> **注意**：多线程实现，**无 Python 绑定**

## 核心想法

多棵树并行同起终点生长：

1. 某树找到更好解 → **共享**给其它树  
2. 只向「可能改进当前最优」的区域扩展；无望样本立即丢弃  
3. 更优解出现时 **剪枝** 无用状态  

假设：底层树几乎必然收敛到最优；目标 / 空间满足可用可采纳启发（常联系三角不等式）。在 OMPL 中要求优化目标有可采纳启发；非度量空间会警告（不必然非法）。

当前底层默认 / 实质可用：**RRT\***（需 `canReportIntermediateSolutions`）。`PRMstar` 等会被拒绝加入。

## 用法

```cpp
#include <ompl/geometric/planners/cforest/CForest.h>

og::SimpleSetup ss(/* ... */);
ob::PlannerPtr planner(new og::CForest(ss.getSpaceInformation()));
ss.setPlanner(planner);

// 默认：按核数挂 RRT*；或显式：
planner->as<og::CForest>()->addPlannerInstances<og::RRTstar>(5);
// 或只设线程数：
planner->as<og::CForest>()->setNumThreads(6);
```

路径共享靠 `CForestStateSampler` 包装默认采样器：其它线程随后采样会吐出最优路径上的状态。用户未加入有效规划器时，自动挂两棵 RRT\*。

解共享 / 剪枝细节、与论文差异、如何让自写规划器兼容 CForest——见上游 Advanced 小节。

## 练习指引

1. 同一最优问题对比单 RRT\* vs `setNumThreads(N)` 的收敛曲线（Benchmark）。  
2. 尝试 `addPlannerInstances<PRMstar>`，确认警告与未加入行为。  

下一章（Advanced）：[添加新规划器](#/note/opensource/ompl/19-new-planner)
