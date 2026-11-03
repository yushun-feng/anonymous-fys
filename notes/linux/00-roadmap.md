---
title: Linux / 系统：学习路线与笔记地图
tags: [linux, systems, roadmap]
topic: linux
updated: 2026-11-03
order: 0
---

# Linux / 系统：学习路线与笔记地图

本主题收集 **Linux 用户态与相关系统知识**（进程地址空间、文件权限、Shell/Bash、网络协议直觉、启动/FHS、工具链/保护机制、后续可扩进程/线程、系统调用等），与 `cpp/`、`graphics/`、`gpu/` 并列，在浏览页用 Topic 筛选。

> 定位：**速查 + 心智模型**。内存布局、权限与 Shell 可并行建立；网络与 **启动 / 目录树 / 权限** 有站内交互演示；再接到调试与内核视角。正文以专业中文撰写；结构图用 Mermaid（浏览页渲染）。

## 建议路径

```mermaid
flowchart LR
  M[内存布局速查] --> S[栈帧与调用约定]
  S --> P[保护机制直觉]
  Perm[文件权限速查] --> SysEx[Linux 系统探索]
  Bash[Bash 参数扩展] --> Later
  Net[网络协议速览] --> Proto[协议探索]
  Boot[启动/FHS/权限演示] --> SysEx
  P --> Later[进程/syscall/线程…]
  Proto --> Later
  SysEx --> Later
```

1. **进程虚存布局**：Text / Data / BSS / Heap / Stack——谁在高地址、谁向谁生长
2. **栈帧与寄存器**：一次函数调用在栈上与通用寄存器里留下什么
3. **越界与防护（学习向）**：缓冲越界如何破坏控制流直觉；ASLR、栈金丝雀等训练/编译标志作参考
4. **文件权限**：`ls -l`、`rwx`/八进制、SUID/SGID/Sticky——谁能读/写/穿越；配合 [`#/perm`](#/perm)
5. **Bash 参数扩展**：`${…}` 缺省值、删前后缀、替换、切片与大小写
6. **网络协议速览**：HTTP/TLS/TCP/UDP/DNS…；[`#/protocols`](#/protocols)
7. **启动 / 目录 / 权限演示**：[`#/linux`](#/linux)（`#/boot` · `#/fs` · `#/perm`）
8. **后续（规划）**：`/proc/<pid>/maps` 实读、系统调用边界、线程与 TLS、页表直觉、ACL/强制访问控制导论等

## 笔记地图

| 篇 | 主题 | 本库笔记 |
|----|------|----------|
| — | 路线与地图 | [00-roadmap](./00-roadmap.md) |
| 1 | 进程内存分段速查（已展开） | [memory-segmentation](./memory-segmentation-cheatsheet.md) · [内存布局沙箱](#/memory) |
| 2 | 文件权限速查（已展开） | [file-permissions](./file-permissions-cheatsheet.md) · [权限演示](#/perm) |
| 3 | Bash 参数扩展速查（已展开） | [bash-parameter-expansion](./bash-parameter-expansion-cheatsheet.md) |
| 4 | 网络协议速览（已展开） | [network-protocols](./network-protocols-overview.md) · [协议探索](#/protocols) |
| 5 | Linux 系统探索导读（已展开） | [linux-sys-explorer](./linux-sys-explorer.md) · [交互页](#/linux) |

## 阅读约定

- 默认讨论 **用户态、常见 64 位 Linux / x86-64 System V ABI**、**POSIX 文件权限** 与 **Bash 4+** 的教学模型；具体偏移、段名、ACL/MAC 与 shell 差异以本机工具与发行版文档为准。
- 「缓冲溢出」等安全相关内容只讲**结构与防护动机**，不提供可复现利用步骤。
- 代码块标 `c` / `bash` / `asm`；公式按需用 `$...$`。
- 参考图放在 `public/notes-assets/linux/`，笔记内用相对路径 `notes-assets/linux/…` 嵌入。
