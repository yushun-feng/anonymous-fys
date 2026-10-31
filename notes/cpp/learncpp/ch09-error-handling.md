---
title: 第 9 章：错误检测与处理
tags: [cpp, learncpp, errors, testing]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 9 章：错误检测与处理

> 来源：[learncpp.cn](https://learncpp.cn/) 第 9 章

## 小节地图

测试入门、代码覆盖、常见语义错误、错误检测策略、`std::cin` 无效输入、`assert` / `static_assert`。

## 要点

- 先分清：**可恢复错误**（坏输入）vs **逻辑 bug**（断言）。
- `cin` 失败后要清错误状态并丢弃坏输入，否则会死循环。
- `assert` 调试期检查不变量；`static_assert` 编译期检查。
- 覆盖率帮你发现没跑到的分支，但不能证明正确。

## 易错点

- 失败后不 `clear`/`ignore`，后续读取全废。
- 在生产路径用 assert 代替真正的错误处理。
- 只测快乐路径，漏掉空输入与边界值。
