---
title: 内存布局沙箱（交互）
tags: [cpp, memory, stack, heap, layout]
topic: cpp
updated: 2026-11-03
order: 1
---

# 内存布局沙箱（交互）

> **交互页**：[`#/memory`](#/memory)  
> **覆盖**：进程虚存示意、栈帧压栈/弹栈、堆 bump 分配与释放、栈↓ 堆↑ 相向生长。  
> **形态**：可点击的地址空间布局 + 操作面板 + 详情 + 操作日志（教学沙箱，非真实分配器）。

相关：[RAII 与所有权](./raii-and-ownership.md) · [LearnCpp 移动与智能指针](./learncpp/ch22-move-smart-pointers.md) · [Linux 内存分段速查](../linux/memory-segmentation-cheatsheet.md)

## 建议路径

1. **先看布局**：高地址栈区、中间空隙、堆区、底部 Text/Data/BSS。
2. **压栈 / 返回**：调用 `foo` / `bar` / `recur`，观察 SP 下移与帧弹出。
3. **堆分配 / 释放**：`new` / `malloc` 示意块向上 bump；点选后释放看墓碑。
4. **相向生长**：用「演示：栈↓ 堆↑ 相向」感受空隙被挤窄；过近会触发 FAULT 提示。

打开 **[内存布局沙箱 →](#/memory)** 自行操作或跑内置演示；细节仍以笔记与平台 ABI 为准。
