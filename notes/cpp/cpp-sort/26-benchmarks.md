---
title: cpp-sort 基准测试摘要
tags: [cpp, cpp-sort, benchmarks, performance]
topic: cpp
updated: 2026-11-08
order: 26
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Benchmarks
---

# cpp-sort 基准测试摘要

> 出处：[Wiki · Benchmarks](https://github.com/Morwenn/cpp-sort/wiki/Benchmarks)  
> **情境性声明（必读）**：该页只在**特定条件**下比较算法，可作快速导航；真实业务请**自跑基准**。图表来自仓库 `benchmarks/` 脚本的轻微改版；作者也承认「基准很难做对」。

相关：[03 代表算法](#/note/cpp/cpp-sort/03-representative-algorithms) · [04 vs std::sort](#/note/cpp/cpp-sort/04-vs-std-sort) · [28 原创研究](#/note/cpp/cpp-sort/28-original-research)

## 方法学（怎么读这些图）

| 维度 | 上游做法 |
|------|----------|
| 元素类型 | 多数用 `double`（无 NaN/Inf）：够简单，又避免整数被编译器过度优化歪曲结果 |
| 两类主实验 | ① 打乱数据、**变长度**；② 固定长度、**变数据模式** |
| 影响因素 | 类型、规模、比较代价、移动代价、分布模式、容器种类…… |
| 环境（摘录） | ≥2.0.0：EndeavourOS + g++ 16.2，`-O3 -march=native -std=c++26`；更早：Win10 MinGW g++ 12，`-std=c++20` |
| 更新切片 | disorder≈2.2.0；慢 O(n log n)≈1.16.0；小数组≈1.14.0；不稳定随机访问等≈1.13.1；其余多标 1.9.0 |

目标不是「全球冠军榜」，而是按**需求类别**缩小候选集。

## 随机访问：不稳定

常见默认场景。粗趋势：

- `selection_sort`：O(n²)，不随规模扩展。  
- `heap_sort`：保证好看，实测常是 O(n log n) 里最慢一档。  
- **`ska_sort`**：平均几乎总是最快；同类混合基数里也常压过 `spread_sort`。  
- quick 系 / 混合基数整体靠前；`drop_merge_sort` 在 `deque` 上可意外好看（底层常把数据弄到连续缓冲再 `pdq`）。  
- **`pdq_sort`**：不额外堆分配的不稳定排序里的佼佼者。  
- `verge_sort`：对多种模式自适应强（部分为打这类基准而设计）。  
- libstdc++ `std::sort`：对「专克 median-of-3 quick」的模式适应性偏弱。  
- `quick_merge_sort`：并非为随机访问特化，这里偏慢正常。

## 随机访问：稳定

多为 merge 变体；多数要额外合并缓冲，无堆时可能退到 O(n log² n)。

- `insertion_sort`：大 n 自然掉队。  
- 其余曲线往往挤在一起。  
- 模式图上：**`spin_sort`** 常全面领先；`wiki_sort` / `grail_sort`（本基准 O(1) 额外内存）在「稳 + 省内存」档体面；`stable_adapter(pdq_sort)` 虽有人工稳定开销，仍常进前列。

## 慢速 O(n log n) 与自适应文献算法

用 `heap_sort` 当该组「相对快」的参照。多数偏慢但**对模式自适应好**（本就来自自适应排序文献）。`smooth_sort` ↔ `poplar_sort` 随容器互有胜负；`slabsort` 在很大、打乱数据上有时能翻盘 `heap_sort`。

## 双向 / 前向容器（`list` / `forward_list`）

元素像 `double` 这么便宜时：

- 赢家常是 **`drop_merge_sort`** 与 **`out_of_place_adapter(pdq_sort)`**：先弄到连续内存再排。  
- 成员 `sort`（节点重链）要等「移动更贵」才更有优势。  
- 不想堆分配时：`quick_sort` / `quick_merge_sort` 够用。  
- `mel_sort` 整体差；前向 + 可识别模式时或可作备选。

与 [24 容器感知](#/note/cpp/cpp-sort/24-writing-container-aware) 对照：专用 list 算法 ≠ 总是最快。

## 约束场景（规则一变，冠军就换）

| 场景 | 带走点 |
|------|--------|
| **整数** | `counting_sort` 常最快，但依赖值域跨度；跨度相对规模很大时翻车。`ska_sort` 稳压 `spread_sort`。`pdq_sort` 作比较排序几乎能跟上混合基数 → 通用性极强。 |
| **Inv 自适应** | `drop_merge_sort` / `split_sort`：抽出最长升序子序列思路。相对 raw `pdq_sort`，大约 **≤30–40% 逆序** 仍有优势；少逆序时 drop_merge 更尖，split 更耐高逆序与高开销。 |
| **移动贵、比较便宜** | `indirect_adapter`：先排迭代器再一次就位（「搬冰箱」类）。收益视情况，工具箱里值得有。 |
| **稳定且无堆** | `grail_sort` / `wiki_sort`（可固定缓冲，含 0）与无堆 fallback 的 `merge_sort`。无堆时 merge 常输；wiki + 512 缓冲常明显加速，grail 对缓冲不敏感；`deque` 上 grail 常最快。 |
| **极小数组** | 排序网络在人造微基准常赢，但真实场景反复加载特定 size 的网络代码可能更慢；`insertion` / `merge_exchange_network` 常「够好」；`low_comparisons` 范围窄；`selection` / `low_moves` 偏慢。 |

`merge_insertion_sort`（最少比较向）实战极慢，基准页有意不拿它凑热闹。

## Disorder probe 成本

小基准只展示代价量级：`Amp` / `Reve` / `Runs` / `Mono`（及更绕的 `Dis`）≈ O(n)；其余多数 ≈ O(n log n)。选型 probe 时把测量本身算进预算。

## 实践清单

1. 先定约束：稳否、堆否、迭代器类别、比较/移动代价、是否整数/近似有序。  
2. 用 Wiki 图缩小 2–3 个候选，再在**你的类型与分布**上重跑 `benchmarks/`。  
3. 默认「不知道选啥、随机访问、可接受不稳」：优先看 `ska_sort` / `pdq_sort` 一带，而不是死记一张总排名。
