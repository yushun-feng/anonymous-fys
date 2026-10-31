---
title: 第 23–25 章：对象关系、继承与虚函数
tags: [cpp, learncpp, inheritance, virtual]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 23–25 章：对象关系、继承与虚函数

> 来源：[learncpp.cn](https://learncpp.cn/) 第 23–25 章

## 小节地图

**23**：关系种类、组合/聚合/关联/依赖、容器类、`initializer_list`。  
**24**：继承基础、构造顺序、访问说明符、扩展与隐藏、多重继承。  
**25**：基类指针/引用、虚函数与多态、`override`/`final`、虚析构、绑定与虚表、纯虚与接口、虚基类、切片、`dynamic_cast`、继承体系输出。

## 要点

- 先组合后继承；继承表达 **is-a** 且基类有抽象意义时再上。
- 多态删除必须**虚析构**。
- 一律用 `override` 标注重写，防止签名漂移。
- 按值传基类会**切片**；多态用指针/引用（或智能指针）。

## 易错点

- 非虚函数“以为多态”。
- 多重继承菱形未用虚基类导致重复子对象。
- `dynamic_cast` 滥用代替良好设计。
