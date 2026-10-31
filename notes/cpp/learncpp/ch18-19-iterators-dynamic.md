---
title: 第 18–19 章：迭代器、算法与动态分配
tags: [cpp, learncpp, cherno, iterators, memory]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 18–19 章：迭代器、算法与动态分配

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 18–19 章（源站标注建设中，要点仍有用）

## 小节地图

**第 18 章**：选择排序等手写算法动机 → 迭代器概念与半开区间 → 标准算法入门（`<algorithm>`）→ 简单计时测量。

**第 19 章**：`new` / `delete` 与动态对象 → 动态数组 `new[]` / `delete[]` → 与析构的配合 → 指针的指针与动态多维的笨重性 → `void*` 简介。

**现代立场（贯穿本章）**：理解 `new`/`delete` 的机制与危险，但**生产代码优先 RAII 与智能指针**——详见 [第 22 章：移动与智能指针](./ch22-move-smart-pointers.md)、[RAII 与所有权](../raii-and-ownership.md)。动态数组优先 `std::vector`，而非裸 `new[]`。

## 核心概念

### 为何需要迭代器

- 不同容器内存布局不同（连续数组、节点链表、树），但“遍历 / 查找 / 排序”算法不应为每种容器重写。
- **迭代器**：抽象的“指向元素的位置”，提供统一的访问与移动接口；指针是原始迭代器的原型。
- 标准约定：**半开区间** `[first, last)` —— `last` 是尾后（past-the-end），不解引用 `last`。

### 迭代器基本操作（入门集）

| 操作 | 含义（随机访问直觉） |
|------|----------------------|
| `*it` | 访问当前元素 |
| `++it` / `it++` | 移到下一元素 |
| `--it` | 前移（双向以上） |
| `it == jt` / `!=` | 位置比较 |
| `it + n` / `it[n]` | 随机访问容器支持 |

容器提供 `begin()` / `end()`（及 `cbegin`/`cend`）。范围 for 即基于这对迭代器的语法糖。

### 算法与迭代器类别（意识层）

- 输入 / 输出 / 前向 / 双向 / **随机访问** /连续（C++17/20 细化）——算法对类别有要求：`std::sort` 需要随机访问；`std::find` 只需输入迭代器。
- 入门够用：`vector`/`array` 迭代器 ≈ 指针能力；先会用 `begin`/`end` 调算法即可。

### 选择排序示例的教学意义

手写选择排序帮助理解：

1. 用下标或迭代器表示“子区间”；
2. 比较与交换的复杂度；
3. 为何随后应改用 `std::sort`（经过优化、泛型、不易写错）。

### `new` / `delete` 动态分配

```cpp
int* p = new int{42};   // 堆上分配一个 int
delete p;               // 释放
p = nullptr;            // 避免悬垂误用（良好习惯）
```

- **堆（自由存储）**：对象寿命由程序员显式控制，可越过创建它的作用域。
- `new` 失败默认抛 `std::bad_alloc`（除非 `nothrow` 版本）。
- **必须配对**：`new` ↔ `delete`；`new[]` ↔ `delete[]`；混用是 UB。
- 忘记 `delete` → 泄漏；重复 `delete` → UB；`delete` 后继续用 → 悬垂。

### 动态数组

```cpp
std::size_t n = 10;
int* a = new int[n]{};  // 值初始化
delete[] a;
```

- 长度运行期才知道时，**更应使用 `std::vector<int> a(n);`**。
- 裸 `new[]` 无法自动记长度，异常路径易泄漏，与自定义类型交互时还需正确调用析构。

### 析构与动态资源

- 类若在构造中 `new` 资源，析构中必须 `delete`；拷贝构造/赋值也需深拷贝或禁用——这是“三法则/五法则”的起源。
- 更优：**成员直接用 `vector` / `unique_ptr` / `shared_ptr`**，让编译器生成正确的特殊成员函数。

### 指针的指针、动态多维、`void*`

- `T**` 可模拟“指针数组”或锯齿二维结构，手工管理痛苦且易错。
- 优先：`vector<vector<T>>`、一维 `vector<T>` + 下标变换、或正规矩阵库。
- `void*`：类型擦除的裸地址，解引用前必须转回正确类型；现代 C++ 中更多被模板、`std::any`、多态基类等替代；C API 互操作仍常见。

### RAII 与智能指针（本章强调的正确方向）

| 需求 | 优先方案 |
|------|----------|
| 动态数组 / 可增长序列 | `std::vector` |
| 独占堆对象 | `std::unique_ptr<T>`（`std::make_unique`） |
| 共享所有权 | `std::shared_ptr<T>`（`std::make_shared`） |
| 观察不拥有 | 引用 / 裸观察指针（不负责释放）/ `weak_ptr` |

细节、移动语义与自定义 deleter 见 [ch22](./ch22-move-smart-pointers.md) 与 [raii-and-ownership.md](../raii-and-ownership.md)。

## 语法与 API

