---
title: 附录：杂项与语言版本速览
tags: [cpp, learncpp, appendix, standards]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 附录：杂项与语言版本速览

> 学习材料：[learncpp.cn](https://learncpp.cn/) 附录 A/B（及文末 C）

## 章节地图

| 部分 | 对应 | 内容 |
|------|------|------|
| 语言版本 | 附录 B 风格 | C++03 → C++26 关键演进 |
| 标准库速览 | 附录 A 风格 | 常用头文件与组件地图 |
| 杂项实践 | — | 编译选项、未定义行为、学习建议 |

本附录不是 API 大全，而是**定向地图**：知道「有什么、去哪查、哪个标准才有」。

---

## 一、C++ 标准版本概览

编译器用 `-std=c++17` / `/std:c++20` 等选择语言模式。LearnCpp 正文以现代 C++（常 C++17/20）讲述；读文档时留意「自哪一版起可用」。

### C++98 / 03

- 经典 C++：模板、异常、标准库（`vector`/`string`/iostream）。  
- C++03 主要是缺陷修复；`value_type` 等习惯成型。  
- 无移动语义、无 `auto` 类型推导、无 lambda、无智能指针（`auto_ptr` 已弃用并移除）。

### C++11（现代 C++ 分水岭）

标志性能力：

- **移动语义**、右值引用、`std::move`  
- `auto`、范围 for、`nullptr`、`enum class`  
- lambda、`constexpr`（初版）、别名模板 `using`  
- `unique_ptr` / `shared_ptr` / `weak_ptr`  
- 可变参数模板、委托/继承构造函数、`=default`/`=delete`  
- 线程库 `<thread>` `<mutex>` `<atomic>` 等  

没有 C++11，就很难谈「现代 C++」。

### C++14

- 泛型 lambda、`auto` 返回类型放宽  
- `std::make_unique`  
- 变量模板、放宽的 `constexpr`  
- 二进制字面量、数位分隔符 `1'000'000`

### C++17

- 结构化绑定、`if/switch` 带初始化  
- `std::optional` / `variant` / `any` / `string_view`  
- 类模板实参推导（CTAD）  
- `filesystem`、并行算法策略  
- 折叠表达式、`if constexpr`  
- 内联变量  

许多教程与工业代码以 **C++17** 为默认下限。

### C++20

- **概念（concepts）**、ranges、`std::span`  
- 三路比较 `<=>`、日历/时区（部分）  
- 协程、模块（编译器支持度不一）  
- `consteval` / `constinit`、更强的 `constexpr`  
- `jthread`、格式库 `std::format`（实现进度视编译器）

### C++23 / C++26（前瞻）

- C++23：`std::expected`、`std::print`、`mdspan`、更多 `constexpr`、模块与标准库完善等。  
- C++26：持续演进中；学习时以已实现的编译器特性为准，不背未落地草案。

### 版本选择建议

| 场景 | 建议 |
|------|------|
| 系统学习 LearnCpp | C++17 或 C++20 |
| 维护旧代码 | 对齐项目；用特性宏/文档标注 |
| 写可移植库 | 明确最低标准；CI 多编译器 |
| 尝试 ranges/概念 | C++20 + 较新 GCC/Clang/MSVC |

---

## 二、标准库杂项地图（附录 A 风格）

按「任务 → 头文件」记忆，比按字母表背更快。

### 容器与视图

| 需求 | 组件 |
|------|------|
| 动态数组 | `<vector>` |
| 固定数组 | `<array>` |
| 双端队列 / 列表 | `<deque>` `<list>` `<forward_list>` |
| 有序/无序关联 | `<map>` `<set>` `<unordered_*>` |
| 字符串 | `<string>` `<string_view>`（17） |
| 不拥有连续区间 | `<span>`（20） |

### 算法与迭代器

- `<algorithm>`：`sort`/`find`/`transform`/`accumulate`（后者在 `<numeric>`）  
- `<iterator>`：插入迭代器、`begin`/`end`  
- C++20 `<ranges>`：惰性视图与管道风格  

### 工具与类型擦除

| 头文件 | 用途 |
|--------|------|
| `<utility>` | `pair`、`move`、`forward`、`swap` |
| `<tuple>` | 元组、`tie`、结构化绑定来源 |
| `<memory>` | 智能指针、`allocator` |
| `<functional>` | `function`、`bind`、函数对象包装 |
| `<optional>` `<variant>` `<any>` | 可空 / 联合 / 任意类型 |
| `<type_traits>` | 编译期类型判断与变换 |
| `<chrono>` | 时间与时钟 |

### 错误与系统

- `<stdexcept>` / `<system_error>`：异常与错误码  
- `<cassert>`：运行期断言（调试）  
- `<filesystem>`：路径与目录（17）  

### I/O 与格式

- `<iostream>` `<fstream>` `<sstream>`  
- `<iomanip>`：宽度、精度、进制  
- C++20 `std::format`；C++23 `std::print`（视实现）

### 并发（知悉）

`<thread>` `<mutex>` `<condition_variable>` `<atomic>` `<future>`；C++20 `jthread`、`latch`/`barrier`/`semaphore`。并发有独立学习曲线，勿与基础语法一次性吞下。

---

## 三、杂项实践笔记

### 编译与警告

```bash
g++ -std=c++20 -Wall -Wextra -Wpedantic -g -O0 main.cpp -o main
clang++ -std=c++20 -Wall -Wextra -Wpedantic -g main.cpp
```

把警告当错误（`-Werror`）适合 CI；本地开发可先修警告。了解未定义行为（UB）、未指定行为与实现定义行为的区别——优化器会假设「无 UB」。

### 未定义行为常见源

- 悬空指针 / 引用、缓冲区溢出  
- 有符号溢出、非法移位  
- 数据竞争（无同步并发写）  
- 生命周期结束后使用对象  

工具：Sanitizer（`-fsanitize=address,undefined`）、静态分析、代码审阅。

### 头文件与 ODR

- 头文件用 include guard 或 `#pragma once`  
- 模板与 `inline` 函数可在头中定义  
- 避免在头中放非 inline 的全局可变对象  

### 学习路径上的「附录 C」心态

官方附录常列额外主题（位运算、constexpr、更新日志）。本库对应拆分见：

- [选修：位运算与 constexpr](./optional-bit-constexpr.md)  
- [完整学习笔记索引](./00-roadmap.md)  

跟教程时：**主线章节练扎实 > 追新标准猎奇**。用到 C++20 特性再翻文档，比一次性背完提案更有效。

---

## 示例：版本感知的小片段

```cpp
#include <optional>
#include <string>
#include <string_view>

// C++17
std::optional<int> parse_positive(std::string_view s) {
  if (s.empty() || s[0] == '-') return std::nullopt;
  int v = 0;
  for (char c : s) {
    if (c < '0' || c > '9') return std::nullopt;
    v = v * 10 + (c - '0');
  }
  return v;
}

#if __cplusplus >= 202002L
#include <span>
constexpr int sum_span(std::span<const int> xs) {
  int s = 0;
  for (int x : xs) s += x;
  return s;
}
#endif
```

---

## 易错与陷阱

1. 文档示例是 C++20，本地仍用 C++11 → 「明明一样却编不过」。  
2. 混用不同标准编译的静态库 → ABI / 内联差异风险。  
3. 把技术预览当已可移植特性（模块、部分 `format`）。  
4. 在附录里迷路：附录是地图，不是替代第 1–28 章习题。  
5. 以为「标准有了编译器就有了」——查 [compiler support](https://en.cppreference.com/w/cpp/compiler_support)。

## 练习指引

1. 用 `g++ -std=c++11/14/17/20` 分别编译含 `make_unique`、结构化绑定、`span` 的小文件，记录哪一版开始通过。  
2. 从本附录选三个头文件，写最小可运行示例并链回主线章节笔记。  
3. 打开 cppreference 某一页，找到「since C++xx」标记，对照自己的编译器。  
4. 为个人项目写一段 `README`：最低语言标准、推荐警告选项。

## 小结

- **版本**：C++11 开启现代 C++；17 是务实默认；20 引入概念/ranges 等大块能力。  
- **库**：按任务记头文件；容器、算法、工具类型、I/O、并发分层掌握。  
- **实践**：开警告、懂 UB、对齐标准与编译器支持。  
- 回到主线：[00-roadmap](./00-roadmap.md)。
