---
title: 第 9 章：错误检测与处理
tags: [cpp, learncpp, errors, testing]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 9 章：错误检测与处理

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 9 章

## 小节地图

测试入门与代码覆盖、常见语义错误、错误处理策略概览、`std::cin` 失败与恢复、防御式校验、`assert` / `NDEBUG`、`static_assert`、错误码与异常的预习分界。

相关笔记：[第 3 章 调试](./ch03-debugging.md) · [第 8 章 控制流](./ch08-control-flow.md) · [第 26–28 章 异常与 I/O](./ch26-28-templates-exceptions-io.md)

## 核心概念

### 错误的分类

| 类型 | 典型例子 | 何时发现 |
|------|----------|----------|
| 语法错误 | 少分号、类型不匹配 | 编译期 |
| 链接错误 | 缺定义、重复定义 | 链接期 |
| 语义/逻辑错误 | 公式写反、边界 off-by-one | 运行期测试或生产 |
| 契约违反 | 空指针、除零、索引越界 | 断言或未定义行为 |

本章聚焦：**如何主动检测逻辑错误与无效输入，以及如何在程序中表达失败**。

### 测试为什么重要

「能编译」≠「行为正确」。最小可行测试习惯：

1. **给定**输入与前置条件  
2. **执行**目标函数  
3. **期望**输出/状态  
4. 覆盖正常路径、边界、非法输入  

代码覆盖（覆盖行/分支）是辅助指标：高覆盖不保证无 bug，但低覆盖几乎肯定有未测路径。先保证关键路径与边界有测试，再谈百分比。

### 常见语义错误模式

- **差一错误**：`<= n` 写成 `< n`，或缓冲区长度含不含 `'\0'`。
- **整数溢出**：校验大小时 `a + b < a` 一类技巧在有符号下是 UB，应使用更宽类型或标准工具。
- **未初始化读取**：局部变量未赋初值即使用。
- **错误的优先级/短路假设**：见 [第 6 章](./ch06-operators.md)。
- **修改了不该共享的状态**：全局/静态导致测试互相污染（见 [第 7 章](./ch07-scope-duration-linkage.md)）。

### 错误处理策略（导论）

没有银弹，按「错误是否可预期、是否可恢复、调用方是否必须知晓」选择：

1. **返回错误码 / `std::optional` / `std::expected`（C++23）**：可预期失败（查找失败、解析失败）。
2. **异常**：罕见、跨越多层、无法继续当前操作（后续章节展开）。
3. **断言 `assert`**：检测程序员错误（不应在正确程序中发生的事）；失败则终止。
4. **日志 + 降级/默认值**：某些产品环境的权宜之计，须文档化。
5. **直接终止**（`std::abort` / 抛到顶层）：不变量已毁坏时。

关键原则：**区分「调用方用错 API」与「外部环境导致的失败」**。前者多用断言与前置条件文档；后者要能上报给调用方。

### `std::cin` 与流状态

输入失败时，流进入失败态：`failbit`/`badbit` 等被设置，后续读操作被跳过，变量可能保持旧值。必须检测并 `clear()`，再丢弃坏输入，否则容易死循环——这是控制流章节死循环的高频真凶。

## 语法与 API

### 运行期断言

```cpp
#include <cassert>

assert(条件);              // 条件为假：打印诊断并调用 std::abort
assert(条件 && "说明");    // 利用短路，让消息出现在诊断里
```

定义宏 `NDEBUG` 后（发布构建常见），`assert` 被预处理为空，**不执行条件**。因此：

- 断言条件必须无副作用（不要 `assert(++i > 0)`）。
- 断言不是用户输入校验机制；非法用户输入应走正式错误处理路径。

### 静态断言

```cpp
static_assert(sizeof(void*) >= 4, "need at least 32-bit pointers");
static_assert(条件);  // C++17 起消息可省略
```

在编译期检查常量表达式条件，失败则编译错误。适合：大小/对齐假设、模板约束的早期写法、配置互斥。

### 流错误恢复骨架

```cpp
#include <iostream>
#include <limits>

int readIntInRange(int lo, int hi) {
    int x{};
    while (true) {
        std::cout << "enter [" << lo << ", " << hi << "]: ";
        if (std::cin >> x && x >= lo && x <= hi) {
            return x;
        }
        // 读失败或超出范围
        std::cin.clear();  // 清除 failbit
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
        std::cout << "invalid input, try again\n";
    }
}
```

### 简单测试脚手架（无框架）

