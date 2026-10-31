---
title: Cherno：拷贝与 std::vector
tags: [cpp, cherno, copy, vector]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=BvR1Pgzzr38
---

# Cherno：拷贝与 std::vector

> 视频：[Copying and Copy Constructors](https://www.youtube.com/watch?v=BvR1Pgzzr38) · [Dynamic Arrays / vector](https://www.youtube.com/watch?v=PocJ5jXv8No) · [Optimizing vector](https://www.youtube.com/watch?v=HcESuwmlHEY)  
> 相关：[LearnCpp ch16–17](../learncpp/ch16-17-arrays.md)、[ch14–15 拷贝](../learncpp/ch14-15-classes.md)、[ch22 移动](../learncpp/ch22-move-smart-pointers.md)

## 覆盖集

拷贝构造与深/浅拷贝；`std::vector` 动态数组；容量、`reserve`、避免无谓重分配与多余拷贝。

## 要点

- 默认拷贝往往是成员逐个拷贝；类若拥有裸资源，通常要自己定义拷贝/移动/析构（规则之三/五/零）。
- 浅拷贝指针 → 双删或悬空；拥有堆内存时考虑深拷贝或改用智能指针/容器。
- `vector`：连续动态数组，自动扩容；`size` vs `capacity`。
- 已知大致规模时 `reserve`；`emplace_back` 可少一次临时对象；扩容会失效指针/迭代器/引用。

## 易错点

- 在持有 `vector` 元素指针后继续 `push_back` 触发扩容。
- 循环里反复小步扩容却不 `reserve`。
- 拷贝昂贵对象时忽略移动语义（见 [15](./15-modern-utilities.md)）。

```cpp
std::vector<int> v;
v.reserve(100);
for (int i = 0; i < 100; ++i) v.push_back(i);
```