```cpp
#include <vector>
#include <algorithm>
#include <iterator>
#include <memory>
#include <chrono>
#include <iostream>

// 迭代器 + 算法
std::vector<int> v{3, 1, 4, 1, 5};
std::sort(v.begin(), v.end());
auto it = std::find(v.begin(), v.end(), 4);
if (it != v.end())
    std::cout << *it << '\n';

std::reverse(v.begin(), v.end());
auto cnt = std::count(v.begin(), v.end(), 1);

// 插入迭代器示例意识
// std::copy(src.begin(), src.end(), std::back_inserter(dst));

// 裸 new/delete（理解用）
auto* p = new double{3.14};
delete p;

auto* arr = new int[5]{1, 2, 3, 4, 5};
delete[] arr;

// 推荐替代
auto up = std::make_unique<double>(3.14);
std::vector<int> safer{1, 2, 3, 4, 5};
```

计时入门：

```cpp
using clock = std::chrono::steady_clock;
auto t0 = clock::now();
// ... 工作 ...
auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(clock::now() - t0);
std::cout << ms.count() << " ms\n";
```

## 示例

### 1. 选择排序（下标版 → 理解区间）

```cpp
#include <vector>
#include <utility>
#include <iostream>

void selection_sort(std::vector<int>& a) {
    const std::size_t n = a.size();
    for (std::size_t i = 0; i < n; ++i) {
        std::size_t min_i = i;
        for (std::size_t j = i + 1; j < n; ++j)
            if (a[j] < a[min_i]) min_i = j;
        std::swap(a[i], a[min_i]);
    }
}

int main() {
    std::vector<int> v{5, 2, 4, 1};
    selection_sort(v);
    for (int x : v) std::cout << x << ' ';
}
```

教学后续：把内层“找最小”换成迭代器，再对比 `std::sort(v.begin(), v.end())`。

### 2. 迭代器遍历与算法组合

```cpp
#include <vector>
#include <algorithm>
#include <iostream>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6};

    // 分区：偶数在前
    std::partition(v.begin(), v.end(), [](int x){ return x % 2 == 0; });

    // 条件查找
    auto it = std::find_if(v.begin(), v.end(), [](int x){ return x > 5; });
    if (it != v.end())
        std::cout << "found " << *it << '\n';

    // 全部满足？
    bool all_pos = std::all_of(v.begin(), v.end(), [](int x){ return x > 0; });
    std::cout << std::boolalpha << all_pos << '\n';
}
```

### 3. 裸 `new`/`delete` 的异常安全问题（反例）

```cpp
void fragile() {
    int* a = new int[100];
    // 若下一行抛异常，a 泄漏
    may_throw();
    delete[] a;
}
```

RAII 修复：

```cpp
#include <vector>

void robust() {
    std::vector<int> a(100);
    may_throw();   // 栈展开时 vector 析构，自动释放
}
```

或：

```cpp
#include <memory>

void also_robust() {
    auto a = std::make_unique<int[]>(100); // C++14 起支持数组版 unique_ptr
    may_throw();
}
```

### 4. `unique_ptr` 管理单个对象

```cpp
#include <memory>
#include <iostream>

struct Widget {
    explicit Widget(int id) : id_{id} { std::cout << "ctor " << id_ << '\n'; }
    ~Widget() { std::cout << "dtor " << id_ << '\n'; }
    int id_;
};

int main() {
    auto w = std::make_unique<Widget>(7);
    std::cout << w->id_ << '\n';
}   // 自动 dtor
```

### 5. 动态多维：不要手写 `T**`（对比）

```cpp
// 不推荐：手工 new 行指针
int** bad = new int*[rows];
for (int i = 0; i < rows; ++i)
    bad[i] = new int[cols]{};
// ... 使用 ...
for (int i = 0; i < rows; ++i) delete[] bad[i];
delete[] bad;

// 推荐：一维扁平
std::vector<int> good(static_cast<std::size_t>(rows * cols));
auto at = [&](int r, int c) -> int& {
    return good[static_cast<std::size_t>(r * cols + c)];
};
```

### 6. `void*` 互操作意识

```cpp
void c_api_callback(void* user) {
    auto* p = static_cast<int*>(user);
    ++(*p);
}

int main() {
    int x = 1;
    c_api_callback(&x);  // 调用方保证类型正确
}
```

在纯 C++ 边界，优先模板或类型安全回调（`std::function`、函数对象）。

### 7. 粗略计时比较手写排序与 `std::sort`

```cpp
#include <vector>
#include <algorithm>
#include <chrono>
#include <random>
#include <iostream>

int main() {
    std::mt19937 gen{42};
    std::uniform_int_distribution<int> dist(0, 1'000'000);
    std::vector<int> a(20000), b;
    for (auto& x : a) x = dist(gen);
    b = a;

    auto bench = [](auto&& fn) {
        auto t0 = std::chrono::steady_clock::now();
        fn();
        return std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now() - t0).count();
    };

    auto ms_std = bench([&]{ std::sort(a.begin(), a.end()); });
    // ms_sel = bench([&]{ selection_sort(b); });
    std::cout << "std::sort " << ms_std << " ms\n";
}
```

