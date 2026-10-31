---
title: GPU 内存层次速记
tags: [gpu, memory, cuda]
topic: gpu
updated: 2026-10-31
---

# GPU 内存层次速记

常见层次（由快到慢、由小到大，示意）：

1. **Registers** — 每线程私有，延迟最低
2. **Shared memory / LDS** — 线程块共享，适合 tile / 归约
3. **L1 / L2 cache** — 硬件缓存，对全局访问友好
4. **Global / device memory** — 容量大，带宽有限，需合并访问

```hlsl
// HLSL 组共享内存示意（compute shader）
groupshared float tile[256];

[numthreads(256, 1, 1)]
void CSMain(uint3 tid : SV_DispatchThreadID,
            uint  gid : SV_GroupIndex) {
  tile[gid] = /* load from SRV */;
  GroupMemoryBarrierWithGroupSync();
  // reduce / reuse tile ...
}
```

写 kernel 时优先考虑：合并全局读写、提高占用率、用 shared memory 复用数据。
