---
title: 第 8 章：控制流
tags: [cpp, learncpp, cherno, control-flow]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 8 章：控制流

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 8 章

## 小节地图

`if` / `else` 与常见陷阱、`if` 初始化语句、`if constexpr`、`switch` 与 `[[fallthrough]]`、`goto`（应避免）、`while` / `do-while` / `for` / 范围 for 预习、`break` / `continue`、提前返回、随机数与 `std::mt19937`、停机与死循环诊断。

相关笔记：[第 6 章 运算符](./ch06-operators.md) · [第 7 章 作用域](./ch07-scope-duration-linkage.md) · [第 9 章 错误处理](./ch09-error-handling.md)

## 核心概念

### 控制流是什么

程序默认从上到下顺序执行。控制流语句改变「下一条执行哪句」：分支（选择路径）、循环（重复）、跳转（提前离开）。清晰的控制流比机智的嵌套更重要——复杂度往往来自过多的路径组合。

### 选择：`if` 与 `switch`

`if` 适合条件表达式与区间、复合布尔逻辑。`switch` 适合「整型/枚举离散标签」的多路分支；`case` 标签必须是整型常量表达式。`switch` 默认**穿透**（fallthrough）：匹配后会继续执行后续 `case`，直到 `break`/`return` 等。

### 循环三剑客

| 循环 | 适用场景 |
|------|----------|
| `while` | 条件在前，次数未知 |
| `do-while` | 至少执行一次（菜单、输入校验） |
| `for` | 有初始化 + 条件 + 迭代的计数型循环 |

范围 `for`（`for (auto&& x : container)`）在容器章节会成为主力；本章先熟悉经典 `for`。

### 提前退出（early return / break）

在函数开头处理非法输入并 `return`，可减少深层嵌套（卫语句）。循环中 `break` 结束最内层循环，`continue` 跳到本轮迭代末尾（进入下一次条件判断）。多层循环若需一次跳出，优先重构为函数并用 `return`，而不是 `goto`。

### `goto` 为何不推荐

`goto` 可跳到同一函数内的标签，但会破坏结构化控制流，造成难以分析的路径，并可能跳过对象初始化。唯一偶被讨论的遗留场景是「深层嵌套中统一资源清理」——现代 C++ 用 RAII 与提前返回即可，**学习阶段应避免 `goto`**。

### 随机数：不要用 `rand()`

C 风格 `rand()`/`srand()` 质量差、分布难用、全局状态不友好。C++11 `<random>` 分离三件事：

1. **熵源 / 种子**：`std::random_device`（或固定种子便于复现测试）
2. **引擎**：`std::mt19937`（梅森旋转，常用）
3. **分布**：`std::uniform_int_distribution` 等

## 语法与 API

### `if` 要点

```cpp
if (条件) 语句; else 语句;

// C++17：if 初始化语句——把临时变量收窄到 if/else 作用域
if (std::string line; std::getline(std::cin, line)) {
    // 使用 line
}

// C++17：编译期分支（要求条件为编译期可知）
if constexpr (sizeof(void*) == 8) {
    // 64 位路径；另一分支在实例化时丢弃
}
```

悬空 `else`：`else` 绑定到最近的尚未匹配的 `if`。始终用花括号包住分支，即使只有一句。

### `switch`

```cpp
switch (expr) {
case 1:
    doOne();
    break;
case 2:
    [[fallthrough]];   // 显式标明有意穿透（C++17）
case 3:
    doTwoOrThree();
    break;
default:
    doOther();
    break;
}
```

`case` 后面不能直接定义带初始化的变量后再落到其他标签（跨初始化跳转非法）；需要时在 `case` 内加嵌套块。

### 循环与跳转

```cpp
while (条件) { ... }
do { ... } while (条件);     // 注意末尾分号
for (init; 条件; 迭代) { ... }

break;       // 离开最内层循环或 switch
continue;    // 结束本轮循环体
return 值;   // 离开函数
```

### `<random>` 基本用法

```cpp
#include <random>

std::random_device rd;
std::mt19937 gen{rd()};
std::uniform_int_distribution<int> dist(1, 6);
int dice = dist(gen);
```

引擎对象应尽量复用（例如函数内 `static` 或作为状态持有），不要每次掷骰子都重新构造并播种——既慢，也可能因同一秒内相同种子导致序列雷同（尤其用 `time(nullptr)` 播种时）。

## 示例

### 卫语句与嵌套对比

```cpp
#include <iostream>
#include <string_view>

// 深层嵌套：难读
void handleNested(bool ok, bool ready) {
    if (ok) {
        if (ready) {
            std::cout << "run\n";
        }
    }
}

// 提前返回：扁平
void handleFlat(bool ok, bool ready) {
    if (!ok) return;
    if (!ready) return;
    std::cout << "run\n";
}
```

### `switch` 与枚举

```cpp
enum class Color { Red, Green, Blue };

const char* toString(Color c) {
    switch (c) {
    case Color::Red:   return "red";
    case Color::Green: return "green";
    case Color::Blue:  return "blue";
    }
    return "unknown";  // 若开启枚举穷尽告警，可不写 default 以便漏 case 时告警
}
```

### `for` / `while` / `do-while`

