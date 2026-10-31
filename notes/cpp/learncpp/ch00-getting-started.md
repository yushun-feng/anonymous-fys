---
title: 第 0 章：入门与工具链
tags: [cpp, learncpp, cherno, toolchain]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 0 章：入门与工具链

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 0 章（Introduction / Getting Started）

## 小节地图

| 小节 | 主题 |
|------|------|
| 0.1–0.2 | 教程定位、如何高效学习本站 |
| 0.3–0.4 | 开发流程概览：写代码 → 编译 → 链接 → 运行 |
| 0.5 | 编译器、链接器、库与目标文件 |
| 0.6–0.7 | IDE 选择与第一个程序 |
| 0.8 | 常见安装/运行问题排查 |
| 0.9–0.11 | 项目/构建配置、扩展与插件 |
| 0.12–0.13 | 警告级别、语言标准（C++11/14/17/20/23） |

相关笔记：[第 1 章 基础](./ch01-basics.md) · [第 2 章 多文件](./ch02-functions-files.md) · [第 3 章 调试](./ch03-debugging.md) · [路线图](./00-roadmap.md)

## 核心概念

### 为什么需要「工具链」

C++ 不是解释型语言：你写的是**源码**（`.cpp` / `.h`），必须经过**编译器**翻译成机器码，再经**链接器**把多个目标文件和库拼成可执行程序。第 0 章把这条流水线讲清楚，后面所有「找不到符号」「未定义引用」「标准没开对」类问题都能回到这里定位。

### 源码 → 可执行文件

典型流水线：

1. **预处理（preprocess）**：展开 `#include`、处理宏、去掉注释，得到翻译单元文本。
2. **编译（compile）**：语法/语义检查，生成**目标文件**（Windows 常为 `.obj`，Linux/macOS 常为 `.o`）。
3. **链接（link）**：解析跨文件的函数/变量引用，链接静态库或导入动态库，生成可执行文件或共享库。
4. **运行（run）**：操作系统加载可执行文件；若用了动态库，还需能在运行时找到它们。

失败阶段不同，报错形态也不同：编译期多是「语法错误 / 类型错误」；链接期多是「undefined reference / unresolved external symbol」；运行期才是崩溃、错误输出、未定义行为。

### 编译器、链接器、库

| 角色 | 常见工具 | 职责 |
|------|----------|------|
| 编译器前端/驱动 | GCC `g++`、Clang `clang++`、MSVC `cl` | 预处理 + 编译（有时也驱动链接） |
| 链接器 | `ld`/`lld`/`link.exe`（常由驱动代调） | 合并目标文件与库 |
| 标准库 | libstdc++、libc++、MSVC STL | `iostream`、`string`、容器等实现 |
| 第三方库 | 静态 `.a`/`.lib` 或动态 `.so`/`.dll`/`.dylib` | 扩展能力（图形、网络等） |

**目标文件**里已有本翻译单元的机器码，但对「别的 `.cpp` 里定义的函数」只留下**未解析符号**；链接器负责把这些洞填上。若某函数只声明未定义、或定义在未参与链接的文件里，就会链接失败。

### IDE 与编辑器

IDE（Visual Studio、CLion、Qt Creator、VS Code + 扩展等）把编辑、构建、调试绑在一起。学习期建议：

- 能**一键构建并运行**，并看到编译器完整输出。
- 能设置**语言标准**与**警告级别**（见下文）。
- 能用**调试器**（断点、单步）——与 [第 3 章](./ch03-debugging.md) 衔接。

纯编辑器 + 命令行也可；关键是你要清楚自己在调哪一套编译器命令。

### 构建配置：Debug vs Release

| 配置 | 典型特征 | 用途 |
|------|----------|------|
| Debug | 少优化、带调试符号、断言常开启 | 开发、调试、查 UB 相关崩溃 |
| Release | 高优化（`-O2`/`-O3`/`/O2`）、体积/速度优先 | 性能测试、交付 |

同一份源码在两种配置下行为「看起来不同」时，先怀疑：未定义行为、未初始化、竞态，或依赖了 Debug 才存在的检查。

### 警告与语言标准

