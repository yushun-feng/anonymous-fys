---
title: cpp-sort 库术语表
tags: [cpp, cpp-sort, nomenclature, glossary, sorter]
topic: cpp
updated: 2026-11-08
order: 7
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Library-nomenclature
---

# 库术语表

> 出处：[Wiki · Library nomenclature](https://github.com/Morwenn/cpp-sort/wiki/Library-nomenclature)  
> Wiki 正文里的 *斜体* 词多半指向本表。上手：[06](#/note/cpp/cpp-sort/06-quickstart)；算法选型：[08](#/note/cpp/cpp-sort/08-sorters)。

读文档时先把这些名字对齐，后面谈 adapter / probe 会省很多歧义。

## Sorter 与接口族

| 术语 | 含义 |
|------|------|
| **Sorter** | 实现某排序算法的函数对象；`operator()` 接受 range 或迭代器对，并按需接受比较器/投影 |
| **Unified sorting interface** | 上述参数组合的统称；多由 `sorter_facade` 派发 |
| **Sorter adapter** | 吃一个（或多个）Sorter，产出新 Sorter；改行为但不改「仍是 sorter」的身份 |
| **Fixed-size sorter** | 针对固定长度序列的特化模板（排序网络等）；不完全是「全功能」sorter，但可经 `small_array_adapter` 嵌入 hybrid |
| **Type-specific sorter** | 非比较策略，绑在特定类型上（整数/浮点/字符串等），如 `spread_sorter` |
| **Stateful / Stateless** | 是否携带构造期状态；库内多数无状态。无状态且空、默认可构造时，库组件可做空间优化并支持函数指针转换 |

```cpp
cppsort::pdq_sorter{}(std::begin(collection), std::end(collection),
                      std::greater{}, &wrapper::value);
```

## 比较、等价与投影

**Comparison function（比较函数）**  
多数算法是比较排序：二元谓词，返回值可转为 `bool`；默认 `std::less<>`。成员函数指针等会经类似 `std::invoke` 的方式调用。例：`cppsort::heap_sort(collection, std::greater{});` 降序。基数类等**非比较排序**可能不接受比较器。

**Equivalent elements（等价元素）**  
对谓词 `comp`，若 `!comp(a,b) && !comp(b,a)` 则称 `a`、`b` 等价。比较排序只需弱序，等价≠数学相等——**稳定性**谈的是保等价元素相对次序。

**Projection（投影）**  
一元「换个角度看元素」：按成员排序、变换后再比。成员指针可直接当投影。每个**比较 sorter** 通常也是投影 sorter；也有仅投影友好的类型特化算法（如 `spread_sorter`）。

```cpp
struct wrapper { int value; };
cppsort::heap_sort(collection, &wrapper::value);
```

## 迭代器、代理与缓冲

**Iterator category**  
算法声明最低迭代器要求（forward / bidirectional / random-access）。可用 trait：

```cpp
using category = cppsort::iterator_category<cppsort::merge_sorter>;
```

库接受的迭代器往往**不要求**后置 `++`/`--`，比标准库文档那套略松。原地排序至少要 forward。

**Proxy iterator**  
`reference` 不是真引用时（如 `vector<bool>`），`std::move`/`swap` 不够。标准算法常吃瘪；cpp-sort 多数 sorter 通过 `utility::iter_move` / `iter_swap` 定制点支持（`std_sorter` / `std_stable_sorter` 除外）。自写算法可复用这两套工具。

**Buffered sorter / buffer provider**  
可选临时缓冲的算法（如 block sort 系）。`grail_sorter` 等把 **buffer provider** 当模板参数；provider 提供嵌套 `buffer`（按 size 构造、`begin`/`end`/`size`）：

```cpp
using sorter = cppsort::grail_sorter<
    cppsort::utility::fixed_buffer<512>
>;
```

缓冲大小主要影响性能；有的算法在缓冲很小时仍能正确排完。

## 稳定性与度量

**Stability**  
稳定 ⟺ 等价元素相对次序不变。粗粒度：`is_always_stable`；细粒度：按调用签名查 `is_stable`：

```cpp
using sorter = cppsort::self_sort_adapter<cppsort::quick_sorter>;
using s1 = cppsort::is_stable<sorter(std::list<int>&)>;    // 常为稳定路径
using s2 = cppsort::is_stable<sorter(std::vector<int>&)>;  // 可能不稳定
```

需要稳定外壳时用 `stable_adapter` / `stable_t`；底层不稳时可能落到 `make_stable`（额外记原始下标，\(O(n)\) 空间）。

**Measure of disorder / of presortedness**  
估计序列「有多乱」的函数（`cppsort::probe::*`）。已排序通常为 0。满足额外公理的一类称 **measure of presortedness**，用来形式化讨论 \(M\)-adaptive：步数与 disorder 估计同阶。

**Metric**  
特殊 adapter：排序同时返回比较次数、耗时等（见 metrics 命名空间）。

## 一句话心智图

```
Sorter ──adapter──► Sorter' ──metrics──► 带 .value() 的结果
   │
   ├── comparison / projection / type-specific
   ├── fixed-size（再经 small_array_adapter）
   └── probe（旁路度量，指导选型）
```

## 练习指引

1. 用 `iterator_category` 查 `pdq_sorter` 与 `merge_sorter` 的最低要求。  
2. 对含等价键的结构体，对比稳定/不稳定 sorter 的相对次序。  
3. 读任一 adapter Wiki 段，标出它如何改写「稳定」与「迭代器类别」两词的含义。

上一篇：[06 快速上手](#/note/cpp/cpp-sort/06-quickstart) · 下一篇：[08 Sorters 选型](#/note/cpp/cpp-sort/08-sorters)。
