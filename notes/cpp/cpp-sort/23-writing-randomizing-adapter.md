---
title: 实作 randomizing_adapter
tags: [cpp, cpp-sort, adapter, tutorial, randomizing]
topic: cpp
updated: 2026-11-08
order: 23
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Writing-a-randomizing_adapter
---

# 实作 `randomizing_adapter`

> 出处：[Wiki · Writing a randomizing_adapter](https://github.com/Morwenn/cpp-sort/wiki/Writing-a-randomizing_adapter)  
> 前置：[22 bubble_sorter](#/note/cpp/cpp-sort/22-writing-bubble-sorter)（教程假定已读）· [02 架构](#/note/cpp/cpp-sort/02-sorter-architecture) · 下一篇：[24 容器感知](#/note/cpp/cpp-sort/24-writing-container-aware)

本篇消化上游教程：写一个 **先 `shuffle`、再交给被包装 sorter** 的 adapter。完整示例在仓库 `examples/`。

## 为什么要先打乱再排序？

排序本意是「变整齐」，先打乱似乎矛盾。两个常见动机：

1. **打断对 quicksort 不友好的模式**  
   某些 pivot 选取下，近似有序数据仍可能逼近平方级。真实数据常带预有序，有人主张先 shuffle。库自带的 `quick_sorter` 已有 O(n log n) 最坏保证，这类技巧对它并非刚需；对「朴素 quick」包装时才更有意义。  
   注意：这**不**保证合成后仍是 O(n log n)，只是让平方级路径更少见。

2. **对抗 Hyrum 定律**  
   用户可能依赖「等价元素的相对顺序」这类**未承诺却可观测**的行为（金丝雀 / 表征测试尤甚）。调试路径里先 shuffle，让等价序非确定，能故意戳破这种隐性依赖。libc++ 用宏包一层；cpp-sort 风格则是给用户一个可组合 adapter。

## 最小实现

写 adapter 与写 sorter 同套路：合适的 `operator()`、声明 `iterator_category`、可选声明稳定性。

```cpp
template<typename Sorter>
struct randomizing_adapter
{
    template<typename RandomAccessIterator, typename... Args>
    auto operator()(RandomAccessIterator begin, RandomAccessIterator end,
                    Args&&... args) const
        -> decltype(Sorter{}(begin, end, std::forward<Args>(args)...))
    {
        thread_local std::random_device device;
        thread_local std::minstd_rand engine(device());
        std::shuffle(begin, end, engine);
        return Sorter{}(begin, end, std::forward<Args>(args)...);
    }

    using iterator_category = std::random_access_iterator_tag;
    using is_always_stable = std::false_type;
};
```

要点：

- 用 `std::shuffle` → **只要随机访问**。  
- 打乱后稳定排序也不再稳定 → `is_always_stable = false_type`。  
- 返回类型用 **expression SFINAE**（`decltype(...)`）传递被包装 sorter 的约束与返回值，简单场景不必立刻上完整 `sorter_facade`。

用法：

```cpp
using randomizing_quicksort = randomizing_adapter<quick_sorter>;
```

## 返回值与构造

惯例：能透传就透传——用包装后的 adapter **替换**原 sorter 应尽量无痛。本 adapter 没有自己的返回语义，直接转发被包装 sorter 的返回值。

还应能从「被适配 sorter 的实例」显式构造（即使当前不存状态），以配合 CTAD：

```cpp
randomizing_adapter() = default;
constexpr explicit randomizing_adapter(Sorter) {}

// CTAD 示例
auto sort = randomizing_adapter(cppsort::poplar_sorter);
```

## `utility::adapter_storage`

有状态 sorter 需要真正持有实例。库提供 `utility::adapter_storage<Sorter>`：值语义拷贝一份；空 sorter 特化成**不存对象**，`get()` 时再默认构造——这样包装空 sorter 时 adapter 仍可能退化成函数指针。

```cpp
template<typename Sorter>
struct randomizing_adapter:
    cppsort::utility::adapter_storage<Sorter>
{
    randomizing_adapter() = default;

    constexpr explicit randomizing_adapter(Sorter sorter):
        cppsort::utility::adapter_storage<Sorter>(std::move(sorter))
    {}

    template<typename RandomAccessIterator, typename... Args>
    auto operator()(RandomAccessIterator begin, RandomAccessIterator end,
                    Args&&... args) const
        -> decltype(this->get()(begin, end, std::forward<Args>(args)...))
    {
        thread_local std::random_device device;
        thread_local std::minstd_rand engine(device());
        std::shuffle(begin, end, engine);
        return this->get()(begin, end, std::forward<Args>(args)...);
    }
};
```

## 可再打磨

- 增加接受 **range / 容器** 的 `operator()`，便于 O(1) `.size()`。  
- 对非随机访问迭代器加 `static_assert`，错误信息更直白。

## 带走的设计准则

好的 adapter 理想上能**无痛替换**被包装 sorter；「shuffle + 转发」只是入门，真实 adapter 往往还要处理 facade 重载组合、SFINAE 与状态存储。

站内相关：[25 Tooling](#/note/cpp/cpp-sort/25-tooling)（跑 examples）· [26 Benchmarks](#/note/cpp/cpp-sort/26-benchmarks)。
