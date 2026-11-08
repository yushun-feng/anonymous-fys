---
title: cpp-sort 概览
tags: [cpp, cpp-sort, sorting, overview]
topic: cpp
updated: 2026-11-08
order: 1
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort
---

# cpp-sort 概览

> 出处：[Morwenn/cpp-sort](https://github.com/Morwenn/cpp-sort) · [Wiki Quickstart](https://github.com/Morwenn/cpp-sort/wiki/Quickstart)  
> 说明：原创中文消化；细节与版本差异以上游为准。路线见 [00](#/note/cpp/cpp-sort/00-roadmap)。

## 它解决什么问题

标准库给你一个（实现相关的）高质量通用排序，但**不会**把几十种算法、自适应包装、预有序度量都做成可组合积木。**cpp-sort** 是一套以 **C++14+ header-only** 为主的排序工具箱：同一套调用约定下，换成另一种算法、包一层 adapter、或量一下「乱到什么程度」。

Knuth 的提醒被 README 引用得很贴切：几乎没有「永远最优」的排序；应用与数据形态决定谁最好。这个库把「记住并可选」做成工程接口。

## 最小用法

每个算法既有 **sorter 类型**（如 `pdq_sorter`），也有同名的**全局函数对象实例**（如 `pdq_sort`），日常可当函数用：

```cpp
#include <vector>
#include <cpp-sort/sorters/pdq_sorter.h>

void demo(std::vector<int>& v) {
    cppsort::pdq_sort(v);  // 范围接口
}
```

统一排序接口大致接受：

- **集合**：一对迭代器，或整段 range / 容器  
- **比较器**（可选）  
- **投影**（可选，类似 Ranges 的 projection：按成员或变换后的键排序）

因此「按年龄降序排半个数组」不必先手写一层包装类型——比较器 + 投影即可。多数比较排序支持投影；少数类型特化算法（如部分基数类）可能不接受比较器。

## 四大积木（先记住名字）

| 积木 | 一句话 |
|------|--------|
| **Sorter** | 排序算法的函数对象；可传递、可适配 |
| **Sorter adapter** | 包一层 sorter，改变行为（hybrid、间接排序、Schwartzian…） |
| **Probe（disorder）** | 度量序列「有多乱」（逆序对、run 数等）；已排序多为 0 |
| **Metrics** | 特殊 adapter：跑排序同时返回比较次数、耗时等 |

学习顺序建议：**Sorter → Adapter（尤其 hybrid）→ Probe → Metrics**，与 [路线图](#/note/cpp/cpp-sort/00-roadmap) 一致。

## 设计取向（读库时有用）

- **迭代器 + range 双接口**；能拿容器时直接传容器，便于利用 `size`  
- 重视 **proxy iterator**（`iter_swap` / `iter_move`），不默认要求元素默认可构造或可拷贝（可移动即可）  
- 算法目前偏**确定性**（不用随机 pivot 那类），也**无多线程排序**——利于复现实验  
- 异常：库自身倾向不抛（分配失败除外）；比较 / 投影 / 移动抛异常后，序列状态**不保证**可恢复

## 安装直觉

工程里常见：CMake `find_package` / FetchContent，或 Conan 配方 `cpp-sort`。只要编译器满足 README 列出的最低版本（如较新的 GCC/Clang，MSVC 需 `/permissive-` 等），include 即可。配置宏（断言、audit、关掉弃用警告）见 Wiki Tooling——学习阶段可先不管。

## 练习指引

1. 用任意一个 sorter 对 `std::vector` 与 `std::list` 各排一次；注意哪些算法要求随机访问。  
2. 同一数据上加 `std::greater{}` 与成员指针投影，观察结果是否符合预期。  
3. 打开 Wiki Sorters 表，给「稳定 / 不稳定」「内存 O(1) / O(n)」各挑一个候选，写进自己的对照表。

下一章：[Sorter 与库架构](#/note/cpp/cpp-sort/02-sorter-architecture)。
