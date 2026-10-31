---
title: 第 7 章：作用域、生命周期与链接
tags: [cpp, learncpp, cherno, scope, linkage]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 7 章：作用域、生命周期与链接

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 7 章

## 小节地图

块与局部作用域、名字遮蔽、用户定义命名空间、`using` 声明/指令、局部与全局变量、内部/外部链接、为何避免非常量全局、`inline` 变量与函数、跨文件共享常量、静态局部变量、存储期分类、匿名命名空间与内联命名空间。

相关笔记：[第 2 章 函数与文件](./ch02-functions-files.md) · [第 5 章 常量](./ch05-constants-strings.md) · [第 8 章 控制流](./ch08-control-flow.md)

## 核心概念

### 三个正交问题

讨论「一个名字」时，分开回答三件事，避免概念缠在一起：

| 问题 | 术语 | 含义 |
|------|------|------|
| 哪里能用这个名字？ | **作用域（scope）** | 名字的可见区域 |
| 对象活多久？ | **存储期 / 生命周期（duration / lifetime）** | 存储存在的时间区间 |
| 其他翻译单元看不看得到？ | **链接（linkage）** | 同名是否指同一实体 |

局部变量通常：块作用域 + 自动存储期 + 无链接。全局 `const` 在 C++ 中默认内部链接；非 `const` 全局默认外部链接。`static` 关键字在不同语境下扮演「改存储期」或「改链接」的不同角色——必须看它修饰的是什么。

### 块与作用域

花括号 `{ ... }` 引入块作用域。函数体、`if`/`for`/`while` 的本体、嵌套块都是块。名字从声明点开始可见，到最近包围块结束为止。`for (int i = 0; ...)` 里的 `i` 作用域是整个 for 语句（含条件与更新），不是外层函数。

### 名字遮蔽（shadowing）

内层作用域可声明与外层同名的实体，内层名字会遮蔽外层。编译器仍允许，但极易误读。实践中：避免局部变量与成员/全局同名；开启 `-Wshadow`。

### 命名空间

命名空间把名字组织进具名（或匿名）区域，降低全局污染与冲突。`::` 是作用域解析运算符：`std::cout`、`::globalFunc`（全局）、`MyLib::detail::helper`。

- **命名空间别名**：`namespace fs = std::filesystem;`
- **`using` 声明**：`using std::string;` —— 引入单个名字
- **`using` 指令**：`using namespace std;` —— 引入整个命名空间

头文件中避免 `using` 指令；`.cpp` 里也可尽量少用，优先写限定名或局部 `using` 声明。

### 链接详解

- **无链接**：块作用域实体（多数局部变量/函数参数）不能被其他作用域引用。
- **内部链接**：同翻译单元内的多次声明指同一实体，其他 `.cpp` 看不见。手段：匿名命名空间（推荐）、或全局 `static`（旧式）、以及命名空间作用域的非 `extern` 的 `const`/`constexpr` 对象（C++ 默认内部链接）。
- **外部链接**：程序范围内同一实体。非 `const` 的命名空间作用域变量/函数默认外部链接；用头文件声明 + 单个 `.cpp` 定义。

ODR（One Definition Rule）：有外部链接的实体在整个程序中只能有一个定义（`inline` 实体允许每个翻译单元一份相同定义）。

### 存储期分类

1. **自动存储期**：块作用域对象，进入块时分配，离开块时销毁（含栈上对象）。
2. **静态存储期**：命名空间作用域对象、以及 `static` 局部变量；程序启动前初始化（或首次控制流经过时，对静态局部），程序结束时销毁。
3. **线程存储期**：`thread_local`（本章可仅作了解）。
4. **动态存储期**：`new`/`delete`（后续章节）。

### 静态局部变量

```cpp
int nextId() {
    static int id = 0;  // 首次经过时初始化，之后保持
    return ++id;
}
```

生命周期贯穿整个程序，但名字仍只在函数内可见。用于「函数内计数器」「懒汉式局部缓存」；多线程下需额外同步（C++11 起静态局部初始化本身有线程安全保证，但后续读写未必）。

### 全局变量的利弊

