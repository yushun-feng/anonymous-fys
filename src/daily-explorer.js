/**
 * Daily Rhythm Explorer — interactive self-discipline checklist.
 * Cadence tabs (日/周/月/年/长期), checkable items, local progress, poster.
 * Chinese UI. Teaching / personal rhythm — not a productivity SaaS.
 */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STORAGE_KEY = 'anonymous-fys-daily-checklist-v1';
const FOCUS_KEY = 'anonymous-fys-daily-focus-v1';

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

const BASE = import.meta.env.BASE_URL || '/';
const POSTER_SRC = `${BASE.endsWith('/') ? BASE : `${BASE}/`}notes-assets/daily/2026-self-discipline-checklist.png`;

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
  let disposed = false;

  const shell = document.createElement('section');
  shell.className = `daily-ex${compact ? ' daily-ex--compact' : ''}`;
  shell.setAttribute('aria-label', '日常节奏与自律清单');

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
          <p class="daily-ex__lede">慢慢吸收的节奏板：日 / 周 / 月 / 年微习惯，外加长期原则。勾选记在本机；每日项会按日历日重置。</p>
          <div class="daily-ex__hero-actions">
            <a class="daily-ex__link" href="#/note/daily/2026-self-discipline-checklist">笔记正文 →</a>
            ${compact ? '<a class="daily-ex__link" href="#/daily">打开完整页 →</a>' : ''}
            <button type="button" class="daily-ex__linkish" data-toggle-poster>${showPoster ? '收起原图' : '展开原图'}</button>
          </div>
        </div>
        <div class="daily-ex__hero-stat" aria-label="总进度">
          <strong>${all.pct}%</strong>
          <span>总对齐 ${all.done} / ${all.total}</span>
          <div class="daily-ex__bar"><i style="width:${all.pct}%"></i></div>
        </div>
      </header>

      ${
        focusHit
          ? `<div class="daily-ex__focus" role="status">
              <span class="daily-ex__focus-kicker">此刻对齐</span>
              <p>${escapeHtml(focusHit.item.text)}</p>
              <button type="button" class="daily-ex__ghost" data-clear-focus>取消聚焦</button>
            </div>`
          : `<p class="daily-ex__hint">点条目旁的「聚焦」只盯一条——比一次勾完更接近「慢慢消化」。</p>`
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
                <p class="daily-ex__kicker">原图海报</p>
                <figure>
                  <img src="${escapeHtml(POSTER_SRC)}" alt="2026年顶级自律清单原图" loading="lazy" />
                  <figcaption>可检索正文见笔记；此处保留版式原貌。</figcaption>
                </figure>
              </aside>`
            : ''
        }
      </div>

      ${
        compact
          ? ''
          : `<p class="daily-ex__credit">本机 localStorage 记忆勾选；每日项按自然日清零。原则区「长期」用勾选表示本周仍在对齐。</p>`
      }
    `;

    bind();
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
  }

  render();
  container.appendChild(shell);

  return {
    dispose() {
      disposed = true;
      shell.remove();
    },
  };
}
