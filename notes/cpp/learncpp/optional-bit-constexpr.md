---
title: 选修：位运算与 constexpr 函数
tags: [cpp, learncpp, bitset, constexpr]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 选修：位运算与 constexpr 函数

> 来源：[learncpp.cn](https://learncpp.cn/) 章 O（Bit Manipulation）、章 F（Constexpr functions）

## 章 O 地图

`std::bitset`、位运算、掩码、二/十进制转换。

## 章 F 地图

`constexpr` 函数多篇、`consteval`、编译期求值约束与测验。

## 要点

- 位标志：掩码置位/清位/测试；可读性不够时用 `bitset` 或枚举位。
- `constexpr` 函数在参数为常量表达式时可走编译期；否则可当普通函数。
- `consteval` 强制仅编译期（立即函数）。

## 易错点

- 移位负数或移位量过大 → UB。
- 以为标了 `constexpr` 就一定在编译期执行（还看调用语境）。
