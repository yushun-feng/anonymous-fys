---
title: Cherno：运算符重载与对象寿命
tags: [cpp, cherno, operators, lifetime]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=mS9755gF66w
---

# Cherno：运算符重载与对象寿命

> 视频：[Operators](https://www.youtube.com/watch?v=mS9755gF66w) · [Object Lifetime](https://www.youtube.com/watch?v=Z_hPJ_EhceI) · [Arrow Operator](https://www.youtube.com/watch?v=4p3grlSpWYA)  
> 相关：[LearnCpp ch21](../learncpp/ch21-operator-overloading.md)、[ch07 作用域寿命](../learncpp/ch07-scope-duration-linkage.md)

## 覆盖集

运算符重载让类型用起来像内建类型；栈/作用域寿命；`->` 与自定义箭头；与拷贝/智能指针章节衔接。

## 要点

- 重载应保持直觉：`+` 不该有奇怪副作用；优先非成员重载对称运算（如 `<<`）。
- 对象寿命通常绑在作用域：离开作用域 → 析构按反序调用。
- `ptr->m` 对原始指针是解引用再取成员；类可重载 `operator->` 以包装指针语义（智能指针即此）。
- 「作用域即寿命」是理解 RAII、锁、文件句柄的钥匙。

## 易错点

- 重载改变运算符的常规含义，可读性崩盘。
- 在已经结束的作用域外继续使用引用/指针。
- 忽略析构顺序导致依赖已销毁对象。

```cpp
struct Timer {
  ~Timer() { /* 离开作用域自动收尾 */ }
};

void f() {
  Timer t;   // 寿命到函数结束
}
```
