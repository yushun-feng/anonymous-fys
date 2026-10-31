---
title: LearnCpp 学习路线与章节地图
tags: [cpp, learncpp, roadmap]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# LearnCpp 学习路线与章节地图

按 [learncpp.cn](https://learncpp.cn/)（结构与 [learncpp.com](https://www.learncpp.com/) 一致）排好的**学习壳索引**：边学边往各章笔记里填「概念 / 例子 / 易错 / 我的补充」。

相关：[`../raii-and-ownership.md`](../raii-and-ownership.md) · [Cherno C++ 路线](../cherno/00-roadmap.md)

## 建议路径

1. **环境与基础**：第 0–3 章（装工具、语句/变量、函数与多文件、调试）
2. **类型与运算**：第 4–7 章 + 可选位运算 O、constexpr 函数 F
3. **控制与安全**：第 8–11 章（分支循环、错误检测、转换、重载与函数模板）
4. **复合类型与 OOP 入门**：第 12–15 章
5. **容器与内存**：第 16–19 章（vector/array；18–19 仍在建设中）
6. **进阶语言特性**：第 20–22 章（lambda、运算符重载、移动与智能指针）
7. **对象模型**：第 23–25 章（关系、继承、虚函数）
8. **泛型、异常、I/O**：第 26–28 章；附录 A/B 按需

## 章节地图

| 章 | 主题 | 本库笔记壳 |
|----|------|------------|
| 0 | 简介 / 入门 | [ch00](./ch00-getting-started.md) |
| 1 | C++ 基础 | [ch01](./ch01-basics.md) |
| 2 | 函数与文件 | [ch02](./ch02-functions-files.md) |
| 3 | 调试 | [ch03](./ch03-debugging.md) |
| 4 | 基本数据类型 | [ch04](./ch04-fundamental-types.md) |
| 5 | 常量与字符串 | [ch05](./ch05-constants-strings.md) |
| 6 | 运算符 | [ch06](./ch06-operators.md) |
| O | 位运算（可选） | [optional](./optional-bit-constexpr.md) |
| 7 | 作用域、生命周期、链接 | [ch07](./ch07-scope-duration-linkage.md) |
| 8 | 控制流 | [ch08](./ch08-control-flow.md) |
| 9 | 错误检测与处理 | [ch09](./ch09-error-handling.md) |
| 10 | 类型转换 / 别名 / 推断 | [ch10](./ch10-type-conversion.md) |
| 11 | 函数重载与函数模板 | [ch11](./ch11-overload-templates.md) |
| F | constexpr 函数 | [optional](./optional-bit-constexpr.md) |
| 12 | 引用与指针 | [ch12](./ch12-references-pointers.md) |
| 13 | 枚举与结构体 | [ch13](./ch13-enums-structs.md) |
| 14–15 | 类入门与进阶 | [ch14-15](./ch14-15-classes.md) |
| 16–17 | vector / array / C 数组 | [ch16-17](./ch16-17-arrays.md) |
| 18–19 | 迭代器算法 / 动态分配 | [ch18-19](./ch18-19-iterators-dynamic.md) |
| 20 | 函数进阶 | [ch20](./ch20-advanced-functions.md) |
| 21 | 运算符重载 | [ch21](./ch21-operator-overloading.md) |
| 22 | 移动语义与智能指针 | [ch22](./ch22-move-smart-pointers.md) |
| 23–25 | 对象关系 / 继承 / 虚函数 | [ch23-25](./ch23-25-oop-hierarchy.md) |
| 26–28 | 模板类 / 异常 / I/O | [ch26-28](./ch26-28-templates-exceptions-io.md) |
| A–B | 库与语言版本速览 | [appendix](./appendix-misc-updates.md) |

## 节号速查

- **0.x**：教程介绍、编译链接、IDE、语言标准与警告级别
- **1.x**：语句、变量初始化、iostream、未定义行为、字面量与表达式
- **2.x**：函数、作用域、前向声明、多文件、命名空间、头文件与 include guard
- **3.x**：语法/语义错误、调试策略、断点/监视/调用栈
- **4.x**：整型/浮点/bool/char、`sizeof`、`static_cast` 入门
- **5.x**：`const`/`constexpr`、`std::string` / `string_view`
- **6.x**：优先级、算术、自增副作用、关系/逻辑、条件运算符
- **7.x**：块、命名空间、内外链接、全局常量、`static` 局部变量
- **8.x**：if/switch/循环、随机数（Mersenne Twister）
- **9.x**：测试与覆盖、`cin` 失效、`assert` / `static_assert`
- **10.x**：隐式转换与收窄、别名、`auto`
- **11.x**：重载决议、默认实参、函数模板与 NTTP
- **12.x**：左值引用、指针、按址传递、`std::optional`
- **13.x**：enum / enum class、struct、类模板与 CTAD
- **14–15.x**：封装、构造、拷贝、`this`、析构、static/friend
- **16–17.x**：`vector`/`array`、范围 for、C 数组退化
- **18–19.x**：迭代器与算法入门；`new`/`delete`（优先智能指针）
- **20–22.x**：函数指针、递归、lambda；运算符重载；`unique_ptr`/`shared_ptr`
- **23–25.x**：组合/聚合/关联；继承；虚函数与切片
- **26–28.x**：类模板特化；异常与 `noexcept`；流与文件 I/O
