---
title: 规划器基准测试
tags: [opensource, ompl, tutorials, beginner, benchmark]
topic: opensource
updated: 2026-11-08
order: 9
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/benchmark.html
---

# 规划器基准测试

> **出处**：[Tutorials · Benchmarking planners](https://ompl.kavrakilab.org/benchmark.html)（亦挂在文档站主导航）  
> **可视化**：[Planner Arena](http://plannerarena.org)（亦可本地 `pip3 install plannerarena`）

## 流程

1. 用 `geometric::SimpleSetup` / `control::SimpleSetup` 配好问题（到能 `solve`，不必预设规划器）  
2. `ompl::tools::Benchmark b(ss, "experiment name")`  
3. 可选 `addExperimentParameter`（聚合参数化实验）  
4. `addPlanner` / `addPlannerAllocator`  
5. 可选 pre/post run 回调  
6. `benchmark(Request)` → `saveResultsToFile`

```cpp
#include "ompl/tools/benchmark/Benchmark.h"

ompl::base::PlannerPtr myConfiguredPlanner(const ompl::base::SpaceInformationPtr &si)
{
    auto *est = new ompl::geometric::EST(si);
    est->setRange(100.0);
    return ompl::base::PlannerPtr(est);
}

ompl::tools::Benchmark b(ss, "my experiment");
b.addExperimentParameter("num_dofs", "INTEGER", "6");
b.addPlanner(base::PlannerPtr(new geometric::KPIECE1(ss.getSpaceInformation())));
b.addPlanner(base::PlannerPtr(new geometric::RRT(ss.getSpaceInformation())));
b.addPlannerAllocator(std::bind(&myConfiguredPlanner, std::placeholders::_1));

ompl::tools::Benchmark::Request req;
req.maxTime = 5.0;
req.maxMem = 100.0;
req.runCount = 50;
req.displayProgress = true;
b.benchmark(req);
b.saveResultsToFile();  // 形如 ompl_host_time.log
```

## 处理日志

```bash
ompl/scripts/ompl_benchmark_statistics.py logfile.log -d mydatabase.db
# 可选 MySQL dump：
ompl/scripts/ompl_benchmark_statistics.py -d mydatabase.db -m
```

把 `.db` 上传 Planner Arena 看图。单次 run 常见字段：`time`、`memory`、`solved`、`approximate solution`、`solution length` / `smoothness` / `clearance`、简化前后指标、`correct solution` / `correct solution strict`（细分辨率复核，可暴露离散边检查过粗）等——完整 schema 见上游页。

## 练习指引

1. 同一问题加 3 个几何规划器，各跑 ≥20 次，看成功率与长度箱线图。  
2. 在 post-run 回调写入自定义 `INTEGER`/`REAL` 属性。  

相关：[06 VAMP 基准片段](#/note/opensource/ompl/06-vamp-planning) · [10 最优规划](#/note/opensource/ompl/10-optimal-planning)
