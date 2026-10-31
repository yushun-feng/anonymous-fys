---
title: 第 16–17 章：vector 与 array
tags: [cpp, learncpp, vector, array]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 16–17 章：vector 与 array

> 来源：[learncpp.cn](https://learncpp.cn/) 第 16–17 章

## 小节地图

**16**：容器入门、`std::vector`、长度下标与无符号问题、传参/返回与移动引言、循环与范围 for、枚举下标、`resize`/`capacity`、栈行为、`vector<bool>` 特例。  
**17**：`std::array`、传返、引用包装、与枚举、C 数组与退化、指针算术、C 字符串、多维数组。

## 要点

- 动态序列优先 `std::vector`；固定长度、可放栈上时用 `std::array`。
- 范围 for 简洁；需要索引时再经典 for。
- C 数组传参会**退化成指针**，长度信息丢失——这是改用 `array`/`span` 的理由之一。
- `vector` 扩容可能使迭代器/引用失效。

## 易错点

- 依赖 `vector<bool>` 的“真 `bool&`”行为（它是特化代理）。
- 循环中一边遍历一边无节制 `push_back` 却抓着旧迭代器。
- 把 C 字符串当普通数组随便 `strcpy` 导致溢出。
