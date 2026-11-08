import 'highlight.js/styles/github-dark.min.css';
import 'katex/dist/katex.min.css';
import { loadNotes, getNoteById } from './notes.js';
import { renderMarkdown, escapeHtml, runMermaidIn } from './render.js';
import { isUnlocked, renderGate } from './gate.js';
import {
  mountPlayground,
  unmountPlayground,
  bindPlaygroundChrome,
  bindCodeBlockActions,
} from './playground.js';
import { mountPersonalNotes } from './personal-notes.js';
import {
  mountNoteReadingProgress,
  loadReadingProgress,
  getLastNoteId,
  marksForNote,
  noteListItemHtml,
  continueReadingBannerHtml,
} from './reading-progress.js';
import { startVisitLogging } from './visit-log.js';
import { applyShichenAtmosphere } from './shichen.js';

/** @type {{ dispose: () => void } | null} */
let graphicsLabHandle = null;
/** Refresh 时辰 focus when the Shanghai wall-clock crosses a slice. */
let shichenTimer = null;
/** @type {'playground' | 'graphics-lab'} */
let sidePanelMode = 'playground';

const TOPICS = ['cpp', 'graphics', 'gpu', 'linux', 'ai', 'opensource', 'daily'];
const TOPIC_LABELS = {
  cpp: 'C++',
  graphics: 'Graphics',
  gpu: 'GPU',
  linux: 'Linux',
  ai: 'AI',
  opensource: '开源',
  daily: '日常',
};

/** Active Three.js Yingxian pagoda instance; disposed on every remount. */
let pagodaHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let pagodaMountGen = 0;
/** Active WebGL shader-toy instance; disposed on every remount. */
let shaderHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let shaderMountGen = 0;
/** Active Protocol Explorer instance; disposed on every remount. */
let protocolHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let protocolMountGen = 0;
/** Active Linux Systems Explorer instance; disposed on every remount. */
let linuxSysHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let linuxSysMountGen = 0;
/** Active Memory Layout Sandbox instance; disposed on every remount. */
let memoryHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let memoryMountGen = 0;
/** Active Transform Explorer instance; disposed on every remount. */
let transformHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let transformMountGen = 0;
/** Active Pointer Ops Explorer instance; disposed on every remount. */
let pointerHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let pointerMountGen = 0;
/** Active Daily Rhythm Explorer instance; disposed on every remount. */
let dailyHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let dailyMountGen = 0;
/** Active AI Timeline Explorer instance; disposed on every remount. */
let aiHandle = null;
/** Bumps on remount so a late dynamic import does not attach after navigate-away. */
let aiMountGen = 0;
/** Whether the browse+playground shell has been created after unlock. */
let shellReady = false;
/** Active personal-notes panel; disposed on every remount / navigate-away. */
let personalNotesHandle = null;
/** Active note reading-progress tracker; disposed on every remount / navigate-away. */
let readingProgressHandle = null;
/** Active local-only private gallery; disposed on every remount / navigate-away. */
let localGalleryHandle = null;

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

function disposeProtocol() {
  protocolMountGen += 1;
  protocolHandle?.dispose();
  protocolHandle = null;
}

function disposeLinuxSys() {
  linuxSysMountGen += 1;
  linuxSysHandle?.dispose();
  linuxSysHandle = null;
}

function disposeMemory() {
  memoryMountGen += 1;
  memoryHandle?.dispose();
  memoryHandle = null;
}

function disposeTransform() {
  transformMountGen += 1;
  transformHandle?.dispose();
  transformHandle = null;
}

function disposePointer() {
  pointerMountGen += 1;
  pointerHandle?.dispose();
  pointerHandle = null;
}

function disposeDaily() {
  dailyMountGen += 1;
  dailyHandle?.dispose();
  dailyHandle = null;
}

function disposeAi() {
  aiMountGen += 1;
  aiHandle?.dispose();
  aiHandle = null;
}

function disposePersonalNotes() {
  personalNotesHandle?.dispose();
  personalNotesHandle = null;
}

function disposeReadingProgress() {
  readingProgressHandle?.dispose();
  readingProgressHandle = null;
}

