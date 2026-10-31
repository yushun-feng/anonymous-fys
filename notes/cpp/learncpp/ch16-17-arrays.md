---
title: 第 16–17 章：vector 与 array
tags: [cpp, learncpp, vector, array]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 16–17 章：vector 与 array

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 16–17 章
> 对照笔记：[Cherno 数组与字符串](../cherno/06-arrays-strings.md)、[拷贝与 vector](../cherno/10-copy-vector.md)。

## 小节地图

**第 16 章**：容器与序列入门 → `std::vector` 基础 → 长度、下标与无符号/`ssize` 问题 → 传参/返回与移动引言 → 循环与范围 for → 枚举下标 → `size` / `capacity` / `resize` / `reserve` → 栈式 `push_back`/`pop_back` → `vector<bool>` 特例。

**第 17 章**：`std::array` → 传参与返回 → 引用包装与 `std::span` 意识 → 与枚举配合 → C 风格数组与数组到指针退化 → 指针算术回顾 → C 字符串注意点 → 多维数组概览。

算法与迭代器系统化见 [第 18–19 章](./ch18-19-iterators-dynamic.md)。

## 核心概念

### 为何用标准数组容器

- C 数组：固定长度、易退化成指针、不知自身长度、不能按值传递。
- **`std::vector<T>`**：动态大小、连续内存、RAII 管理堆缓冲，是默认序列容器。
- **`std::array<T, N>`**：固定长度、连续内存、值语义、保留长度信息，替代多数 C 数组场景。
- **`std::span<T>`**（C++20，意识层）：不拥有元素的连续视图，函数形参可统一接受 vector / array / C 数组切片。

### `std::vector` 心智模型

- 三个量：**size**（元素个数）、**capacity**（已分配可容纳个数）、数据指针。
- `push_back` 可能触发扩容：分配更大缓冲 → 搬迁/移动旧元素 → 释放旧缓冲；**迭代器/引用/指针可能失效**。
- `reserve(n)` 预分配，减少扩容次数；`resize(n)` 改变 size（多默认插入、少销毁尾部）。
- 随机访问 `O(1)`：`v[i]`、`v.at(i)`（`at` 越界抛异常）。

### 下标与有符号 / 无符号

- `size()` 返回 `size_type`（通常 `std::size_t`，无符号）。
- 与无符号比较时，`i < v.size() - 1` 在 `size()==0` 时会下溢成巨大数——经典坑。
- 现代写法：C++20 `std::ssize(v)` 得有符号长度；或用范围 for / 迭代器避免手写下标。
- 下标类型与枚举：可用 `enum class` 作下标需先 `static_cast`，或保持 `size_t`。

### 传参、返回与移动引言

- 只读：`const std::vector<T>&`；要修改：`std::vector<T>&`；需要拷贝才按值。
- 返回 `vector` 按值通常高效（RVO / 移动）；不要为了“性能”返回指针裸缓冲。
- 大容器赋值可能昂贵；移动赋值窃取缓冲（第 22 章展开）。

### 范围 for

```cpp
for (const auto& e : v) { /* 只读 */ }
for (auto& e : v) { e *= 2; }
for (auto e : v) { /* 拷贝每个元素——大对象勿用 */ }
```

注意：范围 for 的底层是迭代器；在循环中 `push_back` 导致扩容会使迭代器失效 → UB。

### `vector<bool>` 特例

- 标准允许空间优化（位打包），`operator[]` 返回的不是普通 `bool&`。
- 许多通用模板与 `auto&` 期望会踩坑；若需可寻址布尔序列，用 `vector<char>` / `deque<bool>` 等替代。

### `std::array<T, N>`

- 长度是**模板参数**，编译期常量；可放栈上（若 `N` 与 `T` 不太大）。
- 支持 `size()`、`at`、迭代器、与 C 数组类似的连续布局：`data()` 得 `T*`。
- 可按值传递/返回（小心过大）；比较运算符按字典序（若元素可比较）。
- 与 `vector` 选择：长度固定 → `array`；运行期才知长度或频繁变长 → `vector`。

### C 数组与退化（decay）

