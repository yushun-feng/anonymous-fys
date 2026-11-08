---
title: 新规划器的 Python 绑定
tags: [opensource, ompl, tutorials, advanced, python, bindings]
topic: opensource
updated: 2026-11-08
order: 20
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/pybindingsPlanner.html
---

# 新规划器的 Python 绑定

> **出处**：[Tutorials · Creating Python bindings for a new planner](https://ompl.kavrakilab.org/pybindingsPlanner.html)  
> **绑定技术**：上游现用 [Nanobind](https://nanobind.readthedocs.io)（以当前文档为准）

## 步骤

1. 在 `bindings/` 下按与 `src/` 对应的路径新增绑定文件，参照已有规划器绑定  
2. 在 `ompl/py-bindings/python.cpp` 中调用你的注册函数并重建绑定  
3. **多线程规划器**额外小心——见 [Python bindings good practices](https://ompl.kavrakilab.org/python.html#py_good_practices)

## 参数与 UI 提示

通过 `Planner::declareParam` 暴露可调参数。可选给 `GenericParam::rangeSuggestion_` 提供建议取值范围，供外部工具生成控件（语法见该类文档）。

## 练习指引

1. 对照一个现有几何规划器的 bindings 文件，列出最小必写符号。  
2. 为自己玩具规划器加一个 `declareParam` 双精度参数并在 Python 里改。  

下一章：[投影](#/note/opensource/ompl/21-projections)
