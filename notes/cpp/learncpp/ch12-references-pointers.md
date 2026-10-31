---
title: 第 12 章：引用与指针
tags: [cpp, learncpp, references, pointers]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 12 章：引用与指针

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 12 章
> 对照笔记：[Cherno 指针与引用](../cherno/03-pointers-references.md)。

## 小节地图

复合类型与值类别（lvalue / rvalue）→ 左值引用与 `const` 引用 → 按引用传递与返回 → 指针、空指针与指针算术入门 → 指针与 `const` → 按址传递 → in/out 参数约定 → 类型推断与引用 → `std::optional` 作为“可能无值”的替代。后续与 [第 14–15 章：类](./ch14-15-classes.md)、[第 18–19 章：迭代器与动态分配](./ch18-19-iterators-dynamic.md)、[第 22 章：移动与智能指针](./ch22-move-smart-pointers.md) 紧密衔接。

## 核心概念

### 复合类型与值类别

- **复合类型**：在已有类型上叠加语义，本章重点是**引用**与**指针**。
- **左值（lvalue）**：有持久身份、可取地址的表达式（变量名、解引用结果等）。
- **右值（rvalue）**：临时值或字面量等，通常不可取地址（如 `5`、函数返回的纯右值）。
- 理解值类别是为了知道：**非 const 左值引用只能绑定左值**；**`const` 左值引用可绑定右值**（延长临时对象生命周期）。

### 左值引用（lvalue reference）

- 语法：`T&` 或 `T &`（空格风格不重要）。
- 引用是**已有对象的别名**，必须初始化，之后不能“改绑”到另一个对象。
- 非 `const` 引用：`int& r = x;` —— 通过 `r` 读写的就是 `x`。
- `const` 引用：`const int& cr = x;` —— 只读别名；也可绑定临时对象：`const int& t = 42;`。
- 引用本身不是对象，没有自己的存储（实现上可能占指针大小，但语言层面不当作独立对象）。

### 指针（pointer）

- 语法：`T*` —— 保存**对象地址**的对象。
- 可重新赋值；可为空（不指向有效对象）。
- 解引用 `*p` 得到所指对象；取地址 `&x` 得到指向 `x` 的指针。
- 指针是一等对象：可拷贝、可放入容器、可作为成员。

### 引用 vs 指针（选型直觉）

| 需求 | 倾向 |
|------|------|
| 必须始终有效、别名语义、API 更清晰 | 引用 |
| 可能为空、需要重新指向、需要算术/迭代 | 指针 |
| 所有权与生命周期管理 | 智能指针（见第 22 章），而非裸 `new` |

### 空指针与“无值”

- 现代写法优先 `nullptr`（`nullptr_t`），避免 `NULL` / `0` 的重载歧义。
- 解引用空指针是**未定义行为（UB）**。
- 当“可能无值”是业务语义时，优先考虑 `std::optional<T>`，而不是到处传可空指针。

### 指针与 const（四种组合）

| 写法 | 含义 |
|------|------|
| `int* p` | 可变指针，指向可变 `int` |
| `const int* p` / `int const* p` | 可变指针，指向只读 `int` |
| `int* const p` | 指针本身不可改，指向可变 `int` |
| `const int* const p` | 指针与所指均不可改 |

读法技巧：从右往左读——`const` 紧挨 `*` 左边修饰所指，紧挨名字修饰指针本身。

### 按值 / 按引用 / 按址传递

- **按值**：拷贝实参；大对象昂贵；函数内修改不影响调用方。
- **按引用 `T&` / `const T&`**：无拷贝；`const T&` 是只读大对象的默认选择。
- **按址 `T*`**：显式传递地址；约定上常表示“可选”或“可能为空”；调用处写 `&x`，函数内写 `*p`。
- **返回引用**：可链式调用或避免拷贝，但**绝不能返回局部变量的引用/指针**（悬垂）。
- **返回指针**：同样禁止指向自动存储期对象；返回堆对象时所有权需明确（现代代码更偏好按值返回或智能指针）。

### `std::optional`（C++17）

- 表示“有值或无值”，比可空指针更安全、意图更清晰。
- 关键 API：`has_value()` / `operator bool`、`value()`、`value_or(default)`、`*` / `->`（无值时 UB，需先检查）。
- 适合：查找失败、解析可选字段、工厂“可能构造失败”等，而不必抛异常或用魔术哨兵值。

## 语法与 API

```cpp
// 引用
int x = 10;
int& rx = x;              // 必须初始化
const int& cr = 20;       // 绑定临时，生命周期延长到 cr 作用域结束

// 指针
int* p = &x;
*p = 11;                  // x 变为 11
p = nullptr;              // 可改绑 / 置空

// 按引用 / 按址
void incr(int& n) { ++n; }
void maybe_set(int* p, int v) {
    if (p) *p = v;        // 空指针安全约定
}

// const 指针组合
const int* pc = &x;       // 不能通过 pc 改 *pc
int* const cp = &x;       // 不能让 cp 指向别处
const int* const cpc = &x;

// 指针算术（入门：指向数组元素时）
int a[3]{1, 2, 3};
int* it = a;              // 退化，见第 16–17 章
++it;                     // 指向下一个 int
// 对非数组对象做随意算术通常无意义且危险

// std::optional
#include <optional>
std::optional<int> find_id(bool ok) {
    if (!ok) return std::nullopt;
    return 42;
}
```

类型推断注意：

