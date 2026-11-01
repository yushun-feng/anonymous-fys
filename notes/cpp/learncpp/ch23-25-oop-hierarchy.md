---
title: 第 23–25 章：对象关系、继承与虚函数
tags: [cpp, learncpp, cherno, inheritance, virtual, cpp-things]
topic: cpp
updated: 2026-11-01
source: https://learncpp.cn/
---

# 第 23–25 章：对象关系、继承与虚函数

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 23–25 章  
> Cherno 要点已融入下文「Cherno 视角补充」；剧集索引：[继承与虚函数](../cherno/05-inheritance-virtual.md)、[转型](../cherno/14-casting.md)。
> 《C++那些事》要点已融入下文「《C++那些事》视角补充」；仓库：[https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings)。

## 章节地图

**第 23 章 — 对象关系**

| 主题 | 要点 |
|------|------|
| 关系种类 | 属于 / 有一个 / 使用 / 依赖 |
| 组合 | 部分寿命 ⊆ 整体；整体拥有部分 |
| 聚合 | 「有一个」但部分可独立存在 |
| 关联 / 依赖 | 使用关系；不一定拥有 |
| 容器类 | 管理一组元素；`initializer_list` 构造 |

**第 24 章 — 继承**

| 主题 | 要点 |
|------|------|
| 公有继承 | 「是一个」（is-a）建模 |
| 构造 / 析构顺序 | 基→成员→派生；析构相反 |
| 访问说明符 | public / protected / private 继承 |
| 隐藏与 using | 同名成员隐藏；`using` 重新暴露 |
| 多重继承 | 菱形问题入门 |

**第 25 章 — 虚函数与多态**

| 主题 | 要点 |
|------|------|
| 基类指针/引用 | 指向派生对象 |
| `virtual` / `override` / `final` | 动态绑定与防误写 |
| 虚析构 | 经基类指针删除的正确性 |
| 虚表直觉 | 每类一张表；对象存指针 |
| 纯虚与抽象类 | 接口；不能实例化 |
| 对象切片 | 按值传基类丢失派生部分 |
| `dynamic_cast` | 安全向下转型 |
| 虚继承 | 解决菱形重复基类 |

---

# 第 23 章：对象关系

## 核心概念

面向对象不只是继承。大多数稳健设计首先用**组合**表达「有一个」。

### 组合（Composition）——强拥有

部分对象是整体的一部分，寿命通常随整体结束而结束，外界一般不单独持有部分。

```cpp
class Heart {
public:
  void beat() { /* ... */ }
};

class Person {
public:
  void live() { heart_.beat(); }
private:
  Heart heart_;          // 组合：Person 拥有 Heart
};
```

特点：整体直接负责部分的创建与销毁；部分类型常作为成员值或 `unique_ptr` 成员。

### 聚合（Aggregation）——弱「有一个」

整体「有」部分，但部分可以独立存在、被多个整体共享，或在整体之外创建。

```cpp
class Department {
public:
  explicit Department(std::string name) : name_(std::move(name)) {}
  void add(Teacher* t) { teachers_.push_back(t); } // 不拥有 Teacher
private:
  std::string name_;
  std::vector<Teacher*> teachers_; // 观察指针；也可用 weak_ptr / 引用包装
};
```

聚合在 UML 中用空心菱形表示；实现上常见「存指针/引用但不负责 delete」。

### 关联与依赖

- **关联**：两个独立对象互相知道（如 `Student` ↔ `Course`）。  
- **依赖**：仅在函数参数/局部使用另一类型（「uses-a」），不存为成员。

```cpp
void print_roster(const Course& c); // print_roster 依赖 Course
```

### 如何选择

| 问题 | 倾向 |
|------|------|
| 部分不能脱离整体？ | 组合 |
| 部分可共享、可独立？ | 聚合 / 关联 |
| 只是偶尔用一下？ | 依赖（参数） |
| 是一个特殊化种类？ | 再考虑继承 |

**优先组合优于继承**：继承耦合更强，基类变更易牵动所有派生类。

### 容器类与 `initializer_list`

自定义容器常通过组合持有 `std::vector` 等，并提供 `begin`/`end`、`operator[]`。

```cpp
#include <initializer_list>
#include <vector>

class IntBag {
public:
  IntBag(std::initializer_list<int> list) : data_(list) {}
  std::size_t size() const { return data_.size(); }
  int& operator[](std::size_t i) { return data_.at(i); }
private:
  std::vector<int> data_;
};

IntBag bag{1, 2, 3}; // 列表初始化
```

`std::initializer_list<T>` 绑定到临时数组，元素通常是 `const T`；适合构造时批量填入，不适合当长期容器用。

## 示例：组合 vs 聚合