## 易错与陷阱

1. **`new`/`new[]` 与 `delete`/`delete[]` 混用**：UB。
2. **泄漏**：异常、早退、多个出口忘记释放——正是 RAII 要解决的。
3. **重复释放 / 释放后使用**：置 `nullptr` 不能完全救命（多个指针指向同一块时）。
4. **解引用 `end()` 迭代器**或对空区间乱玩。
5. **迭代器失效**：`vector` 扩容、`insert`/`erase` 后仍用旧迭代器。
6. **以为 `std::find` 返回下标**：返回的是迭代器；用 `it - begin` 或 `std::distance`。
7. **手写二维 `new` 只 `delete` 顶层**：行泄漏。
8. **用 `void*` 在 C++ 里到处擦类型**：失去类型检查，铸成安全灾难。
9. **在学习阶段学会 `new` 后继续到处 `new`**：应切换到 `vector` / 智能指针。
10. **计时用 `system_clock` 或未防优化**：基准测试需注意编译器把空循环优化掉；用 `steady_clock`，并对结果做可观察使用（打印 checksum）。
11. **`shared_ptr` 循环引用**（预告）：需要 `weak_ptr`；默认优先 `unique_ptr`。
12. **容器元素是裸指针拥有堆对象**：元素拷贝导致双删——应存智能指针或值。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。迭代器把「指向序列中位置」抽象成可递增、可解引用的对象；动态分配则把寿命从作用域里解放出来——两者都迫使你回答：**谁拥有这块内存**。

### 迭代器：指针的堂兄弟

```cpp
#include <iostream>
#include <vector>

void dumpScores(const std::vector<int>& scores)
{
    for (auto it = scores.begin(); it != scores.end(); ++it) {
        std::cout << *it << ' ';
    }
}
```

范围 for 是语法糖；底层仍是 begin/end。失效规则与指针类似：`vector` 重分配、`erase` 之后，旧迭代器往往作废。算法（`find`/`sort`）吃的是迭代器对，而不是容器类型本身——这是泛型的入口。

```cpp
#include <algorithm>

bool hasZero(const std::vector<int>& xs)
{
    return std::find(xs.begin(), xs.end(), 0) != xs.end();
}
```

### `new[]` / `delete[]` 的纪律

```cpp
int* histogram = new int[64]{};
histogram[3] = 9;
delete[] histogram;
histogram = nullptr;
```

漏 `[]`、重复释放、释放后继续用，都是经典 UB。Cherno 会演示堆与栈的速度与确定性差异：堆分配更贵、可能失败、寿命手动；能用 `vector`/`unique_ptr<T[]>`/`std::make_unique` 就不要长期裸奔。

```cpp
#include <memory>

auto bins = std::make_unique<int[]>(64);
bins[0] = 1; // 离开作用域自动释放
```

### 自定义资源包装的方向

若必须自己管动态缓冲，把指针藏进类，在析构释放，并禁用或正确实现拷贝——这是 RAII 预习。正文若已讲 `std::vector` 增长与迭代器类别，本节不重复 API 表，只强调：

- 动态内存 = 所有权问题；
- 迭代器 = 位置问题；
- 两者交叉时（持有指向 vector 元素的迭代器跨过 `push_back`）最容易炸。

调试建议：对可疑堆代码开 AddressSanitizer；对迭代器失效，优先把「容器操作」和「持有迭代器的窗口」画在时间线上。

## 练习指引

- 用迭代器重写选择排序；再换成 `std::sort`，对比代码量与正确性。
- 对同一 `vector` 练习：`find` / `count` / `reverse` / `unique`+`erase` 去重模式。
- 写一个故意泄漏的 `new[]` 函数，再用 `vector` 与 `unique_ptr` 各修复一版。
- 实现扁平矩阵类：私有 `vector<T>` + `rows/cols` + `at(r,c)`，禁止暴露需要 `delete` 的接口。
- 阅读 [ch22](./ch22-move-smart-pointers.md) 与 [raii-and-ownership.md](../raii-and-ownership.md)，列出“本章裸 `new` 示例 → 对应现代写法”对照表。
- 用 `steady_clock` 测量：已排序 / 逆序 / 随机数据下 `std::sort` 的耗时差异（感受输入敏感度）。

## 小结

- 迭代器把“遍历位置”从具体容器中抽象出来；算法吃 `[begin, end)`。
- 先理解再弃用：`new`/`delete` 展示堆寿命与错误模式；日常代码用 `vector` 与智能指针。
- 动态多维与 `void*` 属于“知道存在、默认避开”的工具。
- 异常安全与所有权清晰，靠的是 RAII，而不是更多手工 `delete`。
- 下一站：移动语义与智能指针体系（[ch22](./ch22-move-smart-pointers.md)），把本章的教训变成默认工程实践。
