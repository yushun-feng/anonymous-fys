---
title: Cherno：智能指针
tags: [cpp, cherno, smart-pointers, unique_ptr, shared_ptr]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=UOB7-B2MfwA
---

# Cherno：智能指针

> 视频：[SMART POINTERS](https://www.youtube.com/watch?v=UOB7-B2MfwA)  
> 相关：[LearnCpp ch22](../learncpp/ch22-move-smart-pointers.md)、[RAII](../raii-and-ownership.md)

## 覆盖集

用 `unique_ptr` / `shared_ptr` / `weak_ptr` 接管堆对象寿命，少手写 `delete`。

## 要点

- **默认选 `unique_ptr`**：独占所有权，几乎零额外成本；不可拷贝，可移动。
- 需要共享所有权再用 **`shared_ptr`**（引用计数 / 控制块；优先 `make_shared`）。
- **`weak_ptr`**：观察而不延长寿命；打破 `shared_ptr` 环；可 `lock()` 试探对象是否还在。
- 工厂：`std::make_unique` / `std::make_shared` 比裸 `new` 喂构造更安全、更清晰。

## 易错点

- 到处 `shared_ptr`「图省事」——共享图变复杂、环难查。
- 从 `unique_ptr` 取出裸指针后仍以为所有权清晰。
- 多个智能指针管理同一块用裸 `new` 得到的内存且未统一策略。

```cpp
auto e = std::make_unique<Entity>();
std::shared_ptr<Entity> a = std::make_shared<Entity>();
std::weak_ptr<Entity> w = a;  // 不增加引用计数
```
