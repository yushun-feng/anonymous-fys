---
title: cpp-sort：若干代表算法
tags: [cpp, cpp-sort, algorithms, pdqsort, mergesort]
topic: cpp
updated: 2026-11-08
order: 3
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Sorters
---

# 若干代表算法

> 出处：[Wiki · Sorters](https://github.com/Morwenn/cpp-sort/wiki/Sorters) · 各算法原始论文 / 实现致谢见 [README](https://github.com/Morwenn/cpp-sort)  
> 路线：[00](./00-roadmap.md) · 架构：[02](./02-sorter-architecture.md)

库内算法远不止下面几个。这里只挑**学习时高频对照**的样本：先建立「稳定 / 自适应 / 迭代器要求 / 内存」四维，再回 Wiki 查表扩展。

## 选型四维

| 维 | 问什么 |
|----|--------|
| 迭代器 | 只要前向，还是必须随机访问？ |
| 稳定 | 相等键是否必须保序？ |
| 内存 | 能否接受 O(n) 缓冲？还是死磕 O(1)？ |
| 数据形态 | 近乎有序、逆序对少、还是均匀随机？ |

```mermaid
flowchart TD
  Start[要排序] --> Stable{必须稳定?}
  Stable -->|是| Mem{可用 O(n) 缓冲?}
  Stable -->|否| RA{随机访问?}
  Mem -->|是| Merge[merge / tim / adaptive shivers…]
  Mem -->|否| Grail[grail / wiki 等原地稳定族]
  RA -->|是| Pdq[pdq / heap / smooth…]
  RA -->|否| Weak[merge / quick / mel…]
```

## `pdq_sorter`（Pattern-defeating quicksort）

- **角色**：随机访问上的「默认狠角色」候选；吸收 Orson Peters 的 pdqsort 思路。  
- **特质**：针对常见「糟糕模式」做抵御，实践中常接近或胜过朴素 quicksort；**不稳定**；平均期望优秀，最坏有对策。  
- **何时想它**：`vector` / `deque` / 数组，不要求稳定，想要接近「标准库那种通用快排体验」时可作对照实验对象。

```cpp
#include <cpp-sort/sorters/pdq_sorter.h>
cppsort::pdq_sort(vec);
```

## `merge_sorter`

- **角色**：经典归并族；**稳定**；通常要额外内存；迭代器要求相对宽松（可覆盖前向等，以 Wiki 卡片为准）。  
- **何时想它**：要稳定、或容器只有弱迭代器时的保底；也常作为 `hybrid_adapter` 里非随机访问分支。

## `heap_sorter`

- **角色**：自底向上堆排序一类实现；**不稳定**；辅助内存近 O(1)；要随机访问。  
- **何时想它**：内存紧、不要求稳定、可接受相对「比较次数友好但缓存未必最优」的基线。  
- **和 adapter**：README 基准演示过：用 `drop_merge_adapter` / `split_adapter` 包一层后，可对**逆序数量**变得更自适应——说明「算法内核」与「自适应外壳」可分离。

## `tim_sorter`

- **角色**：TimSort 路线（库内实现来源见 README 致谢）；吃** naturally occurring runs**，对部分有序数据友好；稳定（典型 TimSort 期望）。  
- **何时想它**：真实数据常「大段已有序」；想对比「纯比较通用排序 vs run 自适应」。

## `smooth_sorter`

- **角色**：Smoothsort（Dijkstra；实现改编自公开代码）；在已较有序时偏向更好行为，同时保持较稳的最坏界限叙事；随机访问。  
- **何时想它**：作为「自适应堆序思想」的样本；未必是你生产环境第一选择，但很适合读复杂度与自适应故事。

## 再认识几个「味道不同」的名字

| Sorter | 学习价值 |
|--------|----------|
| `insertion_sorter` | 小 n、近乎有序；可与 `container_aware_adapter` 看链表专用路径 |
| `spin_sorter` / `ska_sorter` / `spread_sorter` | 类型/分布友好的高速路径（非纯比较叙事） |
| `grail_sorter` / `wiki_sorter` | **原地稳定**研究方向的工程化样本 |
| `merge_insertion_sorter`（Ford–Johnson） | **比较次数**理论最优附近；实战通常太慢——当 CS 展品 |
| `cartesian_tree_sorter` / `mel_sorter` | 强依赖某种 disorder 度量的自适应样本 |

## 和 probe 一起读

若某算法宣称 *Inv*-adaptive / *Runs*-adaptive / *Rem*-adaptive，先用 `cppsort::probe::*` 在**你的真实数据**上估一下对应度量，再决定是否值得换算法或包 adapter。没有度量就谈自适应，容易停在传说层。

## 练习指引

1. 固定一份随机 `vector<int>`，对 pdq / heap / merge 计时（可用 metrics 或自己 chrono），只记录相对名次。  
2. 把数据改成「拼接多个已排序 run」，再跑 tim vs pdq，看名次是否翻转。  
3. 对 `std::list` 尝试 pdq（应失败或不可用）再换 merge 或 hybrid——把错误变成架构课。

下一章：[与 std::sort 的关系](./04-vs-std-sort.md)。