```cpp
#include <iostream>
#include <string>

int main() {
    for (int i = 0; i < 3; ++i) {
        std::cout << i << ' ';
    }
    std::cout << '\n';

    int n = 3;
    while (n > 0) {
        std::cout << n-- << ' ';
    }
    std::cout << '\n';

    std::string cmd;
    do {
        std::cout << "cmd> ";
        std::cin >> cmd;
    } while (cmd != "quit");
}
```

### `break` / `continue`

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{1, -1, 2, -2, 3};
    for (int x : v) {
        if (x < 0) continue;          // 跳过负数
        if (x > 2) break;             // 遇到大于 2 结束
        std::cout << x << ' ';        // 打印 1 2
    }
}
```

### 梅森旋转骰子

```cpp
#include <iostream>
#include <random>

int rollDice(std::mt19937& gen) {
    static std::uniform_int_distribution<int> dist(1, 6);
    return dist(gen);
}

int main() {
    std::random_device rd;
    std::mt19937 gen{rd()};

    for (int i = 0; i < 10; ++i) {
        std::cout << rollDice(gen) << ' ';
    }
    std::cout << '\n';

    // 可复现实验：固定种子
    std::mt19937 replay{42};
    std::cout << rollDice(replay) << '\n';
}
```

### `if constexpr` 示意（模板语境）

```cpp
#include <iostream>
#include <type_traits>

template <typename T>
void printSizeCategory() {
    if constexpr (sizeof(T) <= 4) {
        std::cout << "small\n";
    } else {
        std::cout << "large\n";
    }
}

int main() {
    printSizeCategory<int>();
    printSizeCategory<double>();
}
```

## 易错与陷阱

1. **`if` 少写花括号**：加日志或第二句时悄悄挂错分支；永远加大括号。
2. **`=` 当 `==`**：`if (x = y)` 在条件里赋值；开警告。
3. **`switch` 忘记 `break`**：意外穿透是经典 bug；有意穿透写 `[[fallthrough]]`。
4. **在 `case` 里直接定义带初始化的变量并落入下一标签**：编译错误；用嵌套 `{}`。
5. **`do-while` 丢分号**：`while (cond)` 后必须有 `;`。
6. **循环条件里修改多个变量却依赖未定序**：把更新放到循环体或 `for` 的迭代子句并写清楚。
7. **用浮点当循环计数器**：`for (double x = 0; x != 1.0; x += 0.1)` 可能永不终止或多跑一轮。
8. **`goto` 跳过初始化**：标准禁止跳过某些初始化；即便能编过也极难维护。
9. **每次调用都 `mt19937{random_device{}()}`**：性能差且可能相关；引擎应长寿。
10. **`uniform_int_distribution<>(1, 6)` 误写成对引擎直接 `% 6`**：引入模偏差；用分布类。
11. **死循环**：条件从不假、忘记递增、`continue` 跳过更新；调试时检查循环变量与 `cin` 失败状态（见 [第 9 章](./ch09-error-handling.md)）。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。分支与循环是程序的「路径图」；Cherno 更在意**热路径是否可预测、嵌套是否可读**，而不是堆砌语法糖。

### 提前返回压扁嵌套

```cpp
bool trySpawnPickup(int inventorySlots, bool mapAllows)
{
    if (!mapAllows) return false;
    if (inventorySlots <= 0) return false;
    // 真正生成逻辑……
    return true;
}
```

卫语句让失败路径靠上、成功路径直线向下——调试时断点更好放。

### 三元与 `switch` 的使用边界

三元适合「两个表达式选一个值」；有副作用或长语句时用 `if`。`switch` 适合离散标签；有意穿透写 `[[fallthrough]]`，无意穿透是经典事故。正文已覆盖 `break`/`continue`、随机数三件套与 `if constexpr`——补充一句：游戏循环里少在条件里塞重分配或 I/O，先把控制流读干净。

### 循环的成本意识

```cpp
for (int wave = 0; wave < 3; ++wave) {
    // 每波只做必要工作；别在内层反复构造昂贵引擎
}
```

`mt19937` 等重对象应长寿复用（正文已强调）。控制流章节练的是结构清晰；性能测量留给基准测试习惯，但心中要有「这段多久跑一次」。

## 练习指引

- 重写一段三层 `if` 嵌套为卫语句版本，确认行为一致。
- 用 `switch` 实现简易计算器（`+ - * /`），刻意测试漏 `break` 的后果，再修好。
- 写猜数字游戏：`mt19937` + `uniform_int_distribution` 生成 1–100，循环读取直到猜中，统计次数。
- 实现「打印 1–100，跳过 7 的倍数，遇到 50 停止」，分别练习 `continue`/`break`。
- 对比 `rand() % n` 与 `uniform_int_distribution` 在 `n` 不能整除 `RAND_MAX` 时的理论偏差（不必测出偏差，但要能解释）。

## 小结

控制流的质量标准是：**路径少、嵌套浅、意图一眼可见**。`if`/`switch`/`for`/`while` 足够表达绝大多数结构；用提前返回取代深巢，用 RAII 取代 `goto` 清理。随机数请走 `<random>` 三件套。下一章 [错误检测与处理](./ch09-error-handling.md) 会把「输入失败、断言、测试」接进这些分支路径里。
