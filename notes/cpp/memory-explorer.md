---
title: 内存布局沙箱（交互）
tags: [cpp, memory, stack, heap, layout, alignment, move, memmove]
topic: cpp
updated: 2026-11-03
order: 1
---

# 内存布局沙箱（交互）

> **交互页**：[`#/memory`](#/memory)  
> **覆盖**：调用/返回、静态、自动变量、结构体对齐/packed、堆 `new`、句柄 move、**大缓冲稀疏写 + `memmove` 紧缩 + `memset` / `memcpy`**、释放。  
> **形态**：可点击 VAS + 操作面板 + 字节/MiB 色条 + 日志（教学示意）。

相关：[RAII 与所有权](./raii-and-ownership.md) · [LearnCpp 移动与智能指针](./learncpp/ch22-move-smart-pointers.md) · [Linux 内存分段速查](../linux/memory-segmentation-cheatsheet.md)

## 常用操作对照

| 沙箱按钮 | 对应概念 |
|----------|----------|
| 调用 / 返回 | 栈帧压入弹出 |
| 静态变量 | Data / BSS |
| 自动变量 | 栈上局部 |
| 结构体压缩 / 恢复对齐 | 成员 padding vs packed |
| new + 句柄 / move | 独占所有权转移（堆对象不动） |
| `new char[10MiB]` | 大块堆缓冲 |
| 稀疏写 1+空4+1 MiB | 块内有效数据与空洞 |
| `memmove` 紧缩 | 把数据段前移，消内部空洞 |
| `memset` 清尾 | 清未用/原空洞区 |
| `memcpy` 克隆 | 整块拷贝到新缓冲 |
| 释放 | `delete` / free 示意 |

## 建议演示

1. **稀疏写→memmove紧缩** — 对应「写两段中间留间隔，再收到前 2MiB」。  
2. **从 main 走一遍** — 静态 → 结构体 → 压缩 → 调用 → 句柄 move。  
3. **对齐间隔→压缩** — 结构体成员 padding（与缓冲空洞不同）。

打开 **[内存布局沙箱 →](#/memory)**。
