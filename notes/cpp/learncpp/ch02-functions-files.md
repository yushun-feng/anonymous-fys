---
title: 第 2 章：函数与多文件
tags: [cpp, learncpp, functions]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 2 章：函数与多文件

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 2 章

## 小节地图

| 主题 | 要点 |
|------|------|
| 函数入门 | 定义、调用、返回类型 |
| 返回值与 `void` | `return` 表达式；无返回值函数 |
| 形参与实参 | 传值入门、参数作用域 |
| 局部作用域 | 块作用域、生命周期直觉 |
| 为何使用函数 | 复用、抽象、可读性 |
| 前向声明 | 声明 vs 定义、声明顺序 |
| 多 `.cpp` 文件 | 翻译单元、链接 |
| 命名空间 | `std`、自建命名空间、`::` |
| 预处理器 | `#include`、宏入门 |
| 头文件与保护 | `.h` 职责、include guard / `#pragma once` |
| 程序设计与测验 | 如何拆分文件 |

相关：[第 0 章 编译链接](./ch00-getting-started.md) · [第 1 章 基础](./ch01-basics.md) · [第 7 章 作用域与链接](./ch07-scope-duration-linkage.md)

## 核心概念

### 函数是什么

函数把一组语句打包成可调用的单元，有：

- **名字**
- **参数列表**（形参）：调用时接收输入
- **返回类型**：通过 `return` 把结果交给调用方；`void` 表示不返回值
- **函数体**：具体实现

```cpp
int square(int x)   // 返回类型、名字、形参
{
    return x * x;   // 返回语句
}
```

调用：`square(5)` —— `5` 是**实参**，初始化形参 `x`（本章按**传值**理解：形参是实参的副本）。

### 返回值规则（入门）

- 非 `void` 函数应沿着每条路径返回合适类型的值（更严的规则与诊断随标准/编译器增强）。
- `main` 特殊：可省略 `return 0;`。
- `void f() { return; }` 允许空手返回；不可 `return 1;`。

调用方可以忽略返回值，但若函数的意义就是计算结果，忽略往往是设计问题（后文有 `[[nodiscard]]`）。

### 局部作用域与生命周期（直觉）

在函数体内定义的变量是**局部变量**：

- **作用域**：从声明点到块末通常可见（细节见第 7 章）。
- **生命周期**：函数每次被调用时创建，返回后销毁（自动存储期）。

形参也是局部变量。两个函数可以各有自己的 `x`，互不干扰。

```cpp
void a()
{
    int x{1};   // a 的 x
}

void b()
{
    int x{2};   // b 的 x，与 a::x 无关
}
```

### 为何拆函数

- **复用**：同一逻辑多处调用。
- **命名抽象**：`calculateDamage(...)` 比一长串公式更可读。
- **隔离变化**：实现可改，调用点稳定（配合头文件声明）。
- **测试友好**：小函数更易单独验证。

过早拆分也会增加跳转成本；学习期优先「一个函数一件事」。

### 声明 vs 定义；前向声明

| | 声明（declaration） | 定义（definition） |
|--|---------------------|-------------------|
| 函数 | 告诉编译器名字、参数、返回类型 | 提供函数体 |
| 典型 | `int add(int, int);` | `int add(int a, int b) { return a + b; }` |

**前向声明**让你可以在定义出现之前调用函数，只要调用点能看见声明：

```cpp
int add(int x, int y);  // 前向声明

int main()
{
    return add(1, 2);
}

int add(int x, int y)
{
    return x + y;
}
```

同一程序中，普通函数定义只能有一份（One Definition Rule，ODR）；声明可以有多份，且应一致。

### 多文件与翻译单元

每个 `.cpp` 经预处理后大致对应一个**翻译单元**，分开编译成 `.o`/`.obj`，再链接。

典型拆分：

- `math.cpp`：函数定义
- `math.h`：函数声明（给别人 `#include`）
- `main.cpp`：调用方

链接器负责把 `main.cpp` 里对 `add` 的调用对上 `math.cpp` 里的定义。若漏编 `math.cpp`，出现 [第 0 章](./ch00-getting-started.md) 所述 unresolved external。

### 命名空间

命名空间避免名字冲突：

```cpp
namespace math {
int add(int a, int b) { return a + b; }
}

int main()
{
    return math::add(1, 2);
}
```

