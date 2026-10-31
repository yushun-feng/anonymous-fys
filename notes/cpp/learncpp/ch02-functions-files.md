---
title: 第 2 章：函数与多文件
tags: [cpp, learncpp, functions]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 2 章：函数与多文件

> 来源：[learncpp.cn](https://learncpp.cn/) 第 2 章

## 小节地图

函数入门、返回值、`void`、形参/实参、局部作用域、为何用函数、前向声明、多 `.cpp`、命名空间、预处理器、头文件与头文件保护、程序设计、测验。

## 要点

- 函数把任务切成可测单元；返回类型、参数列表、函数体三者要一致。
- **声明 vs 定义**：可多次声明，通常一次定义（ODR）。
- 头文件放声明，源文件放定义；用 include guard / `#pragma once` 防重复包含。
- `std` 是命名空间；避免在头文件里 `using namespace std;`。

## 易错点

- 只有定义没有前向声明，调用顺序导致“找不到函数”。
- 头文件互相包含形成环，或把带静态数据的定义放进头文件导致多重定义。
- 多文件项目忘记把某个 `.cpp` 加入构建。

```cpp
// math.hpp
#pragma once
int add(int a, int b);  // 声明

// math.cpp
int add(int a, int b) { return a + b; }  // 定义
```
