---
title: 第 4 章：基本数据类型
tags: [cpp, learncpp, types]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 4 章：基本数据类型

> 来源：[learncpp.cn](https://learncpp.cn/) 第 4 章

## 小节地图

基本类型概览、`void`、`sizeof`、有符号/无符号整数、定宽整数与 `size_t`、科学计数法、浮点、布尔、`if` 入门、字符、`static_cast` 入门。

## 要点

- 整数宽度与平台相关；需要可移植宽度时用 `<cstdint>` 定宽类型。
- 教程倾向：**日常计数优先有符号类型**；无符号易在混合运算与递减时“绕回”。
- 浮点有精度与舍入误差；相等比较要谨慎。
- `sizeof` 得到字节数；`char` 是字符也是整数族一员。

## 易错点

- `unsigned` 与 `signed` 混算导致意外转换。
- 用 `float` 累加大量小数却期望精确金额。
- C 风格强转掩盖收窄；优先 `static_cast` 并想清楚意图。
