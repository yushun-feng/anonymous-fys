---
title: cpp-sort 快速上手
tags: [cpp, cpp-sort, quickstart, sorter, adapters]
topic: cpp
updated: 2026-11-08
order: 6
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Quickstart
---

# 快速上手

> 出处：[Wiki · Quickstart](https://github.com/Morwenn/cpp-sort/wiki/Quickstart)  
> 安装渠道见 [Tooling](https://github.com/Morwenn/cpp-sort/wiki/Tooling)（CMake / Conan）。概念对照：[01 概览](#/note/cpp/cpp-sort/01-overview) · [02 架构](#/note/cpp/cpp-sort/02-sorter-architecture)。

本页把「先能排起来」所需的积木串成一条最短路径：选算法 → 理解 sorter 对象 → 套一层 adapter → 可选 metrics / 两步排序 / disorder probe。

## 最简排序

```cpp
#include <vector>
#include <cpp-sort/sorters/pdq_sorter.h>

int main() {
    std::vector<int> collection = { /* ... */ };
    cppsort::pdq_sort(collection);
}
```

`pdq_sort` 只要**随机访问**迭代器；`list` 一类应换 `quick_sort` / `merge_sort`，或用 adapter（见下）。完整算法表见 [08 Sorters](#/note/cpp/cpp-sort/08-sorters)。

统一接口参数：

- 集合：一对迭代器，或整个 range / 容器  
- 比较器（可选）  
- 投影（可选）

## 比较器 + 投影示例

```cpp
#include <functional>
#include <list>
#include <string>
#include <tuple>
#include <vector>
#include <cpp-sort/comparators/flip.h>
#include <cpp-sort/sorters/quick_sorter.h>

struct Person {
    std::string name;
    int age;

    friend bool operator<(Person const& lhs, Person const& rhs) {
        return std::tie(lhs.name, lhs.age) < std::tie(rhs.name, rhs.age);
    }
};

void demo(std::vector<Person>& persons) {
    using cppsort::quick_sort;

    quick_sort(persons);                                    // 默认 operator<
    quick_sort(persons, cppsort::flip(std::less{}));        // 逆序
    quick_sort(persons.begin(), persons.begin() + 50,
               &Person::age);                               // 前半按年龄升序
    quick_sort(persons.begin() + 50, persons.end(),
               std::greater{}, &Person::age);               // 后半按年龄降序

    std::list<Person> li(persons.begin(), persons.end());
    quick_sort(li.begin(), li.end());  // 双向迭代器也可
    quick_sort(li);                    // 直接传容器可利用 size，少做一遍探测
}
```

多数算法是**比较排序**；少数如 `ska_sort` **不接受**比较器。几乎所有 sorter 支持投影。上述参数组合合称 **unified sorting interface**。

## 为何是 Sorter 对象

每个算法是某个 `*_sorter` 类型的实例（如 `quick_sort` ↔ `quick_sorter`）。好处：

1. 整包 overload set 可当值传入泛型（数比较次数、做基准）。  
2. Adapter 以「吃 Sorter、吐 Sorter」组合行为。  
3. 无状态 sorter 常可**退化成函数指针**。

```cpp
template<typename Sorter, typename Iterator>
int sort_count_comparisons(Sorter& sorter, Iterator first, Iterator last) {
    int count = 0;
    auto cmp = [&count](auto const& lhs, auto const& rhs) {
        ++count;
        return lhs < rhs;
    };
    sorter(first, last, cmp);
    return count;
}
```

```cpp
void (*sort)(std::forward_list<int>&, std::negate<>) = cppsort::mel_sort;
```

官方 sorter 多靠 `sorter_facade` 生成样板；日常用库不必直接碰 facade，自写时才需要。

## Adapter 四则速览

`#include <cpp-sort/adapters.h>` 可一次引入。典型动机：

**异地排（弱迭代器 → 随机访问算法）**

```cpp
auto sorter = cppsort::out_of_place_adapter<cppsort::smooth_sorter>{};
std::list<int> collection = { /* ... */ };
sorter(collection);
```

**贵投影 → Schwartzian**

```cpp
auto sorter = cppsort::schwartz_adapter<cppsort::poplar_sorter>{};
sorter(collection, expensive_projection);
```

**少搬大对象 → 间接排序**

```cpp
auto sorter = cppsort::indirect_adapter<cppsort::pdq_sorter>{};
sorter(huge_objects);
```

**加 Rem 自适应 → `split_adapter`**

```cpp
auto sorter = cppsort::split_adapter<cppsort::quick_merge_sorter>{};
sorter(collection);
```

限制直觉：迭代器类别要匹配；有的 adapter 要求底层能比/能投影；fixed-size adapter 只包 fixed-size sorter。细节见 [10](#/note/cpp/cpp-sort/10-sorter-adapters)。

## Metrics（特殊 adapter）

调用后返回带 `.value()` 的度量，而不是「排完丢弃」：

```cpp
auto sorter = cppsort::metrics::comparisons<cppsort::slab_sorter>{};
auto comps = sorter(collection);
// comps.value() → 比较次数

auto timed = cppsort::metrics::running_time<cppsort::mel_sorter>{};
auto elapsed = timed(collection);
// elapsed.value() → 耗时
```

适合微型实验；重度基准仍可用 Google Benchmark 等。

## 两步排序（并行数组 / SoA）

1. `utility::sorted_indices`：类似 `numpy.argsort`，得到排序下标。  
2. `utility::apply_permutation`：按同一套下标重排各数组。

```cpp
std::vector<std::string> names = { /* ... */ };
std::vector<int> ages = { /* ... */ };

auto get_sorted_indices_for =
    cppsort::utility::sorted_indices<cppsort::poplar_sorter>{};
auto indices = get_sorted_indices_for(names);
cppsort::utility::apply_permutation(names, auto(indices));  // 拷一份下标
cppsort::utility::apply_permutation(ages, indices);         // 注意：会改写 indices
```

一次 \(O(n\log n)\) 排序 + 每列一次 \(O(n)\) 置换。`apply_permutation` 会改写下标缓冲，多列时记得拷贝。

## Measures of disorder（probe）

`cppsort::probe::*` 实现统一接口，返回整型 disorder；已排序多为 0：

```cpp
std::cout << cppsort::probe::inv(collection) << '\n'   // 逆序对
          << cppsort::probe::runs(collection) << '\n'  // run 数
          << cppsort::probe::enc(collection) << '\n';  // encroaching lists
```

若数据在某种度量 \(M\) 下「不太乱」，优先考虑 \(M\)-adaptive 算法或 Rem-adaptive adapter。

## 练习指引

1. 对 `vector` / `list` 各用合适 sorter 排一次。  
2. 用包装比较器数比较次数，对比 `heap_sort` 与 `merge_sort`。  
3. 任选一个 adapter，记录它如何改写稳定性与最低迭代器要求。

上一篇：[05 通用约定](#/note/cpp/cpp-sort/05-home-general) · 下一篇：[07 术语表](#/note/cpp/cpp-sort/07-library-nomenclature)。
