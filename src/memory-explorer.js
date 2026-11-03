/**
 * Memory Explorer — stack/heap, RAII, smart pointers, vector growth.
 * Chinese UI with memory-strip visualization + process/sequence/event panels.
 */

import {
  MEM_SCENARIOS,
  MEM_CATEGORY_LABELS,
  MEM_STAGES,
} from './memory-explorer-data.js';

const STORAGE_KEY = 'anonymous-fys-memory-progress-v1';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, unknown>} progress */
function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

/** @param {{ steps: any[] }} scenario @param {number} stepIndex */
function eventsUpTo(scenario, stepIndex) {
  /** @type {any[]} */
  const out = [];
  for (let i = 0; i <= stepIndex; i += 1) {
    const step = scenario.steps[i];
    if (step?.events?.length) out.push(...step.events);
  }
  return out;
}

/** @param {any} scenario @param {string} name */
function nodeIndexByLabelish(scenario, name) {
  const exact = scenario.nodes.findIndex(
    (n) => n.label === name || n.id === name || n.role === name,
  );
  if (exact >= 0) return exact;
  const soft = scenario.nodes.findIndex(
    (n) => name.includes(n.label) || n.label.includes(name) || name.includes(n.id),
  );
  return soft >= 0 ? soft : 0;
}

/** @param {import('./memory-explorer-data.js').MEM_SCENARIOS[number]['steps'][0]['memory']} blocks */
function renderMemoryStrip(blocks) {
  if (!blocks?.length) {
    return `<div class="mem-ex__strip mem-ex__strip--empty">本步暂无内存条示意</div>`;
  }
  // Display high address at top (stack-first teaching layout)
  const rows = blocks
    .map(
      (b) => `
      <div class="mem-ex__block is-${escapeHtml(b.region)}" data-block="${escapeHtml(b.id)}">
        <span class="mem-ex__block-label">${escapeHtml(b.label)}</span>
        ${b.detail ? `<span class="mem-ex__block-detail">${escapeHtml(b.detail)}</span>` : ''}
      </div>`,
    )
    .join('');
  return `
    <section class="mem-ex__strip-wrap" aria-label="内存条示意">
      <div class="mem-ex__strip-head">
        <h4 class="mem-ex__model-heading">内存条</h4>
        <p class="mem-ex__model-hint">上≈高地址 · 下≈低地址（教学）</p>
      </div>
      <div class="mem-ex__strip" role="img">${rows}</div>
    </section>`;
}

/** @param {any} scenario @param {number} stepIndex */
function renderProcessModel(scenario, stepIndex) {
  const parts = scenario.steps
    .map((s, i) => {
      const state = i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : '';
      const arrow =
        i < scenario.steps.length - 1
          ? `<span class="mem-ex__model-arrow${i < stepIndex ? ' is-lit' : ''}" aria-hidden="true">
              <svg viewBox="0 0 40 16" width="40" height="16"><path d="M2 8h28M24 3l10 5-10 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>`
          : '';
      return `
        <div class="mem-ex__model-item ${state}">
          <button type="button" class="mem-ex__model-node" data-goto-step="${i}">
            <span class="mem-ex__model-idx">${i + 1}</span>
            <span class="mem-ex__model-title">${escapeHtml(s.title)}</span>
            <span class="mem-ex__model-sum">${escapeHtml(s.summary)}</span>
          </button>
          ${arrow}
        </div>`;
    })
    .join('');
  return `
    <section class="mem-ex__model" aria-label="流程模型">
      <div class="mem-ex__model-head">
        <h4 class="mem-ex__model-heading">流程模型</h4>
        <p class="mem-ex__model-hint">点击跳转 · 高亮当前</p>
      </div>
      <div class="mem-ex__model-track">${parts}</div>
    </section>`;
}

