---
title: 指针操作交互页
tags: [cpp, pointers, smart-pointers, interactive, ownership]
topic: cpp
updated: 2026-11-07
order: 2
---

# 指针操作交互页

> **交互页**：[`#/pointers`](#/pointers)  
> **覆盖**：取址 / 解引用 / 空指针警示 / 指针算术（类型步长）/ 多级指针；`unique_ptr` move、`shared_ptr` 引用计数、`weak_ptr` lock、环引用警示与 weak 破环。  
> **形态**：变量槽 + SVG 箭头 + 表达式面板 + 步骤日志（教学示意，简化槽模型）。

相关：[第 12 章 引用与指针](./learncpp/ch12-references-pointers.md) · [第 22 章 移动与智能指针](./learncpp/ch22-move-smart-pointers.md) · [RAII 与所有权](./raii-and-ownership.md) · [内存布局沙箱](./memory-explorer.md)（`#/memory`）

## 和内存沙箱的分工

| 页面 | 专注 |
|------|------|
| [`#/memory`](#/memory) | 栈帧 / 堆块 / 对齐 / 缓冲操作（VAS 示意） |
| [`#/pointers`](#/pointers) | 指向关系、`*`/`&`、算术步长、智能指针计数与破环 |

指针页**不**重做整段虚存；默认「槽 + 箭头」。可从内存沙箱的句柄直觉跳过来练指向语义。

## 操作对照

| 按钮 / 演示 | 对应概念 |
|-------------|----------|
| `p = &x` | 取址绑定，箭头出现 |
| `*p = 42` / `x = 99` | 解引用写入 vs 直接改值（经指针可见） |
| `p = nullptr` + 求值 `*p` | 空指针解引用教学警示 |
| `p ± 1`（绑 `arr[i]`） | 按 `sizeof(int)` 步长，不是 ±1 字节 |
| `pp = &p` / `**pp` | 多级指针 |
| `make_unique` / `move` | 独占所有权转移，源空、堆块地址不变 |
| `make_shared` / 拷贝 / `reset` | `use_count` +1/−1，到 0 释放 |
| `wp = sp1` / `lock()` | 弱引用不增计数；lock 临时升强 |
| 建立环引用 / weak 破环 | shared↔shared 锁死 vs 一侧改 weak |

## 小白先看这些词

页内折叠「小白词条」与下表一致：

| 词 | 一句话 |
|----|--------|
| **`&`** | 取对象地址 |
| **`*`** | 顺着指针读写目标 |
| **空指针** | 不指向任何对象 |
| **悬空** | 对象没了，地址还握着 |
| **`use_count`** | 还有几个 `shared_ptr`（含环上的强边）握着堆对象 |
| **`weak_ptr`** | 观察但不拥有；破环常用 |

## 建议演示顺序

1. **取址绑定 → 改 x 看 \*p**  
2. **解引用写入**  
3. **空指针警示**  
4. **指针算术**（看地址跳 4 字节）  
5. **多级 pp → p → x**  
6. 切到「智能指针」：**unique move** → **shared 计数** → **weak lock** → **环引用 / 破环**

打开 **[指针操作交互页 →](#/pointers)**。
