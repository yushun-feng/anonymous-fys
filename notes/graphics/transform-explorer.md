---
title: 变换沙箱：左乘 / 右乘与 TRS
tags: [graphics, transforms, matrix, interactive]
topic: graphics
updated: 2026-11-03
order: 12
---

# 变换沙箱：左乘 / 右乘与 TRS

交互页：[打开变换沙箱 `#/transform`](#/transform)

配合阅读：[第 2 章 向量、矩阵与变换](./foundation/ch02-vectors-transforms.md)

## 这一页在练什么

- **列向量约定**：\(\mathbf{p}' = M\mathbf{p}\)（与 LearnOpenGL / 本库 ch02 一致）。
- **同一增量 \(A\)** 两种挂法：
  - **左乘** \(M \leftarrow A\cdot M\)：在**世界坐标系**再变；
  - **右乘** \(M \leftarrow M\cdot A\)：在**物体局部系**再变。
- 示意物是**定向飞镖**（尖端 = 局部 \(+Z\)，尾翼辨滚转），比立方体更容易看出姿态。

## 建议操作顺序

1. 点「重置」，再点「① 右乘绕 Y 45°」让尖端歪掉。
2. 点「② 对比再绕 Y 45°」：蓝飞镖绕世界 Y，绿飞镖绕自身 Y。
3. 点「③ 对比平移 +X」：左乘走世界 \(+X\)，右乘走局部红轴——分叉最明显。
4. 「先 R 后 T / 先 T 后 R」把左右乘落到 TRS 顺序特例。
5. 拧滑条改 \(A\)，需要时点「采用左乘 / 采用右乘」写入当前 \(M\)。

## 和代码的对应

Three.js / GLM 风格里，对已有 `M` 再 `translate`/`rotate` 往往是**左乘语义**（世界系增量）。若要绕物体自身轴转，应右乘，或先变到局部再变回来。沙箱右侧矩阵表按**数学行**显示，底层为列主序存储。
