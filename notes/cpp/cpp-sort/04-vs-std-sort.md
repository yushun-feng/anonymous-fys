---
title: cpp-sort 与 std::sort
tags: [cpp, cpp-sort, std-sort, algorithm]
topic: cpp
updated: 2026-11-08
order: 4
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://en.cppreference.com/w/cpp/algorithm/sort
---

# 与 `std::sort` 的关系

> 标准侧：[std::sort](https://en.cppreference.com/w/cpp/algorithm/sort) · [std::stable_sort](https://en.cppreference.com/w/cpp/algorithm/stable_sort) · Ranges 排序  
> 库侧：[cpp-sort](https://github.com/Morwenn/cpp-sort) · 本系列 [01](#/note/cpp/cpp-sort/01-overview) / [02](#/note/cpp/cpp-sort/02-sorter-architecture)

## 一句话对比

| | `std::sort` 族 | cpp-sort |
|--|----------------|----------|
| 目标 | 语言默认的高质量通用排序 | **可切换、可组合**的算法与测量工具箱 |
| 稳定 | `sort` 不保证；要稳定用 `stable_sort` | 按所选 sorter / adapter 的契约 |
| 算法 | 实现定义（常为精心调优的 introsort / 类似物） | 你显式挑选或 hybrid 派发 |
| 投影 | C++20 Ranges 才一等公民 | 统一接口里普遍支持投影 |
| 依赖 | 标准库即有 | 第三方 header-only |

cpp-sort **不是**「替换标准库」的教条，而是：**当你需要算法多样性、自适应外壳、disorder 度量或教学/研究对照时**再引入。

## 接口上的亲戚关系

调用形状刻意靠近 `std::sort`，并吸收后来 Ranges 常见扩展：

```cpp
// 标准
std::sort(v.begin(), v.end());
std::sort(v.begin(), v.end(), std::greater<>{});

// cpp-sort：迭代器或整个容器；比较器 + 投影
cppsort::pdq_sort(v);
cppsort::pdq_sort(v.begin(), v.end(), std::greater<>{}, &Widget::key);
```

迁移直觉：

- 只排序随机访问、无特殊稳定性 / 测量需求 → **继续 `std::sort` / `std::ranges::sort`** 通常最省事。  
- 要稳定 → 标准用 `stable_sort`；库内选 `merge_sorter` / Tim 系等，并核对 Wiki「Stable」列。  
- 要「同一套调用，换算法 A/B 做 A/B」或包 metrics → sorter 对象更合适。

## 保证与非保证

标准 `std::sort`：

- 复杂度：平均大约 \(O(N\log N)\) 次比较（C++11 起对 `sort` 有更明确的要求表述，细节见 cppreference）。  
- **不**保证稳定性。  
- 具体 pivot / 插入排序阈值等是 **QoI**。

cpp-sort：

- 每个 sorter 自己挂复杂度卡片（最好 / 平均 / 最坏、内存、迭代器）。  
- 库文档强调确定性与可复现；**不要**假设它内部等于你平台 `std::sort` 的那套 introsort。  
- 异常与自交换约定见 Wiki Home：自移动应避免；自交换依赖类型满足 swappable 期望。

## 何时优先标准库

1. 产品默认路径，依赖面越小越好。  
2. 平台 STL 已对你的元素类型与尺寸调得很熟。  
3. 只需「排好」，没有算法论文式约束。  
4. 团队不希望多一个 header-only 依赖与编译成本。

## 何时值得上 cpp-sort

1. **弱迭代器容器**上也要可切换策略（hybrid + merge/quick）。  
2. 需要 **间接排序 / Schwartzian / drop-merge** 这类可插拔外壳。  
3. 要做 **预有序度量** 或比较次数统计（probe / metrics）。  
4. 教学：对照稳定原地、自适应、排序网络、Ford–Johnson 等。  
5. 数据分布特殊，标准 `sort` 不够看，要系统性试若干已知算法。

## 与 LearnCpp 笔记的衔接

- 手写选择排序 / 迭代器动机：[ch18–19](#/note/cpp/learncpp/ch18-19-iterators-dynamic)  
- 把 sorter 当函数对象传递：[ch20](#/note/cpp/learncpp/ch20-advanced-functions)、[ch11 模板](#/note/cpp/learncpp/ch11-overload-templates)  
- 元素移动代价与间接排序动机：[ch22](#/note/cpp/learncpp/ch22-move-smart-pointers)

## 练习指引

1. 同一 `vector`，`std::sort` vs `cppsort::pdq_sort` vs `cppsort::heap_sort`，只比正确性与相对耗时。  
2. 需要稳定时：`std::stable_sort` vs `cppsort::merge_sort`，用故意相等键的结构体验证保序。  
3. 写一段「默认 `std::sort`，仅在 `#ifdef` 或策略标签下换 cpp-sort」的薄封装，体会依赖边界。

下一阶段进入 Wiki 全文消化：[05 Home 通用约定](#/note/cpp/cpp-sort/05-home-general) → [06 Quickstart](#/note/cpp/cpp-sort/06-quickstart)。路线总表：[00-roadmap](#/note/cpp/cpp-sort/00-roadmap)。