function disposeLocalGallery() {
  localGalleryHandle?.dispose();
  localGalleryHandle = null;
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
  if (pathPart === 'protocols' || pathPart === 'protocol') {
    return { name: 'protocols' };
  }
  if (
    pathPart === 'linux' ||
    pathPart === 'boot' ||
    pathPart === 'fs' ||
    pathPart === 'perm' ||
    pathPart === 'perms' ||
    pathPart === 'permissions'
  ) {
    /** @type {'boot'|'fs'|'perm'} */
    let domain = 'boot';
    if (pathPart === 'fs') domain = 'fs';
    else if (pathPart === 'perm' || pathPart === 'perms' || pathPart === 'permissions') {
      domain = 'perm';
    }
    return { name: 'linux', domain };
  }
  if (pathPart === 'memory' || pathPart === 'mem') {
    return { name: 'memory' };
  }
  if (pathPart === 'transform' || pathPart === 'math' || pathPart === 'linalg') {
    return { name: 'transform' };
  }
  if (pathPart === 'pointers' || pathPart === 'pointer' || pathPart === 'ptr') {
    return { name: 'pointers' };
  }
  if (pathPart === 'daily' || pathPart === 'habits' || pathPart === 'rhythm') {
    return { name: 'daily' };
  }
  if (
    pathPart === 'opensource' ||
    pathPart === 'oss' ||
    pathPart === 'reading' ||
    pathPart === 'hellogithub'
  ) {
    return { name: 'opensource' };
  }
  if (pathPart === 'ai' || pathPart === 'ai-history' || pathPart === 'history-of-ai') {
    return { name: 'ai' };
  }
  // Local-only private gallery — never linked from public nav/home.
  if (pathPart === 'gallery') {
    return { name: 'gallery' };
  }
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
        <a href="#/protocols">协议</a>
        <a href="#/linux">Linux</a>
        <a href="#/memory">内存</a>
        <a href="#/pointers">指针</a>
        <a href="#/transform">变换</a>
        <a href="#/ai">AI</a>
        <a href="#/opensource">开源</a>
        <a href="#/daily">日常</a>
      </nav>
      <p class="tagline">C++ · Graphics · GPU · Linux · AI · 开源 · 日常 — 公开笔记浏览</p>
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
  const progress = loadReadingProgress();

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

  const continueId = filterTopic
    ? getLastNoteId(filterTopic)
    : getLastNoteId();
  const continueNote = continueId ? notes.find((n) => n.id === continueId) : null;
  const continueInView =
    continueNote &&
    (!filterTopic || continueNote.topic === filterTopic) &&
    (!filterTag || continueNote.tags.includes(filterTag))
      ? continueNote
      : null;
  const continueBanner = continueReadingBannerHtml(
    continueInView
      ? {
          id: continueInView.id,
          title: escapeHtml(continueInView.title),
          topic: continueInView.topic,
        }
      : null,
    filterTopic
      ? `${escapeHtml(TOPIC_LABELS[filterTopic] || filterTopic)} · 本机上次`
      : '全局 · 本机上次',
  );

  const byTopic = TOPICS.map((topic) => {
    const group = filtered.filter((n) => n.topic === topic);
    if (!group.length) return '';
    const topicLastId = progress.lastByTopic[topic] || null;
    const topicContinue = topicLastId
      ? group.find((n) => n.id === topicLastId)
      : null;
    const topicContinueLink =
      !filterTopic && topicContinue
        ? `<a class="topic-continue" href="#/note/${encodeURIComponent(topicContinue.id)}">继续 · ${escapeHtml(topicContinue.title)}</a>`
        : '';
    const items = group
      .map((n) =>
        noteListItemHtml(
          {
            id: n.id,
            title: escapeHtml(n.title),
            topic: n.topic,
            metaHtml: `${escapeHtml(n.updated)} · ${n.tags.map((t) => `#${escapeHtml(t)}`).join(' ')}`,
          },
          marksForNote(n.id, n.topic, progress),
        ),
      )
      .join('');
    return `
      <section class="topic-section">
        <div class="topic-section__head">
          <h2>${TOPIC_LABELS[topic] || topic}</h2>
          ${topicContinueLink}
        </div>
        <ul class="note-list">${items}</ul>
      </section>`;
  }).join('');

  return layout(`
    ${continueBanner}
    <div class="pagoda-home-slot" data-pagoda-mount data-pagoda-compact></div>
    <p class="pagoda-home-link"><a href="#/pagoda">打开完整应县木塔展台 →</a></p>
    <div class="shader-home-slot" data-shader-mount data-shader-compact></div>
    <p class="shader-home-link"><a href="#/shader">打开完整 Shader Toy →</a></p>
    <div class="proto-home-slot" data-protocol-mount data-protocol-compact></div>
    <p class="proto-home-link"><a href="#/protocols">打开完整协议探索 →</a></p>
    <div class="linux-home-slot" data-linux-sys-mount data-linux-sys-compact></div>
    <p class="linux-home-link"><a href="#/linux">打开 Linux 系统探索（启动 / 目录 / 权限）→</a></p>
    <div class="memory-home-slot" data-memory-mount data-memory-compact></div>
    <p class="memory-home-link"><a href="#/memory">打开内存布局沙箱（栈 / 堆）→</a></p>
    <div class="pointer-home-slot" data-pointer-mount data-pointer-compact></div>
    <p class="pointer-home-link"><a href="#/pointers">打开指针操作（槽位 · 箭头 · 智能指针）→</a></p>
    <div class="transform-home-slot" data-transform-mount data-transform-compact></div>
    <p class="transform-home-link"><a href="#/transform">打开变换沙箱（矩阵 · 左乘/右乘）→</a></p>
    <div class="daily-home-slot" data-daily-mount data-daily-compact></div>
    <p class="daily-home-link"><a href="#/daily">打开日常节奏板（日 / 周 / 月 / 年）→</a></p>
    <div class="ai-home-slot" data-ai-mount data-ai-compact></div>
    <p class="ai-home-link"><a href="#/ai">打开 AI 史记时间线（时代 · 事件 · 五体索引）→</a></p>
    <section class="opensource-home-teaser">
      <p class="opensource-home-link"><a href="#/opensource">开源精选阅读架（HelloGitHub · FCL · OMPL · 按来源浏览）→</a></p>
    </section>
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

function renderProtocolsPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>协议探索</span></nav>
    <div class="proto-page-slot site-main-breakout" data-protocol-mount></div>
    <p class="proto-credit">步进动画 + 报文表，覆盖 HTTP/HTTPS、TCP、UDP、IP、DNS、DHCP、ICMP、SMTP、POP3、IMAP、FTP、SSH、TLS 等；中文 UI。原创实现，非第三方嵌入。</p>
  `);
}

