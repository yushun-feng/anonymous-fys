---
title: 第 13 章：枚举与结构体
tags: [cpp, learncpp, cherno, enum, struct]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 13 章：枚举与结构体

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 13 章

## 小节地图

用户定义类型动机 → 无作用域枚举（`enum`）与整型提升/转换 → 枚举与字符串输出 → I/O 重载入门 → 有作用域枚举（`enum class`）→ `struct`、数据成员与聚合初始化 → 默认成员初始化 → 传参/返回 struct → 成员选择（`.` / `->`）→ 类模板用于 struct 与 CTAD → 别名模板简介。为 [第 14–15 章：类](./ch14-15-classes.md) 的封装与成员函数做铺垫。

## 核心概念

### 为何需要用户定义类型

内置类型无法表达“一组相关常量名称”或“一组相关字段组成的记录”。枚举给整数集合起名字；结构体把多个数据绑成一个值。二者都是迈向类与 OOP 的基础。

### 无作用域枚举（unscoped enum）

```cpp
enum Color { red, green, blue };  // 枚举项进入外围作用域
Color c = red;
```

- 枚举项可隐式转换为整型（通常用于底层存储或 switch）。
- **污染外围作用域**：两个 enum 不能有同名枚举项。
- 可指定底层类型：`enum Color : std::uint8_t { ... };`（C++11）。
- 现代新代码更推荐 `enum class`，无作用域枚举多见于与 C API 兼容或历史代码。

### 有作用域枚举（scoped enum / `enum class`）

```cpp
enum class Color { red, green, blue };
Color c = Color::red;
```

- 名称必须带枚举类型前缀：`Color::red`。
- **不会**隐式转成 `int`；需要时用 `static_cast<int>(c)`。
- 可指定底层类型：`enum class Color : int { ... };`。
- 更安全、可放进头文件而不易冲突，是默认首选。

### 枚举与字符串 / I/O

- 语言没有内置“枚举 ↔ 字符串”；需自行 `switch`、数组映射或反射库。
- 可为枚举重载 `operator<<` / `operator>>`，便于日志与调试（完整运算符重载见后续章节）。
- 输入校验：非法整型转枚举可能得到“不在枚举项列表中”的值——`enum class` 仍可能通过 `static_cast` 造出，读入时要验证。

### 结构体（`struct`）

- 聚合多字段的用户类型；默认**公有**成员（与 `class` 默认私有相对）。
- 本章先把它当作“纯数据聚合”；成员函数、封装在第 14 章展开。
- 成员选择：对象用 `.`，指针用 `->`（`p->x` 等价 `(*p).x`）。

### 聚合初始化（aggregate initialization）

聚合（大致：无用户声明构造函数、无私有/保护非静态数据成员等——标准定义随版本演进）可用花括号初始化：

```cpp
struct Point { int x; int y; };
Point p1{1, 2};       // 按成员声明顺序
Point p2{.x = 1, .y = 2}; // 指定初始化（C++20）
Point p3{};           // 值初始化，成员通常为 0
```

- 缺省成员初始化（default member initializer）可在声明处给默认值：`int x{0};`。
- 花括号初始化优于旧式 `=` 列表，能防窄化转换（`int x{3.5};` 非法）。

### 传参与返回

- 小 struct 可按值传递/返回，语义清晰；大对象用 `const T&` 入参。
- 按值返回 struct 通常享受 RVO/移动，不必为了“性能”返回指针。
- 结构化绑定（C++17）：`auto [x, y] = p;` 便于拆解聚合。

### 类模板与 CTAD（针对 struct 的简要）

```cpp
template <typename T>
struct Pair {
    T first{};
    T second{};
};

Pair<int> a{1, 2};
Pair b{1, 2};   // CTAD：编译器推断 Pair<int>（C++17）
```

- 类模板让“同一布局、不同元素类型”复用。
- **CTAD**（Class Template Argument Deduction）：从构造/初始化实参推断模板实参。
- **别名模板**：`template<typename T> using Vec2 = Pair<T>;` —— 为模板起短名。

更多模板细节见第 11 章与后续模板专章；此处只需能在笔记与练习中读懂 `Pair<T>` / CTAD。

## 语法与 API

```cpp
// 无作用域 vs 有作用域
enum OldStatus { ok, err };
enum class Status { ok, err };

OldStatus a = ok;              // 名称裸露
Status b = Status::ok;         // 必须限定
int ia = a;                    // 无作用域：可隐式转 int
// int ib = b;                 // 错误
int ib = static_cast<int>(b);

// 底层类型
enum class Flag : unsigned { none = 0, read = 1, write = 2 };

// struct 与默认成员初始化
struct User {
    int id{};
    std::string name{};
    bool active{true};
};

User u1{42, "Ada"};            // active 用默认 true
User u2{};                     // 全部按默认/值初始化

// 成员选择
User* pu = &u1;
pu->active = false;

// 模板 struct + CTAD
template <typename T, typename U>
struct Bundle {
    T a{};
    U b{};
};
Bundle x{1, std::string{"hi"}}; // Bundle<int, std::string>
```

枚举转字符串的常见模式：

```cpp
enum class Color { red, green, blue };

const char* to_cstring(Color c) {
    switch (c) {
    case Color::red:   return "red";
    case Color::green: return "green";
    case Color::blue:  return "blue";
    }
    return "unknown";
}
```

## 示例

### 1. `enum class` 做状态机标签