```cpp
void f(int a[]);     // 实际是 int*
void g(int* a);
void h(int (&a)[10]); // 引用真正的数组类型，保留长度
```

- 数组名在多数表达式中退化为指向首元素的指针，**丢失长度**。
- `sizeof(a)` 在函数参数里得到的是指针大小，不是数组字节数。
- 多维数组：`int m[2][3];` —— 连续存储，行主序；传参易再退化成 `int(*)[3]`。
- C 字符串：`char s[] = "hi";` 以 `'\0'` 结尾；与 `std::string` / `string_view` 相比易越界、易忘记结束符。

### 算法入门（配合数组容器）

```cpp
#include <algorithm>
std::sort(v.begin(), v.end());
auto it = std::find(v.begin(), v.end(), 42);
bool ok = std::all_of(a.begin(), a.end(), [](int x){ return x > 0; });
```

半开区间 `[begin, end)`；细节与迭代器类别见第 18 章。

## 语法与 API

```cpp
#include <vector>
#include <array>
#include <iostream>
// #include <span>   // C++20

// vector
std::vector<int> v;                // 空
std::vector<int> v2(5);            // 5 个 0
std::vector<int> v3{1, 2, 3};      // 列表初始化
v3.push_back(4);
v3.pop_back();
v3.reserve(100);
v3.resize(10);
std::size_t n = v3.size();
int* raw = v3.data();

// array
std::array<int, 3> a{1, 2, 3};
std::array<int, 3> b = a;          // 拷贝整块
for (int x : a) std::cout << x << ' ';

// C 数组
int c[]{1, 2, 3};
int* p = c;                        // 退化
// std::span<int> sp{c};           // C++20 视图
```

安全遍历长度：

```cpp
for (std::size_t i = 0; i < v.size(); ++i)
    use(v[i]);

// C++20
// for (std::ptrdiff_t i = 0; i < std::ssize(v); ++i)
```

## 示例

### 1. vector 作为动态列表

```cpp
#include <vector>
#include <iostream>
#include <string>

int main() {
    std::vector<std::string> names;
    names.reserve(3);
    names.push_back("Ada");
    names.push_back("Grace");
    names.emplace_back("Edsger");   // 原地构造

    for (const auto& n : names)
        std::cout << n << '\n';

    std::cout << "size=" << names.size()
              << " cap=" << names.capacity() << '\n';
}
```

### 2. 下标无符号陷阱

```cpp
#include <vector>
#include <iostream>

void print_pairs(const std::vector<int>& v) {
    // 错误示范：size()==0 时 v.size()-1 下溢
    // for (std::size_t i = 0; i < v.size() - 1; ++i)

    if (v.size() < 2) return;
    for (std::size_t i = 0; i + 1 < v.size(); ++i)
        std::cout << v[i] << ',' << v[i + 1] << '\n';
}
```

### 3. 函数接受只读序列：const 引用 vs span 意识

```cpp
#include <vector>
#include <array>
#include <iostream>

int sum(const std::vector<int>& v) {
    int s = 0;
    for (int x : v) s += x;
    return s;
}

// C++20 更通用：
// int sum(std::span<const int> s);

int main() {
    std::vector<int> v{1, 2, 3};
    std::cout << sum(v) << '\n';
}
```

### 4. `std::array` 与编译期长度

```cpp
#include <array>
#include <algorithm>
#include <iostream>

template <std::size_t N>
void sort_inplace(std::array<int, N>& a) {
    std::sort(a.begin(), a.end());
}

int main() {
    std::array<int, 4> a{4, 1, 3, 2};
    sort_inplace(a);
    for (int x : a) std::cout << x << ' ';
}
```

### 5. C 数组退化丢长度

```cpp
#include <iostream>

void wrong(int a[]) {
    // sizeof(a) == sizeof(int*) —— 不是元素字节数
    std::cout << sizeof(a) << '\n';
}

void right(int (&a)[3]) {
    std::cout << sizeof(a) / sizeof(a[0]) << '\n'; // 3
}

template <std::size_t N>
void also_right(int (&a)[N]) {
    std::cout << N << '\n';
}

int main() {
    int a[3]{1, 2, 3};
    wrong(a);
    right(a);
    also_right(a);
}
```