非常量全局 = 隐式共享可变状态：难测试、难推理、隐蔽依赖。优先：函数参数、返回值、类成员、依赖注入。若必须跨文件共享，优先 **`constexpr`/`const` 全局常量**（放在头文件，靠内部链接或 `inline`），而非可变全局。

## 语法与 API

### 用户命名空间

```cpp
namespace geometry {
inline namespace v2 {          // 内联命名空间：符号也注入外层
    struct Point { double x, y; };
}
}  // namespace geometry
```

内联命名空间常用于 ABI/版本演进：`geometry::Point` 与 `geometry::v2::Point` 等价可见。

### 匿名命名空间

```cpp
namespace {
int cache = 0;               // 内部链接，仅本 .cpp 可见
void helper() { ++cache; }
}
```

这是给「文件私有」函数/变量的现代写法，优于文件作用域 `static`。

### 跨文件共享：声明与定义

```cpp
// math_constants.h
#pragma once
inline constexpr double pi = 3.141592653589793;  // C++17 inline 变量

// config.h
#pragma once
extern int g_maxConnections;   // 声明

// config.cpp
#include "config.h"
int g_maxConnections = 128;    // 唯一定义
```

C++17 起，头文件中的 `inline` 变量可安全放入多处 include，链接器合并为同一实体——非常适合常量与轻量全局配置。函数亦可 `inline`，但「是否真的内联展开」由编译器决定；关键字的语义核心是 **允许多定义合并**。

### `extern const` 与内部链接常量

```cpp
// constants.cpp
extern const int maxUsers;     // 若在 .cpp 定义非-inline const，需 extern 才能给外部链接
const int maxUsers = 1000;
```

更干净的现代做法仍是：头文件 `inline constexpr`，或模板/函数返回常量。

## 示例

### 块作用域与遮蔽

```cpp
#include <iostream>

int value = 1;  // 全局

int main() {
    int value = 2;              // 遮蔽全局
    std::cout << value << '\n'; // 2
    {
        int value = 3;          // 再遮蔽
        std::cout << value << '\n';     // 3
        std::cout << ::value << '\n';   // 1，显式全局
    }
    std::cout << value << '\n'; // 2
}
```

### 命名空间与 using

```cpp
#include <iostream>
#include <string>

namespace app::util {
std::string trim(std::string s) {
    // ...
    return s;
}
}

int main() {
    namespace u = app::util;           // 别名
    using app::util::trim;           // 声明：只引入 trim
    std::string s = trim("  hi ");
    std::cout << u::trim(s) << '\n';
    // 不要在此处 using namespace std; 若必须，尽量缩到最小块内
}
```

### 内部链接 vs 外部链接

```cpp
// a.cpp
namespace {
void log(const char*) { /* 文件私有 */ }
}
void publicApi() { log("a"); }   // 外部链接函数

// b.cpp
void log(const char*);           // 这是另一个实体（若有定义），不会链到 a.cpp 的匿名版本
void publicApi();                // 正确：声明 a.cpp 的导出函数
```

### 静态局部与全局常量

```cpp
#include <iostream>
#include <string_view>

inline constexpr std::string_view kAppName = "demo";

int tick() {
    static int n = 0;
    return ++n;
}

int main() {
    std::cout << kAppName << ' ' << tick() << ' ' << tick() << '\n';  // demo 1 2
}
```

### 生命周期对比

```cpp
#include <iostream>

struct Tracer {
    const char* name;
    explicit Tracer(const char* n) : name(n) {
        std::cout << "ctor " << name << '\n';
    }
    ~Tracer() { std::cout << "dtor " << name << '\n'; }
};

Tracer g("global");              // 静态存储期

void f() {
    Tracer a("auto");            // 自动：离开 f 即销毁
    static Tracer s("static-local");  // 首次调用时构造，程序结束时销毁
}

int main() {
    f();
    f();                         // static-local 不再构造
}
// 析构顺序（简化）：static-local → global（同静态存储期对象按构造逆序）
```

## 易错与陷阱

