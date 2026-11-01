---
title: 选修：位运算与 constexpr 函数
tags: [cpp, learncpp, bitset, constexpr, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 选修：位运算与 constexpr 函数

> 学习材料：[learncpp.cn](https://learncpp.cn/) 章 O（Bit Manipulation）、章 F（Constexpr functions）
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 章节地图

| 部分 | 要点 |
|------|------|
| O 位运算 | AND/OR/XOR/NOT、移位、掩码、`std::bitset` |
| F constexpr 函数 | 编译期求值条件、限制演变、与 `consteval`/`constinit` |

---

# 章 O：位运算

## 核心概念

位运算直接操作整数的二进制表示，常见于标志位、嵌入式、哈希、压缩与协议解析。

### 基本运算符

| 运算 | 符号 | 含义（按位） |
|------|------|----------------|
| 与 | `&` | 两位都 1 才为 1 |
| 或 | `\|` | 有一位 1 则为 1 |
| 异或 | `^` | 两位不同为 1 |
| 取反 | `~` | 0↔1（注意提升与符号） |
| 左移 | `<<` | 乘以 2ⁿ 的直觉（注意溢出/符号） |
| 右移 | `>>` | 逻辑或算术右移（实现/标准相关，优先无符号类型） |

复合赋值：`&=`、`|=`、`^=`、`<<=`、`>>=`。

**不要**把移位与 iostream 的 `<<`/`>>` 在含重载的表达式里混用到令人困惑的程度；位运算两侧应是整数表达式。

### 掩码技巧

```cpp
#include <cstdint>

// 置位、清位、切换、测试
void set_bit  (std::uint32_t& x, unsigned i) { x |=  (1u << i); }
void clear_bit(std::uint32_t& x, unsigned i) { x &= ~(1u << i); }
void toggle   (std::uint32_t& x, unsigned i) { x ^=  (1u << i); }
bool test_bit (std::uint32_t  x, unsigned i) { return (x & (1u << i)) != 0; }

// 取低 8 位
std::uint32_t low8(std::uint32_t x) { return x & 0xFFu; }

// 把 [hi,lo] 字段拼进去
std::uint32_t pack(std::uint8_t a, std::uint8_t b) {
  return (std::uint32_t{a} << 8) | b;
}
```

优先 `unsigned` / `std::uint32_t` 等，避免有符号右移与左移进符号位触发未定义行为。

### `std::bitset`

```cpp
#include <bitset>
#include <iostream>

std::bitset<8> flags{"00010101"};
flags.set(1);
flags.reset(2);
flags.flip(0);
std::cout << flags << ' ' << flags.count() << '\n';
std::cout << flags.test(0) << '\n';
```

- 长度是模板参数，编译期固定。  
- 提供 `to_ulong` / `to_ullong` / `to_string`。  
- 适合教学与固定宽度标志；动态位集可用 `vector<bool>`（有代理陷阱）或专门库 / `std::vector<std::uint64_t>` 手写。

### 常见应用

- **标志枚举**：`enum class Perm : unsigned { Read = 1, Write = 2, Exec = 4 };` 再重载 `|`/`&`（或用 `std::bitset`）。  
- **对齐**：`(x + mask) & ~mask`。  
- **判断 2 的幂**：`x && !(x & (x - 1))`（无符号）。  
- **交换（教学）**：`a ^= b; b ^= a; a ^= b;`——实际用 `std::swap`。

## 示例

```cpp
#include <bitset>
#include <cstdint>
#include <iostream>

std::uint8_t average_byte(std::uint8_t a, std::uint8_t b) {
  // 防溢出的均值（位技巧示例）
  return (a & b) + ((a ^ b) >> 1);
}

int main() {
  std::uint32_t perms = 0;
  set_bit(perms, 0); // READ
  set_bit(perms, 2); // EXEC
  std::cout << std::bitset<8>(perms) << '\n';
  std::cout << int(average_byte(200, 100)) << '\n';
}
```

## 易错与陷阱（位运算）

1. **有符号移位 UB / 实现定义**：左移进入符号位、负数右移——改用无符号。  
2. **`1 << 31` 在 32 位 `int` 上的问题**：写 `1u << 31` 或 `1ull << n`。  
3. **移位量 ≥ 宽度**：UB；先检查 `i < 32`。  
4. **`~` 后赋给窄类型**：整型提升导致高位全 1，需再掩码。  
5. **用移位做算术却遇到溢出**。  
6. **`vector<bool>` 的 `operator[]` 返回代理**，不能当真正的 `bool&`。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 [位域那些事](https://github.com/Light-City/CPlusPlusThings/tree/master/basic_content/bit) 与 constexpr 相关现代特性对照。

### 位域

```cpp
struct Flags {
    unsigned ready : 1;
    unsigned mode  : 3;
    unsigned       : 4; // 未命名填充
};
```

- 省空间、方便抽整型里的字段；**布局与符号位行为依赖实现**，跨 ABI 勿依赖。
- 不能对位域取地址；指针/引用不能绑到位域。
- 赋值勿超出宽度；需要可移植比特操作时，更常用掩码 + 移位（正文位运算节）。

### `constexpr` 对照

编译期可算的用 `constexpr` 函数/变量表达；`const` 只保证「不改」，不保证「编译期值」。需要常量表达式语境（数组长度、模板实参、`static_assert`）时认准 `constexpr`。

## 练习指引（O）

1. 实现 8 位旋转：`rotl` / `rotr`。  
2. 用掩码提取颜色 `0xRRGGBB` 的三个通道。  
3. 统计二进制中 1 的个数（Kernighan：`n &= n - 1` 循环）。  
4. 用 `bitset<16>` 模拟简单权限系统。

---

# 章 F：constexpr 函数

## 核心概念

`constexpr` 函数可在**常量表达式**语境下于编译期求值，也可在运行期当普通函数调用。

```cpp
constexpr int square(int x) { return x * x; }

constexpr int a = square(4);   // 编译期
int b = square(a);             // 可运行期
int x; std::cin >> x;
int c = square(x);             // 运行期
```

### 要求与演变（实用摘要）

- C++11：几乎只能单条 `return`，限制严。  
- C++14：允许多语句、局部变量、循环。  
- C++17/20：逐步放开，支持更多库设施；C++20 有 `consteval`（必须编译期）、`constinit`（必须常量初始化）。  

`constexpr` 函数参数仍是普通参数；是否编译期求值取决于**调用语境与实参是否为常量表达式**。

```cpp
constexpr int sum(int n) {
  int s = 0;
  for (int i = 1; i <= n; ++i) s += i;
  return s;
}

constexpr int s = sum(100);          // OK
std::array<int, sum(4)> arr{};       // 数组长度需常量表达式
```

### 与 `const`、模板、字面量类型

- 字面量类型（literal type）才能作为编译期对象：标量、有 constexpr 构造/析构约束的类等。  
- `constexpr` 构造函数使自定义类型可出现在常量语境。  
- 模板元编程许多场景可被 `constexpr` 函数替代，可读性通常更好。

```cpp
struct Point {
  int x, y;
  constexpr Point(int x, int y) : x(x), y(y) {}
  constexpr int manhatten() const { return (x < 0 ? -x : x) + (y < 0 ? -y : y); }
};

constexpr Point p{3, -4};
static_assert(p.manhatten() == 7);
```

### `consteval` / `constinit`（简述）

```cpp
consteval int require_ce(int x) { return x + 1; } // 只能编译期
constinit int g = require_ce(1);                  // 强制常量初始化，非 const
```

教学阶段掌握「`constexpr` 能编则编，否则跑」即可；需要强制编译期时再用 `consteval`。

## 示例：编译期查表

```cpp
#include <array>
#include <cstddef>

constexpr std::array<int, 10> make_squares() {
  std::array<int, 10> a{};
  for (std::size_t i = 0; i < a.size(); ++i) {
    a[i] = static_cast<int>(i * i);
  }
  return a;
}

constexpr auto kSquares = make_squares();
static_assert(kSquares[5] == 25);
```

## 易错与陷阱（constexpr）

1. 在必须是常量表达式的地方传入运行期值 → 编译错误。  
2. C++11 思维写多语句 `constexpr` 却用旧标准编译。  
3. 误以为 `constexpr` 函数「一定」在编译期执行（只在常量语境才保证）。  
4. `constexpr` 分配堆内存受标准版本限制（C++20 起有限支持，且结果不能泄漏到运行期随意用）。  
5. 与 UB 相遇：常量求值中若出现 UB，程序非良构。

## 练习指引（F）

1. 写 `constexpr` 阶乘与 `static_assert`。  
2. 编译期计算字符串字面量长度（注意别衰减成指针）。  
3. 实现 `constexpr` 最大公约数，用于 `std::array` 大小相关练习。  
4. 对比同一函数在常量语境与运行期调用的写法。

## 小结

- 位运算：无符号 + 掩码 + 明确移位宽度；`bitset` 适合固定宽度标志。  
- `constexpr`：让纯计算进入编译期，强化类型与性能；按标准版本了解能力边界。  
- 两者都常与嵌入式、底层接口、高性能代码相遇，但可读性优先——别为了炫技堆位运算。

相关：[第 6 章 运算符](./ch06-operators.md) · [第 5 章 常量](./ch05-constants-strings.md) · [附录](./appendix-misc-updates.md)。