```cpp
#include <iostream>

enum class Phase { start, running, done };

void step(Phase& p) {
    switch (p) {
    case Phase::start:   p = Phase::running; break;
    case Phase::running: p = Phase::done;    break;
    case Phase::done:    break;
    }
}

int main() {
    Phase p = Phase::start;
    step(p);
    step(p);
    std::cout << (p == Phase::done) << '\n';
}
```

### 2. 聚合 struct 与指定初始化

```cpp
#include <iostream>
#include <string>

struct Config {
    std::string host{"localhost"};
    int port{8080};
    bool tls{false};
};

void print(const Config& c) {
    std::cout << c.host << ':' << c.port
              << (c.tls ? " tls" : "") << '\n';
}

int main() {
    Config a{};
    Config b{.host = "example.com", .port = 443, .tls = true}; // C++20
    print(a);
    print(b);
}
```

### 3. 返回 struct + 结构化绑定

```cpp
#include <iostream>

struct DivResult {
    int quot;
    int rem;
};

DivResult divide(int a, int b) {
    return DivResult{a / b, a % b};
}

int main() {
    auto [q, r] = divide(17, 5);
    std::cout << q << ' ' << r << '\n';
}
```

### 4. 模板 Pair 与 CTAD

```cpp
#include <iostream>
#include <string>

template <typename T>
struct Pair {
    T first{};
    T second{};
};

template <typename T>
Pair<T> make_pair_values(T a, T b) {
    return Pair<T>{a, b};
}

int main() {
    Pair p{10, 20};                 // CTAD → Pair<int>
    auto q = make_pair_values(std::string{"a"}, std::string{"b"});
    std::cout << p.first << ' ' << q.second << '\n';
}
```

### 5. 无作用域枚举的隐患（对比）

```cpp
enum Animal { cat, dog };
// enum Pet { cat, fish };  // 错误：cat 重定义

enum class Animal2 { cat, dog };
enum class Pet2 { cat, fish };  // OK：名称在各自作用域
```

## 易错与陷阱

1. **继续用无作用域枚举导致名字冲突**；新代码默认 `enum class`。
2. **假定 `enum class` 不能有“非法值”**：`static_cast` 仍可写入未列出的底层值；I/O 与网络边界要校验。
3. **忘记 `Color::` 前缀**：`enum class` 下写 `red` 会找不到声明。
4. **聚合初始化顺序错误**：按成员**声明顺序**，不是按名字（除非用 C++20 指定初始化）。
5. **窄化**：`Point p{1.5, 2};` 对 `int` 成员会在列表初始化时报错——这是特性，不要退回危险的 `=`。
6. **半初始化**：有默认成员初始化时，花括号仍按规则覆盖；搞清“哪些用了默认、哪些被覆盖”。
7. **对非聚合误用花括号聚合语义**：一旦写了自定义构造函数，聚合初始化规则改变——进入第 14 章后更明显。
8. **用指针成员却未定义所有权**：struct 里裸 `T*` 要问清谁释放；现代做法见 RAII / 智能指针。
9. **CTAD 失败**：初始化实参类型不一致或过于依赖隐式转换时，显式写 `Pair<int>`。
10. **在头文件定义无作用域枚举**易与其它翻译单元/库冲突；优先有作用域枚举或嵌套在命名空间/类中。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。`enum` 给整数贴语义标签；`struct`/`class` 在 Cherno 对比里往往只差**默认访问**：`struct` 默认 public，适合纯数据聚合；要守不变量再升级为带私有状态的类。

### 有作用域枚举是默认档

```cpp
enum class MoveState { idle, walk, dash };

void apply(MoveState s)
{
    if (s == MoveState::dash) {
        // ...
    }
}
```

无作用域枚举污染外围命名空间且易与 `int` 悄悄互转；新代码默认 `enum class`。边界输入（文件/网络）仍要校验底层值是否合法——`static_cast` 挡不住脏数据。

### 聚合：数据先行

```cpp
struct Vec2f {
    float x{};
    float y{};
};

Vec2f offset{1.5f, -2.0f};
auto [ox, oy] = offset;
```

Cherno 常先用 `struct` 攒字段，需要不变量（如分母非 0）再引入构造与私有化——与正文「预习第 14 章」一致。成员里出现裸指针时，立刻问所有权：谁分配、谁释放；答不清就不要把指针塞进「朴素聚合」假装简单。

### `struct` vs `class` 的团队约定

语言上几乎等价；团队可约定：纯数据 / POD 风格用 `struct`，带行为与不变量用 `class`。比纠结关键字更重要的是：**公共数据能否被任意写入而不破坏含义**。

## 练习指引

- 把一组相关魔法数字改成 `enum class`，并写 `to_string` / `operator<<`。
- 设计 `Fraction{num, den}` struct：聚合初始化、按值返回约分结果、用结构化绑定打印。
- 对比 `enum` 与 `enum class` 在 `switch`、与 `int` 互转、作为 map 键时的写法差异。
- 写一个 `template<typename T> struct Vec2 { T x; T y; };`，用 CTAD 创建，并写别名模板 `template<typename T> using Point2 = Vec2<T>;`。
- 预习第 14 章：若要为 `Fraction` 加“不变量”（分母非 0），为何需要私有成员与构造函数，而不再当纯聚合用。

## 小结

- `enum class` 是现代默认；无作用域枚举仅在兼容或刻意要隐式转整型时使用。
- `struct` 擅长表达数据记录；聚合初始化与默认成员初始化让构造简洁安全。
- 传返 struct 以值语义为主；大对象入参用 `const&`。
- 类模板 + CTAD 让泛型“数据对/向量”写法干净；别名模板用于缩短名称。
- 本章的“数据聚合”下一步是第 14–15 章的封装、构造与成员函数。
