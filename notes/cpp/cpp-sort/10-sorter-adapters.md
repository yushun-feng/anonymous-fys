---
title: cpp-sort Sorter adapters
tags: [cpp, cpp-sort, adapters, hybrid, stable]
topic: cpp
updated: 2026-11-08
order: 10
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Sorter-adapters
---

# Sorter adapters

> 出处：[Wiki · Sorter adapters](https://github.com/Morwenn/cpp-sort/wiki/Sorter-adapters)  
> Adapter 是「用函数对象而不是自由函数模板」的主因。固定长度侧见 [09](#/note/cpp/cpp-sort/09-fixed-size-sorters)；算法本体见 [08](#/note/cpp/cpp-sort/08-sorters)。

一次引入：

```cpp
#include <cpp-sort/adapters.h>
```

**Adapted sorter** = 传入的；**resulting sorter** = 适配后的。未特别声明时，稳定性与迭代器类别继承自唯一底层 sorter。可用显式模板参数，也可用 CTAD：

```cpp
using sorter = cppsort::indirect_adapter<cppsort::quick_sorter>;
constexpr auto sort1 = sorter{};

constexpr auto sort2 = cppsort::indirect_adapter(cppsort::quick_sort);
```

## 共同约定（多数 adapter）

- 内部**存一份**被适配 sorter 的副本 → 能包有状态 sorter；若原 sorter 皆空且默认可构造，adapter 往往也是。  
- 单 sorter 适配时通常有 `get()`，按 const/引用限定返回内部副本；空 adapter 则返回默认构造的原类型。  
- 空且默认可构造时，可转成匹配 `operator()` 的函数指针。  
- 当前期望 **`const operator()`**；与可变状态 sorter 尚不友好（上游有跟踪 issue）。

## 按动机分族

### 拼策略 / 容器意识

**`hybrid_adapter<S...>`**  
按**集合迭代器类别**与各 sorter 的 `iterator_category` 派发；同类多个候选时**模板参数列表靠前**者优先（除非 SFINAE 出局）。嵌套 hybrid 会**拍平**，以便外层看见内层真实类别。自写 sorter 要进 hybrid：提供正确 `iterator_category`，并对不支持类型软失败。包进 `stable_adapter` 时会对每个子 sorter 再包一层 stable。resulting 的 `is_always_stable` 仅当所有子都总是稳定；`is_stable` 跟实际点到的那个走。迭代器类别取子 sorter 中最宽松者。

```cpp
using general_purpose_sorter = cppsort::hybrid_adapter<
    cppsort::bubble_sorter,
    cppsort::insertion_sorter,
    cppsort::pdq_sorter
>;
```

**`container_aware_adapter`**  
打破「只看迭代器」：对已知容器（如 `list`）走 splice 等专用算法。须**传入完整容器**；只传迭代器对则退回原 sorter。有趣点：专用路径可能让「原本只要 bidirectional」的 sorter 处理 `forward_list`。

**`self_sort_adapter`**  
容器自带合适的 `sort` / `stable_sort` 则用之，否则退回底层 sorter。让 `list`/`forward_list` 及用户类型的成员 `sort` 开箱可用。`is_always_stable` 为假（无法保证任意容器 `sort`）；`is_stable` 在走 `stable_sort` 或底层稳定调用时为真，并对标准 list 的 `sort` 特判为稳定。

### 少搬 / 异地 / 贵投影

**`indirect_adapter`**  
先排迭代器，再近似 cycle/mountain 搬回元素 → 大幅减少元素移动；复杂度跟底层，但多 \(n\) 个迭代器 + \(n\) 个 bool，最多约 \((3/2)n\) 次移动。接受 forward；底层迭代器类别无所谓。排序迭代器阶段若抛异常，原集合可保持原状；元素搬迁阶段**无强异常保证**。

**`out_of_place_adapter`**  
搬到连续缓冲 → 用（常为 RA）底层排 → 搬回。牺牲内存换速度与算法选择面；resulting 接受 forward。

**`schwartz_adapter`**  
Schwartzian：预计算投影再排，避免每次比较重复投影。\(O(n)\) 投影结果空间。投影很便宜时同步开销可能得不偿失。**要求底层正确支持 proxy iterator。**

### 加自适应外壳

| Adapter | 自适应味道 | 要点 |
|---------|------------|------|
| `drop_merge_adapter` | Rem | \(O(n)\) 分出单 run + 缓冲，底层只排抽出的 \(k\) 个再合并；resulting **总是不稳**，至少 bidirectional |
| `split_adapter` | Rem | SplitSort：左侧近最长非降子序列，右侧交底层排，再 merge；可内存自适应；**总是不稳**；一般不额外抛 `bad_alloc`（除非底层抛） |
| `verge_adapter` | Mono（足够长的 run） | 大 run 合并优化，小 run 回退底层；**总是不稳**；bidirectional；包进 `stable_adapter` 时改检测严格降序 run，并用 `stable_t` 包 fallback |

三者都是「给已有 sorter 加一层 disorder 友好外壳」的快捷方式。

### 稳定化三件套

层次从低到高：

1. **`make_stable`**：给元素绑原始下标，等价时比下标 → 人造稳定；\(O(n)\) 额外空间。  
2. **`stable_adapter`**：主定制点；库为 `std_sorter`、`hybrid_adapter`、`self_sort_adapter`、`verge_adapter` 等提供特化；可特化你自己的不稳定算法。调用时用 `is_stable`：已稳则直通，否则 `make_stable`。  
3. **`stable_t<Sorter>`**（推荐消费端别名）：尽量选「嵌套最浅、已知总是稳定」的类型（可能是 `Sorter` 本身、`stable_adapter<Sorter>::type` 等），减少模板套娃与更糟的报错信息。

### Fixed-size 专用：`small_array_adapter`

```cpp
template<
    template<std::size_t> class FixedSizeSorter,
    typename Indices = /* implementation-defined */
>
struct small_array_adapter;
```

仅当参数是合适大小的 C 数组或 `std::array` 时调用 fixed-size sorter。`Indices` 为 `void` → 尝试任意大小；为 `index_sequence` → 仅序列中的大小；省略时尝试 `fixed_sorter_traits::domain`。不匹配则 SFINAE，便于与 `hybrid_adapter` 组合。

限制：**无 CTAD**；只要**默认可构造的无状态** fixed sorter。

## 选型速记

| 你想… | 先看 |
|-------|------|
| 一份代码搞定 vector + list | `hybrid_adapter` ± `container_aware` / `self_sort` |
| list 上跑 RA 神器 | `out_of_place_adapter` |
| 大对象少移动 | `indirect_adapter` |
| 投影很贵 | `schwartz_adapter` |
| 数据常接近有序 / Rem 小 | `split_adapter` / `drop_merge_adapter` / `verge_adapter` |
| 契约要稳定 | `stable_t<...>` |
| 小数组特化 | `small_array_adapter` + hybrid |

## 练习指引

1. 写 `hybrid_adapter<pdq_sorter, merge_sorter>`，对 `vector` 与 `list` 各调用。  
2. 大结构体向量上对比裸 `pdq_sort` 与 `indirect_adapter<pdq_sorter>` 的相对耗时。  
3. 用 `stable_t<quick_sorter>` 验证等价键保序；再对比 `make_stable` 的空间直觉。

上一篇：[09 Fixed-size](#/note/cpp/cpp-sort/09-fixed-size-sorters) · 回到路线：[00-roadmap](#/note/cpp/cpp-sort/00-roadmap)。
