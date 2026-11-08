---
title: cpp-sort Sorters：算法族与选型
tags: [cpp, cpp-sort, sorters, algorithms, complexity]
topic: cpp
updated: 2026-11-08
order: 8
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Sorters
---

# Sorters：算法族与选型

> 出处：[Wiki · Sorters](https://github.com/Morwenn/cpp-sort/wiki/Sorters)  
> 完整复杂度卡片以上游为准；本笔记按**族**消化，不逐表抄录。术语：[07](#/note/cpp/cpp-sort/07-library-nomenclature)；小数组另见 [09](#/note/cpp/cpp-sort/09-fixed-size-sorters)。

每个算法是 `foobar_sorter` 类型 + 全局实例 `foobar_sort`。可逐个 include，或：

```cpp
#include <cpp-sort/sorters.h>
```

两大类：**比较排序**（弱序 + 通常可投影）与 **类型特化排序**（策略绑在类型上，比较器常不可用）。

## 怎么读复杂度卡片

Wiki 每张卡大致列：Best / Average / Worst / Memory / Stable / Iterators。Average 里若出现 `Inv`、`Enc`、`Osc`、`SMS`、`Rem` 等符号，对应 [disorder probe](https://github.com/Morwenn/cpp-sort/wiki/Measures-of-disorder)——表示该算法对某种「乱」自适应。选型时先锁三件事：

1. **迭代器类别**（random-access？仅 forward？）  
2. **要不要稳定**  
3. **内存与异常**：能否扛 \(O(n)\) 缓冲、`bad_alloc` 是否可接受

## 比较排序：按动机分族

### 通用「先试这个」族（随机访问）

| Sorter | 直觉 |
|--------|------|
| `pdq_sorter` | Pattern-defeating quicksort；实用默认候选；内存 \(\sim\log n\)；不稳；无 `bad_alloc`；分支少的比较/投影可走更快分区（见 branchless traits） |
| `heap_sorter` | Bottom-up heapsort；\(O(1)\) 额外内存；不稳；可预期 |
| `std_sorter` | 直接调 `std::sort`；QoI 相关（libc++ 历史上最坏仍可能差）；**不擅长 proxy iterator**；`stable_adapter` 特化会改走 `std::stable_sort` |

### 稳定合并 / 自然合并族

| Sorter | 直觉 |
|--------|------|
| `merge_sorter` | 经典 mergesort；有额外内存时 \(O(n\log n)\)，否则可退到 \(O(n\log^2 n)\)；内存自适应；**不抛 `bad_alloc`**；forward；`list`/`forward_list` 有 container-aware 路径 |
| `tim_sorter` / `adaptive_shivers_sorter` | 自然合并系；稳定；随机数据上未必最快，但**比较贵、移动便宜**时往往更合适 |
| `spin_sorter` / `splay_sorter` | 稳定、\(O(n)\) 内存；splay 可 forward |

### 块排序 / 缓冲可控（稳定、偏原地）

| Sorter | 直觉 |
|--------|------|
| `grail_sorter<BufferProvider>` | GrailSort；默认 `fixed_buffer<0>` → 宣称 \(O(1)\) 辅存；是否支持非默认可构造类型取决于 buffer 策略 |
| `wiki_sorter<>` | WikiSort（block sort）；默认 `fixed_buffer<512>`；默认特化对非默认可构造类型不友好 |

### 堆变体 / 「理论好看」族

| Sorter | 直觉 |
|--------|------|
| `d_ary_heap_sorter` | \(d\)-叉堆（\(d\ge 2\)）；可能改善局部性；无 bottom-up 搜索 |
| `smooth_sorter` / `poplar_sorter` | Smoothsort 系；复杂度漂亮，实战常慢于 `heap_sorter`；论文/对照用 |
| `merge_insertion_sorter` | Ford–Johnson；小 \(n\) 比较次数理论优，移动与内存开销大——**非生产首选** |

### 弱迭代器上的「通用」比较排序

| Sorter | 直觉 |
|--------|------|
| `quick_sorter` | 带 introspect 味道的 quicksort；forward；栈 \(\sim\log^2 n\)；无 `bad_alloc` |
| `quick_merge_sorter` | QuickMergesort 风味；用较小分区当 merge 缓冲；RA / forward 两套空间故事；无 `bad_alloc` |
| `insertion_sorter` / `selection_sorter` | \(O(n^2)\)；教学与极小段；container-aware 下 list 可稳定 splice |

### 高度自适应（偏慢、对 disorder 敏感）

| Sorter | 自适应味道 | 最低迭代器 |
|--------|-------------|------------|
| `cartesian_tree_sorter` | Osc | Forward |
| `mel_sorter` | Enc（Merge Encroaching Lists） | Forward；有 list 专用 |
| `slab_sorter` | SMS | Bidirectional；内存偏大但规模上去有时更扛 |

这些在**随机乱序**上往往慢；数据接近有序或某种结构时才值得。

## 类型特化排序

### `counting_sorter`

计数排序；`is_integral`（及部分 `__int128`）。值域很紧时极快；值域 ≫ \(n\) 时内存与时间爆炸。已排序可几乎不分配。可用 `greater` 做反向。稳定性对「覆盖写回整数」意义不大。

### `ska_sorter`

非比较；升序支持：整数、`__int128`、IEC559 且位宽匹配的 `float`/`double`、可递归处理的 `pair`/`tuple`、以及 `operator[]` 结果仍可 ska 的类型（含字符串等）。接受投影（投影结果须仍可处理）。平均常接近线性，最坏可到 \(n\log n\)。

### `spread_sorter`

Spreadsort 聚合体，内部是 `hybrid_adapter` 拼三种：

```cpp
struct spread_sorter:
    hybrid_adapter<
        integer_spread_sorter,
        float_spread_sorter,
        string_spread_sorter
    >
{};
```

可按需只 include 某一味。字符串味支持 `greater` 反向。复杂度卡片含键长 \(k\) 等因素——细节查 Wiki。

## 选型决策树（实用）

```
需要稳定？
  ├─ 是 → merge / tim / shivers / grail / wiki / spin / splay …
  └─ 否 → 继续
迭代器？
  ├─ 仅 forward/bidirectional → quick / merge / quick_merge；或 out_of_place + RA 算法
  └─ random-access → pdq 作默认试金石；要 O(1) 内存看 heap/grail/wiki
元素类型特殊？
  └─ 紧凑整数域 → counting；通用整数/浮点/串 → ska / spread
数据明显「有结构」？
  └─ 先 probe 再选 mel/slab/cartesian 或包 split/drop_merge/verge
只要平台默认？
  └─ std_sorter（注意 proxy / 稳定性特化）
```

生产路径优先对照上游 [Benchmarks](https://github.com/Morwenn/cpp-sort/wiki/Benchmarks)；许多「慢但优雅」的算法更适合教学与研究。

## 与 container_aware 的关系

`insertion` / `selection` / `merge` / `mel` 等对 `std::list` / `forward_list` 有专用实现：须经 `container_aware_adapter` 且**传入完整容器**才会走 splice 等路径；只传迭代器对则退回通用实现。详见 [10](#/note/cpp/cpp-sort/10-sorter-adapters)。

## 练习指引

1. 同一随机 `vector<int>`：`pdq_sort` vs `heap_sort` vs `merge_sort`，只比正确性与相对耗时。  
2. 构造「几乎有序」与「多短 run」两组数据，对比 `tim_sort` 与 `pdq_sort`。  
3. 对紧凑小整数域试 `counting_sort`，再故意拉大值域观察代价。

上一篇：[07 术语表](#/note/cpp/cpp-sort/07-library-nomenclature) · 下一篇：[09 Fixed-size sorters](#/note/cpp/cpp-sort/09-fixed-size-sorters)。
