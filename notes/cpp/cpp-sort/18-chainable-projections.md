---
title: cpp-sort：可链式投影
tags: [cpp, cpp-sort, projection, chainable, operator|]
topic: cpp
updated: 2026-11-08
order: 18
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Chainable-projections
---

# 可链式投影

> 出处：[Wiki Chainable-projections](https://github.com/Morwenn/cpp-sort/wiki/Chainable-projections)  
> 说明：原创中文消化；细节以上游为准。相关：[比较器适配器](#/note/cpp/cpp-sort/17-comparator-adapters) · [杂项工具](#/note/cpp/cpp-sort/20-miscellaneous-utilities)

有时比较前要做**多层变换**（先取成员、再取负、再……）。cpp-sort 里部分投影可用 `operator|` 组合，语义接近管道：左边结果喂给右边。

## 让自定义投影可链式

让函数对象继承 `utility::projection_base<F>`（CRTP），即可参与 `|` 重载：该投影可出现在 `|` 任一侧，另一侧可以是任意合适的 *Callable*。

```cpp
struct my_negate:
    cppsort::utility::projection_base<my_negate>
{
    int operator()(int value) const
    {
        return -value;
    }
};

struct wrapper { int value; };
std::vector<wrapper> vec = { /* ... */ };

my_negate projection;
// 先 &wrapper::value，再 my_negate
cppsort::poplar_sort(vec, &wrapper::value | projection);
```

## `as_projection` 与 identity 短路

[`utility::as_projection`](#/note/cpp/cpp-sort/20-miscellaneous-utilities) 的返回值也继承 `projection_base`，因此是把任意合适投影「升级」为可 `|` 组合对象的正规入口。

若 `|` 一侧是 `utility::identity` 或 `std::identity`，则**直接返回另一侧**（无额外包装）。

两侧投影都透明时，组合结果也透明。

## 心智模型

```text
投影A | 投影B  ≈  x ↦ B(A(x))
```

写自用投影时：需要管道就继承 `projection_base`；临时包装用 `as_projection`；默认同元用 `std::identity`（3.x 起勿再依赖已移除的 `utility::identity`）。

上一篇：[17 比较器适配器](#/note/cpp/cpp-sort/17-comparator-adapters) · 下一篇：[19 精化](#/note/cpp/cpp-sort/19-refined-functions)。
