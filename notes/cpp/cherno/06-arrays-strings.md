---
title: Cherno：数组与字符串
tags: [cpp, cherno, array, string]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=ENDaJi08jCU
---

# Cherno：数组与字符串

> 视频：[Arrays](https://www.youtube.com/watch?v=ENDaJi08jCU) · [How Strings Work](https://www.youtube.com/watch?v=ijIxcB9qjaU) · [String Literals](https://www.youtube.com/watch?v=FeHZHF0f2dw)  
> 相关：[LearnCpp ch05](../learncpp/ch05-constants-strings.md)、[ch16–17](../learncpp/ch16-17-arrays.md)

## 覆盖集

连续内存中的数组；栈上 vs 堆上数组；C 风格字符串与 `std::string`；字符串字面量与编码直觉。

## 要点

- 数组是元素连续存放；下标本质是指针算术。注意越界。
- 原始数组不记长度；传给函数时常退化成指针——现代代码优先 `std::array` / `std::vector` / `span`。
- C 字符串以 `\0` 结尾；`std::string` 管理长度与内存，日常优先用它。
- 字面量有静态存储期；宽字符 / UTF 相关字面量前缀按需求选用，先搞清自己在处理什么编码。

## 易错点

- 把数组当作「可赋值的值类型」随意拷贝（原始数组赋值受限）。
- 忘记 `\0` 或长度与容量混淆。
- 返回指向局部字符数组的指针。

```cpp
int stack_a[4] = {1, 2, 3, 4};
std::string s = "cherno";
const char* lit = "hello";  // 字面量
```
