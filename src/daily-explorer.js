/**
 * Daily Rhythm Explorer — interactive self-discipline checklist.
 * Cadence tabs (日/周/月/年/长期), checkable items, local progress,
 * poster gallery, 20-minute starter timer, and 时辰 strip (Asia/Shanghai).
 * Chinese UI. Teaching / personal rhythm — not a productivity SaaS.
 */

import { SHICHEN_LIST, currentShichen } from './shichen.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STORAGE_KEY = 'anonymous-fys-daily-checklist-v1';
const FOCUS_KEY = 'anonymous-fys-daily-focus-v1';
const TIMER_KEY = 'anonymous-fys-daily-20min-v1';
const TIMER_MS = 20 * 60 * 1000;

const BASE = import.meta.env.BASE_URL || '/';
const asset = (path) => `${BASE.endsWith('/') ? BASE : `${BASE}/`}${path}`;

/** @type {{ id: string, title: string, note: string, src: string, alt: string, caption: string }[]} */
const POSTERS = [
  {
    id: 'checklist',
    title: '自律清单',
    note: '#/note/daily/2026-self-discipline-checklist',
    src: asset('notes-assets/daily/2026-self-discipline-checklist.png'),
    alt: '2026年顶级自律清单原图',
    caption: '日/周/月/年微习惯 + 长期原则',
  },
  {
    id: 'twenty',
    title: '20 分钟定律',
    note: '#/note/daily/20-minute-rule',
    src: asset('notes-assets/daily/20-minute-rule.jpg'),
    alt: '详解20分钟定律原图',
    caption: '先启动 20 分钟，阻力常会下降',
  },
];

/** @typedef {{ id: string, text: string }} HabitItem */
/** @typedef {{ id: string, label: string, kicker: string, blurb: string, items: HabitItem[] }} Cadence */