/** @param {any} scenario @param {number} stepIndex @param {boolean} animate */
function renderSequenceDiagram(scenario, stepIndex, animate) {
  const n = scenario.nodes.length;
  const colW = 128;
  const leftPad = 36;
  const topPad = 52;
  const rowH = 34;
  const width = Math.max(300, leftPad * 2 + colW * Math.max(n - 1, 1) + 40);

  /** @type {{from:number,to:number,label:string,phase:string,step:number}[]} */
  const msgs = [];
  for (let si = 0; si <= stepIndex; si += 1) {
    const step = scenario.steps[si];
    const events = step.events || [];
    if (!events.length) {
      const hi = step.highlight || [];
      if (hi.length) {
        const idx = scenario.nodes.findIndex((node) => node.id === hi[0]);
        if (idx >= 0) {
          msgs.push({ from: idx, to: idx, label: step.title, phase: '本地', step: si });
        }
      }
      continue;
    }
    for (const e of events) {
      msgs.push({
        from: nodeIndexByLabelish(scenario, e.from),
        to: nodeIndexByLabelish(scenario, e.to),
        label: e.info.length > 34 ? `${e.info.slice(0, 32)}…` : e.info,
        phase: e.phase,
        step: si,
      });
    }
  }

  const height = topPad + 28 + Math.max(msgs.length, 1) * rowH + 24;
  const xs = scenario.nodes.map((_, i) => leftPad + i * colW);

  const actors = scenario.nodes
    .map((node, i) => {
      const x = xs[i];
      const active = (scenario.steps[stepIndex].highlight || []).includes(node.id);
      return `
        <g class="mem-seq__actor${active ? ' is-active' : ''}">
          <rect x="${x - 48}" y="8" width="96" height="36" rx="8" class="mem-seq__actor-box"/>
          <text x="${x}" y="24" text-anchor="middle" class="mem-seq__actor-label">${escapeHtml(node.label)}</text>
          <text x="${x}" y="38" text-anchor="middle" class="mem-seq__actor-ip">${escapeHtml(node.role)}</text>
          <line x1="${x}" y1="${topPad}" x2="${x}" y2="${height - 12}" class="mem-seq__life"/>
        </g>`;
    })
    .join('');

  const arrows = msgs
    .map((m, i) => {
      const y = topPad + 18 + i * rowH;
      const x1 = xs[m.from];
      const x2 = xs[m.to];
      const live = m.step === stepIndex;
      if (m.from === m.to) {
        return `
          <g class="mem-seq__msg${live ? ' is-live' : ''} is-self">
            <path d="M${x1 + 8} ${y - 8} h22 v16 h-22" fill="none" class="mem-seq__line"/>
            <text x="${x1 + 34}" y="${y + 4}" class="mem-seq__msg-label">${escapeHtml(m.phase)} · ${escapeHtml(m.label)}</text>
          </g>`;
      }
      const dir = x2 >= x1 ? 1 : -1;
      const tip = x2 - dir * 8;
      return `
        <g class="mem-seq__msg${live ? ' is-live' : ''}${animate && live ? ' is-anim' : ''}">
          <line x1="${x1}" y1="${y}" x2="${tip}" y2="${y}" class="mem-seq__line"/>
          <path d="M${tip} ${y} l${-dir * 7} -4 v8 z" class="mem-seq__head"/>
          <text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle" class="mem-seq__msg-label">${escapeHtml(m.phase)} · ${escapeHtml(m.label)}</text>
        </g>`;
    })
    .join('');

  return `
    <section class="mem-ex__seq-wrap" aria-label="时序图">
      <div class="mem-ex__model-head">
        <h4 class="mem-ex__model-heading">时序图 · 模型流程</h4>
        <p class="mem-ex__model-hint">随步骤累计 · 当前步高亮</p>
      </div>
      <div class="mem-ex__seq-scroll">
        <svg class="mem-ex__seq" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
          ${actors}${arrows}
        </svg>
      </div>
    </section>`;
}

