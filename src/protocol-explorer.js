/**
 * Full Protocol Explorer–style interactive demo (original implementation).
 * Features: ~14 protocols, OSI layer guide (expand + stack highlight),
 * learning progress, step animation, packet table.
 * Chinese UI. Does not copy third-party assets or code.
 */

import {
  PROTOCOLS,
  CATEGORY_LABELS,
  OSI_LAYERS,
  OSI_ENCAPSULATION,
  TCPIP_MAPPING,
  TCPIP_MERGE_NOTE,
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
 * Map a packet address to a topology node index (best-effort for teaching IPs).
 * @param {import('./protocol-explorer-data.js').PROTOCOLS[number]} protocol
 * @param {string} addr
 * @returns {number}
 */
function nodeIndexForAddr(protocol, addr) {
  const exact = protocol.nodes.findIndex((n) => n.ip === addr || n.ip.includes(addr));
  if (exact >= 0) return exact;
  // Broadcast / unknown → leftmost active-looking peer (client/first)
  if (addr.includes('255.255.255.255') || addr.includes('ff:ff:ff') || addr === '0.0.0.0') {
    return 0;
  }
  // NAT public / intermediate: prefer router if present, else last node
  const router = protocol.nodes.findIndex((n) => /网关|路由|NAT|DHCP|MSA|解析/i.test(n.label));
  if (router >= 0) return router;
  return Math.max(0, protocol.nodes.length - 1);
}

/**
 * Horizontal process-model diagram of all steps (图画流程).
 * @param {import('./protocol-explorer-data.js').PROTOCOLS[number]} protocol
 * @param {number} stepIndex
 */
function renderProcessModel(protocol, stepIndex) {
  const parts = protocol.steps
    .map((s, i) => {
      const state = i < stepIndex ? 'is-done' : i === stepIndex ? 'is-current' : '';
      const arrow =
        i < protocol.steps.length - 1
          ? `<span class="proto-explorer__model-arrow${i < stepIndex ? ' is-lit' : ''}" aria-hidden="true">
              <svg viewBox="0 0 40 16" width="40" height="16"><path d="M2 8h28M24 3l10 5-10 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>`
          : '';
      return `
        <div class="proto-explorer__model-item ${state}">
          <button type="button" class="proto-explorer__model-node" data-goto-step="${i}">
            <span class="proto-explorer__model-idx">${i + 1}</span>
            <span class="proto-explorer__model-title">${escapeHtml(s.title)}</span>
            <span class="proto-explorer__model-sum">${escapeHtml(s.summary)}</span>
          </button>
          ${arrow}
        </div>`;
    })
    .join('');
  return `
    <section class="proto-explorer__model" aria-label="协议流程模型">
      <div class="proto-explorer__model-head">
        <h4 class="proto-explorer__model-heading">流程模型</h4>
        <p class="proto-explorer__model-hint">点击节点跳转步骤 · 高亮为当前</p>
      </div>
      <div class="proto-explorer__model-track">${parts}</div>
    </section>`;
}

/**
 * SVG sequence diagram: actors + message arrows up to current step.
 * @param {import('./protocol-explorer-data.js').PROTOCOLS[number]} protocol
 * @param {number} stepIndex
 * @param {boolean} animate
 */
function renderSequenceDiagram(protocol, stepIndex, animate) {
  const n = protocol.nodes.length;
  const colW = 140;
  const leftPad = 36;
  const topPad = 52;
  const rowH = 36;
  const width = Math.max(320, leftPad * 2 + colW * (n - 1) + 40);

  /** @type {{from:number,to:number,label:string,proto:string,step:number,loss:boolean}[]} */
  const msgs = [];
  for (let si = 0; si <= stepIndex; si += 1) {
    const step = protocol.steps[si];
    const pkts = step.packets || [];
    if (!pkts.length) {
      const hi = step.highlight || [];
      if (hi.length) {
        const idx = protocol.nodes.findIndex((node) => node.id === hi[0]);
        if (idx >= 0) {
          msgs.push({
            from: idx,
            to: idx,
            label: step.title,
            proto: '本地',
            step: si,
            loss: false,
          });
        }
      }
      continue;
    }
    for (const p of pkts) {
      const from = nodeIndexForAddr(protocol, p.src);
      let to = nodeIndexForAddr(protocol, p.dst);
      if (p.dst.includes('255.255.255.255') || p.dst.includes('ff:ff:ff')) {
        // broadcast: fan to last non-self node for teaching sketch
        to = Math.min(n - 1, Math.max(0, from === 0 ? 1 : 0));
      }
      const loss = /丢失|lost/i.test(p.info) || p.size === '—';
      msgs.push({
        from,
        to,
        label: p.info.length > 36 ? `${p.info.slice(0, 34)}…` : p.info,
        proto: p.proto,
        step: si,
        loss,
      });
    }
  }

  const height = topPad + 28 + Math.max(msgs.length, 1) * rowH + 24;
  const xs = protocol.nodes.map((_, i) => leftPad + i * colW);

  const actors = protocol.nodes
    .map((node, i) => {
      const x = xs[i];
      const active = (protocol.steps[stepIndex].highlight || []).includes(node.id);
      return `
        <g class="pe-seq__actor${active ? ' is-active' : ''}">
          <rect x="${x - 54}" y="8" width="108" height="36" rx="8" class="pe-seq__actor-box"/>
          <text x="${x}" y="24" text-anchor="middle" class="pe-seq__actor-label">${escapeHtml(node.label)}</text>
          <text x="${x}" y="38" text-anchor="middle" class="pe-seq__actor-ip">${escapeHtml(node.ip.length > 18 ? `${node.ip.slice(0, 16)}…` : node.ip)}</text>
          <line x1="${x}" y1="${topPad}" x2="${x}" y2="${height - 12}" class="pe-seq__life"/>
        </g>`;
    })
    .join('');

  const arrows = msgs
    .map((m, i) => {
      const y = topPad + 18 + i * rowH;
      const x1 = xs[m.from];
      const x2 = xs[m.to];
      const live = m.step === stepIndex;
      const self = m.from === m.to;
      if (self) {
        return `
          <g class="pe-seq__msg${live ? ' is-live' : ''} is-self${m.loss ? ' is-loss' : ''}">
            <path d="M${x1 + 8} ${y - 8} h22 v16 h-22" fill="none" class="pe-seq__line"/>
            <text x="${x1 + 34}" y="${y + 4}" class="pe-seq__msg-label">${escapeHtml(m.proto)} · ${escapeHtml(m.label)}</text>
          </g>`;
      }
      const dir = x2 >= x1 ? 1 : -1;
      const tip = x2 - dir * 8;
      return `
        <g class="pe-seq__msg${live ? ' is-live' : ''}${m.loss ? ' is-loss' : ''}${animate && live ? ' is-anim' : ''}">
          <line x1="${x1}" y1="${y}" x2="${tip}" y2="${y}" class="pe-seq__line"/>
          <path d="M${tip} ${y} l${-dir * 7} -4 v8 z" class="pe-seq__head"/>
          <text x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle" class="pe-seq__msg-label">${escapeHtml(m.proto)} · ${escapeHtml(m.label)}</text>
        </g>`;
    })
    .join('');

  const empty =
    msgs.length === 0
      ? `<text x="${width / 2}" y="${topPad + 40}" text-anchor="middle" class="pe-seq__empty">本步尚无跨节点报文 · 见上方流程模型</text>`
      : '';

  return `
    <section class="proto-explorer__seq-wrap" aria-label="时序交互图">
      <div class="proto-explorer__model-head">
        <h4 class="proto-explorer__model-heading">时序图 · 模型流程</h4>
        <p class="proto-explorer__model-hint">随步骤累计箭头 · 当前步高亮动画</p>
      </div>
      <div class="proto-explorer__seq-scroll">
        <svg class="proto-explorer__seq" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeHtml(protocol.name)} 时序图">
          ${actors}
          ${arrows}
          ${empty}
        </svg>
      </div>
    </section>`;
}

/**
 * Compact OSI stack strip: home layer + layers used by this protocol.
 * @param {import('./protocol-explorer-data.js').PROTOCOLS[number]} protocol
 */
function renderStackModel(protocol) {
  const used = new Set(protocol.osiStack || [protocol.osiLayer]);
  const cells = OSI_LAYERS.map((l) => {
    const home = l.n === protocol.osiLayer;
    const on = used.has(l.n);
    const short = l.name.replace(/层$/, '');
    const cls = [
      'proto-explorer__stack-cell',
      on ? 'is-used' : '',
      home ? 'is-active' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return `<div class="${cls}" title="${escapeHtml(l.name)}（${escapeHtml(l.nameEn)}）"><span>${l.n}</span>${escapeHtml(short)}</div>`;
  }).join('');
  const stackLabel = (protocol.osiStack || [protocol.osiLayer])
    .slice()
    .sort((a, b) => b - a)
    .map((n) => `L${n}`)
    .join(' · ');
  return `
    <div class="proto-explorer__stack" aria-label="OSI 栈位">
      <span class="proto-explorer__stack-label">栈模型</span>
      <div class="proto-explorer__stack-row">${cells}</div>
      <span class="proto-explorer__stack-note">落点 ${escapeHtml(protocol.osiLabel)} · 路径 ${escapeHtml(stackLabel)}</span>
    </div>`;
}

/**
 * @param {import('./protocol-explorer-data.js').PROTOCOLS[number]} protocol
 * @param {number | null} expandedOsi
 * @param {{ compact?: boolean }} [opts]
 */
function renderOsiGuide(protocol, expandedOsi, opts = {}) {
  const slim = Boolean(opts.compact);
  const used = new Set(protocol.osiStack || [protocol.osiLayer]);
  const rows = OSI_LAYERS.map((layer) => {
    const home = layer.n === protocol.osiLayer;
    const onPath = used.has(layer.n);
    const open = expandedOsi === layer.n;
    const cls = [
      'proto-explorer__osi-row',
      onPath ? 'is-used' : '',
      home ? 'is-home' : '',
      open ? 'is-open' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const detail = open
      ? `<div class="proto-explorer__osi-detail" id="osi-detail-${layer.n}">
          <p class="proto-explorer__osi-duty"><strong>职责</strong> ${escapeHtml(layer.responsibility)}</p>
          <p><strong>PDU</strong> ${escapeHtml(layer.pdu)} — ${escapeHtml(layer.pduHint)}</p>
          <p><strong>典型协议</strong> ${escapeHtml(layer.examples)}</p>
          <p class="proto-explorer__osi-digest">${escapeHtml(layer.digests)}</p>
        </div>`
      : '';
    return `
      <div class="${cls}">
        <button type="button" class="proto-explorer__osi-btn" data-osi="${layer.n}"
          aria-expanded="${open ? 'true' : 'false'}" aria-controls="osi-detail-${layer.n}">
          <span class="proto-explorer__osi-num">L${layer.n}</span>
          <span class="proto-explorer__osi-names">
            <span class="proto-explorer__osi-name">${escapeHtml(layer.name)}</span>
            <span class="proto-explorer__osi-en">${escapeHtml(layer.nameEn)}</span>
          </span>
          <span class="proto-explorer__osi-pdu">${escapeHtml(layer.pdu.split('（')[0].split(' / ')[0])}</span>
          <span class="proto-explorer__osi-chevron" aria-hidden="true">${open ? '▾' : '▸'}</span>
        </button>
        ${detail}
      </div>`;
  }).join('');

  const concepts = slim
    ? ''
    : (() => {
        const sendSteps = OSI_ENCAPSULATION.sendSteps
          .map(
            (s) =>
              `<li><span class="proto-explorer__encap-l">L${s.layer}</span>${escapeHtml(s.action)}</li>`,
          )
          .join('');
        const recvSteps = OSI_ENCAPSULATION.receiveSteps
          .map(
            (s) =>
              `<li><span class="proto-explorer__encap-l">L${s.layer}</span>${escapeHtml(s.action)}</li>`,
          )
          .join('');
        const mapRows = TCPIP_MAPPING.map((row) => {
          const osiBits = row.osi.map((n) => `L${n}`).join('+');
          const lit = row.osi.some((n) => used.has(n));
          return `
      <div class="proto-explorer__tcpip-row${lit ? ' is-lit' : ''}">
        <div class="proto-explorer__tcpip-name">
          <strong>${escapeHtml(row.tcpip)}</strong>
          <span>${escapeHtml(row.tcpipEn)}</span>
        </div>
        <div class="proto-explorer__tcpip-osi">${escapeHtml(osiBits)}</div>
        <p>${escapeHtml(row.note)}</p>
      </div>`;
        }).join('');
        return `
      <div class="proto-explorer__encap">
        <div class="proto-explorer__encap-col">
          <h4>${escapeHtml(OSI_ENCAPSULATION.sendTitle)}</h4>
          <p class="proto-explorer__encap-hint">${escapeHtml(OSI_ENCAPSULATION.sendHint)}</p>
          <ol class="proto-explorer__encap-list proto-explorer__encap-list--down">${sendSteps}</ol>
        </div>
        <div class="proto-explorer__encap-col">
          <h4>${escapeHtml(OSI_ENCAPSULATION.receiveTitle)}</h4>
          <p class="proto-explorer__encap-hint">${escapeHtml(OSI_ENCAPSULATION.receiveHint)}</p>
          <ol class="proto-explorer__encap-list proto-explorer__encap-list--up">${recvSteps}</ol>
        </div>
      </div>
      <div class="proto-explorer__tcpip">
        <h4>OSI ↔ TCP/IP（4/5 层）</h4>
        <p class="proto-explorer__encap-hint">${escapeHtml(TCPIP_MERGE_NOTE)}</p>
        <div class="proto-explorer__tcpip-grid">${mapRows}</div>
      </div>`;
      })();

  return `
    <section class="proto-explorer__osi-guide${slim ? ' proto-explorer__osi-guide--slim' : ''}" aria-label="OSI 模型导读">
      <div class="proto-explorer__osi-guide-head">
        <h3 class="proto-explorer__side-title">OSI 模型导读</h3>
        <p class="proto-explorer__side-hint">
          点击层展开细节。亮条 = 当前协议 <strong>${escapeHtml(protocol.name)}</strong> 典型路径；
          描边 = 主要落点（教学近似）。层较多时可在本栏滚轮浏览。
        </p>
      </div>
      <div class="proto-explorer__osi" role="list">${rows}</div>
      ${concepts}
    </section>`;
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
  /** @type {number | null} expanded OSI layer (L1–L7), or null */
  let expandedOsi = 7;
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
    const next = currentProtocol();
    expandedOsi = next.osiLayer;
    bumpProgress(next, 0);
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
        <div><dt>层次</dt><dd>${escapeHtml(proto.osiLabel)}（OSI L${proto.osiLayer} · 路径 ${(proto.osiStack || [proto.osiLayer]).map((n) => `L${n}`).join('→')}）</dd></div>
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
          <p class="proto-explorer__subtitle">OSI 七层导读 + ${PROTOCOLS.length} 种协议步进示意 · 先消化分层再跟报文</p>
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

      <div class="proto-explorer__layout proto-explorer__layout--osi-first">
        ${compact ? '' : renderOsiGuide(proto, expandedOsi)}

        <div class="proto-explorer__main">
          ${compact ? renderOsiGuide(proto, expandedOsi, { compact: true }) : ''}
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
            ${renderStackModel(proto)}
            ${renderProcessModel(proto, stepIndex)}

            <div class="proto-explorer__stage">
              <div class="proto-explorer__topology">${nodes}</div>
              <div class="proto-explorer__flow-lane" data-flow-lane>
                <span class="proto-explorer__flow-legend">${escapeHtml(proto.flowLegend)}</span>
                <span class="proto-explorer__packet-dot" aria-hidden="true"></span>
              </div>
              ${renderSequenceDiagram(proto, stepIndex, Boolean(opts.animate))}
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

    shell.querySelectorAll('[data-osi]').forEach((el) => {
      el.addEventListener('click', () => {
        const n = Number(el.getAttribute('data-osi'));
        if (!Number.isFinite(n)) return;
        expandedOsi = expandedOsi === n ? null : n;
        render();
      });
    });
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

    // Keep the sequence diagram scrolled to the latest message when stepping.
    const seqScroll = shell.querySelector('.proto-explorer__seq-scroll');
    if (seqScroll && opts.animate) {
      seqScroll.scrollTop = seqScroll.scrollHeight;
    }
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
