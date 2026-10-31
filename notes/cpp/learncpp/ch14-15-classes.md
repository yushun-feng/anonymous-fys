---
title: 第 14–15 章：类
tags: [cpp, learncpp, class, oop]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 14–15 章：类

> 来源：[learncpp.cn](https://learncpp.cn/) 第 14–15 章

## 小节地图

**14**：OOP、类与成员函数、const 成员、访问控制、访问器、返回成员引用的风险、封装收益、构造与成员初始化列表、默认/委托构造、临时对象、拷贝构造与省略、`explicit`、constexpr 类。  
**15**：`this` 与链式调用、类与头文件、嵌套类型、析构、类模板成员、static 成员、friend、ref-qualifiers。

## 要点

- 用私有数据 + 公有接口维护不变量；能 `const` 的成员函数标 `const`。
- 成员初始化列表初始化成员；委托构造减少重复。
- `explicit` 防止单参构造意外转换。
- 析构与资源释放对应——接第 22 章与 [RAII 笔记](../raii-and-ownership.md)。

## 易错点

- 返回可修改的成员引用，破坏封装。
- 在构造函数体内赋值代替初始化列表（const/引用成员无法如此）。
- friend 范围过大，耦合上升。
- 忘记虚析构（有继承多态时）——见第 25 章。
