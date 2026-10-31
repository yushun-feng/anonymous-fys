---
title: 第 12 章：引用与指针
tags: [cpp, learncpp, references, pointers]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 12 章：引用与指针

> 来源：[learncpp.cn](https://learncpp.cn/) 第 12 章

## 小节地图

复合类型、值类别、左值引用与 const 引用、按引用传递、指针与空指针、指针与 const、按址传递、返回引用/指针、in/out 参数、类型推断、`std::optional`。

## 要点

- 引用须绑定到对象，不能空、不能 reseat（常规左值引用）。
- 大对象只读传递优先 `const T&`；可能缺省时考虑 `std::optional`。
- 指针可空、可 reseat；解引用前保证有效。
- 不要返回指向局部自动对象的引用/指针。

## 易错点

- 悬空引用/指针（临时对象、已释放内存）。
- `const int *` 与 `int * const` 混淆。
- 输出参数过多，不如返回结构体/`optional`。

```cpp
void scale(std::vector<double>& v, double k);           // 就地修改
double mean(const std::vector<double>& v);              // 只读
```
