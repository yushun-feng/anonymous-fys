---
title: 第 20 章：函数进阶
tags: [cpp, learncpp, cherno, lambda, functions]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 20 章：函数进阶

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 20 章  
> Cherno 要点已融入下文「Cherno 视角补充」；剧集索引：[auto/函数指针/lambda](../cherno/12-fp-lambdas-namespaces.md)、[栈堆](../cherno/07-const-objects-memory.md)。

## 章节地图

本章把「函数」从简单调用提升到可传递、可回调、可匿名组合的一等工具：

| 主题 | 要点 |
|------|------|
| 函数指针 | 把函数当地址传递；类型签名必须匹配 |
| 栈与堆回顾 | 递归深度、局部对象生命周期与堆分配的关系 |
| 递归 | 基例 + 递推；尾递归直觉；栈溢出风险 |
| 命令行参数 | `argc` / `argv`；程序入口约定 |
| 省略号 `...` | C 风格可变参；现代 C++ 应避免 |
| Lambda | 匿名函数对象、捕获、`mutable`、泛型 lambda |
| `std::function` | 类型擦除的可调用包装（简述） |
| 尾置返回类型 | `auto f(...) -> T`；与复杂返回类型、lambda |

## 核心概念

### 1. 函数指针

函数名在多数表达式中会**衰减**为指向该函数的指针。函数指针类型包含完整签名（返回类型与参数类型）：

```cpp
int add(int a, int b) { return a + b; }

int (*fp)(int, int) = add;   // 或 &add
int x = fp(2, 3);            // 调用：等价于 (*fp)(2, 3)
```

用类型别名可读性更好（C++11）：

```cpp
using BinOp = int (*)(int, int);
BinOp op = add;
```

常见用途：回调、策略表、插件式分发。函数指针**不能**指向非静态成员函数（成员函数需要对象）；成员函数指针语法不同，且与普通函数指针不兼容。

### 2. 作为参数与返回值

```cpp
void apply(int a, int b, int (*op)(int, int)) {
  std::cout << op(a, b) << '\n';
}

BinOp pick(char c) {
  return (c == '+') ? add : [](int a, int b) { return a - b; }; // 见 lambda
}
```

签名稍有不匹配（例如 `const int` vs `int`、引用 vs 值）就会导致无法赋值或调用错误——编译器在这里很严格。

### 3. 递归

递归函数调用自身，必须有**终止条件（基例）**，否则无限递归直至栈溢出。

```cpp
int factorial(int n) {
  if (n <= 1) return 1;          // 基例
  return n * factorial(n - 1);   // 递推
}
```

- **直接递归**：函数调用自己。  
- **间接递归**：A 调 B，B 再调 A。  
- 深度过大时优先改迭代或显式栈，避免默认栈耗尽。  
- 分治（如二分查找、归并思想）天然适合递归表达。

### 4. 命令行参数

```cpp
int main(int argc, char* argv[]) {
  // argv[0] 通常是程序名；argv[1]..argv[argc-1] 是用户参数
  for (int i = 0; i < argc; ++i) {
    std::cout << argv[i] << '\n';
  }
}
```

`argv[argc]` 保证为 `nullptr`。处理路径与 Unicode 时注意平台差异；需要安全解析时可用 `std::string_view` 包装 `argv[i]`。

### 5. 省略号（应避免）

`<cstdarg>` 的 `va_list` 可变参没有类型安全，易踩 UB。现代替代：

- 函数重载 / 默认实参  
- 可变参数模板 `template<typename... Args>`  
- `std::initializer_list`  
- 折叠表达式（C++17）

学习时知道历史存在即可，新代码不要用。

### 6. Lambda 表达式

Lambda 是可调用的**闭包类型**的语法糖，本质是编译器生成的匿名类（带 `operator()`）。

```cpp
auto add = [](int a, int b) { return a + b; };
int s = add(1, 2);
```

**捕获子句**决定如何把外围变量带进闭包：

| 写法 | 含义 |
|------|------|
| `[]` | 不捕获 |
| `[=]` | 按值捕获所用到的自动变量 |
| `[&]` | 按引用捕获 |
| `[x, &y]` | 混合：`x` 值，`y` 引用 |
| `[=, &y]` | 默认按值，例外按引用 |
| `[this]` / `[*this]` | 捕获当前对象指针 / C++17 按值拷贝 `*this` |

注意：

- 按引用捕获的变量，闭包寿命**不得超过**被引用对象。返回捕获局部引用的 lambda 是典型悬空。  
- 默认捕获 `[=]`/`[&]` 方便但易无意捕获过多；生产代码偏好显式捕获列表。  
- `mutable` 允许修改按值捕获的副本：`[n]() mutable { ++n; }`。  
- C++14 **泛型 lambda**：`[](auto x, auto y){ return x + y; }`。  
- C++20 可写模板形参：`[]<typename T>(T x){ ... }`。

Lambda 可隐式转换为**签名匹配且无捕获**的函数指针；有捕获则不能转函数指针，需用 `std::function` 或模板参数接受可调用对象。

### 7. `std::function`（简述）

```cpp
#include <functional>

std::function<int(int, int)> f = add;
f = [](int a, int b) { return a * b; };
```

`std::function` 做类型擦除，可存放函数指针、lambda、绑定表达式等，代价是可能堆分配与间接调用。热路径上优先：

- 模板：`template<class F> void apply(F&& f);`  
- 或具体函数指针类型  

仅在需要「运行时换实现 / 异构存储」时用 `std::function`。

### 8. 尾置返回类型

