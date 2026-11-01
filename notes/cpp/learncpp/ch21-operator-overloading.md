---
title: 第 21 章：运算符重载
tags: [cpp, learncpp, cherno, operator-overloading, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 21 章：运算符重载

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 21 章
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 章节地图

| 主题 | 要点 |
|------|------|
| 重载原则 | 不能发明新运算符；至少一个操作数是用户类型；保持语义直觉 |
| 成员 / 友元 / 普通函数 | 左操作数类型决定选型；对称运算常用非成员 |
| 算术与复合赋值 | `+` 与 `+=` 成对实现 |
| I/O | `operator<<` / `>>` 必须是非成员 |
| 一元 / 比较 / 自增 | 前缀后缀约定；C++20 可简化比较 |
| 下标 / 调用 / 转换 | `[]`、`()`、转换运算符 |
| 赋值与拷贝 | 深浅拷贝；拷贝赋值自赋值安全 |
| 何时不重载 | 语义不清、可读性下降时坚决不写 |

## 核心概念

### 1. 能做什么、不能做什么

- **可以**重载绝大多数已有运算符（`+`、`==`、`<<` 等）。  
- **不能**重载：`::`、`.`、`.*`、`?:`；也不能创建新符号（如 `**`）。  
- 重载不改变优先级、结合性、操作数个数。  
- 至少有一个操作数是类类型（或枚举）；不能只重载内置类型之间的运算。

设计准则：**让重载后的运算符行为接近内置语义**。`+` 应像加法（最好不改左操作数），`==` 应是等价关系，`<<` 用于流输出时不要顺便改无关状态。

### 2. 成员 vs 非成员（含 friend）

```cpp
class Fraction {
public:
  Fraction(int n, int d) : num_(n), den_(d) {}

  // 成员：左操作数必须是 Fraction
  Fraction operator-() const { return {-num_, den_}; }

  Fraction& operator+=(const Fraction& rhs) {
    num_ = num_ * rhs.den_ + rhs.num_ * den_;
    den_ *= rhs.den_;
    return *this;
  }

  friend std::ostream& operator<<(std::ostream& os, const Fraction& f);
  friend Fraction operator+(Fraction a, const Fraction& b);

private:
  int num_, den_;
};
```

选型经验：

| 情况 | 建议 |
|------|------|
| 需要改左操作数（`+=`、`=`、`[]`、`()`、`->`） | 成员 |
| 左操作数可能是其他类型（`std::cout << obj`、`2 * frac`） | 非成员（常为 friend） |
| 对称二元运算（`+`、`==`） | 非成员，便于隐式转换作用在左侧 |
| 一元 `-`、前置 `++` | 通常成员 |

`friend` 只是授权访问私有成员，不是「必须」；若有公开观察器，也可用普通非成员函数。

### 3. 算术：用 `+=` 实现 `+`

惯用写法减少重复、保证一致性：

```cpp
Fraction operator+(Fraction a, const Fraction& b) {
  a += b;   // 复用成员 +=
  return a; // a 已是按值形参，可 NRVO / 移动
}
```

同理：`-=`/`-`、`*=`/`*`、`/=`/`/`。复合赋值返回 `*this` 的引用；二元算术返回新值。

### 4. 输入输出

```cpp
std::ostream& operator<<(std::ostream& os, const Fraction& f) {
  return os << f.num_ << '/' << f.den_;
}

std::istream& operator>>(std::istream& is, Fraction& f) {
  int n{}, d{};
  char slash{};
  if (is >> n >> slash >> d && slash == '/' && d != 0) {
    f = Fraction{n, d};
  } else {
    is.setstate(std::ios::failbit);
  }
  return is;
}
```

必须返回流引用以支持链式 `std::cout << a << b`。失败时应设置流状态，而不是默默忽略。

### 5. 比较运算符

```cpp
bool operator==(const Fraction& a, const Fraction& b) {
  return a.num() * b.den() == b.num() * a.den(); // 假设有 getter 或 friend
}
bool operator!=(const Fraction& a, const Fraction& b) { return !(a == b); }
```

C++20 起可用默认三路比较大幅简化：

```cpp
auto operator<=>(const Fraction&) const = default; // 成员，按成员字典序
bool operator==(const Fraction&) const = default;
```

自定义类型若语义不是「成员逐一比」，仍应手写；不要为了省事默认错误的排序。

### 6. 自增自减：前缀与后缀

```cpp
class Counter {
public:
  Counter& operator++() {    // 前置：++c
    ++value_;
    return *this;
  }
  Counter operator++(int) {  // 后置：c++ ；哑元 int 仅作区分
    Counter tmp{*this};
    ++(*this);
    return tmp;
  }
private:
  int value_{0};
};
```

前置返回引用；后置返回旧值的副本。能写前置就别滥用后置（多一次拷贝）。

### 7. 下标、函数调用、类型转换

```cpp
class IntArray {
public:
  int& operator[](std::size_t i) { return data_.at(i); }
  const int& operator[](std::size_t i) const { return data_.at(i); }

  void operator()(int scale) { /* 像函数一样调用对象 */ }

  explicit operator bool() const { return !data_.empty(); } // 显式转换更安全
private:
  std::vector<int> data_;
};
```

- `operator[]` 通常提供 const / 非 const 重载。  
- `operator()` 用于函数对象（仿函数）、构建器、矩阵下标代理等。  
- 转换运算符优先 `explicit`，避免意外参与重载决议（`explicit operator bool` 仍可用于 `if (obj)`）。

### 8. 拷贝赋值与深浅拷贝

管理裸资源的类必须自定义拷贝/移动（三/五法则）。赋值要注意**自赋值**：

```cpp
String& operator=(const String& other) {
  if (this == &other) return *this;
  // 释放旧资源，深拷贝 other ...
  return *this;
}
```

更好的现代写法：拷贝交换惯用（copy-and-swap）或直接遵循 RAII + `unique_ptr`，让编译器生成的特殊成员正确工作。

### 9. 何时不要重载

- 运算符语义与领域习惯不符（用 `+` 表示「把用户加入数据库」）。  
- 仅能省几个字符却让读者困惑。  
- 隐藏昂贵操作（看起来像廉价 `+`，实际网络请求）。  
- 可用命名函数更清晰时（`Matrix::multiply` vs 含混的 `*`）。  

**宁可用清晰的成员函数，也不要「炫技式」重载。**

## 语法与 API 要点

```cpp
// 成员二元
T operator+(const T& rhs) const;

// 非成员二元
friend T operator+(T lhs, const T& rhs);

// 流
friend std::ostream& operator<<(std::ostream&, const T&);

// 赋值
T& operator=(const T&);
T& operator=(T&&) noexcept;

// 下标 / 调用
U& operator[](std::size_t);
R operator()(Args...);
```

运算符可作为函数模板；注意 ADL（实参依赖查找）对非成员运算符的重要性——把运算符放在与操作数同一命名空间。

## 综合示例

```cpp
#include <iostream>
#include <compare>

class Point {
public:
  Point(int x = 0, int y = 0) : x_(x), y_(y) {}

  Point& operator+=(const Point& r) {
    x_ += r.x_; y_ += r.y_;
    return *this;
  }

  Point operator-() const { return {-x_, -y_}; }

  auto operator<=>(const Point&) const = default;
  bool operator==(const Point&) const = default;

  friend Point operator+(Point a, const Point& b) { return a += b; }
  friend std::ostream& operator<<(std::ostream& os, const Point& p) {
    return os << '(' << p.x_ << ',' << p.y_ << ')';
  }

private:
  int x_, y_;
};

int main() {
  Point a{1, 2}, b{3, 4};
  std::cout << (a + b) << ' ' << -a << '\n';
  std::cout << std::boolalpha << (a < b) << '\n';
}
```

## 易错与陷阱

1. **把 `<<` 写成成员**：左侧是 `ostream`，成员版本要求 `obj << cout`，完全反了。  
2. **`operator=` 不返回 `*this`**：无法链式赋值 `a = b = c`。  
3. **后置自增返回引用**：引用的是即将被改或已销毁的临时——错误。  
4. **违反交换律预期**：只提供成员 `frac * 2`，却不能写 `2 * frac`；应用非成员。  
5. **隐式转换运算符过宽**：无 `explicit` 的 `operator int()` 会制造可怕的重载歧义。  
6. **浅拷贝指针成员**：两个对象析构 double-free；用智能指针或深拷贝。  
7. **自赋值未处理**：`a = a` 先释放再读，UB。  
8. **改变运算符优先级幻觉**：括号该加还是得加；重载不改语法结构。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。运算符重载让类型「用起来像内建」；Cherno 的警告同样经典：**别为了炫技让 `+` 做 `+` 以外的事**。

### 保持直觉语义

```cpp
struct PixelCoord {
    int x{};
    int y{};
};

PixelCoord operator+(PixelCoord a, PixelCoord b)
{
    return PixelCoord{a.x + b.x, a.y + b.y};
}

bool operator==(PixelCoord a, PixelCoord b)
{
    return a.x == b.x && a.y == b.y;
}
```

`+` 应近似可交换的组合；`==` 应是等价关系；`<<` 用于流输出时保持「写入」含义。隐藏副作用（`+` 居然写磁盘）会毁可读性。

### 成员 vs 非成员

左操作数需要隐式转换时，对称二元运算常做成非成员（或 `friend`）。赋值、下标、调用、箭头通常必须是成员。返回值：`+` 返回新值；`+=` 返回 `*this` 引用以便链式。

### `->` 与代理对象

智能指针/迭代器重载 `->` 时，记得它是「找到下一个箭头」的链式规则——正文语法处已述。工程上先保证普通成员函数 API 清晰，再考虑是否值得提供运算符糖。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 实战练习中的运算符重载题（流、自增、强制转换、下标等）。语法学会之后，仓库强调的是**像内建一样用、像内建一样安全**。

### 实战选型

- `operator<<` / `>>` 常做成非成员（必要时 `friend`），左操作数是流。
- 自增分前置/后置：后置多一个哑元 `int`，通常用前置实现后置并返回旧值副本。
- 转换运算符考虑 `explicit`，避免一路隐式转换到不想要的类型。
- `operator[]` 提供 `const` 与非 `const` 两份；代理对象可表达「只读/可写」视图。

把 learncpp 规则练熟后，可挑仓库 `practical_exercises/key_exercises` 里相关题目做对照练习（改写到自己的例子，勿整文件搬进本库）。

## 练习指引

1. 实现不可约分数类：四则运算、比较、`<<`/`>>`。  
2. 为二维向量实现 `+`、`+=`、点积（命名函数）与标量乘（非成员，支持 `2 * v`）。  
3. 写一个迷你字符串类的 `operator[]` 与拷贝赋值，刻意测自赋值。  
4. 实现前缀/后缀 `--`，并说明为何算法里偏好前置。  
5. 尝试用 C++20 `operator<=>` 默认生成，再改成「只比长度」的自定义顺序。  
6. 找一个「不该重载」的 API 设计案例，改写成命名函数并对比可读性。

## 小结

- 重载是语法糖，责任是**保持直觉语义**。  
- I/O 与对称二元运算用非成员；会改左值的用成员。  
- `+=` 实现 `+`、前置实现后置，是减少重复的标准手法。  
- 赋值与资源管理遵循三/五法则或 RAII，避免浅拷贝陷阱。  
- 拿不准时，用命名函数比硬重载更专业。

下一章：[第 22 章 移动语义与智能指针](./ch22-move-smart-pointers.md)。
