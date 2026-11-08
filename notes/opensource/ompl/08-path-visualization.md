---
title: 解路径可视化
tags: [opensource, ompl, tutorials, beginner, visualization]
topic: opensource
updated: 2026-11-08
order: 8
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/pathVisualization.html
---

# 解路径可视化

> **出处**：[Tutorials · Visualizing solution paths](https://ompl.kavrakilab.org/pathVisualization.html)  
> **说明**：OMPL **无内置**可视化；套路是 `printAsMatrix()` → 文本 → 外部工具。

## 导出矩阵

- `PathGeometric`：每行一个状态  
- `PathControl`：每行还含控制量与时长（首行控制为 0）；可先 `asGeometric()`（按传播步长插值）再打印  

```python
solved = ss.solve(20.0)
if solved:
    print(ss.getSolutionPath().printAsMatrix())  # geometric
    # control: print(ss.getSolutionPath().asGeometric().printAsMatrix())
```

```cpp
if (ss.solve(20.0))
{
    ss.getSolutionPath().printAsMatrix(std::cout);
    // control: ss.getSolutionPath().asGeometric().printAsMatrix(std::cout);
}
```

重定向到 `path.txt`。SE(3) 时：前三列位置，后四列单位四元数。

## 外部工具速览

**Matplotlib**

```python
from mpl_toolkits.mplot3d import Axes3D
import numpy, matplotlib.pyplot as plt
data = numpy.loadtxt('path.txt')
ax = plt.axes(projection='3d')
ax.plot(data[:,0], data[:,1], data[:,2], '.-')
plt.show()
```

**Matlab / Octave**：`plot3(data(:,1), data(:,2), data(:,3), 'o-');`

**gnuplot**：`splot "path.txt" using 1:2:3 with linespoints`

另有 Excel（2D scatter）、R `scatterplot3d` 等。姿态小坐标系可用第 4–7 列四元数自行画——上游留作练习。

## 练习指引

1. 对 SE(3) demo 导出矩阵，只画位置折线。  
2. 对 control 路径对比 `printAsMatrix` 与 `asGeometric()` 行数差异。  

下一章：[规划器基准](#/note/opensource/ompl/09-benchmark)
