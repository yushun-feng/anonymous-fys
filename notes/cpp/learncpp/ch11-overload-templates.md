---
title: 第 11 章：函数重载与函数模板
tags: [cpp, learncpp, overloading, templates]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 11 章：函数重载与函数模板

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 11 章
> 对照笔记：[Cherno 模板](../cherno/11-templates.md)。

## 小节地图

函数重载规则、重载决议与二义性、`= delete`、默认实参、函数模板与实例化、模板实参推导、多模板参数、非类型模板参数（NTTP）入门、特化简介、模板与多文件、重载与模板共存时的选择。

相关笔记：[第 2 章 函数](./ch02-functions-files.md) · [第 10 章 类型转换](./ch10-type-conversion.md) · [第 20 章 函数进阶](./ch20-advanced-functions.md) · [第 26–28 章 类模板](./ch26-28-templates-exceptions-io.md)

## 核心概念

### 函数重载（overloading）

同一作用域内，多个函数共享名字但**参数列表不同**（参数类型、个数、顺序；指针/引用/const 顶层性等），称为重载。返回类型**不能**单独作为重载区分依据。

编译器根据调用实参进行**重载决议（overload resolution）**：找出可行函数，按匹配优劣排序，若唯一最佳则选中，否则报二义性错误。

### 匹配等级（简化直觉）

从优到劣的常见层次：

1. 精确匹配（含数组→指针、函数→指针等平凡衰减）
2. 需要整型提升等提升级转换
3. 标准转换（如 `int → double`、派生→基类指针）
4. 用户定义转换
5. 省略号 `...`（C 可变参，应避免）

`const` 对象更匹配 `const T&` 重载；非 `const` 更匹配 `T&`。这是 `const` 正确性与重载搭配的经典模式。

### 默认实参

在声明中为尾部参数提供默认值，调用时可省略。默认实参在一次声明中「从右到左」出现；通常写在头文件声明里，定义处不再重复（避免重复指定冲突）。

重载 + 默认实参容易制造二义性：`f(int)` 与 `f(int, int = 0)` 对 `f(1)` 可能冲突。

### `= delete`

显式删除函数：参与重载集，但若被选中则编译错误。用于：禁止不想要的隐式转换调用、禁止拷贝、收窄危险重载等。

```cpp
void process(int);
void process(double) = delete;   // 禁止 double 悄悄调到别处或禁止浮点版本
```

### 函数模板

模板是「生成函数的蓝图」。编译器根据调用**实例化**出具体类型版本（除非你显式指定模板实参）。

```cpp
template <typename T>
T maxValue(T a, T b) {
    return (a > b) ? a : b;
}
```

推导失败或替换失败时，该候选从重载集中剔除（SFINAE 思想的入门观察）；硬错误则仍会报错。C++20 概念（concepts）可更清晰地约束，属后续进阶。

### 非类型模板参数（NTTP）

模板参数不仅可以是类型，还可以是编译期常量值（整型、枚举、指针/引用（有限制）、C++20 起更多类类型等）：

```cpp
template <int N>
constexpr int factorial() {
    static_assert(N >= 0);
    if constexpr (N == 0) return 1;
    else return N * factorial<N - 1>();
}
```

用于固定大小、策略标签、编译期配置。

### 特化（简介）

**全特化**：为特定实参提供完全手写实现。函数模板的偏特化在标准中受限（不像类模板那样自由），实践中多用重载代替「函数模板偏特化」。类模板特化见后续章节。

## 语法与 API

### 合法与非法的重载

```cpp
int  lookup(int id);
int  lookup(std::string_view name);     // OK：参数类型不同
void lookup(int id);                    // 非法：仅返回类型不同

void set(int&);
void set(const int&);                   // OK：常性不同
void set(int*);                         // OK
```

### 默认实参

```cpp
void connect(const std::string& host, int port = 443, bool tls = true);

// connect("a.com");
// connect("a.com", 8080);
// connect("a.com", 8080, false);
```

### 函数模板基础

```cpp
template <typename T>
void swapValues(T& a, T& b) {
    T tmp = a;
    a = b;
    b = tmp;
}

template <typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}
```

显式指定：`swapValues<int>(x, y);`、`add<double>(1, 2.5);`。

### 多文件中的模板

模板的定义通常放在**头文件**（或 `.hpp` / `.inl`），因为实例化需要完整可见的定义。只在 `.cpp` 里定义模板函数、却在其他翻译单元调用，常导致链接错误（除非显式实例化）。

```cpp
// math.hpp
#pragma once
template <typename T>
T square(T x) { return x * x; }

// 显式实例化示例（可选，用于收窄生成代码）
// template int square<int>(int);
```

## 示例

### 重载决议与二义性

```cpp
#include <iostream>

void print(int) { std::cout << "int\n"; }
void print(double) { std::cout << "double\n"; }
void print(long) { std::cout << "long\n"; }

int main() {
    print(42);        // int
    print(3.14);      // double
    // print(3.14f);  // float → 到 float→double 与提升路径可能二义，视重载集而定
    print(static_cast<long>(42));
}
```

### `const` 重载

