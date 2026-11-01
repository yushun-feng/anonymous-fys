---
title: 第 4 章：基本数据类型
tags: [cpp, learncpp, types, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 4 章：基本数据类型

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 4 章
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 小节地图

| 主题 | 要点 |
|------|------|
| 基本类型概览 | 分类：空、布尔、字符、整数、浮点 |
| `void` | 「无类型」：无返回值、有限用法 |
| `sizeof` | 对象/类型字节数 |
| 有符号 / 无符号整数 | 表示范围、转换风险 |
| 定宽整数与 `size_t` | `<cstdint>`、`std::size_t` |
| 科学计数法与浮点 | `float`/`double`、精度与误差 |
| 布尔与 `if` 入门 | `true`/`false`、条件语句骨架 |
| 字符类型 | `char`、转义、与整数关系 |
| `static_cast` 入门 | 显式转换 |
| 数值极限（关联） | `<limits>` 查范围 |

相关：[第 1 章 字面量与初始化](./ch01-basics.md) · [第 5 章 常量与字符串](./ch05-constants-strings.md) · [第 10 章 类型转换](./ch10-type-conversion.md)

## 核心概念

### 类型决定意义

同一堆比特，类型不同解释不同。基本类型（fundamental types）由语言提供，是复合类型与标准库的地基。

粗分类：

| 类别 | 例子 |
|------|------|
| 空类型 | `void` |
| 布尔 | `bool` |
| 字符 | `char`、`wchar_t`、`char8_t`/`char16_t`/`char32_t`（后三者后文/Unicode 相关） |
| 整数 | `short`/`int`/`long`/`long long` 及 `unsigned` 变体 |
| 浮点 | `float`、`double`、`long double` |
| 空指针类型 | `std::nullptr_t`（与指针章节相关） |

### `void`

表示「没有值」：

- 函数返回类型：`void f();`
- 不能有 `void` 变量。
- `void*` 是「指向未知类型」的指针（后文；需转换才能解引用）。

### `sizeof`

`sizeof(类型)` 或 `sizeof 表达式` → `std::size_t` 字节数（编译期可知，对多数完整类型）。

```cpp
sizeof(int);     // 常见为 4，但标准只保证范围，不保证精确宽度
sizeof x;        // x 的类型大小
```

### 整数家族

标准只规定**相对范围与最小范围**，不规定 `int` 一定是 32 位。实践中桌面平台常见：

| 类型 | 常见宽度 | 备注 |
|------|----------|------|
| `short` | 16 位 | |
| `int` | 32 位 | 日常默认整数 |
| `long` | 32 或 64 | Windows LP64/LLP64 差异大 |
| `long long` | ≥64 位 | |
| `unsigned T` | 同宽无符号 | 模 2ⁿ 算术 |

**有符号**可表负值；溢出在 C++ 中是 **UB**。  
**无符号**溢出按模运算回绕，行为有定义，但与有符号混用极易埋雷（比较、减法）。

学习建议：

- 一般算术与计数优先 `int`（或后文更清晰的别名）。
- 需要「确定宽度」时用 `<cstdint>`：`std::int32_t`、`std::uint64_t` 等（*fixed-width*；若平台不支持则可能不提供）。
- 对象大小、容器长度常用 `std::size_t`（无符号，`sizeof` 的结果类型）。

### 浮点

| 类型 | 典型精度 |
|------|----------|
| `float` | ~6–7 位十进制 |
| `double` | ~15–16 位（默认首选） |
| `long double` | 实现定义，可能更宽 |

字面量：`3.14` 是 `double`，`3.14f` 是 `float`。科学计数：`1.5e2` 即 150。

浮点**不能**精确表示所有十进制小数；相等比较应谨慎（后文用误差范围）。`NaN`、`inf` 在特殊运算中出现。

### 布尔与 `if` 入门

`bool` 取值 `true` / `false`。条件语句骨架：

```cpp
if (condition)
{
    // condition 为 true 时执行
}
else
{
    // 可选
}
```

整数等可上下文转换成 `bool`（0 → `false`，非 0 → `true`）；过度依赖隐式转换会降可读性。完整控制流见第 8 章。

### 字符 `char`

- 用于存字符编码中的一个单元；`'A'` 是字符字面量。
- 在表达式中常提升为 `int` 参与运算。
- `char` 符号性（signed/unsigned）**实现定义**——处理原始字节更宜用 `unsigned char` 或 `std::byte`（C++17）。
- 转义：`'\n'`、`'\t'`、`'\\'`、`'\''` 等。

输出 `char` 显示为字符；若要看编码数值，需先转换成整数类型。

### `static_cast` 入门

显式、相对安全的命名转换：

```cpp
double d{3.9};
int n = static_cast<int>(d);  // 截断为 3
```

比 C 风格 `(int)d` 更醒目，也便于搜索。更完整的转换规则、`const_cast` 等见第 10 章。收窄与花括号初始化的关系见 [第 1 章](./ch01-basics.md)。

### 数值极限

```cpp
#include <limits>
std::numeric_limits<int>::max();
std::numeric_limits<int>::min();
std::numeric_limits<double>::epsilon();
```

查范围与特性，避免魔法数硬猜。

## 语法与 API

```cpp
#include <cstddef>    // std::size_t
#include <cstdint>    // std::int32_t 等
#include <limits>     // std::numeric_limits

sizeof(T)
sizeof expr
static_cast<NewType>(expr)

bool b{true};
char c{'Z'};
int i{42};
unsigned u{42u};
double x{1.0e-3};
```

## 示例

### 示例 1：`sizeof` 与极限

```cpp
#include <iostream>
#include <limits>

int main()
{
    std::cout << "sizeof(int)=" << sizeof(int) << '\n';
    std::cout << "int max=" << std::numeric_limits<int>::max() << '\n';
    std::cout << "bool size=" << sizeof(bool) << '\n';  // 常为 1，但不必假想成「只占一位」
}
```

### 示例 2：有符号 / 无符号比较陷阱

```cpp
#include <iostream>

int main()
{
    int x{-1};
    unsigned u{1};
    // x < u 时，x 通常先转换成无符号，变成很大的数 → 比较结果可能出乎意料
    std::cout << std::boolalpha << (x < u) << '\n';
}
```

尽量避免有符号与无符号直接混比；循环下标与 `size_t` 比较时尤其小心。

### 示例 3：定宽整数

```cpp
#include <cstdint>
#include <iostream>

int main()
{
    std::int32_t a{1000};
    std::uint8_t b{255};
    std::cout << a << ' ' << static_cast<int>(b) << '\n';
}
```

注意：`uint8_t` 在有的实现上是 `unsigned char` 别名，`cout` 可能当字符输出，故常先 `static_cast` 到较大整数。

### 示例 4：浮点精度

```cpp
#include <iostream>
#include <iomanip>

int main()
{
    double x = 0.1 + 0.2;
    std::cout << std::setprecision(17) << x << '\n';  // 常见并非精确 0.3
    std::cout << std::boolalpha << (x == 0.3) << '\n';
}
```

### 示例 5：字符与转换

```cpp
#include <iostream>

int main()
{
    char ch{'A'};
    std::cout << ch << ' ' << static_cast<int>(ch) << '\n';
    char next = static_cast<char>(ch + 1);  // 'B'，注意范围
    std::cout << next << '\n';
}
```

### 示例 6：`if` 与 `bool`

```cpp
#include <iostream>

int main()
{
    bool ok{true};
    if (ok)
        std::cout << "ready\n";

    int n{};
    std::cin >> n;
    if (n > 0)
        std::cout << "positive\n";
    else
        std::cout << "non-positive\n";
}
```

## 易错与陷阱

1. **假设 `int` / `long` 宽度**跨平台写二进制协议 → 改用定宽类型并明确端序。
2. **有符号溢出**当「自然回绕」→ UB；不要依赖。
3. **无符号向下计数**：`for (size_t i = n; i >= 0; --i)` 可能永远为真。
4. **`float` 累加大量小数**误差大；默认用 `double`。
5. **用 `==` 比较两个浮点计算结果**。
6. **`char` 当字节**且假设有符号 → 可移植性差。
7. **C 风格强制转换**藏在表达式里难以发现；优先 `static_cast`。
8. **`sizeof` 数组 vs 指针**：数组名退化成指针后 `sizeof` 变指针大小（第 16–17 章）；现在先对类型使用 `sizeof(T)`。
9. **布尔输出**：默认 `cout` 打印 `0/1`；`std::boolalpha` 打印 `true/false`。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 `sizeof`、`union`、`volatile`、位域相关篇。基本类型之上，面试常追问的是**对象到底占几字节、联合如何省空间**。

### 对象体积速记

| 情形 | 常见结论 |
|------|----------|
| 空类 | 至少 1 字节（保证地址唯一） |
| 普通成员函数 / `static` 数据 | 不增加每个对象的大小 |
| 有虚函数 | 通常 +1 个 vptr |
| 普通继承 | 基类子对象按对齐累加 |
| 虚继承 | 实现相关；可能额外指针/偏移 |

用 `sizeof` 在本机印一遍，比死记数字有用。

### `union`：同一时刻只「活」一个成员

- 默认访问 public；可有构造/析构，但**不能**有引用成员、虚函数，也不能当基类/派生。
- 写入一个成员后再读另一个，通常是 UB（除非特殊常见初始序列等例外）；类型安全的现代替代是 `std::variant`。
- 匿名 union 把成员直接抬到外层作用域，适合手工标签联合；全局匿名 union 须为 `static`。

### 位域预习

`unsigned flag : 1;` 这类字段可紧凑打包，但布局**依赖实现**、不能取地址——细节见 [可选：位运算](./optional-bit-constexpr.md) 中的《C++那些事》补充。

## 练习指引

- 打印本机各基本类型 `sizeof` 与 `numeric_limits` 的 min/max，做成一张「本机速查表」。
- 写几个有符号/无符号比较例子，在调试器里看提升后的值（结合 [第 3 章](./ch03-debugging.md)）。
- 用 `static_cast` 把 `double` 转 `int`、`char` 转 `int`，观察截断。
- 完成第 4 章测验：选择题与小程序，重点覆盖类型选择与转换。
- 预习常量：哪些值不该被改——进入 [第 5 章](./ch05-constants-strings.md)。

## 小结

- 基本类型规定值如何存储与运算；`sizeof` 与 `numeric_limits` 帮助了解实现。
- 整数注意符号与宽度；浮点注意精度；字符注意符号性与输出方式。
- `bool`/`if` 开启分支；`static_cast` 是显式转换的首选入门工具。
- 有符号无符号混用、浮点相等、宽度假设是三大常见坑。
