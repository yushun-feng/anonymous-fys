---
title: 第 20 章：函数进阶
tags: [cpp, learncpp, lambda, functions]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 20 章：函数进阶

> 来源：[learncpp.cn](https://learncpp.cn/) 第 20 章

## 小节地图

函数指针、栈与堆、递归、命令行参数、省略号（避免）、lambda 与捕获。

## 要点

- 函数指针适合 C 风格回调；C++ 中更常 lambda / `std::function`（按需）。
- 栈帧自动、快速；堆可动态生存，但分配有成本与错误面。
- 递归要有明确基例与问题规模递减；注意栈溢出。
- lambda 捕获：值捕获拷贝，引用捕获不延长寿命。

## 易错点

- 引用捕获局部变量后把 lambda 存出去 → 悬空。
- 可变参数省略号无类型安全；改用变参模板。
- 深递归处理大规模数据。

```cpp
std::vector<int> v{1,2,3};
int factor = 10;
std::transform(v.begin(), v.end(), v.begin(),
               [factor](int x) { return x * factor; });
```
