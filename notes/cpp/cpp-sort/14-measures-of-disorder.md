---
title: cpp-sort：无序度量（Measures of disorder）
tags: [cpp, cpp-sort, probe, disorder, adaptive-sorting]
topic: cpp
updated: 2026-11-08
order: 14
source: https://github.com/Morwenn/cpp-sort
sourceUrl: https://github.com/Morwenn/cpp-sort/wiki/Measures-of-disorder
---

# 无序度量（probe）：数据「有多乱」

> 出处：[Wiki · Measures of disorder](https://github.com/Morwenn/cpp-sort/wiki/Measures-of-disorder)  
> 上一篇：[13 traits](#/note/cpp/cpp-sort/13-sorter-traits) · 下一篇：[15 比较器与投影](#/note/cpp/cpp-sort/15-comparators-and-projections) · 架构位置：[02](#/note/cpp/cpp-sort/02-sorter-architecture)

**Probe** 回答的是：给定典型输入，它更像「逆序对很多」，还是「run 很碎」，还是「离排序位置差一截」？据此再去选 $M$-adaptive 算法或 Rem 类 adapter。它们**不是**排序前必跑的热路径——多数 probe 本身就很贵。

命名空间：`cppsort::probe`。`#include <cpp-sort/probes.h>` 或单个 `probes/xxx.h`。接口贴近统一排序接口（range / 迭代器对、可选比较器与投影）。

```cpp
using namespace cppsort;
auto a = probe::inv(collection);
auto b = probe::rem(vec.begin(), vec.end());
auto c = probe::ham(li, std::greater{});
```

可用 `indirect_adapter` 等减轻部分代价（意义有限的 adapter 就别硬套）。每个 probe 还有：

```cpp
static constexpr auto max_for_size(Integer n) -> Integer;
```

返回长度为 $n$ 时该度量的理论上界，便于归一化。

## 形式定义（消化）

### Estivill-Castro：measure of disorder

非负实值函数 $M$，对序列 $X$：

1. **有序达最小**：$X$ 已排序时，$M(X)$ 等于同长度序列上的最小值（通常直觉为「越乱越大」）。  
2. **序同构不变**：相对次序相同的序列，$M$ 相同。

记号习惯：$X=\langle\ldots\rangle$；$|X|$ 为长度；$X\lt Y$ 表示 $X$ 中每个元素都小于 $Y$ 中每个；$XY$ 为拼接；子序列默认可非连续抽取。

### Mannila：measure of presortedness（更严）

对**互异**元素序列，非负整值 $M$ 还要满足：

1. 已排序 $\Rightarrow M(X)=0$  
2. 序同构 $\Rightarrow$ 相等  
3. $X$ 是 $Y$ 的子序列 $\Rightarrow M(X)\le M(Y)$  
4. $X\le Y$ $\Rightarrow M(XY)\le M(X)+M(Y)$  
5. $M(\langle e\rangle X)\le |X|+M(X)$

直觉：已排序零工；可拼接的两段有序块不应比分开排更「乱」；插一个元素的代价有上界。Chen 曾放宽常数项（有序时为常数 $a$、拼接允加 $b$ 等），更包罗历史度量，但**更不适合**估「最少要干多少活」。本文与库文档一致：说「presortedness」时默认指 Mannila 五条。

Estivill-Castro 还加了（更强的）**单调性 / 前缀单调性**；满足单调性者称 *monotonic measure of presortedness*。库表格里的 Monotonic 列对应这一点。

### $M$-optimal / $M$-adaptive

令 $S_X$ 为 $X$ 的全体排列：

$$\mathit{below}_M(X)=\{\pi\in S_X: M(\pi)\le M(X)\}$$

算法 $S$ 排序 $X$ 的步数为 $T_S(X)$。称 $S$ 为 **$M$-optimal**，若存在常数 $c$，对一切 $X$：

$$T_S(X)\le c\cdot\max\bigl\{|X|,\;\log|\mathit{below}_M(X)|\bigr\}$$

例如 Rem-optimal 期望能在 $O(|X|\log \mathit{Rem}(X))$ 量级完成（与下界只差常数因子）。

### 度量之间的偏序

「数字谁更大」不够。Chen：若存在常数 $c$ 使对一切 $X$ 有 $|\mathit{below}_{M_1}(X)|\le c\cdot|\mathit{below}_{M_2}(X)|$，则 $M_1\preceq M_2$（$M_1$ 更优/更细）。等价常靠夹逼：$M_1\le c\,M_2\le d\,M_1$（如 $\mathit{Max}\equiv\mathit{Dis}$ 来自 $\mathit{Max}\le\mathit{Dis}\le 2\,\mathit{Max}$）。

上游 Wiki 有偏序图（粗体为库中已实现的度量）。*Reg* 优于图中多数；平凡度量 *m₀* / *m₀₁* 垫底。*Mono*、*Amp* 与部分邻居的关系属库作者经验推导，对 *Osc* / *Loc* 等仍不完整。

## 库内 probe 一览

下列为消化摘要；复杂度 / 内存 / 迭代器 / 是否 monotonic 取自上游表格。已排序时多数返回 0（*Enc* 经改造后亦然）。

| Probe | 一句话 | 复杂度量级 | 内存 | 迭代器 | Mono. |
|-------|--------|------------|------|--------|-------|
| `amp` | 邻接序模式的「振幅」类度量 | $n$ | $1$ | Forward | 否 |
| `block` | 与排序结果相比，后继对不上的元素数 | $n\log n$ | $n$ | Forward | 否 |
| `dis` | 由一对逆序所张成的**最大距离** | $n$ 或 $n\log n$ | $n$ 或 $1$ | Bi / Fwd | 是 |
| `enc` | encroaching lists 的 Mannila 兼容改造 | $n\log n$ | $n$ | Forward | 否 |
| `exc` | 最少交换次数 $\approx |X|-\#\mathrm{cycles}$ | $n\log n$ | $n$ | Forward | 是 |
| `ham` | 不在排序位置上的元素个数（Hamming） | $n\log n$ | $n$ | Forward | 是 |
| `inv` | 逆序对个数 | $n\log n$ | $n$ | Forward | 是 |
| `max` | 元素到其排序位置的**最大位移** | $n\log n$ | $n$ | Forward | 是 |
| `mono` | 去掉多少段单调 run 才能有序（减 1） | $n$ | $1$ | Forward | 否 |
| `osc` | Oscillation：$\sum \|\mathrm{Cross}(x_i)\|$ | $n\log n$ | $n$ | Forward | 否 |
| `rem` | 为得到有序子序列需删的最少元素数 | $n\log n$ | $n$ | Forward | 是 |
| `reve` | 增长方向上的反转次数 | $n$ | $1$ | Forward | 否 |
| `runs` | 非降 run 数减 1 | $n$ | $1$ | Forward | 是 |
| `spear` | Spearman footrule：位置差之和 | $n\log n$ | $n$ | Forward | 是 |
| `sus` | 最少非降子序列划分数减 1（$\approx$ LDS$-1$） | $n\log n$ | $n$ | Forward | 是 |

### 关键公式与细节

**Inv** — 经典逆序对。$\langle 2,1,3,0\rangle$ 有 4 个。上界 $\lfloor n(n-1)/2\rfloor$（全逆序）。

**Rem** —

$$\mathit{Rem}(X)=|X|-\mathrm{LIS}_{\text{nondecreasing}}(X)$$

（最长非降子序列长度）。上界 $n-1$（全逆序）。对接 drop-merge / Rem-adaptive 直觉很直接。

**Exc** — 置换分解成循环后，$\mathit{Exc}(X)=|X|-\#\mathrm{cycles}$。等价元素时精确最少交换是 NP-hard，实现可能**偏大**；非随机访问可能明显更慢。

**Ham** — 与排序排列的 Hamming 距离。注意：有等价元素时对 Mannila 第 3、5 条可能不友好。

**Dis / Max** — Dis 是「某逆序对的下标跨度」最大值；Max 是元素须移动的最大距离。二者算法等价类上常一起讨论；`dis` 在内存够且双向迭代器时可 $O(n)$。

**Enc** — 原始 encroaching 列表个数对已排序非空序列返回 1，不符 Mannila 第 1 条。库实现 Estivill-Castro 的 $M_{\mathit{Enc}}$：已排序为 0，否则等于去掉**前导升序 run** 后对尾部算的 $\mathit{Enc}$。

**Osc** — 几何上：从 $x_i$ 画水平线，穿过多少条邻接边，再对 $i$ 求和。对等价元素 / 拼接准则有已知反例。

**Amp**（≥2.1）— 对邻接对打 $\mathrm{comp}\in\{-1,0,1\}$，看前缀和上的独特值等，再

$$\mathit{Amp}(X)=|X|-\mathit{PTP}(X)-N_{\mathrm{eq}}(X)-1$$

不满足 Mannila 第 4 条（两段各自有序拼起来可变「乱」）。

**Mono / Reve / Runs** — 都偏「看局部升降形状」：Mono 数单调段（减 1）；Reve 数增长方向拐点；Runs 数非降 run（减 1）。Mono/Reve 对「升段+降段」拼接常破第 4 条；Runs 是 monotonic presortedness。

**Spear** — $\sum_i |i-\pi^{-1}(i)|$ 一类（稳定排序处理等价元）。严格 Mannila 第 5 条不成立；$\lfloor\mathrm{Spear}/2\rfloor$ 才是合格 presortedness，未来版本可能改实现。

**SUS** — Shuffled UpSequences：最少非降（可非邻接）子序列划分数减 1，等于最长严格降子序列长度减 1。

**Block** — 「排序后后继是否仍是原后继」类计数；实现为贴合「有序→0」做了微调，对等价元 / 第 4 条有备注。

### 文献里有、库里没有（或改名）

| 名称 | 关系 |
|------|------|
| DS / D / F | 即库的 **Spear**（作者为避歧义选名） |
| Las | 最长升子序列长度——随「有序」增大，故不提供；用 Rem |
| Lds | 对应 **SUS** |
| Lads / SMS | 最少单调子序列划分；判定 $\le k$ 为 NP-complete，库不提供精确实现 |
| Par / Radius | 与 **Dis** 相同 |
| Pos | 与 **Ham** 相同 |

## 怎么用（工程向）

1. 从业务日志 / 基准集抽样，对 `inv`、`rem`、`runs`、`ham` 等各跑一次（可先小样本）。  
2. 若 $\mathit{Rem}$ 相对 $n$ 很小 → 考虑 Rem 友好算法或 `drop_merge_adapter` 一类。  
3. 若 run 很少（`runs`≈0）→ 自然归并 / tim 类更香的概率大。  
4. 用 `max_for_size(n)` 把原始计数归一化，再跨数据集比「乱度」。  
5. 与 [metrics](#/note/cpp/cpp-sort/11-metrics) 搭配：probe 选算法，metrics 验证比较次数/耗时是否如预期下降。

## 易错点

- **先 probe 再 sort 的热路径**：通常亏本。  
- **等价元素**：Exc / Block / Osc 等语义变脆或偏乐观/悲观。  
- **比较器方向**：`greater` 会改变「有序」定义，读数前确认比较器与生产一致。  
- **不是所有 probe 都是 Mannila presortedness**：表格 + 上文「不满足第 x 条」备注要一起看。

## 练习

1. 构造近乎有序、全逆序、少量乱点三种 `vector`，打印 `probe::rem` / `inv` / `runs`。  
2. 对同一序列算 `dis` 与 `max`，对照文献夹逼直觉。  
3. 读 `drop_merge_adapter`（或系列 adapter 笔记）说明，把它与 Rem 对上号。

下一篇：[15 Comparators and projections](#/note/cpp/cpp-sort/15-comparators-and-projections)。
