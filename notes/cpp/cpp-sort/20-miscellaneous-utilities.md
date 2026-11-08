---
title: cpp-sort：杂项工具（utility）
tags: [cpp, cpp-sort, utility, adapter_storage, buffer, iter_move]
topic: cpp
updated: 2026-11-08
order: 20
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Miscellaneous-utilities
---

# 杂项工具（`cppsort::utility`）

> 出处：[Wiki Miscellaneous-utilities](https://github.com/Morwenn/cpp-sort/wiki/Miscellaneous-utilities)  
> 说明：按用途分组的中文消化；**重点**记 `adapter_storage`、buffer providers、`iter_move` / `iter_swap`。路线见 [00](#/note/cpp/cpp-sort/00-roadmap)。相关：[可链式投影](#/note/cpp/cpp-sort/18-chainable-projections) · [写 sorter](#/note/cpp/cpp-sort/21-writing-a-sorter)

头文件多在 `cpp-sort/utility/`，命名空间 `cppsort::utility`。不一定直接「排序」，但写 / 用 sorter 与 adapter 时常会碰到。

## 1. 适配器存储与调用约定

### `adapter_storage`（重点）

```cpp
#include <cpp-sort/utility/adapter_storage.h>
```

给**包装单个 sorter** 的 adapter 用的存储基类，目标是：能空则空，好和「空 sorter → 函数指针」那套设施合作。

| 能力 | 行为 |
|------|------|
| 构造 | 存一份被包装 sorter；`Sorter` 空且默认可构造时，`adapter_storage` 也空且默认可构造 |
| `get()` | 返回与本对象 cv/引用匹配的引用；空 sorter 时改为返回默认构造实例 |
| `operator() const` | 转发调用到被包装（或默认构造的）sorter |

惯用法：adapter **继承** `adapter_storage<Sorter>`，构造时喂入原 sorter，再经 `get()` 或 `operator()` 调用。

### `as_function` / `as_comparison` / `as_projection`

```cpp
#include <cpp-sort/utility/as_function.h>
#include <cpp-sort/utility/functional.h>
```

- **`as_function`**：来自 Range-v3 思路——已是可调用则原样返回，否则 `std::mem_fn`；相对 `std::invoke`，在 C++20 前更能保留 `constexpr`。成员指针当投影时几乎必用。
- **`as_projection` / `as_comparison`**：同一 *Callable* 既像比较又像投影时，库默认当比较；`as_projection` 只暴露一元面，并继承 `projection_base`（可 `|` 链式，见 [18](#/note/cpp/cpp-sort/18-chainable-projections)）。

### 杂项函数对象（`functional.h`）

- `projection_base` + `|` 组合机制  
- `identity`：默认投影（**3.0.0 移除**，改用 `std::identity`）  
- `indirect`：对可解引用对象返回 `*it`  
- 尺寸策略：`half` / `log` / `sqrt`（给 `dynamic_buffer` 用）  
- `function_constant<auto F>`：把函数指针 / 成员指针塞进模板实参，做成**空类**，利于 EBO 与少压栈（微优化）

## 2. 缓冲提供者（重点）

```cpp
#include <cpp-sort/utility/buffer.h>
```

描述「临时缓冲怎么分配」，交给需要缓冲的 sorter（如 grail / wiki）。约定：提供者有嵌套类型 `buffer`，可用 `std::size_t` 构造，并提供 `begin` / `end` / `cbegin` / `cend` / `size`。

| 提供者 | 含义 |
|--------|------|
| `fixed_buffer<N>` | 栈上 `std::array` 固定 `N` 个元素；运行时 size 参数被忽略（含 N=0） |
| `dynamic_buffer<SizePolicy>` | 堆分配；`SizePolicy()(集合大小)` 决定缓冲长度；失败可抛 `std::bad_alloc` |

示例心智：`grail_sorter<dynamic_buffer<sqrt>>` ≈ 文献里的 SqrtSort 配方。`wiki_sorter` 默认 `fixed_buffer<512>`。写 buffered sorter 时即使分配失败也应仍能排（可降性能），勿假设缓冲一定够大。

## 3. 迭代器移动 / 交换（重点）

```cpp
#include <cpp-sort/utility/iter_move.h>
```

**警告：3.0.0 移除此头，改用 `mstd::iter_move` / `mstd::iter_swap`。**

对应 P0022 思路，用 ADL 风格处理 **proxy iterator**（如 `vector<bool>`）：

- 默认 `iter_move(it)` ≈ `std::move(*it)`  
- `iter_swap`：若迭代器有定制 `iter_move` 则走它，否则对解引用结果 ADL `swap` / `std::swap`

用法：在算法里 `using cppsort::utility::iter_swap;` 再无限定调用（类似 `std::swap`）。与 C++20 ranges CPO 尚未完全对齐（见上游 issue #223）。

## 4. 分支特质

```cpp
#include <cpp-sort/utility/branchless_traits.h>
```

`pdq_sorter` 等会按「比较 / 投影是否可能无分支」换策略。库提供：

- `is_probably_branchless_comparison<Compare, T>`  
- `is_probably_branchless_projection<Projection, T>`  

默认识别算术类型上的 `std::less` / `greater`（及 ranges 版）、`identity`、合适的成员函数指针等。**可特化**；对用户类型特化后，其 cv/引用变体通常一并视为无分支。

## 5. 排列、下标与「已排序视图」

| 工具 | 作用 |
|------|------|
| `apply_permutation` | 按 `[0,N)` 下标范围把元素搬到目标位置（两侧皆可变） |
| `sorted_indices<Sorter>` | 返回能把随机访问序列排好的下标向量（类 numpy `argsort`），可再配 `apply_permutation` |
| `sorted_iterators<Sorter>` | 返回指向原容器元素的迭代器，按序排列（原序不变的「排序视图」） |

等价元素顺序依赖所用 sorter；稳定 sorter 下应一致。二者遵循 `is_stable` 协议。

## 6. 尺寸与有序性检查

- **`utility::size`**（3.0.0 移除 → `mstd::distance`）：有 `.size()` 用成员，否则 `distance(begin,end)`，覆盖 `forward_list` / 部分 view。  
- **`is_sorted` / `is_sorted_until`**（2.1.0+）：按统一排序接口实现的函数对象版。  
- **`check_strict_weak_ordering`**（2.1.0+）：检查比较是否在给定范围上构成严格弱序；**会改写输入**；随机访问，时间约 n²。怀疑 NaN / 坏比较时用。

## 7. Metrics 与对抗输入

```cpp
#include <cpp-sort/utility/metrics_tools.h>
#include <cpp-sort/utility/quicksort_adversary.h>
```

- `metric<T, Tag>`：带标签的强类型度量值；同 Tag 可互比，异 Tag 不可混运算。  
- `metrics`：多个 `metric` 的元组式聚合，可用 `get<Tag>(mm)` 取出（仍偏实验性）。  
- `quicksort_adversary(sorter, size)`（2.1.0+）：McIlroy「杀手对手」；只对**比较排序**；常配 `metrics::comparisons` 看是否掉进二次比较。

## 8. 排序网络实验

```cpp
#include <cpp-sort/utility/sorting_network.h>
```

- `index_pair<IndexType>{first, second}`：一次 compare-exchange 的下标对  
- 固定大小 sorter 若是排序网络，应提供静态 `index_pairs()`  
- `swap_index_pairs` / `swap_index_pairs_force_unroll`：按对序列在随机访问范围上执行交换（后者尽量展开循环）

## 速查：写代码时优先想起谁

1. 写 adapter → **`adapter_storage`**  
2. 写合并类 / 需临时区 → **buffer providers**  
3. 泛型交换 / 移动 → **`iter_move` / `iter_swap`**（注意 3.x 迁移）  
4. 成员当投影 → **`as_function`**；歧义投影 → **`as_projection`**  
5. 间接排序结果 → **`sorted_indices` / `apply_permutation`**
