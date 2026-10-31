---
title: Cherno C++ 学习路线与剧集地图
tags: [cpp, cherno, roadmap]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb
---

# Cherno C++ 学习路线与剧集地图

对应 [The Cherno — C++ 播放列表](https://www.youtube.com/playlist?list=PLlrATfBNZ98dudnM48yfGUldqGD0S4FFb) 的**剧集索引**：正文讲解已并入 [LearnCpp 各章](../learncpp/00-roadmap.md) 的「Cherno 视角补充」，本目录只保留薄交叉链接，避免双份长文。

互补：[LearnCpp 路线](../learncpp/00-roadmap.md) · [`../raii-and-ownership.md`](../raii-and-ownership.md)

## 怎么用

1. 按 LearnCpp 章节精读（含 Cherno 工程直觉段落）。
2. 需要对照视频时，从下表或本目录各篇索引跳到剧集。
3. 本目录各 `01`–`15` 不再展开教材式正文，只列主题、剧集与 LearnCpp 落点。

## 建议观看顺序（与旧分组一致）

1. **入门与工具链** → [01](./01-welcome-toolchain.md) → LearnCpp [ch00](../learncpp/ch00-getting-started.md)、[ch02](../learncpp/ch02-functions-files.md)
2. **语言骨架** → [02](./02-basics-control.md) → [ch01](../learncpp/ch01-basics.md)、[ch08](../learncpp/ch08-control-flow.md)
3. **地址与别名** → [03](./03-pointers-references.md) → [ch12](../learncpp/ch12-references-pointers.md)
4. **类与对象模型** → [04](./04-classes.md) → [ch13](../learncpp/ch13-enums-structs.md)、[ch14–15](../learncpp/ch14-15-classes.md)
5. **继承与多态** → [05](./05-inheritance-virtual.md) → [ch23–25](../learncpp/ch23-25-oop-hierarchy.md)
6. **数据与 const** → [06](./06-arrays-strings.md)、[07](./07-const-objects-memory.md) → [ch05](../learncpp/ch05-constants-strings.md)、[ch07](../learncpp/ch07-scope-duration-linkage.md)、[ch16–17](../learncpp/ch16-17-arrays.md)
7. **运算符与寿命** → [08](./08-operators-lifetime.md)、[10](./10-copy-vector.md) → [ch21](../learncpp/ch21-operator-overloading.md)、[ch14–15](../learncpp/ch14-15-classes.md)
8. **所有权与泛型** → [09](./09-smart-pointers.md)、[11](./11-templates.md) → [ch22](../learncpp/ch22-move-smart-pointers.md)、[ch11](../learncpp/ch11-overload-templates.md)、[ch26–28](../learncpp/ch26-28-templates-exceptions-io.md)
9. **现代惯用** → [12](./12-fp-lambdas-namespaces.md) → [ch20](../learncpp/ch20-advanced-functions.md)
10. **并发与类型技巧** → [13](./13-threads.md)、[14](./14-casting.md) → [appendix](../learncpp/appendix-misc-updates.md)、[ch10](../learncpp/ch10-type-conversion.md)
11. **C++17 工具与移动** → [15](./15-modern-utilities.md) → [ch22](../learncpp/ch22-move-smart-pointers.md)、[appendix](../learncpp/appendix-misc-updates.md)

## 剧集 → 索引页 → LearnCpp

| 大致集号 | 主题 | 本库索引 | LearnCpp 正文 |
|----------|------|----------|----------------|
| 1–7 | 欢迎、安装、编译/链接 | [01](./01-welcome-toolchain.md) | [ch00](../learncpp/ch00-getting-started.md)、[ch02](../learncpp/ch02-functions-files.md) |
| 8–15 | 变量、函数、头文件、调试、分支循环 | [02](./02-basics-control.md) | [ch01](../learncpp/ch01-basics.md)、[ch03](../learncpp/ch03-debugging.md)、[ch08](../learncpp/ch08-control-flow.md) |
| 16–17 | 指针、引用 | [03](./03-pointers-references.md) | [ch12](../learncpp/ch12-references-pointers.md) |
| 18–26 | 类、static、enum、构造/析构 | [04](./04-classes.md) | [ch13](../learncpp/ch13-enums-structs.md)、[ch14–15](../learncpp/ch14-15-classes.md) |
| 27–30、68 | 继承、虚函数、接口、虚析构 | [05](./05-inheritance-virtual.md) | [ch23–25](../learncpp/ch23-25-oop-hierarchy.md) |
| 31–33 | 数组、字符串 | [06](./06-arrays-strings.md) | [ch05](../learncpp/ch05-constants-strings.md)、[ch16–17](../learncpp/ch16-17-arrays.md) |
| 34–39、54 | const、对象创建、`new`、栈 vs 堆 | [07](./07-const-objects-memory.md) | [ch05](../learncpp/ch05-constants-strings.md)、[ch07](../learncpp/ch07-scope-duration-linkage.md)、[ch18–19](../learncpp/ch18-19-iterators-dynamic.md) |
| 40–43、46 | 运算符重载、对象寿命、箭头运算符 | [08](./08-operators-lifetime.md) | [ch21](../learncpp/ch21-operator-overloading.md)、[ch07](../learncpp/ch07-scope-duration-linkage.md) |
| 44 | 智能指针 | [09](./09-smart-pointers.md) | [ch22](../learncpp/ch22-move-smart-pointers.md) |
| 45、47–48 | 拷贝、`std::vector` | [10](./10-copy-vector.md) | [ch14–15](../learncpp/ch14-15-classes.md)、[ch16–17](../learncpp/ch16-17-arrays.md) |
| 53 | 模板 | [11](./11-templates.md) | [ch11](../learncpp/ch11-overload-templates.md)、[ch26–28](../learncpp/ch26-28-templates-exceptions-io.md) |
| 56–61 | `auto`、函数指针、lambda、命名空间 | [12](./12-fp-lambdas-namespaces.md) | [ch20](../learncpp/ch20-advanced-functions.md) |
| 62–63 | 线程、计时 | [13](./13-threads.md) | [appendix](../learncpp/appendix-misc-updates.md) |
| 66–67、69、73 | type punning、union、转型 | [14](./14-casting.md) | [ch10](../learncpp/ch10-type-conversion.md)、[ch23–25](../learncpp/ch23-25-oop-hierarchy.md) |
| 75–79、86–90 | optional/variant/any/async、移动语义 | [15](./15-modern-utilities.md) | [ch22](../learncpp/ch22-move-smart-pointers.md)、[appendix](../learncpp/appendix-misc-updates.md) |

未单独成篇、可按需回看：库链接（49–51）、宏（55）、多维数组/排序（64–65）、PCH/断点/基准测试、自写容器与迭代器等。

## 公开参考笔记（归因）

整理本库「Cherno 视角」时参考过（改写融入，非照抄）：

- [jjjllxx/cpp-fundamentals](https://github.com/jjjllxx/cpp-fundamentals)
- [Yuriumi/Cherno_Cpp](https://github.com/Yuriumi/Cherno_Cpp)
- [cstahoviak/cherno-cpp](https://github.com/cstahoviak/cherno-cpp)
- [daltonbr/CppSeries](https://github.com/daltonbr/CppSeries)
- [UrsoCN/NotesofCherno](https://github.com/UrsoCN/NotesofCherno)
