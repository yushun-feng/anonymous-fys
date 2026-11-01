---
title: 第 22 章：移动语义与智能指针
tags: [cpp, learncpp, cherno, move, smart-pointers, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 22 章：移动语义与智能指针

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 22 章  
> 相关：[RAII 与所有权](../raii-and-ownership.md)  
> Cherno 要点已融入下文「Cherno 视角补充」；剧集索引：[智能指针](../cherno/09-smart-pointers.md)、[现代工具与移动](../cherno/15-modern-utilities.md)。
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 章节地图

| 主题 | 要点 |
|------|------|
| 为何需要移动 | 昂贵资源「搬」而非「拷」；返回值优化与所有权转移 |
| 左值 / 右值 | 可取址的持久对象 vs 临时 / 将亡值 |
| 右值引用 `T&&` | 绑定将亡对象；实现移动构造/赋值 |
| `std::move` | 无条件转为右值引用（不移动，只是转换） |
| `unique_ptr` | 独占所有权；可移动不可拷贝 |
| `shared_ptr` / `weak_ptr` | 共享所有权；破环用弱引用 |
| `make_unique` / `make_shared` | 异常安全与习惯用法 |

## 核心概念

### 1. 拷贝的代价与移动的动机

管理堆内存、文件句柄、套接字的对象，拷贝往往意味着深拷贝整块资源。C++11 **移动语义**允许把资源所有权从源对象「偷」到目标对象，源进入有效但未指定（通常为空）的状态。

典型受益者：`std::string`、`std::vector`、任何遵循 RAII 的资源包装器。

### 2. 值类别（实用视角）

- **左值（lvalue）**：有名字、可取地址、可出现在赋值左边的表达式（变量、`*ptr` 等）。  
- **右值（rvalue）**：临时对象、字面量、将亡值（如 `std::move(x)` 的结果）。  
- **右值引用 `T&&`**：优先绑定右值，用于重载移动版本。

```cpp
void f(const std::string&);  // 左值 / 右值都能绑（只读）
void f(std::string&&);       // 只抢右值，移动版

std::string s = "hi";
f(s);                        // 走 const&
f(std::string{"tmp"});       // 走 &&
f(std::move(s));             // 走 &&；此后不要假定 s 的内容
```

转发引用（万能引用）长得像 `T&&`，但是在**模板类型推导**语境下：`template<class T> void g(T&&)`。与「右值引用参数」不要混淆。

### 3. 移动构造与移动赋值

```cpp
class Buffer {
public:
  Buffer() = default;
  explicit Buffer(std::size_t n) : data_(new int[n]{}), size_(n) {}

  Buffer(const Buffer& other)            // 拷贝：深拷贝
    : data_(new int[other.size_]{}), size_(other.size_) {
    std::copy(other.data_, other.data_ + size_, data_);
  }

  Buffer(Buffer&& other) noexcept        // 移动：偷指针
    : data_(other.data_), size_(other.size_) {
    other.data_ = nullptr;
    other.size_ = 0;
  }

  Buffer& operator=(Buffer&& other) noexcept {
    if (this != &other) {
      delete[] data_;
      data_ = other.data_;
      size_ = other.size_;
      other.data_ = nullptr;
      other.size_ = 0;
    }
    return *this;
  }

  ~Buffer() { delete[] data_; }

  Buffer& operator=(const Buffer&) = delete; // 示例：禁止拷贝

private:
  int* data_{nullptr};
  std::size_t size_{0};
};
```

要点：

- 移动操作通常标 `noexcept`，以便 `vector` 等在扩容时选择移动而非拷贝。  
- 移后源必须可安全析构、可赋值。  
- 若自定义了析构/拷贝/移动中任何一个，审视「五法则」：拷贝构造、拷贝赋值、移动构造、移动赋值、析构。

### 4. `std::move` 与 `std::forward`

```cpp
#include <utility>

std::string a = "hello";
std::string b = std::move(a);  // 把 a 当右值；a 此后可能为空
```

`std::move(x)` **不移动任何东西**，只是 `static_cast<T&&>(x)`。真正移动发生在移动构造/赋值被选中时。

完美转发：

```cpp
template<class T>
void wrapper(T&& v) {
  sink(std::forward<T>(v)); // 保持左/右值性
}
```

### 5. `std::unique_ptr`：独占所有权

```cpp
#include <memory>

auto p = std::make_unique<int>(42);
std::unique_ptr<int> q = std::move(p); // 所有权转移；p 变为空
// auto r = q;                        // 错误：不可拷贝

void take(std::unique_ptr<int> owned); // 按值接收 = 转移所有权
take(std::move(q));
```

- 析构时 `delete`（可自定义删除器）。  
- 数组：`std::unique_ptr<int[]>` / `make_unique<int[]>(n)`（C++14+）。  
- 从函数返回 `unique_ptr` 是表达「交出所有权」的标准方式。  
- 工厂函数优先 `make_unique`：异常安全、避免显式 `new`。

与裸指针接口交互时用 `.get()`；**不要**再用 `delete` 裸指针。释放所有权用 `release()`（少用，易泄漏）。

### 6. `std::shared_ptr`：共享所有权

```cpp
auto a = std::make_shared<Widget>();
std::shared_ptr<Widget> b = a;  // 引用计数 +1
// 最后一个 shared_ptr 销毁时释放对象
```

- 控制块保存引用计数与删除器；`make_shared` 常把对象与控制块一次分配，更高效。  
- **不要**用同一个裸指针构造两个无关的 `shared_ptr`（会双重删除）。应从已有 `shared_ptr` 拷贝，或用 `shared_from_this`（需继承 `enable_shared_from_this`）。  
- 循环引用：A 持有 `shared_ptr` 到 B，B 持有 `shared_ptr` 到 A → 永远不释放。

### 7. `std::weak_ptr`：破环与观察

```cpp
std::weak_ptr<Widget> wp = a;
if (auto sp = wp.lock()) {
  // 提升成功：对象仍在
  sp->use();
} else {
  // 对象已销毁
}
```

`weak_ptr` 不增加拥有计数，只观察。缓存、观察者列表、父←子反向链接常用 `weak_ptr`。

### 8. 选型速查

| 场景 | 选择 |
|------|------|
| 唯一所有者、可转移 | `unique_ptr`（默认首选） |
| 多方共享寿命 | `shared_ptr` |
| 可能悬空的非拥有观察 | `weak_ptr` 或裸观察指针（文档约定） |
| 栈上值语义即可 | 直接对象 / 容器，不必智能指针 |

详见 [RAII 与所有权](../raii-and-ownership.md)。

## 语法与 API

```cpp
std::make_unique<T>(args...);
std::make_shared<T>(args...);

ptr.get();       // 裸指针观察
ptr.reset();     // 释放并置空
ptr.reset(raw);  // 接管（谨慎）
ptr.release();   // unique_ptr：放弃所有权，不删除
use_count();     // shared_ptr 近似计数（调试用）
wp.expired();    // weak_ptr 是否已失效
```

C++14：`make_unique`；C++17：`shared_ptr` 对数组有更好支持；C++20：`make_unique_for_overwrite` 等。新代码默认按 C++17/20 心智模型即可。

## 综合示例

```cpp
#include <iostream>
#include <memory>
#include <utility>
#include <vector>

struct Node {
  int value;
  std::unique_ptr<Node> next;
  explicit Node(int v) : value(v) {}
};

std::unique_ptr<Node> make_list(std::initializer_list<int> xs) {
  std::unique_ptr<Node> head;
  for (auto it = xs.end(); it != xs.begin();) {
    --it;
    auto n = std::make_unique<Node>(*it);
    n->next = std::move(head);
    head = std::move(n);
  }
  return head;
}

struct Student;
struct Course {
  std::string name;
  std::vector<std::shared_ptr<Student>> students;
};
struct Student {
  std::string name;
  std::vector<std::weak_ptr<Course>> courses; // 避免环
};

int main() {
  auto list = make_list({1, 2, 3});
  for (auto* p = list.get(); p; p = p->next.get()) {
    std::cout << p->value << ' ';
  }
  std::cout << '\n';

  std::vector<std::unique_ptr<std::string>> bag;
  bag.push_back(std::make_unique<std::string>("alpha"));
  auto moved = std::move(bag[0]); // 容器元素可被移出
  std::cout << *moved << '\n';
}
```

## 易错与陷阱

1. **移动后继续使用源对象的值**：合法但危险；只允许赋值或销毁，或按文档处于「空」状态再使用。  
2. **忘记 `noexcept` 移动**：`vector` 可能退化为拷贝，性能与异常安全变差。  
3. **`unique_ptr` 拷贝心态**：必须 `std::move`；按值传参即移交所有权。  
4. **`shared_ptr` 循环引用**：用 `weak_ptr` 打断。  
5. **`shared_ptr<T>(raw)` 重复包装同一 `new`**：双重删除。  
6. **`make_unique` 与自定义删除器**：`make_unique` 不支持自定义删除器，需直接构造 `unique_ptr`。  
7. **把 `unique_ptr` 存入容器后拿裸指针长期用**：元素移动/擦除后裸指针失效。  
8. **混淆 `T&&` 成员与模板转发引用**：非模板的 `void f(std::string&&)` 只收右值。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。移动语义解决「昂贵资源不该傻拷贝」；智能指针解决「谁 delete」。Cherno 路线把两者接到同一所有权故事：先弄清拥有者，再谈共享。

### 移动 = 偷资源，留下合法空壳

```cpp
#include <utility>
#include <vector>

std::vector<int> buildPalette()
{
    std::vector<int> colors{8, 16, 32};
    return colors; // 通常移动或 NRVO，而不是深拷贝缓冲
}

void ingest(std::vector<int> batch)
{
    auto local = std::move(batch); // batch 此后勿当还有内容用
    (void)local;
}
```

`std::move` 不移动任何东西——它把表达式标成可被窃取的右值。被移从对象应保持有效但未指定状态；典型习惯是立刻不再读它的「旧内容」。

### 指针选型（实战缩略）

| 类型 | 含义 |
|------|------|
| `unique_ptr` | 独占；可移动不可拷贝；默认首选 |
| `shared_ptr` | 共享所有权；有控制块开销；慎用成「到处 shared」 |
| `weak_ptr` | 不延长寿命；观察与破环 |

```cpp
#include <memory>

struct TextureAtlas {
    static std::unique_ptr<TextureAtlas> load(const char* path)
    {
        return std::make_unique<TextureAtlas>(/* path */);
    }
    explicit TextureAtlas(const char*) {}
};

void bind(std::unique_ptr<TextureAtlas> atlas)
{
    // 所有权传入即接管
    (void)atlas;
}
```

工厂返回 `unique_ptr`；需要共享再在明确边界 `std::shared_ptr` 化。循环引用用 `weak_ptr` 掐断。正文已有综合示例与选型表——补充 Cherno 口径：**先 unique，证明需要共享再用 shared；裸 `new` 只短暂出现在接管点**。

### 性能旁注

移动不是免费魔法：指针级移动很便宜，但「移动」若仍触发深拷贝（实现拙劣或类型不可移动）就骗了自己。测热点时对比拷贝/移动/就地构造，不要只看关键词。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 RAII / copy-and-swap 惯用法与 C++11 右值/移动示例，以及现代 C++ 课程中的智能指针对照。

### RAII

资源获取即初始化：构造拿资源，析构释资源；栈展开（含异常）时自动清理。`string`/`vector`/`lock_guard`/`unique_ptr` 都是同一思想。

### 移动在解决什么

- 昂贵资源（缓冲、句柄）不该在传递时傻拷贝。
- `T&&` / `std::move` 把「我不再需要这个源」说给编译器；移动后源处于有效但未指定状态。
- 返回局部对象优先靠隐式移动/RVO，少手写多余的 `std::move` 回头坑。

### copy-and-swap 赋值

强异常安全的经典写法：按值接收（或局部拷贝）→ `swap` 与 `*this` → 临时带走旧资源。

```cpp
class Buf {
public:
    Buf& operator=(Buf other) noexcept
    {
        swap(other);
        return *this;
    }
    void swap(Buf& o) noexcept { /* 交换指针/大小，不抛 */ }
};
```

需要自赋值安全、且拷贝可能抛时，这一惯用法特别省心。智能指针选型仍遵循正文：默认 `unique_ptr`，明确共享再用 `shared_ptr`，环用 `weak_ptr` 掐断。

## 练习指引

1. 为「堆上 int 数组」手写移动构造/赋值，禁止拷贝，测 `vector<Buffer>` 扩容。  
2. 工厂函数返回 `unique_ptr<Shape>`，在 `main` 里转移到容器。  
3. 构造 `shared_ptr` 环并观察泄漏；改一处为 `weak_ptr` 验证释放。  
4. 比较 `new` + `shared_ptr` 构造 vs `make_shared` 的写法差异。  
5. 实现 `swap` 友好的移动赋值（移动构造到临时再交换）。  
6. 结合下文 Cherno 视角与视频索引中的例子，用 `unique_ptr` 重写一轮裸 `new`/`delete` 代码。

## 小结

- 移动语义把「资源所有权转移」变成一等公民；`std::move` 只做类型转换。  
- 默认首选 `unique_ptr` + `make_unique`；共享寿命再用 `shared_ptr`。  
- `weak_ptr` 解决观察与环状依赖。  
- 自定义资源类遵循五法则，移动标 `noexcept`。  
- 所有权模型与 RAII 一体：见 [RAII 与所有权](../raii-and-ownership.md)。

下一章：[第 23–25 章 对象关系 / 继承 / 虚函数](./ch23-25-oop-hierarchy.md)。
