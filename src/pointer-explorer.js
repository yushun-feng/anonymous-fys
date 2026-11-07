/**
 * Pointer Ops Explorer — slot + arrow teaching sandbox.
 * Raw pointers (& / * / nullptr / arithmetic / multilevel) +
 * unique/shared/weak with use_count, move, and cycle warning.
 * Chinese UI. Simplified slot model — not a full VAS (see #/memory).
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STACK_BASE = 0x7fff1000;
const HEAP_BASE = 0x55556000;
const INT_SIZE = 4;

const DEMOS = [
  {
    id: 'bind-deref',
    label: '① 取址绑定 → 改 x 看 *p',
    steps: ['reset-raw', 'bind-p-x', 'write-x:99', 'eval-*p', 'pause'],
  },
  {
    id: 'deref-write',
    label: '② 解引用写入 *p=42',
    steps: ['reset-raw', 'bind-p-x', 'deref-write:42', 'pause'],
  },
  {
    id: 'null-danger',
    label: '③ 空指针警示',
    steps: ['reset-raw', 'bind-p-x', 'null-p', 'eval-*p', 'pause'],
  },
  {
    id: 'arith',
    label: '④ 指针算术（按 int 步长）',
    steps: ['reset-raw', 'bind-p-arr0', 'eval-p', 'arith:+1', 'eval-p', 'arith:+1', 'eval-*p', 'pause'],
  },
  {
    id: 'multilevel',
    label: '⑤ 多级 pp → p → x',
    steps: ['reset-raw', 'bind-p-x', 'bind-pp-p', 'eval-**pp', 'pause'],
  },
  {
    id: 'unique-move',
    label: '⑥ unique_ptr move',
    steps: ['reset-smart', 'unique-make', 'unique-move', 'pause'],
  },
  {
    id: 'shared-count',
    label: '⑦ shared_ptr 引用计数',
    steps: ['reset-smart', 'shared-make', 'shared-copy', 'shared-reset-sp2', 'pause'],
  },
  {
    id: 'weak-lock',
    label: '⑧ weak_ptr lock',
    steps: ['reset-smart', 'shared-make', 'weak-assign', 'weak-lock', 'shared-reset-sp1', 'weak-lock', 'pause'],
  },
  {
    id: 'cycle',
    label: '⑨ 环引用警示 / weak 破环',
    steps: ['reset-smart', 'cycle-shared', 'pause', 'cycle-break-weak', 'pause'],
  },
];

function fmtAddr(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `0x${n.toString(16)}`;
}

function freshRawState() {
  const xAddr = STACK_BASE;
  const arr0 = STACK_BASE + 0x10;
  const arr1 = arr0 + INT_SIZE;
  const arr2 = arr1 + INT_SIZE;
  const pAddr = STACK_BASE + 0x30;
  const ppAddr = STACK_BASE + 0x38;
  return {
    panel: 'raw',
    selected: null,
    flashId: null,
    danger: null,
    expr: { code: '—', result: '准备就绪', kind: 'info' },
    slots: [
      { id: 'x', name: 'x', decl: 'int x', kind: 'value', value: 10, addr: xAddr },
      { id: 'arr0', name: 'arr[0]', decl: 'int arr[3]', kind: 'value', value: 1, addr: arr0, group: 'arr' },
      { id: 'arr1', name: 'arr[1]', decl: 'int arr[3]', kind: 'value', value: 2, addr: arr1, group: 'arr' },
      { id: 'arr2', name: 'arr[2]', decl: 'int arr[3]', kind: 'value', value: 3, addr: arr2, group: 'arr' },
      { id: 'p', name: 'p', decl: 'int* p', kind: 'raw', pointsTo: null, addr: pAddr },
      { id: 'pp', name: 'pp', decl: 'int** pp', kind: 'raw2', pointsTo: null, addr: ppAddr },
    ],
    heap: [],
  };
}

function freshSmartState() {
  return {
    panel: 'smart',
    selected: null,
    flashId: null,
    danger: null,
    expr: { code: '—', result: '智能指针面板', kind: 'info' },
    slots: [
      {
        id: 'up',
        name: 'up',
        decl: 'unique_ptr<Obj> up',
        kind: 'unique',
        pointsTo: null,
        addr: STACK_BASE + 0x80,
      },
      {
        id: 'up2',
        name: 'up2',
        decl: 'unique_ptr<Obj> up2',
        kind: 'unique',
        pointsTo: null,
        addr: STACK_BASE + 0x88,
      },
      {
        id: 'sp1',
        name: 'sp1',
        decl: 'shared_ptr<Obj> sp1',
        kind: 'shared',
        pointsTo: null,
        addr: STACK_BASE + 0x90,
      },
      {
        id: 'sp2',
        name: 'sp2',
        decl: 'shared_ptr<Obj> sp2',
        kind: 'shared',
        pointsTo: null,
        addr: STACK_BASE + 0x98,
      },
      {
        id: 'wp',
        name: 'wp',
        decl: 'weak_ptr<Obj> wp',
        kind: 'weak',
        pointsTo: null,
        addr: STACK_BASE + 0xa0,
      },
      {
        id: 'nodeA',
        name: 'a',
        decl: 'shared_ptr<Node> a',
        kind: 'shared',
        pointsTo: null,
        addr: STACK_BASE + 0xb0,
        role: 'cycle',
      },
      {
        id: 'nodeB',
        name: 'b',
        decl: 'shared_ptr<Node> b',
        kind: 'shared',
        pointsTo: null,
        addr: STACK_BASE + 0xb8,
        role: 'cycle',
      },
    ],
    heap: [],
  };
}

/**
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 */
export function mountPointerExplorer(container, options = {}) {
  const compact = Boolean(options.compact);

  /** @type {ReturnType<typeof freshRawState>} */
  let state = freshRawState();
  /** @type {{ no: number, op: string, detail: string }[]} */
  let log = [];
  let logNo = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let demoTimer = null;
  /** @type {string[]} */
  let demoQueue = [];
  let demoPlaying = false;

  const shell = document.createElement('section');
  shell.className = `ptr-explorer${compact ? ' ptr-explorer--compact' : ''}`;
  shell.setAttribute('aria-label', '指针操作交互演示');
  let disposed = false;

  function pushLog(op, detail) {
    logNo += 1;
    log.push({ no: logNo, op, detail });
    if (log.length > 50) log = log.slice(-50);
  }

  function slotById(id) {
    return state.slots.find((s) => s.id === id) || null;
  }

  function heapById(id) {
    return state.heap.find((h) => h.id === id) || null;
  }

  function setExpr(code, result, kind = 'info') {
    state.expr = { code, result, kind };
  }

  function recountShared(heapId) {
    const h = heapById(heapId);
    if (!h || !h.alive) return;
    const strong = state.slots.filter(
      (s) => (s.kind === 'shared' || s.kind === 'unique') && s.pointsTo === heapId,
    ).length;
    // Node cycle edges also count as strong refs stored on the heap object itself.
    let edgeStrong = 0;
    for (const other of state.heap) {
      if (other.alive && other.strongEdge === heapId) edgeStrong += 1;
    }
    h.useCount = strong + edgeStrong;
    const weak = state.slots.filter((s) => s.kind === 'weak' && s.pointsTo === heapId).length;
    let edgeWeak = 0;
    for (const other of state.heap) {
      if (other.alive && other.weakEdge === heapId) edgeWeak += 1;
    }
    h.weakCount = weak + edgeWeak;
  }

  function maybeFreeHeap(heapId) {
    const h = heapById(heapId);
    if (!h || !h.alive) return;
    recountShared(heapId);
    if (h.useCount <= 0) {
      h.alive = false;
      h.freed = true;
      for (const s of state.slots) {
        if (s.kind === 'weak' && s.pointsTo === heapId) {
          // weak stays but expired
        } else if (s.pointsTo === heapId && (s.kind === 'shared' || s.kind === 'unique')) {
          s.pointsTo = null;
        }
      }
      pushLog('DELETE', `堆对象 ${h.label} use_count→0，释放 @ ${fmtAddr(h.addr)}`);
    }
  }

  function detectCycle() {
    const alive = state.heap.filter((h) => h.alive && h.tag === 'Node');
    if (alive.length < 2) return null;
    const a = alive.find((h) => h.label === 'NodeA');
    const b = alive.find((h) => h.label === 'NodeB');
    if (!a || !b) return null;
    const aToB = a.strongEdge === b.id;
    const bToA = b.strongEdge === a.id;
    if (aToB && bToA) {
      return {
        kind: 'cycle',
        msg: `环引用：A.shared→B 且 B.shared→A，use_count 无法归零（A=${a.useCount}, B=${b.useCount}）`,
      };
    }
    return null;
  }

  // ——— Raw ops ———
  function bindP(targetId) {
    const p = slotById('p');
    const t = slotById(targetId);
    if (!p || !t) return;
    p.pointsTo = targetId;
    state.flashId = 'p';
    state.danger = null;
    setExpr(`p = &${t.name}`, `${p.name} → ${fmtAddr(t.addr)}（${t.decl}）`, 'ok');
    pushLog('BIND', `p = &${t.name}  →  ${fmtAddr(t.addr)}`);
  }

  function bindPp() {
    const pp = slotById('pp');
    const p = slotById('p');
    if (!pp || !p) return;
    if (!p.pointsTo) {
      setExpr('pp = &p', '建议先让 p 指向有效对象，再绑多级', 'warn');
    }
    pp.pointsTo = 'p';
    state.flashId = 'pp';
    setExpr('pp = &p', `pp → ${fmtAddr(p.addr)}（int*）`, 'ok');
    pushLog('BIND', `pp = &p  →  ${fmtAddr(p.addr)}`);
  }

  function nullP() {
    const p = slotById('p');
    if (!p) return;
    p.pointsTo = null;
    state.flashId = 'p';
    state.danger = null;
    setExpr('p = nullptr', '空指针：不指向任何对象', 'warn');
    pushLog('NULL', 'p = nullptr');
  }

  function derefWrite(val) {
    const p = slotById('p');
    if (!p) return;
    if (!p.pointsTo) {
      state.danger = 'null-deref';
      setExpr(`*p = ${val}`, '危险：对空指针解引用（教学警示，未模拟崩溃细节）', 'danger');
      pushLog('UB!', `*p = ${val}  —  p 为 nullptr`);
      return;
    }
    const t = slotById(p.pointsTo);
    if (!t || t.kind !== 'value') {
      state.danger = 'dangling';
      setExpr(`*p = ${val}`, '危险：悬空/无效目标', 'danger');
      pushLog('UB!', `*p 目标无效`);
      return;
    }
    t.value = val;
    state.flashId = t.id;
    state.danger = null;
    setExpr(`*p = ${val}`, `${t.name} 现为 ${val}（经指针写入）`, 'ok');
    pushLog('STORE', `*p = ${val}  →  ${t.name} @ ${fmtAddr(t.addr)}`);
  }

  function writeX(val) {
    const x = slotById('x');
    if (!x) return;
    x.value = val;
    state.flashId = 'x';
    setExpr(`x = ${val}`, `直接改 x；若 p=&x，则 *p 同步可见`, 'ok');
    pushLog('ASSIGN', `x = ${val}`);
  }

  function evalStarP() {
    const p = slotById('p');
    if (!p) return;
    if (!p.pointsTo) {
      state.danger = 'null-deref';
      setExpr('*p', '危险：解引用空指针', 'danger');
      pushLog('UB!', '*p  —  nullptr');
      return;
    }
    const t = slotById(p.pointsTo);
    if (!t) {
      state.danger = 'dangling';
      setExpr('*p', '危险：悬空指针', 'danger');
      return;
    }
    state.flashId = t.id;
    state.danger = null;
    setExpr('*p', `${t.name} = ${t.value}  @ ${fmtAddr(t.addr)}`, 'ok');
    pushLog('LOAD', `*p → ${t.value}`);
  }

  function evalP() {
    const p = slotById('p');
    if (!p) return;
    if (!p.pointsTo) {
      setExpr('p', 'nullptr', 'warn');
      return;
    }
    const t = slotById(p.pointsTo);
    setExpr('p', `${fmtAddr(t?.addr)} → ${t?.name}`, 'info');
    pushLog('EVAL', `p = ${fmtAddr(t?.addr)}`);
  }

  function evalStarStarPp() {
    const pp = slotById('pp');
    if (!pp || !pp.pointsTo) {
      setExpr('**pp', 'pp 未绑定', 'warn');
      return;
    }
    const p = slotById(pp.pointsTo);
    if (!p || !p.pointsTo) {
      setExpr('**pp', '中间指针为空', 'danger');
      state.danger = 'null-deref';
      return;
    }
    const t = slotById(p.pointsTo);
    state.flashId = t?.id || null;
    setExpr('**pp', `${t?.name} = ${t?.value}`, 'ok');
    pushLog('LOAD', `**pp → ${t?.value}`);
  }

  function arith(delta) {
    const p = slotById('p');
    if (!p) return;
    if (!p.pointsTo) {
      setExpr(`p ${delta > 0 ? '+' : '-'} 1`, '空指针上做算术无意义（教学跳过）', 'warn');
      return;
    }
    const cur = slotById(p.pointsTo);
    if (!cur || cur.group !== 'arr') {
      setExpr(`p ${delta > 0 ? '+' : '-'} 1`, '算术演示请先绑到 arr[i]（强调按类型步长）', 'warn');
      pushLog('ARITH', '目标非数组格，已拒绝');
      return;
    }
    const idx = Number(cur.name.replace('arr[', '').replace(']', ''));
    const next = idx + delta;
    if (next < 0 || next > 2) {
      setExpr(`p ${delta > 0 ? '+' : '-'} 1`, `越界示意：arr[${next}] 不在演示范围内`, 'warn');
      pushLog('ARITH', `会越界到 arr[${next}]（未移动）`);
      return;
    }
    const nextId = `arr${next}`;
    const t = slotById(nextId);
    p.pointsTo = nextId;
    state.flashId = 'p';
    const bytes = Math.abs(delta) * INT_SIZE;
    setExpr(
      `p ${delta > 0 ? '+' : '-'} 1`,
      `移动到 ${t.name}；地址 ${delta > 0 ? '+' : '−'}${bytes} 字节（sizeof(int)=${INT_SIZE}），不是 ±1 字节`,
      'ok',
    );
    pushLog('ARITH', `p → ${t.name}  (Δaddr=${delta > 0 ? '+' : '-'}${bytes}B)`);
  }

  // ——— Smart ops ———
  function allocHeap(label, tag = 'Obj') {
    const id = `h${state.heap.length + 1}_${Date.now().toString(36)}`;
    const addr = HEAP_BASE + state.heap.length * 0x40;
    const obj = {
      id,
      label,
      tag,
      addr,
      value: label,
      useCount: 0,
      weakCount: 0,
      alive: true,
      freed: false,
      strongEdge: null,
      weakEdge: null,
    };
    state.heap.push(obj);
    return obj;
  }

  function uniqueMake() {
    const up = slotById('up');
    if (!up) return;
    if (up.pointsTo) {
      const old = up.pointsTo;
      up.pointsTo = null;
      maybeFreeHeap(old);
    }
    const h = allocHeap('Obj', 'Obj');
    up.pointsTo = h.id;
    recountShared(h.id);
    state.flashId = 'up';
    setExpr('up = make_unique<Obj>()', `独占箭头 → 堆 ${fmtAddr(h.addr)}；use_count 概念不适用（独占）`, 'ok');
    pushLog('UNIQUE', `make_unique → ${fmtAddr(h.addr)}`);
  }

  function uniqueMove() {
    const up = slotById('up');
    const up2 = slotById('up2');
    if (!up || !up2) return;
    if (!up.pointsTo) {
      setExpr('up2 = std::move(up)', 'up 为空，无可转移所有权', 'warn');
      return;
    }
    const hid = up.pointsTo;
    if (up2.pointsTo && up2.pointsTo !== hid) {
      const old = up2.pointsTo;
      up2.pointsTo = null;
      maybeFreeHeap(old);
    }
    up2.pointsTo = hid;
    up.pointsTo = null;
    state.flashId = 'up2';
    recountShared(hid);
    setExpr('up2 = std::move(up)', '源 up 变空；目标 up2 接管同一堆块（对象地址不变）', 'ok');
    pushLog('MOVE', `unique 所有权 ${fmtAddr(heapById(hid)?.addr)}：up → up2`);
  }

  function sharedMake() {
    const sp1 = slotById('sp1');
    if (!sp1) return;
    if (sp1.pointsTo) {
      const old = sp1.pointsTo;
      sp1.pointsTo = null;
      maybeFreeHeap(old);
    }
    const h = allocHeap('Obj', 'Obj');
    sp1.pointsTo = h.id;
    recountShared(h.id);
    state.flashId = 'sp1';
    setExpr('sp1 = make_shared<Obj>()', `use_count = ${h.useCount} @ ${fmtAddr(h.addr)}`, 'ok');
    pushLog('SHARED', `make_shared use_count=${h.useCount}`);
  }

  function sharedCopy() {
    const sp1 = slotById('sp1');
    const sp2 = slotById('sp2');
    if (!sp1 || !sp2) return;
    if (!sp1.pointsTo) {
      setExpr('sp2 = sp1', 'sp1 为空', 'warn');
      return;
    }
    if (sp2.pointsTo && sp2.pointsTo !== sp1.pointsTo) {
      const old = sp2.pointsTo;
      sp2.pointsTo = null;
      maybeFreeHeap(old);
    }
    sp2.pointsTo = sp1.pointsTo;
    recountShared(sp1.pointsTo);
    const h = heapById(sp1.pointsTo);
    state.flashId = 'sp2';
    setExpr('sp2 = sp1', `拷贝 +1 → use_count = ${h?.useCount}`, 'ok');
    pushLog('COPY', `shared 拷贝 use_count=${h?.useCount}`);
  }

  function sharedReset(slotId) {
    const s = slotById(slotId);
    if (!s || !s.pointsTo) {
      setExpr(`${s?.name || slotId}.reset()`, '已为空', 'info');
      return;
    }
    const hid = s.pointsTo;
    s.pointsTo = null;
    state.flashId = slotId;
    recountShared(hid);
    const h = heapById(hid);
    setExpr(`${s.name}.reset()`, `−1 → use_count = ${h?.alive ? h.useCount : 0}${h && !h.alive ? '（已释放）' : ''}`, 'ok');
    pushLog('RESET', `${s.name}.reset() use_count→${h?.useCount ?? 0}`);
    maybeFreeHeap(hid);
  }

  function weakAssign() {
    const sp1 = slotById('sp1');
    const wp = slotById('wp');
    if (!sp1 || !wp) return;
    if (!sp1.pointsTo) {
      setExpr('wp = sp1', 'sp1 为空，无法观察', 'warn');
      return;
    }
    wp.pointsTo = sp1.pointsTo;
    recountShared(sp1.pointsTo);
    const h = heapById(sp1.pointsTo);
    state.flashId = 'wp';
    setExpr('wp = sp1', `弱引用虚线；use_count 仍为 ${h?.useCount}（不 +1）`, 'ok');
    pushLog('WEAK', `wp 观察 ${fmtAddr(h?.addr)}，use_count 不变=${h?.useCount}`);
  }

  function weakLock() {
    const wp = slotById('wp');
    if (!wp || !wp.pointsTo) {
      setExpr('wp.lock()', 'wp 未绑定', 'warn');
      return;
    }
    const h = heapById(wp.pointsTo);
    if (!h || !h.alive) {
      setExpr('auto tmp = wp.lock()', 'expired：对象已释放，lock 得到空 shared_ptr', 'danger');
      pushLog('LOCK', 'weak_ptr::lock → empty（对象已死）');
      state.danger = 'expired';
      return;
    }
    // Temporary strong bump visualization
    const before = h.useCount;
    h.useCount = before + 1;
    state.flashId = 'wp';
    setExpr(
      'auto tmp = wp.lock()',
      `临时升强引用：use_count ${before} → ${h.useCount}；tmp 析构后回到 ${before}`,
      'ok',
    );
    pushLog('LOCK', `lock 临时 use_count ${before}→${h.useCount}→${before}`);
    // Simulate tmp end of scope
    setTimeout(() => {
      if (disposed || !h.alive) return;
      recountShared(h.id);
      render();
    }, 900);
  }

  function cycleShared() {
    // Clear previous cycle nodes' handles
    for (const id of ['nodeA', 'nodeB']) {
      const s = slotById(id);
      if (s?.pointsTo) {
        const old = s.pointsTo;
        s.pointsTo = null;
        maybeFreeHeap(old);
      }
    }
    // Also clear edges on leftover heap
    for (const h of state.heap) {
      h.strongEdge = null;
      h.weakEdge = null;
    }

    const ha = allocHeap('NodeA', 'Node');
    const hb = allocHeap('NodeB', 'Node');
    const a = slotById('nodeA');
    const b = slotById('nodeB');
    if (a) a.pointsTo = ha.id;
    if (b) b.pointsTo = hb.id;
    ha.strongEdge = hb.id; // A.other = B (shared)
    hb.strongEdge = ha.id; // B.other = A (shared)
    recountShared(ha.id);
    recountShared(hb.id);
    state.flashId = 'nodeA';
    state.danger = 'cycle';
    setExpr(
      'a->other = b; b->other = a',
      `环引用警示：两边都是 shared，计数锁死（A=${ha.useCount}, B=${hb.useCount}）。外层 reset 也释放不了。`,
      'danger',
    );
    pushLog('CYCLE', `A.shared→B 且 B.shared→A；use_count A=${ha.useCount} B=${hb.useCount}`);
  }

  function cycleBreakWeak() {
    const ha = state.heap.find((h) => h.alive && h.label === 'NodeA');
    const hb = state.heap.find((h) => h.alive && h.label === 'NodeB');
    if (!ha || !hb) {
      setExpr('破环', '请先建立环引用演示', 'warn');
      return;
    }
    // B.other becomes weak → A
    hb.strongEdge = null;
    hb.weakEdge = ha.id;
    recountShared(ha.id);
    recountShared(hb.id);
    state.danger = null;
    setExpr(
      'B.other 改为 weak_ptr',
      `破环：B 对 A 仅为弱引用。此时 A.use=${ha.useCount}, B.use=${hb.useCount}；外层 reset 后可归零释放。`,
      'ok',
    );
    pushLog('BREAK', `B.other: shared→weak；A.use=${ha.useCount} B.use=${hb.useCount}`);
  }

  function resetPanel(which) {
    stopDemo();
    state = which === 'smart' ? freshSmartState() : freshRawState();
    setExpr('reset', which === 'smart' ? '智能指针面板已重置' : '原始指针面板已重置', 'info');
    pushLog('RESET', which === 'smart' ? 'smart panel' : 'raw panel');
  }

  function runStep(step) {
    if (step === 'pause') return;
    if (step === 'reset-raw') {
      state = freshRawState();
      pushLog('RESET', 'raw');
      return;
    }
    if (step === 'reset-smart') {
      state = freshSmartState();
      pushLog('RESET', 'smart');
      return;
    }
    if (step === 'bind-p-x') return bindP('x');
    if (step === 'bind-p-arr0') return bindP('arr0');
    if (step === 'bind-pp-p') return bindPp();
    if (step === 'null-p') return nullP();
    if (step.startsWith('deref-write:')) return derefWrite(Number(step.split(':')[1]));
    if (step.startsWith('write-x:')) return writeX(Number(step.split(':')[1]));
    if (step === 'eval-*p') return evalStarP();
    if (step === 'eval-p') return evalP();
    if (step === 'eval-**pp') return evalStarStarPp();
    if (step === 'arith:+1') return arith(1);
    if (step === 'arith:-1') return arith(-1);
    if (step === 'unique-make') return uniqueMake();
    if (step === 'unique-move') return uniqueMove();
    if (step === 'shared-make') return sharedMake();
    if (step === 'shared-copy') return sharedCopy();
    if (step === 'shared-reset-sp1') return sharedReset('sp1');
    if (step === 'shared-reset-sp2') return sharedReset('sp2');
    if (step === 'weak-assign') return weakAssign();
    if (step === 'weak-lock') return weakLock();
    if (step === 'cycle-shared') return cycleShared();
    if (step === 'cycle-break-weak') return cycleBreakWeak();
  }

  function stopDemo() {
    if (demoTimer) {
      clearInterval(demoTimer);
      demoTimer = null;
    }
    demoPlaying = false;
    demoQueue = [];
  }

  function playDemo(demoId) {
    const demo = DEMOS.find((d) => d.id === demoId);
    if (!demo) return;
    stopDemo();
    demoQueue = [...demo.steps];
    demoPlaying = true;
    pushLog('DEMO', demo.label);
    const tick = () => {
      if (!demoQueue.length) {
        stopDemo();
        render();
        return;
      }
      const step = demoQueue.shift();
      runStep(step);
      render();
    };
    tick();
    demoTimer = setInterval(tick, 1100);
  }

  function relatedIds(id) {
    const set = new Set([id]);
    const s = slotById(id);
    if (!s) {
      const h = heapById(id);
      if (h) {
        set.add(h.id);
        for (const sl of state.slots) {
          if (sl.pointsTo === h.id) set.add(sl.id);
        }
        if (h.strongEdge) set.add(h.strongEdge);
        if (h.weakEdge) set.add(h.weakEdge);
      }
      return set;
    }
    if (s.pointsTo) {
      set.add(s.pointsTo);
      const mid = slotById(s.pointsTo);
      if (mid?.pointsTo) set.add(mid.pointsTo);
      const h = heapById(s.pointsTo);
      if (h) {
        if (h.strongEdge) set.add(h.strongEdge);
        if (h.weakEdge) set.add(h.weakEdge);
      }
    }
    for (const other of state.slots) {
      if (other.pointsTo === id) set.add(other.id);
      if (other.pointsTo && slotById(other.pointsTo)?.pointsTo === id) set.add(other.id);
    }
    return set;
  }

  function slotValueHtml(s) {
    if (s.kind === 'value') {
      return `<span class="ptr-explorer__val">${escapeHtml(String(s.value))}</span>`;
    }
    if (!s.pointsTo) {
      return `<span class="ptr-explorer__val is-null">nullptr</span>`;
    }
    if (s.kind === 'raw' || s.kind === 'raw2') {
      const t = slotById(s.pointsTo);
      return `<span class="ptr-explorer__val is-ptr">${fmtAddr(t?.addr)} <em>→ ${escapeHtml(t?.name || '?')}</em></span>`;
    }
    const h = heapById(s.pointsTo);
    if (!h || !h.alive) {
      return `<span class="ptr-explorer__val is-null">${s.kind === 'weak' ? 'expired' : 'nullptr'}</span>`;
    }
    const count =
      s.kind === 'shared'
        ? ` <em>use=${h.useCount}</em>`
        : s.kind === 'weak'
          ? ` <em>弱</em>`
          : ` <em>独占</em>`;
    return `<span class="ptr-explorer__val is-ptr">${fmtAddr(h.addr)}${count}</span>`;
  }

  function renderSlots(list, title) {
    const sel = state.selected;
    const related = sel ? relatedIds(sel) : null;
    return `
      <p class="ptr-explorer__panel-title">${title}</p>
      <div class="ptr-explorer__slots">
        ${list
          .map((s) => {
            const isSel = sel === s.id;
            const isRel = related ? related.has(s.id) : false;
            const flash = state.flashId === s.id ? ' is-flash' : '';
            const kindClass = `is-${s.kind}`;
            return `
              <button type="button" class="ptr-explorer__slot ${kindClass}${isSel ? ' is-selected' : ''}${isRel ? ' is-related' : ''}${flash}"
                data-slot="${escapeHtml(s.id)}" aria-pressed="${isSel ? 'true' : 'false'}">
                <span class="ptr-explorer__slot-decl">${escapeHtml(s.decl)}</span>
                <span class="ptr-explorer__slot-name">${escapeHtml(s.name)}</span>
                ${slotValueHtml(s)}
                <span class="ptr-explorer__slot-addr">${fmtAddr(s.addr)}</span>
              </button>`;
          })
          .join('')}
      </div>`;
  }

  function renderHeap() {
    if (!state.heap.length) {
      return `<p class="ptr-explorer__panel-hint">堆区空（智能指针创建对象后出现）</p>`;
    }
    const sel = state.selected;
    const related = sel ? relatedIds(sel) : null;
    return `
      <p class="ptr-explorer__panel-title">堆对象</p>
      <div class="ptr-explorer__heap">
        ${state.heap
          .map((h) => {
            const dead = !h.alive;
            const isRel = related ? related.has(h.id) : false;
            const edge =
              h.strongEdge
                ? `strong→${heapById(h.strongEdge)?.label || '?'}`
                : h.weakEdge
                  ? `weak→${heapById(h.weakEdge)?.label || '?'}`
                  : '';
            return `
              <button type="button" class="ptr-explorer__heap-card${dead ? ' is-freed' : ''}${isRel ? ' is-related' : ''}"
                data-heap="${escapeHtml(h.id)}">
                <strong>${escapeHtml(h.label)}</strong>
                <span>${fmtAddr(h.addr)}</span>
                <span class="ptr-explorer__rc">use_count=${h.useCount}${h.weakCount ? ` · weak=${h.weakCount}` : ''}</span>
                ${edge ? `<span class="ptr-explorer__edge">${escapeHtml(edge)}</span>` : ''}
                ${dead ? '<span class="ptr-explorer__freed-tag">已释放</span>' : ''}
              </button>`;
          })
          .join('')}
      </div>`;
  }

  function collectArrows() {
    /** @type {{ from: string, to: string, style: string, label?: string }[]} */
    const arrows = [];
    for (const s of state.slots) {
      if (!s.pointsTo) {
        if (s.kind === 'raw' || s.kind === 'raw2' || s.kind === 'unique' || s.kind === 'shared' || s.kind === 'weak') {
          // null: no arrow (or broken marker drawn in SVG as stub)
        }
        continue;
      }
      let style = 'solid';
      if (s.kind === 'weak') style = 'weak';
      else if (s.kind === 'unique') style = 'unique';
      else if (s.kind === 'shared') style = 'shared';
      else if (s.kind === 'raw2') style = 'raw2';
      else style = 'raw';

      const targetSlot = slotById(s.pointsTo);
      const targetHeap = heapById(s.pointsTo);
      if (targetSlot) {
        arrows.push({ from: s.id, to: targetSlot.id, style, label: s.kind === 'raw2' ? '&' : '→' });
      } else if (targetHeap) {
        const expired = !targetHeap.alive;
        arrows.push({
          from: s.id,
          to: targetHeap.id,
          style: expired ? 'dangling' : style,
          label: expired ? '悬空' : undefined,
        });
      }
    }
    for (const h of state.heap) {
      if (!h.alive) continue;
      if (h.strongEdge && heapById(h.strongEdge)) {
        arrows.push({ from: h.id, to: h.strongEdge, style: 'cycle', label: 'shared' });
      }
      if (h.weakEdge && heapById(h.weakEdge)) {
        arrows.push({ from: h.id, to: h.weakEdge, style: 'weak', label: 'weak' });
      }
    }
    // Null broken stubs for empty raw/unique/shared
    for (const s of state.slots) {
      if (
        (s.kind === 'raw' || s.kind === 'raw2' || s.kind === 'unique' || s.kind === 'shared') &&
        !s.pointsTo
      ) {
        arrows.push({ from: s.id, to: '', style: 'null', label: 'null' });
      }
    }
    return arrows;
  }

  function drawArrows() {
    const svg = shell.querySelector('[data-arrows]');
    const board = shell.querySelector('[data-board]');
    if (!svg || !board) return;
    const br = board.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, br.width)} ${Math.max(1, br.height)}`);
    svg.setAttribute('width', String(br.width));
    svg.setAttribute('height', String(br.height));

    const arrows = collectArrows();
    const sel = state.selected;
    const related = sel ? relatedIds(sel) : null;

    const parts = [];
    parts.push(`
      <defs>
        <marker id="ptr-arrow-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor"></path>
        </marker>
        <marker id="ptr-arrow-head-danger" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#e85d5d"></path>
        </marker>
      </defs>`);

    for (const a of arrows) {
      const fromEl =
        board.querySelector(`[data-slot="${a.from}"]`) ||
        board.querySelector(`[data-heap="${a.from}"]`);
      if (!fromEl) continue;
      const fr = fromEl.getBoundingClientRect();
      const x1 = fr.right - br.left - 4;
      const y1 = fr.top + fr.height / 2 - br.top;

      const dim = related && !related.has(a.from) && !(a.to && related.has(a.to));
      const lit = related && (related.has(a.from) || (a.to && related.has(a.to)));

      if (a.style === 'null') {
        const x2 = x1 + 36;
        const y2 = y1;
        parts.push(`
          <g class="ptr-explorer__arrow is-null${dim ? ' is-dim' : ''}${lit ? ' is-lit' : ''}">
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-dasharray="4 4" />
            <line x1="${x2 - 6}" y1="${y2 - 6}" x2="${x2 + 6}" y2="${y2 + 6}" />
            <line x1="${x2 - 6}" y1="${y2 + 6}" x2="${x2 + 6}" y2="${y2 - 6}" />
          </g>`);
        continue;
      }

      const toEl =
        board.querySelector(`[data-slot="${a.to}"]`) ||
        board.querySelector(`[data-heap="${a.to}"]`);
      if (!toEl) continue;
      const tr = toEl.getBoundingClientRect();
      const x2 = tr.left - br.left + 6;
      const y2 = tr.top + tr.height / 2 - br.top;
      const mx = (x1 + x2) / 2;
      const cls = `is-${a.style}${dim ? ' is-dim' : ''}${lit ? ' is-lit' : ''}${a.style === 'dangling' || a.style === 'cycle' ? ' is-warn' : ''}`;
      const marker =
        a.style === 'dangling' || a.style === 'cycle' ? 'url(#ptr-arrow-head-danger)' : 'url(#ptr-arrow-head)';
      const dash =
        a.style === 'weak' || a.style === 'dangling' || a.style === 'null'
          ? 'stroke-dasharray="5 4"'
          : a.style === 'unique'
            ? 'stroke-dasharray="0"'
            : '';
      parts.push(`
        <g class="ptr-explorer__arrow ${cls}">
          <path d="M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" fill="none" ${dash}
            marker-end="${marker}" />
          ${a.label ? `<text x="${mx}" y="${(y1 + y2) / 2 - 6}">${escapeHtml(a.label)}</text>` : ''}
        </g>`);
    }
    svg.innerHTML = parts.join('');
  }

  function render() {
    const cycle = detectCycle();
    const dangerBanner =
      state.danger === 'null-deref'
        ? '<div class="ptr-explorer__banner is-danger" role="alert">教学警示：空指针解引用属于未定义行为 — 此处只标红，不模拟崩溃细节。</div>'
        : state.danger === 'dangling'
          ? '<div class="ptr-explorer__banner is-danger" role="alert">教学警示：悬空指针 — 地址可能「还在」，对象已无。</div>'
          : state.danger === 'expired'
            ? '<div class="ptr-explorer__banner is-warn" role="alert">weak_ptr 已过期：lock() 得到空指针。</div>'
            : state.danger === 'cycle' || cycle
              ? `<div class="ptr-explorer__banner is-danger" role="alert">${escapeHtml(cycle?.msg || '环引用：shared↔shared 计数无法归零')}</div>`
              : '';

    const rawSlots = state.slots.filter((s) => s.kind === 'value' || s.kind === 'raw' || s.kind === 'raw2');
    const smartSlots = state.slots.filter(
      (s) => s.kind === 'unique' || s.kind === 'shared' || s.kind === 'weak',
    );
    const valueSlots = rawSlots.filter((s) => s.kind === 'value');
    const ptrSlots = rawSlots.filter((s) => s.kind === 'raw' || s.kind === 'raw2');

    const isRaw = state.panel === 'raw';

    shell.innerHTML = `
      <header class="ptr-explorer__hero">
        <div>
          <p class="ptr-explorer__eyebrow">POINTERS · OWNERSHIP</p>
          <h2 class="ptr-explorer__title">指针操作 · 槽位与箭头</h2>
          <p class="ptr-explorer__subtitle">可视变量槽 + 箭头演示取值、取址、解引用、算术与智能指针引用计数。简化槽模型；完整栈/堆见 <a href="#/memory">内存沙箱</a>。</p>
        </div>
        <div class="ptr-explorer__hero-actions">
          <a class="ptr-explorer__link" href="#/note/cpp/pointer-ops-explorer">笔记 →</a>
          <a class="ptr-explorer__link" href="#/note/cpp/learncpp/ch12-references-pointers">ch12 引用与指针 →</a>
          <a class="ptr-explorer__link" href="#/note/cpp/learncpp/ch22-move-smart-pointers">ch22 智能指针 →</a>
          ${compact ? '<a class="ptr-explorer__link" href="#/pointers">打开完整页 →</a>' : ''}
        </div>
      </header>

      <details class="ptr-explorer__glossary">
        <summary>小白词条：* / &amp; / 空指针 / 悬空 / use_count</summary>
        <div class="ptr-explorer__glossary-list">
          <div><dt><code>&amp;x</code> 取址</dt><dd>得到指向 <code>x</code> 的指针；箭头从指针槽指向目标槽。</dd></div>
          <div><dt><code>*p</code> 解引用</dt><dd>顺着箭头读写目标；空指针解引用危险（仅警示）。</dd></div>
          <div><dt>空指针 <code>nullptr</code></dt><dd>不指向任何对象；图上为虚线断头。</dd></div>
          <div><dt>悬空</dt><dd>对象已释放，指针仍握旧地址；图上红色虚线。</dd></div>
          <div><dt>指针算术 <code>p+1</code></dt><dd>按<strong>类型步长</strong>前进（<code>int</code> 为 4 字节），不是 +1 字节。</dd></div>
          <div><dt>多级 <code>int**</code></dt><dd><code>pp → p → x</code>，解引用两层 <code>**pp</code>。</dd></div>
          <div><dt><code>unique_ptr</code></dt><dd>独占箭头；<code>move</code> 后源空、目标接管同一堆块。</dd></div>
          <div><dt><code>shared_ptr</code> / <code>use_count</code></dt><dd>多句柄共享；拷贝 +1，reset −1，到 0 释放。</dd></div>
          <div><dt><code>weak_ptr</code></dt><dd>虚线弱引用，不增加 use_count；<code>lock()</code> 临时升强。</dd></div>
          <div><dt>环引用</dt><dd>A.shared→B 且 B.shared→A 时计数锁死；一侧改 weak 可破环。</dd></div>
        </div>
      </details>

      <div class="ptr-explorer__tabs" role="tablist">
        <button type="button" class="ptr-explorer__tab${isRaw ? ' is-active' : ''}" data-panel="raw">原始指针</button>
        <button type="button" class="ptr-explorer__tab${!isRaw ? ' is-active' : ''}" data-panel="smart">智能指针</button>
      </div>

      <div class="ptr-explorer__chips" role="toolbar" aria-label="演示剧本">
        ${DEMOS.filter((d) => (isRaw ? !d.id.startsWith('unique') && !d.id.startsWith('shared') && !d.id.startsWith('weak') && !d.id.startsWith('cycle') : d.id.startsWith('unique') || d.id.startsWith('shared') || d.id.startsWith('weak') || d.id.startsWith('cycle')))
          .map(
            (d) =>
              `<button type="button" class="ptr-explorer__chip" data-demo="${escapeHtml(d.id)}">${escapeHtml(d.label)}</button>`,
          )
          .join('')}
        <button type="button" class="ptr-explorer__chip" data-demo-stop ${demoPlaying ? '' : 'disabled'}>停止演示</button>
      </div>

      ${dangerBanner}

      <div class="ptr-explorer__grid">
        <aside class="ptr-explorer__panel ptr-explorer__panel--controls">
          <p class="ptr-explorer__panel-title">${isRaw ? '原始指针操作' : '智能指针操作'}</p>
          ${
            isRaw
              ? `
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn" data-act="bind-x">p = &amp;x</button>
              <button type="button" class="ptr-explorer__btn" data-act="bind-arr">p = &amp;arr[0]</button>
              <button type="button" class="ptr-explorer__btn" data-act="bind-pp">pp = &amp;p</button>
            </div>
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn" data-act="deref-write">*p = 42</button>
              <button type="button" class="ptr-explorer__btn" data-act="write-x">x = 99</button>
              <button type="button" class="ptr-explorer__btn" data-act="eval-star">求值 *p</button>
              <button type="button" class="ptr-explorer__btn" data-act="eval-starstar">求值 **pp</button>
            </div>
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn" data-act="null">p = nullptr</button>
              <button type="button" class="ptr-explorer__btn" data-act="arith-plus">p + 1</button>
              <button type="button" class="ptr-explorer__btn" data-act="arith-minus">p − 1</button>
              <button type="button" class="ptr-explorer__btn" data-act="reset">重置</button>
            </div>`
              : `
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn" data-act="unique-make">make_unique</button>
              <button type="button" class="ptr-explorer__btn" data-act="unique-move">move → up2</button>
            </div>
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn" data-act="shared-make">make_shared</button>
              <button type="button" class="ptr-explorer__btn" data-act="shared-copy">sp2 = sp1</button>
              <button type="button" class="ptr-explorer__btn" data-act="shared-reset-sp1">sp1.reset</button>
              <button type="button" class="ptr-explorer__btn" data-act="shared-reset-sp2">sp2.reset</button>
            </div>
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn" data-act="weak-assign">wp = sp1</button>
              <button type="button" class="ptr-explorer__btn" data-act="weak-lock">wp.lock()</button>
            </div>
            <div class="ptr-explorer__btn-row">
              <button type="button" class="ptr-explorer__btn ptr-explorer__btn--warn" data-act="cycle">建立环引用</button>
              <button type="button" class="ptr-explorer__btn" data-act="cycle-break">weak 破环</button>
              <button type="button" class="ptr-explorer__btn" data-act="reset">重置</button>
            </div>`
          }
          <p class="ptr-explorer__panel-hint">点选槽位可高亮相关箭头。演示条逐步播放场景卡。</p>
        </aside>

        <div class="ptr-explorer__center">
          <div class="ptr-explorer__board" data-board>
            <svg class="ptr-explorer__arrows" data-arrows aria-hidden="true"></svg>
            <div class="ptr-explorer__cols">
              ${
                isRaw
                  ? `
                <div class="ptr-explorer__col">${renderSlots(valueSlots, '值槽（栈）')}</div>
                <div class="ptr-explorer__col">${renderSlots(ptrSlots, '指针槽')}</div>`
                  : `
                <div class="ptr-explorer__col">${renderSlots(
                  smartSlots.filter((s) => s.role !== 'cycle'),
                  '句柄槽',
                )}</div>
                <div class="ptr-explorer__col">${renderSlots(
                  smartSlots.filter((s) => s.role === 'cycle'),
                  '环引用句柄',
                )}</div>
                <div class="ptr-explorer__col">${renderHeap()}</div>`
              }
            </div>
          </div>
          <p class="ptr-explorer__legend">
            <span class="ptr-explorer__swatch is-raw">原始</span>
            <span class="ptr-explorer__swatch is-unique">unique 独占</span>
            <span class="ptr-explorer__swatch is-shared">shared</span>
            <span class="ptr-explorer__swatch is-weak">weak 虚线</span>
            <span class="ptr-explorer__swatch is-null">空/断线</span>
          </p>
        </div>

        <aside class="ptr-explorer__panel ptr-explorer__panel--detail">
          <p class="ptr-explorer__panel-title">当前表达式</p>
          <div class="ptr-explorer__expr is-${escapeHtml(state.expr.kind)}">
            <code>${escapeHtml(state.expr.code)}</code>
            <p>${escapeHtml(state.expr.result)}</p>
          </div>
          <p class="ptr-explorer__panel-title">步骤日志</p>
          <div class="ptr-explorer__table-wrap">
            <table class="ptr-explorer__table">
              <thead><tr><th>#</th><th>操作</th><th>说明</th></tr></thead>
              <tbody>
                ${
                  log.length
                    ? [...log]
                        .reverse()
                        .map(
                          (row) =>
                            `<tr><td>${row.no}</td><td><span class="ptr-explorer__op">${escapeHtml(row.op)}</span></td><td>${escapeHtml(row.detail)}</td></tr>`,
                        )
                        .join('')
                    : '<tr><td colspan="3">尚无操作</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </aside>
      </div>

      <p class="ptr-explorer__credit">教学示意：槽位模型，非真实 ABI/分配器。完整虚存见 <a href="#/memory">#/memory</a>；笔记 <a href="#/note/cpp/pointer-ops-explorer">指针操作交互页</a>。</p>
    `;

    bind();
    requestAnimationFrame(() => {
      drawArrows();
      requestAnimationFrame(drawArrows);
    });
  }

  function bind() {
    shell.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const panel = btn.getAttribute('data-panel');
        if (panel === 'smart' || panel === 'raw') {
          resetPanel(panel);
          render();
        }
      });
    });

    shell.querySelectorAll('[data-demo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        playDemo(btn.getAttribute('data-demo') || '');
      });
    });
    shell.querySelector('[data-demo-stop]')?.addEventListener('click', () => {
      stopDemo();
      render();
    });

    shell.querySelectorAll('[data-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-slot');
        state.selected = state.selected === id ? null : id;
        render();
      });
    });
    shell.querySelectorAll('[data-heap]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-heap');
        state.selected = state.selected === id ? null : id;
        render();
      });
    });

    const act = (name, fn) => {
      shell.querySelector(`[data-act="${name}"]`)?.addEventListener('click', () => {
        fn();
        render();
      });
    };

    act('bind-x', () => bindP('x'));
    act('bind-arr', () => bindP('arr0'));
    act('bind-pp', () => bindPp());
    act('deref-write', () => derefWrite(42));
    act('write-x', () => writeX(99));
    act('eval-star', () => evalStarP());
    act('eval-starstar', () => evalStarStarPp());
    act('null', () => nullP());
    act('arith-plus', () => arith(1));
    act('arith-minus', () => arith(-1));
    act('reset', () => resetPanel(state.panel));
    act('unique-make', () => uniqueMake());
    act('unique-move', () => uniqueMove());
    act('shared-make', () => sharedMake());
    act('shared-copy', () => sharedCopy());
    act('shared-reset-sp1', () => sharedReset('sp1'));
    act('shared-reset-sp2', () => sharedReset('sp2'));
    act('weak-assign', () => weakAssign());
    act('weak-lock', () => weakLock());
    act('cycle', () => cycleShared());
    act('cycle-break', () => cycleBreakWeak());
  }

  pushLog('INIT', '指针槽位沙箱就绪 — 原始指针 / 智能指针分栏');
  render();

  const onResize = () => drawArrows();
  window.addEventListener('resize', onResize);

  container.appendChild(shell);

  return {
    dispose() {
      disposed = true;
      stopDemo();
      window.removeEventListener('resize', onResize);
      shell.remove();
    },
  };
}