```cpp
struct Engine { int horsepower; };

class Car {
public:
  explicit Car(int hp) : engine_{hp} {}
private:
  Engine engine_; // 组合
};

class Driver;
class FleetCar {
public:
  void assign(Driver* d) { driver_ = d; } // 聚合：不拥有 Driver
private:
  Engine engine_{100};
  Driver* driver_{nullptr};
};
```

## 易错（第 23 章）

- 把聚合当组合去 `delete` 外来指针 → 双重释放或删掉栈对象。  
- 用继承表达「有一个」（`Car : Engine`）→ 错误模型。  
- `initializer_list` 悬空：不要返回或长期保存指向其底层数组的指针。

---

# 第 24 章：继承

## 核心概念

公有继承表达 **is-a**：派生类对象也是基类对象。

```cpp
class Animal {
public:
  explicit Animal(std::string name) : name_(std::move(name)) {}
  void rename(std::string n) { name_ = std::move(n); }
  const std::string& name() const { return name_; }
protected:
  std::string name_;
};

class Dog : public Animal {
public:
  explicit Dog(std::string name) : Animal(std::move(name)) {}
  void bark() const { /* ... */ }
};
```

### 构造与析构顺序

1. 构造：基类构造 → 成员构造（声明序）→ 派生类构造函数体。  
2. 析构：派生析构体 → 成员逆序析构 → 基类析构。

派生类构造函数应在初始化列表中显式调用基类构造；否则尝试调用基类默认构造。

### 访问与继承方式

| 成员在基类 | public 继承后 | protected 继承后 | private 继承后 |
|------------|---------------|------------------|-----------------|
| public | public | protected | private |
| protected | protected | protected | private |
| private | 不可访 | 不可访 | 不可访 |

- **public 继承**：正常 is-a。  
- **protected / private 继承**：少见，偏实现复用（「据有一个」），不建模对外 is-a。

`protected` 成员：派生类可访问，外部不可——用于「家族内部」共享，但仍增加耦合，慎用。

### 名称隐藏

派生类声明与基类同名的函数会**隐藏**基类全部同名重载，而非重载集合合并：

```cpp
struct Base {
  void f(int) {}
};
struct Derived : Base {
  void f(double) {}          // 隐藏 Base::f(int)
  using Base::f;             // 拉回基类重载
};
```

### 多重继承与菱形

```cpp
class A { public: int id; };
class B : public A {};
class C : public A {};
class D : public B, public C {}; // D 里有两份 A
```

访问 `d.id` 歧义。解决：虚继承（见第 25 章）或重新设计（优先组合）。多重继承在 C++ 合法，但接口继承 + 单实现继承通常更清晰。

## 示例：扩展与构造链

```cpp
class Person {
public:
  Person(std::string name, int age) : name_(std::move(name)), age_(age) {}
protected:
  std::string name_;
  int age_;
};

class Employee : public Person {
public:
  Employee(std::string name, int age, int id)
    : Person(std::move(name), age), id_(id) {}
  int id() const { return id_; }
private:
  int id_;
};
```

## 易错（第 24 章）

- 派生类忘记初始化基类子对象。  
- 误用 private 继承却当 public is-a 用。  
- 同名隐藏导致「突然找不到」基类重载。  
- 在基类析构非虚时经基类指针删除派生对象（见下一章）。

---

# 第 25 章：虚函数与多态

## 核心概念

### 静态绑定 vs 动态绑定

非虚函数按**指针/引用的静态类型**调用；虚函数按**对象的动态类型**调用。

```cpp
struct Base {
  virtual void speak() const { std::cout << "base\n"; }
  virtual ~Base() = default; // 关键
};

struct Derived : Base {
  void speak() const override { std::cout << "derived\n"; }
};

void shout(const Base& b) { b.speak(); }

Derived d;
shout(d); // 输出 derived
```

### `override` 与 `final`

- `override`：编译期确认确实覆盖了虚函数；签名写错会报错。  
- `final`（函数）：禁止再覆盖；`final`（类）：禁止再继承。

```cpp
struct Sealed final : Base {
  void speak() const override final { /* ... */ }
};
```

### 虚析构函数

经基类指针 `delete` 派生对象时，若基类析构非虚，则只调基类析构 → 资源泄漏 / UB。

规则：**任意作为多态基类的类型，析构函数应为 `virtual`。**  
若不打算多态删除，可使析构 protected 非虚，并避免公有继承误用——但初学优先「多态基类 ⇒ 虚析构」。

### 虚表直觉（vtable）

实现上，多数编译器为每个多态类生成虚函数表；对象中存 vptr 指向该类的表。调用虚函数 ≈ 查表间接调用。无需手写，但要理解：

- 有虚函数的类对象更大一点；  
- 虚调用有间接成本（通常可接受）；  
- 构造期间虚调用会落到「当前正在构造的类」版本，而非最终派生类。

