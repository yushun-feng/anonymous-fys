---
title: Cherno：类、static、枚举与构造析构
tags: [cpp, cherno, class, oop, constructor]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=2BP8NhxjrO0
---

# Cherno：类、static、枚举与构造析构

> 视频：[CLASSES](https://www.youtube.com/watch?v=2BP8NhxjrO0) · [Classes vs Structs](https://www.youtube.com/watch?v=fLgTtaqqJp0) · [Write a Class](https://www.youtube.com/watch?v=3dHBFBw13E0) · [Static](https://www.youtube.com/watch?v=f3FVU-iwNuA) · [ENUMS](https://www.youtube.com/watch?v=x55jfOd5PEE) · [Constructors](https://www.youtube.com/watch?v=FXhALMsHwEY) · [Destructors](https://www.youtube.com/watch?v=D8cWquReFqw)  
> 相关：[LearnCpp ch13](../learncpp/ch13-enums-structs.md)、[ch14–15](../learncpp/ch14-15-classes.md)、[RAII](../raii-and-ownership.md)

## 覆盖集

类把数据与行为绑在一起；`class` vs `struct` 默认访问；如何组织一个类；`static`（文件作用域 vs 成员）；枚举；构造与析构。

## 要点

- 类 = 用户定义类型：成员数据 + 成员函数；访问控制维护不变量。
- `struct` / `class` 在 C++ 中几乎等价，差别主要在**默认 public vs private**（习惯上 struct 偏「纯数据」）。
- `static` 成员属于类型而非单个对象；文件作用域 `static` 限制链接可见性。
- 枚举给整型一组有名字的常量；优先考虑 scoped enum（`enum class`）避免污染作用域。
- 构造负责建立有效状态；析构释放资源——RAII 的两端。

## 易错点

- 在构造函数体里「赋值」代替成员初始化列表（const / 引用成员无法如此）。
- 忘记析构对称释放，或在尚未学智能指针时滥用裸 `new`。
- 把「static 成员函数」误当成可以访问非 static 成员数据。

```cpp
class Entity {
public:
  explicit Entity(int id) : id_(id) {}
  ~Entity() = default;
  static int count;
private:
  int id_;
};
```
