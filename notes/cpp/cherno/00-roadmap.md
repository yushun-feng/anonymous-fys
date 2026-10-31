---
title: Cherno C++ 学习路线与剧集地图
tags: [cpp, cherno, roadmap]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb
---

# Cherno C++ 学习路线与剧集地图

精炼笔记，对应 [The Cherno — C++ 播放列表](https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb)（约百集）。**只做提纲与要点复述，非逐字稿。** 细节、演示与勘误以原视频为准。

与系统教材路线互补：语法地图见 [LearnCpp 路线](../learncpp/00-roadmap.md)；所有权总览见 [`../raii-and-ownership.md`](../raii-and-ownership.md)。本目录偏「演示驱动」：工具链直觉、内存模型、OOP 与现代工具。

## 建议路径

1. **入门与工具链**：欢迎、环境、编译/链接（本库 [01](./01-welcome-toolchain.md)）
2. **语言骨架**：变量/函数/头文件、分支循环（[02](./02-basics-control.md)）
3. **地址与别名**：指针、引用（[03](./03-pointers-references.md)）
4. **类与对象模型**：类、static/enum、构造析构（[04](./04-classes.md)）
5. **继承与多态**：继承、虚函数、接口、虚析构（[05](./05-inheritance-virtual.md)）
6. **数据与 const**：数组/字符串、const、栈堆与 `new`（[06](./06-arrays-strings.md)、[07](./07-const-objects-memory.md)）
7. **运算符与寿命**：重载、对象寿命、拷贝（[08](./08-operators-lifetime.md)、[10](./10-copy-vector.md)）
8. **所有权与泛型**：智能指针、模板（[09](./09-smart-pointers.md)、[11](./11-templates.md)）
9. **现代惯用**：`auto`/函数指针/lambda/命名空间（[12](./12-fp-lambdas-namespaces.md)）
10. **并发与类型技巧**：线程、转型与 type punning（[13](./13-threads.md)、[14](./14-casting.md)）
11. **C++17 工具与移动**：optional/variant、move（[15](./15-modern-utilities.md)）

## 剧集 → 本库笔记

| 大致集号（系列传统编号） | 主题 | 本库笔记 |
|--------------------------|------|----------|
| 1–7 | 欢迎、安装、C++/编译器/链接器如何工作 | [01](./01-welcome-toolchain.md) |
| 8–15 | 变量、函数、头文件、调试、分支与循环 | [02](./02-basics-control.md) |
| 16–17 | 指针、引用 | [03](./03-pointers-references.md) |
| 18–26 | 类、static、enum、构造/析构 | [04](./04-classes.md) |
| 27–30、68 | 继承、虚函数、接口、可见性、虚析构 | [05](./05-inheritance-virtual.md) |
| 31–33 | 数组、字符串 | [06](./06-arrays-strings.md) |
| 34–39、54 | const、对象创建、`new`、栈 vs 堆 | [07](./07-const-objects-memory.md) |
| 40–43、46 | 运算符重载、对象寿命、箭头运算符 | [08](./08-operators-lifetime.md) |
| 44 | 智能指针 | [09](./09-smart-pointers.md) |
| 45、47–48 | 拷贝、`std::vector` | [10](./10-copy-vector.md) |
| 53 | 模板 | [11](./11-templates.md) |
| 56–61 | `auto`、函数指针、lambda、命名空间 | [12](./12-fp-lambdas-namespaces.md) |
| 62–63 | 线程、计时 | [13](./13-threads.md) |
| 66–67、69、73 | type punning、union、转型 | [14](./14-casting.md) |
| 75–79、86–87 | optional/variant/any/async、移动语义 | [15](./15-modern-utilities.md) |

未单独成篇但仍值得按需回看的集：库链接（49–51）、宏（55）、多维数组/排序（64–65）、PCH/断点/基准测试、自写容器与迭代器等——可在看完上表主干后再补。

## 与 LearnCpp 的重叠导航

| Cherno 主题 | LearnCpp 笔记 |
|-------------|---------------|
| 指针/引用 | [ch12](../learncpp/ch12-references-pointers.md) |
| 类 | [ch14–15](../learncpp/ch14-15-classes.md) |
| 继承/虚函数 | [ch23–25](../learncpp/ch23-25-oop-hierarchy.md) |
| 智能指针/移动 | [ch22](../learncpp/ch22-move-smart-pointers.md) |
| 模板 | [ch11](../learncpp/ch11-overload-templates.md)、[ch26–28](../learncpp/ch26-28-templates-exceptions-io.md) |
| 类型转换 | [ch10](../learncpp/ch10-type-conversion.md) |
| 数组/vector | [ch16–17](../learncpp/ch16-17-arrays.md) |
| lambda / 函数指针 | [ch20](../learncpp/ch20-advanced-functions.md) |

## 版权与用法

笔记为自学提纲（归纳/复述），**不是**视频字幕镜像。完整讲解与演示以 [播放列表](https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb) 为准。