### 纯虚函数与抽象类

```cpp
struct Shape {
  virtual ~Shape() = default;
  virtual double area() const = 0; // 纯虚
};

struct Circle : Shape {
  double r;
  explicit Circle(double rr) : r(rr) {}
  double area() const override { return 3.14159 * r * r; }
};

// Shape s;           // 错误：抽象类
std::unique_ptr<Shape> p = std::make_unique<Circle>(1.0);
```

纯虚类常作接口。派生类必须覆盖所有纯虚函数才能实例化。也可提供纯虚函数的定义体（少见，供默认复用）。

### 对象切片（slicing）

```cpp
Derived d;
Base b = d;     // 切片：只拷贝 Base 子对象
void f(Base by_value);
f(d);           // 再次切片
```

按值传递/返回基类会丢掉派生部分与虚表身份。多态接口请用**指针或引用**（常配智能指针）。

### `dynamic_cast`

在多态类型间安全转型（需要 RTTI）：

```cpp
void handle(Base* p) {
  if (auto* dp = dynamic_cast<Derived*>(p)) {
    dp->derived_only();
  }
}

Base& r = d;
Derived& dr = dynamic_cast<Derived&>(r); // 失败抛 std::bad_cast
```

指针版失败返回 `nullptr`；引用版失败抛异常。优先通过虚函数接口避免到处 `dynamic_cast`；真正需要「稀有下行」时再用。

剧集索引：[Cherno 转型](../cherno/14-casting.md)。

### 虚继承（菱形）

```cpp
class A { public: int id = 0; };
class B : virtual public A {};
class C : virtual public A {};
class D : public B, public C {}; // 共享一份 A
```

最派生类负责初始化虚基类。虚继承有额外开销与复杂度，能避免则避免。

## 语法与 API 速查

```cpp
virtual void f();
void f() override;
void f() override final;
virtual ~Base() = default;
virtual void g() = 0;

dynamic_cast<Derived*>(base_ptr);
dynamic_cast<Derived&>(base_ref);

std::unique_ptr<Base> p = std::make_unique<Derived>(...);
```

## 综合示例

```cpp
#include <iostream>
#include <memory>
#include <vector>

class Employee {
public:
  explicit Employee(std::string name) : name_(std::move(name)) {}
  virtual ~Employee() = default;
  virtual void pay() const {
    std::cout << name_ << ": base pay\n";
  }
protected:
  std::string name_;
};

class Manager : public Employee {
public:
  Manager(std::string name, int bonus)
    : Employee(std::move(name)), bonus_(bonus) {}
  void pay() const override {
    std::cout << name_ << ": base + bonus " << bonus_ << '\n';
  }
private:
  int bonus_;
};

int main() {
  std::vector<std::unique_ptr<Employee>> staff;
  staff.push_back(std::make_unique<Employee>("Ada"));
  staff.push_back(std::make_unique<Manager>("Grace", 500));
  for (const auto& e : staff) e->pay();

  Employee* p = staff[1].get();
  if (auto* m = dynamic_cast<Manager*>(p)) {
    std::cout << "is manager\n";
  }
}
```

## 易错与陷阱（第 25 章）

1. **基类无虚析构却 `delete` 基类指针**。  
2. **覆盖时签名不一致却未写 `override`**：默默变成新函数，多态失效。  
3. **切片**：`vector<Base>` 存派生对象；应存 `unique_ptr<Base>`。  
4. **在构造/析构中调用虚函数**：不会派发到派生类完整版本。  
5. **返回协变指针时类型不匹配**。  
6. **滥用 `dynamic_cast` 代替虚函数设计**。  
7. **忘记纯虚未覆盖导致「莫名无法实例化」**。  
8. **把非多态类型拿去 `dynamic_cast`**：需要至少一个虚函数。

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。继承与虚函数让「同一接口、不同实现」成为可能；Cherno 反复强调的代价是：**间接跳转、对象布局变复杂、切片与错误析构**。正文已分组合/聚合、继承、多态三块——这里补运行时模型与工程默认项。

### 先问：是否真的需要继承

能用组合（「有一个」）表达的，优先组合。继承适合真正的「是一个」且需要同一套虚接口调度的家族。接口膨胀或仅为了复用几行代码而继承，长期会痛。

```cpp
struct IAudioVoice {
    virtual ~IAudioVoice() = default;
    virtual void play() = 0;
};

struct SineVoice : IAudioVoice {
    void play() override { /* 生成正弦 */ }
};

struct NoiseVoice : IAudioVoice {
    void play() override { /* 生成噪声 */ }
};
```

纯虚函数 = 接口约定；别忘了**虚析构**：经基类指针 `delete` 派生对象时，无虚析构是经典 UB。

