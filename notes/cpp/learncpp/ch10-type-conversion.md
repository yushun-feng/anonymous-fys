---
title: 第 10 章：类型转换、别名与推断
tags: [cpp, learncpp, conversion, auto]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 10 章：类型转换、别名与推断

> 来源：[learncpp.cn](https://learncpp.cn/) 第 10 章

## 小节地图

隐式转换、整型提升、数值转换、收窄与列表初始化、算术转换、显式转换与 `static_cast`、typedef/别名、`auto` 对象与函数返回推断。

## 要点

- 隐式转换按规则“升级/转换”；混用有符号无符号时尤其要小心。
- 列表初始化通常拒绝收窄，有利于安全。
- 类型别名提高可读性，但不创建新类型（强类型仍靠 class/enum class）。
- `auto` 丢掉顶层引用/const 的规则要记清；需要时写 `const auto&`。

## 易错点

- 以为 `auto` 一定推成引用。
- C 风格 `(int)x` 过于强力且难搜；优先具名 cast。
- 表达式里无意触发的算术转换改变比较结果。
