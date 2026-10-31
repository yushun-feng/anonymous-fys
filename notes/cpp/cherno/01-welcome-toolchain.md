---
title: Cherno：欢迎、环境与工具链
tags: [cpp, cherno, toolchain, compiler, linker]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=18c3MTX0PK0
---

# Cherno：欢迎、环境与工具链

> 视频：[Welcome](https://www.youtube.com/watch?v=18c3MTX0PK0) · [How C++ Works](https://www.youtube.com/watch?v=SfGuIVzE_Os) · [Compiler](https://www.youtube.com/watch?v=3tIqpEmWMLI) · [Linker](https://www.youtube.com/watch?v=H4s55GgAg0I)  
> 相关：[LearnCpp ch00](../learncpp/ch00-getting-started.md)、[ch02 多文件](../learncpp/ch02-functions-files.md)

## 覆盖集

欢迎与系列定位；Windows / Mac / Linux 搭建；源码如何变成可执行文件；编译与链接的分工。

## 要点

- C++ 工作流：**预处理 → 编译（每个翻译单元 → `.obj`/`.o`）→ 链接 → 可执行文件**。
- 编译错误多半是语法/类型问题（诊断常带 `C` 前缀一类标记）；链接错误多半是**缺定义、重复定义、找不到入口 `main`**。
- 头文件声明接口，`.cpp` 提供定义；链接器负责把符号「对上号」。
- Hello World 虽短，已涉及 `#include`、`main`、流输出与返回码——系列用它带出整条流水线。

## 易错点

- 改了头文件却只「编译」未完整 rebuild，或只编译未链接，现象会误导排查。
- 声明了函数却没在任何 `.cpp` 里定义 → 链接期才爆。
- 把「能编译过一个文件」当成「整个工程已正确链接」。

```cpp
// math.h
int multiply(int a, int b);   // 声明

// math.cpp
int multiply(int a, int b) { return a * b; }  // 定义：供链接器解析
```
