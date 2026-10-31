---
title: Cherno：模板
tags: [cpp, cherno, templates]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=I-hZkUa9mIs
---

# Cherno：模板

> 视频：[Templates](https://www.youtube.com/watch?v=I-hZkUa9mIs)  
> 相关：[LearnCpp ch11](../learncpp/ch11-overload-templates.md)、[ch26–28](../learncpp/ch26-28-templates-exceptions-io.md)

## 覆盖集

用模板让编译器按用法生成代码；函数模板与简单类模板；非类型模板参数（如固定长度数组）。

## 要点

- 模板不是「一个函数」，而是**生成函数/类的蓝图**；用到的实例才会实例化。
- 可显式指定模板实参，也可靠实参推导。
- 类模板示例：`Array<T, N>` 把元素类型与长度都参数化。
- 强力但要克制：过度元编程会让报错与调试变难；日志、容器、泛型算法是合理用途。

## 易错点

- 模板定义放进 `.cpp` 却在其他翻译单元使用 → 链接找不到实例（通常定义放头文件或显式实例化）。
- 未实例化时，模板体内部分错误可能延后暴露。
- 把模板当成运行时多态的替代而不考虑编译期代码膨胀。

```cpp
template <typename T>
void print(const T& value) {
  std::cout << value << '\n';
}

template <typename T, int N>
struct Array {
  T data[N];
  int size() const { return N; }
};
```
