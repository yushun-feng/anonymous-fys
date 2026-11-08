---
title: cpp-sort：比较器适配器
tags: [cpp, cpp-sort, comparator, adapters, flip, not_fn]
topic: cpp
updated: 2026-11-08
order: 17
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Comparator-adapters
---

# 比较器适配器

> 出处：[Wiki Comparator-adapters](https://github.com/Morwenn/cpp-sort/wiki/Comparator-adapters)  
> 说明：原创中文消化；细节以上游为准。路线见 [00](#/note/cpp/cpp-sort/00-roadmap)。相关：[比较器与投影](#/note/cpp/cpp-sort/15-comparators-and-projections) · [杂项工具](#/note/cpp/cpp-sort/20-miscellaneous-utilities)

这些适配器主要用来**包装二元谓词**，自身也应满足 *BinaryPredicate*。每个适配器通常成对出现：

| 形态 | 作用 |
|------|------|
| 类模板（如 `flip_t`、`not_fn_t`） | 真正持有可调用对象的比较器类型 |
| 函数模板（如 `flip`、`not_fn`） | 方便构造，并做「解包」优化，减少嵌套实例化 |

解包只针对「合逻辑」的组合；若比较器很刁钻、必须保留额外包装，请**直接用类模板**，别走构造函数。

```cpp
auto cmp = std::less{};
auto cmp2 = cppsort::flip(cmp);  // flip_t<std::less<>>
auto cmp3 = cppsort::flip(cmp2); // 解回 std::less<>
```

## `flip` / `flip_t`

```cpp
#include <cpp-sort/comparators/flip.h>
```

灵感来自 Haskell Prelude 的 `flip`：调用时把参数**左右对调**再转发给内部 *Callable*。

要点：

- 构造：默认 / 拷贝 / 移动包装 `F`
- `operator()`：`invoke(base(), y, x)`（各值类别重载）
- `base()`：取回被包装对象
- `F` 透明 → `flip_t<F>` 透明；`F` 视为无分支 → `flip_t` 也视为无分支

`cppsort::flip(f)` 一般返回 `flip_t<decay_t<F>>`，例外：

- 已是 `flip_t<F>` → 解回 `F`
- `not_fn_t<flip_t<F>>` → `not_fn_t<F>`
- `projection_compare_t` → `projection_compare(flip(比较), 投影)`

## `not_fn` / `not_fn_t`

```cpp
#include <cpp-sort/comparators/not_fn.h>
```

大致等价于 `std::not_fn` 返回的类型：对内部调用结果取反。

`cppsort::not_fn(f)` 一般返回 `not_fn_t<decay_t<F>>`，例外：

- 已是 `not_fn_t<F>` → 解回 `F`
- `flip_t<not_fn_t<F>>` → `flip_t<F>`
- `projection_compare_t` → `projection_compare(not_fn(比较), 投影)`

同样：底层透明 / 无分支特质会向上传递。

## `projection_compare` / `projection_compare_t`

```cpp
#include <cpp-sort/comparators/projection_compare.h>
```

把**比较 + 投影**捆成单一比较对象，好塞进只认比较器的算法（例如 C++20 前的标准库排序）。

```cpp
std::vector<Person> family = { /* ... */ };
std::sort(family.begin(), family.end(),
          cppsort::projection_compare(std::greater{}, &Person::age));
```

调用语义：`comp(proj(x), proj(y))`。`comparison()` / `projection()` 可取回两半。

`projection_compare(c, p)` 一般返回 `projection_compare_t<decay_t<C>, decay_t<P>>`；若投影是 `utility::identity` 或 `std::identity`，则**直接返回比较器** `C`。

透明 / 无分支：比较与投影都透明（或投影无分支且对投影结果的比较无分支）时，合成对象也继承相应特质。

## 怎么记

1. **类模板 = 真类型，函数模板 = 构造 + 解包。**  
2. `flip` / `not_fn` 可互相「抵消」一层嵌套。  
3. 给老算法加投影优先想 `projection_compare`；库内原生 projection 接口则不必硬捆。
