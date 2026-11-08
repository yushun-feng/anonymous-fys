/**
 * Linux Systems Explorer — interactive demos for boot, FHS, and permissions.
 * Chinese UI; process model + sequence diagram + event table (Protocol Explorer–style).
 */

import { BOOT_SCENARIOS, BOOT_CATEGORY_LABELS, BOOT_STAGES } from './linux-boot-data.js';
import { FS_SCENARIOS, FS_CATEGORY_LABELS, FS_STAGES } from './linux-fs-data.js';
import { PERM_SCENARIOS, PERM_CATEGORY_LABELS, PERM_STAGES } from './linux-perm-data.js';

const STORAGE_KEY = 'anonymous-fys-linux-sys-progress-v1';

/** @typedef {'boot'|'fs'|'perm'} DomainId */

const DOMAINS = [
  { id: /** @type {DomainId} */ ('boot'), label: '系统启动', hint: 'UEFI → systemd' },
  { id: /** @type {DomainId} */ ('fs'), label: '目录结构', hint: 'FHS / 虚拟 fs' },
  { id: /** @type {DomainId} */ ('perm'), label: '权限设置', hint: 'rwx / 特殊位 / ACL' },
];

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

/** @param {DomainId} domain */
function catalog(domain) {
  if (domain === 'fs') {
    return {
      scenarios: FS_SCENARIOS,
      catLabels: FS_CATEGORY_LABELS,
      stages: FS_STAGES,
      title: '目录结构探索',
      subtitle: 'FHS 地图 · 虚拟文件系统 · 配置与家目录',
      eventTitle: '路径事件',
    };
  }
  if (domain === 'perm') {
    return {
      scenarios: PERM_SCENARIOS,
      catLabels: PERM_CATEGORY_LABELS,
      stages: PERM_STAGES,
      title: '权限设置探索',
      subtitle: 'rwx · chmod · 特殊位 · 判定链 · ACL 速览',
      eventTitle: '权限事件',
    };
  }
  return {
    scenarios: BOOT_SCENARIOS,
    catLabels: BOOT_CATEGORY_LABELS,
    stages: BOOT_STAGES,
    title: '系统启动探索',
    subtitle: 'UEFI/BIOS · GRUB · 内核 · initramfs · systemd · 登录',
    eventTitle: '启动事件',
  };
}

/**
 * @param {{ nodes: { id: string, label: string, role: string }[], steps: any[] }} scenario
 * @param {number} stepIndex
 */
function eventsUpTo(scenario, stepIndex) {
  /** @type {any[]} */
  const out = [];
  for (let i = 0; i <= stepIndex; i += 1) {
    const step = scenario.steps[i];
    if (step?.events?.length) out.push(...step.events);
  }
  return out;
}

/**
 * @param {{ nodes: { id: string }[] }} scenario
 * @param {string} name
 */
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

/**
 * @param {any} scenario
 * @param {number} stepIndex
 */
function renderProcessModel(scenario, stepIndex) {
  const parts = scenario.steps
    .map((s, i) => {
      const state = i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : '';
      const arrow =
        i < scenario.steps.length - 1
          ? `<span class="linux-sys__model-arrow${i < stepIndex ? ' is-lit' : ''}" aria-hidden="true">
              <svg viewBox="0 0 40 16" width="40" height="16"><path d="M2 8h28M24 3l10 5-10 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>`
          : '';
      return `
        <div class="linux-sys__model-item ${state}">
          <button type="button" class="linux-sys__model-node" data-goto-step="${i}">
            <span class="linux-sys__model-idx">${i + 1}</span>
            <span class="linux-sys__model-title">${escapeHtml(s.title)}</span>
            <span class="linux-sys__model-sum">${escapeHtml(s.summary)}</span>
          </button>
          ${arrow}
        </div>`;
    })
    .join('');
  return `
    <section class="linux-sys__model" aria-label="流程模型">
      <div class="linux-sys__model-head">
        <h4 class="linux-sys__model-heading">流程模型</h4>
        <p class="linux-sys__model-hint">点击节点跳转 · 高亮为当前</p>
      </div>
      <div class="linux-sys__model-track">${parts}</div>
    </section>`;
}

/**
 * @param {any} scenario
 * @param {number} stepIndex
 * @param {boolean} animate
 */