- **警告不是噪音**：许多警告直接对应逻辑错误（未使用变量、有符号比较、隐式收窄等）。学习阶段应把警告开高，并尽量「零警告」交付作业级小程序。
- **语言标准**：用 `-std=c++17` / `-std=c++20`（GCC/Clang）或 `/std:c++17`（MSVC）明确版本。教程后文大量内容默认至少 C++17；`string_view`、结构化绑定等需要对应标准。

## 语法与 API（工具侧）

### 命令行最小示例（GCC/Clang）

```bash
# 单文件
g++ -std=c++17 -Wall -Wextra -Wpedantic -g -O0 -o hello hello.cpp
./hello

# 多文件（与第 2 章呼应）
g++ -std=c++17 -Wall -Wextra -g -O0 -o app main.cpp math.cpp
```

| 选项 | 含义 |
|------|------|
| `-std=c++17` | 选用 C++17 |
| `-Wall -Wextra` | 常用警告集（再加 `-Wpedantic` 更严） |
| `-g` | 生成调试信息 |
| `-O0` | 关闭优化（Debug） |
| `-O2` | 常用 Release 优化 |
| `-o name` | 输出文件名 |

MSVC 侧对应思路：`/std:c++17`、`/W4`、`/Zi`（调试）、`/Od` vs `/O2`。

### 第一个程序应具备的形态

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello, world!\n";
    return 0;
}
```

要点：

- 程序从 `main` 开始；返回 `0` 通常表示成功（也可省略 `return 0;`，C++ 对 `main` 有特殊规则）。
- `#include <iostream>` 引入标准输入输出声明；实现在标准库中，由链接器一并链入。
- 使用 `std::` 限定或稍后学习 `using` / 命名空间（见 [第 2 章](./ch02-functions-files.md)）。

### IDE 里你应能找到的设置

1. **C++ 语言标准**（项目属性 / CMake `CMAKE_CXX_STANDARD` / tasks.json args）。
2. **警告级别**（至少相当于 `-Wall` 或 MSVC `/W4`）。
3. **工作目录与启动项**（调试时相对路径、输入文件是否找得到）。
4. **多文件是否都加入了工程**（只编译一个 `.cpp` 是链接错误的常见原因）。

## 示例

### 示例 1：确认编译器与标准

```cpp
#include <iostream>

int main()
{
    // __cplusplus 是实现定义的日期码，用于粗查标准（勿依赖精确数值做移植）
    std::cout << "Hello from C++\n";
    std::cout << "__cplusplus = " << __cplusplus << '\n';
    return 0;
}
```

用 `-std=c++17` 与 `-std=c++20` 各编一次，观察宏是否变化，建立「标准开关真的生效」的直觉。

### 示例 2：故意触发警告

```cpp
#include <iostream>

int main()
{
    int x;              // 未初始化（高警告级别常会提示使用前未赋值）
    int y = 1;
    // 若从不读取 x，有的编译器报 unused；若读取则可能是逻辑/UB 问题
    std::cout << y << '\n';
    return 0;
}
```

打开 `-Wall -Wextra` 后根据提示修改：要么初始化，要么删掉无用变量。养成「警告驱动修改」的习惯。

### 示例 3：链接失败的最小复现（概念演示）

```cpp
// main.cpp
int add(int a, int b);  // 仅声明

int main()
{
    return add(1, 2);   // 链接期需要别处提供定义
}
```

若工程里没有实现 `add` 的 `.cpp`，编译 `main.cpp` 可能通过，**链接**时报 unresolved / undefined reference。这与 [第 2 章 前向声明与多文件](./ch02-functions-files.md) 直接相关。

### 示例 4：CMake 最小片段（可选，但实用）

```cmake
cmake_minimum_required(VERSION 3.16)
project(learncpp_ch00 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_executable(hello hello.cpp)
target_compile_options(hello PRIVATE
    $<$<CXX_COMPILER_ID:MSVC>:/W4>
    $<$<NOT:$<CXX_COMPILER_ID:MSVC>>:-Wall -Wextra -Wpedantic>)
```

IDE 若用 CMake，把标准与警告写进构建图，比每次手改命令行更稳。

## 易错与陷阱

