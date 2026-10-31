---
title: Cherno：auto、函数指针、lambda 与命名空间
tags: [cpp, cherno, lambda, auto, namespaces]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=mWgmBBz0y8c
---

# Cherno：auto、函数指针、lambda 与命名空间

> 视频：[auto](https://www.youtube.com/watch?v=2vOPEuiGXVo) · [Function Pointers](https://www.youtube.com/watch?v=p4sDgQ-jao4) · [Lambdas](https://www.youtube.com/watch?v=mWgmBBz0y8c) · [Namespaces](https://www.youtube.com/watch?v=ts1Eek5w7ZA) · [Why not using namespace std](https://www.youtube.com/watch?v=4NYC-VU-svE)  
> 相关：[LearnCpp ch10 `auto`](../learncpp/ch10-type-conversion.md)、[ch20](../learncpp/ch20-advanced-functions.md)、[ch07](../learncpp/ch07-scope-duration-linkage.md)

## 覆盖集

`auto` 推导；函数指针作回调；lambda 闭包；命名空间与「为何慎用 `using namespace std`」。

## 要点

- `auto` 减噪音，但接口边界（头文件 API）常仍写清类型；注意引用/`const` 推导细节。
- 函数指针：把函数当值传递，适合 C 风格回调；类型签名要匹配。
- lambda：就地定义可调用对象，可捕获周围变量；常与算法、`std::function`、线程入口搭配。
- 命名空间避免名字冲突；在头文件里全局 `using namespace std;` 易污染与歧义——系列也专门讨论过这一点。

## 易错点

- lambda 按引用捕获局部变量并在寿命结束后调用。
- 函数指针与成员函数指针混淆。
- 头文件滥用 using 指令导致 ADL / 重载意外。

```cpp
auto add = [](int a, int b) { return a + b; };
void (*fp)(int) = [](int x) { std::cout << x; };  // 无捕获时可转函数指针
```
