---
title: cpp-sort 工程工具
tags: [cpp, cpp-sort, cmake, conan, tooling]
topic: cpp
updated: 2026-11-08
order: 25
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Tooling
---

# cpp-sort 工程工具

> 出处：[Wiki · Tooling](https://github.com/Morwenn/cpp-sort/wiki/Tooling)  
> 上手：[01 概览](#/note/cpp/cpp-sort/01-overview) · 下一篇：[26 Benchmarks](#/note/cpp/cpp-sort/26-benchmarks)

库对 **CMake** 与 **Conan** 有开箱支持。仓库里还有大量 CI 专用配置，Wiki 不逐一文档化；若你要在 CI 外复用它们，可向上游开文档 issue。

## CMake：当依赖用

安装后（CMake ≥ 3.11）导出目标 `cpp-sort::cpp-sort`：

```cmake
find_package(cpp-sort REQUIRED CONFIG)
target_link_libraries(my-target PRIVATE cpp-sort::cpp-sort)
```

不想系统安装时，可当子目录：

```cmake
add_subdirectory(third_party/cpp-sort)
target_link_libraries(my-target PRIVATE cpp-sort::cpp-sort)
```

## CMake：编测试 / 示例时的选项

| 选项 | 作用 | 默认 |
|------|------|------|
| `CPPSORT_BUILD_TESTING` | 编测试套件 | 跟 `BUILD_TESTING` |
| `CPPSORT_BUILD_EXAMPLES` | 编 examples | `OFF` |
| `CPPSORT_ENABLE_COVERAGE` | 测试覆盖率 | `OFF` |
| `CPPSORT_USE_VALGRIND` | 经 Valgrind 跑测 | `OFF` |
| `CPPSORT_SANITIZE` | 传给 `-fsanitize` 的逗号列表 | 空 |
| `CPPSORT_STATIC_TESTS` | 部分测试改编译期执行 | `OFF` |
| `CPPSORT_ENABLE_ASSERTIONS` | 库内调试断言 | 跟 `CPPSORT_ENABLE_AUDITS` |
| `CPPSORT_ENABLE_AUDITS` | 昂贵审计断言 | `OFF` |
| `CPPSORT_USE_LIBASSERT` | 断言改用 [libassert](https://github.com/jeremy-rifkin/libassert)（实验） | `OFF` |

`CPPSORT_ENABLE_AUDITS=ON` 时，即使 `CPPSORT_ENABLE_ASSERTIONS=OFF` 也会打开相关断言（细节见上游 Home「Assertions / Audits」）。

测试依赖 **Catch2 ≥ 3.1.0**：系统有合适版本则用，否则拉最新合适 release。

## Conan

[Conan Center](https://conan.io/center/recipes/cpp-sort) 可搜可装：

```sh
conan search cpp-sort --remote=conancenter
conan install --requires=cpp-sort/2.2.0
```

Center 包是**最小集**：头文件、CMake 文件、许可证。要测试 / 基准 / 其它文件，需用仓库里的 `conanfile.py` 自建包。

## 离线翻 Wiki（Gollum）

若本机装了 [Gollum](https://github.com/gollum/gollum)，可在主仓库目录：

```sh
gollum --page-file-dir docs --ref <branch-name> --math katex
# 浏览器打开 http://localhost:4567/Home
```

便于浏览**旧版文档**。`--ref` 似乎不认 tag，需先从版本 tag 建出真正的分支。

## 学习侧建议

- 日常项目：`find_package` / `add_subdirectory` + `cpp-sort::cpp-sort` 即可。  
- 跟教程改 adapter：打开 `CPPSORT_BUILD_EXAMPLES`。  
- 怀疑库内不变量：本地开 `CPPSORT_ENABLE_ASSERTIONS` / `AUDITS`。  
- 版本门控与编译器扩展见 [27 Changelog 摘要](#/note/cpp/cpp-sort/27-changelog)。
