---
title: 第 2 章：函数与多文件
tags: [cpp, learncpp, cherno, functions, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 2 章：函数与多文件

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 2 章
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。今日补充：聚合/`{}` 与公有成员、宏 `#`/`##` 与 `do { ... } while (0)`、`[[nodiscard]]`、`inline`/ODR、`using` 隐藏与重载、`::` 查找、`extern "C"`。

## 小节地图

| 主题 | 要点 |
|------|------|
| 函数入门 | 定义、调用、返回类型 |
| 返回值与 `void` | `return` 表达式；无返回值函数；`[[nodiscard]]` |
| 形参与实参 | 传值入门、参数作用域 |
| 局部作用域 | 块作用域、生命周期直觉 |
| 为何使用函数 | 复用、抽象、可读性 |
| 前向声明 | 声明 vs 定义、声明顺序 |
| 多 `.cpp` 文件 | 翻译单元、链接；头文件短函数与 ODR/`inline` |
| 命名空间 | `std`、自建命名空间、`::` / `ns::` 查找 |
| 预处理器 | `#include`；宏 `#`/`##`；`do { ... } while (0)` |
| 头文件与保护 | `.h` 职责、include guard / `#pragma once` |
| 跨语言链接 | `extern "C"` 与名字修饰 |
| 预习：聚合返回 | `{}` 初始化与「全公有数据成员」口径 |
| 程序设计与测验 | 如何拆分文件 |

相关：[第 0 章 编译链接](./ch00-getting-started.md) · [第 1 章 基础](./ch01-basics.md) · [第 7 章 作用域与链接](./ch07-scope-duration-linkage.md) · [第 13 章 枚举与结构体](./ch13-enums-structs.md)

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

调用方可以忽略返回值，但若函数的意义就是计算结果，忽略往往是设计问题。C++17 起可用 `[[nodiscard]]` 把「必须看返回值」写进接口契约：

```cpp
[[nodiscard]] int parsePort(const char* s);

int main()
{
    parsePort("8080");           // 多数编译器告警：丢掉了有意义的结果
    int port = parsePort("8080"); // OK
    (void)port;
}
```

也可标在类型或构造函数上（如错误码枚举、必须接住的守卫对象），迫使调用方显式处理。确需丢弃时用 `(void)expr;` 或 `std::ignore` 表达意图，而不是默默丢掉。

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

函数形宏里两个常用记号：

- `#`（字符串化）：把实参变成字符串字面量，常用于日志/断言消息。
- `##`（记号粘贴）：把两侧记号拼成一个标识符，常用于生成成套名字。

多语句宏若直接写成 `f1(); f2();`，放进无花括号的 `if` 会只绑住第一句。用 `do { ... } while (0)` 包成**一条**语句，调用处仍可写末尾分号，语义与普通函数调用一致：

```cpp
#define LOG_PAIR(a, b) do {                 \
    std::cerr << #a "=" << (a)              \
              << ", " #b "=" << (b) << '\n'; \
} while (0)

if (debug)
    LOG_PAIR(x, y);   // 展开后仍是一条完整语句
```

宏没有类型与作用域；能写成 `inline`/`constexpr` 函数或模板时优先不用宏。条件编译适合平台与特性开关，不适合承载业务逻辑。

### 预习：用 `{}` 返回「纯数据」聚合

函数常按值返回小结构。若类型是**聚合**（直觉口径：没有用户声明的构造函数、没有私有/保护的非静态数据成员、没有虚函数等——细则见 [第 13 章](./ch13-enums-structs.md)），可用花括号按成员声明顺序初始化：

```cpp
struct Vec2 {   // struct 默认公有；要当聚合用，数据成员保持公有
    double x;
    double y;
};

Vec2 origin()
{
    return {0.0, 0.0};  // 聚合初始化，不是「调用某个构造函数」的写法
}
```

一旦把成员改成 `private`、或手写构造函数，它就不再是聚合，`{...}` 的含义也会变。本章只需记住：**`{}` 初始化与「全公有数据成员」是一对常见搭档**；封装与构造细节留给类章节。

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
3. **在头文件里定义普通非内联函数**且被多个 `.cpp` 包含 → 多重定义；短函数应 `inline`（或放 `.cpp`）。
4. **忘记 include guard** → 重定义错误。
5. **循环包含**：A.h 含 B.h、B.h 含 A.h；用前向声明与合理拆分打破环（后文类类型更常见）。
6. **头文件 `using namespace std;`** → 污染；应写 `std::string` 等全名。
7. **指望局部变量在两次调用间保持值** → 默认不会（`static` 局部变量见第 7 章）。
8. **修改形参以为能改实参** → 传值只改副本；改调用方需引用/指针（第 12 章）。
9. **`#include` 顺序混乱导致偶发编译成功**：头文件应自给自足（包含自己需要的头），不要依赖「别人先包含了 iostream」。
10. **多语句宏不用 `do { ... } while (0)`** → 无花括号 `if` 只执行第一句，或多余 `;` 拆坏 `else`。
11. **派生类声明同名函数却忘记 `using Base::f`** → 基类其他重载被隐藏，调用处「找不到重载」。
12. **对已私有化/带自定义构造的类型仍当聚合 `return {...}`** → 编译失败或语义已不是聚合初始化。
13. **混编 C 目标却未 `extern "C"`** → 链接器按 C++ 修饰名查找，报 unresolved external。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。函数是可复用的「命名代码块」；头文件则是**跨翻译单元的契约墙**——声明给编译器看，定义给链接器找。

### 调用约定的工程读法

```cpp
int blendAlpha(int src, int dst, int t /*0..100*/)
{
    return (src * t + dst * (100 - t)) / 100;
}

int main()
{
    int ignored = blendAlpha(10, 90, 25); // 结果被使用才有意义
    (void)ignored;
    blendAlpha(10, 90, 25);               // 返回值被丢弃——合法但常是意图不清
}
```

Cherno 常提醒：算完却不用返回值时，要么你在做副作用函数（应标 `void`），要么漏了赋值。正文的 `[[nodiscard]]` 把这种失误变成编译期提示——与「接口即文档」同一方向。

### 头文件卫生（比「能编过」更重要）

- 头文件放声明；普通非模板函数定义放 `.cpp`，避免 ODR 炸裂。
- `#pragma once` 或 include guard 二选一，团队统一即可。
- 头文件自给自足：需要 `<cstdint>` 就自己 include，别指望「别人先包含了」。
- 避免在头里 `using namespace std;`——污染每个包含者。

### 多文件不是仪式，是边界

把「读配置 / 算分数 / 打日志」拆文件，是为了**编译防火墙**：改一处不必重编全世界。正文已有 `add.h`/`add.cpp` 示意；补充口径：公共 API 越窄，重构越便宜。命名空间用来分区，而不是堆全局符号。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 `inline`、`extern`、`using`、`maohao`（`::`）、`macro`、`struct` 及现代 C++ `[[nodiscard]]` 等篇。多文件工程里，这些词共同回答三件事：**符号怎么链、名字从哪找、接口怎样强迫调用方别偷懒**。

### 聚合 `{}` 与「公有成员」规则

- `struct` 默认成员公有，适合「纯数据袋」；`class` 默认私有。想继续用聚合初始化 `{a, b}`，非静态数据成员需保持公有，且不要手写会破坏聚合资格的构造函数（完整条件见 [第 13 章](./ch13-enums-structs.md)）。
- 函数按值返回聚合时，`return {1, 2};` 是常见写法；一旦类型升级为带不变量的类，应改走命名构造/`make_*`，而不是硬套花括号。
- 对照口径：`struct` 表达数据结构，`class` 表达要守不变量的对象——默认访问权限只是这一分工的语法投影。

### 宏：`#` / `##` 与 `do { ... } while (0)`

- `#param`：字符串化，展开成带引号的记号；适合把「表达式原文」打进日志。
- `a ## b`：粘贴成单一标识符；常用于批量生成 `get_xxx` / 表项名。续行用 `\`，`\` 前通常留空格。
- 多语句宏包进 `do { ... } while (0)`：在 `if`/`else` 里行为像一条语句，避免「只执行第一句」或多余分号拆坏 `else`。空宏也可写成 `do {} while (0)`，减少「空语句」告警。
- 需要类型、可取址、参与重载时，优先函数/`constexpr`；宏留给字符串化、粘贴与条件编译。

### `[[nodiscard]]`：返回值即契约

- 标在函数、构造函数、枚举或类上：忽略「有意义的结果」会触发告警——工厂、错误码、谓词尤其合适。
- 类型本身带 `[[nodiscard]]` 时，返回该类型的函数往往不必再重复标注；成员函数若返回值必须检查，仍可单独标注。
- 陷阱：作用域守卫一类 API，调用方用 `std::ignore = makeGuard();` 仍可绕过；属性防的是疏忽，不是恶意。需要副作用就写 `void`，需要结果就 `[[nodiscard]]`。

### `inline`、ODR 与头文件短函数

- `inline` 是**实现侧**提示：应写在**定义**处；只在声明上写、定义处没有，通常不起作用。类内定义的成员函数默认即 inline 候选。
- 头文件里放短函数时，靠 `inline`（及模板规则）允许多个翻译单元出现**相同**定义，由 ODR 约束「必须一字不差地一致」。普通非 inline 函数放进头文件再被多处 `#include`，链接期多重定义。
- 不宜盲目 inline：函数体很长、含循环时，调用开销往往可忽略，内联反而膨胀指令缓存。
- 虚函数可以标 `inline`，但经基类指针/引用的**动态分派**在编译期不知道最终目标，通常无法内联；只有编译器能看见具体对象（非多态路径，或显式 `Base::f()`）时才可能把调用展开。

### `using Base::f`：隐藏与重载集

派生类一旦声明同名函数，会**隐藏**基类全部同名重载，而不是「只覆盖那一个签名」：

```cpp
struct Base {
    void f() {}
    void f(int) {}
};

struct Derived : Base {
    using Base::f;          // 把基类重载拉进派生类作用域
    void f(int) { /* 覆盖 int 版 */ }
};

void demo(Derived& d)
{
    d.f();    // 找到 Base::f()（经由 using）
    d.f(1);   // Derived::f(int)
}
```

`using ns::name;` 引入单个名字；`using namespace ns;` 整包引入——头文件全局作用域不要用后者。私有继承时，`using Base::size;` 也可把基类成员提升到派生类的 `public`/`protected` 接口（访问调整），细节见继承章。

### `::` 与 `ns::`：名字从哪来

| 写法 | 含义 |
|------|------|
| `::f` | 全局（最外层）命名空间中的 `f` |
| `ns::f` | 命名空间 `ns` 中的 `f` |
| `Class::f` | 类作用域中的成员（静态调用或限定） |

在嵌套命名空间或 `using` 搅局时，先画「当前作用域 → 外层 → 全局」的查找路径；拿不准就写限定名。这与前向声明、头文件守卫一起，构成多文件项目的名字卫生。

### `extern "C"`：跨语言符号

C++ 为支持重载会对符号做名字修饰；C 不会。要链接 C 编译出的目标文件，需用 `extern "C"` 声明，让链接器找 C 风格符号：

```cpp
#ifdef __cplusplus
extern "C" {
#endif
int add(int, int);
#ifdef __cplusplus
}
#endif
```

C++ 侧也可 `extern "C" { #include "c_api.h" }`。标准 C 头在 C++ 里能直接用，正是因为实现里已经包了这层。混编时注意：用对应语言的编译器分别编译 `.c` / `.cpp`，再一起链接。

## 练习指引

- 把第 1 章的小程序拆成「读入函数 / 计算函数 / 输出函数」，体会抽象。
- 做三文件项目：`main.cpp` + `foo.cpp` + `foo.h`，先故意去掉 guard 或漏编译 `foo.cpp`，记录诊断。
- 为同一名字在两个命名空间中各写一个函数，用 `::` / `ns::` 限定调用；再写一个派生类同名重载，对比有无 `using Base::f`。
- 给「纯计算结果」函数加 `[[nodiscard]]`，故意丢弃返回值，观察编译器告警；用 `(void)` / `std::ignore` 显式消掉。
- 写一个带 `#` 字符串化的日志宏，用 `do { ... } while (0)` 包装，放进无花括号的 `if` 验证语义。
- 定义公有两字段 `struct`，写函数 `return {a, b};`；再给成员加 `private` 或手写构造，观察聚合初始化如何失效（对照第 13 章）。
- 完成第 2 章测验：按题目要求组织函数与文件，注意声明放头文件、定义放源文件。
- 对照 [第 0 章](./ch00-getting-started.md) 解释你的项目如何通过编译与链接。

## 小结

- 函数通过参数进、返回值出；局部变量有作用域与自动生命周期；重要返回值可标 `[[nodiscard]]`。
- **声明**满足编译期可见性，**定义**满足链接期唯一实现；头文件短函数靠 `inline`/ODR，虚调用路径通常难内联。
- 命名空间、`::` 限定、`using`（含 `using Base::f`）与 include 保护是名字与卫生的基本功；链 C 代码用 `extern "C"`。
- 宏的 `#`/`##` 与 `do { ... } while (0)` 属于预处理工具箱；聚合 `{}` 与公有数据成员是返回小结构时的常用预习点。