/**
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 */
export function mountMemoryExplorer(container, options = {}) {
  const compact = Boolean(options.compact);
  let category = 'all';
  let scenarioId = MEM_SCENARIOS[0].id;
  let stepIndex = 0;
  /** @type {Record<string, { status: string, maxStep: number }>} */
  let progress = loadProgress();
  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;
  let playing = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let animTimer = null;

  const shell = document.createElement('section');
  shell.className = `mem-ex${compact ? ' mem-ex--compact' : ''}`;
  shell.setAttribute('aria-label', '内存管理交互演示');

  function currentScenario() {
    return MEM_SCENARIOS.find((s) => s.id === scenarioId) || MEM_SCENARIOS[0];
  }

  function filtered() {
    if (category === 'all') return MEM_SCENARIOS;
    return MEM_SCENARIOS.filter((s) => s.category === category);
  }

  function stopPlay() {
    playing = false;
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function bumpProgress(sc, step) {
    const prev = progress[sc.id] || { status: 'idle', maxStep: -1 };
    const maxStep = Math.max(prev.maxStep, step);
    progress = {
      ...progress,
      [sc.id]: {
        status: maxStep >= sc.steps.length - 1 ? 'complete' : 'in_progress',
        maxStep,
      },
    };
    saveProgress(progress);
  }

  function stats() {
    const complete = MEM_SCENARIOS.filter((s) => progress[s.id]?.status === 'complete').length;
    const inProgress = MEM_SCENARIOS.filter((s) => progress[s.id]?.status === 'in_progress').length;
    const pct = Math.round((complete / MEM_SCENARIOS.length) * 100);
    return { complete, inProgress, pct, total: MEM_SCENARIOS.length };
  }

  function flashAnim(kind) {
    if (animTimer) clearTimeout(animTimer);
    const lane = shell.querySelector('[data-flow-lane]');
    if (!lane || !kind) return;
    lane.setAttribute('data-anim', kind);
    animTimer = setTimeout(() => lane.removeAttribute('data-anim'), 900);
  }

  function startPlay() {
    stopPlay();
    playing = true;
    const playBtn = shell.querySelector('[data-play]');
    if (playBtn) playBtn.textContent = '暂停';
    timer = setInterval(() => {
      const sc = currentScenario();
      if (stepIndex >= sc.steps.length - 1) {
        stopPlay();
        const btn = shell.querySelector('[data-play]');
        if (btn) btn.textContent = '自动播放';
        return;
      }
      stepIndex += 1;
      bumpProgress(sc, stepIndex);
      render({ animate: true });
    }, 1700);
  }

  function selectScenario(id) {
    if (!MEM_SCENARIOS.some((s) => s.id === id)) return;
    stopPlay();
    scenarioId = id;
    stepIndex = 0;
    bumpProgress(currentScenario(), 0);
    render({ animate: true });
  }

  function goStep(delta) {
    stopPlay();
    const sc = currentScenario();
    const next = Math.max(0, Math.min(sc.steps.length - 1, stepIndex + delta));
    if (next === stepIndex) return;
    stepIndex = next;
    bumpProgress(sc, stepIndex);
    render({ animate: true });
  }

  function renderEventTable(events) {
    if (!events.length) {
      return `<tbody><tr class="mem-ex__empty-row"><td colspan="6">尚无事件。</td></tr></tbody>`;
    }
    return `<tbody>${events
      .map(
        (e, i) => `
      <tr class="mem-ex__evt${i === events.length - 1 ? ' is-latest' : ''}">
        <td>${escapeHtml(String(e.no))}</td>
        <td>${escapeHtml(e.time)}</td>
        <td>${escapeHtml(e.from)}</td>
        <td>${escapeHtml(e.to)}</td>
        <td><span class="mem-ex__phase-tag">${escapeHtml(e.phase)}</span></td>
        <td>${escapeHtml(e.info)}</td>
      </tr>`,
      )
      .join('')}</tbody>`;
  }

  /** @param {{ animate?: boolean }} [opts] */
  function render(opts = {}) {
    const sc = currentScenario();
    const step = sc.steps[stepIndex];
    const highlight = new Set(step.highlight || []);
    const events = eventsUpTo(sc, stepIndex);
    const st = stats();
    const list = filtered();

    /** @type {Record<string, number>} */
    const catCounts = { all: MEM_SCENARIOS.length };
    for (const s of MEM_SCENARIOS) catCounts[s.category] = (catCounts[s.category] || 0) + 1;

    const catFilters = Object.keys(MEM_CATEGORY_LABELS)
      .map(
        (c) => `
      <button type="button" class="mem-ex__filter${category === c ? ' is-active' : ''}" data-cat="${c}">
        ${MEM_CATEGORY_LABELS[c]} <em>${c === 'all' ? MEM_SCENARIOS.length : catCounts[c] || 0}</em>
      </button>`,
      )
      .join('');

    const stages = MEM_STAGES.map((row) => {
      const active = row.n === sc.stage;
      return `<div class="mem-ex__stage-row${active ? ' is-active' : ''}">
        <span class="mem-ex__stage-num">${row.n}</span><span>${escapeHtml(row.name)}</span>
      </div>`;
    }).join('');

    const cards = list
      .map((s) => {
        const pst = progress[s.id]?.status || 'idle';
        return `
        <button type="button" class="mem-ex__card${s.id === sc.id ? ' is-active' : ''} is-${pst}" data-scenario="${escapeHtml(s.id)}">
          <span class="mem-ex__card-name">${escapeHtml(s.name)}</span>
          <span class="mem-ex__card-full">${escapeHtml(s.fullName)}</span>
          <span class="mem-ex__card-status">${pst === 'complete' ? '已完成' : pst === 'in_progress' ? '进行中' : '未开始'}</span>
        </button>`;
      })
      .join('');

    const nodes = sc.nodes
      .map(
        (n) => `
      <div class="mem-ex__node${highlight.has(n.id) ? ' is-active' : ''}">
        <span class="mem-ex__node-label">${escapeHtml(n.label)}</span>
        <code class="mem-ex__node-role">${escapeHtml(n.role)}</code>
      </div>`,
      )
      .join('<span class="mem-ex__wire" aria-hidden="true"></span>');

    const facts = `
      <dl class="mem-ex__facts">
        ${(sc.facts || [])
          .map((f) => `<div><dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value)}</dd></div>`)
          .join('')}
        <div><dt>阶段</dt><dd>${escapeHtml(sc.stageLabel)}</dd></div>
      </dl>`;

    const stepList = sc.steps
      .map(
        (s, i) => `
      <li class="mem-ex__step-item${i === stepIndex ? ' is-current' : ''}${i < stepIndex ? ' is-done' : ''}">
        <button type="button" data-goto-step="${i}">
          <span class="mem-ex__step-num">${i + 1}</span>
          <span class="mem-ex__step-text">
            <strong>${escapeHtml(s.title)}</strong>
            <em>${escapeHtml(s.summary)}</em>
          </span>
        </button>
      </li>`,
      )
      .join('');

    shell.innerHTML = `
      <header class="mem-ex__hero">
        <div>
          <p class="mem-ex__eyebrow">MEMORY EXPLORER</p>
          <h2 class="mem-ex__title">内存管理探索</h2>
          <p class="mem-ex__subtitle">栈 / 堆 · RAII · 智能指针 · vector 扩容 · 中文步进示意</p>
        </div>
        <div class="mem-ex__progress">
          <div class="mem-ex__progress-head"><span>学习进度</span><strong>${st.pct}%</strong></div>
          <div class="mem-ex__progress-bar" role="progressbar" aria-valuenow="${st.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${st.pct}%"></i></div>
          <p class="mem-ex__progress-meta">${st.complete} / ${st.total} 已完成 · ${st.inProgress} 进行中</p>
          <button type="button" class="mem-ex__linkish" data-reset-progress>重置进度</button>
        </div>
      </header>

      <div class="mem-ex__layout">
        <aside class="mem-ex__sidebar">
          <h3 class="mem-ex__side-title">阶段条</h3>
          <div class="mem-ex__stages">${stages}</div>
          <p class="mem-ex__side-hint">高亮为当前场景阶段。</p>
        </aside>

        <div class="mem-ex__main">
          <div class="mem-ex__filters">${catFilters}</div>
          <h3 class="mem-ex__section-title">场景 <span>${list.length}</span></h3>
          <div class="mem-ex__cards">${cards}</div>

          <article class="mem-ex__detail" aria-live="polite">
            <div class="mem-ex__detail-head">
              <div>
                <p class="mem-ex__active-badge">当前</p>
                <h3 class="mem-ex__scene-name">${escapeHtml(sc.name)}</h3>
                <p class="mem-ex__full-name">${escapeHtml(sc.fullName)}</p>
              </div>
              ${facts}
            </div>
            <p class="mem-ex__blurb">${escapeHtml(sc.blurb)}</p>

            ${renderProcessModel(sc, stepIndex)}

            <div class="mem-ex__stage-grid">
              <div>
                <div class="mem-ex__topology">${nodes}</div>
                <div class="mem-ex__flow-lane" data-flow-lane>
                  <span class="mem-ex__flow-legend">${escapeHtml(sc.flowLegend)}</span>
                  <span class="mem-ex__packet-dot" aria-hidden="true"></span>
                </div>
                ${renderSequenceDiagram(sc, stepIndex, Boolean(opts.animate))}
              </div>
              ${renderMemoryStrip(step.memory)}
            </div>

            <div class="mem-ex__step-panel">
              <p class="mem-ex__step-kicker">步骤 ${stepIndex + 1} / ${sc.steps.length}</p>
              <h4 class="mem-ex__step-title">${escapeHtml(step.title)}</h4>
              <p class="mem-ex__step-summary">${escapeHtml(step.summary)}</p>
              <p class="mem-ex__step-body">${escapeHtml(step.body)}</p>
            </div>

            <div class="mem-ex__controls">
              <button type="button" class="mem-ex__btn" data-reset-step>重置步骤</button>
              <button type="button" class="mem-ex__btn" data-prev ${stepIndex === 0 ? 'disabled' : ''}>上一步</button>
              <button type="button" class="mem-ex__btn mem-ex__btn--accent" data-play>${playing ? '暂停' : '自动播放'}</button>
              <button type="button" class="mem-ex__btn" data-next ${stepIndex >= sc.steps.length - 1 ? 'disabled' : ''}>下一步</button>
            </div>

            <ol class="mem-ex__step-list">${stepList}</ol>

            <section class="mem-ex__events" aria-label="内存事件">
              <div class="mem-ex__events-head">
                <h4 class="mem-ex__events-title">内存事件</h4>
                <span class="mem-ex__events-legend">${escapeHtml(sc.flowLegend)}</span>
              </div>
              <div class="mem-ex__table-wrap">
                <table class="mem-ex__table">
                  <thead>
                    <tr><th>No.</th><th>时间</th><th>从</th><th>到</th><th>阶段</th><th>信息</th></tr>
                  </thead>
                  ${renderEventTable(events)}
                </table>
              </div>
            </section>
          </article>
        </div>
      </div>

      <p class="mem-ex__credit">教学示意：布局与所有权动机；非分配器源码级模拟。安全相关不含利用步骤。可与 Linux 内存分段笔记、RAII 笔记对照。</p>
    `;

    if (opts.animate) flashAnim(step.anim);

    shell.querySelectorAll('[data-cat]').forEach((el) => {
      el.addEventListener('click', () => {
        category = el.getAttribute('data-cat') || 'all';
        if (!filtered().some((s) => s.id === scenarioId)) {
          const first = filtered()[0];
          if (first) {
            scenarioId = first.id;
            stepIndex = 0;
            bumpProgress(first, 0);
          }
        }
        stopPlay();
        render();
      });
    });
    shell.querySelectorAll('[data-scenario]').forEach((el) => {
      el.addEventListener('click', () => selectScenario(el.getAttribute('data-scenario') || ''));
    });
    shell.querySelector('[data-prev]')?.addEventListener('click', () => goStep(-1));
    shell.querySelector('[data-next]')?.addEventListener('click', () => goStep(1));
    shell.querySelector('[data-reset-step]')?.addEventListener('click', () => {
      stopPlay();
      stepIndex = 0;
      render({ animate: true });
    });
    shell.querySelector('[data-reset-progress]')?.addEventListener('click', () => {
      stopPlay();
      progress = {};
      saveProgress(progress);
      stepIndex = 0;
      render();
    });
    shell.querySelector('[data-play]')?.addEventListener('click', () => {
      if (playing) {
        stopPlay();
        const btn = shell.querySelector('[data-play]');
        if (btn) btn.textContent = '自动播放';
        return;
      }
      const scNow = currentScenario();
      if (stepIndex >= scNow.steps.length - 1) {
        stepIndex = 0;
        bumpProgress(scNow, 0);
        render({ animate: true });
      }
      startPlay();
      const btn = shell.querySelector('[data-play]');
      if (btn) btn.textContent = '暂停';
    });
    shell.querySelectorAll('[data-goto-step]').forEach((el) => {
      el.addEventListener('click', () => {
        stopPlay();
        stepIndex = Number(el.getAttribute('data-goto-step') || 0);
        bumpProgress(currentScenario(), stepIndex);
        render({ animate: true });
      });
    });

    const seqScroll = shell.querySelector('.mem-ex__seq-scroll');
    if (seqScroll && opts.animate) seqScroll.scrollTop = seqScroll.scrollHeight;
  }

  bumpProgress(currentScenario(), 0);
  container.replaceChildren(shell);
  render({ animate: true });

  return {
    dispose() {
      stopPlay();
      if (animTimer) clearTimeout(animTimer);
      shell.remove();
    },
  };
}
