---
title: Cherno：const、对象创建与栈堆
tags: [cpp, cherno, const, memory, new]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=4fJBrditnJU
---

# Cherno：const、对象创建与栈堆

> 视频：[CONST](https://www.youtube.com/watch?v=4fJBrditnJU) · [Instantiate Objects](https://www.youtube.com/watch?v=Ks97R1knQDY) · [NEW](https://www.youtube.com/watch?v=NUZdUSqsCs4) · [explicit](https://www.youtube.com/watch?v=Rr1NX1lH3oE) · [Stack vs Heap](https://www.youtube.com/watch?v=wJ1L2nSIV1s)  
> 相关：[LearnCpp ch05](../learncpp/ch05-constants-strings.md)、[ch18–19](../learncpp/ch18-19-iterators-dynamic.md)、[RAII](../raii-and-ownership.md)

## 覆盖集

`const` / `mutable`；成员初始化列表；栈上 vs 堆上创建对象；`new`/`delete`；隐式转换与 `explicit`；栈与堆的差异。

## 要点

- `const` 承诺不改（通过该视图）；指针/`const` 组合要分清「指针不可变」还是「所指不可变」。
- 成员初始化列表在进入构造体之前初始化成员；引用与 `const` 成员依赖它。
- 栈对象随作用域自动结束；堆对象用 `new` 分配，必须有人负责 `delete`（更推荐智能指针，见 [09](./09-smart-pointers.md)）。
- 单参构造可能触发隐式转换；不需要时标 `explicit`。
- 栈：快速、自动、空间有限；堆：灵活、需手动/RAII 管理、分配更贵。

## 易错点

- `new` 了忘记释放，或重复 `delete`。
- 用完堆对象后仍持有悬空指针。
- 依赖隐式转换写出难读、易错的重载决议。

```cpp
struct Vec2 {
  explicit Vec2(float v) : x(v), y(v) {}
  float x, y;
};

auto* p = new Vec2(1.f);
delete p;
```