### vtable 直觉（够用即可）

带虚函数的类，对象里通常有指向虚表的指针；调用 `p->play()` 时按**动态类型**查表。这带来灵活性，也带来一层间接——热点里是否可接受要用测量说话，而不是先微优化掉所有虚函数。

```cpp
void kick(IAudioVoice& voice)
{
    voice.play(); // 动态绑定
}
```

按值传基类会**切片**，虚行为与派生状态一起丢失——多态边界上传引用/智能指针。

```cpp
void badByValue(IAudioVoice voice); // 危险：切片
void ok(IAudioVoice& voice);
```

### `override` / `final` 是安全带

签名写错时，没有 `override` 会变成静默的新函数而非重写。`final` 阻止再派生或再覆盖，便于封死扩展点。

### `dynamic_cast` 与设计味道

能靠虚接口表达就不向下转型；偶尔需要时，指针版失败得 `nullptr`，引用版抛异常。Cherno 转型篇与正文交叉——补充：频繁 `dynamic_cast` 往往说明接口切分不对。

### 与智能指针一起用

拥有型多态集合常用 `vector<unique_ptr<Base>>`；共享再用 `shared_ptr`。组合/聚合的寿命规则正文已述：补一句 Cherno 习惯——**演示阶段可用裸指针讲清 vtable，产品代码立刻换成智能指针托管**。

构造顺序「基类 → 成员 → 派生」、析构逆序，调试崩溃时先核对这一条，再查虚表。

## 《C++那些事》视角补充

要点改写自 [https://github.com/Light-City/CPlusPlusThings](https://github.com/Light-City/CPlusPlusThings) 的 `virtual` / `vptr_vtable` / 纯虚与抽象类 /「用 C 模拟多态」篇。这是面试深挖重灾区——只记结论不够，要能画调用路径。

### 动态绑定

- 虚调用看的是**对象动态类型**，不是指针/引用的静态类型。
- **默认实参按静态类型绑定**；虚函数动态、默认参数静态——混用必踩坑。

### vptr / vtable（实现模型）

- 含虚函数的类（及派生）有一张虚表；对象里藏 vptr 指向它。
- 调用：取 vptr → 查表项 → 间接跳转。代价是间接与更难内联。
- 构造期间虚调用不会「落到派生最终覆盖」（对象还在长成中）——故**构造函数不能是虚函数**；需要多态删除时**析构应当是虚函数**。

### 纯虚与抽象类

```cpp
struct Shape {
    virtual ~Shape() = default;
    virtual void draw() const = 0; // 纯虚 → 抽象类，不能实例化
};
```

派生类必须实现全部纯虚才能实例化；抽象类指针/引用可绑定到具体派生对象。抽象类里普通成员可调纯虚，但**构造/析构期间**不要指望完整动态派发。

### 其它常问

- `static` 成员不能是虚函数（无 `this`/vptr）。
- 虚函数可以是 `private`（访问权限按静态类型检查，覆盖仍可发生）——可读性差，慎用。
- 「C 用函数指针表模拟虚表」帮助理解机制；产品 C++ 代码直接用 `virtual`/`override`/`final`。

## 练习指引

**第 23 章**

1. 设计 `Computer`：`CPU`/`RAM` 组合；`Owner*` 聚合。画关系图并实现。  
2. 用 `initializer_list` 写一个只读 `StringList` 包装 `vector<string>`。

**第 24 章**

3. 实现 `Shape` → `Rectangle` / `Circle` 的数据成员与非虚 `print_name`。  
4. 演示同名隐藏，再用 `using` 修复。  
5. （选做）菱形多重继承，观察歧义，再改虚继承。

**第 25 章**

6. 为形状层次添加 `virtual area()` 与虚析构；用 `vector<unique_ptr<Shape>>` 多态输出。  
7. 故意去掉 `override` 并改错参数类型，观察行为；加回 `override` 看编译错误。  
8. 写切片示例并改成引用参数。  
9. 用 `dynamic_cast` 识别某一派生类型，再重构为纯虚接口消掉转型。  
10. 结合 [Cherno 路线](../cherno/00-roadmap.md) 把同一例子用智能指针重写。

## 小结

- **关系**：组合默认；聚合共享；继承表达 is-a。  
- **继承**：弄清构造序、访问级别、名称隐藏。  
- **多态**：虚函数 + 基类指针/引用；`override`/`final`；虚析构必记。  
- **陷阱**：切片、非虚析构、构造中虚调用、菱形复杂度。  
- **转型**：`dynamic_cast` 服务于偶尔下行；设计上优先虚接口。

下一章：[第 26–28 章 类模板 / 异常 / I/O](./ch26-28-templates-exceptions-io.md)。
