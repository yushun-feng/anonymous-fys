---
title: cpp-sort：精化比较 / 投影
tags: [cpp, cpp-sort, refined, comparator, projection, sorter_facade]
topic: cpp
updated: 2026-11-08
order: 19
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Refined-functions
---

# 精化（refine）比较与投影

> 出处：[Wiki Refined-functions](https://github.com/Morwenn/cpp-sort/wiki/Refined-functions)  
> 说明：原创中文消化；细节以上游为准。相关：[写 sorter](#/note/cpp/cpp-sort/21-writing-a-sorter) · [杂项工具](#/note/cpp/cpp-sort/20-miscellaneous-utilities)

## 为何需要 refine

`std::less<>` 这类**类型无关**比较器好用：不用提前写死 `T`，由 `operator()` 再推导。但有时**在比较前就知道类型**更划算——例如大小写不敏感比较要调 `std::use_facet<std::ctype<CharT>>`，开销不小（见 Matt Austern 相关文章）；若比较器构造时已知 `CharT`，可只查一次 facet。

cpp-sort 里部分比较器 / 投影提供 `refine`：**吃一个类型实参，返回利用该类型信息的新函数对象**。

```cpp
auto typed_compare = compare.refine<T>();
```

例如类型化的 `case_insensitive_less`：构造时对 `CharT` 做一次 `use_facet`。

## `sorter_facade` 自动精化

手写 `refine` 仍嫌烦时，**`sorter_facade` 已代劳**：若传入的比较或投影有合适的 `refine`，facade 会用迭代器 / 容器的 `value_type` 自动调用，并把结果交给 *sorter implementation*，而不是原始的类型无关对象。

效果：API 仍保持「到处塞 `std::less{}`」的简洁，底层又能吃到类型特化优化。

## API：`refined` / `refined_t`

```cpp
#include <cpp-sort/refined.h>
```

```cpp
template<typename T, typename Function>
auto refined(Function&& func)
    noexcept(noexcept(/* returned expression */))
    -> /* 有 refine 则 func.template refine<T>()，否则原样返回 func */;

template<typename T, typename Function>
using refined_t = std::remove_cvref_t<
    decltype(refined<std::decay_t<T>>(std::declval<Function&>()))
>;
```

自写比较器若有「构造期可缓存的类型相关状态」，优先提供 `refine`；日常用户侧多半只需依赖 facade 自动精化，或偶发手调 `cppsort::refined<T>(func)`。

上一篇：[18 可链式投影](#/note/cpp/cpp-sort/18-chainable-projections) · 下一篇：[20 杂项 utilities](#/note/cpp/cpp-sort/20-miscellaneous-utilities)。
