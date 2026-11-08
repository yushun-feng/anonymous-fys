---
title: cpp-sort：sorter_facade
tags: [cpp, cpp-sort, sorter-facade, unified-interface]
topic: cpp
updated: 2026-11-08
order: 12
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Sorter-facade
---

# sorter_facade：统一排序接口的样板生成器

> 出处：[Wiki · Sorter facade](https://github.com/Morwenn/cpp-sort/wiki/Sorter-facade)  
> 上一篇：[11 Metrics](#/note/cpp/cpp-sort/11-metrics) · 下一篇：[13 sorter_traits](#/note/cpp/cpp-sort/13-sorter-traits) · 架构总览：[02](#/note/cpp/cpp-sort/02-sorter-architecture)

写一个「完整」sorter，理论上要自己堆很多冗余的 `operator()`：迭代器对 / range × 有无比较器 × 有无投影。**`sorter_facade`** 吃一个**最小 sorter 实现**，帮你生成统一排序接口的样板。

```cpp
struct frob_sorter_impl {
    // 最小算法接口：通常一个 operator()(first, last, compare, projection)
};

struct frob_sorter : cppsort::sorter_facade<frob_sorter_impl> {};
```

`sorter_facade` **公开继承**模板参数，因此实现里的嵌套别名、额外成员函数都会透出来；被覆盖的调用最终仍落到实现上。

> 日常用库只要知道「调用形态一致」；自写 sorter / 读官方源码时才需要正面碰 facade。

## 构造

- 实现默认可构造 ⇒ facade 默认可构造。  
- 另有完美转发构造：把参数塞进实现基类。

```cpp
template<typename... Args>
constexpr sorter_facade(Args&&... args)
    : Sorter(std::forward<Args>(args)...)
{}
```

## 转成函数指针

若实现是**空且默认可构造**的类型，facade 提供转换运算符，把 sorter 变成对应 overload 的函数指针（返回类型可与 sorter 一致，或为 `void` 丢弃返回值）。这方便塞进 C 风格回调。

**注意：** MSVC 上该转换不可用（上游 [issue #185](https://github.com/Morwenn/cpp-sort/issues/185)）。

## `operator()` 职责

返回值：尽量转发实现里被选中的那个 `operator()` 的结果。

### 迭代器对

四档经典组合：

```cpp
template<typename Iterator>
constexpr auto operator()(Iterator first, Iterator last) const;

template<typename Iterator, typename Compare>
constexpr auto operator()(Iterator first, Iterator last, Compare compare) const;

template<typename Iterator, typename Projection>
constexpr auto operator()(Iterator first, Iterator last, Projection projection) const;

template<typename Iterator, typename Compare, typename Projection>
constexpr auto operator()(Iterator first, Iterator last,
                          Compare compare, Projection projection) const;
```

facade 会把 `compare` / `projection` 派到实现里最合适的 overload，缺省时补上 `std::less<>` 和/或 `utility::identity`。因此实现往往**只需一个**「迭代器对 + 比较器 + 投影」的 `operator()`，外面四种调用都齐。

把已有标准风格排序函数包成 sorter 的最短路径：

```cpp
struct selection_sorter_impl {
    template<
        typename RandomAccessIterator,
        typename Compare = std::less<>,
        typename Projection = cppsort::utility::identity
    >
    auto operator()(RandomAccessIterator first, RandomAccessIterator last,
                    Compare compare = {}, Projection projection = {}) const
        -> void
    {
        selection_sort(first, last, compare, projection);
    }
};

struct selection_sorter : cppsort::sorter_facade<selection_sorter_impl> {};
```

### Range

同样四档：`Range&&` ± compare ± projection。优先调用实现里的 range overload；没有则对 range 取 `std::begin` / `std::end`，落到迭代器对路径。缺省参数补全规则同上。

### 只懂比较、不懂投影时

若实现能吃自定义比较器、但没有投影 overload：facade 收到投影时，会把投影**烤进比较器**再交给实现。于是「只写了一个 `(first, last, compare)`」也能间接支持投影。

反过来——把比较器烤进投影——通常没意义，facade **不做**。

### 万能 `std::less<>` / `utility::identity`

库约定：没显式给比较/投影时，行为应**如同**用了 `std::less<>` 与 `utility::identity`。有些实现根本不提供带比较器的 overload；facade 仍生成接受 `std::less<>` / `identity`（以及二者组合）的 overload，好让泛型代码统一传默认对象。

有 `std::identity` / `std::ranges::less` 时，还有对称的特殊 overload。大量 SFINAE 保证：**只生成需要且可行的 overload**——若实现已经接受任意比较器，就不会再硬塞那套「魔法 `std::less<>`」重载。

## 与 traits / hybrid 的关系

facade 解决的是**调用样板**；迭代器类别、是否稳定等元信息仍靠实现或 [`sorter_traits`](#/note/cpp/cpp-sort/13-sorter-traits) 声明。想进 `hybrid_adapter`，除了 facade，还要正确的 `iterator_category` 与对不支持类型的 SFINAE 出局。

比较器与投影的语义约定见 [15](#/note/cpp/cpp-sort/15-comparators-and-projections)、[16](#/note/cpp/cpp-sort/16-comparators)。

## 易错点

1. **实现签名太窄**：若连「迭代器对 + 比较器」都没有，投影烘焙也帮不上。  
2. **MSVC 函数指针转换**：跨平台库别依赖该转换。  
3. **状态与 `const`**：多数期望 `const operator()`；有状态 sorter 仍可被 adapter 按值存一份。  
4. **别在实现里再抄一遍 facade 的四档**：重复 overload 容易和 SFINAE 打架。

## 练习

1. 用 facade 包一个自己的 `bubble_sort`（或库外已有函数），验证 `v`、`(begin,end)`、带投影三种调用。  
2. 写一个只接受 `Compare`、不接受 `Projection` 的实现，确认传入 `&T::key` 仍能编译运行。  
3. 对照官方任一 `*_sorter_impl`，标出哪些别名是给 traits / hybrid 用的。

下一篇：[13 Sorter traits](#/note/cpp/cpp-sort/13-sorter-traits)。