### 6. 枚举与数组下标

```cpp
#include <array>
#include <iostream>

enum class Color { red, green, blue, count_ };

int main() {
    std::array<int, static_cast<std::size_t>(Color::count_)> stock{};
    stock[static_cast<std::size_t>(Color::red)] = 5;
    std::cout << stock[0] << '\n';
}
```

### 7. 简单算法：计数与查找

```cpp
#include <vector>
#include <algorithm>
#include <iostream>

int main() {
    std::vector<int> v{1, 5, 3, 5, 9};
    std::cout << std::count(v.begin(), v.end(), 5) << '\n';

    if (auto it = std::find(v.begin(), v.end(), 3); it != v.end())
        std::cout << "index=" << (it - v.begin()) << '\n';
}
```

### 8. 多维：vector 的向量 vs array

```cpp
#include <vector>
#include <array>

// 动态矩阵
std::vector<std::vector<int>> mat(3, std::vector<int>(4, 0));

// 固定 2x3
std::array<std::array<int, 3>, 2> fixed{};
```

不规则（锯齿）用 `vector<vector<T>>`；规则稠密矩阵更常考虑一维 `vector` + 手算下标 `i*cols+j`，缓存友好。

## 易错与陷阱

1. **`v[v.size()]` 越界**；宁可用 `at` 调试，或断言 `i < size()`。
2. **无符号下溢**：`size() - 1`、逆向 `for (size_t i = n-1; i >= 0; --i)` 永不结束。
3. **遍历时扩容**：范围 for / 迭代器遍历中 `push_back` 导致失效。
4. **`vector<bool>` 与 `auto& x = vb[i];`**：无法绑定到真正的 `bool&`。
5. **列表初始化歧义**：`vector<int> v{5};` 是一个元素 5；`vector<int> v(5);` 是五个 0。
6. **把 C 数组当按值参数**：实际是指针，长度丢失；`sizeof` 骗人。
7. **返回局部 C 数组指针**：悬垂；返回 `array`/`vector` 按值。
8. **巨大 `std::array` 放栈**：可能栈溢出；大块用 `vector` 或堆。
9. **`data()` 在空 `vector` 上**：可返回非空或空指针（实现定义前注意别解引用）；先保证 `size()>0`。
10. **C 字符串缓冲区**：忘记 `'\0'`、`strcpy` 越界——现代代码优先 `std::string`。
11. **误以为 `capacity` 缩小会释放内存**：`resize` 变小通常不降 capacity；可用 `shrink_to_fit`（非绑定请求）。
12. **对 `const vector` 调用非 const 接口**或丢失 const 传递。

## 练习指引

- 实现：读入未知个数整数（直到 EOF），存 `vector`，打印平均值与最大值。
- 对比 `vector{5}` 与 `vector(5)`，写注释说明差异。
- 用 `std::array<int,N>` 实现编译期长度的平均值函数模板。
- 写一个接受 `const vector<int>&` 的查找函数，再用迭代器版本改写（为第 18 章铺路）。
- 故意在范围 for 里 `push_back`，在 sanitizer 下观察问题（实验后改掉）。
- 把一段 C 数组 API 改成 `std::array` 或 `vector`，记录长度安全上的收益。
- 对照 [Cherno 数组与字符串](../cherno/06-arrays-strings.md)、[拷贝与 vector](../cherno/10-copy-vector.md) 补“深拷贝 vs 缓冲共享”直觉。

## 小结

- 日常动态序列首选 `std::vector`；固定长度首选 `std::array`；C 数组仅留在底层/互操作。
- 牢记 size/capacity、扩容失效、无符号下标陷阱与 `vector<bool>` 特例。
- 传参用 `const&`；返回容器按值；C++20 起函数接口可考虑 `span`。
- 范围 for + `<algorithm>` 覆盖大部分遍历与查询；迭代器细节见下一章组。
- 多维与 C 字符串是易错区：优先标准容器与 `std::string`。
