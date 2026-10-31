---
title: PBR BRDF 速览
tags: [graphics, pbr, brdf]
topic: graphics
updated: 2026-10-31
---

# PBR BRDF 速览

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
