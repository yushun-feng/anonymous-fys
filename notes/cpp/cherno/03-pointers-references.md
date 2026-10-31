---
title: Cherno：指针与引用
tags: [cpp, cherno, pointers, references]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=DTxHyVn0ODg
---

# Cherno：指针与引用

> 视频：[POINTERS](https://www.youtube.com/watch?v=DTxHyVn0ODg) · [REFERENCES](https://www.youtube.com/watch?v=IzoFn3dfsPA)  
> 相关：[LearnCpp ch12](../learncpp/ch12-references-pointers.md)

## 覆盖集

指针存的是地址；解引用与取址；引用作为已有对象的别名（系列强调：语义上常可看成「语法糖版指针」）。

## 要点

- 指针变量本身占存储，内容是地址；可为空、可 reseat、可算术（慎用）。
- `&` 在声明旁表示引用类型；在表达式中表示取地址——**看上下文**。
- 引用必须绑定到已有对象，通常不能空、不能 reseat；用起来像原变量。
- 传参场景：要修改实参或避免大对象拷贝时，优先想引用（只读用 `const T&`）；需要「可空 / 可 reseat」再用指针。

## 易错点

- 解引用空指针或已失效地址。
- 把「引用必须初始化」和「指针可晚赋值」混为一谈。
- 返回指向局部自动对象的指针/引用 → 悬空。

```cpp
int x = 5;
int* p = &x;   // 指针：存地址
int& r = x;    // 引用：别名
*p = 2;
r = 3;         // x 变为 3
```
