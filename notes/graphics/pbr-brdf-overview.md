---
title: PBR BRDF 速览
tags: [graphics, pbr, brdf]
topic: graphics
updated: 2026-11-01
---

# PBR BRDF 速览

> 进阶专题短文。入门路径见 [图形学基础路线图](./foundation/00-roadmap.md)；管线 / 变换 / 着色器见 foundation 第 1–3 章。

物理基础渲染常用 Cook-Torrance 形式拆成漫反射与镜面项：

\[
f(\mathbf{l},\mathbf{v}) = f_{\mathrm{diffuse}} + f_{\mathrm{specular}}
\]

镜面项可写成：

\[
f_{\mathrm{specular}} = \frac{D\,F\,G}{4\,(\mathbf{n}\cdot\mathbf{l})\,(\mathbf{n}\cdot\mathbf{v})}
\]

其中 \(D\) 为法线分布、\(F\) 为菲涅尔、\(G\) 为几何遮蔽。

```glsl
// 简化 Schlick 菲涅尔（示意）
vec3 F_Schlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
```

金属工作流里 `metallic` 控制漫反射衰减与 `F0` 插值。