1. **装了 IDE ≠ 装了编译器**：VS Code 需要自行安装 MinGW-w64、MSVC 或 Clang；只装编辑器无法构建。
2. **改了标准但没重建**：缓存的旧目标文件可能导致「我明明写了 C++17 特性却报错」。Clean + Rebuild。
3. **中文路径 / 空格路径**：部分工具链与脚本对路径敏感；学习项目尽量放在简单 ASCII 路径下。
4. **混用两套工具链**：用 GCC 编的目标文件不要拿去给 MSVC 链接；一个项目固定一套。
5. **忽略链接错误去「改语法」**：`undefined reference to foo` 几乎从来不是少写分号，而是缺定义或没加入工程。
6. **Release 才崩溃、Debug 正常**：高度怀疑 UB 或依赖未初始化内存；不要用「Release 关优化试试」当根治手段。
7. **控制台一闪而过**：在 IDE 里用「开始调试 / 运行但不调试」看输出，或在 `main` 末尾临时等待输入；根本办法是在集成终端里运行。
8. **语言标准设太低**：例如代码用了 `std::string_view`（C++17）却停在 C++14，表现为「不是类型」类离谱错误。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。LearnCpp 第 0 章把工具装好；Cherno 更强调：**你真正在控制的是机器上的比特与指令流**——选 C++ 往往是因为内存布局、延迟与确定性重要，而不是「再学一门语法」。

### 为什么还要碰编译/链接心智模型

把一次构建想成流水线，而不是「点运行」黑盒：

1. **预处理**：展开 `#include` / 宏，得到翻译单元文本。
2. **编译**：源 → 目标文件（`.o` / `.obj`），检查语法与类型，但**还不要求所有函数已有定义**。
3. **链接**：把多个目标文件与库粘成可执行文件；缺定义、重复定义、ABI 不一致都在这里炸。

工程直觉：看到 `undefined reference`，先问「哪个 `.cpp` 该进工程」，而不是先改调用方语法。

```cpp
// gauge_main.cpp —— 只有声明
int readGaugeMilli();
int main() { return readGaugeMilli() > 0 ? 0 : 1; }
```

若工程未编译进提供 `readGaugeMilli` 定义的翻译单元，编译可能过、链接必败——这与正文「链接失败最小复现」同构，只换了名字。

### Debug 与 Release 是两种产品观

Cherno 式习惯：日常学习与查错用 Debug（`-g -O0` 或等价），确认逻辑后再开优化看性能。Release 下变量可能被优化掉、断言消失、未初始化内存「碰巧」变成 0——这些都会制造假象。

```cpp
#include <iostream>

int saturateGain(int raw)
{
    if (raw > 100) return 100;
    if (raw < 0) return 0;
    return raw;
}

int main()
{
    std::cout << saturateGain(42) << '\n';
}
```

打开 `-Wall -Wextra`，再故意删掉一条 `return` 路径，体会「警告是廉价的代码审查」。

### 工具链选择的工程口径

- 一个仓库固定一套编译器族（GCC / Clang / MSVC），不要混链目标文件。
- 语言标准写进构建图（CMake `CXX_STANDARD` 或等价），避免「本机能编、CI 不能编」。
- 学习项目路径尽量 ASCII、无空格；中文路径问题属于环境噪声，尽早排除。
- 预编译头、Unity build 等是规模化手段；入门阶段先保证「单文件可复现构建」。

### 与正文的分工

正文已覆盖 Hello World、警告开关、链接失败最小复现与 CMake 片段。本节不重复步骤清单，只补 **「编译器在干什么、为何要管内存与确定性」** 的动机层。装好手术台之后，后面每一章的 UB、优化、多文件链接才说得通。

## 练习指引

- 按教程完成工具安装，并用命令行与 IDE **各成功运行一次** Hello World。
- 在项目里打开最高合理警告级别，故意写未使用变量、有符号/无符号比较，读懂警告文案。
- 把标准在 C++14 / C++17 / C++20 间切换，编译含 `[[nodiscard]]`、`string_view` 等特性的小片段，确认开关生效。
- 做一个「两文件工程」：`main.cpp` 调用另一文件中的函数；先故意漏加文件，观察链接错误，再修复——为第 2 章打样。
- 完成 learncpp 第 0 章各节小测验：重点自检「能否用自己的话解释编译与链接的区别」。

## 小结

- C++ 程序 = 源码经**预处理 → 编译 → 链接**得到可执行文件；库在链接或运行时参与。
- 学习环境必须能稳定设置：**语言标准、警告、Debug 符号**。
- 编译错误与链接错误要分开排查；第 0 章是整门课的「手术台」，后面调试与多文件都建立在此之上。
