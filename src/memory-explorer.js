/**
 * Interactive process memory layout sandbox (stack ↓ / heap ↑).
 * Covers autos, statics, struct/class layout+alignment, calls, heap, move.
 * Chinese UI. Teaching sketch — not a real ABI/allocator.
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
const DATA_BASE = 0x555555554000;
const BSS_BASE = 0x555555556000;
const MIB = 1024 * 1024;
const BUFFER_MIB = 10; // teaching: new char[10MiB]

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

const LOCAL_PRESETS = [
  { label: 'int x', name: 'x', bytes: 4 },
  { label: 'long n', name: 'n', bytes: 8 },
  { label: 'void* p', name: 'p', bytes: 8, pointer: true },
  { label: 'char buf[32]', name: 'buf[32]', bytes: 32 },
];

const STATIC_PRESETS = [
  { label: 'int g_count = 1', name: 'g_count', bytes: 4, region: 'data' },
  { label: 'static int s_id', name: 's_id', bytes: 4, region: 'bss' },
  { label: 'char g_msg[16]', name: 'g_msg', bytes: 16, region: 'data' },
  { label: 'bool g_ready', name: 'g_ready', bytes: 1, region: 'bss' },
];

const HEAP_PRESETS = [
  { label: 'new int', bytes: 4, tag: 'int' },
  { label: 'new int[4]', bytes: 16, tag: 'int[4]' },
  { label: 'malloc(64)', bytes: 64, tag: 'raw64' },
];

/** struct / class teaching layouts (explicit align per member). */
const TYPE_PRESETS = [
  {
    id: 'Point',
    kind: 'struct',
    label: 'struct Point',
    members: [
      { name: 'x', bytes: 4, align: 4 },
      { name: 'y', bytes: 4, align: 4 },
    ],
  },
  {
    id: 'Mixed',
    kind: 'struct',
    label: 'struct Mixed',
    members: [
      { name: 'a', bytes: 1, align: 1 },
      { name: 'b', bytes: 4, align: 4 },
      { name: 'c', bytes: 1, align: 1 },
    ],
  },
  {
    id: 'Widget',
    kind: 'class',
    label: 'class Widget',
    members: [
      { name: 'id_', bytes: 4, align: 4 },
      { name: 'ptr_', bytes: 8, align: 8 },
      { name: 'flag_', bytes: 1, align: 1 },
    ],
  },
];

const DEMOS = [
  {
    id: 'program-tour',
    label: '演示：从 main 走一遍',
    steps: [
      'reset',
      'static:0',
      'static:1',
      'type-stack:Mixed',
      'select-stack-top',
      'pack',
      'call:foo',
      'unique:Widget',
      'move',
      'select-stack-top',
      'ret',
    ],
  },
  {
    id: 'align-demo',
    label: '演示：对齐间隔→压缩',
    steps: ['reset', 'type-stack:Mixed', 'select-stack-top', 'pack', 'unpack'],
  },
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
    steps: ['reset', 'call:foo', 'heap:0', 'call:bar', 'type-heap:Widget', 'heap:2'],
  },
  {
    id: 'buffer-compact',
    label: '演示：稀疏写→memmove紧缩',
    steps: ['reset', 'buf-new', 'buf-sparse', 'select-heap-0', 'buf-compact', 'buf-memset'],
  },
];

/** @typedef {{ kind: 'data'|'gap'|'free', offset: number, size: number, label?: string }} BufRegion */

function emptyBufferRegions(totalBytes) {
  return /** @type {BufRegion[]} */ ([{ kind: 'free', offset: 0, size: totalBytes }]);
}

function bufferUsedBytes(regions) {
  return regions.filter((r) => r.kind === 'data').reduce((s, r) => s + r.size, 0);
}

function bufferGapBytes(regions) {
  return regions.filter((r) => r.kind === 'gap').reduce((s, r) => s + r.size, 0);
}

