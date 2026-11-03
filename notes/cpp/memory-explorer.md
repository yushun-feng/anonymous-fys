---
title: 内存管理探索（交互导读）
tags: [cpp, memory, raii, smart-pointers, vector]
topic: cpp
updated: 2026-11-03
order: 1
---

# 内存管理探索（交互导读）

> **交互页**：[`#/memory`](#/memory)  
> **覆盖**：虚存布局、栈帧、堆与 `new`/`delete`、RAII、`unique_ptr` / `shared_ptr`+`weak_ptr`、`vector` 扩容。  
> **形态**：内存条示意 + 流程模型 + 时序图 + 事件表（与协议/Linux 探索同款）。

相关：[RAII 与所有权](./raii-and-ownership.md) · [LearnCpp 移动与智能指针](./learncpp/ch22-move-smart-pointers.md) · [Linux 内存分段速查](../linux/memory-segmentation-cheatsheet.md)

## 建议路径

1. **地址空间 → 栈帧 → 堆分配**：先分清「自动 vs 显式」。
2. **RAII → unique → shared**：所有权从作用域绑到智能指针。
3. **vector 扩容**：连续缓冲重分配与迭代器失效。

打开 **[内存管理探索 →](#/memory)** 用自动播放走完各场景；细节仍以笔记与标准为准。