`std` 是标准库命名空间。`using namespace std;` 在**小范围 `.cpp` 内**可权宜使用；**不要**在头文件里全局 `using namespace std;`，以免污染所有包含者。

### 预处理器与头文件

`#include <iostream>`：从系统路径拉入头文件内容（文本包含）。  
`#include "math.h"`：通常先搜当前项目路径。

头文件应放：**声明、内联/模板、常量表达式相关**等需要在多个翻译单元可见的接口；函数的普通定义放 `.cpp`。

**头文件保护**防止同一翻译单元重复包含导致重定义：

```cpp
#ifndef MATH_H
#define MATH_H

int add(int a, int b);

#endif
```

或实现支持的 `#pragma once`（广泛可用，但非标准关键字；课程与项目中两种都会见到）。

## 语法与 API

### 函数定义骨架

```cpp
return_type function_name(parameter_list)
{
    statements
}
```

### 声明骨架

```cpp
return_type function_name(parameter_list);  // 形参名可省略
```

### 命名空间

```cpp
namespace name { /* 声明或定义 */ }
name::identifier
```

### 包含与保护

```cpp
#include <header>     // 标准 / 系统
#include "header.h"   // 项目头文件
#pragma once          // 或 ifndef 守卫
```

## 示例

### 示例 1：传值与返回

```cpp
#include <iostream>

int max2(int a, int b)
{
    if (a > b)  // if 在第 4/8 章系统讲；此处可读作「条件」
        return a;
    return b;
}

int main()
{
    std::cout << max2(3, 7) << '\n';  // 7
}
```

### 示例 2：`void` 与副作用

```cpp
#include <iostream>

void printTwice(int x)
{
    std::cout << x << ' ' << x << '\n';
}

int main()
{
    printTwice(42);
}
```

### 示例 3：前向声明整理阅读顺序

```cpp
#include <iostream>

void b();
void a() { b(); }
void b() { std::cout << "b\n"; }

int main() { a(); }
```

### 示例 4：多文件结构（示意）

```cpp
// add.h
#pragma once
int add(int a, int b);
```

```cpp
// add.cpp
#include "add.h"

int add(int a, int b)
{
    return a + b;
}
```

```cpp
// main.cpp
#include <iostream>
#include "add.h"

int main()
{
    std::cout << add(2, 3) << '\n';
}
```

构建：`g++ -std=c++17 -Wall -Wextra -o app main.cpp add.cpp`

### 示例 5：命名空间隔离

```cpp
#include <iostream>

namespace util {
void greet() { std::cout << "hi\n"; }
}

int main()
{
    util::greet();
}
```

## 易错与陷阱

1. **只声明不定义**，或多文件时漏链接实现文件 → 链接错误。
2. **声明与定义签名不一致**（参数类型、`const`、拼写）→ 视为不同函数，链接失败或行为意外。
3. **在头文件里定义普通非内联函数**且被多个 `.cpp` 包含 → 多重定义。
4. **忘记 include guard** → 重定义错误。
5. **循环包含**：A.h 含 B.h、B.h 含 A.h；用前向声明与合理拆分打破环（后文类类型更常见）。
6. **头文件 `using namespace std;`** → 污染；应写 `std::string` 等全名。
7. **指望局部变量在两次调用间保持值** → 默认不会（`static` 局部变量见第 7 章）。
8. **修改形参以为能改实参** → 传值只改副本；改调用方需引用/指针（第 12 章）。
9. **`#include` 顺序混乱导致偶发编译成功**：头文件应自给自足（包含自己需要的头），不要依赖「别人先包含了 iostream」。

## 练习指引

- 把第 1 章的小程序拆成「读入函数 / 计算函数 / 输出函数」，体会抽象。
- 做三文件项目：`main.cpp` + `foo.cpp` + `foo.h`，先故意去掉 guard 或漏编译 `foo.cpp`，记录诊断。
- 为同一名字在两个命名空间中各写一个函数，用 `::` 限定调用。
- 完成第 2 章测验：按题目要求组织函数与文件，注意声明放头文件、定义放源文件。
- 对照 [第 0 章](./ch00-getting-started.md) 解释你的项目如何通过编译与链接。

## 小结

- 函数通过参数进、返回值出；局部变量有作用域与自动生命周期。
- **声明**满足编译期可见性，**定义**满足链接期唯一实现；多文件靠头文件共享声明。
- 命名空间与 include 保护是可维护 C++ 项目的基本卫生习惯。
