---
title: 第 5 章：常量与字符串
tags: [cpp, learncpp, const, string]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 5 章：常量与字符串

> 来源：[learncpp.cn](https://learncpp.cn/) 第 5 章

## 小节地图

命名常量、字面量、进制、as-if 与编译期优化、常量表达式、`constexpr`、`std::string`、`std::string_view`（两篇）。

## 要点

- `const`：运行期不可改；`constexpr`：强调编译期可知（在满足条件下）。
- 魔法数字提成命名常量，可读性与单点修改更好。
- `std::string` 拥有内存；`string_view` 是非拥有视图，适合只读参数。
- as-if 规则：编译器可优化，只要可观察行为一致。

## 易错点

- 让 `string_view` 指向临时 `string` / 即将销毁的缓冲 → 悬空视图。
- 把运行期才知道的值强行写成错误的 `constexpr`。
- 在需要拥有副本的地方误用 view。

```cpp
#include <string>
#include <string_view>

void print_name(std::string_view name);  // 只读、不强迫分配
```
