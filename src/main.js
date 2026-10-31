import 'highlight.js/styles/github-dark.min.css';
import { loadNotes, getNoteById } from './notes.js';
import { renderMarkdown, escapeHtml } from './render.js';
import { isUnlocked, renderGate } from './gate.js';
import {
  mountPlayground,
  bindPlaygroundChrome,
  bindCodeBlockActions,
} from './playground.js';

const TOPICS = ['cpp', 'graphics', 'gpu'];
const TOPIC_LABELS = {
  cpp: 'C++',
  graphics: 'Graphics',
  gpu: 'GPU',
};

/** Active Three.js solar-system instance; disposed on every remount. */
let solarHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let solarMountGen = 0;
/** Whether the browse+playground shell has been created after unlock. */
let shellReady = false;

function disposeSolar() {
  solarMountGen += 1;
  solarHandle?.dispose();
  solarHandle = null;
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '');
  const pathPart = raw.split('?')[0].replace(/^\//, '');
  if (!pathPart || pathPart === 'home') return { name: 'home' };
  // Prefer #/solar; keep #/moon as a redirect alias.
  if (pathPart === 'solar' || pathPart === 'moon') return { name: 'solar' };
  if (pathPart.startsWith('note/')) {
    return { name: 'note', id: decodeURIComponent(pathPart.slice(5)) };
  }
  return { name: 'home' };
}

function layout(content) {
  return `
    <header class="site-header">
      <a class="brand" href="#/">anonymous-fys</a>
      <nav class="site-nav" aria-label="站点导航">
        <a href="#/">笔记</a>
        <a href="#/solar">太阳系</a>
      </nav>
      <p class="tagline">C++ · Graphics · GPU — 公开技术笔记浏览</p>
    </header>
    <main class="site-main">${content}</main>
    <footer class="site-footer">
      <span>知识正文在 <code>notes/</code>；本页仅为查看器。</span>
    </footer>
  `;
}

function tagPills(tags, activeTag) {
  return tags
    .map((tag) => {
      const active = tag === activeTag ? ' is-active' : '';
      return `<button type="button" class="tag-pill${active}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`;
    })
    .join('');
}

function renderHome() {
  const notes = loadNotes();
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const filterTopic = params.get('topic') || '';
  const filterTag = params.get('tag') || '';

  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort();

  const filtered = notes.filter((n) => {
    if (filterTopic && n.topic !== filterTopic) return false;
    if (filterTag && !n.tags.includes(filterTag)) return false;
    return true;
  });

  const topicFilters = TOPICS.map((topic) => {
    const active = filterTopic === topic ? ' is-active' : '';
    return `<button type="button" class="topic-chip${active}" data-topic="${topic}">${TOPIC_LABELS[topic] || topic}</button>`;
  }).join('');

  const byTopic = TOPICS.map((topic) => {
    const group = filtered.filter((n) => n.topic === topic);
    if (!group.length) return '';
    const items = group
      .map(
        (n) => `
      <li class="note-card">
        <a href="#/note/${encodeURIComponent(n.id)}">
          <span class="note-title">${escapeHtml(n.title)}</span>
          <span class="note-meta">${escapeHtml(n.updated)} · ${n.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}</span>
        </a>
      </li>`,
      )
      .join('');
    return `
      <section class="topic-section">
        <h2>${TOPIC_LABELS[topic] || topic}</h2>
        <ul class="note-list">${items}</ul>
      </section>`;
  }).join('');

  return layout(`
    <div class="solar-home-slot" data-solar-mount data-solar-compact></div>
    <p class="solar-home-link"><a href="#/solar">打开完整太阳系展台 →</a></p>
    <section class="filters">
      <div class="filter-row">
        <span class="filter-label">Topic</span>
        <button type="button" class="topic-chip${!filterTopic ? ' is-active' : ''}" data-topic="">全部</button>
        ${topicFilters}
      </div>
      <div class="filter-row tags-row">
        <span class="filter-label">Tags</span>
        <button type="button" class="tag-pill${!filterTag ? ' is-active' : ''}" data-tag="">全部</button>
        ${tagPills(allTags, filterTag)}
      </div>
    </section>
    <p class="result-count">${filtered.length} 篇笔记</p>
    ${byTopic || '<p class="empty">没有匹配的笔记。</p>'}
  `);
}

function renderSolarPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>太阳系</span></nav>
    <div class="solar-page-slot" data-solar-mount></div>
    <p class="solar-credit">纹理来源见仓库 README「太阳系纹理」一节。轨道与尺寸为可读性示意，非真实比例。</p>
  `);
}

function renderNote(id) {
  const note = getNoteById(id);
  if (!note) {
    return layout(`
      <p class="empty">未找到笔记：<code>${escapeHtml(id)}</code></p>
      <p><a href="#/">← 返回首页</a></p>
    `);
  }

  const html = renderMarkdown(note.body);
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>${escapeHtml(TOPIC_LABELS[note.topic] || note.topic)}</span></nav>
    <article class="note-article">
      <header class="note-header">
        <h1>${escapeHtml(note.title)}</h1>
        <p class="note-meta">
          <span class="topic-badge">${escapeHtml(note.topic)}</span>
          ${note.tags.map((t) => `<span class="tag-inline">#${escapeHtml(t)}</span>`).join('')}
          <time datetime="${escapeHtml(note.updated)}">更新 ${escapeHtml(note.updated)}</time>
        </p>
      </header>
      <div class="markdown-body">${html}</div>
    </article>
  `);
}

function setHomeFilters({ topic, tag }) {
  const params = new URLSearchParams();
  if (topic) params.set('topic', topic);
  if (tag) params.set('tag', tag);
  const qs = params.toString();
  window.location.hash = qs ? `/?${qs}` : '/';
}

function bindHomeFilters(root) {
  root.querySelectorAll('[data-topic]').forEach((el) => {
    el.addEventListener('click', () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const topic = el.getAttribute('data-topic') || '';
      setHomeFilters({
        topic,
        tag: params.get('tag') || '',
      });
    });
  });
  root.querySelectorAll('[data-tag]').forEach((el) => {
    el.addEventListener('click', () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      const tag = el.getAttribute('data-tag') || '';
      setHomeFilters({
        topic: params.get('topic') || '',
        tag,
      });
    });
  });
}

async function mountSolarIfPresent(root) {
  const slot = root.querySelector('[data-solar-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-solar-compact');
  const gen = solarMountGen;
  try {
    const { mountSolarSystemWidget } = await import('./solar-system-widget.js');
    if (gen !== solarMountGen || !slot.isConnected) return;
    solarHandle = mountSolarSystemWidget(slot, { compact });
  } catch {
    if (gen !== solarMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="solar-widget__fallback">三维太阳系模块加载失败，笔记浏览不受影响。</p>';
  }
}

/**
 * Ensure browse + playground shell exists; return the browse pane to fill.
 * Playground mounts once so hash navigations keep editor state.
 * @returns {HTMLElement | null}
 */
function ensureShell() {
  const app = document.querySelector('#app');
  if (!app) return null;

  if (shellReady) {
    const browse = app.querySelector('[data-browse-pane]');
    if (browse) return browse;
    shellReady = false;
  }

  app.innerHTML = `
    <div class="app-shell">
      <div class="browse-pane" data-browse-pane></div>
      <div
        class="playground-splitter"
        data-playground-splitter
        role="separator"
        aria-orientation="vertical"
        aria-label="调整 Playground 宽度"
        tabindex="0"
      ></div>
      <aside class="playground-pane" data-playground-pane aria-label="代码 Playground"></aside>
    </div>
  `;

  const browse = /** @type {HTMLElement} */ (app.querySelector('[data-browse-pane]'));
  const pane = /** @type {HTMLElement} */ (app.querySelector('[data-playground-pane]'));
  const splitter = /** @type {HTMLElement} */ (app.querySelector('[data-playground-splitter]'));
  const shell = /** @type {HTMLElement} */ (app.querySelector('.app-shell'));

  mountPlayground(pane);
  bindPlaygroundChrome(shell, splitter, pane);
  shellReady = true;
  return browse;
}

function mountContent() {
  const browse = ensureShell();
  if (!browse) return;

  disposeSolar();

  const route = parseRoute();
  // Normalize legacy #/moon → #/solar without breaking history mid-render.
  const rawPath = window.location.hash.replace(/^#/, '').split('?')[0].replace(/^\//, '');
  if (rawPath === 'moon') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/solar`);
    return;
  }

  if (route.name === 'note') {
    browse.innerHTML = renderNote(route.id);
    bindCodeBlockActions(browse);
  } else if (route.name === 'solar') {
    browse.innerHTML = renderSolarPage();
    mountSolarIfPresent(browse);
  } else {
    browse.innerHTML = renderHome();
    bindHomeFilters(browse);
    mountSolarIfPresent(browse);
  }
}

function mount() {
  const app = document.querySelector('#app');
  if (!app) return;

  if (!isUnlocked()) {
    shellReady = false;
    renderGate(app, {
      onSuccess: () => {
        mountContent();
      },
    });
    return;
  }

  mountContent();
}

window.addEventListener('hashchange', () => {
  if (!isUnlocked()) return;
  mountContent();
});
mount();
