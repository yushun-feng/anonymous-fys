---
title: cpp-sort 通用约定（异常、确定性、配置宏）
tags: [cpp, cpp-sort, exceptions, versioning, assertions]
topic: cpp
updated: 2026-11-08
order: 5
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Home
---

# 通用约定：异常、确定性与配置

> 出处：[Wiki · Home](https://github.com/Morwenn/cpp-sort/wiki/Home)（文档约对应 cpp-sort 2.2.0）  
> 说明：中文消化，非英文镜像。路线见 [00](#/note/cpp/cpp-sort/00-roadmap)；上手见 [06](#/note/cpp/cpp-sort/06-quickstart)。

Home 页不讲某个算法细节，而是把**横切约定**说清楚：异常后集合长什么样、自移动/自交换、是否可复现、版本宏与断言怎么开。读后续 sorter / adapter 笔记时，这些默认假设会反复出现。

## 异常安全：无泄漏，但无「排到一半可回滚」

库对自身分配的内存提供**无泄漏保证**：即使抛异常，库组件申请的内存也会释放。库本身**几乎不抛**，例外主要是空间复杂度差于 \(O(1)\) 时可能抛出 `std::bad_alloc`（除非该算法文档明确写了不会抛）。

更常见的异常来自**用户代码**：

- 自定义比较器 / 投影  
- 元素的移动与交换  
- 传入的迭代器 / 容器操作  

关键结论：**算法执行中途若抛异常，传入集合的状态不作保证**——元素可能已有一部分处于 moved-from。临时缓冲 + 搬移场景尤其如此。产品代码里不要假设「抛了还能当原序列继续用」。

## 自移动与自交换

对齐标准库期望：

1. **禁止盲自移动**：算法不应对同一对象做无保证语义的自移动。  
2. **允许自交换**：元素类型 `T` 应满足 C++20 `swappable` 直觉——对任意 `x`，下面代码结束后 `x` 的值不变：

```cpp
using std::swap;
swap(x, x);
```

若你的类型自交换会损坏状态，部分库内算法可能踩坑；责任在类型作者。

## 确定性与可复现

目前库内算法均为**确定性**：同一输入 → 同一操作序列。刻意不用随机 pivot / 随机采样类算法。也**暂无多线程排序**，进一步利于实验复现。

教学/基准时这很省心；若你需要「故意随机化」行为，应自己在外层做，而不是假设库内部有 nondeterminism。

## 版本宏

语义化版本，头文件 `<cpp-sort/version.h>`：

```cpp
CPPSORT_VERSION_MAJOR
CPPSORT_VERSION_MINOR
CPPSORT_VERSION_PATCH
```

可做条件编译或日志里打印库版本。

## 前向声明：`fwd.h`

```cpp
#include <cpp-sort/fwd.h>
```

提供 sorter、fixed-size sorter、sorter adapter 等主要组件的**前向声明**，适合在自己的头文件里减少包含重量。真正调用实现时再 include 具体头。

## 弃用警告

即将在大版本移除的旧组件会标 `[[deprecated]]`。若迁移期暂时要消声：

```cpp
#define CPPSORT_DISABLE_DEPRECATION_WARNINGS
```

长期仍应跟上游迁移，而不是永久关掉。

## 断言、审计与 libassert

| 宏 | 作用 |
|----|------|
| `CPPSORT_ENABLE_ASSERTIONS` | 打开逻辑断言（不少来自移植算法）；**尊重 `NDEBUG`**——定义了 `NDEBUG` 则仍不启用 |
| `CPPSORT_ENABLE_AUDITS` | 昂贵审计；开启时会连带开断言，并把内部 `[[assume(...)]]` 等变成断言；也可能**改变算法复杂度观感**；同样尊重 `NDEBUG` |
| `CPPSORT_USE_LIBASSERT` | （实验）内部断言改走 [libassert](https://github.com/jeremy-rifkin/libassert)，可有栈追踪与表达式分解 |

CMake 侧可用同名选项 `ON` 打开（见 Wiki Tooling）。日常发布构建保持默认关闭；调试诡异排序结果时再开 assertions；audits 留给深度诊断。

## 杂项提醒（读库心态）

- Wiki 另有 Original research / Benchmarks：理解库「怎么长出来」有用，但**不是**使用前置。  
- 许多算法来自论文/实验再实现；若只关心生产可用，优先看 [Benchmarks](https://github.com/Morwenn/cpp-sort/wiki/Benchmarks) 里分析过的那些。  
- 文档缺口可开 issue——未文档的公共面有时意味着应藏进子命名空间。

## 练习指引

1. 在本地用 `CPPSORT_VERSION_*` 打印一次版本号。  
2. Debug 配置试开 `CPPSORT_ENABLE_ASSERTIONS`，确认 `NDEBUG` 关掉后行为符合预期。  
3. 写一个自交换会改值的「坏类型」，观察是否破坏某次排序（理解为何 swappable 重要）。

上一篇：[04 与 std::sort](#/note/cpp/cpp-sort/04-vs-std-sort) · 下一篇：[06 快速上手](#/note/cpp/cpp-sort/06-quickstart)。
