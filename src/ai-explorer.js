/**
 * AI History Timeline Explorer — browse imported AI 史记 eras/events.
 * Concept-first: era rail + type filters + event list; links to notes / upstream.
 * Chinese UI. Structured data from src/ai-timeline-data.js (CC BY-SA 4.0).
 */

import {
  AI_TIMELINE_ERAS,
  AI_TIMELINE_META,
  AI_EVENT_TYPE_LABELS,
  AI_IMPORTANCE_LABELS,
} from './ai-timeline-data.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TYPE_ORDER = ['paper', 'product', 'company', 'policy', 'person', 'event', 'milestone'];

/**
 * @param {HTMLElement} root
 * @param {{ compact?: boolean }} [opts]
 */
export function mountAiExplorer(root, opts = {}) {
  const compact = Boolean(opts.compact);
  /** @type {string} */
  let eraId = AI_TIMELINE_ERAS[0]?.id || '';
  /** @type {string} '' | event type */
  let typeFilter = '';
  /** @type {string} '' | importance */
  let impFilter = '';
  /** @type {string} */
  let query = '';

  const shell = document.createElement('section');
  shell.className = `ai-ex${compact ? ' ai-ex--compact' : ''}`;
  shell.setAttribute('aria-label', 'AI 史记时间线');
  root.appendChild(shell);

  function currentEra() {
    return AI_TIMELINE_ERAS.find((e) => e.id === eraId) || AI_TIMELINE_ERAS[0];
  }

  function filteredEvents(era) {
    const q = query.trim().toLowerCase();
    return era.events.filter((ev) => {
      if (typeFilter && ev.type !== typeFilter) return false;
      if (impFilter && ev.importance !== impFilter) return false;
      if (q && !`${ev.year} ${ev.text}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function noteHrefForEra(era) {
    return `#/note/ai/annals/${era.slug}`;
  }

  function render() {
    const era = currentEra();
    if (!era) {
      shell.innerHTML = '<p class="ai-ex__empty">暂无时间线数据。</p>';
      return;
    }
    const events = filteredEvents(era);
    const totalEvents = AI_TIMELINE_ERAS.reduce((n, e) => n + e.events.length, 0);

    const eraButtons = AI_TIMELINE_ERAS.map((e) => {
      const active = e.id === era.id ? ' is-active' : '';
      return `<button type="button" class="ai-ex__era${active}" data-era="${escapeHtml(e.id)}" title="${escapeHtml(e.period)}">
        <strong>${escapeHtml(e.name)}</strong>
        <em>${escapeHtml(e.period)}</em>
        <span>${e.events.length}</span>
      </button>`;
    }).join('');

    const typeFilters = [
      `<button type="button" class="ai-ex__chip${!typeFilter ? ' is-active' : ''}" data-type="">全部类型</button>`,
      ...TYPE_ORDER.map((t) => {
        const active = typeFilter === t ? ' is-active' : '';
        return `<button type="button" class="ai-ex__chip${active}" data-type="${t}">${AI_EVENT_TYPE_LABELS[t] || t}</button>`;
      }),
    ].join('');

    const impFilters = [
      `<button type="button" class="ai-ex__chip${!impFilter ? ' is-active' : ''}" data-imp="">全部重要度</button>`,
      ...Object.keys(AI_IMPORTANCE_LABELS).map((k) => {
        const active = impFilter === k ? ' is-active' : '';
        return `<button type="button" class="ai-ex__chip${active}" data-imp="${k}">${AI_IMPORTANCE_LABELS[k]}</button>`;
      }),
    ].join('');

    const list = events
      .map((ev) => {
        const when = ev.month ? `${escapeHtml(ev.year)}·${ev.month}月` : escapeHtml(ev.year);
        const impClass = `is-${escapeHtml(ev.importance)}`;
        return `
        <li class="ai-ex__event ${impClass}">
          <span class="ai-ex__when">${when}</span>
          <span class="ai-ex__type" title="${escapeHtml(AI_EVENT_TYPE_LABELS[ev.type] || ev.type)}">${escapeHtml(AI_EVENT_TYPE_LABELS[ev.type] || ev.type)}</span>
          <span class="ai-ex__text">${escapeHtml(ev.text)}</span>
          <a class="ai-ex__ext" href="${escapeHtml(ev.upstreamUrl)}" rel="noopener noreferrer" target="_blank">上游</a>
        </li>`;
      })
      .join('');

    shell.innerHTML = `
      <header class="ai-ex__hero">
        <div class="ai-ex__hero-copy">
          <p class="ai-ex__eyebrow">AI · HISTORY OF AI</p>
          <h2 class="ai-ex__brand">AI</h2>
          <p class="ai-ex__lede">导入 <a href="${escapeHtml(AI_TIMELINE_META.sourceSite)}" rel="noopener noreferrer" target="_blank">AI 史记</a> 大事年表结构（${AI_TIMELINE_META.eraCount} 时代 · ${totalEvents} 事件）。按时代浏览；深读本纪 / 世家 / 列传 / 书请走上游或站内导读笔记。</p>
          <div class="ai-ex__actions">
            <a href="${noteHrefForEra(era)}">本纪导读 →</a>
            <a href="#/note/ai/00-roadmap">路线图 →</a>
            <a href="#/note/ai/houses/00-index">世家索引 →</a>
            <a href="#/note/ai/biographies/00-index">列传索引 →</a>
            <a href="#/note/ai/treatises/00-index">书索引 →</a>
            ${compact ? '<a href="#/ai">打开完整时间线 →</a>' : ''}
            <a href="${escapeHtml(AI_TIMELINE_META.sourceTimeline)}" rel="noopener noreferrer" target="_blank">上游年表 ↗</a>
          </div>
        </div>
        <div class="ai-ex__stat" aria-label="当前筛选">
          <strong>${events.length}</strong>
          <span>/ ${era.events.length} · ${escapeHtml(era.name)}</span>
        </div>
      </header>

      <div class="ai-ex__eras" role="tablist" aria-label="时代">${eraButtons}</div>

      <div class="ai-ex__toolbar">
        <div class="ai-ex__filters" role="group" aria-label="事件类型">${typeFilters}</div>
        <div class="ai-ex__filters" role="group" aria-label="重要度">${impFilters}</div>
        <label class="ai-ex__search">
          <span class="visually-hidden">搜索</span>
          <input type="search" placeholder="搜索年份或关键词…" value="${escapeHtml(query)}" data-q />
        </label>
      </div>

      <section class="ai-ex__panel">
        <header class="ai-ex__panel-head">
          <div>
            <p class="ai-ex__kicker">${escapeHtml(era.nameEn || 'Annals')}</p>
            <h3 class="ai-ex__panel-title">${escapeHtml(era.name)} <span>${escapeHtml(era.period)}</span></h3>
          </div>
          <p class="ai-ex__panel-links">
            <a href="${noteHrefForEra(era)}">站内导读</a>
            ·
            <a href="${escapeHtml(era.upstreamUrl)}" rel="noopener noreferrer" target="_blank">上游本纪</a>
          </p>
        </header>
        <ol class="ai-ex__list">${list || '<li class="ai-ex__empty-row">没有匹配事件。</li>'}</ol>
      </section>

      <p class="ai-ex__credit">事件数据改编自 <a href="${escapeHtml(AI_TIMELINE_META.sourceRepo)}" rel="noopener noreferrer" target="_blank">zsjunai/history-of-ai</a>（${escapeHtml(AI_TIMELINE_META.license)}）。衍生数据同许可证；本站导读笔记为原创中文框架。许可：<a href="${escapeHtml(AI_TIMELINE_META.licenseUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(AI_TIMELINE_META.license)}</a>。</p>
    `;

    shell.querySelectorAll('[data-era]').forEach((btn) => {
      btn.addEventListener('click', () => {
        eraId = btn.getAttribute('data-era') || eraId;
        render();
      });
    });
    shell.querySelectorAll('[data-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        typeFilter = btn.getAttribute('data-type') || '';
        render();
      });
    });
    shell.querySelectorAll('[data-imp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        impFilter = btn.getAttribute('data-imp') || '';
        render();
      });
    });
    const input = shell.querySelector('[data-q]');
    if (input) {
      input.addEventListener('input', () => {
        query = /** @type {HTMLInputElement} */ (input).value;
        // Debounce-free light filter: re-render keeps focus awkwardly; update list only
        const next = filteredEvents(currentEra());
        const ol = shell.querySelector('.ai-ex__list');
        const stat = shell.querySelector('.ai-ex__stat');
        if (stat) {
          const e = currentEra();
          stat.innerHTML = `<strong>${next.length}</strong><span>/ ${e.events.length} · ${escapeHtml(e.name)}</span>`;
        }
        if (ol) {
          ol.innerHTML =
            next
              .map((ev) => {
                const when = ev.month ? `${escapeHtml(ev.year)}·${ev.month}月` : escapeHtml(ev.year);
                return `
            <li class="ai-ex__event is-${escapeHtml(ev.importance)}">
              <span class="ai-ex__when">${when}</span>
              <span class="ai-ex__type">${escapeHtml(AI_EVENT_TYPE_LABELS[ev.type] || ev.type)}</span>
              <span class="ai-ex__text">${escapeHtml(ev.text)}</span>
              <a class="ai-ex__ext" href="${escapeHtml(ev.upstreamUrl)}" rel="noopener noreferrer" target="_blank">上游</a>
            </li>`;
              })
              .join('') || '<li class="ai-ex__empty-row">没有匹配事件。</li>';
        }
      });
    }
  }

  render();

  return {
    dispose() {
      shell.remove();
    },
  };
}