```cpp
auto max_val(int a, int b) -> int {
  return (a > b) ? a : b;
}

template<typename T, typename U>
auto add_any(T a, U b) -> decltype(a + b) {
  return a + b;
}
```

C++14 起多数情况可直接 `auto` 推导返回类型；尾置形式在返回类型依赖形参、或写出嵌套类型时仍很有用。Lambda 也可：`[](int x) -> double { return x * 0.5; }`。

## 语法与 API 速查

```cpp
// 函数指针
using Fn = void(*)(int);
void call(Fn f, int x) { f(x); }

// Lambda + 算法
#include <algorithm>
#include <vector>
std::vector<int> v{3,1,4};
std::sort(v.begin(), v.end(), [](int a, int b){ return a > b; });

// std::function
std::function<void()> cb = []{ /* ... */ };
cb();
```

与 STL 算法配合时，lambda 是首选谓词/变换器；比手写函数指针更短、可捕获上下文。

## 综合示例

```cpp
#include <iostream>
#include <functional>
#include <vector>
#include <numeric>

int square(int x) { return x * x; }

int main() {
  // 1) 函数指针表
  int (*ops[])(int) = { square, [](int x){ return x + 1; } };
  std::cout << ops[0](5) << ' ' << ops[1](5) << '\n'; // 25 6

  // 2) 递归：斐波那契（演示用；大 n 应改迭代/DP）
  std::function<long long(int)> fib = [&](int n) -> long long {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  };
  std::cout << fib(10) << '\n';

  // 3) 显式捕获 + 算法
  int offset = 10;
  std::vector<int> data{1, 2, 3};
  std::transform(data.begin(), data.end(), data.begin(),
                 [offset](int v){ return v + offset; });

  // 4) 命令行风格：把「策略」当参数
  auto reduce = [](const std::vector<int>& xs, auto bin) {
    return std::accumulate(xs.begin() + 1, xs.end(), xs.front(), bin);
  };
  std::cout << reduce(data, [](int a, int b){ return a * b; }) << '\n';
}
```

## 易错与陷阱

1. **函数指针签名漂移**：多一个 `const`、少一个引用都会编译失败；用 `using` 统一签名。  
2. **把局部函数当地址返回**：C++ 不支持嵌套命名函数；返回悬空指针是 UB。Lambda 按引用捕获局部变量后逃逸同理。  
3. **递归无基例 / 基例写错**：经典死递归；调试时看调用栈深度。  
4. **`[=]` 捕获指针**：按值拷的是指针值，不是所指对象；对象仍可能被外部释放。  
5. **在循环里 `[&]` 捕获循环变量并异步执行**：所有回调可能看到最终值；按值捕获当前值 `[i]`。  
6. **省略号 + 错误类型**：`va_arg` 类型不对即 UB，无编译期检查。  
7. **`std::function` 空对象调用**：默认构造的 `std::function` 调用会抛 `std::bad_function_call`。  
8. **成员函数当回调**：需要 `std::bind` / lambda 包一层，或使用 `std::mem_fn`；不能直接赋给普通函数指针。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。函数指针、`std::function`、lambda 在 Cherno 后期是「把行为当数据传」的工具箱；代价是类型擦除或堆分配可能潜入热路径。

### 函数指针：最薄的回调

```cpp
using TickFn = void (*)(int dtMs);

void tickPhysics(int dtMs) { /* … */ }

void runLoop(TickFn fn)
{
    fn(16);
}

int main() { runLoop(tickPhysics); }
```

适合 C API、无捕获的简单回调。一有状态要带，就转向 lambda 或绑定对象。

### Lambda：就地策略对象

```cpp
#include <algorithm>
#include <vector>

void retainPositive(std::vector<int>& xs)
{
    xs.erase(std::remove_if(xs.begin(), xs.end(),
                            [](int v) { return v <= 0; }),
             xs.end());
}
```

捕获默认宁可写清 `[=]` / `[&]` / 显式名单；悬垂捕获（按引用抓住即将销毁的局部）与返回局部 lambda 引用捕获同级危险。需要存异种可调用包装时用 `std::function`，但要意识到可能的分配与间接调用成本。

### 与栈/堆章节的交接

大对象默认别按值塞进频繁回调；`const&` 或视图类型更合适。正文对照 Cherno 的 `auto`/lambda 笔记即可——补充口径：**回调接口先问频率与是否在热路径**，再选函数指针 / lambda / `function`。

## 练习指引

对照 learncpp.cn 第 20 章练习，建议自测：

1. 写一个接受函数指针的「计算器」，支持 `+ - * /`。  
2. 用递归与迭代各写一遍「数字各位之和」，比较栈使用。  
3. 解析 `argc`/`argv`：若存在 `--verbose` 则打印额外日志。  
4. 用 lambda 自定义 `std::sort` 规则（按绝对值、按字符串长度等）。  
5. 写一个会**悬空**的按引用捕获示例并改成安全的按值捕获（理解寿命）。  
6. 尝试把有捕获的 lambda 赋给函数指针——观察编译错误，再用 `std::function` 包装。

## 小结

- 函数指针让行为可传递，但签名死板、不能带状态。  
- Lambda 是现代 C++ 写回调与算法谓词的默认工具；管好捕获与寿命。  
- 递归表达力强，注意基例与深度。  
- 可变参省略号留给遗产代码；新设计用模板或 `initializer_list`。  
- `std::function` 灵活但非零开销；能模板就模板。  
- 尾置返回类型在复杂推导场景下仍有价值。

下一章：[第 21 章 运算符重载](./ch21-operator-overloading.md)。
