---
title: Cherno：变量、函数、头文件与控制流
tags: [cpp, cherno, basics, control-flow]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=zB9RI8_wExo
---

# Cherno：变量、函数、头文件与控制流

> 视频：[Variables](https://www.youtube.com/watch?v=zB9RI8_wExo) · [Functions](https://www.youtube.com/watch?v=V9zuox47zr0) · [Header Files](https://www.youtube.com/watch?v=9RJTQmK0YPI) · [Conditions](https://www.youtube.com/watch?v=qEgCT87KOfc) · [Loops](https://www.youtube.com/watch?v=_1AwR-un4Hk) · [Control Flow](https://www.youtube.com/watch?v=a3IZ8WaIFAA)  
> 相关：[LearnCpp ch01](../learncpp/ch01-basics.md)、[ch02](../learncpp/ch02-functions-files.md)、[ch08](../learncpp/ch08-control-flow.md)、[ch03 调试](../learncpp/ch03-debugging.md)

## 覆盖集

变量与类型体感；函数与调用；头文件 / include guard；调试入门；`if`、循环、`continue` / `break` / `return`。

## 要点

- 变量 = 有类型的命名存储；理解「名字 ↔ 内存中的值」比死记关键字列表更重要。
- 函数把逻辑打包；返回类型与参数构成合约。前向声明让调用顺序更自由。
- 头文件放声明，配合 `#pragma once` 或 include guard 防重复包含。
- 分支与循环是控制流骨架；`break`/`continue`/`return` 改变执行路径，嵌套时要写清楚意图。
- 调试：断点、单步、监视变量——比「加一堆 print 碰运气」更可扩展。

## 易错点

- 在头文件里放有状态的定义（非 inline/模板）→ 多重定义。
- 条件里误用赋值 `=` 代替比较 `==`。
- 无限循环或循环变量更新写错，导致逻辑「看起来卡死」。

```cpp
#pragma once
int add(int a, int b);

// ---
int add(int a, int b) { return a + b; }
```
