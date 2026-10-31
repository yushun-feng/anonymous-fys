---
title: 第 26–28 章：类模板、异常与 I/O
tags: [cpp, learncpp, templates, exceptions, io]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 26–28 章：类模板、异常与 I/O

> 来源：[learncpp.cn](https://learncpp.cn/) 第 26–28 章

## 小节地图

**26**：类模板、NTTP、函数/类模板特化与偏特化（含指针）。  
**27**：为何异常、try/catch、栈展开、捕获一切、异常类层次、再抛出、函数 try 块、代价与 `noexcept`、`move_if_noexcept`。  
**28**：iostream 体系、`istream`/`ostream`、字符串流、流状态、文件与随机访问。

## 要点

- 特化用于特定类型优化或硬编码行为；偏特化仅类模板支持。
- 异常适合“调用方必须知道的失败”；别在析构里抛出。
- `noexcept` 对移动/swap/标准库优化很重要。
- 文件 I/O 始终检查流状态；文本与二进制模式别混。

## 易错点

- 捕获时按值切掉派生异常类型——按 const 引用捕获。
- 空 `catch (...)` 吞掉一切却不记录。
- 不检查 `open` 失败就读写。