- `auto& r = x;` —— 引用；`auto r = x;` —— 拷贝。
- `const auto&` 常用于范围 for，避免拷贝大对象。
- `auto*` 可强调指针，但非必须。

## 示例

### 1. 引用别名与按引用修改

```cpp
#include <iostream>

void double_in_place(int& n) {
    n *= 2;
}

int main() {
    int score = 21;
    int& alias = score;
    alias = 30;                 // score == 30
    double_in_place(score);     // score == 60
    std::cout << score << '\n';
}
```

### 2. const 引用绑定临时与只读接口

```cpp
#include <string>
#include <iostream>

void print_upper_hint(const std::string& s) {
    // 不拷贝；也不能修改调用方的 string
    std::cout << "len=" << s.size() << '\n';
}

int main() {
    print_upper_hint("temporary");  // 绑定临时 string，安全只读
    std::string name = "Ada";
    print_upper_hint(name);
}
```

### 3. 指针、空检查与按址传出

```cpp
#include <iostream>

bool parse_positive(const char* text, int* out) {
    if (!text || !out) return false;
    int v = 0;
    for (const char* p = text; *p; ++p) {
        if (*p < '0' || *p > '9') return false;
        v = v * 10 + (*p - '0');
    }
    if (v == 0) return false;
    *out = v;                   // 通过指针写回
    return true;
}

int main() {
    int n{};
    if (parse_positive("42", &n))
        std::cout << n << '\n';
}
```

### 4. 悬垂引用（反例）

```cpp
int& bad() {
    int local = 1;
    return local;   // 错误：返回局部引用 → 悬垂
}

const std::string& also_bad() {
    return std::string("tmp"); // 危险：临时在完整表达式结束后销毁
}
```

正确做法：按值返回（RVO/移动），或确保所指对象生命周期覆盖使用期。

### 5. `std::optional` 替代可空指针

```cpp
#include <optional>
#include <string>
#include <iostream>

std::optional<std::string> title_for(int id) {
    if (id == 1) return "Intro";
    return std::nullopt;
}

int main() {
    if (auto t = title_for(1)) {
        std::cout << *t << '\n';
        std::cout << t->size() << '\n';
    }
    std::cout << title_for(9).value_or("(none)") << '\n';
}
```

### 6. 指针算术直觉（数组遍历）

```cpp
#include <iostream>

int main() {
    int a[]{10, 20, 30};
    for (int* p = a; p != a + 3; ++p)
        std::cout << *p << ' ';
}
```

更现代的写法是 `std::array` / `std::span` / 范围 for（见 [第 16–17 章](./ch16-17-arrays.md)），指针算术应限于底层或与迭代器等价的场景。

## 易错与陷阱

1. **未初始化指针 / 野指针**：局部 `int* p;` 是垃圾地址；使用前必须赋 `&obj`、`nullptr` 或有效堆地址。
2. **解引用 `nullptr`**：UB；任何按址 API 先判空或用引用/optional 表达“必有/可无”。
3. **返回局部引用或指针**：函数返回后栈帧销毁 → 悬垂；这是引用章节最高频实战 bug。
4. **`const` 放错位置**：`const int*` 与 `int* const` 含义完全不同；写错会导致意外可写或无法改绑。
5. **非 const 引用不能绑临时**：`void f(std::string&); f("hi");` 非法；应改为 `const std::string&` 或按值。
6. **引用“不能为空”的误解**：语言上引用应始终绑定有效对象；但可通过解引用空指针制造非法引用（UB），不要这么做。
7. **指针算术越界**：`p + n` 仅对数组（及 past-the-end）有定义；对单个对象乱加偏移是 UB。
8. **用指针表示可选时所有权不清**：谁释放？是否共享？优先 `optional`、引用或智能指针（[ch22](./ch22-move-smart-pointers.md)、[RAII](../raii-and-ownership.md)）。
9. **`optional::value()` 无值时抛异常**；`operator*` 无值时是 UB——选对检查方式。
10. **`auto` 丢引用**：`auto x = get_ref();` 可能变成拷贝；需要别名时写 `auto&` / `const auto&`。

## 练习指引

- 手写：用引用实现 `swap`；再用指针实现一遍，对比调用语法。
- 设计一个查找函数：分别用“返回指针（找不到为 `nullptr`）”和“返回 `std::optional`”两种接口，比较可读性与安全性。
- 故意写一个返回局部引用的函数，在调试器中观察崩溃/乱值，加深悬垂印象（仅作实验，勿留在正式代码）。
- 列出四种 `const`/指针组合，各写一句合法与一句非法赋值。
- 阅读 learncpp.cn 第 12 章课后题：重点做“按引用修改”“const 正确性”“何时用指针”类题目。
- 预习：[类成员若返回内部缓冲的引用](./ch14-15-classes.md) 有何生命周期风险；动态分配为何不应裸奔（[ch18–19](./ch18-19-iterators-dynamic.md)）。

## 小结

- 引用 = 必须初始化的别名；指针 = 可空、可改绑的地址对象。
- 大对象只读传 `const T&`；可选无值优先 `std::optional` 或明确约定的指针。
- `const` 修饰所指还是指针本身，必须读准；悬垂引用/指针是本章核心雷区。
- 指针算术仅作数组/迭代底层认知；日常遍历交给容器、范围 for 与后续迭代器章节。
- 所有权与生命周期：本章打基础，系统方案见智能指针、RAII 与移动语义相关章节。
