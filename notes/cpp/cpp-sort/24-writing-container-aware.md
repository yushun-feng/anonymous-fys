---
title: 实作容器感知排序算法
tags: [cpp, cpp-sort, adapter, container-aware, tutorial]
topic: cpp
updated: 2026-11-08
order: 24
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Writing-a-container-aware-algorithm
---

# 实作容器感知排序算法

> 出处：[Wiki · Writing a container-aware algorithm](https://github.com/Morwenn/cpp-sort/wiki/Writing-a-container-aware-algorithm)  
> 上一篇：[23 randomizing_adapter](#/note/cpp/cpp-sort/23-writing-randomizing-adapter) · 架构：[02](#/note/cpp/cpp-sort/02-sorter-architecture)

仅靠迭代器有时不够：`std::list` / `std::forward_list` 的 O(1) splice 等能力，通用迭代器排序用不上。**cpp-sort** 用 `container_aware_adapter` 让 sorter「认出」特定容器，并走专用实现。

## 场景

自定义 list（接口同 `std::list`）上做 **selection sort**：用 `splice` 把最小节点接到当前位置，避免昂贵的元素移动。

```cpp
namespace example
{
    template<typename T, typename Allocator>
    class list
    {
        // Exactly like std::list
    };
}
```

专用算法示意（支持比较器；教程未加投影，因缺少投影增强的标准库时较麻烦）：

```cpp
namespace example
{
    template<typename T, typename Allocator, typename Compare = std::less<>>
    auto list_selection_sort(list<T, Allocator>& collection, Compare compare = {})
        -> void
    {
        auto&& comp = cppsort::utility::as_function(compare);

        auto it = std::begin(collection);
        auto last = std::end(collection);
        while (it != last) {
            auto min_it = std::min_element(it, last, comp);
            if (min_it == it) {
                ++it;
            } else {
                collection.splice(it, collection, min_it);
            }
        }
    }
}
```

## 定制点：命名空间里的 ADL `sort`

`container_aware_adapter` 靠 **ADL** 在容器所在命名空间查找合适的 `sort`。约定：

1. **第一参数**：被「过载」的 sorter（如 `cppsort::selection_sorter`）  
2. **第二参数**：待排容器  
3. 其后可跟比较器、投影  

adapter 侧复用了不少 `sorter_facade` 的重载生成规则，尽量在能调用时就走到专用算法。

把上面算法接到定制点：

```cpp
namespace example
{
    template<typename T, typename Allocator, typename Compare = std::less<>>
    auto sort(cppsort::selection_sorter, list<T, Allocator>& collection,
              Compare compare = {})
        -> void
    {
        auto&& comp = cppsort::utility::as_function(compare);

        auto it = std::begin(collection);
        auto last = std::end(collection);
        while (it != last) {
            auto min_it = std::min_element(it, last, comp);
            if (min_it == it) {
                ++it;
            } else {
                collection.splice(it, collection, min_it);
            }
        }
    }
}
```

之后用 `container_aware_adapter` 包住 `selection_sorter`（或库已提供的容器感知包装），对 `example::list` 排序时会命中上述 `sort`。

## 设计笔记

| 点 | 含义 |
|----|------|
| 发现机制 | ADL `sort`，不是虚函数表或 trait 特化表 |
| 第一个参数 | **tag / sorter 类型**，区分「为哪种算法定制」 |
| `as_function` | 统一函数对象 / 函数指针调用形态 |
| 未来方向（上游备注） | 可能再加 `stable_sort` 定制点，并在有 ADL `stable_sort` 无 `sort` 时回退 |

实现量大，上游称短期内未必完成；学习者先掌握「ADL `sort(sorter, container, …)`」即可。

## 与迭代器版的关系

- 通用路径：只见迭代器，无法 splice。  
- 容器感知路径：拿到整容器引用，可改拓扑。  
- 选型时：元素便宜移动时，list 成员 `sort` / 节点重链未必赢「拷到连续缓冲再 `pdq`」——见 [26 Benchmarks](#/note/cpp/cpp-sort/26-benchmarks) 双向/前向容器一节。

站内相关：[03 代表算法](#/note/cpp/cpp-sort/03-representative-algorithms) · [28 原创研究摘要](#/note/cpp/cpp-sort/28-original-research)。
