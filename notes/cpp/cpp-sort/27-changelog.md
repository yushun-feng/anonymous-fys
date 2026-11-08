---
title: cpp-sort 版本与特性门控
tags: [cpp, cpp-sort, changelog, cpp20, feature-test]
topic: cpp
updated: 2026-11-08
order: 27
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Changelog
---

# cpp-sort 版本与特性门控

> 出处：[Wiki · Changelog](https://github.com/Morwenn/cpp-sort/wiki/Changelog)  
> **完整发行说明**请看上游发布页（非本笔记）：[GitHub / Codeberg Releases](https://codeberg.org/Morwenn/cpp-sort/releases)（Wiki 链到 Codeberg；镜像亦见 [GitHub Morwenn/cpp-sort](https://github.com/Morwenn/cpp-sort)）。  
> 本页只消化：**随 C++ 标准版本与编译器扩展而开关的能力**。

相关：[25 Tooling](#/note/cpp/cpp-sort/25-tooling) · [01 概览](#/note/cpp/cpp-sort/01-overview)

## 怎么读

理论基线是 **C++17 合规编译器**。实际编译器用 feature-test macro（及更细检查）决定是否启用增强。若你的工具链已支持某特性但库侧未生效，可向上游开 issue。

## C++14 相关（仍可能影响性能）

| 能力 | 说明 |
|------|------|
| **Sized deallocation** | 若定义了 `__cpp_sized_deallocation`，且全局 `operator delete` 等真正吃 size，若干 sorter 会显式尝试利用。Clang 常需 `-fsized-deallocation`；标准分配器本身未必受益。 |

## C++20：正确性

- `total_less` / `total_greater`：有 `std::strong_order` 时尽量按 IEEE *totalOrder* 比较浮点（区分 quiet / signaling NaN、可读 payload）。  
- C++17 及更早：这两枚比较器**不是**完整 total order。  
- 探测：`__cpp_lib_three_way_comparison`。

## C++20：新接口对齐

| 标准设施 | 库侧 |
|----------|------|
| `std::identity` | 凡支持 `utility::identity` 处，语义等价地接纳 |
| `std::ranges::less` / `greater` | 凡支持 `std::less<>` / `greater<>` 处，语义等价地接纳 |
| `constexpr std::swap` | `utility::iter_swap` 可进入更多 `constexpr`；看 `__cpp_lib_constexpr_algorithms` |

## 实现扩展（非标准、按工具链）

**功能：**

- **128-bit 整数**：`counting_sorter` / `ska_sorter` 在 `__SIZEOF_INT128__` 下支持 `unsigned __int128` / `__uint128_t` 及有符号对应物（不依赖标准库是否已仪器化）。

**性能：**

- 位操作 **intrinsic** 加速部分位技巧。  
- 编译器 **assumption** 提示（视编译器可用性）。  
- **MSVC STL** 向量化算法：连续、平凡可拷类型上部分路径可受益。  
- libstdc++ / libc++ / MSVC STL 下，`std::mem_fn` 包数据成员指针时视为「大概无分支」→ 可加速 `pdq_sorter` 及依赖它的路径。

## 学习者 checklist

1. 发版差异（新 sorter、修 bug）→ **Releases**，不要只读本页。  
2. 浮点 total order、ranges 比较器、identity → 确认在 **C++20+** 且宏已点亮。  
3. 追求极致整数/位操作路径 → 看编译器是否暴露 int128 / intrinsic。  
4. 断言与审计开关见 [25 Tooling](#/note/cpp/cpp-sort/25-tooling)，与标准门控正交。
