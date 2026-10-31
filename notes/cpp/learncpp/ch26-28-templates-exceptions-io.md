---
title: 第 26–28 章：类模板、异常与 I/O
tags: [cpp, learncpp, cherno, templates, exceptions, io]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 26–28 章：类模板、异常与 I/O

> 学习材料：[learncpp.cn](https://learncpp.cn/) 第 26–28 章

## 章节地图

**第 26 章 — 类模板**

| 主题 | 要点 |
|------|------|
| 类模板 | 参数化类型；成员函数模板实例化 |
| NTTP | 非类型模板参数（积分、指针、C++20 更多） |
| 特化 | 全特化；偏特化（仅类模板） |
| 指针特化 | 为 `T*` 提供不同实现 |

**第 27 章 — 异常**

| 主题 | 要点 |
|------|------|
| 动机 | 与错误码分工；不能忽略的失败路径 |
| try / catch / throw | 抛出、匹配、栈展开 |
| 异常类层次 | `std::exception` 族 |
| 再抛出 / 捕获一切 | `throw;`、`catch (...)` |
| 函数 try 块 | 构造函数初始化列表异常 |
| `noexcept` | 承诺不抛；移动优化 |
| `move_if_noexcept` | 强异常安全与容器扩容 |

**第 28 章 — I/O**

| 主题 | 要点 |
|------|------|
| iostream 体系 | `istream` / `ostream` / `iostream` |
| 字符串流 | `stringstream` |
| 流状态 | `good/fail/eof/bad`；清除与恢复 |
| 文件 I/O | `ifstream` / `ofstream` / `fstream` |
| 随机访问 | `seekg` / `seekp` / `tellg` |

---

# 第 26 章：类模板

## 核心概念

函数模板参数化算法；**类模板**参数化数据与封装。标准库的 `vector`、`unique_ptr`、`array` 都是类模板。

```cpp
template<typename T>
class Box {
public:
  explicit Box(T value) : value_(std::move(value)) {}
  const T& get() const { return value_; }
  void set(T value) { value_ = std::move(value); }
private:
  T value_;
};

Box<int> bi{42};
Box<std::string> bs{"hi"};
```

- 模板定义通常放在**头文件**（或显式实例化翻译单元）。  
- 每个 `Box<T>` 是不同的类；`Box<int>` 与 `Box<double>` 无继承关系。  
- 成员函数在被调用时才实例化（除非显式实例化）。

### 非类型模板参数（NTTP）

```cpp
template<typename T, std::size_t N>
class Array {
public:
  T& operator[](std::size_t i) { return data_[i]; }
  static constexpr std::size_t size() { return N; }
private:
  T data_[N];
};

Array<int, 4> a{};
```

C++20 起 NTTP 可扩展到更多字面量类类型；日常仍以整数、枚举、指针/引用为主。

### 全特化

为某具体实参提供完全不同的实现：

```cpp
template<>
class Box<bool> {
public:
  explicit Box(bool v) : bit_(v) {}
  bool get() const { return bit_; }
private:
  bool bit_;
};
```

### 偏特化（仅类模板）

```cpp
template<typename T>
class Box<T*> {           // 针对所有指针
public:
  explicit Box(T* p) : ptr_(p) {}
  T& get() { return *ptr_; }
private:
  T* ptr_;
};
```

函数模板**不能**偏特化，只能重载或全特化（函数全特化也常被重载替代）。类模板偏特化常用于：指针、`const T`、`vector<T, Alloc>` 之类模式匹配。

### 与 CTAD

C++17 类模板实参推导：

```cpp
template<typename T>
struct Pair {
  Pair(T a, T b) : first(a), second(b) {}
  T first, second;
};
Pair p{1, 2}; // Pair<int>
```

用户可写推导指引（deduction guide）处理边界情况。

## 示例：简易静态数组与指针特化

```cpp
#include <iostream>

template<typename T, std::size_t N>
struct Storage {
  T data[N]{};
  void fill(const T& v) {
    for (std::size_t i = 0; i < N; ++i) data[i] = v;
  }
};

template<typename T, std::size_t N>
struct Storage<T*, N> {
  T* data[N]{};
  void fill(T* v) {
    for (std::size_t i = 0; i < N; ++i) data[i] = v;
  }
  // 注意：此处不拥有指针；仅演示特化语法
};

int main() {
  Storage<int, 3> s;
  s.fill(7);
  std::cout << s.data[0] << '\n';
}
```

## 易错（第 26 章）

- 在 `.cpp` 中定义模板却在其他翻译单元使用 → 链接错误。  
- 误以为函数可以偏特化。  
- 特化忘记匹配主模板的参数数量/种类。  
- 在头文件乱写 `using namespace std;` 污染包含者。

---

# 第 27 章：异常

## 核心概念

异常把「错误传播」从返回值通道分离出来，适合：**罕见、不能忽略、跨多层栈**的失败。预期内的可恢复情况（如用户输入格式错）有时用错误码 / `optional` / `expected` 更合适。

### 基本语法

```cpp
#include <stdexcept>

double inv(double x) {
  if (x == 0.0) throw std::runtime_error("division by zero");
  return 1.0 / x;
}

try {
  std::cout << inv(0) << '\n';
} catch (const std::runtime_error& e) {
  std::cerr << e.what() << '\n';
} catch (const std::exception& e) {
  std::cerr << "other std: " << e.what() << '\n';
} catch (...) {
  std::cerr << "unknown\n";
}
```

- `throw` 抛出表达式；常抛异常对象。  
- `catch` **按引用**捕获，避免切片，并按**声明顺序**匹配。  
- 先捕派生、后捕基类。

### 栈展开（stack unwinding）

异常从抛点沿调用栈回退，销毁已构造完成的自动对象（调用析构），直到匹配的 `catch`。这要求：

- 析构函数**不要抛异常**（否则可能 `std::terminate`）；  
- 用 RAII 管理资源，确保展开时释放。

### 标准异常层次（常用）

```
std::exception
 ├─ std::logic_error      （可避免的程序逻辑问题）
 │   ├─ invalid_argument
 │   ├─ domain_error
 │   ├─ length_error
 │   └─ out_of_range
 └─ std::runtime_error    （运行时难以预检）
     ├─ overflow_error / underflow_error
     └─ range_error
```

也可自定义：

```cpp
class ParseError : public std::runtime_error {
public:
  using std::runtime_error::runtime_error;
};
```

### 再抛出

```cpp
catch (const std::exception& e) {
  log(e.what());
  throw;          // 再抛当前异常对象（保持类型）
  // throw e;     // 可能切片成静态类型，不推荐
}
```

### 函数 try 块

用于捕获构造函数初始化列表中的异常：

```cpp
class File {
public:
  File(const std::string& path)
  try : stream_(path) {
    if (!stream_) throw std::runtime_error("open failed");
  } catch (...) {
    // 只能记录/转换；成员未构造完成
    throw;
  }
private:
  std::ifstream stream_;
};
```

### `noexcept` 与代价

```cpp
void swap_buffers() noexcept;
```

- 承诺不抛；若实际抛出 → `std::terminate`。  
- 移动构造标 `noexcept` 让 `vector` 扩容时安全移动。  
- `noexcept` 也是类型系统一部分（函数类型可含异常规格）。

异常有运行时与代码体积成本；热路径上避免用异常做控制流。但「错误时抛、成功时零额外分支」的模型对许多应用足够好。

### `std::move_if_noexcept`

```cpp
#include <utility>
T target = std::move_if_noexcept(source);
```

若移动构造 `noexcept`，则移动；否则拷贝——帮助容器在扩容时维持强异常安全保证。

## 示例：异常安全的资源包装

```cpp
#include <memory>
#include <vector>
#include <stdexcept>

std::unique_ptr<int[]> make_buffer(std::size_t n) {
  if (n == 0) throw std::invalid_argument("n == 0");
  return std::make_unique<int[]>(n);
}

void fill_or_throw(std::vector<int>& v, int probe) {
  auto tmp = v;                 // 强保证：失败则 v 不变
  tmp.push_back(probe);
  if (probe < 0) throw std::runtime_error("negative");
  v.swap(tmp);
}
```

## 易错（第 27 章）

- 按值捕获导致切片。  
- 析构函数抛出异常。  
- 异常规格写错 / 在 `noexcept` 函数里抛。  
- 用异常处理正常高频分支（如逐字符解析失败）。  
- 捕获 `...` 后不记录也不再抛 → 吞掉错误。  
- 跨 DLL / 编译选项不一致导致异常不能正确传递（工程问题）。

---

# 第 28 章：输入输出流

## 核心概念

### 层次

```
ios_base
  └─ ios
      ├─ istream → ifstream, istringstream
      ├─ ostream → ofstream, ostringstream
      └─ iostream → fstream, stringstream
```

头文件：`<iostream>`、`<fstream>`、`<sstream>`、`<iomanip>`。

### 标准流

`std::cin` / `cout` / `cerr` / `clog`。`cerr` 默认不缓冲，适合错误输出。

### 字符串流

```cpp
#include <sstream>

std::ostringstream oss;
oss << "id=" << 42;
std::string s = oss.str();

std::istringstream iss("3.14 2.71");
double a, b;
iss >> a >> b;
```

适合格式化拼装与简单解析；复杂解析可考虑专门库。

### 流状态

| 状态 | 含义 |
|------|------|
| `good()` | 一切正常 |
| `eof()` | 触达文件结束 |
| `fail()` | 提取失败（可恢复） |
| `bad()` | 严重损坏 |

```cpp
int x;
if (!(std::cin >> x)) {
  std::cin.clear();                 // 清 failbit
  std::cin.ignore(10000, '\n');     // 丢弃坏输入
}
```

布尔转换：`if (stream)` 等价于未 `fail`。循环常用：

```cpp
while (std::getline(in, line)) { /* ... */ }
```

### 文件 I/O

```cpp
#include <fstream>

std::ofstream out("out.txt");
if (!out) throw std::runtime_error("cannot open out");
out << "hello\n";

std::ifstream in("out.txt");
std::string line;
while (std::getline(in, line)) {
  std::cout << line << '\n';
}
```

打开模式：`std::ios::in` / `out` / `app` / `trunc` / `binary` / `ate` 等，可用 `|` 组合。

二进制读写用 `read` / `write`，注意 `char*` 与 `sizeof`；别把非平凡对象直接当字节序列持久化（可移植性差）。

### 随机访问

```cpp
std::fstream file("data.bin", std::ios::in | std::ios::out | std::ios::binary);
file.seekg(0, std::ios::end);
auto len = file.tellg();
file.seekg(0, std::ios::beg);
```

- `seekg` / `tellg`：读位置  
- `seekp` / `tellp`：写位置  

文本模式换行转换会影响偏移；精确定位优先二进制模式。

### 格式化

```cpp
#include <iomanip>
std::cout << std::fixed << std::setprecision(2) << 3.14159 << '\n';
std::cout << std::setw(8) << std::setfill('0') << 42 << '\n';
```

操纵器改变流状态；`setw` 只影响下一次输出。

## 综合示例

```cpp
#include <fstream>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

struct Record {
  std::string name;
  int score;
};

std::vector<Record> load(const std::string& path) {
  std::ifstream in(path);
  if (!in) throw std::runtime_error("open failed: " + path);

  std::vector<Record> rows;
  std::string line;
  while (std::getline(in, line)) {
    if (line.empty()) continue;
    std::istringstream iss(line);
    Record r;
    if (!(iss >> r.name >> r.score)) {
      throw std::runtime_error("bad line: " + line);
    }
    rows.push_back(std::move(r));
  }
  return rows;
}

void save(const std::string& path, const std::vector<Record>& rows) {
  std::ofstream out(path, std::ios::trunc);
  if (!out) throw std::runtime_error("open failed: " + path);
  for (const auto& r : rows) {
    out << r.name << ' ' << r.score << '\n';
  }
}
```

## 易错（第 28 章）

- 打开失败未检查，后续「静默」读写。  
- `eof()` 判断循环写错（应检查读取操作本身是否成功）。  
- 文本/二进制模式混用导致偏移错乱。  
- 忘记 `clear()` 就继续用已 fail 的 `cin`。  
- 大文件整读进内存不考虑极限。  
- 析构未 `flush` 的担忧：正常离开作用域会关闭并刷新；异常路径依赖 RAII。

---

## Cherno 视角补充

视频索引见 [Cherno 路线](../cherno/00-roadmap.md)。本合章跨模板深化、异常与 I/O。Cherno 侧可对齐的直觉是：**模板在编译期生成代码**、**异常是控制流的非常规出口**、**I/O 失败是常态不是意外**。

### 模板：付编译时间，换类型安全

```cpp
template <typename T>
T maxOf(T a, T b)
{
    return (a < b) ? b : a;
}

template <typename T, typename... Rest>
T maxOf(T first, Rest... rest)
{
    return maxOf(first, maxOf(rest...));
}
```

变参与特化让库码紧凑，但错误信息会变长。工程习惯：约束写清楚（概念/static_assert）、公开 API 可考虑封装模板实现，避免每个调用方吞下一整份重型头依赖。

### 异常：用于「函数契约无法继续」

```cpp
#include <stdexcept>
#include <string>

int parsePositive(const std::string& text)
{
    try {
        int v = std::stoi(text);
        if (v <= 0) throw std::invalid_argument("need positive");
        return v;
    } catch (const std::exception& ex) {
        // 边界：记录并转换错误；勿空 catch 吞掉
        throw;
    }
}
```

异常安全与 RAII 绑定：栈展开时析构必须释放资源。不要用异常做普通分支（「文件结束」优先流状态/`optional`）。热路径上关异常或避免抛，需要团队级约定与测量。

### I/O：检查状态，别假设成功

```cpp
#include <fstream>
#include <string>

bool slurpFile(const std::string& path, std::string& out)
{
    std::ifstream in(path);
    if (!in) return false;
    out.assign(std::istreambuf_iterator<char>(in), {});
    return static_cast<bool>(in) || in.eof();
}
```

二进制 vs 文本、局部 vs 全局、异常 vs 错误码——正文会铺开。Cherno 式补充：工具/引擎里常把「读失败」变成可预期错误对象，把异常留给真正罕见的崩坏；日志里带上路径与错误码，便于现场复盘。

### 三者交汇

模板库若抛异常，文档写清；I/O 模板（如序列化）要把错误通道设计进接口，而不是只在快乐路径演示。读完合章后，用一次「读写配置失败」走通错误路径，比再抄一个成功案例更有价值。

## 练习指引

**模板**

1. 实现 `Pair<T,U>` 与全特化 `Pair<T,T>`（或偏特化指针）。  
2. 写 `Array<T,N>` 的 `at`（越界抛 `std::out_of_range`）。  
3. 头文件中定义类模板，多文件引用并编译通过。

**异常**

4. 用异常重写一层「打开文件→解析→汇总」，在 `main` 统一捕获。  
5. 演示按值捕获切片；改成按引用。  
6. 给移动构造加上/去掉 `noexcept`，观察 `vector` 扩容策略差异（可用专用类型打日志）。

**I/O**

7. 读写 CSV 风格文本；处理坏行时 `clear`/`ignore` 或抛异常。  
8. 用 `stringstream` 做整数↔字符串转换，对比 `std::to_string` / `std::stoi`。  
9. 二进制写入 `vector<int>` 的原始字节再读回（注意可移植性警告）。  
10. `seekg` 读文件末尾 16 字节并打印。

## 小结

- **类模板**把类型与（可选）编译期常量参数化；特化定制极端情况；定义放头文件。  
- **异常**服务罕见失败与栈间传播；RAII + 按引用捕获 + 慎用 `noexcept`。  
- **iostream** 统一控制台、字符串、文件；始终检查状态；文件随机访问分清文本/二进制。

返回路线图：[完整学习笔记索引](./00-roadmap.md)。
