---
title: 第 3 章：调试
tags: [cpp, learncpp, cherno, debugging, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 3 章：调试

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 3 章
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 小节地图

| 主题 | 要点 |
|------|------|
| 语法错误 vs 语义错误 | 编不过 vs 能跑但结果错 |
| 调试流程与策略 | 复现 → 定位 → 修 → 回归 |
| 战术手段 | 打印、断言、最小化用例 |
| IDE 调试器 | 断点、单步、步进/步过、步出 |
| 监视与调用栈 | Watch、Locals、Call Stack |
| 事前预防 | 警告、初始化、小步提交、测试 |
| 章末测验 | 把策略用在具体 bug 上 |

相关：[第 0 章 工具链与 Debug 配置](./ch00-getting-started.md) · [第 1 章 UB](./ch01-basics.md) · [第 9 章 错误处理](./ch09-error-handling.md)

## 核心概念

### 两类错误

| 类型 | 表现 | 典型原因 |
|------|------|----------|
| **语法 / 编译期错误** | 编译失败 | 缺分号、拼写、类型不匹配、找不到声明 |
| **语义 / 逻辑错误** | 能编译运行，结果不对或崩溃 | 公式错、条件反了、越界、UB、状态未更新 |

链接错误介于两者之间：单个文件可能编过，合成可执行文件失败——按「缺定义 / 签名不一致 / 未加入工程」排查（[第 2 章](./ch02-functions-files.md)）。

还有**运行时错误**：除零、空指针解引用、未捕获异常等；有的属 UB，有的有明确表现。

### 调试目标

不是「改到碰巧对」，而是：

1. **稳定复现**问题（输入、步骤、构建配置）。
2. **缩小范围**到具体函数、甚至具体行。
3. **提出假设**并用证据验证（打印、断点、单测）。
4. **最小修改**修复，再跑回归，避免引入新问题。

### 科学调试策略

- **二分法**：若 100 行里结果错了，在中点检查中间变量是否已错，从而折半搜索。
- **已知好 → 未知坏**：从入口或上次正确状态往下跟，找到第一个「不该发生」的点。
- **最小化**：删减输入与代码直到最小复现；很多 bug 在最小化过程中自己暴露。
- **一次只改一个假设**：同时改五处会失去因果。

### 打印调试（printf / cout debugging）

在关键点输出变量与「到过这里」标记：

```cpp
std::cerr << "[debug] x=" << x << " at step 2\n";
```

用 `std::cerr` 可减少与正常 `stdout` 输出搅在一起。调试结束后应删除或关掉这些输出，避免污染正式程序。

打印的局限：多线程交错、海量输出、改变时序（Heisenbug）。仍适合早期课程与简单逻辑。

### 断言（入门）

`assert(condition)`（`<cassert>`）：条件为假时在 **Debug** 配置通常终止程序并报告位置。用于检查「不可能发生」的内部不变量，而不是替代对用户输入的正常错误处理（后者见第 9 章）。

```cpp
#include <cassert>

int reciprocal(int x)
{
    assert(x != 0);   // 开发期抓住非法前置条件
    return 1 / x;
}
```

NDEBUG 宏定义后 `assert` 常被禁用——故不要把**必须执行**的业务逻辑只放在 assert 里。

### 调试器核心能力

在 **Debug** 构建（`-g` / 等价选项，低优化）下：

| 操作 | 含义 |
|------|------|
| 断点（breakpoint） | 执行到该行暂停 |
| 继续（continue） | 跑到下一断点或结束 |
| 步过（step over） | 执行当前行；若是调用，不进入函数体 |
| 步进（step into） | 进入函数内部 |
| 步出（step out） | 跑完当前函数返回调用方 |
| 监视（watch） | 跟踪表达式/变量值变化 |
| 局部变量（locals） | 当前栈帧局部量 |
| 调用栈（call stack） | 谁调谁：崩溃时第一现场 |

条件断点、数据断点（监视某内存被改写）是进阶利器，课程有介绍则跟做一遍。

### 事前预防胜过事后救火

- 高警告级别、零警告（[第 0 章](./ch00-getting-started.md)）。
- 变量定义即初始化（[第 1 章](./ch01-basics.md)）。
- 函数短小、名字准确（[第 2 章](./ch02-functions-files.md)）。
- 小步修改 + 频繁运行；用版本管理对比「哪次提交引入问题」。
- 对边界值（0、负数、空输入）主动试一试。

## 语法与 API（调试相关）

```cpp
#include <cassert>
assert(expr);              // expr 为假则诊断（Debug）

#include <iostream>
std::cerr << "...\n";      // 诊断输出

// 编译器扩展 / 宏（了解即可）
// __FILE__ __LINE__ 常用于自制日志
```

构建提醒：

```bash
g++ -std=c++17 -Wall -Wextra -g -O0 -o app app.cpp   # 适合调试
# -O2 可能重排代码，单步行号「乱跳」——查逻辑时先降优化
```

## 示例

### 示例 1：语义错误——整数除法

```cpp
#include <iostream>

// 意图：计算平均值；错误：整数除法截断
double average_wrong(int a, int b)
{
    return (a + b) / 2;      // 若 a+b 为 int，结果先按 int 除
}

double average_ok(int a, int b)
{
    return (a + b) / 2.0;    // 浮点除法
}

int main()
{
    std::cout << average_wrong(1, 2) << '\n';  // 1
    std::cout << average_ok(1, 2) << '\n';     // 1.5
}
```

用断点停在 `return`，监视 `(a+b)/2` 与 `(a+b)/2.0` 的类型与值。

### 示例 2：用断言抓住前置条件

```cpp
#include <cassert>
#include <iostream>

int at(const int* p, int n, int i)
{
    assert(p != nullptr);
    assert(i >= 0 && i < n);
    return p[i];
}

int main()
{
    int a[3]{10, 20, 30};
    std::cout << at(a, 3, 1) << '\n';  // 20
    // at(a, 3, 3);  // Debug 下 assert 失败
}
```

（指针与数组后文展开；此处强调「调试期检查边界」。）

### 示例 3：打印缩小范围

```cpp
#include <iostream>

int compute(int x)
{
    std::cerr << "compute in=" << x << '\n';
    int y = x * 2;
    std::cerr << "compute y=" << y << '\n';
    return y - 1;
}

int main()
{
    std::cout << compute(5) << '\n';
}
```

若最终答案错，先看日志里 `y` 是否已错，判断问题在乘法还是减法。

### 示例 4：调用栈阅读场景（描述性）

假设 `main` → `runApp` → `loadConfig` → `parseLine` 崩溃。调用栈顶通常是崩溃点附近；往下看能知道**谁在什么参数下调用了它**。修 bug 时经常改的是上层传入的坏参数，而不只是崩溃那一行。

## 易错与陷阱

1. **在 Release / 高优化下单步**：行号乱跳、变量「优化掉」显示 `<optimized out>`；改用 Debug。
2. **修了表象没修根因**：例如到处 `if (!p) return;` 掩盖空指针，却不查为何为空。
3. **断言当用户输入校验**：发布版断言消失，非法输入变成更糟的 UB；用户输入应正规报错路径。
4. **调试输出忘删**：干扰自动测评比对；用统一宏或早期删除。
5. **断点打在头文件模板 / 内联**上可能命中多次；注意当前栈帧。
6. **忽略编译器警告**：警告往往已经指出未使用、有符号比较、可能未初始化。
7. **Heisenbug**：加打印后 bug「消失」——可能是时序/UB；改用调试器观察或 AddressSanitizer 等工具（进阶）。
8. **一次改太多**：无法知道哪次修改有效；配合 git diff。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。调试在 Cherno 流程里不是「出 bug 才开」，而是**默认开发模式**：断点、调用栈、内存视图比猜打印更快建立心智模型。

### 先复现，再假设

1. 固定输入与期望输出（可复现才谈修复）。
2. 用断点卡在「第一次看起来不对」的表达式。
3. 沿调用栈向上看：坏值常常来自调用方，而不是崩溃行本身。

```cpp
#include <iostream>

double loadFactor(int used, int capacity)
{
    // 断点打在 return：分别监视 used、capacity、以及除法类型
    return used / capacity; // 整数除法陷阱——正文示例同类问题
}

int main()
{
    std::cout << loadFactor(1, 2) << '\n';
}
```

修法是改成浮点除法；更重要的是练习：**用监视窗口证明假设**，而不是改完碰运气。

### 日志宏的取舍

学习阶段可用临时 `std::cerr`；稍大一点的练习可做成可开关宏（仅 Debug 打印）。正文已警告「断言当用户校验」——补充：发布路径需要正规错误通道（后续异常/错误码章节），调试设施应能整批关掉以免污染输出对比。

### 与正文分工

易错清单（优化下单步、Heisenbug、一次改太多）正文已列全。本节强调 Cherno 式节奏：**Debug 构建 + 断点优先，打印作辅助，修复后立刻删噪声日志**。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 `assert`、`volatile` 与工具篇。调试不只是断点——还有**契约检查**和**别被优化骗到**。

### `assert`：逻辑不可能，不是用户错误

```cpp
#include <cassert>

int at(const int* p, int n, int i)
{
    assert(p != nullptr);
    assert(i >= 0 && i < n); // 违反 = 程序员 bug；Release 可被 NDEBUG 摘掉
    return p[i];
}
```

- 断言检查的是「按设计不该发生」的状态；可预期的输入错误走返回码/`optional`/异常。
- 定义 `NDEBUG` **必须在包含 `<cassert>` 之前**；只在某个 `.cpp` 中间 `#define` 往往无效或行为混乱。

### `volatile`：对「会被外界改」的存储

- `volatile` 告诉编译器：读写作副作用，不要随便合并或删掉访问——典型场景是内存映射寄存器、信号处理里的标志。
- 它**不是**多线程同步原语；线程间共享可变状态用 `std::atomic` / mutex，不要指望 `volatile` 给happens-before。

### 工具箱

断点优先；需要打印中间值时可考虑轻量调试宏；Linux 上可回放的 `rr` 适合「偶现」bug。先把 Debug 构建与警告开全，再上花哨工具。

## 练习指引

- 在 IDE 里对第 1–2 章某程序：设断点、`step into` 进自家函数、监视局部变量，截图式地走通一遍（自己做即可）。
- 故意写错平均值或交换变量条件，用二分打印定位。
- 打开 `-g -O0`，对比 `-O2` 下单步体验差异。
- 完成第 3 章测验：按教程描述的 bug 场景选择合适手段（断点 vs 打印 vs 读代码）。
- 建立个人检查清单：复现步骤、输入、期望输出、实际输出、已排除项。

## 小结

- 先分清「编不过」还是「结果不对」；链接错误单独一类。
- 调试是假设—验证循环；调试器提供断点、单步、监视与调用栈。
- 预防（警告、初始化、小函数、小步验证）显著减少调试时间。
- 断言服务开发期不变量；正式错误处理留给后续章节。