function renderLinuxSysPage(domain = 'boot') {
  const labels = { boot: '系统启动', fs: '目录结构', perm: '权限设置' };
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>Linux 系统探索</span>${labels[domain] ? ` / <span>${labels[domain]}</span>` : ''}</nav>
    <div class="linux-page-slot site-main-breakout" data-linux-sys-mount data-linux-domain="${escapeHtml(domain)}"></div>
    <p class="linux-credit">交互演示：系统启动流水线、FHS 目录结构、文件权限（rwx / 特殊位 / ACL 速览）。流程模型 + 时序图 + 事件表；中文 UI。</p>
  `);
}

function renderMemoryPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>内存布局沙箱</span></nav>
    <div class="memory-page-slot site-main-breakout" data-memory-mount></div>
    <p class="memory-credit">常用内存操作：调用/静态/自动变量、结构体对齐与 packed、new/move/delete，以及 10MiB 缓冲稀疏写与 memmove/memset/memcpy。教学示意，中文 UI。</p>
  `);
}

function renderTransformPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>变换沙箱</span></nav>
    <div class="transform-page-slot site-main-breakout" data-transform-mount></div>
    <p class="transform-credit">列向量约定下演示 TRS、左乘/右乘与行列式几何意义；定向飞镖看朝向。对接 ch02 与<a href="#/note/graphics/linalg-geometry-map">线代几何导读</a>。</p>
  `);
}

function renderPointersPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>指针操作</span></nav>
    <div class="pointer-page-slot site-main-breakout" data-pointer-mount></div>
    <p class="pointer-credit">槽位 + 箭头演示取址、解引用、算术与 unique/shared/weak；环引用警示。笔记见<a href="#/note/cpp/pointer-ops-explorer">指针操作交互页</a>；完整虚存见<a href="#/memory">内存沙箱</a>。</p>
  `);
}

function renderDailyPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>日常节奏</span></nav>
    <div class="daily-page-slot site-main-breakout" data-daily-mount></div>
    <p class="daily-credit">可勾选的日/周/月/年微习惯与长期原则；本机进度记忆。笔记见<a href="#/note/daily/2026-self-discipline-checklist">2026 自律清单</a>、<a href="#/note/daily/20-minute-rule">20 分钟定律</a>、<a href="#/note/daily/howto-live-better">HowToLiveBetter 阅读地图</a>。</p>
  `);
}

/**
 * Short label for opensource index grouping.
 * Prefer non-URL `source`; else series folder; else 未标注.
 * @param {{ source?: string, series?: string }} note
 */
function opensourceSourceLabel(note) {
  const raw = String(note.source || '').trim();
  if (raw && !/^https?:\/\//i.test(raw)) return raw;
  if (note.series) return note.series;
  return '未标注来源';
}

function renderAiPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>AI 史记</span></nav>
    <div class="ai-page-slot site-main-breakout" data-ai-mount></div>
    <p class="ai-credit">结构化大事年表改编自 <a href="https://github.com/zsjunai/history-of-ai" rel="noopener noreferrer" target="_blank">zsjunai/history-of-ai</a>（<a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener noreferrer" target="_blank">CC BY-SA 4.0</a>）；本纪/世家/列传/书长文外链上游，站内为导读与索引。详见 <a href="#/note/ai/ATTRIBUTION">署名说明</a>。</p>
  `);
}

/** Local-dev gallery shell; production Pages never links here and shows unavailable copy. */
function renderLocalGalleryPage() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>本地相册</span></nav>
    <div class="local-gallery-page-slot site-main-breakout" data-gal-mount></div>
  `);
}

function renderLocalGalleryUnavailable() {
  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>不可用</span></nav>
    <section class="local-gallery-unavailable">
      <h1>仅本地可用</h1>
      <p>此路由只在本机 <code>npm run dev</code> 下工作，不会部署到 GitHub Pages，也不会从公开导航进入。</p>
      <p><a href="#/">← 返回首页</a></p>
    </section>
  `);
}

