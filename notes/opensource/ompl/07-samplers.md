---
title: 合法状态采样器
tags: [opensource, ompl, tutorials, beginner, sampling]
topic: opensource
updated: 2026-11-08
order: 7
source: OMPL
sourceUrl: https://ompl.kavrakilab.org/samplers.html
---

# 合法状态采样器

> **出处**：[Tutorials · Using existing samplers and creating new ones](https://ompl.kavrakilab.org/samplers.html)  
> **配套 demo**：`StateSampling.cpp` / `.py`

## 两类采样器

| 类型 | 角色 |
|------|------|
| `StateSampler` | 在**状态空间**上均匀 / 近邻 / 高斯采样（每空间需对应实现） |
| `ValidStateSampler` | 反复用空间采样器，直到 `SpaceInformation::isValid` 或达最大迭代 |

内置合法采样器：

- **UniformValidStateSampler**（默认）：均匀拒绝采样  
- **ObstacleBasedValidStateSampler**：找一非法 + 一合法，从合法向非法插值，返回碰上非法前的最后合法点（利窄通道）  
- **GaussianValidStateSampler**：一对样本（均匀 + 围绕前者的高斯），一合法一非法则返回合法者  
- **MaximizeClearanceValidStateSampler**：均匀找到合法后再追求更大 clearance  

## 选用现成采样器

不能直接「set 类型」——每线程要自己的采样器副本。提供 **allocator**：

```cpp
ob::ValidStateSamplerPtr allocOBValidStateSampler(const ob::SpaceInformation *si)
{
    return std::make_shared<ob::ObstacleBasedValidStateSampler>(si);
}

ss.getSpaceInformation()->setValidStateSamplerAllocator(allocOBValidStateSampler);
```

## 自定义：直接从自由空间采样

若自由集可显式描述，**比拒绝采样高效得多**（上游立方体 + 矩形障碍例子）：

```cpp
class MyValidStateSampler : public ob::ValidStateSampler
{
public:
    MyValidStateSampler(const ob::SpaceInformation *si) : ValidStateSampler(si)
    {
        name_ = "my sampler";
    }

    bool sample(ob::State *state) override
    {
        double *val = static_cast<ob::RealVectorStateSpace::StateType *>(state)->values;
        double z = rng_.uniformReal(-1, 1);
        // 在 z∈[.25,.5] 时避开窄障碍：|x|>.8 且 |y|>.8 的区域采样……
        // （完整分支见上游 / StateSampling.cpp）
        val[2] = z;
        assert(si_->isValid(state));
        return true;
    }

    bool sampleNear(ob::State *, const ob::State *, double) override
    {
        throw ompl::Exception("MyValidStateSampler::sampleNear", "not implemented");
        return false;
    }
protected:
    ompl::RNG rng_;
};

ob::ValidStateSamplerPtr allocMyValidStateSampler(const ob::SpaceInformation *si)
{
    return std::make_shared<MyValidStateSampler>(si);
}
```

有距离场 / 梯度时，也可做成利用 clearance 的启发式采样器。

## 练习指引

1. 同一窄通道问题对比 Uniform vs ObstacleBased。  
2. 实现最小自定义采样器，断言采样点总合法。  

下一章：[路径可视化](#/note/opensource/ompl/08-path-visualization)
