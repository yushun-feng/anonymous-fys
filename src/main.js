import 'highlight.js/styles/github-dark.min.css';
import { loadNotes, getNoteById } from './notes.js';
import { renderMarkdown, escapeHtml } from './render.js';
import { isUnlocked, renderGate } from './gate.js';

const TOPICS = ['cpp', 'graphics', 'gpu'];
const TOPIC_LABELS = {
  cpp: 'C++',
  graphics: 'Graphics',
  gpu: 'GPU',
};

/** Active Three.js moon instance; disposed on every remount. */
let moonHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let moonMountGen = 0;

function disposeMoon() {
  moonMountGen += 1;
  moonHandle?.dispose();
  moonHandle = null;
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '');
  const pathPart = raw.split('?')[0].replace(/^\//, '');
  if (!pathPart || pathPart === 'home') return { name: 'home' };
  if (pathPart === 'moon') return { name: 'moon' };
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
        <a href="#/moon">月球</a>
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
    <div class="moon-home-slot" data-moon-mount data-moon-compact></div>
    <p class="moon-home-link"><a href="#/moon">打开完整月球展台 →</a></p>
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

function renderMoonPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>月球</span></nav>
    <div class="moon-page-slot" data-moon-mount></div>
    <p class="moon-credit">纹理来源见仓库 README「月球纹理」一节。</p>
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

async function mountMoonIfPresent(root) {
  const slot = root.querySelector('[data-moon-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-moon-compact');
  const gen = moonMountGen;
  try {
    const { mountMoonWidget } = await import('./moon-widget.js');
    if (gen !== moonMountGen || !slot.isConnected) return;
    moonHandle = mountMoonWidget(slot, { compact });
  } catch {
    if (gen !== moonMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="moon-widget__fallback">三维月球模块加载失败，笔记浏览不受影响。</p>';
  }
}

function mountContent() {
  const app = document.querySelector('#app');
  if (!app) return;

  disposeMoon();

  const route = parseRoute();
  if (route.name === 'note') {
    app.innerHTML = renderNote(route.id);
  } else if (route.name === 'moon') {
    app.innerHTML = renderMoonPage();
    mountMoonIfPresent(app);
  } else {
    app.innerHTML = renderHome();
    bindHomeFilters(app);
    mountMoonIfPresent(app);
  }
}

function mount() {
  const app = document.querySelector('#app');
  if (!app) return;

  if (!isUnlocked()) {
    renderGate(app, { onSuccess: mountContent });
    return;
  }

  mountContent();
}

window.addEventListener('hashchange', () => {
  if (!isUnlocked()) return;
  mountContent();
});
mount();