function renderOpensourcePage() {
  const notes = loadNotes().filter((n) => n.topic === 'opensource');
  const roadmap = notes.find((n) => n.id === 'opensource/00-roadmap');
  const issues = notes.filter((n) => n.id !== 'opensource/00-roadmap');
  const progress = loadReadingProgress();
  const continueId = getLastNoteId('opensource');
  const continueNote = continueId ? notes.find((n) => n.id === continueId) : null;
  const continueBanner = continueReadingBannerHtml(
    continueNote
      ? {
          id: continueNote.id,
          title: escapeHtml(continueNote.title),
          topic: continueNote.topic,
        }
      : null,
    '开源 · 本机上次',
  );

  /** @type {Map<string, typeof issues>} */
  const bySource = new Map();
  for (const n of issues) {
    const label = opensourceSourceLabel(n);
    if (!bySource.has(label)) bySource.set(label, []);
    bySource.get(label)?.push(n);
  }

  const groups = [...bySource.entries()]
    .map(([label, group]) => {
      const items = group
        .map((n) => {
          const issueBit = n.issue ? `第 ${escapeHtml(n.issue)} 期` : '';
          const meta = [issueBit, escapeHtml(n.updated)].filter(Boolean).join(' · ');
          const ext = n.sourceUrl
            ? `<a class="opensource-index__ext" href="${escapeHtml(n.sourceUrl)}" rel="noopener noreferrer" target="_blank">原文</a>`
            : '';
          return noteListItemHtml(
            {
              id: n.id,
              title: escapeHtml(n.title),
              topic: n.topic,
              metaHtml: meta,
              extraClass: 'opensource-index__item',
              afterLinkHtml: ext,
            },
            marksForNote(n.id, n.topic, progress),
          );
        })
        .join('');
      return `
      <section class="topic-section opensource-index__group">
        <h2>${escapeHtml(label)}</h2>
        <ul class="note-list">${items}</ul>
      </section>`;
    })
    .join('');

  return layout(`
    <nav class="crumb"><a href="#/">首页</a> / <span>开源精选</span></nav>
    <section class="opensource-index">
      <header class="opensource-index__hero">
        <p class="opensource-index__eyebrow">OPEN SOURCE · READING</p>
        <h1 class="opensource-index__brand">开源</h1>
        <p class="opensource-index__lede">精选阅读架：HelloGitHub 月刊摘录，以及 FCL / OMPL 等上游库中文导读；按 frontmatter <code>source</code> 分组。正文在 <code>notes/opensource/</code>。生活向清单 HowToLiveBetter 落在日常栏，见下方旁注。</p>
        <p class="opensource-index__actions">
          ${
            roadmap
              ? `<a href="#/note/${encodeURIComponent(roadmap.id)}">阅读架路线 →</a>`
              : ''
          }
          <a href="#/?topic=opensource">首页 Topic 筛选 →</a>
          <a href="#/note/daily/howto-live-better">HowToLiveBetter（日常）→</a>
        </p>
      </header>
      ${continueBanner}
      ${groups || '<p class="empty">暂无开源摘录。</p>'}
      <p class="opensource-credit">摘录为原创中文消化，非杂志/Wiki 原文镜像。HelloGitHub：<a href="https://github.com/521xueweihan/HelloGitHub" rel="noopener noreferrer" target="_blank">521xueweihan/HelloGitHub</a> · <a href="https://hellogithub.com" rel="noopener noreferrer" target="_blank">hellogithub.com</a>。库导读：<a href="https://github.com/flexible-collision-library/fcl" rel="noopener noreferrer" target="_blank">FCL</a> · <a href="https://github.com/ompl/ompl" rel="noopener noreferrer" target="_blank">OMPL</a>。相关生活向列表：<a href="https://github.com/eternity4719/HowToLiveBetter" rel="noopener noreferrer" target="_blank">eternity4719/HowToLiveBetter</a>（站内消化见<a href="#/note/daily/howto-live-better">日常笔记</a>）。</p>
    </section>
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

async function mountProtocolIfPresent(root) {
  const slot = root.querySelector('[data-protocol-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-protocol-compact');
  const gen = protocolMountGen;
  try {
    const { mountProtocolExplorer } = await import('./protocol-explorer.js');
    if (gen !== protocolMountGen || !slot.isConnected) return;
    protocolHandle = mountProtocolExplorer(slot, { compact });
  } catch {
    if (gen !== protocolMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="proto-explorer__fallback">协议探索模块加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountLinuxSysIfPresent(root) {
  const slot = root.querySelector('[data-linux-sys-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-linux-sys-compact');
  const domainAttr = slot.getAttribute('data-linux-domain') || 'boot';
  const domain =
    domainAttr === 'fs' || domainAttr === 'perm' || domainAttr === 'boot'
      ? domainAttr
      : 'boot';
  const gen = linuxSysMountGen;
  try {
    const { mountLinuxSysExplorer } = await import('./linux-sys-explorer.js');
    if (gen !== linuxSysMountGen || !slot.isConnected) return;
    linuxSysHandle = mountLinuxSysExplorer(slot, { compact, domain });
  } catch {
    if (gen !== linuxSysMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="linux-sys__fallback">Linux 系统探索模块加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountMemoryIfPresent(root) {
  const slot = root.querySelector('[data-memory-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-memory-compact');
  const gen = memoryMountGen;
  try {
    const { mountMemoryExplorer } = await import('./memory-explorer.js');
    if (gen !== memoryMountGen || !slot.isConnected) return;
    memoryHandle = mountMemoryExplorer(slot, { compact });
  } catch {
    if (gen !== memoryMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="mem-layout__credit">内存布局沙箱加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountTransformIfPresent(root) {
  const slot = root.querySelector('[data-transform-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-transform-compact');
  const gen = transformMountGen;
  try {
    const { mountTransformExplorer } = await import('./transform-explorer.js');
    if (gen !== transformMountGen || !slot.isConnected) return;
    transformHandle = mountTransformExplorer(slot, { compact });
  } catch {
    if (gen !== transformMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="xf-explorer__credit">变换沙箱加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountPointerIfPresent(root) {
  const slot = root.querySelector('[data-pointer-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-pointer-compact');
  const gen = pointerMountGen;
  try {
    const { mountPointerExplorer } = await import('./pointer-explorer.js');
    if (gen !== pointerMountGen || !slot.isConnected) return;
    pointerHandle = mountPointerExplorer(slot, { compact });
  } catch {
    if (gen !== pointerMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="ptr-explorer__credit">指针操作模块加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountDailyIfPresent(root) {
  const slot = root.querySelector('[data-daily-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-daily-compact');
  const gen = dailyMountGen;
  try {
    const { mountDailyExplorer } = await import('./daily-explorer.js');
    if (gen !== dailyMountGen || !slot.isConnected) return;
    dailyHandle = mountDailyExplorer(slot, { compact });
  } catch {
    if (gen !== dailyMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="daily-ex__credit">日常节奏模块加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountAiIfPresent(root) {
  const slot = root.querySelector('[data-ai-mount]');
  if (!slot) return;
  const compact = slot.hasAttribute('data-ai-compact');
  const gen = aiMountGen;
  try {
    const { mountAiExplorer } = await import('./ai-explorer.js');
    if (gen !== aiMountGen || !slot.isConnected) return;
    aiHandle = mountAiExplorer(slot, { compact });
  } catch {
    if (gen !== aiMountGen || !slot.isConnected) return;
    slot.innerHTML =
      '<p class="ai-ex__credit">AI 时间线模块加载失败，笔记浏览不受影响。</p>';
  }
}

async function mountLocalGalleryIfPresent(root) {
  const slot = root.querySelector('[data-gal-mount]');
  if (!slot) return;
  // Production builds replace import.meta.env.DEV with false — dynamic import is dropped.
  if (!import.meta.env.DEV) {
    slot.innerHTML =
      '<p class="local-gallery-unavailable">本地相册仅开发模式可用。</p>';
    return;
  }
  try {
    const { mountLocalGallery } = await import('./local-gallery.js');
    if (!slot.isConnected) return;
    localGalleryHandle = mountLocalGallery(/** @type {HTMLElement} */ (slot));
  } catch {
    if (!slot.isConnected) return;
    slot.innerHTML =
      '<p class="local-gallery-unavailable">本地相册模块加载失败。</p>';
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
        aria-label="调整侧栏宽度"
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
  sidePanelMode = 'playground';
  graphicsLabHandle = null;
  bindPlaygroundChrome(shell, splitter, pane);
  shellReady = true;
  return browse;
}

/**
 * Graphics notes use a WebGL practice lab in the side pane; other pages keep JS/TS/C++ playground.
 * @param {{ topic?: string } | null | undefined} note
 */
async function syncSidePanel(note) {
  const app = document.querySelector('#app');
  const pane = /** @type {HTMLElement | null} */ (app?.querySelector('[data-playground-pane]'));
  if (!pane) return;

  const wantLab = note?.topic === 'graphics';
  if (wantLab && sidePanelMode !== 'graphics-lab') {
    unmountPlayground();
    const { mountGraphicsWebglLab } = await import('./graphics-webgl-lab.js');
    graphicsLabHandle = mountGraphicsWebglLab(pane);
    sidePanelMode = 'graphics-lab';
  } else if (!wantLab && sidePanelMode !== 'playground') {
    graphicsLabHandle?.dispose();
    graphicsLabHandle = null;
    mountPlayground(pane);
    sidePanelMode = 'playground';
  }
}

function ensureShichenTicker() {
  if (shichenTimer) return;
  shichenTimer = setInterval(() => {
    const route = document.documentElement.dataset.route || 'home';
    applyShichenAtmosphere({ route });
  }, 60_000);
}

function mountContent() {
  const browse = ensureShell();
  if (!browse) return;

  disposePagoda();
  disposeShader();
  disposeProtocol();
  disposeLinuxSys();
  disposeMemory();
  disposeTransform();
  disposePointer();
  disposeDaily();
  disposeAi();
  disposePersonalNotes();
  disposeReadingProgress();
  disposeLocalGallery();

  const route = parseRoute();
  // Normalize legacy showcase hashes → #/pagoda.
  const rawPath = window.location.hash.replace(/^#/, '').split('?')[0].replace(/^\//, '');
  if (rawPath === 'portal' || rawPath === 'solar' || rawPath === 'moon') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/pagoda`);
    return;
  }
  if (rawPath === 'protocol') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/protocols`);
    return;
  }
  if (rawPath === 'math' || rawPath === 'linalg') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/transform`);
    return;
  }
  if (rawPath === 'pointer' || rawPath === 'ptr') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/pointers`);
    return;
  }
  if (rawPath === 'habits' || rawPath === 'rhythm') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/daily`);
    return;
  }
  if (rawPath === 'oss' || rawPath === 'reading' || rawPath === 'hellogithub') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/opensource`);
    return;
  }
  if (rawPath === 'ai-history' || rawPath === 'history-of-ai') {
    window.location.replace(`${window.location.pathname}${window.location.search}#/ai`);
    return;
  }

  applyShichenAtmosphere({ route: route.name });
  ensureShichenTicker();

  // Leaving a note: reset list/page scroll so home isn't mid-pane.
  // Note routes restore their own saved scrollY via mountNoteReadingProgress.
  // Document scroll is the usual root (browse-pane grows with content).
  if (route.name !== 'note') {
    browse.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  if (route.name === 'note') {
    browse.innerHTML = renderNote(route.id);
    bindCodeBlockActions(browse);
    void runMermaidIn(browse);
    const note = getNoteById(route.id);
    void syncSidePanel(note);
    if (note) {
      readingProgressHandle = mountNoteReadingProgress(browse, note);
    } else {
      browse.scrollTop = 0;
    }
    const slot = browse.querySelector('[data-personal-notes-mount]');
    if (note && slot) {
      personalNotesHandle = mountPersonalNotes(/** @type {HTMLElement} */ (slot), note);
    }
  } else if (route.name === 'pagoda') {
    browse.innerHTML = renderPagodaPage();
    void syncSidePanel(null);
    mountPagodaIfPresent(browse);
  } else if (route.name === 'shader') {
    browse.innerHTML = renderShaderPage();
    void syncSidePanel(null);
    mountShaderIfPresent(browse);
  } else if (route.name === 'protocols') {
    browse.innerHTML = renderProtocolsPage();
    void syncSidePanel(null);
    mountProtocolIfPresent(browse);
  } else if (route.name === 'linux') {
    browse.innerHTML = renderLinuxSysPage(route.domain || 'boot');
    void syncSidePanel(null);
    mountLinuxSysIfPresent(browse);
  } else if (route.name === 'memory') {
    browse.innerHTML = renderMemoryPage();
    void syncSidePanel(null);
    // Give the VAS more horizontal room; playground can be re-opened via fab.
    document.querySelector('.app-shell')?.classList.add('is-playground-collapsed');
    mountMemoryIfPresent(browse);
  } else if (route.name === 'transform') {
    browse.innerHTML = renderTransformPage();
    void syncSidePanel(null);
    document.querySelector('.app-shell')?.classList.add('is-playground-collapsed');
    mountTransformIfPresent(browse);
  } else if (route.name === 'pointers') {
    browse.innerHTML = renderPointersPage();
    void syncSidePanel(null);
    document.querySelector('.app-shell')?.classList.add('is-playground-collapsed');
    mountPointerIfPresent(browse);
  } else if (route.name === 'daily') {
    browse.innerHTML = renderDailyPage();
    void syncSidePanel(null);
    document.querySelector('.app-shell')?.classList.add('is-playground-collapsed');
    mountDailyIfPresent(browse);
  } else if (route.name === 'opensource') {
    browse.innerHTML = renderOpensourcePage();
    void syncSidePanel(null);
  } else if (route.name === 'ai') {
    browse.innerHTML = renderAiPage();
    void syncSidePanel(null);
    document.querySelector('.app-shell')?.classList.add('is-playground-collapsed');
    mountAiIfPresent(browse);
  } else if (route.name === 'gallery') {
    void syncSidePanel(null);
    document.querySelector('.app-shell')?.classList.add('is-playground-collapsed');
    if (import.meta.env.DEV) {
      browse.innerHTML = renderLocalGalleryPage();
      void mountLocalGalleryIfPresent(browse);
    } else {
      browse.innerHTML = renderLocalGalleryUnavailable();
    }
  } else {
    browse.innerHTML = renderHome();
    void syncSidePanel(null);
    bindHomeFilters(browse);
    mountPagodaIfPresent(browse);
    mountShaderIfPresent(browse);
    mountProtocolIfPresent(browse);
    mountLinuxSysIfPresent(browse);
    mountMemoryIfPresent(browse);
    mountPointerIfPresent(browse);
    mountTransformIfPresent(browse);
    mountDailyIfPresent(browse);
    mountAiIfPresent(browse);
  }
}

function mount() {
  const app = document.querySelector('#app');
  if (!app) return;

  // Access logging runs even on the soft gate (external visitors who bounce).
  startVisitLogging();

  applyShichenAtmosphere({ route: 'home' });
  ensureShichenTicker();

  if (!isUnlocked()) {
    shellReady = false;
    sidePanelMode = 'playground';
    graphicsLabHandle?.dispose();
    graphicsLabHandle = null;
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
