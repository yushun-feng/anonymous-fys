/**
 * Interactive process memory layout sandbox (stack ↓ / heap ↑).
 * Clickable regions + allocate/free/call/return controls. Chinese UI.
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STACK_TOP = 0x7fffffff0000;
const HEAP_BASE = 0x555555559000;

const FRAME_PRESETS = [
  {
    id: 'main',
    label: 'main()',
    locals: [
      { name: 'argc', bytes: 4 },
      { name: 'argv', bytes: 8 },
    ],
  },
  {
    id: 'foo',
    label: 'foo()',
    locals: [
      { name: 'x', bytes: 4 },
      { name: 'buf[16]', bytes: 16 },
    ],
  },
  {
    id: 'bar',
    label: 'bar()',
    locals: [
      { name: 'n', bytes: 8 },
      { name: 'tmp', bytes: 8 },
    ],
  },
  {
    id: 'recurse',
    label: 'recur()',
    locals: [{ name: 'depth', bytes: 4 }],
  },
];

const HEAP_PRESETS = [
  { label: 'new int', bytes: 4, tag: 'int' },
  { label: 'new int[4]', bytes: 16, tag: 'int[4]' },
  { label: 'new Obj', bytes: 32, tag: 'Obj' },
  { label: 'malloc(64)', bytes: 64, tag: 'raw64' },
];

/** Automatic (stack) locals the user can push into the top frame. */
const LOCAL_PRESETS = [
  { label: 'int x', name: 'x', bytes: 4 },
  { label: 'long n', name: 'n', bytes: 8 },
  { label: 'void* p', name: 'p', bytes: 8 },
  { label: 'char buf[32]', name: 'buf[32]', bytes: 32 },
];

const DEMOS = [
  {
    id: 'call-chain',
    label: '演示：调用链压栈',
    steps: ['reset', 'call:foo', 'call:bar', 'select-stack-top', 'ret', 'ret'],
  },
  {
    id: 'auto-locals',
    label: '演示：自动变量进栈',
    steps: ['reset', 'call:foo', 'local:0', 'local:3', 'select-stack-top'],
  },
  {
    id: 'heap-life',
    label: '演示：堆分配与释放',
    steps: ['reset', 'heap:0', 'heap:2', 'select-heap-0', 'free', 'heap:1'],
  },
  {
    id: 'meet-in-middle',
    label: '演示：栈↓ 堆↑ 相向',
    steps: ['reset', 'call:foo', 'heap:0', 'call:bar', 'heap:2', 'heap:3'],
  },
];

function fmtAddr(n) {
  return `0x${n.toString(16)}`;
}

function fmtBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${n} B`;
}

function frameBytes(locals) {
  return locals.reduce((s, l) => s + l.bytes, 16); // +16 teaching overhead (retaddr/fp)
}

/** Teaching frame slots: high → low = retaddr, saved FP, then locals. */
function frameSlots(fr) {
  /** @type {{ name: string, bytes: number, addr: number, kind: string }[]} */
  const slots = [];
  let cursor = fr.base + fr.size;
  cursor -= 8;
  slots.push({ name: 'retaddr', bytes: 8, addr: cursor, kind: 'meta', kindLabel: '控制' });
  cursor -= 8;
  slots.push({ name: 'saved FP', bytes: 8, addr: cursor, kind: 'meta', kindLabel: '控制' });
  for (const loc of fr.locals) {
    cursor -= loc.bytes;
    slots.push({
      name: loc.name,
      bytes: loc.bytes,
      addr: cursor,
      kind: 'local',
      kindLabel: '自动变量',
    });
  }
  return slots;
}

/**
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 */
export function mountMemoryExplorer(container, options = {}) {
  const compact = Boolean(options.compact);

  /** @type {{
   *   frames: { uid: string, presetId: string, label: string, locals: {name:string,bytes:number}[], base: number, size: number }[],
   *   blocks: { uid: string, label: string, tag: string, bytes: number, addr: number, live: boolean }[],
   *   heapBump: number,
   *   selected: null | { kind: 'stack'|'heap', uid: string },
   *   log: { no: number, op: string, detail: string }[],
   *   logNo: number,
   * }} */
  let state = freshState();
  /** @type {ReturnType<typeof setInterval> | null} */
  let demoTimer = null;
  let demoPlaying = false;
  /** @type {string[]} */
  let demoQueue = [];

  const shell = document.createElement('section');
  shell.className = `mem-layout${compact ? ' mem-layout--compact' : ''}`;
  shell.setAttribute('aria-label', '可交互进程内存布局');

  function freshState() {
    const main = FRAME_PRESETS[0];
    const size = frameBytes(main.locals);
    return {
      frames: [
        {
          uid: 'frame-main',
          presetId: 'main',
          label: main.label,
          locals: main.locals.map((l) => ({ ...l })),
          base: STACK_TOP - size,
          size,
        },
      ],
      blocks: [],
      heapBump: HEAP_BASE,
      selected: { kind: 'stack', uid: 'frame-main' },
      log: [
        {
          no: 1,
          op: 'INIT',
          detail: `进程启动，main 帧 @ ${fmtAddr(STACK_TOP - size)}`,
        },
      ],
      logNo: 1,
    };
  }

  function pushLog(op, detail) {
    state.logNo += 1;
    state.log.push({ no: state.logNo, op, detail });
    if (state.log.length > 40) state.log = state.log.slice(-40);
  }

  function stackPointer() {
    if (!state.frames.length) return STACK_TOP;
    const top = state.frames[state.frames.length - 1];
    return top.base;
  }

  function stopDemo() {
    if (demoTimer != null) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
    demoPlaying = false;
    demoQueue = [];
  }

  function reset() {
    stopDemo();
    state = freshState();
    render();
  }

  function callFrame(presetId, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const preset = FRAME_PRESETS.find((f) => f.id === presetId);
    if (!preset) return;
    if (state.frames.length >= 8) {
      pushLog('LIMIT', '教学沙箱最多 8 层栈帧');
      render();
      return;
    }
    const size = frameBytes(preset.locals);
    const sp = stackPointer();
    const base = sp - size;
    // collide with heap?
    if (base <= state.heapBump + 64) {
      pushLog('FAULT', '栈与堆过于接近（示意栈溢出风险）——先释放堆或返回');
      render();
      return;
    }
    const uid = `frame-${presetId}-${state.logNo + 1}`;
    state.frames.push({
      uid,
      presetId: preset.id,
      label: preset.label,
      locals: preset.locals.map((l) => ({ ...l })),
      base,
      size,
    });
    state.selected = { kind: 'stack', uid };
    pushLog('CALL', `调用 ${preset.label}，新帧 ${fmtAddr(base)} … ${fmtAddr(base + size)}（栈↓）`);
    render();
  }

  function retFrame({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    if (state.frames.length <= 1) {
      pushLog('RET', '已在 main，无法再返回');
      render();
      return;
    }
    const gone = state.frames.pop();
    if (state.selected?.kind === 'stack' && state.selected.uid === gone.uid) {
      state.selected = {
        kind: 'stack',
        uid: state.frames[state.frames.length - 1].uid,
      };
    }
    pushLog('RET', `返回，弹出 ${gone.label}（${gone.size} B）`);
    render();
  }

  function allocHeap(presetIndex, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const preset = HEAP_PRESETS[presetIndex];
    if (!preset) return;
    if (state.blocks.filter((b) => b.live).length >= 12) {
      pushLog('LIMIT', '教学沙箱最多 12 个存活堆块');
      render();
      return;
    }
    const addr = state.heapBump;
    const next = state.heapBump + preset.bytes + 8; // +8 header sketch
    if (next + 64 >= stackPointer()) {
      pushLog('FAULT', '堆向上扩张将撞上栈——先返回或缩小分配');
      render();
      return;
    }
    const uid = `heap-${state.logNo + 1}`;
    state.blocks.push({
      uid,
      label: preset.label,
      tag: preset.tag,
      bytes: preset.bytes,
      header: 8,
      addr,
      live: true,
    });
    state.heapBump = next;
    state.selected = { kind: 'heap', uid };
    pushLog(
      'NEW',
      `${preset.label} @ ${fmtAddr(addr)}（${preset.bytes} B），堆 bump → ${fmtAddr(next)}（堆↑）`,
    );
    render();
  }

  function addLocal(presetIndex, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const preset = LOCAL_PRESETS[presetIndex];
    if (!preset) return;
    if (!state.frames.length) return;
    const fr = state.frames[state.frames.length - 1];
    if (fr.locals.length >= 10) {
      pushLog('LIMIT', '单帧最多 10 个自动变量（教学限制）');
      render();
      return;
    }
    // Disambiguate duplicate names: x, x#2, …
    let name = preset.name;
    const same = fr.locals.filter((l) => l.name === name || l.name.startsWith(`${name}#`)).length;
    if (same > 0) name = `${preset.name}#${same + 1}`;

    const high = fr.base + fr.size;
    const nextLocals = [...fr.locals, { name, bytes: preset.bytes }];
    const nextSize = frameBytes(nextLocals);
    const nextBase = high - nextSize;
    if (nextBase <= state.heapBump + 64) {
      pushLog('FAULT', '自动变量过大，栈将撞上堆——先返回或释放堆');
      render();
      return;
    }
    fr.locals = nextLocals;
    fr.size = nextSize;
    fr.base = nextBase;
    state.selected = { kind: 'stack', uid: fr.uid };
    pushLog(
      'AUTO',
      `${fr.label} 增加自动变量 ${name}（${preset.bytes} B），帧基址 → ${fmtAddr(nextBase)}（栈↓）`,
    );
    render();
  }

  function freeSelected({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    if (state.selected?.kind !== 'heap') {
      pushLog('FREE', '请先点选一个堆块再释放');
      render();
      return;
    }
    const blk = state.blocks.find((b) => b.uid === state.selected.uid);
    if (!blk || !blk.live) {
      pushLog('FREE', '该块已释放或不存在');
      render();
      return;
    }
    blk.live = false;
    pushLog('DELETE', `释放 ${blk.label} @ ${fmtAddr(blk.addr)}（示意；未做真实 coalescing）`);
    render();
  }

  function select(kind, uid) {
    stopDemo();
    state.selected = { kind, uid };
    render();
  }

  function runDemoStep(token) {
    const demoOpts = { fromDemo: true };
    if (token === 'reset') {
      state = freshState();
      return;
    }
    if (token.startsWith('call:')) {
      callFrame(token.slice(5), demoOpts);
      return;
    }
    if (token === 'ret') {
      retFrame(demoOpts);
      return;
    }
    if (token.startsWith('heap:')) {
      allocHeap(Number(token.slice(5)), demoOpts);
      return;
    }
    if (token.startsWith('local:')) {
      addLocal(Number(token.slice(6)), demoOpts);
      return;
    }
    if (token === 'free') {
      freeSelected(demoOpts);
      return;
    }
    if (token === 'select-stack-top') {
      const top = state.frames[state.frames.length - 1];
      if (top) state.selected = { kind: 'stack', uid: top.uid };
      render();
      return;
    }
    if (token.startsWith('select-heap-')) {
      const idx = Number(token.replace('select-heap-', ''));
      const live = state.blocks.filter((b) => b.live);
      const blk = live[idx] || state.blocks[idx];
      if (blk) state.selected = { kind: 'heap', uid: blk.uid };
      render();
    }
  }

  function playDemo(demoId) {
    const demo = DEMOS.find((d) => d.id === demoId);
    if (!demo) return;
    stopDemo();
    demoPlaying = true;
    demoQueue = [...demo.steps];
    const tick = () => {
      const step = demoQueue.shift();
      if (!step) {
        stopDemo();
        render();
        return;
      }
      runDemoStep(step);
      // callFrame/ret/etc already render; ensure UI for reset-only
      if (step === 'reset') render();
    };
    demoTimer = setInterval(tick, 1100);
    tick();
  }

  function usageStats() {
    const sp = stackPointer();
    const stackUsed = STACK_TOP - sp;
    const live = state.blocks.filter((b) => b.live);
    const heapLive = live.reduce((s, b) => s + b.bytes + (b.header || 8), 0);
    const heapFreed = state.blocks.filter((b) => !b.live).length;
    const gap = Math.max(0, sp - state.heapBump);
    return { sp, stackUsed, heapLive, heapFreed, liveCount: live.length, gap, depth: state.frames.length };
  }

  function selectedDetail() {
    if (!state.selected) {
      return `<p class="mem-layout__hint">点击栈帧或堆块查看详情；用左侧按钮改变布局。</p>`;
    }
    if (state.selected.kind === 'stack') {
      const idx = state.frames.findIndex((f) => f.uid === state.selected.uid);
      const fr = state.frames[idx];
      if (!fr) return '';
      const isTop = idx === state.frames.length - 1;
      const caller = idx > 0 ? state.frames[idx - 1] : null;
      const slots = frameSlots(fr)
        .map(
          (s) => `
          <tr class="is-${s.kind}">
            <td><code>${fmtAddr(s.addr)}</code></td>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.kindLabel)}</td>
            <td>${s.bytes} B</td>
          </tr>`,
        )
        .join('');
      const autoCount = fr.locals.length;
      return `
        <h4 class="mem-layout__detail-title">栈帧 · ${escapeHtml(fr.label)}</h4>
        <dl class="mem-layout__facts">
          <div><dt>深度</dt><dd>#${idx}${isTop ? ' · 当前顶帧（SP）' : ''}</dd></div>
          <div><dt>调用者</dt><dd>${caller ? escapeHtml(caller.label) : '（进程入口）'}</dd></div>
          <div><dt>帧基址 SP′</dt><dd><code>${fmtAddr(fr.base)}</code></dd></div>
          <div><dt>帧高址</dt><dd><code>${fmtAddr(fr.base + fr.size)}</code></dd></div>
          <div><dt>大小</dt><dd>${fr.size} B（自动变量 + retaddr/FP）</dd></div>
          <div><dt>自动变量</dt><dd>${autoCount} 个</dd></div>
          <div><dt>当前 SP</dt><dd><code>${fmtAddr(stackPointer())}</code></dd></div>
        </dl>
        <p class="mem-layout__sub">帧内槽位（高地址 → 低地址）</p>
        <div class="mem-layout__slot-wrap">
          <table class="mem-layout__slots">
            <thead><tr><th>地址</th><th>槽位</th><th>种类</th><th>大小</th></tr></thead>
            <tbody>${slots}</tbody>
          </table>
        </div>
        <p class="mem-layout__note">自动变量住在当前栈帧；函数返回后整帧（含这些变量）一起失效。连点同一函数 = 再压一层。</p>`;
    }
    const blk = state.blocks.find((b) => b.uid === state.selected.uid);
    if (!blk) return '';
    const hdr = blk.header || 8;
    const end = blk.addr + blk.bytes;
    const dist = Math.max(0, stackPointer() - (blk.addr + blk.bytes + hdr));
    return `
      <h4 class="mem-layout__detail-title">堆块 · ${escapeHtml(blk.label)}</h4>
      <dl class="mem-layout__facts">
        <div><dt>用户指针</dt><dd><code>${fmtAddr(blk.addr)}</code></dd></div>
        <div><dt>有效载荷</dt><dd>${blk.bytes} B</dd></div>
        <div><dt>块头示意</dt><dd>${hdr} B（教学用）</dd></div>
        <div><dt>占用区间</dt><dd><code>${fmtAddr(blk.addr)}</code> … <code>${fmtAddr(end)}</code></dd></div>
        <div><dt>标签</dt><dd><code>${escapeHtml(blk.tag)}</code></dd></div>
        <div><dt>状态</dt><dd>${blk.live ? '已分配' : '已释放（墓碑，未归还 bump）'}</dd></div>
        <div><dt>距 SP</dt><dd>${fmtBytes(dist)}</dd></div>
      </dl>
      <p class="mem-layout__note">bump 分配只往高地址推；释放后不回退 bump，故空隙不会因 DELETE 变大。</p>`;
  }

  function renderVas() {
    const frames = state.frames
      .map((fr, i) => {
        const active = state.selected?.kind === 'stack' && state.selected.uid === fr.uid;
        const depth = state.frames.length - 1 - i;
        const h = Math.max(44, Math.min(88, 28 + fr.size));
        return `
        <button type="button" class="mem-layout__frame${active ? ' is-active' : ''}" data-sel-stack="${escapeHtml(fr.uid)}" style="--depth:${depth};--frame-h:${h}px">
          <span class="mem-layout__frame-name"><em>#${i}</em> ${escapeHtml(fr.label)}</span>
          <span class="mem-layout__frame-meta">${fr.size} B · ${fmtAddr(fr.base)}</span>
          <span class="mem-layout__frame-locals">自动变量：${fr.locals.map((l) => escapeHtml(l.name)).join(' · ') || '（无）'}</span>
        </button>`;
      })
      .join('');

    const liveBlocks = state.blocks.filter((b) => b.live);
    const deadBlocks = state.blocks.filter((b) => !b.live).slice(-3);
    const heapBtns = [...liveBlocks, ...deadBlocks]
      .map((blk) => {
        const active = state.selected?.kind === 'heap' && state.selected.uid === blk.uid;
        const h = Math.max(40, Math.min(96, 24 + blk.bytes / 2));
        return `
        <button type="button" class="mem-layout__hblock${active ? ' is-active' : ''}${blk.live ? '' : ' is-freed'}" data-sel-heap="${escapeHtml(blk.uid)}" style="--block-h:${h}px">
          <span class="mem-layout__hblock-name">${escapeHtml(blk.label)}</span>
          <span class="mem-layout__hblock-meta">${blk.bytes} B · ${fmtAddr(blk.addr)}${blk.live ? '' : ' · freed'}</span>
        </button>`;
      })
      .join('');

    const sp = stackPointer();
    const gapBytes = Math.max(0, sp - state.heapBump);
    const gapPct = Math.min(40, Math.max(8, Math.round((gapBytes / 0x200000) * 100)));

    return `
      <div class="mem-layout__vas" role="img" aria-label="进程虚存布局，高地址在上">
        <div class="mem-layout__addr-rail">
          <span>高地址</span>
          <code>${fmtAddr(STACK_TOP)}</code>
        </div>

        <div class="mem-layout__region mem-layout__region--stack">
          <div class="mem-layout__region-head">
            <strong>栈 Stack</strong>
            <span>向下生长 ↓ · SP <code>${fmtAddr(sp)}</code></span>
          </div>
          <div class="mem-layout__frames">${frames || '<p class="mem-layout__empty">（空）</p>'}</div>
        </div>

        <div class="mem-layout__region mem-layout__region--gap" style="--gap-flex:${gapPct}">
          <div class="mem-layout__gap-label">未映射 / 空隙 · ${fmtBytes(gapBytes)}<br/><code>${fmtAddr(state.heapBump)}</code> … <code>${fmtAddr(sp)}</code></div>
        </div>

        <div class="mem-layout__region mem-layout__region--heap">
          <div class="mem-layout__region-head">
            <strong>堆 Heap</strong>
            <span>向上生长 ↑ · bump <code>${fmtAddr(state.heapBump)}</code></span>
          </div>
          <div class="mem-layout__hblocks">${heapBtns || '<p class="mem-layout__empty">点击「堆分配」创建块</p>'}</div>
        </div>

        <div class="mem-layout__region mem-layout__region--static">
          <div class="mem-layout__static-row is-bss"><span>BSS</span><em>未初始化静态</em></div>
          <div class="mem-layout__static-row is-data"><span>Data</span><em>已初始化静态</em></div>
          <div class="mem-layout__static-row is-text"><span>Text</span><em>代码</em></div>
        </div>

        <div class="mem-layout__addr-rail mem-layout__addr-rail--low">
          <span>低地址</span>
          <code>${fmtAddr(HEAP_BASE - 0x1000)}</code>
        </div>
      </div>`;
  }

  function render() {
    const callBtns = FRAME_PRESETS.filter((f) => f.id !== 'main')
      .map(
        (f) =>
          `<button type="button" class="mem-layout__btn" data-call="${f.id}">调用 ${escapeHtml(f.label)}</button>`,
      )
      .join('');
    const heapBtns = HEAP_PRESETS.map(
      (h, i) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--heap" data-alloc="${i}">${escapeHtml(h.label)}</button>`,
    ).join('');
    const localBtns = LOCAL_PRESETS.map(
      (l, i) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--local" data-local="${i}">${escapeHtml(l.label)}</button>`,
    ).join('');
    const demoBtns = DEMOS.map(
      (d) =>
        `<button type="button" class="mem-layout__demo" data-demo="${d.id}">${escapeHtml(d.label)}</button>`,
    ).join('');

    const logRows = [...state.log]
      .reverse()
      .slice(0, 12)
      .map(
        (e) => `
        <tr><td>${e.no}</td><td><span class="mem-layout__op">${escapeHtml(e.op)}</span></td><td>${escapeHtml(e.detail)}</td></tr>`,
      )
      .join('');

    const u = usageStats();
    const callChain = state.frames.map((f) => f.label.replace(/\(\)$/, '')).join(' → ');

    shell.innerHTML = `
      <header class="mem-layout__hero">
        <div>
          <p class="mem-layout__eyebrow">MEMORY LAYOUT SANDBOX</p>
          <h2 class="mem-layout__title">内存布局沙箱</h2>
          <p class="mem-layout__subtitle">可交互：压栈 / 返回 · 堆分配 / 释放 · 点选查看 · 栈↓ 堆↑</p>
        </div>
        <div class="mem-layout__hero-actions">
          <button type="button" class="mem-layout__btn mem-layout__btn--accent" data-reset>重置布局</button>
          ${demoPlaying ? '<button type="button" class="mem-layout__btn" data-stop-demo>停止演示</button>' : ''}
        </div>
      </header>

      <div class="mem-layout__demos">${demoBtns}</div>

      <div class="mem-layout__stats" aria-label="布局摘要">
        <div><span>SP</span><code>${fmtAddr(u.sp)}</code></div>
        <div><span>栈已用</span><strong>${fmtBytes(u.stackUsed)}</strong><em>${u.depth} 帧</em></div>
        <div><span>heap bump</span><code>${fmtAddr(state.heapBump)}</code></div>
        <div><span>堆存活</span><strong>${fmtBytes(u.heapLive)}</strong><em>${u.liveCount} 块${u.heapFreed ? ` · ${u.heapFreed} 墓碑` : ''}</em></div>
        <div><span>空隙</span><strong>${fmtBytes(u.gap)}</strong></div>
        <div class="mem-layout__stats-chain"><span>调用链</span><strong>${escapeHtml(callChain)}</strong></div>
      </div>

      <div class="mem-layout__grid">
        <aside class="mem-layout__panel">
          <h3 class="mem-layout__panel-title">栈操作</h3>
          <p class="mem-layout__panel-hint">每次点击 = 再压一帧（可嵌套/递归）；返回按 LIFO 弹出。</p>
          <div class="mem-layout__btn-row">${callBtns}</div>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide" data-ret>返回（弹栈）</button>

          <h3 class="mem-layout__panel-title">自动变量</h3>
          <p class="mem-layout__panel-hint">加到<strong>当前顶帧</strong>；扩大帧、SP 下移。对比右侧堆的 <code>new</code>。</p>
          <div class="mem-layout__btn-row">${localBtns}</div>

          <h3 class="mem-layout__panel-title">堆操作</h3>
          <p class="mem-layout__panel-hint">bump 向高地址推进；释放只标墓碑，不回退 bump。</p>
          <div class="mem-layout__btn-row">${heapBtns}</div>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide mem-layout__btn--danger" data-free>释放选中堆块</button>

          <div class="mem-layout__legend">
            <span class="is-stack">栈帧</span>
            <span class="is-local">自动变量</span>
            <span class="is-heap">堆块</span>
            <span class="is-gap">空隙</span>
            <span class="is-static">静态/代码</span>
          </div>
        </aside>

        <div class="mem-layout__center">
          ${renderVas()}
        </div>

        <aside class="mem-layout__panel mem-layout__panel--detail">
          <h3 class="mem-layout__panel-title">选中详情</h3>
          <div class="mem-layout__detail">${selectedDetail()}</div>
        </aside>
      </div>

      <section class="mem-layout__log" aria-label="操作日志">
        <h3 class="mem-layout__panel-title">操作日志</h3>
        <div class="mem-layout__table-wrap">
          <table class="mem-layout__table">
            <thead><tr><th>No.</th><th>操作</th><th>说明</th></tr></thead>
            <tbody>${logRows}</tbody>
          </table>
        </div>
      </section>

      <p class="mem-layout__credit">教学沙箱：地址与大小为示意；不模拟真实分配器碎片合并或 ABI 细节。可与 Linux 内存分段笔记对照。</p>
    `;

    shell.querySelector('[data-reset]')?.addEventListener('click', reset);
    shell.querySelector('[data-stop-demo]')?.addEventListener('click', () => {
      stopDemo();
      render();
    });
    shell.querySelector('[data-ret]')?.addEventListener('click', retFrame);
    shell.querySelector('[data-free]')?.addEventListener('click', freeSelected);
    shell.querySelectorAll('[data-call]').forEach((el) => {
      el.addEventListener('click', () => callFrame(el.getAttribute('data-call') || ''));
    });
    shell.querySelectorAll('[data-alloc]').forEach((el) => {
      el.addEventListener('click', () => allocHeap(Number(el.getAttribute('data-alloc'))));
    });
    shell.querySelectorAll('[data-local]').forEach((el) => {
      el.addEventListener('click', () => addLocal(Number(el.getAttribute('data-local'))));
    });
    shell.querySelectorAll('[data-demo]').forEach((el) => {
      el.addEventListener('click', () => playDemo(el.getAttribute('data-demo') || ''));
    });
    shell.querySelectorAll('[data-sel-stack]').forEach((el) => {
      el.addEventListener('click', () => select('stack', el.getAttribute('data-sel-stack') || ''));
    });
    shell.querySelectorAll('[data-sel-heap]').forEach((el) => {
      el.addEventListener('click', () => select('heap', el.getAttribute('data-sel-heap') || ''));
    });
  }

  container.replaceChildren(shell);
  render();

  return {
    dispose() {
      stopDemo();
      shell.remove();
    },
  };
}
