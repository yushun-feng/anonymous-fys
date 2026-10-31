---
title: 第 5 章：常量与字符串
tags: [cpp, learncpp, const, string]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 5 章：常量与字符串

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 5 章

## 小节地图

| 主题 | 要点 |
|------|------|
| 命名常量与 `const` | 不可修改的对象、为何避免魔法数 |
| 字面量与进制 | 十/二/八/十六进制、后缀 |
| as-if 与编译期优化 | 编译器可优化，只要可观测行为不变 |
| 常量表达式 | 编译期可知的值 |
| `constexpr` | 变量（及后文函数）的编译期求值 |
| `std::string` | 拥有型动态字符串 |
| `std::string_view` | 非拥有只读视图（C++17） |
| 两篇 string_view 实践 | 生命周期陷阱、与 `string`/C 字符串交互 |

相关：[第 4 章 基本类型](./ch04-fundamental-types.md) · [第 1 章 字面量](./ch01-basics.md) · [optional constexpr 函数](./optional-bit-constexpr.md) · [第 7 章 全局常量](./ch07-scope-duration-linkage.md)

## 核心概念

### 为什么需要常量

代码中的裸数字/裸字符串（魔法数）难以维护：

```cpp
double area = 3.14159 * r * r;  // π 写死，改精度要全局搜
```

更好：

```cpp
constexpr double pi{3.141592653589793};
double area = pi * r * r;
```

命名常量表达意图，并防止误修改。

### `const`

`const` 限定对象：**初始化之后不可再赋值**。

```cpp
const int max_users{100};
// max_users = 200;  // 错误
```

必须初始化（对普通 `const` 对象）。形参用 `const` 表示函数不修改传入的对象（对传值意义有限，对引用/指针意义重大——第 12 章）。

顶层 `const`（对象本身不可改）与指针/引用的 `const` 资格后续章节细化。

### 字面量与进制

| 写法 | 含义 |
|------|------|
| `42` | 十进制 `int` |
| `0b1010` | 二进制（C++14），值 10 |
| `052` | 八进制，值 42（前导 0，易踩坑！） |
| `0x2A` | 十六进制，值 42 |
| `42u` / `42ul` / `42ll` | 无符号 / unsigned long / long long 等后缀 |
| `3.5f` / `3.5L` | `float` / `long double` |
| `"hello"` | 字符串字面量 |

数字分隔符（C++14）：`1'000'000` 提高可读性。

### as-if 规则（直觉）

只要程序的**可观测行为**不变，编译器可做优化（消除局部变量、在编译期算常量等）。因此「我在调试器里看不到某个变量」不一定是逻辑删了，可能是被优化掉——Debug 用 `-O0`（[第 3 章](./ch03-debugging.md)）。

### 常量表达式与 `constexpr`

**常量表达式**：能在编译期求值的表达式（规则随标准演进）。

`constexpr` 变量必须用常量表达式初始化，并可用于需要编译期常量的语境（数组长度、非类型模板参数、`static_assert` 等）：

```cpp
constexpr int width{80};
constexpr int height{24};
constexpr int cells{width * height};  // 编译期计算
```

与 `const` 对比（简化记忆）：

| | `const` | `constexpr` |
|--|---------|---------------|
| 运行期初始化 | 可以（如用函数返回值初始化 `const int`） | 必须编译期可知 |
| 编译期语境 | 仅当本身已是常量表达式时 | 设计目标就是编译期 |

C++20 起对 `constexpr` 函数能力大幅增强；变量层面本章先扎实掌握。更多见 [optional-bit-constexpr.md](./optional-bit-constexpr.md)。

### `std::string`：拥有字符串

```cpp
#include <string>
std::string s{"hello"};
```

- **拥有**其内容的内存；拷贝会复制内容（深拷贝语义直觉）；销毁时释放。
- 可修改：`append`、`+=`、下标、`clear` 等。
- `size()` / `length()`、`empty()`、`+` 拼接。
- 与 C 风格字符串交互：`s.c_str()` 得到 `const char*`（生命周期跟随 `s`）。

读入一行空白分隔的词：`std::cin >> s;`；读入整行：`std::getline(std::cin, s);`（注意与 `>>` 混用时残留换行问题）。

### `std::string_view`：非拥有只读视图（C++17）

```cpp
#include <string_view>
std::string_view sv{"hello"};  // 指向字面量
```

- **不拥有**字符数据：只保存指针 + 长度（概念上）。
- 轻量、适合只读传递参数，避免无谓拷贝 `std::string`。
- 可从字符串字面量、`std::string`、`const char*` 构造（注意源的生命周期）。
- **不要**在源字符串已销毁后继续使用对应的 `string_view`（悬垂视图）。

经验规则：

- 需要拥有或修改 → `std::string`
- 只读观察且能保证源活着 → `std::string_view`
- 函数返回*新*字符串 → 通常返回 `std::string`（返回局部 `string_view` 指向局部缓冲是典型 bug）

## 语法与 API

### 常量

```cpp
const T name{init};
constexpr T name{constant-expression};
```

### `std::string` 常用

```cpp
std::string s;
std::string t{"text"};
s.size();  s.empty();
s += "x";  s.append("y");
s[i];      s.at(i);     // at 越界抛异常
s.c_str();
std::getline(std::cin, s);
```