function renderSequenceDiagram(scenario, stepIndex, animate) {
  const n = scenario.nodes.length;
  const colW = 132;
  const leftPad = 40;
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
          msgs.push({
            from: idx,
            to: idx,
            label: step.title,
            phase: '本地',
            step: si,
          });
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
        <g class="ls-seq__actor${active ? ' is-active' : ''}">
          <rect x="${x - 50}" y="8" width="100" height="36" rx="8" class="ls-seq__actor-box"/>
          <text x="${x}" y="24" text-anchor="middle" class="ls-seq__actor-label">${escapeHtml(node.label)}</text>
          <text x="${x}" y="38" text-anchor="middle" class="ls-seq__actor-ip">${escapeHtml(node.role)}</text>
          <line x1="${x}" y1="${topPad}" x2="${x}" y2="${height - 12}" class="ls-seq__life"/>
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
          <g class="ls-seq__msg${live ? ' is-live' : ''} is-self">
            <path d="M${x1 + 8} ${y - 8} h22 v16 h-22" fill="none" class="ls-seq__line"/>
            <text x="${x1 + 34}" y="${y + 4}" class="ls-seq__msg-label">${escapeHtml(m.phase)} · ${escapeHtml(m.label)}</text>
          </g>`;
      }
      const dir = x2 >= x1 ? 1 : -1;
      const tip = x2 - dir * 8;
      return `
        <g class="ls-seq__msg${live ? ' is-live' : ''}${animate && live ? ' is-anim' : ''}">
          <line x1="${x1}" y1="${y}" x2="${tip}" y2="${y}" class="ls-seq__line"/>
          <path d="M${tip} ${y} l${-dir * 7} -4 v8 z" class="ls-seq__head"/>
          <text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle" class="ls-seq__msg-label">${escapeHtml(m.phase)} · ${escapeHtml(m.label)}</text>
        </g>`;
    })
    .join('');

  const empty =
    msgs.length === 0
      ? `<text x="${width / 2}" y="${topPad + 40}" text-anchor="middle" class="ls-seq__empty">本步尚无跨节点事件</text>`
      : '';

  return `
    <section class="linux-sys__seq-wrap" aria-label="时序图">
      <div class="linux-sys__model-head">
        <h4 class="linux-sys__model-heading">时序图 · 模型流程</h4>
        <p class="linux-sys__model-hint">随步骤累计箭头 · 当前步高亮</p>
      </div>
      <div class="linux-sys__seq-scroll">
        <svg class="linux-sys__seq" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
          ${actors}${arrows}${empty}
        </svg>
      </div>
    </section>`;
}

/** @param {any} scenario @param {any} step */
function renderSidePanel(scenario, step) {
  if (scenario.tree) {
    const focus = new Set(step.treeFocus || []);
    const rows = scenario.tree
      .map((t) => {
        const on = focus.has(t.path) || (focus.size === 0 && t.highlight);
        return `<li class="linux-sys__tree-item${on ? ' is-focus' : ''}"><code>${escapeHtml(t.path)}</code><span>${escapeHtml(t.note)}</span></li>`;
      })
      .join('');
    return `
      <section class="linux-sys__side-card" aria-label="目录树示意">
        <h4 class="linux-sys__model-heading">目录树示意</h4>
        <ul class="linux-sys__tree">${rows}</ul>
      </section>`;
  }
  if (scenario.modeDemo) {
    const focus =
      typeof step.modeFocus === 'number' ? step.modeFocus : 0;
    const rows = scenario.modeDemo
      .map((m, i) => {
        const on = i === focus;
        return `<li class="linux-sys__mode-item${on ? ' is-focus' : ''}">
          <code class="linux-sys__mode-path">${escapeHtml(m.path)}</code>
          <code class="linux-sys__mode-ls">${escapeHtml(m.ls)}</code>
          <span class="linux-sys__mode-oct">${escapeHtml(m.octal)}</span>
          <span class="linux-sys__mode-exp">${escapeHtml(m.explain)}</span>
        </li>`;
      })
      .join('');
    return `
      <section class="linux-sys__side-card" aria-label="权限示意">
        <h4 class="linux-sys__model-heading">模式示意</h4>
        <ul class="linux-sys__modes">${rows}</ul>
      </section>`;
  }
  return '';
}

/**
 * @param {HTMLElement} container
 * @param {{ compact?: boolean, domain?: DomainId }} [options]
 */
export function mountLinuxSysExplorer(container, options = {}) {
  const compact = Boolean(options.compact);
  /** @type {DomainId} */
  let domain = options.domain || 'boot';
  let category = 'all';
  let scenarioId = catalog(domain).scenarios[0].id;
  let stepIndex = 0;
  /** @type {Record<string, { status: string, maxStep: number }>} */
  let progress = loadProgress();
  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;
  let playing = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let animTimer = null;

  const shell = document.createElement('section');
  shell.className = `linux-sys${compact ? ' linux-sys--compact' : ''}`;
  shell.setAttribute('aria-label', 'Linux 系统交互演示');

  function currentScenario() {
    const { scenarios } = catalog(domain);
    return scenarios.find((s) => s.id === scenarioId) || scenarios[0];
  }

  function filtered() {
    const { scenarios } = catalog(domain);
    if (category === 'all') return scenarios;
    return scenarios.filter((s) => s.category === category);
  }

  function progressKey(id) {
    return `${domain}:${id}`;
  }

  function stopPlay() {
    playing = false;
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function bumpProgress(sc, step) {
    const key = progressKey(sc.id);
    const prev = progress[key] || { status: 'idle', maxStep: -1 };
    const maxStep = Math.max(prev.maxStep, step);
    const complete = maxStep >= sc.steps.length - 1;
    progress = {
      ...progress,
      [key]: { status: complete ? 'complete' : 'in_progress', maxStep },
    };
    saveProgress(progress);
  }

  function domainStats() {
    const { scenarios } = catalog(domain);
    const complete = scenarios.filter((s) => progress[progressKey(s.id)]?.status === 'complete').length;
    const inProgress = scenarios.filter((s) => progress[progressKey(s.id)]?.status === 'in_progress').length;
    const pct = Math.round((complete / scenarios.length) * 100);
    return { complete, inProgress, pct, total: scenarios.length };
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
    const { scenarios } = catalog(domain);
    if (!scenarios.some((s) => s.id === id)) return;
    stopPlay();
    scenarioId = id;
    stepIndex = 0;
    bumpProgress(currentScenario(), 0);
    render({ animate: true });
  }

  function switchDomain(next) {
    stopPlay();
    domain = next;
    category = 'all';
    scenarioId = catalog(domain).scenarios[0].id;
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
      return `<tbody><tr class="linux-sys__empty-row"><td colspan="6">尚无事件。</td></tr></tbody>`;
    }
    return `<tbody>${events
      .map(
        (e, i) => `
      <tr class="linux-sys__evt${i === events.length - 1 ? ' is-latest' : ''}">
        <td>${escapeHtml(String(e.no))}</td>
        <td>${escapeHtml(e.time)}</td>
        <td>${escapeHtml(e.from)}</td>
        <td>${escapeHtml(e.to)}</td>
        <td><span class="linux-sys__phase-tag">${escapeHtml(e.phase)}</span></td>
        <td>${escapeHtml(e.info)}</td>
      </tr>`,
      )
      .join('')}</tbody>`;
  }

  /** @param {{ animate?: boolean }} [opts] */
  function render(opts = {}) {
    const meta = catalog(domain);
    const sc = currentScenario();
    const step = sc.steps[stepIndex];
    const highlight = new Set(step.highlight || []);
    const events = eventsUpTo(sc, stepIndex);
    const stats = domainStats();
    const list = filtered();

    const domainTabs = DOMAINS.map(
      (d) => `
      <button type="button" class="linux-sys__domain${domain === d.id ? ' is-active' : ''}" data-domain="${d.id}">
        <strong>${d.label}</strong>
        <em>${d.hint}</em>
      </button>`,
    ).join('');

    /** @type {Record<string, number>} */
    const catCounts = { all: meta.scenarios.length };
    for (const s of meta.scenarios) {
      catCounts[s.category] = (catCounts[s.category] || 0) + 1;
    }
    const catFilters = Object.keys(meta.catLabels)
      .map((c) => {
        const count = catCounts[c] ?? meta.scenarios.filter((s) => s.category === c).length;
        return `<button type="button" class="linux-sys__filter${category === c ? ' is-active' : ''}" data-cat="${c}">
          ${meta.catLabels[c]} <em>${c === 'all' ? meta.scenarios.length : count}</em>
        </button>`;
      })
      .join('');

    const stages = meta.stages
      .map((st) => {
        const active = st.n === sc.stage;
        return `<div class="linux-sys__stage-row${active ? ' is-active' : ''}">
          <span class="linux-sys__stage-num">${st.n}</span>
          <span>${escapeHtml(st.name)}</span>
        </div>`;
      })
      .join('');

    const cards = list
      .map((s) => {
        const st = progress[progressKey(s.id)]?.status || 'idle';
        return `
        <button type="button" class="linux-sys__card${s.id === sc.id ? ' is-active' : ''} is-${st}" data-scenario="${escapeHtml(s.id)}">
          <span class="linux-sys__card-name">${escapeHtml(s.name)}</span>
          <span class="linux-sys__card-full">${escapeHtml(s.fullName)}</span>
          <span class="linux-sys__card-status">${st === 'complete' ? '已完成' : st === 'in_progress' ? '进行中' : '未开始'}</span>
        </button>`;
      })
      .join('');

    const nodes = sc.nodes
      .map(
        (n) => `
      <div class="linux-sys__node${highlight.has(n.id) ? ' is-active' : ''}">
        <span class="linux-sys__node-label">${escapeHtml(n.label)}</span>
        <code class="linux-sys__node-role">${escapeHtml(n.role)}</code>
      </div>`,
      )
      .join('<span class="linux-sys__wire" aria-hidden="true"></span>');

    const facts = `
      <dl class="linux-sys__facts">
        ${(sc.facts || [])
          .map(
            (f) => `<div><dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(f.value)}</dd></div>`,
          )
          .join('')}
        <div><dt>阶段</dt><dd>${escapeHtml(sc.stageLabel)}</dd></div>
      </dl>`;

    const stepList = sc.steps
      .map(
        (s, i) => `
      <li class="linux-sys__step-item${i === stepIndex ? ' is-current' : ''}${i < stepIndex ? ' is-done' : ''}">
        <button type="button" data-goto-step="${i}">
          <span class="linux-sys__step-num">${i + 1}</span>
          <span class="linux-sys__step-text">
            <strong>${escapeHtml(s.title)}</strong>
            <em>${escapeHtml(s.summary)}</em>
          </span>
        </button>
      </li>`,
      )
      .join('');

    shell.innerHTML = `
      <header class="linux-sys__hero">
        <div>
          <p class="linux-sys__eyebrow">LINUX SYSTEMS EXPLORER</p>
          <h2 class="linux-sys__title">${escapeHtml(meta.title)}</h2>
          <p class="linux-sys__subtitle">${escapeHtml(meta.subtitle)}</p>
        </div>
        <div class="linux-sys__progress">
          <div class="linux-sys__progress-head"><span>本域进度</span><strong>${stats.pct}%</strong></div>
          <div class="linux-sys__progress-bar" role="progressbar" aria-valuenow="${stats.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${stats.pct}%"></i></div>
          <p class="linux-sys__progress-meta">${stats.complete} / ${stats.total} 已完成 · ${stats.inProgress} 进行中</p>
          <button type="button" class="linux-sys__linkish" data-reset-progress>重置本域进度</button>
        </div>
      </header>

      <div class="linux-sys__domains" role="tablist" aria-label="演示主题">${domainTabs}</div>

      <div class="linux-sys__layout">
        <aside class="linux-sys__sidebar" aria-label="场景与阶段">
          <h3 class="linux-sys__side-title">阶段条</h3>
          <div class="linux-sys__stages">${stages}</div>
          <p class="linux-sys__side-hint">高亮为当前场景主要阶段（教学近似）。</p>
          <h3 class="linux-sys__side-title linux-sys__side-title--scenarios">场景 <span>${list.length}</span></h3>
          <div class="linux-sys__filters linux-sys__filters--side">${catFilters}</div>
          <div class="linux-sys__scenario-nav">${cards}</div>
        </aside>

        <div class="linux-sys__main" data-showcase-scroll tabindex="-1">
          <section class="linux-sys__stage-live" data-linux-stage-live aria-label="交互示意">
            <div class="linux-sys__stage-live__head">
              <div class="linux-sys__stage-live__titles">
                <p class="linux-sys__active-badge">当前 · ${escapeHtml(sc.name)}</p>
                <p class="linux-sys__step-kicker">步骤 ${stepIndex + 1} / ${sc.steps.length}</p>
                <h4 class="linux-sys__step-title">${escapeHtml(step.title)}</h4>
                <p class="linux-sys__step-summary linux-sys__step-summary--live">${escapeHtml(step.summary)}</p>
              </div>
              <div class="linux-sys__controls linux-sys__controls--live">
                <button type="button" class="linux-sys__btn" data-reset-step>重置步骤</button>
                <button type="button" class="linux-sys__btn" data-prev ${stepIndex === 0 ? 'disabled' : ''}>上一步</button>
                <button type="button" class="linux-sys__btn linux-sys__btn--accent" data-play>${playing ? '暂停' : '自动播放'}</button>
                <button type="button" class="linux-sys__btn" data-next ${stepIndex >= sc.steps.length - 1 ? 'disabled' : ''}>下一步</button>
              </div>
            </div>
            ${renderProcessModel(sc, stepIndex)}
            <div class="linux-sys__topology">${nodes}</div>
            <div class="linux-sys__flow-lane" data-flow-lane>
              <span class="linux-sys__flow-legend">${escapeHtml(sc.flowLegend)}</span>
              <span class="linux-sys__packet-dot" aria-hidden="true"></span>
            </div>
          </section>

          <article class="linux-sys__detail" aria-live="polite">
            <div class="linux-sys__detail-head linux-sys__detail-head--meta">
              <div>
                <h3 class="linux-sys__scene-name">${escapeHtml(sc.name)}</h3>
                <p class="linux-sys__full-name">${escapeHtml(sc.fullName)}</p>
              </div>
              ${facts}
            </div>
            <p class="linux-sys__blurb">${escapeHtml(sc.blurb)}</p>

            <section class="linux-sys__reading" aria-label="步骤详解">
              <p class="linux-sys__step-body">${escapeHtml(step.body)}</p>
            </section>

            <ol class="linux-sys__step-list linux-sys__step-list--compact">${stepList}</ol>

            <details class="linux-sys__viz-fold">
              <summary class="linux-sys__viz-fold__summary">时序图、侧栏示意与${escapeHtml(meta.eventTitle)}</summary>
              <div class="linux-sys__viz-fold__body">
                <div class="linux-sys__stage-grid">
                  <div>${renderSequenceDiagram(sc, stepIndex, Boolean(opts.animate))}</div>
                  ${renderSidePanel(sc, step)}
                </div>
                <section class="linux-sys__events" aria-label="${escapeHtml(meta.eventTitle)}">
                  <div class="linux-sys__events-head">
                    <h4 class="linux-sys__events-title">${escapeHtml(meta.eventTitle)}</h4>
                    <span class="linux-sys__events-legend">${escapeHtml(sc.flowLegend)}</span>
                  </div>
                  <div class="linux-sys__table-wrap">
                    <table class="linux-sys__table">
                      <thead>
                        <tr>
                          <th>No.</th><th>时间</th><th>从</th><th>到</th><th>阶段</th><th>信息</th>
                        </tr>
                      </thead>
                      ${renderEventTable(events)}
                    </table>
                  </div>
                </section>
              </div>
            </details>
          </article>
        </div>
      </div>

      <p class="linux-sys__credit">教学示意：启动 / FHS / 权限结构与动机；非特定发行版实机转储。安全内容不含利用步骤。</p>
    `;

    if (opts.animate) {
      flashAnim(step.anim);
      shell.querySelector('[data-flow-lane]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    shell.querySelectorAll('[data-domain]').forEach((el) => {
      el.addEventListener('click', () => switchDomain(/** @type {DomainId} */ (el.getAttribute('data-domain'))));
    });
    shell.querySelectorAll('[data-cat]').forEach((el) => {
      el.addEventListener('click', () => {
        category = el.getAttribute('data-cat') || 'all';
        const still = filtered().some((s) => s.id === scenarioId);
        if (!still) {
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
      const { scenarios } = catalog(domain);
      for (const s of scenarios) delete progress[progressKey(s.id)];
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

    const seqScroll = shell.querySelector('.linux-sys__seq-scroll');
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