/** Merge adjacent same-kind regions. */
function coalesceRegions(regions) {
  /** @type {BufRegion[]} */
  const out = [];
  for (const r of regions) {
    const last = out[out.length - 1];
    if (last && last.kind === r.kind && last.kind !== 'data') {
      last.size += r.size;
    } else if (last && last.kind === 'data' && r.kind === 'data' && !r.label && !last.label) {
      last.size += r.size;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

/** Visual strip for MiB-scale buffer (1 cell ≈ 1MiB when total is 10MiB). */
function renderBufferStrip(regions, totalBytes) {
  const unit = Math.max(1, Math.round(totalBytes / BUFFER_MIB));
  const cells = [];
  for (const r of regions) {
    const n = Math.max(1, Math.round(r.size / unit));
    for (let i = 0; i < n; i += 1) {
      const title =
        r.kind === 'data'
          ? `${r.label || 'data'} @ +${fmtBytes(r.offset)}`
          : r.kind === 'gap'
            ? `空洞 @ +${fmtBytes(r.offset)}`
            : `未用 @ +${fmtBytes(r.offset)}`;
      cells.push(`<i class="mem-layout__byte is-buf-${r.kind}" title="${escapeHtml(title)}"></i>`);
    }
  }
  return `<div class="mem-layout__bytes mem-layout__bytes--buf" aria-hidden="true">${cells.join('')}</div>
    <p class="mem-layout__byte-legend"><span class="is-data">数据</span><span class="is-gap">空洞</span><span class="is-free">未用</span>（每格≈1MiB）</p>`;
}

function fmtAddr(n) {
  return `0x${n.toString(16)}`;
}

function fmtBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${n} B`;
}

function alignUp(offset, align) {
  const a = Math.max(1, align);
  return offset + ((a - (offset % a)) % a);
}

/**
 * Compute member slots for a type.
 * @param {{ members: { name: string, bytes: number, align: number }[] }} type
 * @param {{ packed?: boolean }} [opts] packed=true → 紧挨排列，消除对齐间隔
 */
function layoutType(type, opts = {}) {
  const packed = Boolean(opts.packed);
  let offset = 0;
  let maxAlign = 1;
  /** @type {{ name: string, bytes: number, offset: number, kind: 'member'|'pad' }[]} */
  const slots = [];
  for (const m of type.members) {
    maxAlign = Math.max(maxAlign, m.align);
    if (!packed) {
      const aligned = alignUp(offset, m.align);
      if (aligned > offset) {
        slots.push({ name: '(间隔/padding)', bytes: aligned - offset, offset, kind: 'pad' });
      }
      offset = aligned;
    }
    slots.push({ name: m.name, bytes: m.bytes, offset, kind: 'member' });
    offset += m.bytes;
  }
  if (!packed) {
    const sized = alignUp(offset, maxAlign);
    if (sized > offset) {
      slots.push({ name: '(尾部间隔)', bytes: sized - offset, offset, kind: 'pad' });
    }
    offset = sized;
  }
  const padBytes = slots.filter((s) => s.kind === 'pad').reduce((s, x) => s + x.bytes, 0);
  return {
    size: offset,
    align: packed ? 1 : maxAlign,
    packed,
    padBytes,
    slots,
  };
}

const TYPE_LAYOUTS = Object.fromEntries(
  TYPE_PRESETS.map((t) => {
    const aligned = layoutType(t, { packed: false });
    const packed = layoutType(t, { packed: true });
    return [t.id, { ...t, aligned, packed, ...aligned }];
  }),
);

function typeLayoutFor(typeId, packed) {
  const t = TYPE_LAYOUTS[typeId];
  if (!t) return null;
  return packed ? t.packed : t.aligned;
}

/** Visual strip: colored cells for members vs gap (one cell ≈ 1 byte, capped). */
function renderByteStrip(layout, maxCells = 48) {
  if (!layout) return '';
  const cells = [];
  let shown = 0;
  for (const s of layout.slots) {
    const n = Math.min(s.bytes, Math.max(0, maxCells - shown));
    for (let i = 0; i < n; i += 1) {
      cells.push(
        `<i class="mem-layout__byte is-${s.kind}" title="${escapeHtml(s.name)} (${s.bytes}B)"></i>`,
      );
    }
    shown += n;
    if (shown >= maxCells) break;
  }
  const more = layout.size > shown ? `<em>+${layout.size - shown}B</em>` : '';
  return `<div class="mem-layout__bytes" aria-hidden="true">${cells.join('')}${more}</div>`;
}

function frameBytes(locals) {
  return locals.reduce((s, l) => s + l.bytes, 16);
}

function uniqueName(existing, base) {
  const same = existing.filter((n) => n === base || n.startsWith(`${base}#`)).length;
  return same > 0 ? `${base}#${same + 1}` : base;
}

function frameSlots(fr) {
  /** @type {{ name: string, bytes: number, addr: number, kind: string, kindLabel: string, note?: string }[]} */
  const slots = [];
  let cursor = fr.base + fr.size;
  cursor -= 8;
  slots.push({ name: 'retaddr', bytes: 8, addr: cursor, kind: 'meta', kindLabel: '控制' });
  cursor -= 8;
  slots.push({ name: 'saved FP', bytes: 8, addr: cursor, kind: 'meta', kindLabel: '控制' });
  for (const loc of fr.locals) {
    cursor -= loc.bytes;
    let kindLabel = '自动变量';
    if (loc.movedFrom) kindLabel = 'moved-from';
    else if (loc.pointsTo) kindLabel = '指针/句柄';
    else if (loc.typeId) kindLabel = loc.typeKind === 'class' ? '类对象' : '结构体';
    slots.push({
      name: loc.name,
      bytes: loc.bytes,
      addr: cursor,
      kind: loc.movedFrom ? 'moved' : loc.typeId ? 'object' : 'local',
      kindLabel,
      note: loc.pointsTo ? `→ ${loc.pointsTo}` : loc.typeId ? loc.typeId : undefined,
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

  /** @type {ReturnType<typeof freshState>} */
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
      blocks: /** @type {{ uid: string, label: string, tag: string, bytes: number, header: number, addr: number, live: boolean, typeId?: string, packed?: boolean, layout?: ReturnType<typeof layoutType>, buffer?: boolean, regions?: BufRegion[] }[]} */ ([]),
      statics: /** @type {{ uid: string, name: string, region: 'data'|'bss', bytes: number, addr: number }[]} */ ([]),
      dataBump: DATA_BASE,
      bssBump: BSS_BASE,
      heapBump: HEAP_BASE,
      selected: /** @type {null | { kind: 'stack'|'heap'|'static', uid: string }} */ ({
        kind: 'stack',
        uid: 'frame-main',
      }),
      log: [
        {
          no: 1,
          op: 'INIT',
          detail: `进入 main()，栈帧 @ ${fmtAddr(STACK_TOP - size)}；静态区/堆待填充`,
        },
      ],
      logNo: 1,
    };
  }

  function pushLog(op, detail) {
    state.logNo += 1;
    state.log.push({ no: state.logNo, op, detail });
    if (state.log.length > 48) state.log = state.log.slice(-48);
  }

  function stackPointer() {
    if (!state.frames.length) return STACK_TOP;
    return state.frames[state.frames.length - 1].base;
  }

  function topFrame() {
    return state.frames[state.frames.length - 1] || null;
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

  function growTopFrame(extraLocal, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const fr = topFrame();
    if (!fr) return false;
    if (fr.locals.length >= 12) {
      pushLog('LIMIT', '单帧最多 12 个槽位（教学限制）');
      render();
      return false;
    }
    const high = fr.base + fr.size;
    const nextLocals = [...fr.locals, extraLocal];
    const nextSize = frameBytes(nextLocals);
    const nextBase = high - nextSize;
    if (nextBase <= state.heapBump + 64) {
      pushLog('FAULT', '栈帧扩张将撞上堆——先返回或释放堆');
      render();
      return false;
    }
    fr.locals = nextLocals;
    fr.size = nextSize;
    fr.base = nextBase;
    state.selected = { kind: 'stack', uid: fr.uid };
    return true;
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
    // Drop heap ownership notes that lived only as locals in gone frame (objects remain until free)
    if (state.selected?.kind === 'stack' && state.selected.uid === gone.uid) {
      state.selected = {
        kind: 'stack',
        uid: state.frames[state.frames.length - 1].uid,
      };
    }
    pushLog('RET', `返回，弹出 ${gone.label}（${gone.size} B）；其自动变量结束寿命`);
    render();
  }

  function addLocal(presetIndex, { fromDemo = false } = {}) {
    const preset = LOCAL_PRESETS[presetIndex];
    if (!preset) return;
    const fr = topFrame();
    if (!fr) return;
    const name = uniqueName(
      fr.locals.map((l) => l.name),
      preset.name,
    );
    const ok = growTopFrame(
      { name, bytes: preset.bytes, pointer: Boolean(preset.pointer) },
      { fromDemo },
    );
    if (!ok) return;
    pushLog('AUTO', `${fr.label} 增加自动变量 ${name}（${preset.bytes} B）`);
    render();
  }

  function addStatic(presetIndex, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const preset = STATIC_PRESETS[presetIndex];
    if (!preset) return;
    if (state.statics.length >= 10) {
      pushLog('LIMIT', '教学沙箱最多 10 个静态符号');
      render();
      return;
    }
    const name = uniqueName(
      state.statics.map((s) => s.name),
      preset.name,
    );
    const addr = preset.region === 'data' ? state.dataBump : state.bssBump;
    if (preset.region === 'data') state.dataBump += preset.bytes + 4;
    else state.bssBump += preset.bytes + 4;
    const uid = `static-${state.logNo + 1}`;
    state.statics.push({
      uid,
      name,
      region: preset.region,
      bytes: preset.bytes,
      addr,
    });
    state.selected = { kind: 'static', uid };
    pushLog(
      'STATIC',
      `${preset.region === 'data' ? 'Data' : 'BSS'} += ${name}（${preset.bytes} B）@ ${fmtAddr(addr)} · 程序寿命`,
    );
    render();
  }

  function addTypeLocal(typeId, { fromDemo = false } = {}) {
    const type = TYPE_LAYOUTS[typeId];
    if (!type) return;
    const layout = type.aligned;
    const fr = topFrame();
    if (!fr) return;
    const name = uniqueName(
      fr.locals.map((l) => l.name),
      typeId.toLowerCase(),
    );
    const ok = growTopFrame(
      {
        name,
        bytes: layout.size,
        typeId: type.id,
        typeKind: type.kind,
        align: layout.align,
        packed: false,
        padBytes: layout.padBytes,
      },
      { fromDemo },
    );
    if (!ok) return;
    pushLog(
      'OBJECT',
      `${fr.label} 栈上 ${type.label} ${name}：sizeof=${layout.size}（含 ${layout.padBytes} B 对齐间隔）`,
    );
    render();
  }

  /**
   * Toggle pack/unpack on the most relevant typed object:
   * selected heap typed block, else newest typed auto on top frame.
   */
  function setPacked(wantPacked, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();

    // Prefer selected heap object with type
    if (state.selected?.kind === 'heap') {
      const blk = state.blocks.find((b) => b.uid === state.selected.uid);
      if (blk?.live && blk.typeId) {
        const next = typeLayoutFor(blk.typeId, wantPacked);
        if (!next) return;
        const prev = blk.bytes;
        if (wantPacked) {
          // shrink only payload; bump does not move (teaching)
          blk.bytes = next.size;
          blk.layout = next;
          blk.packed = true;
          pushLog(
            'PACK',
            `压缩 ${blk.label}：消除 ${prev - next.size} B 间隔 · sizeof ${prev} → ${next.size}`,
          );
        } else {
          const grow = next.size - blk.bytes;
          if (state.heapBump + grow + 64 >= stackPointer() && grow > 0) {
            pushLog('FAULT', '恢复对齐需要更多空间');
            render();
            return;
          }
          blk.bytes = next.size;
          blk.layout = next;
          blk.packed = false;
          // bump already past this block; teaching note only
          pushLog(
            'ALIGN',
            `恢复对齐 ${blk.label}：重新插入间隔 · sizeof → ${next.size}`,
          );
        }
        render();
        return;
      }
    }

    const fr = topFrame();
    if (!fr) return;
    // Prefer selected frame's last typed local, else top frame last typed
    let targetFr = fr;
    if (state.selected?.kind === 'stack') {
      const sel = state.frames.find((f) => f.uid === state.selected.uid);
      if (sel) targetFr = sel;
    }
    const loc = [...targetFr.locals].reverse().find((l) => l.typeId && !l.pointsTo);
    if (!loc) {
      pushLog('PACK', '请先放一个栈上/堆上结构体或类对象');
      render();
      return;
    }
    if (Boolean(loc.packed) === wantPacked) {
      pushLog('PACK', wantPacked ? '已是压缩布局（无间隔）' : '已是对齐布局（含间隔）');
      render();
      return;
    }
    const next = typeLayoutFor(loc.typeId, wantPacked);
    if (!next) return;
    const prevBytes = loc.bytes;
    const delta = next.size - prevBytes; // negative when packing
    const high = targetFr.base + targetFr.size;
    // Resize this local in place: frame size changes by delta
    const nextLocals = targetFr.locals.map((l) =>
      l === loc
        ? {
            ...l,
            bytes: next.size,
            packed: wantPacked,
            padBytes: next.padBytes,
            align: next.align,
          }
        : l,
    );
    const nextSize = frameBytes(nextLocals);
    const nextBase = high - nextSize;
    if (nextBase <= state.heapBump + 64) {
      pushLog('FAULT', '调整布局后栈将撞堆');
      render();
      return;
    }
    // Only allow pack/unpack on top frame for SP consistency
    if (targetFr !== fr) {
      pushLog('PACK', '请在顶帧上的对象做压缩/恢复（或先返回到该帧）');
      render();
      return;
    }
    targetFr.locals = nextLocals;
    targetFr.size = nextSize;
    targetFr.base = nextBase;
    state.selected = { kind: 'stack', uid: targetFr.uid };
    if (wantPacked) {
      pushLog(
        'PACK',
        `压缩 ${loc.name}（${TYPE_LAYOUTS[loc.typeId]?.label || loc.typeId}）：去掉 ${prevBytes - next.size} B 间隔 · ${prevBytes} → ${next.size} B，SP↑`,
      );
    } else {
      pushLog(
        'ALIGN',
        `恢复对齐 ${loc.name}：插回间隔 · ${prevBytes} → ${next.size} B，SP↓`,
      );
    }
    render();
  }

  function allocHeapRaw(presetIndex, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const preset = HEAP_PRESETS[presetIndex];
    if (!preset) return null;
    if (state.blocks.filter((b) => b.live).length >= 12) {
      pushLog('LIMIT', '教学沙箱最多 12 个存活堆块');
      render();
      return null;
    }
    const addr = state.heapBump;
    const next = state.heapBump + preset.bytes + 8;
    if (next + 64 >= stackPointer()) {
      pushLog('FAULT', '堆向上扩张将撞上栈——先返回或缩小分配');
      render();
      return null;
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
    pushLog('NEW', `${preset.label} @ ${fmtAddr(addr)}（${preset.bytes} B），bump → ${fmtAddr(next)}`);
    render();
    return uid;
  }

  function allocHeapType(typeId, { fromDemo = false, silent = false } = {}) {
    if (!fromDemo) stopDemo();
    const type = TYPE_LAYOUTS[typeId];
    if (!type) return null;
    if (state.blocks.filter((b) => b.live).length >= 12) {
      pushLog('LIMIT', '教学沙箱最多 12 个存活堆块');
      render();
      return null;
    }
    const layout = type.aligned;
    const addr = state.heapBump;
    const next = state.heapBump + layout.size + 8;
    if (next + 64 >= stackPointer()) {
      pushLog('FAULT', '堆向上扩张将撞上栈');
      render();
      return null;
    }
    const uid = `heap-${state.logNo + 1}`;
    state.blocks.push({
      uid,
      label: `new ${type.label}`,
      tag: type.id,
      bytes: layout.size,
      header: 8,
      addr,
      live: true,
      typeId: type.id,
      packed: false,
      layout,
    });
    state.heapBump = next;
    state.selected = { kind: 'heap', uid };
    if (!silent) {
      pushLog(
        'NEW',
        `堆上 ${type.label} @ ${fmtAddr(addr)} · sizeof=${layout.size}（含 ${layout.padBytes} B 间隔）`,
      );
      render();
    }
    return uid;
  }

  /** new T + 栈上自动指针（示意 unique_ptr / 持有者）. */
  function allocUnique(typeId, { fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const type = TYPE_LAYOUTS[typeId];
    if (!type) return;
    const fr = topFrame();
    if (!fr) return;
    const heapUid = allocHeapType(typeId, { fromDemo: true, silent: true });
    if (!heapUid) return;
    const blk = state.blocks.find((b) => b.uid === heapUid);
    const ptrName = uniqueName(
      fr.locals.map((l) => l.name),
      `up_${typeId.toLowerCase()}`,
    );
    const ok = growTopFrame(
      {
        name: ptrName,
        bytes: 8,
        pointer: true,
        pointsTo: heapUid,
        pointsAddr: blk?.addr,
        typeId: type.id,
        typeKind: 'handle',
      },
      { fromDemo: true },
    );
    if (!ok) {
      // roll back heap block
      blk.live = false;
      pushLog('FAULT', '无法在栈上放置句柄');
      render();
      return;
    }
    state.selected = { kind: 'stack', uid: fr.uid };
    pushLog(
      'UNIQUE',
      `${fr.label} 中 ${ptrName} → 堆 ${type.label} @ ${fmtAddr(blk.addr)}（示意独占持有）`,
    );
    render();
  }

  function moveHandle({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const fr = topFrame();
    if (!fr) return;
    const src = [...fr.locals].reverse().find((l) => l.pointsTo && !l.movedFrom);
    if (!src) {
      pushLog('MOVE', '顶帧没有可 move 的堆句柄——先「new + 句柄」');
      render();
      return;
    }
    const dstName = uniqueName(
      fr.locals.map((l) => l.name),
      `${src.name}_moved`,
    );
    const ok = growTopFrame(
      {
        name: dstName,
        bytes: 8,
        pointer: true,
        pointsTo: src.pointsTo,
        pointsAddr: src.pointsAddr,
        typeId: src.typeId,
        typeKind: 'handle',
      },
      { fromDemo: true },
    );
    if (!ok) return;
    src.movedFrom = true;
    src.pointsTo = undefined;
    src.pointsAddr = undefined;
    pushLog(
      'MOVE',
      `move：${src.name} → ${dstName}（源变为空/moved-from；堆对象地址不变）`,
    );
    state.selected = { kind: 'stack', uid: fr.uid };
    render();
  }

  function selectedBuffer() {
    if (state.selected?.kind === 'heap') {
      const blk = state.blocks.find((b) => b.uid === state.selected.uid);
      if (blk?.live && blk.buffer) return blk;
    }
    return state.blocks.filter((b) => b.live && b.buffer).at(-1) || null;
  }

  /** new char[10MiB] teaching buffer with internal region map. */
  function allocBuffer({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    if (state.blocks.filter((b) => b.live && b.buffer).length >= 2) {
      pushLog('LIMIT', '教学沙箱最多 2 个 10MiB 大缓冲');
      render();
      return;
    }
    const bytes = BUFFER_MIB * MIB;
    const addr = state.heapBump;
    const next = state.heapBump + bytes + 8;
    if (next + 64 >= stackPointer()) {
      pushLog('FAULT', '10MiB 缓冲放不下——先返回栈帧或释放堆');
      render();
      return;
    }
    const uid = `heap-${state.logNo + 1}`;
    state.blocks.push({
      uid,
      label: 'new char[10MiB]',
      tag: 'buf10',
      bytes,
      header: 8,
      addr,
      live: true,
      buffer: true,
      regions: emptyBufferRegions(bytes),
    });
    state.heapBump = next;
    state.selected = { kind: 'heap', uid };
    pushLog('NEW', `堆上大缓冲 ${fmtBytes(bytes)} @ ${fmtAddr(addr)}（内部可稀疏写）`);
    render();
  }

  /**
   * Classic sparse pattern inside selected/latest buffer:
   * write 1MiB, gap 4MiB, write 1MiB, rest free.
   */
  function bufferSparseWrite({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const blk = selectedBuffer();
    if (!blk) {
      pushLog('WRITE', '请先 new char[10MiB]');
      render();
      return;
    }
    const a = 1 * MIB;
    const gap = 4 * MIB;
    const b = 1 * MIB;
    if (a + gap + b > blk.bytes) {
      pushLog('WRITE', '缓冲太小，无法套用 1+4+1 MiB 模式');
      render();
      return;
    }
    blk.regions = coalesceRegions([
      { kind: 'data', offset: 0, size: a, label: 'A' },
      { kind: 'gap', offset: a, size: gap },
      { kind: 'data', offset: a + gap, size: b, label: 'B' },
      { kind: 'free', offset: a + gap + b, size: blk.bytes - (a + gap + b) },
    ]);
    state.selected = { kind: 'heap', uid: blk.uid };
    pushLog(
      'WRITE',
      `稀疏写入：A 1MiB → 空洞 4MiB → B 1MiB（有效 ${fmtBytes(bufferUsedBytes(blk.regions))}，间隔 ${fmtBytes(gap)}）`,
    );
    render();
  }

  /** memmove-style: pack all data regions to the front; gaps become free at end. */
  function bufferMemmoveCompact({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const blk = selectedBuffer();
    if (!blk?.regions) {
      pushLog('MEMMOVE', '请先选中带区域图的大缓冲');
      render();
      return;
    }
    const data = blk.regions.filter((r) => r.kind === 'data');
    if (!data.length) {
      pushLog('MEMMOVE', '没有可紧缩的数据段');
      render();
      return;
    }
    const gapBefore = bufferGapBytes(blk.regions);
    if (gapBefore === 0 && data.length === 1 && data[0].offset === 0) {
      pushLog('MEMMOVE', '已在前端连续，无需 memmove');
      render();
      return;
    }
    let offset = 0;
    /** @type {BufRegion[]} */
    const packed = [];
    for (const d of data) {
      packed.push({ kind: 'data', offset, size: d.size, label: d.label });
      // teaching: each segment is "memmove"d to new offset
      pushLog(
        'MEMMOVE',
        `memmove(dst=+${fmtBytes(offset)}, src=+${fmtBytes(d.offset)}, n=${fmtBytes(d.size)})`,
      );
      offset += d.size;
    }
    if (offset < blk.bytes) {
      packed.push({ kind: 'free', offset, size: blk.bytes - offset });
    }
    blk.regions = packed;
    state.selected = { kind: 'heap', uid: blk.uid };
    pushLog(
      'COMPACT',
      `紧缩完成：有效数据收拢到前 ${fmtBytes(offset)}（消掉 ${fmtBytes(gapBefore)} 空洞）`,
    );
    render();
  }

  /** memset the free/gap tail conceptually — after compact, clear unused. */
  function bufferMemsetTail({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const blk = selectedBuffer();
    if (!blk?.regions) {
      pushLog('MEMSET', '请先选中大缓冲');
      render();
      return;
    }
    // Convert remaining gaps to free, and note memset on free region
    blk.regions = coalesceRegions(
      blk.regions.map((r) => (r.kind === 'gap' ? { ...r, kind: 'free' } : r)),
    );
    const free = blk.regions.filter((r) => r.kind === 'free');
    const n = free.reduce((s, r) => s + r.size, 0);
    if (!n) {
      pushLog('MEMSET', '没有可清的尾部');
      render();
      return;
    }
    for (const f of free) {
      pushLog('MEMSET', `memset(p+${fmtBytes(f.offset)}, 0, ${fmtBytes(f.size)})`);
    }
    state.selected = { kind: 'heap', uid: blk.uid };
    render();
  }

  /** memcpy whole buffer to a new heap block (shallow teaching). */
  function bufferMemcpyClone({ fromDemo = false } = {}) {
    if (!fromDemo) stopDemo();
    const src = selectedBuffer();
    if (!src) {
      pushLog('MEMCPY', '请先选中源大缓冲');
      render();
      return;
    }
    if (state.blocks.filter((b) => b.live && b.buffer).length >= 2) {
      pushLog('LIMIT', '已有 2 个大缓冲，先释放再 memcpy 克隆');
      render();
      return;
    }
    const addr = state.heapBump;
    const next = state.heapBump + src.bytes + 8;
    if (next + 64 >= stackPointer()) {
      pushLog('FAULT', 'memcpy 目标放不下');
      render();
      return;
    }
    const uid = `heap-${state.logNo + 1}`;
    state.blocks.push({
      uid,
      label: 'memcpy 克隆[10MiB]',
      tag: 'buf10copy',
      bytes: src.bytes,
      header: 8,
      addr,
      live: true,
      buffer: true,
      regions: (src.regions || emptyBufferRegions(src.bytes)).map((r) => ({ ...r })),
    });
    state.heapBump = next;
    state.selected = { kind: 'heap', uid };
    pushLog(
      'MEMCPY',
      `memcpy(dst=${fmtAddr(addr)}, src=${fmtAddr(src.addr)}, n=${fmtBytes(src.bytes)})`,
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
    // Clear any stack handles pointing here
    for (const fr of state.frames) {
      for (const loc of fr.locals) {
        if (loc.pointsTo === blk.uid) {
          loc.movedFrom = true;
          loc.pointsTo = undefined;
          loc.pointsAddr = undefined;
        }
      }
    }
    pushLog('DELETE', `释放 ${blk.label} @ ${fmtAddr(blk.addr)}（句柄若仍在则悬空/清空示意）`);
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
      allocHeapRaw(Number(token.slice(5)), demoOpts);
      return;
    }
    if (token.startsWith('local:')) {
      addLocal(Number(token.slice(6)), demoOpts);
      return;
    }
    if (token.startsWith('static:')) {
      addStatic(Number(token.slice(7)), demoOpts);
      return;
    }
    if (token.startsWith('type-stack:')) {
      addTypeLocal(token.slice(11), demoOpts);
      return;
    }
    if (token.startsWith('type-heap:')) {
      allocHeapType(token.slice(10), demoOpts);
      return;
    }
    if (token.startsWith('unique:')) {
      allocUnique(token.slice(7), demoOpts);
      return;
    }
    if (token === 'move') {
      moveHandle(demoOpts);
      return;
    }
    if (token === 'pack') {
      setPacked(true, demoOpts);
      return;
    }
    if (token === 'unpack') {
      setPacked(false, demoOpts);
      return;
    }
    if (token === 'buf-new') {
      allocBuffer(demoOpts);
      return;
    }
    if (token === 'buf-sparse') {
      bufferSparseWrite(demoOpts);
      return;
    }
    if (token === 'buf-compact') {
      bufferMemmoveCompact(demoOpts);
      return;
    }
    if (token === 'buf-memset') {
      bufferMemsetTail(demoOpts);
      return;
    }
    if (token === 'buf-memcpy') {
      bufferMemcpyClone(demoOpts);
      return;
    }
    if (token === 'free') {
      freeSelected(demoOpts);
      return;
    }
    if (token === 'select-stack-top') {
      const top = topFrame();
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
    const staticBytes = state.statics.reduce((s, x) => s + x.bytes, 0);
    const gap = Math.max(0, sp - state.heapBump);
    return {
      sp,
      stackUsed,
      heapLive,
      liveCount: live.length,
      heapFreed: state.blocks.filter((b) => !b.live).length,
      gap,
      depth: state.frames.length,
      staticBytes,
      staticCount: state.statics.length,
    };
  }

  function renderTypeLayoutTable(layout, baseAddr) {
    return layout.slots
      .map((s) => {
        const addr = baseAddr != null ? fmtAddr(baseAddr + s.offset) : `+${s.offset}`;
        return `<tr class="is-${s.kind}">
          <td><code>${addr}</code></td>
          <td>${escapeHtml(s.name)}</td>
          <td>${s.kind === 'pad' ? '对齐填充' : '成员'}</td>
          <td>${s.bytes} B</td>
        </tr>`;
      })
      .join('');
  }

  function selectedDetail() {
    if (!state.selected) {
      return `<p class="mem-layout__hint">点击栈帧、堆块或静态符号查看详情。</p>`;
    }

    if (state.selected.kind === 'static') {
      const st = state.statics.find((s) => s.uid === state.selected.uid);
      if (!st) return '';
      return `
        <h4 class="mem-layout__detail-title">静态 · ${escapeHtml(st.name)}</h4>
        <dl class="mem-layout__facts">
          <div><dt>段</dt><dd>${st.region === 'data' ? 'Data（已初始化）' : 'BSS（零初始化）'}</dd></div>
          <div><dt>地址</dt><dd><code>${fmtAddr(st.addr)}</code></dd></div>
          <div><dt>大小</dt><dd>${st.bytes} B</dd></div>
          <div><dt>寿命</dt><dd>整个程序</dd></div>
        </dl>
        <p class="mem-layout__note">静态变量不在栈上；与函数调用无关，返回也不会销毁。</p>`;
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
            <td>${escapeHtml(s.name)}${s.note ? ` <em>${escapeHtml(s.note)}</em>` : ''}</td>
            <td>${escapeHtml(s.kindLabel)}</td>
            <td>${s.bytes} B</td>
          </tr>`,
        )
        .join('');

      const typed = [...fr.locals].reverse().find((l) => l.typeId && TYPE_LAYOUTS[l.typeId] && !l.pointsTo);
      let typeExtra = '';
      if (typed) {
        const meta = TYPE_LAYOUTS[typed.typeId];
        const layout = typeLayoutFor(typed.typeId, Boolean(typed.packed));
        const base = frameSlots(fr).find((s) => s.name === typed.name)?.addr;
        const mode = typed.packed ? '已压缩（无间隔）' : `对齐布局（间隔 ${layout.padBytes} B）`;
        typeExtra = `
          <p class="mem-layout__sub">${escapeHtml(meta.label)} · ${mode} · sizeof=${layout.size}</p>
          ${renderByteStrip(layout)}
          <div class="mem-layout__slot-wrap">
            <table class="mem-layout__slots">
              <thead><tr><th>地址/偏移</th><th>字段</th><th>种类</th><th>大小</th></tr></thead>
              <tbody>${renderTypeLayoutTable(layout, base)}</tbody>
            </table>
          </div>
          <p class="mem-layout__note">色条中灰色=对齐间隔。点左侧「压缩：消除间隔」可去掉空隙（示意 packed）。</p>`;
      }

      return `
        <h4 class="mem-layout__detail-title">栈帧 · ${escapeHtml(fr.label)}</h4>
        <dl class="mem-layout__facts">
          <div><dt>深度</dt><dd>#${idx}${isTop ? ' · 当前顶帧（SP）' : ''}</dd></div>
          <div><dt>调用者</dt><dd>${caller ? escapeHtml(caller.label) : '（进程入口）'}</dd></div>
          <div><dt>帧基址</dt><dd><code>${fmtAddr(fr.base)}</code></dd></div>
          <div><dt>大小</dt><dd>${fr.size} B</dd></div>
          <div><dt>当前 SP</dt><dd><code>${fmtAddr(stackPointer())}</code></dd></div>
        </dl>
        <p class="mem-layout__sub">帧内槽位（高 → 低）</p>
        <div class="mem-layout__slot-wrap">
          <table class="mem-layout__slots">
            <thead><tr><th>地址</th><th>槽位</th><th>种类</th><th>大小</th></tr></thead>
            <tbody>${slots}</tbody>
          </table>
        </div>
        ${typeExtra}
        <p class="mem-layout__note">自动变量 / 栈上对象随帧生灭；指针可指向堆，move 只转句柄不搬对象本体。</p>`;
    }

    const blk = state.blocks.find((b) => b.uid === state.selected.uid);
    if (!blk) return '';
    const hdr = blk.header || 8;
    const end = blk.addr + blk.bytes;
    const dist = Math.max(0, stackPointer() - end);

    if (blk.buffer && blk.regions) {
      const used = bufferUsedBytes(blk.regions);
      const gaps = bufferGapBytes(blk.regions);
      const rows = blk.regions
        .map(
          (r) => `
          <tr class="is-buf-${r.kind}">
            <td><code>${fmtAddr(blk.addr + r.offset)}</code></td>
            <td>+${fmtBytes(r.offset)}</td>
            <td>${r.kind === 'data' ? escapeHtml(r.label || 'data') : r.kind === 'gap' ? '空洞' : '未用'}</td>
            <td>${fmtBytes(r.size)}</td>
          </tr>`,
        )
        .join('');
      return `
        <h4 class="mem-layout__detail-title">大缓冲 · ${escapeHtml(blk.label)}</h4>
        <dl class="mem-layout__facts">
          <div><dt>基址</dt><dd><code>${fmtAddr(blk.addr)}</code></dd></div>
          <div><dt>容量</dt><dd>${fmtBytes(blk.bytes)}</dd></div>
          <div><dt>有效数据</dt><dd>${fmtBytes(used)}</dd></div>
          <div><dt>内部空洞</dt><dd>${fmtBytes(gaps)}</dd></div>
          <div><dt>距 SP</dt><dd>${fmtBytes(dist)}</dd></div>
        </dl>
        <p class="mem-layout__sub">块内布局（稀疏写 / memmove 紧缩）</p>
        ${renderBufferStrip(blk.regions, blk.bytes)}
        <div class="mem-layout__slot-wrap">
          <table class="mem-layout__slots">
            <thead><tr><th>地址</th><th>偏移</th><th>段</th><th>大小</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <p class="mem-layout__note">紧缩用 <code>memmove</code> 把数据段前移消空洞；尾部可用 <code>memset</code>。块总容量仍是 10MiB。</p>`;
    }

    const layout = blk.typeId
      ? typeLayoutFor(blk.typeId, Boolean(blk.packed))
      : blk.layout || null;
    const layoutTable = layout
      ? `<p class="mem-layout__sub">对象布局 · ${blk.packed ? '已压缩' : `对齐（间隔 ${layout.padBytes} B）`} · sizeof=${layout.size}</p>
         ${renderByteStrip(layout)}
         <div class="mem-layout__slot-wrap">
           <table class="mem-layout__slots">
             <thead><tr><th>地址</th><th>字段</th><th>种类</th><th>大小</th></tr></thead>
             <tbody>${renderTypeLayoutTable(layout, blk.addr)}</tbody>
           </table>
         </div>`
      : '';
    return `
      <h4 class="mem-layout__detail-title">堆块 · ${escapeHtml(blk.label)}</h4>
      <dl class="mem-layout__facts">
        <div><dt>用户指针</dt><dd><code>${fmtAddr(blk.addr)}</code></dd></div>
        <div><dt>有效载荷</dt><dd>${fmtBytes(blk.bytes)}</dd></div>
        <div><dt>块头示意</dt><dd>${hdr} B</dd></div>
        <div><dt>状态</dt><dd>${blk.live ? '已分配' : '已释放（墓碑）'}</dd></div>
        <div><dt>距 SP</dt><dd>${fmtBytes(dist)}</dd></div>
      </dl>
      ${layoutTable}
      <p class="mem-layout__note">结构体「压缩」消的是成员对齐间隔；大缓冲「memmove 紧缩」消的是块内写入空洞——两回事。</p>`;
  }

  function renderVas() {
    const frames = state.frames
      .map((fr, i) => {
        const active = state.selected?.kind === 'stack' && state.selected.uid === fr.uid;
        const h = Math.max(44, Math.min(96, 28 + fr.size / 2));
        const localSummary = fr.locals
          .map((l) => {
            if (l.movedFrom) return `${l.name}∅`;
            if (l.pointsTo) return `${l.name}→heap`;
            return l.name;
          })
          .join(' · ');
        return `
        <button type="button" class="mem-layout__frame${active ? ' is-active' : ''}" data-sel-stack="${escapeHtml(fr.uid)}" style="--frame-h:${h}px">
          <span class="mem-layout__frame-name"><em>#${i}</em> ${escapeHtml(fr.label)}</span>
          <span class="mem-layout__frame-meta">${fr.size} B · ${fmtAddr(fr.base)}</span>
          <span class="mem-layout__frame-locals">${escapeHtml(localSummary || '（无局部）')}</span>
        </button>`;
      })
      .join('');

    const liveBlocks = state.blocks.filter((b) => b.live);
    const deadBlocks = state.blocks.filter((b) => !b.live).slice(-3);
    const heapBtns = [...liveBlocks, ...deadBlocks]
      .map((blk) => {
        const active = state.selected?.kind === 'heap' && state.selected.uid === blk.uid;
        const h = Math.max(40, Math.min(100, 24 + blk.bytes / 2));
        return `
        <button type="button" class="mem-layout__hblock${active ? ' is-active' : ''}${blk.live ? '' : ' is-freed'}" data-sel-heap="${escapeHtml(blk.uid)}" style="--block-h:${h}px">
          <span class="mem-layout__hblock-name">${escapeHtml(blk.label)}</span>
          <span class="mem-layout__hblock-meta">${blk.bytes} B · ${fmtAddr(blk.addr)}${blk.live ? '' : ' · freed'}</span>
        </button>`;
      })
      .join('');

    const dataStatics = state.statics.filter((s) => s.region === 'data');
    const bssStatics = state.statics.filter((s) => s.region === 'bss');
    const renderStaticRow = (region, label, items, extraClass) => {
      const chips = items.length
        ? items
            .map((s) => {
              const active = state.selected?.kind === 'static' && state.selected.uid === s.uid;
              return `<button type="button" class="mem-layout__static-chip${active ? ' is-active' : ''}" data-sel-static="${escapeHtml(s.uid)}">${escapeHtml(s.name)} <small>${s.bytes}B</small></button>`;
            })
            .join('')
        : `<em class="mem-layout__static-empty">（空 · 可在左侧添加）</em>`;
      return `<div class="mem-layout__static-row ${extraClass}"><span>${label}</span><div class="mem-layout__static-chips">${chips}</div></div>`;
    };

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
            <span>↓ · SP <code>${fmtAddr(sp)}</code></span>
          </div>
          <div class="mem-layout__frames">${frames}</div>
        </div>

        <div class="mem-layout__region mem-layout__region--gap" style="--gap-flex:${gapPct}">
          <div class="mem-layout__gap-label">未映射 / 空隙 · ${fmtBytes(gapBytes)}<br/><code>${fmtAddr(state.heapBump)}</code> … <code>${fmtAddr(sp)}</code></div>
        </div>

        <div class="mem-layout__region mem-layout__region--heap">
          <div class="mem-layout__region-head">
            <strong>堆 Heap</strong>
            <span>↑ · bump <code>${fmtAddr(state.heapBump)}</code></span>
          </div>
          <div class="mem-layout__hblocks">${heapBtns || '<p class="mem-layout__empty">堆对象 / new 出现在这里</p>'}</div>
        </div>

        <div class="mem-layout__region mem-layout__region--static">
          ${renderStaticRow('bss', 'BSS', bssStatics, 'is-bss')}
          ${renderStaticRow('data', 'Data', dataStatics, 'is-data')}
          <div class="mem-layout__static-row is-text"><span>Text</span><em>代码（main / foo / 类成员函数…）</em></div>
        </div>

        <div class="mem-layout__addr-rail mem-layout__addr-rail--low">
          <span>低地址</span>
          <code>${fmtAddr(DATA_BASE - 0x1000)}</code>
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
    const localBtns = LOCAL_PRESETS.map(
      (l, i) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--local" data-local="${i}">${escapeHtml(l.label)}</button>`,
    ).join('');
    const staticBtns = STATIC_PRESETS.map(
      (s, i) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--static" data-static="${i}">${escapeHtml(s.label)}</button>`,
    ).join('');
    const typeStackBtns = TYPE_PRESETS.map(
      (t) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--type" data-type-stack="${t.id}">栈上 ${escapeHtml(t.label)}</button>`,
    ).join('');
    const typeHeapBtns = TYPE_PRESETS.map(
      (t) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--heap" data-type-heap="${t.id}">new ${escapeHtml(t.label)}</button>`,
    ).join('');
    const uniqueBtns = TYPE_PRESETS.map(
      (t) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--unique" data-unique="${t.id}">new ${escapeHtml(t.id)} + 句柄</button>`,
    ).join('');
    const heapBtns = HEAP_PRESETS.map(
      (h, i) =>
        `<button type="button" class="mem-layout__btn mem-layout__btn--heap" data-alloc="${i}">${escapeHtml(h.label)}</button>`,
    ).join('');
    const demoBtns = DEMOS.map(
      (d) =>
        `<button type="button" class="mem-layout__demo" data-demo="${d.id}">${escapeHtml(d.label)}</button>`,
    ).join('');

    const logRows = [...state.log]
      .reverse()
      .slice(0, 14)
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
          <p class="mem-layout__subtitle">常用操作：调用 · 静态/自动变量 · 对齐压缩 · new/move · 大缓冲稀疏写与 memmove/memset/memcpy</p>
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
        <div><span>静态</span><strong>${fmtBytes(u.staticBytes)}</strong><em>${u.staticCount} 符号</em></div>
        <div><span>堆存活</span><strong>${fmtBytes(u.heapLive)}</strong><em>${u.liveCount} 块</em></div>
        <div><span>空隙</span><strong>${fmtBytes(u.gap)}</strong></div>
        <div class="mem-layout__stats-chain"><span>调用链</span><strong>${escapeHtml(callChain)}</strong></div>
      </div>

      <div class="mem-layout__grid">
        <aside class="mem-layout__panel">
          <h3 class="mem-layout__panel-title">函数调用</h3>
          <p class="mem-layout__panel-hint">从 Text 进入下一帧；返回 LIFO 弹栈。</p>
          <div class="mem-layout__btn-row">${callBtns}</div>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide" data-ret>返回（弹栈）</button>

          <h3 class="mem-layout__panel-title">静态变量</h3>
          <p class="mem-layout__panel-hint">进 Data / BSS，寿命=程序，不随返回消失。</p>
          <div class="mem-layout__btn-row">${staticBtns}</div>

          <h3 class="mem-layout__panel-title">自动变量</h3>
          <p class="mem-layout__panel-hint">写入<strong>当前顶帧</strong>。</p>
          <div class="mem-layout__btn-row">${localBtns}</div>

          <h3 class="mem-layout__panel-title">结构体 / 类</h3>
          <p class="mem-layout__panel-hint">默认带对齐间隔；可放栈上或 <code>new</code> 到堆。</p>
          <div class="mem-layout__btn-row">${typeStackBtns}</div>
          <div class="mem-layout__btn-row" style="margin-top:0.35rem">${typeHeapBtns}</div>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide mem-layout__btn--pack" data-pack>压缩：消除间隔</button>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide" data-unpack>恢复对齐布局</button>

          <h3 class="mem-layout__panel-title">句柄与 move</h3>
          <p class="mem-layout__panel-hint">栈上指针持有堆对象；move 转移所有权。</p>
          <div class="mem-layout__btn-row">${uniqueBtns}</div>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide mem-layout__btn--move" data-move>move 顶帧句柄</button>

          <h3 class="mem-layout__panel-title">大缓冲 / memmove</h3>
          <p class="mem-layout__panel-hint">10MiB 内稀疏写 → <code>memmove</code> 收拢到前 2MiB → <code>memset</code> 清尾。</p>
          <button type="button" class="mem-layout__btn mem-layout__btn--heap" data-buf-new>new char[10MiB]</button>
          <button type="button" class="mem-layout__btn" data-buf-sparse>稀疏写：1MiB + 空4MiB + 1MiB</button>
          <button type="button" class="mem-layout__btn mem-layout__btn--pack" data-buf-compact>memmove 紧缩到前端</button>
          <button type="button" class="mem-layout__btn" data-buf-memset>memset 清尾/空洞</button>
          <button type="button" class="mem-layout__btn" data-buf-memcpy>memcpy 整块克隆</button>

          <h3 class="mem-layout__panel-title">裸堆分配</h3>
          <div class="mem-layout__btn-row">${heapBtns}</div>
          <button type="button" class="mem-layout__btn mem-layout__btn--wide mem-layout__btn--danger" data-free>释放选中堆块（delete）</button>

          <div class="mem-layout__legend">
            <span class="is-stack">栈帧</span>
            <span class="is-local">自动变量</span>
            <span class="is-heap">堆</span>
            <span class="is-static">静态</span>
            <span class="is-pad">对齐/空洞</span>
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

      <p class="mem-layout__credit">教学沙箱：地址与 memmove/memset/memcpy 步骤为示意；不模拟真实 ABI 或分配器合并。对照 Linux 内存分段与 <code>&lt;cstring&gt;</code> / <code>&lt;memory&gt;</code> 笔记。</p>
    `;

    shell.querySelector('[data-reset]')?.addEventListener('click', reset);
    shell.querySelector('[data-stop-demo]')?.addEventListener('click', () => {
      stopDemo();
      render();
    });
    shell.querySelector('[data-ret]')?.addEventListener('click', () => retFrame());
    shell.querySelector('[data-free]')?.addEventListener('click', () => freeSelected());
    shell.querySelector('[data-move]')?.addEventListener('click', () => moveHandle());
    shell.querySelector('[data-pack]')?.addEventListener('click', () => setPacked(true));
    shell.querySelector('[data-unpack]')?.addEventListener('click', () => setPacked(false));
    shell.querySelector('[data-buf-new]')?.addEventListener('click', () => allocBuffer());
    shell.querySelector('[data-buf-sparse]')?.addEventListener('click', () => bufferSparseWrite());
    shell.querySelector('[data-buf-compact]')?.addEventListener('click', () => bufferMemmoveCompact());
    shell.querySelector('[data-buf-memset]')?.addEventListener('click', () => bufferMemsetTail());
    shell.querySelector('[data-buf-memcpy]')?.addEventListener('click', () => bufferMemcpyClone());
    shell.querySelectorAll('[data-call]').forEach((el) => {
      el.addEventListener('click', () => callFrame(el.getAttribute('data-call') || ''));
    });
    shell.querySelectorAll('[data-local]').forEach((el) => {
      el.addEventListener('click', () => addLocal(Number(el.getAttribute('data-local'))));
    });
    shell.querySelectorAll('[data-static]').forEach((el) => {
      el.addEventListener('click', () => addStatic(Number(el.getAttribute('data-static'))));
    });
    shell.querySelectorAll('[data-type-stack]').forEach((el) => {
      el.addEventListener('click', () => addTypeLocal(el.getAttribute('data-type-stack') || ''));
    });
    shell.querySelectorAll('[data-type-heap]').forEach((el) => {
      el.addEventListener('click', () => allocHeapType(el.getAttribute('data-type-heap') || ''));
    });
    shell.querySelectorAll('[data-unique]').forEach((el) => {
      el.addEventListener('click', () => allocUnique(el.getAttribute('data-unique') || ''));
    });
    shell.querySelectorAll('[data-alloc]').forEach((el) => {
      el.addEventListener('click', () => allocHeapRaw(Number(el.getAttribute('data-alloc'))));
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
    shell.querySelectorAll('[data-sel-static]').forEach((el) => {
      el.addEventListener('click', () => select('static', el.getAttribute('data-sel-static') || ''));
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
