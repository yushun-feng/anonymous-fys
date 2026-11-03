/**
 * Full Protocol Explorer–style interactive demo (original implementation).
 * Features: ~14 protocols, OSI highlight, learning progress, step animation, packet table.
 * Chinese UI. Does not copy third-party assets or code.
 */

import {
  PROTOCOLS,
  CATEGORY_LABELS,
  OSI_LAYERS,
} from './protocol-explorer-data.js';

const STORAGE_KEY = 'anonymous-fys-proto-progress-v1';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @returns {Record<string, { status: 'idle'|'in_progress'|'complete', maxStep: number }>} */
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

/** @param {Record<string, { status: string, maxStep: number }>} progress */
function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * @param {import('./protocol-explorer-data.js').PROTOCOLS[number]} protocol
 * @param {number} stepIndex
 */
function packetsUpTo(protocol, stepIndex) {
  /** @type {NonNullable<(typeof protocol.steps)[0]['packets']>} */
  const out = [];
  for (let i = 0; i <= stepIndex; i += 1) {
    const step = protocol.steps[i];
    if (step?.packets?.length) out.push(...step.packets);
  }
  return out;
}

/**
 * Mount the protocol explorer into `container`.
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 * @returns {{ dispose: () => void }}
 */
export function mountProtocolExplorer(container, options = {}) {
  const compact = Boolean(options.compact);
  let category = 'all';
  let protocolId = PROTOCOLS[0].id;
  let stepIndex = 0;
  /** @type {Record<string, { status: 'idle'|'in_progress'|'complete', maxStep: number }>} */
  let progress = loadProgress();
  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null;
  let playing = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let animTimer = null;

  const shell = document.createElement('section');
  shell.className = `proto-explorer${compact ? ' proto-explorer--compact' : ''}`;
  shell.setAttribute('aria-label', '协议探索交互演示');

  function currentProtocol() {
    return PROTOCOLS.find((p) => p.id === protocolId) || PROTOCOLS[0];
  }

  function filteredProtocols() {
    if (category === 'all') return PROTOCOLS;
    return PROTOCOLS.filter((p) => p.category === category);
  }

  function stopPlay() {
    playing = false;
    if (timer != null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function bumpProgress(proto, step) {
    const prev = progress[proto.id] || { status: 'idle', maxStep: -1 };
    const maxStep = Math.max(prev.maxStep, step);
    const complete = maxStep >= proto.steps.length - 1;
    progress = {
      ...progress,
      [proto.id]: {
        status: complete ? 'complete' : 'in_progress',
        maxStep,
      },
    };
    saveProgress(progress);
  }

  function progressStats() {
    const complete = PROTOCOLS.filter((p) => progress[p.id]?.status === 'complete').length;
    const inProgress = PROTOCOLS.filter((p) => progress[p.id]?.status === 'in_progress').length;
    const pct = Math.round((complete / PROTOCOLS.length) * 100);
    return { complete, inProgress, pct, total: PROTOCOLS.length };
  }

  function startPlay() {
    stopPlay();
    playing = true;
    const playBtn = shell.querySelector('[data-play]');
    if (playBtn) playBtn.textContent = '暂停';
    timer = setInterval(() => {
      const proto = currentProtocol();
      if (stepIndex >= proto.steps.length - 1) {
        stopPlay();
        const btn = shell.querySelector('[data-play]');
        if (btn) btn.textContent = '自动播放';
        return;
      }
      stepIndex += 1;
      bumpProgress(proto, stepIndex);
      render({ animate: true });
    }, 1700);
  }

  function selectProtocol(id) {
    if (!PROTOCOLS.some((p) => p.id === id)) return;
    stopPlay();
    protocolId = id;
    stepIndex = 0;
    bumpProgress(currentProtocol(), 0);
    render({ animate: true });
  }

  function goStep(delta) {
    stopPlay();
    const proto = currentProtocol();
    const next = Math.max(0, Math.min(proto.steps.length - 1, stepIndex + delta));
    if (next === stepIndex) return;
    stepIndex = next;
    bumpProgress(proto, stepIndex);
    render({ animate: true });
  }

  function flashAnim(kind) {
    if (animTimer) clearTimeout(animTimer);
    const lane = shell.querySelector('[data-flow-lane]');
    if (!lane || !kind) return;
    lane.setAttribute('data-anim', kind);
    animTimer = setTimeout(() => {
      lane.removeAttribute('data-anim');
    }, 900);
  }

  function renderPacketTable(packets) {
    if (!packets.length) {
      return `<tbody><tr class="proto-explorer__empty-row"><td colspan="7">链路上尚无报文。</td></tr></tbody>`;
    }
    const rows = packets
      .map(
        (p, i) => `
      <tr class="proto-explorer__pkt${i === packets.length - 1 ? ' is-latest' : ''}">
        <td>${escapeHtml(String(p.no))}</td>
        <td>${escapeHtml(p.time)}</td>
        <td><code>${escapeHtml(p.src)}</code></td>
        <td><code>${escapeHtml(p.dst)}</code></td>
        <td><span class="proto-explorer__proto-tag">${escapeHtml(p.proto)}</span></td>
        <td>${escapeHtml(p.info)}</td>
        <td>${escapeHtml(p.size)}</td>
      </tr>`,
      )
      .join('');
    return `<tbody>${rows}</tbody>`;
  }

  /**
   * @param {{ animate?: boolean }} [opts]
   */
  function render(opts = {}) {
    const proto = currentProtocol();
    const step = proto.steps[stepIndex];
    const highlight = new Set(step.highlight || []);
    const packets = packetsUpTo(proto, stepIndex);
    const stats = progressStats();
    const list = filteredProtocols();

    const catCounts = {
      all: PROTOCOLS.length,
      core: PROTOCOLS.filter((p) => p.category === 'core').length,
      application: PROTOCOLS.filter((p) => p.category === 'application').length,
      security: PROTOCOLS.filter((p) => p.category === 'security').length,
    };

    const catFilters = /** @type {const} */ (['all', 'core', 'application', 'security'])
      .map(
        (c) => `
      <button type="button" class="proto-explorer__filter${category === c ? ' is-active' : ''}" data-cat="${c}">
        ${CATEGORY_LABELS[c]} <em>${catCounts[c]}</em>
      </button>`,
      )
      .join('');

    const osi = OSI_LAYERS.map((layer) => {
      const active = layer.n === proto.osiLayer;
      return `
        <div class="proto-explorer__osi-row${active ? ' is-active' : ''}" data-osi="${layer.n}">
          <span class="proto-explorer__osi-num">${layer.n}</span>
          <span class="proto-explorer__osi-name">${escapeHtml(layer.name)}</span>
        </div>`;
    }).join('');

    const cards = list
      .map((p) => {
        const st = progress[p.id]?.status || 'idle';
        const active = p.id === proto.id;
        return `
        <button type="button" class="proto-explorer__card${active ? ' is-active' : ''} is-${st}" data-proto="${escapeHtml(p.id)}">
          <span class="proto-explorer__card-name">${escapeHtml(p.name)}</span>
          <span class="proto-explorer__card-full">${escapeHtml(p.fullName)}</span>
          <span class="proto-explorer__card-status" data-st="${st}">${
            st === 'complete' ? '已完成' : st === 'in_progress' ? '进行中' : '未开始'
          }</span>
        </button>`;
      })
      .join('');

    const nodes = proto.nodes
      .map(
        (n) => `
      <div class="proto-explorer__node${highlight.has(n.id) ? ' is-active' : ''}" data-node="${escapeHtml(n.id)}">
        <span class="proto-explorer__node-label">${escapeHtml(n.label)}</span>
        <code class="proto-explorer__node-ip">${escapeHtml(n.ip)}</code>
      </div>`,
      )
      .join('<span class="proto-explorer__wire" aria-hidden="true"></span>');

    const stepList = proto.steps
      .map(
        (s, i) => `
      <li class="proto-explorer__step-item${i === stepIndex ? ' is-current' : ''}${i < stepIndex ? ' is-done' : ''}">
        <button type="button" data-goto-step="${i}">
          <span class="proto-explorer__step-num">${i + 1}</span>
          <span class="proto-explorer__step-text">
            <strong>${escapeHtml(s.title)}</strong>
            <em>${escapeHtml(s.summary)}</em>
          </span>
        </button>
      </li>`,
      )
      .join('');

    const facts = `
      <dl class="proto-explorer__facts">
        <div><dt>层次</dt><dd>${escapeHtml(proto.osiLabel)}（OSI ${proto.osiLayer}）</dd></div>
        <div><dt>默认端口</dt><dd>${escapeHtml(proto.port)}</dd></div>
        <div><dt>传输</dt><dd>${escapeHtml(proto.transport)}</dd></div>
        <div><dt>数据格式</dt><dd>${escapeHtml(proto.dataFormat)}</dd></div>
        ${
          proto.methods
            ? `<div><dt>常见方法</dt><dd>${escapeHtml(proto.methods)}</dd></div>`
            : ''
        }
        <div><dt>定义于</dt><dd>${escapeHtml(proto.rfc)}</dd></div>
      </dl>`;

    shell.innerHTML = `
      <header class="proto-explorer__hero">
        <div class="proto-explorer__hero-text">
          <p class="proto-explorer__eyebrow">PROTOCOL EXPLORER</p>
          <h2 class="proto-explorer__title">协议探索</h2>
          <p class="proto-explorer__subtitle">理解互联网如何工作 · 全量 ${PROTOCOLS.length} 种协议教学示意</p>
        </div>
        <div class="proto-explorer__progress" aria-label="学习进度">
          <div class="proto-explorer__progress-head">
            <span>学习进度</span>
            <strong>${stats.pct}%</strong>
          </div>
          <div class="proto-explorer__progress-bar" role="progressbar" aria-valuenow="${stats.pct}" aria-valuemin="0" aria-valuemax="100">
            <i style="width:${stats.pct}%"></i>
          </div>
          <p class="proto-explorer__progress-meta">${stats.complete} / ${stats.total} 已完成 · ${stats.inProgress} 进行中</p>
          <button type="button" class="proto-explorer__linkish" data-reset-progress>重置进度</button>
        </div>
      </header>

      <div class="proto-explorer__layout">
        <aside class="proto-explorer__sidebar">
          <h3 class="proto-explorer__side-title">OSI 模型</h3>
          <div class="proto-explorer__osi" aria-label="OSI 层">${osi}</div>
          <p class="proto-explorer__side-hint">高亮为当前协议主要落点（教学近似）。</p>
        </aside>

        <div class="proto-explorer__main">
          <div class="proto-explorer__filters" role="tablist" aria-label="协议分类">${catFilters}</div>

          <h3 class="proto-explorer__section-title">互联网协议 <span>${list.length}</span></h3>
          <div class="proto-explorer__cards">${cards}</div>

          <article class="proto-explorer__detail" aria-live="polite">
            <div class="proto-explorer__detail-head">
              <div>
                <p class="proto-explorer__active-badge">当前</p>
                <h3 class="proto-explorer__proto-name">${escapeHtml(proto.name)}</h3>
                <p class="proto-explorer__full-name">${escapeHtml(proto.fullName)}</p>
              </div>
              ${facts}
            </div>
            <p class="proto-explorer__blurb">${escapeHtml(proto.blurb)}</p>

            <div class="proto-explorer__stage">
              <div class="proto-explorer__topology">${nodes}</div>
              <div class="proto-explorer__flow-lane" data-flow-lane>
                <span class="proto-explorer__flow-legend">${escapeHtml(proto.flowLegend)}</span>
                <span class="proto-explorer__packet-dot" aria-hidden="true"></span>
              </div>
              <div class="proto-explorer__step-panel">
                <p class="proto-explorer__step-kicker">步骤 ${stepIndex + 1} / ${proto.steps.length}</p>
                <h4 class="proto-explorer__step-title">${escapeHtml(step.title)}</h4>
                <p class="proto-explorer__step-summary">${escapeHtml(step.summary)}</p>
                <p class="proto-explorer__step-body">${escapeHtml(step.body)}</p>
              </div>
            </div>

            <div class="proto-explorer__controls">
              <button type="button" class="proto-explorer__btn" data-reset-step>重置步骤</button>
              <button type="button" class="proto-explorer__btn" data-prev ${stepIndex === 0 ? 'disabled' : ''}>上一步</button>
              <button type="button" class="proto-explorer__btn proto-explorer__btn--accent" data-play>${playing ? '暂停' : '自动播放'}</button>
              <button type="button" class="proto-explorer__btn" data-next ${stepIndex >= proto.steps.length - 1 ? 'disabled' : ''}>下一步</button>
            </div>

            <ol class="proto-explorer__step-list">${stepList}</ol>

            <section class="proto-explorer__packets" aria-label="报文流">
              <div class="proto-explorer__packets-head">
                <h4 class="proto-explorer__packets-title">报文流</h4>
                <span class="proto-explorer__packets-legend">${escapeHtml(proto.flowLegend)}</span>
              </div>
              <div class="proto-explorer__table-wrap">
                <table class="proto-explorer__table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>时间</th>
                      <th>源</th>
                      <th>目的</th>
                      <th>协议</th>
                      <th>信息</th>
                      <th>大小</th>
                    </tr>
                  </thead>
                  ${renderPacketTable(packets)}
                </table>
              </div>
            </section>
          </article>
        </div>
      </div>

      <p class="proto-explorer__credit">原创教学示意，受 Protocol Explorer 一类交互演示启发；未复制其资源或代码。地址与报文为教学虚构。</p>
    `;

    if (opts.animate) flashAnim(step.anim);

    shell.querySelectorAll('[data-cat]').forEach((el) => {
      el.addEventListener('click', () => {
        category = el.getAttribute('data-cat') || 'all';
        const stillVisible = filteredProtocols().some((p) => p.id === protocolId);
        if (!stillVisible) {
          const first = filteredProtocols()[0];
          if (first) {
            protocolId = first.id;
            stepIndex = 0;
            bumpProgress(first, 0);
          }
        }
        stopPlay();
        render();
      });
    });
    shell.querySelectorAll('[data-proto]').forEach((el) => {
      el.addEventListener('click', () => selectProtocol(el.getAttribute('data-proto') || ''));
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
      const protoNow = currentProtocol();
      if (stepIndex >= protoNow.steps.length - 1) {
        stepIndex = 0;
        bumpProgress(protoNow, 0);
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
        bumpProgress(currentProtocol(), stepIndex);
        render({ animate: true });
      });
    });
  }

  // Mark first open as in-progress
  bumpProgress(currentProtocol(), 0);
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
