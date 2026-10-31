---
title: Cherno：线程与计时
tags: [cpp, cherno, threads, timing]
topic: cpp
updated: 2026-10-31
source: https://www.youtube.com/watch?v=wXBcwHwIt_I
---

# Cherno：线程与计时

> 视频：[Threads](https://www.youtube.com/watch?v=wXBcwHwIt_I) · [Timing](https://www.youtube.com/watch?v=oEx5vGNFrLk)  
> 相关：并发细节需另参标准库文档；所有权见 [09](./09-smart-pointers.md)、[RAII](../raii-and-ownership.md)

## 覆盖集

`std::thread` 启动并发工作；`join` / `detach`；用 chrono 测耗时；为后续 async 等章节打底。

## 要点

- 线程让函数在另一执行流运行；创建后通常 **`join` 等待结束**，或明确 `detach`（要确保对象/资源仍有效）。
- 共享可变状态需要同步（互斥锁等）；系列入门集先建立「能开线程」的心智模型，生产代码还要补数据竞争知识。
- 计时：`std::chrono` 取时间点做差，用于基准与日志；注意时钟类型与分辨率。
- 作用域守卫（锁、timer）再次体现 RAII。

## 易错点

- 线程仍在跑时，其引用的局部对象已销毁。
- 既不 `join` 也不 `detach`，`std::thread` 析构会 `std::terminate`。
- 无同步地并发读写同一数据。

```cpp
#include <thread>
#include <chrono>

void work() { /* ... */ }

std::thread t(work);
t.join();

auto t0 = std::chrono::steady_clock::now();
// ...
auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
    std::chrono::steady_clock::now() - t0);
```