```cpp
#include <cstdlib>
#include <iostream>

#define EXPECT_TRUE(expr)                                              \
    do {                                                               \
        if (!(expr)) {                                                 \
            std::cerr << __FILE__ << ':' << __LINE__                   \
                      << " EXPECT_TRUE failed: " #expr << '\n';        \
            std::exit(1);                                              \
        }                                                              \
    } while (0)

int add(int a, int b) { return a + b; }

void test_add() {
    EXPECT_TRUE(add(2, 2) == 4);
    EXPECT_TRUE(add(-1, 1) == 0);
}

int main() {
    test_add();
    std::cout << "all passed\n";
}
```

实际项目应迁移到 GoogleTest、Catch2、doctest 等；思想相同：隔离、可重复、自动化。

## 示例

### 断言用于内部不变量

```cpp
#include <cassert>
#include <vector>

int atChecked(const std::vector<int>& v, std::size_t i) {
    assert(i < v.size());          // 程序员应保证；发布版可剥离
    return v[i];                   // 仍可用 v.at(i) 做总是检查的边界
}
```

教学对比：`operator[]` 不检查边界；`at()` 越界抛异常。库设计里「断言 vs 异常 vs 未定义」必须写进契约。

### `static_assert` 与类型假设

```cpp
#include <cstdint>
#include <type_traits>

static_assert(sizeof(std::int32_t) == 4);
static_assert(std::is_signed_v<int>);

template <typename T>
constexpr T midpoint(T a, T b) {
    static_assert(std::is_integral_v<T>, "T must be integral");
    return static_cast<T>(a + (b - a) / 2);
}
```

### 语义错误：有符号溢出陷阱（说明性）

```cpp
// 错误示范：想检测 a+b 是否溢出 int
// bool overflow = (a + b < a);  // 有符号溢出已是 UB，不能依赖

#include <cstdint>
#include <limits>

bool addWouldOverflow(int a, int b) {
    if (b > 0) {
        return a > std::numeric_limits<int>::max() - b;
    }
    if (b < 0) {
        return a < std::numeric_limits<int>::min() - b;
    }
    return false;
}
```

### 覆盖思维：分支清单

```cpp
int classify(int x) {
    if (x < 0) return -1;
    if (x == 0) return 0;
    return 1;
}
// 测试至少覆盖：负数、零、正数；再加 INT_MIN/INT_MAX 边界更佳
```

## 易错与陷阱

1. **用 `assert` 验证用户输入**：发布版 `NDEBUG` 后检查消失，安全漏洞或崩溃隐患依旧。
2. **断言条件有副作用**：`assert(fs::remove(path))` 在发布版不会删除文件。
3. **`cin` 失败后不 `clear`/`ignore`**：后面所有输入瞬间失败，循环条件永远假或真。
4. **忽略函数返回的错误码**：`scanf`/`fopen` 风格 API 或自写 `bool tryParse` 被丢掉。
5. **测试依赖执行顺序或全局状态**：静态变量让用例偶发失败；测试间要隔离。
6. **只测幸福路径**：解析器从未喂过空串、超长串、非法字符。
7. **把未定义行为当「错误处理」**：越界后「碰巧能跑」不是可恢复错误。
8. **`static_assert` 用运行期才知的值**：必须是核心常量表达式。
9. **异常与错误码混用无规范**：团队需约定边界；本章先建立「失败要显式」的意识，细节见后续异常章。
10. **覆盖率驱动出无意义测试**：`EXPECT_TRUE(true)` 刷高行覆盖却零价值。

## 练习指引

- 为 `isLeapYear(int y)` 列真值表，写至少 5 个测试（世纪年、非整百、负数策略要先定契约）。
- 实现 `readIntInRange`，故意输入 `abc`、空行、越界数字，确认不会死循环。
- 在 Debug/Release 下分别编译含 `assert(false)` 的程序，观察 `NDEBUG` 差异。
- 给一个含三个分支的函数列出覆盖矩阵，并标出你遗漏的组合。
- 把「返回魔法数字 -1 表示失败」的函数改为 `std::optional<int>`，比较调用方清晰度。

## 小结

可靠程序 = **正确算法 + 明确契约 + 可自动化的检测**。用测试抓住逻辑错误，用 `cin` 状态处理外部输入，用 `assert`/`static_assert` 钉死内部不变量，用错误码/可选类型/异常向上传递可恢复失败。接下来 [第 10 章](./ch10-type-conversion.md) 讨论类型系统如何在静默中制造或避免另一类错误——隐式转换与收窄。
