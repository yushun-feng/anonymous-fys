---
title: cpp-sort Fixed-size sorters
tags: [cpp, cpp-sort, fixed-size, sorting-network, small-array]
topic: cpp
updated: 2026-11-08
order: 9
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Fixed-size-sorters
---

# Fixed-size sorters

> 出处：[Wiki · Fixed-size sorters](https://github.com/Morwenn/cpp-sort/wiki/Fixed-size-sorters)  
> 嵌入通用策略靠 `small_array_adapter`（见 [10](#/note/cpp/cpp-sort/10-sorter-adapters)）。术语：[07](#/note/cpp/cpp-sort/07-library-nomenclature)。

Fixed-size sorter（常简称 fixed sorter）面向**长度编译期已知**的小序列。调用形态仍像 sorter（range 或迭代器对 + 可选比较/投影），但实现是 `template<std::size_t N> struct ...`：每个合法 `N` 特化才是一个「可用 sorter」。不在 domain 内的 `N` 会编译期失败。元信息见 `fixed_sorter_traits`。

一次引入全部：

```cpp
#include <cpp-sort/fixed_sorters.h>
```

多数情况下 **end 迭代器当前未用于边界检查**；未来版本可能用来做可选校验。

## 为何单独一类

- 小 \(N\) 上，特化/展开可比通用 \(O(n\log n)\) 框架更省比较或移动。  
- 排序网络给出**与数据无关**的 CE（compare-exchange）次数，利于恒定控制流场景（仍需自行保证 load/store 也恒定）。  
- 与普通 sorter **不完全同构**：要靠 `small_array_adapter` + 往往 `hybrid_adapter` 才能无缝接进「大数组走 pdq、小数组走网络」一类配方。

## 族一：少比较 — `low_comparisons_sorter`

```cpp
#include <cpp-sort/fixed/low_comparisons_sorter.h>

template<std::size_t N>
struct low_comparisons_sorter;
```

目标：比较贵、移动便宜（如长公共前缀字符串）。评价尺度是 **comparison weight**：对长度 \(N\) 的**所有排列**，排序所需比较次数之和。Wiki 列出了 \(N=0\ldots13\) 所用算法（插入、merge-insertion、double gnome 等）；\(0\)–\(8\) 在该度量下较优。更大的 \(N\) 上，完整 `merge_insertion_sorter` 平均比较可能更少，但代码重、运行慢，不适合塞进「又小又快」的 fixed 特化。

## 族二：少移动 — `low_moves_sorter`

```cpp
#include <cpp-sort/fixed/low_moves_sorter.h>

template<std::size_t N>
struct low_moves_sorter;
```

目标：比较便宜、移动贵（大对象只比一个字段）。评价尺度是 **move weight**（所有排列上的移动总和）。小 \(N\) 用展开插入/选择；更大用双向选择（cocktail / minmax）。**无硬性上限**（理论上可到很大），但代码膨胀明显——尽量保持 \(N\) 小。

注意：这不是全局 move-optimal。真要极限少搬元素，用 `indirect_adapter`（额外迭代器与标记，常数更大），见 [10](#/note/cpp/cpp-sort/10-sorter-adapters)。

## 族三：排序网络

### `sorting_network_sorter`

```cpp
#include <cpp-sort/fixed/sorting_network_sorter.h>

template<std::size_t N>
struct sorting_network_sorter;
```

为 \(N=0\ldots64\) 提供**规模较优**（size-optimal，非 depth-optimal）的手工展开 CE 序列。小整数数组、无额外内存时经常很能打。Wiki 表格给出各 \(N\) 的 CE 个数（写作时的 best-known）；\(0\)–\(3\) 稳定，其余网络不稳。

安全直觉：CE 次数与输入内容无关 → 更不易因比较次数泄漏；但库**不**保证恒定内存访问，需自备 constant-time 的 compare-exchange。

### `merge_exchange_network_sorter` / `odd_even_merge_network_sorter`

```cpp
#include <cpp-sort/fixed/merge_exchange_network_sorter.h>
#include <cpp-sort/fixed/odd_even_merge_network_sorter.h>
```

- **Merge-exchange**：Knuth 所述 Batcher 变体，两套交错网络再合并。  
- **Odd-even merge**：经典 Batcher；**仅接受 \(N\) 为 2 的幂**。

二者与 `sorting_network_sorter` 一样提供静态 `index_pairs()`，吐出 CE 下标对，便于交给 utility 里的排序网络工具：

```cpp
template<typename DifferenceType = std::ptrdiff_t>
[[nodiscard]] static constexpr auto index_pairs() noexcept
    -> std::array<utility::index_pair<DifferenceType>, /* CE 个数 */>;
```

`DifferenceType` 须能从 `int` 构造。

## 接到通用 sorter

```cpp
using sorter = cppsort::hybrid_adapter<
    cppsort::small_array_adapter<
        cppsort::low_moves_sorter,
        std::make_index_sequence<9>  // 仅 0..8
    >,
    cppsort::pdq_sorter
>;
```

`small_array_adapter` 对不支持的集合 **SFINAE 掉** overload，才能让 hybrid 落到后面的 `pdq_sorter`。细节与限制（无 CTAD、只要无状态默认可构造）见下一篇。

## 练习指引

1. 对 `std::array<int, 8>` 分别用 `sorting_network_sort` 与 `pdq_sort`，对比生成代码体量直觉（看编译时间或反汇编均可）。  
2. 用 `index_pairs()` 打印某 \(N\) 的 CE 列表长度，与 Wiki 表核对。  
3. 组装上文 hybrid，确认 `vector` 走 pdq、`array<N,≤8>` 走 low_moves。

上一篇：[08 Sorters](#/note/cpp/cpp-sort/08-sorters) · 下一篇：[10 Sorter adapters](#/note/cpp/cpp-sort/10-sorter-adapters)。
