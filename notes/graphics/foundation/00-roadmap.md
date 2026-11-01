---
title: 图形学基础：学习路线与章节地图
tags: [graphics, roadmap, learnopengl, focg]
topic: graphics
updated: 2026-11-01
source: https://learnopengl.com/
order: 0
---

# 图形学基础：学习路线与章节地图

按 **[LearnOpenGL](https://learnopengl.com/)**（实践向：现代 OpenGL / GLSL）与 ***Fundamentals of Computer Graphics*（第 5 版，简称 FoCG）**（理论向：成像、几何、变换、管线）交织整理的**中文学习笔记索引**。各章用自己的话组织概念、约定、可运行示意与易错点，覆盖主干而非逐字摘抄。

相关：[`../pbr-brdf-overview.md`](../pbr-brdf-overview.md) · [LearnOpenGL](https://learnopengl.com/) · [FoCG 图书页（CRC）](https://www.routledge.com/Fundamentals-of-Computer-Graphics/Marschner-Shirley/p/book/9780367505035)

## 两条主线如何合流

| 视角 | 主要回答 | 本库落点 |
|------|----------|----------|
| FoCG | 图像如何形成？几何与变换如何数学化？光栅化管线各阶段在算什么？ | 管线总览、向量/矩阵/变换、相机与投影的几何意义 |
| LearnOpenGL | 在现代 OpenGL 里如何建上下文、送顶点、写着色器、拼 MVP、做光照与贴图？ | 窗口与缓冲对象、GLSL、坐标空间、纹理与光照练习路径 |

建议读法：**先建立 FoCG 式心智模型（空间、变换、管线阶段），再立刻用 LearnOpenGL 把同一概念落到 API 与着色器上**。本系列前几章刻意把「为什么」与「怎么写」放在同一篇里。

## 建议路径

1. **成像与管线**：第 1 章——从像素/帧缓冲到顶点→光栅→片元的阶段划分
2. **线性代数工具箱**：第 2 章——向量、矩阵、齐次坐标、刚体/仿射变换、约定（行/列向量）
3. **可编程管线入门**：第 3 章——OpenGL 对象模型、VAO/VBO、顶点/片元着色器、MVP 串联
4. **后续（规划中）**：纹理与采样 · 相机与交互 · 基础光照 · 深度/模板 · 进阶缓冲与实例化 · 与 PBR 专题衔接

## 章节地图

| 章 | 主题 | 本库笔记 | 主要对照 |
|----|------|----------|----------|
| — | 路线与地图 | [00-roadmap](./00-roadmap.md) | 全书导航 |
| 1 | 图形管线与成像基础 | [ch01](./ch01-graphics-pipeline.md) | FoCG：成像/光栅化概览；LearnOpenGL：Getting started / Hello Triangle 背景 |
| 2 | 向量、矩阵与变换 | [ch02](./ch02-vectors-transforms.md) | FoCG：线性代数与变换；LearnOpenGL：Transformations |
| 3 | 着色器与 OpenGL 基础 | [ch03](./ch03-shaders-opengl-basics.md) | LearnOpenGL：Shaders / Hello Triangle；FoCG：可编程阶段角色 |
| ※ | PBR / BRDF 速览 | [pbr-brdf](../pbr-brdf-overview.md) | 进阶专题（独立短文） |

## 主题速查（跨源）

- **帧缓冲 / 像素 / 颜色**：数字图像是离散采样；屏幕最终是一份可展示的颜色缓冲
- **图元装配与光栅化**：顶点 → 三角形 → 片元覆盖与插值
- **坐标空间链**：局部 → 世界 → 观察 → 裁剪 → NDC → 屏幕
- **齐次坐标与矩阵**：平移进线性代数；复合变换右乘/左乘取决于列/行向量约定
- **着色器程序**：CPU 侧绑定缓冲与状态；GPU 侧 VS/FS（及后续 GS/CS 等）执行
- **深度测试**：解决遮挡；与透视除法、NDC 深度范围密切相关
- **纹理**：把二维（或立方体等）图像映射到表面；过滤与环绕模式影响观感与性能

## 环境与前置（实践侧）

LearnOpenGL 默认假设：C++、能创建 OpenGL 4.x / 3.3 core 上下文的窗口库（教程常用 GLFW）、加载函数指针的加载器（如 GLAD）、数学库（教程常用 GLM）。本笔记以**概念与最小 GLSL/API 片段**为主，不绑定某一脚手架仓库；你本地可用教程官方代码、或自建最小窗口。

理论侧 FoCG 不依赖特定 API：同一管线思想可映射到 Vulkan、Metal、D3D 或软件光栅器——本系列用 OpenGL 作**可操作的参照实现**。

## 阅读约定

- **列向量 + 矩阵左乘**是 LearnOpenGL / GLM / 多数实时图形惯例；笔记默认此约定，并在变换章标明与「行向量右乘」的对偶关系。
- 代码块语言标为 `cpp` / `glsl` / `bash`，便于站点高亮。
- 公式用 LaTeX 风格记号；浏览页若未渲染公式，仍可按纯文本阅读符号。
- 章末「练习指引」偏动手验证；「小结」只收可记忆的命题。

## 后续扩展备忘（未单独立章）

| 主题 | 建议衔接 |
|------|----------|
| 纹理、多纹理、采样器状态 | LearnOpenGL Textures → 过滤/mipmap 理论 |
| 相机、欧拉角、万向节锁 | LearnOpenGL Camera + FoCG Viewing |
| Phong / Blinn 与材质 | LearnOpenGL Lighting；再过渡到 [`pbr-brdf`](../pbr-brdf-overview.md) |
| 模板、混合、帧缓冲对象 | Advanced OpenGL |
| 阴影映射、法线贴图、IBL | Advanced Lighting / PBR |
