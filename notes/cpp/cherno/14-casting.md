---
title: Cherno：转型、union 与 type punning
tags: [cpp, cherno, casting, union]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=pWZS1MtxI-A
---

# Cherno：转型、union 与 type punning

> 视频：[Type Punning](https://www.youtube.com/watch?v=8egZ_5GA9Bc) · [Unions](https://www.youtube.com/watch?v=6uqU9Y578n4) · [Casting](https://www.youtube.com/watch?v=pWZS1MtxI-A) · [Dynamic Casting](https://www.youtube.com/watch?v=CiHfz6pTolQ)  
> 相关：[LearnCpp ch10](../learncpp/ch10-type-conversion.md)、[ch23–25 多态](../learncpp/ch23-25-oop-hierarchy.md)

## 覆盖集

C 风格转型 vs C++ 命名转型；`static_cast` / `reinterpret_cast` / `const_cast` / `dynamic_cast`；union 与底层 bit 重解释的风险。

## 要点

- 命名转型写清意图，比 `(T)x` 更可检索、更安全（例如不易顺手去掉 `const`）。
- `static_cast`：相关类型间的编译期转换；`dynamic_cast`：多态层级运行时检查（需要 RTTI，失败指针得空）。
- `reinterpret_cast` / type punning：按比特重看内存——强大且易掉进严格别名 / UB；优先 `memcpy`、`bit_cast`（C++20）等更明确手段。
- `union`：同一存储多种解释；现代代码里很多场景被 `std::variant` 取代（见 [15](./15-modern-utilities.md)）。

## 易错点

- 对非多态类型使用 `dynamic_cast`。
- 用 C 风格转型悄悄去掉 `const` 或做危险重解释。
- 通过非法别名读写活性类型之外的成员。

```cpp
double d = 3.14;
int truncated = static_cast<int>(d);

Base* b = /* ... */;
if (auto* p = dynamic_cast<Derived*>(b)) {
  // 确认是 Derived
}
```
