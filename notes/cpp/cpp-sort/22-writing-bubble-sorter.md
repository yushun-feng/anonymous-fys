---
title: cpp-sort：手写 bubble_sorter 逐步示例
tags: [cpp, cpp-sort, bubble-sort, sorter, tutorial, example]
topic: cpp
updated: 2026-11-08
order: 22
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Writing-a-bubble_sorter
---

# 手写 `bubble_sorter`（逐步）

> 出处：[Wiki Writing-a-bubble_sorter](https://github.com/Morwenn/cpp-sort/wiki/Writing-a-bubble_sorter)  
> 说明：跟上游教程对齐的关键步骤；完整可运行代码见库 `examples/`。规则总览见 [21](#/note/cpp/cpp-sort/21-writing-a-sorter)。相关：[杂项工具](#/note/cpp/cpp-sort/20-miscellaneous-utilities)

冒泡排序很少是最优选择，但步骤短、适合演示如何把算法包成合规 sorter。

## 1. 算法本体

随机访问版 → 双向迭代器版（`it+1` 换成 `std::next`）：

```cpp
template<typename BidirectionalIterator>
auto bubble_sort(BidirectionalIterator first, BidirectionalIterator last)
    -> void
{
    while (first != last--) {
        for (auto it = first; it != last; ++it) {
            auto next = std::next(it);
            if (*next < *it) {
                std::iter_swap(it, next);
            }
        }
    }
}
```

（教程为简洁未加「本趟无交换则提前结束」。）

## 2. 最简 sorter + `sorter_facade`

手写全套 range 重载易错；让 facade 补全：

```cpp
struct bubble_sorter_impl
{
    template<typename BidirectionalIterator>
    auto operator()(BidirectionalIterator first, BidirectionalIterator last) const
        -> void
    {
        bubble_sort(first, last);
    }
};

using bubble_sorter = cppsort::sorter_facade<bubble_sorter_impl>;
```

## 3. Sorter 特质

给 `hybrid_adapter` / `make_stable` 用：

```cpp
using iterator_category = std::bidirectional_iterator_tag;
using is_always_stable = std::true_type;  // 冒泡稳定 → make_stable 可直通
```

**读特质永远走 `sorter_traits`**，不要假定每个 sorter 都内嵌成员。

## 4. 自定义比较器

算法侧改为 `compare(*next, *it)`；sorter 默认 `std::less<>`：

```cpp
template<
    typename BidirectionalIterator,
    typename Compare = std::less<>
>
auto operator()(BidirectionalIterator first, BidirectionalIterator last,
                Compare compare={}) const
    -> void
{
    bubble_sort(first, last, std::move(compare));
}
```

进一步用 `std::invoke(compare, *next, *current)`（或 `utility::as_function`），即可直接接受 `lhs.compare_to(rhs)` 式成员函数指针。

## 5. 降到前向迭代器

`last--` 需要双向迭代器。改为先算长度，第 n 趟只做 `size-n` 次比较：

```cpp
template<typename ForwardIterator, typename Compare>
auto bubble_sort(ForwardIterator first, ForwardIterator last,
                 Compare compare)
    -> void
{
    auto size = std::distance(first, last);
    if (size < 2) return;

    while (--size) {
        auto current = first;
        auto next = std::next(current);
        for (std::size_t i = 0; i < size; ++i) {
            if (std::invoke(compare, *next, *current)) {
                std::iter_swap(current, next);
            }
            ++next;
            ++current;
        }
    }
}
```

sorter 上把 `iterator_category` 改为 `std::forward_iterator_tag`。

## 6. 投影参数

算法内对参与比较的值套投影；并用 `as_function`，以便成员指针当键：

```cpp
auto&& comp = cppsort::utility::as_function(compare);
auto&& proj = cppsort::utility::as_function(projection);
// ...
if (comp(proj(*next), proj(*current))) {
    std::iter_swap(current, next);
}
```

sorter 增加默认 `Projection = utility::identity`，并以 `is_projection_iterator_v` 做 SFINAE（利于 `hybrid_adapter`）。

**捷径：** 若投影只出现在比较里、无额外优化空间，可只实现比较 overload，并：

```cpp
typename = std::enable_if_t<not cppsort::is_projection_iterator_v<
    Compare, ForwardIterator
>>
```

让 `sorter_facade` 把投影烤进比较再转发。

## 7. Proxy 迭代器

为支持 `vector<bool>` 等代理引用，交换改为 ADL 风格的库工具：

```cpp
using cppsort::utility::iter_swap;
iter_swap(current, next);
```

（3.x 起对应头迁移到 `mstd::iter_swap`，见 [20](#/note/cpp/cpp-sort/20-miscellaneous-utilities)。）

## 8. 已知长度优化

对 `list` 等，`.size()` 是 O(1)，而 `distance` 是 O(n)。算法改为吃 `size`；sorter **额外提供 range overload**，内部用 `utility::size`：

```cpp
template<typename ForwardIterator, typename Compare>
auto bubble_sort(ForwardIterator first, std::size_t size,
                 Compare compare)
    -> void
{
    if (size < 2) return;
    while (--size) {
        auto current = first;
        auto next = std::next(current);
        for (std::size_t i = 0; i < size; ++i) {
            if (std::invoke(compare, *next, *current)) {
                using cppsort::utility::iter_swap;
                iter_swap(current, next);
            }
            ++next;
            ++current;
        }
    }
}

struct bubble_sorter_impl
{
    template<
        typename ForwardIterator,
        typename Compare = std::less<>,
        typename = std::enable_if_t<not cppsort::is_projection_iterator_v<
            Compare, ForwardIterator
        >>
    >
    auto operator()(ForwardIterator first, ForwardIterator last,
                    Compare compare={}) const
        -> void
    {
        bubble_sort(first, std::distance(first, last),
                    std::move(compare));
    }

    template<
        typename ForwardRange,
        typename Compare = std::less<>,
        typename = std::enable_if_t<not cppsort::is_projection_v<
            Compare, ForwardRange
        >>
    >
    auto operator()(ForwardRange&& range, Compare compare={}) const
        -> void
    {
        bubble_sort(std::begin(range),
                    cppsort::utility::size(range),
                    std::move(compare));
    }

    using iterator_category = std::forward_iterator_tag;
    using is_always_stable = std::true_type;
};
```

range 用转发引用，以便临时 `span` 类也能用；facade 在收到完整容器时会优先走你写的 range overload。

## 9. 全局实例与错误信息

```cpp
inline constexpr bubble_sorter bubble_sort{};
```

改进诊断的小技巧：

1. **继承** facade，而不是 `using` 别名，使错误信息里出现短名 `bubble_sorter`：

```cpp
struct bubble_sorter:
    cppsort::sorter_facade<detail::bubble_sorter_impl>
{};
```

2. 在 `operator()` 里对迭代器类别做 `static_assert`（对「仅随机访问」的 sorter 收益更大；上游曾把 heap_sorter 误用 `list` 时的报错从 70+ 行压到约 4 行）。

Concepts 不在 2.x 主路径上；许多失败仍依赖 SFINAE，故这些小改进仍然值得。

## 步骤地图

```mermaid
flowchart LR
  A[算法] --> B[facade]
  B --> C[traits]
  C --> D[比较]
  D --> E[前向迭代器]
  E --> F[投影 / SFINAE]
  F --> G[iter_swap]
  G --> H[size 优化]
  H --> I[全局实例]
```

按此顺序实现，即可得到一个能与 hybrid / 稳定化 / 投影工具协作的比较排序 sorter；再套 [21](#/note/cpp/cpp-sort/21-writing-a-sorter) 的规则表做自检。
