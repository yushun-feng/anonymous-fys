---
title: Cherno：继承、虚函数与接口
tags: [cpp, cherno, inheritance, virtual, polymorphism]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=X8nYM8wdNRE
---

# Cherno：继承、虚函数与接口

> 视频：[Inheritance](https://www.youtube.com/watch?v=X8nYM8wdNRE) · [Virtual Functions](https://www.youtube.com/watch?v=oIV2KchSyGQ) · [Interfaces](https://www.youtube.com/watch?v=UWAdd13EfM8) · [Visibility](https://www.youtube.com/watch?v=6OVQ8nh3KP0) · [Virtual Destructors](https://www.youtube.com/watch?v=jELbKhGkEi0)  
> 相关：[LearnCpp ch23–25](../learncpp/ch23-25-oop-hierarchy.md)

## 覆盖集

基类抽取公共行为；虚函数实现运行时多态；纯虚函数作接口；访问级别；多态删除需要虚析构。

## 要点

- 继承减少重复：公共字段/方法放基类，派生类扩展或覆写。
- 通过基类指针/引用调用时，要得到派生类行为 → 基类函数标 `virtual`，派生用 `override`。
- 机制直觉：vtable / 动态派发（有一点开销，但语义正确优先）。
- 纯虚函数 `= 0` → 抽象基类，不能直接实例化，适合「接口」角色。
- `public` / `protected` / `private` 控制「谁能碰」；继承方式也会影响对外可见性。
- **经基类指针 `delete` 派生对象时，基类析构必须为 virtual**，否则只析构基类部分。

## 易错点

- 基类忘了 `virtual`，派生写了同名函数却不是覆写。
- 对象切片：按值传基类，派生部分被切掉。
- 非虚析构 + 多态删除 → 未定义行为。

```cpp
struct Entity {
  virtual ~Entity() = default;
  virtual const char* name() const { return "Entity"; }
};

struct Player : Entity {
  const char* name() const override { return "Player"; }
};
```
