---
title: 第 2 章：向量、矩阵与变换
tags: [graphics, math, transforms, matrix, learnopengl, focg]
topic: graphics
updated: 2026-11-01
source: https://learnopengl.com/Getting-started/Transformations
order: 2
---

# 第 2 章：向量、矩阵与变换

> 学习材料：FoCG 线性代数与变换相关章节；[LearnOpenGL — Transformations](https://learnopengl.com/Getting-started/Transformations)（及 Coordinate Systems 中的 MVP 链）。
> 本章目标：能**手算**简单变换，能在 **列向量 + 矩阵左乘**约定下写出 MVP，并知道和行向量约定如何对偶翻译。

## 小节地图

| 小节主题 | 内容要点 |
|----------|----------|
| 点与向量 | 位置 vs 方向、齐次 \(w\) |
| 长度、归一化、点积、叉积 | 几何意义与着色中的用途 |
| 矩阵与复合 | 乘法顺序、结合律、不可交换 |
| 常用变换 | 平移、旋转、缩放、剪切 |
| 齐次坐标为什么必要 | 把平移写进矩阵 |
| 模型 / 视图 / 投影 | MVP 链与空间名称 |
| 约定与坑 | 列/行向量、度/弧度、左手/右手 |
| GLM 风格示意 | 与 LearnOpenGL 一致的用法 |

相关：[第 1 章 管线](./ch01-graphics-pipeline.md) · [第 3 章 着色器](./ch03-shaders-opengl-basics.md) · [路线图](./00-roadmap.md)

## 核心概念

### 点与向量

- **点（point）**：空间中的位置。
- **向量（vector）**：方向与长度；可表示位移、速度、法线（单位法线常忽略长度语义中的「位移」）。

从点 \(A\) 到点 \(B\) 的位移：\(\mathbf{v} = B - A\)。点 + 向量 → 新点；向量 + 向量 → 向量；点 + 点通常无几何意义（除非用仿射组合）。

三维图形常用 \(\mathbb{R}^3\)；进入矩阵管线后用**齐次坐标**扩到四维：点 \((x,y,z,1)\)，方向/向量 \((x,y,z,0)\)。对 \(w=0\) 做平移矩阵乘法时平移项不生效——这正是区分「位置」与「方向」的代数手段。

### 长度、归一化、点积、叉积

设 \(\mathbf{a},\mathbf{b}\in\mathbb{R}^3\)。

| 运算 | 记号 | 用途 |
|------|------|------|
| 长度 | \(\|\mathbf{a}\|\) | 距离、归一化前检查 |
| 归一化 | \(\hat{\mathbf{a}}=\mathbf{a}/\|\mathbf{a}\|\) | 方向、光照、相机基 |
| 点积 | \(\mathbf{a}\cdot\mathbf{b}=\|\mathbf{a}\|\|\mathbf{b}\|\cos\theta\) | 夹角、投影、Lambert 项 |
| 叉积 | \(\mathbf{a}\times\mathbf{b}\) | 垂直于两者的向量；面积/绕序；相机 `right`/`up` |

点积可正可负：钝角时为负。叉积方向由右手定则（在右手坐标系下）决定；两平行向量叉积为零。

```cpp
// 概念：归一化与点积（勿在生产中手写缺省实现而不处理零长）
float len = std::sqrt(x*x + y*y + z*z);
float nx = x / len, ny = y / len, nz = z / len;
float cosTheta = nx*lx + ny*ly + nz*lz; // 两单位向量点积
```

### 矩阵作用于向量

本笔记默认 **列向量**，变换写作：

\[
\mathbf{p}' = M\mathbf{p}
\]

复合变换「先 \(M_1\) 再 \(M_2\)」为：

\[
\mathbf{p}' = M_2(M_1\mathbf{p}) = (M_2 M_1)\mathbf{p}
\]

因此编码时常见：

```text
P * V * M * pLocal
```

即 **MVP** 写成 `projection * view * model`（GLM / LearnOpenGL）。若教材使用**行向量右乘** \(\mathbf{p}^T M\)，矩阵需转置、乘法顺序整体反转——同一几何，不同书包装。

矩阵乘法**不满足交换律**：先旋转再平移 ≠ 先平移再旋转。满足结合律，故可先把多枚矩阵乘成一枚再变换大量顶点（VS 里每顶点仍乘一次 UBO/uniform 里的结果）。

### 基本变换（3D 直觉）

**缩放（Scale）**  
对角矩阵 \(S=\mathrm{diag}(s_x,s_y,s_z)\)。非均匀缩放下，法线变换一般要用**逆转置**的线性部分，不能直接乘同一个 \(M\)（FoCG / 任意教材的法线变换警告）。

**旋转（Rotation）**  
绕坐标轴的基本旋转矩阵；绕任意单位轴可用罗德里格斯公式。旋转矩阵 \(R\) 满足 \(R^\top R=I\)、\(\det R=1\)（三维真旋转）。正交性 ⇒ 逆就是转置，数值上应尽量保持正交（累积误差可用重正交化）。

**平移（Translation）**  
仅用 \(3\times3\) 线性部分无法表达平移；齐次 \(4\times4\) 中把平移写入第四列（列向量约定）：

\[
T=\begin{pmatrix}
1 & 0 & 0 & t_x \\
0 & 1 & 0 & t_y \\
0 & 0 & 1 & t_z \\
0 & 0 & 0 & 1
\end{pmatrix}
,\quad
T\begin{pmatrix}x\\y\\z\\1\end{pmatrix}
=
\begin{pmatrix}x+t_x\\y+t_y\\z+t_z\\1\end{pmatrix}
\]

**仿射变换** = 线性部分 + 平移；图形里模型摆放几乎都是仿射（或投影，见下）。

### 模型、视图、投影（MVP）

| 矩阵 | 职责 |
|------|------|
| **Model** \(M\) | 局部 → 世界：物体摆放（缩放/旋转/平移复合） |
| **View** \(V\) | 世界 → 观察：等价于「相机外参的逆」；`lookAt` 构造常见 |
| **Projection** \(P\) | 观察 → 裁剪：透视或正交；引入透视时 \(w\) 参与除法 |

顶点着色器中经典写法：

```glsl
#version 330 core
layout (location = 0) in vec3 aPos;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
void main() {
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}
```

也可 CPU 侧预乘 `mat4 mvp = projection * view * model` 只传一个 uniform——大量物体时更常见「共享 VP、每物体 M」或实例化。

**透视投影**把视锥映到裁剪空间；透视除法 \(\,(x/w,y/w,z/w)\,\) 后进入 NDC。**正交投影**平行线仍平行，无近大远小。FoCG 会从针孔相机几何推导透视矩阵；LearnOpenGL 则直接给出 `glm::perspective(fov, aspect, near, far)` 用法——两者应对照着读：同一份矩阵，一套几何，一套 API。

### `lookAt` 直觉

给定眼睛位置 \(\mathbf{e}\)、目标 \(\mathbf{t}\)、世界上方向 \(\mathbf{u}_{world}\)：

1. \(\mathbf{f}=\mathrm{normalize}(\mathbf{t}-\mathbf{e})\)（前/看向，符号惯例因库而异）
2. \(\mathbf{r}=\mathrm{normalize}(\mathbf{f}\times\mathbf{u}_{world})\)（右）
3. \(\mathbf{u}=\mathbf{r}\times\mathbf{f}\)（相机上）
4. 用相机基与 \(-\mathbf{e}\) 拼出视图矩阵

实现细节以所用数学库为准；面试/推导时能画出相机正交基即可。

## 语法与 API 示意（GLM 风格）

LearnOpenGL 使用 GLM，列主、列向量，角度接口常为弧度（`glm::radians`）。

```cpp
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

glm::mat4 model(1.0f);
model = glm::translate(model, glm::vec3(0.0f, 1.0f, 0.0f));
model = glm::rotate(model, glm::radians(45.0f), glm::vec3(0, 1, 0));
model = glm::scale(model, glm::vec3(0.5f));

glm::mat4 view = glm::lookAt(
    glm::vec3(0, 0, 3),  // eye
    glm::vec3(0, 0, 0),  // center
    glm::vec3(0, 1, 0)   // up
);

glm::mat4 projection = glm::perspective(
    glm::radians(45.0f),
    aspectRatio,
    0.1f,
    100.0f
);
```

注意 `glm::translate/rotate/scale` 的**左乘语义**：`M = translate(M, t)` 表示在现有 \(M\) 基础上再施加平移（等价于 `M = T * M` 一类约定）。复合顺序与「本地空间先缩放再旋转再平移」的思考方式要在脑中对齐，必要时打印中间矩阵或用小场景验证。

## FoCG 视角补充：为什么要在乎基与正交

变换不仅是「把点挪走」，更是**换基**与**主动/被动变换**的故事：同一组坐标数字，在不同基下表示不同几何。视图矩阵把世界坐标表达成相机基下的坐标；法线用逆转置，是因为法线是**余向量**（变换规则与切向不同）。把这些术语与 OpenGL 里「传 `normalMatrix = transpose(inverse(mat3(model)))`」对齐，比死记公式更牢。

## 易错点

- **乘法顺序反了**：黑屏、物体在相机后面、旋转方向「怪」——先怀疑 MVP 顺序与约定。
- **对方向向量用了 \(w=1\)**：法线被平移「搬到别处」；方向应 \(w=0\)，或只乘模型矩阵的 \(3\times3\) 线性部分（并处理逆转置）。
- **角度单位**：GLM 三角与 `rotate` 用弧度；人脑常用角度——漏掉 `radians` 是经典 bug。
- **非均匀缩放 + 法线**：光照变怪时检查 normal matrix。
- **左右手坐标 / NDC \(z\) 范围**：OpenGL 传统 NDC \(z\in[-1,1]\)；其他 API 可能 \([0,1]\)。深度精度与投影矩阵推导都会变。
- **欧拉角万向节锁**：相机或物体用 pitch/yaw/roll 累加到极限姿态时丢失一个自由度；后续可用四元数（本阶段先会诊断现象）。

## 练习指引

- 手算：点 \((1,0,0)\) 先绕 \(Z\) 转 \(90^\circ\) 再平移 \((0,2,0)\)；再反过来算一遍，确认结果不同。
- 用 LearnOpenGL Transformations 练习：让箱子随时间旋转；再加入 `perspective` 与简单 `lookAt`，移动「相机」观察同一模型矩阵。
- 在 VS 里分别只乘 `model`、`view*model`、完整 MVP，观察物体如何逐步「进入」相机与透视。
- 构造一个非均匀缩放立方体，用法线可视化（把法线当颜色），对比「直接乘 model」与「逆转置」差异。
- 预习：把 `gl_Position = mvp * vec4(aPos,1)` 放进完整 VAO/着色器程序——[第 3 章](./ch03-shaders-opengl-basics.md)。

## 小结

- 点与向量用齐次 \(w\) 区分；点积/叉积是光照与相机的日常工具。
- 默认 **列向量左乘**；复合变换右端先作用；MVP = `P*V*M`。
- 平移依赖 \(4\times4\) 齐次矩阵；旋转宜保持正交；法线常用逆转置。
- `lookAt` 与 `perspective` 把 FoCG 的 viewing 几何接到 API；顺序与约定错误是第一排查项。
