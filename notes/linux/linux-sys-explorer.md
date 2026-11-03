---
title: Linux 系统探索（启动 / 目录 / 权限）
tags: [linux, boot, fhs, permissions, interactive]
topic: linux
updated: 2026-11-03
order: 5
---

# Linux 系统探索（启动 / 目录 / 权限）

> **交互页**：[`#/linux`](#/linux)（别名 `#/boot` · `#/fs` · `#/perm`）  
> **形态**：与协议探索同款——场景卡、流程模型、时序图、事件表、自动播放；中文 UI。  
> **边界**：教学示意，非某发行版实机转储；权限只讲结构与动机，无利用步骤。

相关：[路线图](./00-roadmap.md) · [文件权限速查](./file-permissions-cheatsheet.md) · [网络协议速览](./network-protocols-overview.md)

## 三个演示域

| 域 | 入口 | 覆盖 |
|----|------|------|
| 系统启动 | [`#/boot`](#/boot) | UEFI/BIOS、GRUB、内核、initramfs、systemd、登录、Secure Boot 示意 |
| 目录结构 | [`#/fs`](#/fs) | FHS 总览、proc/sys/dev/run、/etc 与 /var、家目录与 PATH |
| 权限设置 | [`#/perm`](#/perm) | rwx 三类身份、chmod/umask、SUID/SGID/Sticky、判定链、ACL 速览 |

打开 **[Linux 系统探索 →](#/linux)** 后可在页内切换三域；进度按域分别保存在本机。

## 建议跟读

1. **启动总览**走完一遍，再分别点开 UEFI / GRUB / initramfs / systemd。
2. **FHS 总览**建立根地图，再看运行时树与配置/日志。
3. **rwx 基础 → 八进制 → 特殊位 → 判定流程**；需要时再看 ACL 速览。  
   文字细节仍以 [文件权限速查](./file-permissions-cheatsheet.md) 为准。

```mermaid
flowchart LR
  Boot[启动探索] --> Fs[目录结构]
  Fs --> Perm[权限设置]
  Perm --> Ops[日常排障直觉]
```
