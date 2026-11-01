---
title: 第 14–15 章：类
tags: [cpp, learncpp, cherno, class, oop, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 14–15 章：类

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 14–15 章
> Cherno 要点已融入下文「Cherno 视角补充」；剧集索引：[类](../cherno/04-classes.md)、[继承与虚函数](../cherno/05-inheritance-virtual.md)。
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 小节地图

**第 14 章**：OOP 动机 → 类与成员函数 → `const` 成员函数 → 访问控制（`public` / `private`）→ 访问器（getter/setter）与返回成员引用的风险 → 封装收益 → 构造函数与成员初始化列表（MIL）→ 默认构造 / 委托构造 → 临时对象 → 拷贝构造与拷贝省略（elision）→ `explicit` → `constexpr` 类。

**第 15 章**：`this` 指针与链式调用 → 类与头文件 / 多文件 → 嵌套类型 → 析构函数 → 类模板的成员 → `static` 成员 → `friend` → 引用限定符（ref-qualifiers）。

Cherno 类相关直觉见下文「Cherno 视角补充」与 [剧集索引](../cherno/04-classes.md)；所有权与资源类见 [RAII](../raii-and-ownership.md)、[第 22 章](./ch22-move-smart-pointers.md)。

## 核心概念

### OOP 与类

- **对象**：状态（数据）+ 行为（函数）的捆绑。
- **类**：用户定义类型；`class` 默认私有，`struct` 默认公有——除此以外在语言上几乎相同。
- 本章目标：用访问控制维护**不变量**，用构造保证对象“一生出来就合法”。

### 成员函数与 `const`

```cpp
class Counter {
public:
    void add(int n) { value_ += n; }
    int value() const { return value_; }  // const 成员：承诺不修改对象逻辑状态
private:
    int value_{0};
};
```

- `const` 对象只能调用 `const` 成员函数。
- `mutable` 成员可在 `const` 函数中修改（缓存、互斥锁计数等慎用场景）。
- 成员函数有隐含的 `this` 参数：非 const 为 `T*`，const 成员为 `const T*`。

### 访问控制与封装

- `public`：接口；`private`：实现细节与不变量相关的数据。
- **封装收益**：可改内部表示而不破坏调用方；集中校验；减少错误状态。
- Getter 返回**按值**或 **`const&`** 时要想清：返回非 const 引用等于把私有大门打开。
- Setter 应维护不变量（例如分数分母 ≠ 0），而不是无脑赋值。

### 构造函数与成员初始化列表（MIL）

```cpp
class Point {
public:
    Point(int x, int y) : x_{x}, y_{y} {}  // MIL：直接初始化成员
private:
    int x_;
    int y_;
};
```

- MIL 在函数体之前执行；顺序是**成员声明顺序**，不是 MIL 书写顺序。
- 引用成员、`const` 成员、无默认构造的成员**必须**在 MIL 中初始化。
- 在函数体里 `x_ = x;` 是赋值，可能多一次默认构造+赋值，对类类型成员更浪费。

### 默认 / 委托 / 拷贝构造

- **默认构造**：`Point() = default;` 或无参构造；若用户声明了其它构造，编译器可能不再生成默认构造，需显式处理。
- **委托构造**：`Point() : Point(0, 0) {}` —— 一个构造调用同一类的另一构造，避免重复初始化逻辑。
- **拷贝构造**：`Point(const Point& other);` —— 用另一对象初始化；编译器通常自动生成成员级拷贝。
- **拷贝省略（elision）**：按值返回局部对象等场景，编译器可省略拷贝/移动（C++17 起部分情况必省略）。不要依赖“拷贝一定会发生”来写副作用。

### `explicit` 与临时对象

- 单参构造（及多参但可默认其余实参）可充当隐式转换，常常是坑：`explicit` 关掉隐式转换。
- 临时对象：`Point{1, 2}` 或按值传参时创建；绑定到 `const Point&` 可延长生命周期至引用作用域。

### `constexpr` 类（入门）

- 字面量类型 + `constexpr` 构造/成员，可在编译期创建与使用对象（规则随标准放宽）。
- 适合小型值类型：`constexpr Point origin{0, 0};`。

### `this`、链式调用与头文件

- `this` 指向当前对象；返回 `*this` 可链式：`a.set_x(1).set_y(2);`。
- 类定义通常放头文件；成员函数可在类内（隐式 inline）或类外定义：`void Counter::add(int n) { ... }`。
- ODR：头文件中的定义需 inline / 模板 / 头文件卫士或 `#pragma once`。

### 嵌套类型、析构、static、friend、ref-qualifiers

- **嵌套类型**：`class Outer { public: enum class Mode { ... }; };` —— 作用域清晰。
- **析构函数**：`~T()` 在生命周期结束时调用；释放资源、关闭句柄。有资源时遵循 RAII；成对思考拷贝/移动（三/五法则，后续章节深化）。
- **`static` 数据成员**：属于类而非对象；通常在类外定义（C++17 起 `inline static` 可在类内定义）。
- **`static` 成员函数**：无 `this`，不能访问非静态成员。
- **`friend`**：授予外部函数或类访问私有成员的特权；应尽量少用，优先公有接口。
- **引用限定符**：`void foo() &;` / `void foo() &&;` —— 限制成员只能在左值或右值对象上调用，用于优化或防止误用临时对象上的某些操作。

## 语法与 API

```cpp
class Fraction {
public:
    Fraction() : Fraction(0, 1) {}                    // 委托
    explicit Fraction(int n) : Fraction(n, 1) {}      // 禁止 int → Fraction 隐式转换
    Fraction(int n, int d) : num_{n}, den_{d} {
        if (den_ == 0) throw std::invalid_argument("den");
    }

    Fraction(const Fraction&) = default;

    int num() const { return num_; }
    int den() const { return den_; }

    Fraction& negate() & {                            // 仅左值
        num_ = -num_;
        return *this;
    }

    Fraction& operator*=(int k) {
        num_ *= k;
        return *this;                                 // 链式
    }

    static Fraction unit() { return Fraction{1, 1}; }

    friend bool operator==(const Fraction& a, const Fraction& b) {
        return a.num_ * b.den_ == b.num_ * a.den_;
    }

    ~Fraction() = default;

private:
    int num_;
    int den_;
};
```

头文件拆分示意：

```cpp
// fraction.h
#pragma once
class Fraction {
public:
    Fraction(int n, int d);
    int num() const;
private:
    int num_;
    int den_;
};

// fraction.cpp
#include "fraction.h"
Fraction::Fraction(int n, int d) : num_{n}, den_{d} {}
int Fraction::num() const { return num_; }
```

## 示例

### 1. 封装不变量：日期简化版

```cpp
#include <stdexcept>
#include <iostream>

class Date {
public:
    Date(int y, int m, int d) : y_{y}, m_{m}, d_{d} {
        if (m_ < 1 || m_ > 12 || d_ < 1 || d_ > 31)
            throw std::invalid_argument("bad date");
    }

    int year()  const { return y_; }
    int month() const { return m_; }
    int day()   const { return d_; }

private:
    int y_, m_, d_;
};

int main() {
    Date d{2026, 10, 31};
    std::cout << d.year() << '-' << d.month() << '-' << d.day() << '\n';
}
```

### 2. MIL 顺序与引用成员

```cpp
#include <iostream>
#include <string>

class View {
public:
    View(const std::string& s) : text_{s}, size_{text_.size()} {}
    std::size_t size() const { return size_; }
    const std::string& text() const { return text_; }
private:
    const std::string& text_;  // 必须 MIL；且调用方保证 s 生命周期
    std::size_t size_;
};

int main() {
    std::string name = "Ada";
    View v{name};
    std::cout << v.size() << '\n';
}
```

注意：成员引用不延长被绑对象寿命——`View` 设计需极谨慎，许多情况下更适合存 `std::string_view` 或按值/`shared_ptr`。

### 3. `explicit` 防止意外转换

```cpp
class Meters {
public:
    explicit Meters(double v) : v_{v} {}
    double value() const { return v_; }
private:
    double v_;
};

void print_length(Meters m);

void demo() {
    // print_length(3.0);     // explicit 下非法
    print_length(Meters{3.0});
}
```

### 4. `this` 链式调用

```cpp
class Builder {
public:
    Builder& set_id(int id) { id_ = id; return *this; }
    Builder& set_name(std::string n) { name_ = std::move(n); return *this; }
    void show() const {
        std::cout << id_ << ':' << name_ << '\n';
    }
private:
    int id_{0};
    std::string name_;
};

int main() {
    Builder{}.set_id(7).set_name("neo").show();
}
```

### 5. static 与嵌套类型

```cpp
class IdGen {
public:
    enum class Kind { user, system };

    static int next() { return ++counter_; }

    explicit IdGen(Kind k) : kind_{k}, id_{next()} {}
    int id() const { return id_; }
    Kind kind() const { return kind_; }

private:
    Kind kind_;
    int id_;
    inline static int counter_{0};  // C++17
};
```

### 6. 拷贝与 elision 直觉

```cpp
struct Tracer {
    Tracer() { std::puts("ctor"); }
    Tracer(const Tracer&) { std::puts("copy"); }
};

Tracer make() {
    Tracer t;
    return t;   // C++17 起常省略拷贝；不要依赖“必打印 copy”
}
```

### 7. friend 与对称运算符

```cpp
class Vec2 {
public:
    Vec2(double x, double y) : x_{x}, y_{y} {}
    friend Vec2 operator+(Vec2 a, const Vec2& b) {
        a.x_ += b.x_;
        a.y_ += b.y_;
        return a;
    }
private:
    double x_, y_;
};
```

对对称二元运算，友元或隐藏友元常比成员函数更自然（左操作数可为转换结果）。完整运算符重载见第 21 章。

### 8. 引用限定符

```cpp
#include <string>

class Buffer {
public:
    std::string& data() & { return data_; }
    const std::string& data() const & { return data_; }
    std::string data() && { return std::move(data_); }  // 右值可搬空
private:
    std::string data_;
};
```

## 易错与陷阱

1. **在构造函数体里“初始化” `const`/引用成员**：必须用 MIL。
2. **MIL 书写顺序 ≠ 初始化顺序**：按成员声明顺序；乱序书写会误导读者并产生告警。
3. **返回私有成员的非 const 引用**：破坏封装，外部可绕过不变式。
4. **忘记 `explicit`**：`String(const char*)` 或 `Vector(int)` 类单参构造导致诡异重载决议。
5. **悬垂：成员引用/指针指向临时或短命对象**（含 getter 返回局部缓冲）。
6. **析构中抛异常**：极危险；析构应 noexcept 地清理。
7. **`static` 数据成员未定义**：C++17 前类外缺定义会导致链接错误；优先 `inline static`。
8. **`friend` 滥用**：朋友太多等于没有私有；优先成员或公有非成员接口。
9. **在 `const` 成员里偷偷改逻辑状态**却不用 `mutable` / 设计不当，导致 `const` 语义失真。
10. **以为拷贝构造“总会调用”**：elision 可能省略；副作用不要放在拷贝构造里当日志依据。
11. **类定义放进 `.cpp` 却在多处需要完整类型**：导致不完整类型错误；共享类型应进头文件。
12. **默认成员初始化与 MIL 混淆**：MIL 优先覆盖默认成员初始化器。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。类把「数据 + 操作数据的规则」捆在一起。Cherno 视角强调两件事：**对象在哪分配（栈/堆）**，以及**构造/析构如何成对管理资源**。正文已系统覆盖封装、MIL、`explicit`、`this`、static、friend——这里补工程直觉与示例命名空间。

### 栈上实例 vs `new`

```cpp
class ParticleBurst {
public:
    explicit ParticleBurst(int count) : count_(count) {}
    int count() const { return count_; }
private:
    int count_;
};

void tick()
{
    ParticleBurst local{16};           // 栈：离开作用域自动析构
    auto* heap = new ParticleBurst{32}; // 堆：必须有人 delete
    delete heap;
}
```

能栈就栈。堆分配出现在：尺寸运行期才知、需要超出作用域存活、或多态基类指针持有派生对象（见第 23–25 章）。现代代码优先智能指针接管 `new`，避免手工 `delete` 漏网。

### 成员初始化列表不是样式问题

引用成员、`const` 成员、以及「先于函数体完成子对象构造」的场景，都必须走 MIL。函数体内赋值是「先默认建再改」，对有资源的成员可能多一次浪费或根本非法。

```cpp
class Viewport {
public:
    Viewport(int w, int h) : width_(w), height_(h) {}
private:
    int width_;
    int height_;
};
```

### `explicit` 单参构造

防止 `Viewport v = 1080;` 这类无意转换污染重载集。API 边界上，宁可调用点多写 `Viewport{1080, 720}`，也不要静默把 `int` 变成领域对象。

### 析构与规则直觉

若类拥有裸资源（文件句柄、堆缓冲），析构里释放；同时认真对待拷贝/移动（三/五法则，移动见第 22 章）。`struct`/`class` 默认访问差异正文与 Cherno 对照表可自行补一行——真正分水岭是**有没有不变量要守**。

### 与正文分工

日期封装、链式调用、`friend` 对称运算等示例不重复。读完正文后，用调试器看一个栈上对象的构造/析构顺序，再对同一个类型 `new`/`delete` 一次，把「寿命」刻进肌肉记忆。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 `this` / `explicit` / `friend` / `sizeof`（类布局）篇。

### `this`

- 非静态成员函数的隐含参数；**不占对象 `sizeof`**。
- 普通成员函数里可看作 `T* const`；`const` 成员函数里是 `const T*`。
- 链式调用：`return *this;`；形参与成员同名时用 `this->x = x;`。

### `explicit`

- 修饰构造函数：禁止隐式转换与拷贝初始化坑（`f(1)` 偷偷构造临时）。
- 修饰转换函数：禁止隐式用户定义转换（语境转换如 `if (obj)` 等规则另论）。
- 单参或多参（含默认实参）都可能成为转换路径——该挡就 `explicit`。

### `friend`

- 授予外部函数或类访问私有/保护成员的特权；**不对称、不传递**。
- 典型用途：对称运算符（`operator<<`）、紧密协作的工厂/测试钩子。
- 成本是封装被开洞——能写成公有接口就不要扩散友元。

### 布局与 `sizeof`（面试高频）

空类 ≥1；有虚函数通常 +vptr；`static` 成员不进对象体积。虚继承/多继承下体积实现相关，用本机 `sizeof` + 文档口径，避免死记某编译器数字。

## 练习指引

- 实现 `Fraction`：约分、乘加、`explicit` 单参构造、`operator==` 友元、const 访问器。
- 写一个 `Stack` 值类型（可用 `std::vector` 作私有实现）：关注封装，而不是重新发明容器。
- 把类拆成 `.h` / `.cpp`，确认成员函数类外定义与 `#pragma once`。
- 刻意去掉 `explicit`，观察 `void f(Fraction); f(3);` 是否意外通过。
- 为链式 setter 与 `&&` 限定的 `consume()` 各写测试用例。
- 结合下文 Cherno 视角，补一节「类与结构体默认访问」对比表。
- 预习：若类管理 `new` 内存，为何下一阶段必须学析构、拷贝/移动与智能指针（[ch18–19](./ch18-19-iterators-dynamic.md)、[ch22](./ch22-move-smart-pointers.md)）。

## 小结

- 类用访问控制保护不变量；`const` 成员函数表达只读接口。
- 构造用 MIL；单参构造默认考虑 `explicit`；委托构造消除重复。
- `this` 支持链式；析构与 `static`/`friend`/嵌套类型完善类设计工具箱。
- 返回成员引用、成员引用字段、隐式转换是三大实战雷区。
- 资源管理类不要停在“会写构造”：与 RAII、移动语义、智能指针章节一并掌握。