/** @type {Cadence[]} */
const CADENCES = [
  {
    id: 'day',
    label: '每日',
    kicker: '01 · 微习惯',
    blurb: '小步可复现。一天只认真落地几条，胜过全勾空心。',
    items: [
      { id: 'd1', text: '早睡早起，遵循 1.5 小时睡眠周期' },
      { id: 'd2', text: '起床后喝一杯温水' },
      { id: 'd3', text: '早晨花 5 分钟写 To-Do List' },
      { id: 'd4', text: '每天记账' },
      { id: 'd5', text: '每天阅读不少于 15 分钟' },
      { id: 'd6', text: '每天运动 15 分钟' },
      { id: 'd7', text: '每日复盘' },
      { id: 'd8', text: '睡前写下 3 件开心的事' },
      { id: 'd9', text: '每天刷短视频不超过 20 分钟' },
      { id: 'd10', text: '用完的东西立即归位' },
      { id: 'd11', text: '晚上 7 点后不吃零食' },
      { id: 'd12', text: '每天练习某个技能 30 分钟' },
    ],
  },
  {
    id: 'week',
    label: '每周',
    kicker: '02 · 微习惯',
    blurb: '关系、空间与输出——周节奏把「生活」接回清单。',
    items: [
      { id: 'w1', text: '每周复盘与计划' },
      { id: 'w2', text: '给家人打电话' },
      { id: 'w3', text: '看 2–3 个 TED，并实践' },
      { id: 'w4', text: '断舍离（物理 / 数字）' },
      { id: 'w5', text: '彻底打扫一次卫生' },
      { id: 'w6', text: '内容输出（写 / 拍 / 记笔记）' },
      { id: 'w7', text: '采购日用品' },
      { id: 'w8', text: '在社交平台分享或记录生活' },
      { id: 'w9', text: '学会拒绝，不做老好人' },
      { id: 'w10', text: '练习发现并赞美他人' },
      { id: 'w11', text: '维护 5 段重要关系' },
      { id: 'w12', text: '做一件取悦自己的事' },
    ],
  },
  {
    id: 'month',
    label: '每月',
    kicker: '03 · 微习惯',
    blurb: '储蓄、复盘、挑战与人情——月度把尺度拉开一点。',
    items: [
      { id: 'm1', text: '强制储蓄 20%' },
      { id: 'm2', text: '写一篇月度复盘' },
      { id: 'm3', text: '规划下个月' },
      { id: 'm4', text: '换床单 / 除螨' },
      { id: 'm5', text: '整理衣柜与柜子' },
      { id: 'm6', text: '给父母发红包' },
      { id: 'm7', text: '完成一件有挑战的事（如公开演讲）' },
      { id: 'm8', text: '请家人或朋友吃顿好的' },
      { id: 'm9', text: '持续探索热爱的事业 / 爱好' },
      { id: 'm10', text: '短途旅行或探亲' },
      { id: 'm11', text: '和孩子一起完成一个挑战' },
      { id: 'm12', text: '复盘收支' },
    ],
  },
  {
    id: 'year',
    label: '每年',
    kicker: '04 · 微习惯',
    blurb: '体检、家庭、技能与财务——一年只抓几件真正重要的。',
    items: [
      { id: 'y1', text: '年度复盘' },
      { id: 'y2', text: '定下一年 3 个大目标' },
      { id: 'y3', text: '掌握一项新技能（如摄影、写作）' },
      { id: 'y4', text: '完成一件 bucket list' },
      { id: 'y5', text: '节日回家' },
      { id: 'y6', text: '全面体检' },
      { id: 'y7', text: '拍全家福' },
      { id: 'y8', text: '家庭旅行' },
      { id: 'y9', text: '清理不用的联系人 / 号码' },
      { id: 'y10', text: '整理手机照片、腾空间' },
      { id: 'y11', text: '复盘年度财务数据' },
      { id: 'y12', text: '和孩子一起回顾成长与失去' },
    ],
  },
  {
    id: 'long',
    label: '长期',
    kicker: '05 · 做长期正确的事',
    blurb: '原则不是打卡项——勾选表示「这周仍在对齐」，不是一次性完成。',
    items: [
      { id: 'l1', text: '永远相信自己' },
      { id: 'l2', text: '练习感恩' },
      { id: 'l3', text: '培养赚钱能力 / 副业' },
      { id: 'l4', text: '存钱，建立安全感' },
      { id: 'l5', text: '保持情绪稳定' },
      { id: 'l6', text: '远离有毒圈子与玻璃心环境' },
      { id: 'l7', text: '保持自己的节奏' },
      { id: 'l8', text: '主动解决问题，而不是逃避' },
      { id: 'l9', text: '明确个人价值观与边界' },
      { id: 'l10', text: '学会得体的仪表与着装' },
      { id: 'l11', text: '保持独立与内在力量' },
      { id: 'l12', text: '相信因果，创造未来' },
    ],
  },
];

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadChecked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dayStamp: todayKey(), checked: /** @type {Record<string, boolean>} */ ({}) };
    const parsed = JSON.parse(raw);
    const stamp = String(parsed.dayStamp || '');
    const checked = parsed.checked && typeof parsed.checked === 'object' ? parsed.checked : {};
    // Daily items (d1…d12) reset each calendar day; other cadences keep state.
    if (stamp !== todayKey()) {
      /** @type {Record<string, boolean>} */
      const next = {};
      for (const [id, v] of Object.entries(checked)) {
        if (/^d\d+$/.test(id)) continue;
        next[id] = Boolean(v);
      }
      return { dayStamp: todayKey(), checked: next };
    }
    return { dayStamp: stamp, checked: /** @type {Record<string, boolean>} */ (checked) };
  } catch {
    return { dayStamp: todayKey(), checked: {} };
  }
}

