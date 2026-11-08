---
title: cpp-sort 原创研究摘要
tags: [cpp, cpp-sort, research, algorithms, sorting-networks]
topic: cpp
updated: 2026-11-08
order: 28
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Original-research
---

# cpp-sort 原创研究摘要

> 出处：[Wiki · Original research](https://github.com/Morwenn/cpp-sort/wiki/Original-research)  
> 多数算法来自其它开源或经典实现；本页是作者**原创/改进笔记**的学习向消化，非论文替代。另见 [Morwenn 的 Gist](https://gist.github.com/Morwenn)。  
> 相关：[03 代表算法](#/note/cpp/cpp-sort/03-representative-algorithms) · [26 Benchmarks](#/note/cpp/cpp-sort/26-benchmarks)

## 迭代器类别 × 复杂度权衡（比较排序）

| 设定 | 时间 / 空间（作者观察） |
|------|-------------------------|
| 随机访问 | O(n log n) + O(1) 空间；稳定亦可（block sort 等） |
| 前向/双向 · **不稳** | O(n log n) + O(1)：如 QuickMergesort + 自底向上 merge + 原始 median-of-medians |
| 前向/双向 · **稳定** | O(n log n)+O(n)（merge），或 O(n log² n)+O(1)（原地 merge） |
| 链表结构特化 | 稳/不稳均可 O(n log n)+O(1)，但难**通用回退**到任意双向迭代器 |

开放挑战：若有人找到「双向迭代器 + 稳定 + O(n log n) + O(1)」的比较排序，欢迎打脸。

## Vergesort

近似有序时做 merge 预处理，不够有序则 fallback。类似 TimSort 在某些模式上线性；最坏约 O(n log n log log n)（无严格形式化）。空间/时间随「能否拿够合并缓冲」分两档；随机访问为主，亦有双向版（配合 `quick_merge_sort` 作 fallback 可对齐时间量级）。可通过改反向 run 检测 + 稳定 fallback 做成稳定版。[独立仓库](https://github.com/Morwenn/vergesort)。

## Double insertion sort

先排中间，必要时交换首尾，再从两端插入。线性搜索版：最坏插入两个端点合计比较次数 ≤ n，平均比普通线性插入更少比较与移动。双向迭代器、O(1) 空间、不稳定、O(n²)。曾用于生成小数组排序，后多被更好替代方案取代。

## Half-cleaner 与排序网络

Half-cleaner：深度 1，把线 `i` 与 `i+n/2` 比较（n 偶）。对两段已排序输入：输出两端为全局最小/最大，且两半仍有序 → 可做「收缩式合并」，但 CE 数与深度都偏糟。优点是**任意偶数规模易实现**；可与 odd-even merge 拼出 23/24 输入网络（发布时曾是最小档之一，现已被更好网络超越）。同技巧做 40-sorter 时，20-20 合并已劣于 odd-even merge。

**29 输入**：先排 16+13，再丢弃 Batcher 32 合并中下标 ≥29 的比较器（想象尾部是 +∞）→ 165 CE；文献中常见最优曾是 166。思路与 Van Voorhis 1971「两路初始排序 + Batcher 合并」一脉；更优 13-sorter 使 29 能少 1。此后 [SorterHunter](https://github.com/bertdobbelaere/SorterHunter) 等到 164 CE。网络图见 Wiki `images/`。

## Mountain sort

间接排序，目标：**尽量少搬元素本体**（排冰箱按价格、排山按海拔）。相对 cycle sort / Exact-Sort：先存迭代器并排序，再按环一次临时变量写回。复杂度大致随用于排迭代器的算法；库中以 [`indirect_adapter`](https://github.com/Morwenn/cpp-sort/wiki/Sorter-adapters#indirect_adapter) 形式出现，可换稳定底层 sorter。元素很大、比较很便宜时内存（迭代器+标记）可忽略。[独立实现](https://github.com/Morwenn/mountain-sort)。基准侧见 [26](#/note/cpp/cpp-sort/26-benchmarks)「移动贵」。

## Poplar sort / poplar heap

实现 Bron & Hesselink *Smoothsort revisited* 脉络的 poplar sort；后把 poplar heap 做成更隐式结构以降空间（见 [poplar-heap](https://github.com/Morwenn/poplar-heap)）。实测 O(1) 空间版平均更慢，故 `poplar_heap` 仍用 O(log n) 空间路径。后知结构已由 Harvey & Zatloukal 以 *post-order heap* 描述；作者认为部分建堆方法仍新颖。

## `quick_merge_sort`

借鉴 QuickXsort / QuickMergesort：用 median-of-medians 切成约 2/3 与 1/3，左侧内部 merge，再递归小侧 → 双向迭代器上 O(n log n)+O(1)。Edelkamp & Weiß 后发文描述同味道变体。独立仓库有「理论复杂度干净」版；**cpp-sort 内建版**故意选理论稍差、实践更快的子算法。[仓库](https://github.com/Morwenn/quick_merge_sort) · [相关 arXiv](https://arxiv.org/pdf/1804.10062.pdf)。

## `Mono` 无序度量与偏序

来自 *Sort Race*：单调段（升或降）个数。库内 `probe::mono` 用 **Mono−1**，使已排序为 0（Mannila 第一条）；但仍不满足「拼接次可加」等全部 presortedness 公理（反例：两段单调反向拼接）。

已厘清的关系（消化版）：

- `Mono ⪯ Runs`，`SMS ⪯ Mono`，`Enc ⪯ Mono`  
- `Mono ≢ SUS`，`Mono ≢ Max`（双向都有反例）  
- 传递得到：`Mono ≰ Exc`，`Mono ≰ Inv`，`Hist ≰ Mono`  
- 待证：`Osc` / `Loc` 与 `Mono`  
- 与 `Amp` / `Osc` / `Reve` 一样：整段反转，度量值不变  

细节与反例序列见上游 Wiki；disorder 成本量级见 [26](#/note/cpp/cpp-sort/26-benchmarks)。

## 学习怎么用这些笔记

1. 当**选型地图**：迭代器类别 → 可达的复杂度边界。  
2. 当**自适应故事**：vergesort、Inv 系、Mono 帮你理解「为何有时预处理赢」。  
3. 当**间接/网络专题入口**：mountain / sorting network 改进史，不必背 CE 表。  
4. 实作向继续：[23 adapter](#/note/cpp/cpp-sort/23-writing-randomizing-adapter) · [24 容器感知](#/note/cpp/cpp-sort/24-writing-container-aware)。

回到总路线：[00-roadmap](#/note/cpp/cpp-sort/00-roadmap)。Wiki 内容页消化到此闭环。
