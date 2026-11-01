import 'highlight.js/styles/github-dark.min.css';
import { loadNotes, getNoteById } from './notes.js';
import { renderMarkdown, escapeHtml } from './render.js';
import { isUnlocked, renderGate } from './gate.js';
import {
  mountPlayground,
  bindPlaygroundChrome,
  bindCodeBlockActions,
} from './playground.js';
import { mountPersonalNotes } from './personal-notes.js';
import { startVisitLogging } from './visit-log.js';

const TOPICS = ['cpp', 'graphics', 'gpu'];
const TOPIC_LABELS = {
  cpp: 'C++',
  graphics: 'Graphics',
  gpu: 'GPU',
};

/** Active Three.js Yingxian pagoda instance; disposed on every remount. */
let pagodaHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let pagodaMountGen = 0;
/** Active WebGL shader-toy instance; disposed on every remount. */
let shaderHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let shaderMountGen = 0;
/** Whether the browse+playground shell has been created after unlock. */
let shellReady = false;
/** Active personal-notes panel; disposed on every remount / navigate-away. */
let personalNotesHandle = null;

function disposePagoda() {
  pagodaMountGen += 1;
  pagodaHandle?.dispose();
  pagodaHandle = null;
}

function disposeShader() {
  shaderMountGen += 1;
  shaderHandle?.dispose();
  shaderHandle = null;
}

function disposePersonalNotes() {
  personalNotesHandle?.dispose();
  personalNotesHandle = null;
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '');
  const pathPart = raw.split('?')[0].replace(/^\//, '');
  if (!pathPart || pathPart === 'home') return { name: 'home' };
  // Prefer #/pagoda; keep #/portal, #/solar, #/moon as redirect aliases.
  if (
    pathPart === 'pagoda' ||
    pathPart === 'portal' ||
    pathPart === 'solar' ||
    pathPart === 'moon'
  ) {
    return { name: 'pagoda' };
  }
  if (pathPart === 'shader') return { name: 'shader' };
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
        <a href="#/pagoda">木塔</a>
        <a href="#/shader">Shader</a>
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
    <div class="pagoda-home-slot" data-pagoda-mount data-pagoda-compact></div>
    <p class="pagoda-home-link"><a href="#/pagoda">打开完整应县木塔展台 →</a></p>
    <div class="shader-home-slot" data-shader-mount data-shader-compact></div>
    <p class="shader-home-link"><a href="#/shader">打开完整 Shader Toy →</a></p>
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

function renderPagodaPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>应县木塔</span></nav>
    <div class="pagoda-page-slot" data-pagoda-mount></div>
    <p class="pagoda-credit">佛宫寺释迦塔（应县木塔）三维模型来自 <a href="https://github.com/huangbai-AI/yingxian-pagoda" rel="noopener noreferrer" target="_blank">huangbai-AI/yingxian-pagoda</a>（yingxian-v20，本站二次压缩以加快加载）；科普展示性重建，非文物测绘。木纹素材见上游说明（Poly Haven CC0）。</p>
  `);
}

function renderShaderPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>Shader Toy</span></nav>
    <div class="shader-page-slot" data-shader-mount></div>
    <p class="shader-credit">原生 WebGL 全屏四边形 + 片段着色器；CodeMirror 编辑 GLSL，应用/防抖自动重编译，并保留预设与 uniform 滑条。非 Shadertoy.com 嵌入。</p>
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
      <div class="personal-notes-slot" data-personal-notes-mount></div>
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

async function mountPagodaIfPresent(root) {
  const slot = root.querySelector('[data-pagoda-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-pagoda-compact');
  const gen = pagodaMountGen;
  try {
    const { mountYingxianPagodaWidget } = await import('./yingxian-pagoda-widget.js');
    if (gen !== pagodaMountGen || !slot.isConnected) return;
    pagodaHandle = mountYingxianPagodaWidget(slot, { compact });
  } catch {
    if (gen !== pagodaMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="pagoda-widget__fallback">三维木塔展台加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountShaderIfPresent(root) {
  const slot = root.querySelector('[data-shader-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-shader-compact');
  const gen = shaderMountGen;
  try {
    const { mountShaderToy } = await import('./shader-toy.js');
    if (gen !== shaderMountGen || !slot.isConnected) return;
    shaderHandle = mountShaderToy(slot, { compact });
  } catch {
    if (gen !== shaderMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="shader-toy__fallback">Shader Toy 模块加载失败，笔记浏览不受影响。</p>';
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

  disposePagoda();
  disposeShader();
  disposePersonalNotes();

  const route = parseRoute();
  // Normalize legacy showcase hashes → #/pagoda.
  const rawPath = window.location.hash.replace(/^#/, '').split('?')[0].replace(/^\//, '');
  if (rawPath === 'portal' || rawPath === 'solar' || rawPath === 'moon') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/pagoda`);
    return;
  }

  if (route.name === 'note') {
    browse.innerHTML = renderNote(route.id);
    bindCodeBlockActions(browse);
    const note = getNoteById(route.id);
    const slot = browse.querySelector('[data-personal-notes-mount]');
    if (note && slot) {
      personalNotesHandle = mountPersonalNotes(/** @type {HTMLElement} */ (slot), note);
    }
  } else if (route.name === 'pagoda') {
    browse.innerHTML = renderPagodaPage();
    mountPagodaIfPresent(browse);
  } else if (route.name === 'shader') {
    browse.innerHTML = renderShaderPage();
    mountShaderIfPresent(browse);
  } else {
    browse.innerHTML = renderHome();
    bindHomeFilters(browse);
    mountPagodaIfPresent(browse);
    mountShaderIfPresent(browse);
  }
}

function mount() {
  const app = document.querySelector('#app');
  if (!app) return;

  // Access logging runs even on the soft gate (external visitors who bounce).
  startVisitLogging();

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
