---
title: 第 8 章：控制流
tags: [cpp, learncpp, control-flow]
topic: cpp
updated: 2026-10-31
source: https://learncpp.cn/
---

# 第 8 章：控制流

> 来源：[learncpp.cn](https://learncpp.cn/) 第 8 章

## 小节地图

if（含常见问题、`if constexpr`）、switch 与穿透、`goto`、while / do-while / for、`break`/`continue`、提前退出、随机数与 MT19937、测验。

## 要点

- `switch` 默认贯穿；故意贯穿应标注意图（如 `[[fallthrough]]`）。
- 循环不变量与边界（开闭区间）先写清楚再写代码。
- 随机：用 `<random>`，不要用 `rand() % n` 当高质量方案；种子与引擎生命周期要合理。
- `if constexpr` 用于编译期分支（模板语境常见）。

## 易错点

- switch 忘 `break` 造成穿透 bug。
- 循环条件用浮点累加判断终止。
- 每次循环重新播种随机引擎，序列“看起来不随机”或每次相同。
