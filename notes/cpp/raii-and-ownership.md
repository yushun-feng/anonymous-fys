---
title: RAII 与所有权基础
tags: [cpp, raii, ownership]
topic: cpp
updated: 2026-11-03
---

# RAII 与所有权基础

> **交互**：[内存布局沙箱 `#/memory`](#/memory) 可对照栈帧与堆块寿命；[指针操作 `#/pointers`](#/pointers) 演示指向关系与 unique/shared/weak 计数。智能指针细节见下文与 LearnCpp 笔记。

RAII（Resource Acquisition Is Initialization）把资源生命周期绑在对象作用域上：构造时获取，析构时释放。

```cpp
#include <fstream>
#include <string>

class FileReader {
public:
  explicit FileReader(const std::string& path)
      : stream_(path) {
    if (!stream_) {
      throw std::runtime_error("open failed");
    }
  }

  // 析构自动关闭 stream_
  std::string readLine() {
    std::string line;
    std::getline(stream_, line);
    return line;
  }

private:
  std::ifstream stream_;
};
```

现代 C++ 里优先用 `unique_ptr` / `shared_ptr` / 容器表达所有权，少写裸 `new`/`delete`。

系统学习移动语义与智能指针，见 [LearnCpp 第 22 章笔记](./learncpp/ch22-move-smart-pointers.md)（含 Cherno 视角）；视频索引：[Cherno 智能指针](./cherno/09-smart-pointers.md)。