```cpp
#include <iostream>
#include <string>

std::string&       getName();
const std::string& getName();   // 常对象上调用常版本

class Registry {
public:
    int&       value(std::size_t i)       { return data_[i]; }
    const int& value(std::size_t i) const { return data_[i]; }
private:
    int data_[8]{};
};
```

### 删除危险重载

```cpp
#include <cstddef>

void drawRect(int width, int height);

// 禁止从 bool 隐式转换成 int 造成的怪异调用
void drawRect(bool, bool) = delete;

// 禁止指针尺寸误用
void drawRect(std::size_t, std::size_t) = delete;

void demo() {
    drawRect(10, 20);       // OK
    // drawRect(true, false);  // 错误：已删除
}
```

### 函数模板推导

```cpp
#include <iostream>
#include <string>

template <typename T>
T maxValue(T a, T b) {
    return (a > b) ? a : b;
}

int main() {
    std::cout << maxValue(3, 7) << '\n';                 // T = int
    std::cout << maxValue(3.5, 2.1) << '\n';             // T = double
    // std::cout << maxValue(3, 7.0);                   // 无法推导单一 T
    std::cout << maxValue<double>(3, 7.0) << '\n';       // 显式指定

    std::string a = "ab", b = "cd";
    std::cout << maxValue(a, b) << '\n';
}
```

### 多参数模板与返回类型

```cpp
#include <iostream>
#include <type_traits>

template <typename T, typename U>
constexpr auto mid(T a, U b) {
    using R = std::common_type_t<T, U>;
    return static_cast<R>(a) + (static_cast<R>(b) - static_cast<R>(a)) / 2;
}

int main() {
    std::cout << mid(3, 8.0) << '\n';
}
```

### NTTP：固定大小环缓冲示意

```cpp
#include <array>
#include <cstddef>
#include <iostream>

template <typename T, std::size_t N>
struct Ring {
    std::array<T, N> buf{};
    std::size_t head = 0;
    std::size_t size = 0;

    void push(const T& v) {
        buf[head] = v;
        head = (head + 1) % N;
        if (size < N) ++size;
    }

    const T& operator[](std::size_t i) const {
        std::size_t start = (head + N - size) % N;
        return buf[(start + i) % N];
    }
};

int main() {
    Ring<int, 3> r;
    r.push(1); r.push(2); r.push(3); r.push(4);  // 覆盖最旧
    for (std::size_t i = 0; i < r.size; ++i) {
        std::cout << r[i] << ' ';                // 2 3 4
    }
}
```

### 重载优先于较差的模板匹配（示意）

```cpp
#include <iostream>
#include <string>

template <typename T>
void logValue(const T& v) {
    std::cout << "template: " << v << '\n';
}

void logValue(const std::string& s) {
    std::cout << "string overload: " << s << '\n';
}

int main() {
    logValue(42);                         // 模板
    logValue(std::string{"hi"});          // 普通重载更优（精确）
    logValue("raw");                      // 匹配 const char* 的模板实例，而非 string 重载
}
```

## 易错与陷阱

1. **仅靠返回类型重载**：非法；换名字或加 tag 参数。
2. **默认实参造成二义**：两个重载都能用默认值「吃掉」同一调用。
3. **在 `.cpp` 定义模板却跨 TU 使用**：链接找不到符号；定义放头文件或显式实例化。
4. **模板参数必须完全一致才能推导**：`maxValue(1, 2.0)` 失败；用两类型参数或显式指定，或 `std::common_type`。
5. **对 `bool`/`char` 的重载陷阱**：整型提升让 `f(int)` 吃掉本想给 `f(bool)` 的调用，或反过来；必要时 `= delete` 或用 `enum class`。
6. **头文件里模板 + 静态对象**：每个 TU 可能各有一份（内部链接），行为怪异。
7. **过早微优化「特化一切」**：先写清晰主模板；热点再特化/重载。
8. **函数模板「偏特化」写法**：应改为重载或类模板委托。
9. **默认实参写在定义又写在声明**：非法重复；只留一处（通常声明）。
10. **忽略 ADL / 命名空间**：`swap`、运算符查找依赖关联命名空间——进阶议题，但重载放错命名空间会导致找不到候选。

## 练习指引

- 为 `print` 编写 `int`/`double`/`string_view` 重载，并预测 `print('x')`、`print("x")` 分别走哪条路径。
- 设计 `clamp(v, lo, hi)` 函数模板，要求三参数同型；再写一个允许异型但返回 `common_type` 的版本。
- 用 `= delete` 禁止 `process(bool)`，迫使调用方写 `process(static_cast<int>(flag))` 或提供专门 API。
- 把 `square` 模板放进头文件，在两个 `.cpp` 调用，确认能链接；再尝试只放 `.cpp` 观察错误信息。
- 用 NTTP 写 `template <int Base> int digits(int n)` 统计某进制位数，`static_assert(Base >= 2)`。

## 小结

重载让「同名异构」的接口自然表达；默认实参减少噪音但增加决议复杂度；`= delete` 是关掉不良匹配的闸门。函数模板把重载从「手写几个版本」推进到「按类型生成」；NTTP 则把常量配置抬进类型系统。多文件时记住：**模板定义须对实例化点可见**。至此，LearnCpp 前半段的「函数级工具箱」已齐——下一站通常是 [引用与指针](./ch12-references-pointers.md)，把参数传递与对象身份讲透。
