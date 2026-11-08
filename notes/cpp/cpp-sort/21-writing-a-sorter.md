---
title: cpp-sort：如何写一个 Sorter
tags: [cpp, cpp-sort, sorter, tutorial, sorter_facade, traits]
topic: cpp
updated: 2026-11-08
order: 21
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Writing-a-sorter
---

# 如何写一个 Sorter

> 出处：[Wiki Writing-a-sorter](https://github.com/Morwenn/cpp-sort/wiki/Writing-a-sorter)  
> 说明：设计规则与最佳实践的中文消化；逐步示例见 [22 写 bubble_sorter](#/note/cpp/cpp-sort/22-writing-bubble-sorter)。相关：[杂项工具](#/note/cpp/cpp-sort/20-miscellaneous-utilities) · [架构](#/note/cpp/cpp-sort/02-sorter-architecture)

要把库外算法接进 cpp-sort（用 adapter / hybrid / metrics），需要包成 **sorter**。基础不难，细节（特质、SFINAE、稳定性）容易踩坑——本文按主题列规则。

## 动手前先问清

对照库术语，先答这些问题：

- 支持哪类**迭代器**？能否排 `forward_list`？  
- 是否**比较排序**？能否任意比较器？否则是否支持**投影**？  
- 是否**类型特化**？稳定吗？有无显然的稳定变体？  
- **有状态还是无状态**？返回什么？  
- 是否 **fixed-size** / **buffered**？

## 最简骨架

已有迭代器对版 `selection_sort` 时，实现 + facade 即可：

```cpp
struct selection_sorter_impl
{
    template<typename ForwardIterator>
    auto operator()(ForwardIterator first, ForwardIterator last) const
        -> void
    {
        selection_sort(first, last);
    }
};

struct selection_sorter:
    cppsort::sorter_facade<selection_sorter_impl>
{};
```

`sorter_facade` 会补：range 重载、向 `void(*)(It,It)` / `void(*)(Range&)` 等函数指针转换。

**规则摘要（基础）**

| 编号 | 要求 |
|------|------|
| 1.1 | 排完后无比较器的 `is_sorted` 应为真（浮点等例外另论） |
| 1.2 | 可调迭代器对或 range |
| 1.3 | *implementation* 至少提供迭代器对 `operator()`；range 版可选但有价值时再加 |
| 1.4 | sorter **不可变**；`operator()` 一律显式 `const`（漏写会炸出成吨 SFINAE 错） |
| 1.5 | 无状态时鼓励提供默认全局实例（`inline` 变量防 ODR） |

## 迭代器类别

在 *implementation* 上声明特质（或特化 `sorter_traits`）：

```cpp
using iterator_category = std::forward_iterator_tag;
using is_always_stable = std::false_type;
```

`hybrid_adapter` 靠类别选实现；同类别多候选时可用 `rebind_iterator_category` 抬高「名义类别」。**查询类别务必走 `sorter_traits` / `iterator_category` trait**，不要直读成员（fixed-size 等可能只特化 traits）。

| 编号 | 要求 |
|------|------|
| 2.1–2.2 | 用标准 iterator tag 文档化；经 traits 访问 |
| 2.3 | 类别 = 该 sorter **能处理的最弱**一类 |
| 2.4 | 至少是 `forward_iterator_tag` 或其派生 |

## 比较排序

默认比较用 `std::less<>`（不是裸 `operator<`）。实现里加默认比较参数即可，facade 生成 range+比较等重载。库内比较经 `std::invoke` 调用，故可直接塞成员函数指针式比较。

```cpp
template<typename RandomAccessIterator, typename Compare = std::less<>>
auto operator()(RandomAccessIterator first, RandomAccessIterator last,
                Compare compare={}) const -> void
{
    std::sort(first, last, compare);
}
```

| 编号 | 要求 |
|------|------|
| 3.1 | 无比较器也可调用，且服从基础规则 |
| 3.2 | 带比较器排完后，同比较器的 `is_sorted` 为真 |
| 3.3 | `std::less<>` 与省略比较器等价 |
| 3.4 | 支持 range+比较 ⇒ 也支持迭代器对+比较 |
| 3.5 | 比较参数在集合参数之后 |

## 投影

默认投影：`utility::identity`（或 `std::identity`）。同时支持比较+投影时，用 `is_projection_iterator` 做概念式 SFINAE，避免与比较器重载打架。投影同样经 `std::invoke`，故 `&T::member` 可当键。

多数情况**不必手写投影 overload**：只实现「迭代器 + 比较」，并加 `enable_if<!is_projection_iterator<Compare, It>>`，facade 会把投影烤进比较再转发。昂贵投影可考虑 `schwartz_adapter`。

| 编号 | 要点 |
|------|------|
| 4.1–4.2 | 投影 sorter 也是 sorter；可兼比较 sorter |
| 4.3–4.4 | 带投影的 `is_sorted` 语义；`identity` / 省略投影等价 |
| 4.5 | 投影在集合参数后；若兼比较，投影在比较之后 |

## 非比较 / 类型特化

计数排序等可不接受任意比较器，但可为 `std::greater<>` 等**特定标准函数对象**提供 overload（facade 还会补 `less` / ranges 版）。库对标签式函数对象的内建支持主要覆盖：`std::less<void>`、`std::ranges::less`、`std::greater<void>`、`std::ranges::greater`。

类型特化时用 **SFINAE 软失败**（`enable_if_t<is_integral_v<value_type>>`），勿 `static_assert` 硬炸——这样 `hybrid_adapter` 才能回退到别的 sorter。

**规则 5.1：** 不兼容类型时用 SFINAE 退出重载决议。

## 稳定性

`is_always_stable` → `true_type` / `false_type`，经 traits 访问。`stable_adapter`：若已总是稳定则直通，否则走 `make_stable`（依赖比较排序 + proxy 迭代器）。可特化 `stable_adapter<MySorter>` 挂上自家稳定版；`make_stable` **不可**特化。细粒度用 `is_stable`（按调用参数）。

| 编号 | 要求 |
|------|------|
| 6.1–6.3 | 文档化稳定性；仅当所有算法路径都稳定才标 `true_type` |
| 6.4 | 稳定性依赖实参时特化 `is_stable`（文中亦称细粒度协议） |
| 6.5–6.8 | 允许特化 `stable_adapter`；特化须 `is_always_stable = true_type` 且接口匹配原 sorter |

## 有状态 vs 无状态

库自带 sorter（至 2.0.0）均为无状态。有状态时：

- `sorter_facade` **仅当** implementation 空且默认可构造时提供函数指针转换  
- `adapter_storage` / 多数 adapter 的「结果是否无状态」随被包装者而定  
- `small_array_adapter` **只接受**无状态 sorter  

## Buffered sorter

缓冲分配策略外置为 **buffer provider**（见 [20](#/note/cpp/cpp-sort/20-miscellaneous-utilities)）：

```cpp
using sqrt_sorter = grail_sorter<dynamic_buffer<sqrt>>;
```

| 编号 | 要求 |
|------|------|
| 7.1 | provider 有嵌套 `buffer`，可自 `size_t` 构造，提供 begin/end/data/size 等 |
| 7.2 | buffered sorter 以 provider 为模板参数 |
| 7.3 | 合法特化仍须服从 sorter（及比较/投影）规则 |
| 7.4 | 缓冲分配失败也应能排完（可降速）；勿死绑某一缓冲大小 |

## Fixed-size sorter

类模板参数 `std::size_t N`；每个合法特化才是真正的 sorter。通常主体 `static_assert`「无此 N」，再为 0/1/2… 特化实现。信息放在 `fixed_sorter_traits`（`domain` / `iterator_category` / `is_always_stable`）。使用时用 `small_array_adapter` + `hybrid_adapter` 兜底任意长度序列。

| 编号 | 要求 |
|------|------|
| 8.1–8.2 | 不必支持所有 N；合法特化在正确长度下服从 sorter 规则 |
| 8.3 | 需要 domain/类别/稳定性信息时特化 `fixed_sorter_traits` |

## 最小检查清单

1. `const operator()(first, last, …)` + `sorter_facade`  
2. `iterator_category` + `is_always_stable`  
3. 比较默认 `std::less<>`；投影靠 facade 或显式 + `is_projection_iterator`  
4. 类型限制用 SFINAE，方便 hybrid 回退  
5. 需要缓冲 / 固定长度时走 provider 与 `fixed_sorter_traits` 协议  

下一步：按 [22](#/note/cpp/cpp-sort/22-writing-bubble-sorter) 把上述规则落到完整 `bubble_sorter`。
