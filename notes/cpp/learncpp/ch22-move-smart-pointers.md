---
title: 第 22 章：移动语义与智能指针
tags: [cpp, learncpp, move, smart-pointers]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 22 章：移动语义与智能指针

> 来源：[learncpp.cn](https://learncpp.cn/) 第 22 章  
> 相关：[RAII 与所有权](../raii-and-ownership.md)

## 小节地图

智能指针与移动引言、右值引用、移动构造/赋值、`std::move`、`unique_ptr`、`shared_ptr`、环状依赖与 `weak_ptr`。

## 要点

- 移动：偷取资源，留下有效但未指定（通常为空）的源对象。
- `unique_ptr`：独占所有权，默认选择；`shared_ptr`：共享所有权，有控制块开销。
- 环用 `weak_ptr` 破；观察不延长寿命。
- `std::move` 不移动，只是转换为右值——真正移动靠重载决议。

## 易错点

- 移动后还当源对象仍持有资源来用。
- 无必要地到处 `shared_ptr`。
- 用裸 `new` 喂给智能指针前先考虑 `std::make_unique` / `make_shared`。

视频向对照：[Cherno 智能指针](../cherno/09-smart-pointers.md)、[现代工具与移动](../cherno/15-modern-utilities.md)。

```cpp
auto p = std::make_unique<int>(42);
std::unique_ptr<int> q = std::move(p);  // 所有权转移
```