### `std::string_view` 常用

```cpp
std::string_view v{"text"};
v.size();  v.empty();  v.data();  // data 不保证空终止，小心当 C 字符串用
v.substr(pos, len);               // 仍是 view，不分配
v.remove_prefix(n);               // 调整视图窗口（view 本身非 const 时）
```

参数传递推荐形态（只读）：

```cpp
void print(std::string_view text);
```

## 示例

### 示例 1：`const` 与魔法数

```cpp
#include <iostream>

int main()
{
    constexpr int days_per_week{7};
    int weeks{3};
    std::cout << weeks * days_per_week << '\n';
}
```

### 示例 2：进制字面量

```cpp
#include <iostream>

int main()
{
    int a{0b1111};   // 15
    int b{0xFF};     // 255
    int c{01'000};   // 八进制 512！不是一千——前导 0
    std::cout << a << ' ' << b << ' ' << c << '\n';
}
```

### 示例 3：`constexpr` 用于数组长度

```cpp
#include <iostream>

int main()
{
    constexpr int n{5};
    int a[n]{};  // 编译期常量长度（C++ 合法；VLA 不是标准 C++）
    a[0] = 1;
    std::cout << a[0] << '\n';
}
```

### 示例 4：`std::string` 基本操作

```cpp
#include <iostream>
#include <string>

int main()
{
    std::string name{};
    std::cout << "First name: ";
    std::cin >> name;

    std::string greeting{"Hello, "};
    greeting += name;
    greeting += '!';

    std::cout << greeting << " (size=" << greeting.size() << ")\n";
}
```

### 示例 5：`getline` 读整行

```cpp
#include <iostream>
#include <string>

int main()
{
    std::string line;
    std::cout << "Enter a full line: ";
    std::getline(std::cin, line);
    std::cout << "You said: " << line << '\n';
}
```

若前面刚用过 `>>`，应先消化行尾换行（例如多余一次 `getline`，或 `std::ws`），否则会读到空行。

### 示例 6：`string_view` 避免拷贝

```cpp
#include <iostream>
#include <string>
#include <string_view>

void show(std::string_view sv)
{
    std::cout << sv << " [" << sv.size() << "]\n";
}

int main()
{
    show("literal");              // 字面量
    std::string s{"owned"};
    show(s);                      // 从 string 查看，不拷贝内容
}
```

### 示例 7：悬垂 `string_view`（反例）

```cpp
#include <string>
#include <string_view>

std::string_view bad()
{
    std::string local{"temp"};
    return local;  // 危险：返回的 view 指向即将销毁的缓冲区
}

// 正确：返回 std::string，把所有权交给调用方
std::string good()
{
    return std::string{"temp"};
}
```

切勿把「返回 `string_view`」当成无代价优化，除非指向静态存储或调用方持有的缓冲区。

### 示例 8：`string_view` 与空终止

```cpp
#include <cstring>
#include <iostream>
#include <string_view>

int main()
{
    char buf[]{'h', 'i'};           // 无 '\0'
    std::string_view sv{buf, 2};
    std::cout << sv << '\n';        // OK：按长度输出
    // std::strlen(sv.data());      // 危险：data() 未必空终止
}
```

## 易错与陷阱

1. **前导 0 的八进制字面量**：`010` 是 8，不是 10。
2. **`const` 未初始化**。
3. **把运行期才知道的值标成 `constexpr`** → 编译失败；改用 `const` 或普通变量。
4. **`string_view` 悬垂**：指向临时 `std::string`、局部数组、已 `clear`/`move` 的字符串。
5. **函数返回局部 `string_view`**。
6. **`sv.data()` 当 C 字符串**：不一定以 `\0` 结尾；需要时用 `std::string{sv}` 再 `c_str()`。
7. **`cin >>` 与 `getline` 混用**吞行。
8. **频繁 `string` 拼接大循环**：可能多次分配；进阶可用 `reserve` 或流（了解即可）。
9. **修改字符串字面量**：`"hi"[0] = 'H';` 非法；字面量在只读存储。应用 `std::string`。
10. **语言标准不足 C++17** 却使用 `string_view`——回到 [第 0 章](./ch00-getting-started.md) 打开 `-std=c++17`。

## 练习指引

- 把已有小程序里的魔法数全部换成命名 `constexpr`/`const`。
- 练习四种进制字面量，并特意识记八进制陷阱。
- 写只接收 `std::string_view` 的打印/统计函数，分别传入字面量与 `std::string`。
- 故意制造并观察悬垂 view（Debug 下可能崩溃或打印垃圾）——然后改成安全写法。
- 完成第 5 章测验：`const`/`constexpr` 选择、`string` 读写、`string_view` 生命周期题。
- 延伸：全局常量如何在多文件共享——预习 [第 7 章](./ch07-scope-duration-linkage.md)。

## 小结

- `const` 防篡改；`constexpr` 把值固定在编译期并启用编译期语境。
- 字面量注意进制与后缀；as-if 解释优化可见性。
- `std::string` 拥有可改的动态文本；`std::string_view` 是轻量只读视图，**生命周期绑定到源数据**。
- 只读参数优先考虑 `string_view`；需要拥有或返回新串时用 `string`。