function saveChecked(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function loadFocus() {
  try {
    return localStorage.getItem(FOCUS_KEY) || '';
  } catch {
    return '';
  }
}

function saveFocus(id) {
  try {
    if (id) localStorage.setItem(FOCUS_KEY, id);
    else localStorage.removeItem(FOCUS_KEY);
  } catch {
    // ignore
  }
}

function loadTimerEndsAt() {
  try {
    const n = Number(localStorage.getItem(TIMER_KEY) || 0);
    return Number.isFinite(n) && n > Date.now() ? n : 0;
  } catch {
    return 0;
  }
}

function saveTimerEndsAt(endsAt) {
  try {
    if (endsAt) localStorage.setItem(TIMER_KEY, String(endsAt));
    else localStorage.removeItem(TIMER_KEY);
  } catch {
    // ignore
  }
}

function fmtRemain(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function findItem(id) {
  for (const c of CADENCES) {
    const item = c.items.find((i) => i.id === id);
    if (item) return { cadence: c, item };
  }
  return null;
}

/**
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 */
export function mountDailyExplorer(container, options = {}) {
  const compact = Boolean(options.compact);

  let store = loadChecked();
  let focusId = loadFocus();
  /** @type {string} */
  let active = 'day';
  let showPoster = !compact;
  /** @type {string} */
  let posterId = 'checklist';
  let timerEndsAt = loadTimerEndsAt();
  /** @type {'idle' | 'running' | 'done'} */
  let timerPhase = timerEndsAt ? 'running' : 'idle';
  /** @type {ReturnType<typeof setInterval> | null} */
  let timerTick = null;
  let disposed = false;

  const shell = document.createElement('section');
  shell.className = `daily-ex${compact ? ' daily-ex--compact' : ''}`;
  shell.setAttribute('aria-label', '日常节奏与自律清单');

  function stopTick() {
    if (timerTick) {
      clearInterval(timerTick);
      timerTick = null;
    }
  }

  function remainingMs() {
    if (!timerEndsAt) return TIMER_MS;
    return Math.max(0, timerEndsAt - Date.now());
  }

  function paintTimer() {
    const face = shell.querySelector('[data-timer-face]');
    const bar = shell.querySelector('[data-timer-bar]');
    if (!face) return;
    const left = remainingMs();
    if (timerPhase === 'running' && left <= 0) {
      timerPhase = 'done';
      timerEndsAt = 0;
      saveTimerEndsAt(0);
      stopTick();
      render();
      return;
    }
    face.textContent = timerPhase === 'idle' ? '20:00' : timerPhase === 'done' ? '完成' : fmtRemain(left);
    if (bar) {
      const pct =
        timerPhase === 'idle' ? 0 : timerPhase === 'done' ? 100 : Math.round(((TIMER_MS - left) / TIMER_MS) * 100);
      /** @type {HTMLElement} */ (bar).style.width = `${pct}%`;
    }
  }

  function startTick() {
    stopTick();
    if (timerPhase !== 'running') return;
    paintTimer();
    timerTick = setInterval(() => {
      if (disposed) {
        stopTick();
        return;
      }
      paintTimer();
    }, 250);
  }

  function startTimer() {
    timerEndsAt = Date.now() + TIMER_MS;
    saveTimerEndsAt(timerEndsAt);
    timerPhase = 'running';
    render();
    startTick();
  }

  function resetTimer() {
    stopTick();
    timerEndsAt = 0;
    saveTimerEndsAt(0);
    timerPhase = 'idle';
    render();
  }

  function progressFor(cadenceId) {
    const c = CADENCES.find((x) => x.id === cadenceId);
    if (!c) return { done: 0, total: 0, pct: 0 };
    const total = c.items.length;
    const done = c.items.filter((i) => store.checked[i.id]).length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function overall() {
    const all = CADENCES.flatMap((c) => c.items);
    const done = all.filter((i) => store.checked[i.id]).length;
    return { done, total: all.length, pct: Math.round((done / all.length) * 100) };
  }

  function toggle(id) {
    store.checked[id] = !store.checked[id];
    store.dayStamp = todayKey();
    saveChecked(store);
  }

  function setFocus(id) {
    focusId = focusId === id ? '' : id;
    saveFocus(focusId);
  }

  function resetCadence(cadenceId) {
    const c = CADENCES.find((x) => x.id === cadenceId);
    if (!c) return;
    for (const i of c.items) delete store.checked[i.id];
    store.dayStamp = todayKey();
    saveChecked(store);
  }

  function render() {
    if (disposed) return;
    const cadence = CADENCES.find((c) => c.id === active) || CADENCES[0];
    const prog = progressFor(cadence.id);
    const all = overall();
    const focusHit = focusId ? findItem(focusId) : null;
    const poster = POSTERS.find((p) => p.id === posterId) || POSTERS[0];
    const left = remainingMs();
    const timerPct =
      timerPhase === 'idle' ? 0 : timerPhase === 'done' ? 100 : Math.round(((TIMER_MS - left) / TIMER_MS) * 100);
    const timerLabel = timerPhase === 'idle' ? '20:00' : timerPhase === 'done' ? '完成' : fmtRemain(left);
    const shichen = currentShichen();

    const rings = CADENCES.map((c) => {
      const p = progressFor(c.id);
      const r = 18;
      const circ = 2 * Math.PI * r;
      const dash = (p.pct / 100) * circ;
      return `
        <button type="button" class="daily-ex__ring${active === c.id ? ' is-active' : ''}" data-cadence="${c.id}" title="${escapeHtml(c.label)} ${p.done}/${p.total}">
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle class="daily-ex__ring-bg" cx="22" cy="22" r="${r}" />
            <circle class="daily-ex__ring-fg" cx="22" cy="22" r="${r}"
              stroke-dasharray="${dash} ${circ}" transform="rotate(-90 22 22)" />
          </svg>
          <span>${escapeHtml(c.label)}</span>
          <em>${p.pct}%</em>
        </button>`;
    }).join('');

    shell.innerHTML = `
      <header class="daily-ex__hero">
        <div class="daily-ex__hero-copy">
          <p class="daily-ex__eyebrow">DAILY · RHYTHM</p>
          <h2 class="daily-ex__brand">日常</h2>
          <p class="daily-ex__lede">慢慢吸收的节奏板：日 / 周 / 月 / 年微习惯、长期原则、20 分钟启动定律，以及人生备选单阅读地图。背景为故宫十二时辰全景（按上海本地时间对准当前时辰）。</p>
          <div class="daily-ex__hero-actions">
            <a class="daily-ex__link" href="#/note/daily/2026-self-discipline-checklist">自律清单笔记 →</a>
            <a class="daily-ex__link" href="#/note/daily/20-minute-rule">20 分钟定律 →</a>
            <a class="daily-ex__link" href="#/note/daily/howto-live-better">HowToLiveBetter →</a>
            ${compact ? '<a class="daily-ex__link" href="#/daily">打开完整页 →</a>' : ''}
            <button type="button" class="daily-ex__linkish" data-toggle-poster>${showPoster ? '收起海报' : '展开海报'}</button>
          </div>
        </div>
        <div class="daily-ex__hero-stat" aria-label="总进度">
          <strong>${all.pct}%</strong>
          <span>总对齐 ${all.done} / ${all.total}</span>
          <div class="daily-ex__bar"><i style="width:${all.pct}%"></i></div>
        </div>
      </header>

      ${
        compact
          ? ''
          : `<p class="daily-ex__shichen-meta">此刻（Asia/Shanghai）：<strong>${escapeHtml(shichen.name)}时</strong> · ${escapeHtml(shichen.range)} — 背景已对准该竖条</p>
            <div class="daily-ex__shichen" role="list" aria-label="十二时辰">
              ${SHICHEN_LIST.map(
                (s) => `
                <div class="daily-ex__shichen-cell${s.index === shichen.index ? ' is-now' : ''}" role="listitem" title="${escapeHtml(s.name)}时 ${escapeHtml(s.range)}">
                  <strong>${escapeHtml(s.name)}</strong>
                  <em>${escapeHtml(s.range.split('–')[0] || '')}</em>
                </div>`,
              ).join('')}
            </div>`
      }

      <section class="daily-ex__timer${timerPhase === 'running' ? ' is-running' : ''}${timerPhase === 'done' ? ' is-done' : ''}" aria-label="20 分钟启动计时">
        <div class="daily-ex__timer-copy">
          <p class="daily-ex__kicker">20 分钟定律</p>
          <h3 class="daily-ex__timer-title">先启动，再谈动力</h3>
          <p class="daily-ex__timer-blurb">只承诺 20 分钟。过了启动段，阻力常会下降——学习、运动、家务都适用。</p>
        </div>
        <div class="daily-ex__timer-face-wrap">
          <p class="daily-ex__timer-face" data-timer-face>${escapeHtml(timerLabel)}</p>
          <div class="daily-ex__timer-track"><i data-timer-bar style="width:${timerPct}%"></i></div>
          <div class="daily-ex__timer-actions">
            ${
              timerPhase === 'running'
                ? `<button type="button" class="daily-ex__btn" data-timer-reset>放弃本次</button>`
                : `<button type="button" class="daily-ex__btn daily-ex__btn--accent" data-timer-start>${timerPhase === 'done' ? '再来 20 分钟' : '开始 20 分钟'}</button>`
            }
            ${timerPhase === 'done' ? '<span class="daily-ex__timer-ok">启动段完成 · 若已进入状态，可继续做下去</span>' : ''}
          </div>
        </div>
      </section>

      ${
        focusHit
          ? `<div class="daily-ex__focus" role="status">
              <span class="daily-ex__focus-kicker">此刻对齐</span>
              <p>${escapeHtml(focusHit.item.text)}</p>
              <button type="button" class="daily-ex__ghost" data-clear-focus>取消聚焦</button>
            </div>`
          : `<p class="daily-ex__hint">点条目旁的「聚焦」只盯一条；抗拒动手时，用上方 20 分钟计时先启动。</p>`
      }

      <div class="daily-ex__rings" role="tablist" aria-label="节奏">${rings}</div>

      <div class="daily-ex__stage">
        <div class="daily-ex__panel">
          <div class="daily-ex__panel-head">
            <div>
              <p class="daily-ex__kicker">${escapeHtml(cadence.kicker)}</p>
              <h3 class="daily-ex__panel-title">${escapeHtml(cadence.label)}微习惯</h3>
              <p class="daily-ex__panel-blurb">${escapeHtml(cadence.blurb)}</p>
            </div>
            <div class="daily-ex__panel-meta">
              <span>${prog.done}/${prog.total}</span>
              <button type="button" class="daily-ex__ghost" data-reset-cadence>清空本节</button>
            </div>
          </div>
          <div class="daily-ex__progress"><i style="width:${prog.pct}%"></i></div>
          <ul class="daily-ex__list">
            ${cadence.items
              .map((item, idx) => {
                const on = Boolean(store.checked[item.id]);
                const focused = focusId === item.id;
                return `
                  <li class="daily-ex__item${on ? ' is-done' : ''}${focused ? ' is-focus' : ''}">
                    <label class="daily-ex__check">
                      <input type="checkbox" data-check="${escapeHtml(item.id)}" ${on ? 'checked' : ''} />
                      <span class="daily-ex__num">${String(idx + 1).padStart(2, '0')}</span>
                      <span class="daily-ex__text">${escapeHtml(item.text)}</span>
                    </label>
                    <button type="button" class="daily-ex__focus-btn" data-focus="${escapeHtml(item.id)}" aria-pressed="${focused}">${focused ? '聚焦中' : '聚焦'}</button>
                  </li>`;
              })
              .join('')}
          </ul>
        </div>

        ${
          showPoster && !compact
            ? `<aside class="daily-ex__poster">
                <p class="daily-ex__kicker">海报库</p>
                <div class="daily-ex__poster-tabs" role="tablist">
                  ${POSTERS.map(
                    (p) =>
                      `<button type="button" class="daily-ex__poster-tab${posterId === p.id ? ' is-active' : ''}" data-poster="${escapeHtml(p.id)}">${escapeHtml(p.title)}</button>`,
                  ).join('')}
                </div>
                <figure>
                  <img src="${escapeHtml(poster.src)}" alt="${escapeHtml(poster.alt)}" loading="lazy" />
                  <figcaption>${escapeHtml(poster.caption)} · <a href="${escapeHtml(poster.note)}">笔记</a></figcaption>
                </figure>
              </aside>`
            : ''
        }
      </div>

      ${
        compact
          ? ''
          : `<p class="daily-ex__credit">本机 localStorage 记忆勾选与 20 分钟计时；每日项按自然日清零。原则区「长期」用勾选表示本周仍在对齐。</p>`
      }
    `;

    bind();
    if (timerPhase === 'running') startTick();
  }

  function bind() {
    shell.querySelectorAll('[data-cadence]').forEach((btn) => {
      btn.addEventListener('click', () => {
        active = btn.getAttribute('data-cadence') || 'day';
        render();
      });
    });

    shell.querySelectorAll('[data-check]').forEach((input) => {
      input.addEventListener('change', () => {
        const id = input.getAttribute('data-check');
        if (id) toggle(id);
        render();
      });
    });

    shell.querySelectorAll('[data-focus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-focus');
        if (id) setFocus(id);
        render();
      });
    });

    shell.querySelector('[data-clear-focus]')?.addEventListener('click', () => {
      focusId = '';
      saveFocus('');
      render();
    });

    shell.querySelector('[data-reset-cadence]')?.addEventListener('click', () => {
      resetCadence(active);
      render();
    });

    shell.querySelector('[data-toggle-poster]')?.addEventListener('click', () => {
      showPoster = !showPoster;
      render();
    });

    shell.querySelectorAll('[data-poster]').forEach((btn) => {
      btn.addEventListener('click', () => {
        posterId = btn.getAttribute('data-poster') || 'checklist';
        render();
      });
    });

    shell.querySelector('[data-timer-start]')?.addEventListener('click', () => startTimer());
    shell.querySelector('[data-timer-reset]')?.addEventListener('click', () => resetTimer());
  }

  render();
  container.appendChild(shell);

  return {
    dispose() {
      disposed = true;
      stopTick();
      shell.remove();
    },
  };
}