1. **把链接当成作用域**：`static` 局部变量作用域仍在函数内，只是活得更久；外面依旧不能直接访问。
2. **头文件定义非 inline 的全局变量**：多 `.cpp` include 会引发重复定义链接错误。
3. **非常量全局到处写**：隐藏依赖让单元测试与并发立刻变难；先问能否变成参数。
4. **在头文件 `using namespace std;`**：污染所有包含者，名称冲突风险极高。
5. **依赖全局初始化顺序**：跨翻译单元的静态对象初始化顺序未指定；不要让全局 A 的构造依赖全局 B 的值。可用函数内静态局部（Myers' Singleton 模式）延迟初始化。
6. **遮蔽循环变量**：外层已有 `i`，内层 `for (int i = ...)` 可能让人看错更新的是哪个。
7. **`extern` 写在定义上又初始化**：`extern int x = 1;` 其实是定义；纯粹声明不要带初始化器。
8. **匿名命名空间放进头文件**：每个翻译单元得到**不同**的内部实体，通常不是想要的共享，反而可能重复代码或 ODR 怪异问题——匿名命名空间留在 `.cpp`。
9. **误以为 `const` 全局一定跨文件共享**：默认内部链接，每个 TU 一份；要共享需 `extern const` 或 `inline constexpr`。
10. **静态局部保存巨大对象或锁**：生命周期长，注意内存与销毁时机；测试中「重置状态」会变麻烦。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。`static` 在 Cherno 视频里常被拆成三条不同故事：文件作用域「藏起来」、类作用域「属于类型」、函数内「第一次进门才建、之后一直活」。正文已系统讲作用域 / 存储期 / 链接——这里补**工程选型口径**。

### 三种 `static` 一眼分辨

| 写法 | 直觉 |
|------|------|
| `.cpp` 里文件级 `static` / 匿名命名空间 | 「这个翻译单元私有」 |
| `static` 数据成员 | 「所有实例共享一份」 |
| 函数内 `static` 局部 | 「惰性初始化的持久状态」 |

```cpp
namespace {
int gHiddenCounter = 0; // 仅本 .cpp 可见
}

struct WidgetFactory {
    static int liveCount;           // 属于类型
    WidgetFactory() { ++liveCount; }
    ~WidgetFactory() { --liveCount; }
};
int WidgetFactory::liveCount = 0;

int nextStamp()
{
    static int seq = 0;             // 跨调用保持
    return ++seq;
}
```

### 全局可变状态的代价

Cherno 演示里全局很方便，但真实项目里它会变成：隐藏依赖、测试难重置、多线程竞态。优先把状态变成参数或对象成员；确需进程级单例时，倾向函数内 `static` 局部（延迟构造），并清楚销毁顺序风险。

### 头文件共享常量

跨 TU 共享只读配置，现代默认：

```cpp
// config_tokens.h
#pragma once
inline constexpr int kMaxPlayers = 8;
```

避免在头里定义非 `inline` 的可变全局。匿名命名空间请留在 `.cpp`，否则每个包含者各得一份「同名不同实体」。

### 与正文分工

生命周期对比、`extern`、跨 TU 初始化顺序未指定等正文已详述。本节聚焦：**何时用私有链接、何时用类型级共享、何时把全局降级为参数**。

## 练习指引

- 画一张表，对「函数局部 / `static` 局部 / 全局 `const` / 全局可变 / 匿名命名空间变量」分别填：作用域、存储期、链接。
- 把一个使用可变全局的小程序，重构为「参数传递 + 返回值」，比较两边可测试性。
- 建两个 `.cpp`，验证：头文件里普通 `int g;` 会链接失败；改成 `inline int g = 0;`（C++17）后行为如何。
- 写 `nextId()` 静态局部计数器，并思考多线程下是否需要 `std::atomic`。
- 练习命名空间：为一个小工具库设计 `lib::io` 与 `lib::parse`，在 `main` 里只用别名与 `using` 声明，避免 `using namespace`。

## 小结

作用域管「看见」，存储期管「存活」，链接管「跨文件是否同一实体」。现代 C++ 的默认偏好是：**局部优于全局、常量优于变量、匿名命名空间优于文件级 `static`、头文件用 `inline constexpr` 共享常量**。理清这张地图后，[第 8 章](./ch08-control-flow.md) 将在块作用域之上展开分支与循环等控制流。
