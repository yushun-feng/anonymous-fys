/**
 * Notes reading progress: last-opened note (global + per topic),
 * visited set, and optional browse-pane scrollY — all localStorage.
 */

const STORAGE_KEY = 'anonymous-fys-reading-progress-v1';
const SCROLL_DEBOUNCE_MS = 220;

/**
 * @typedef {{
 *   visitedAt: number,
 *   scrollY: number,
 * }} NoteProgress
 */

/**
 * @typedef {{
 *   version: 1,
 *   globalLastId: string | null,
 *   lastByTopic: Record<string, string>,
 *   notes: Record<string, NoteProgress>,
 * }} ProgressState
 */

/** @returns {ProgressState} */
function emptyState() {
  return {
    version: 1,
    globalLastId: null,
    lastByTopic: {},
    notes: {},
  };
}

/** @returns {ProgressState} */
export function loadReadingProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed.notes !== 'object') {
      return emptyState();
    }
    return {
      version: 1,
      globalLastId: typeof parsed.globalLastId === 'string' ? parsed.globalLastId : null,
      lastByTopic:
        parsed.lastByTopic && typeof parsed.lastByTopic === 'object'
          ? /** @type {Record<string, string>} */ (parsed.lastByTopic)
          : {},
      notes: /** @type {Record<string, NoteProgress>} */ (parsed.notes || {}),
    };
  } catch {
    return emptyState();
  }
}

/** @param {ProgressState} state */
function saveReadingProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} noteId
 * @returns {NoteProgress | null}
 */
export function getNoteProgress(noteId) {
  const entry = loadReadingProgress().notes[noteId];
  return entry || null;
}

/** @param {string} noteId */
export function isNoteVisited(noteId) {
  return Boolean(loadReadingProgress().notes[noteId]);
}

/**
 * @param {string} [topic]
 * @returns {string | null}
 */
export function getLastNoteId(topic) {
  const state = loadReadingProgress();
  if (topic) return state.lastByTopic[topic] || null;
  return state.globalLastId;
}

/**
 * Record that a note was opened. Preserves existing scrollY if any.
 * @param {{ id: string, topic: string }} note
 */
export function markNoteOpened(note) {
  const state = loadReadingProgress();
  const prev = state.notes[note.id];
  state.notes[note.id] = {
    visitedAt: Date.now(),
    scrollY: prev?.scrollY ?? 0,
  };
  state.globalLastId = note.id;
  state.lastByTopic = { ...state.lastByTopic, [note.topic]: note.id };
  saveReadingProgress(state);
}

/**
 * @param {string} noteId
 * @param {number} scrollY
 */
export function saveNoteScroll(noteId, scrollY) {
  const state = loadReadingProgress();
  const prev = state.notes[noteId];
  if (!prev) {
    state.notes[noteId] = { visitedAt: Date.now(), scrollY: Math.max(0, scrollY) };
  } else {
    state.notes[noteId] = { ...prev, scrollY: Math.max(0, scrollY) };
  }
  saveReadingProgress(state);
}

/**
 * Prefer the element that actually scrolls. Layout grows the browse pane with
 * content, so document/window is usually the real scroll root; fall back to
 * the browse pane when it has its own overflow.
 * @param {HTMLElement | null} preferred
 */
function resolveScrollTarget(preferred) {
  const article = preferred?.querySelector('[data-note-scroll]');
  if (article && article.scrollHeight > article.clientHeight + 4) {
    return { kind: /** @type {const} */ ('element'), el: /** @type {HTMLElement} */ (article) };
  }
  if (preferred && preferred.scrollHeight > preferred.clientHeight + 4) {
    return { kind: /** @type {const} */ ('element'), el: preferred };
  }
  return { kind: /** @type {const} */ ('window'), el: null };
}

/** @param {{ kind: 'element' | 'window', el: HTMLElement | null }} target */
function readScrollY(target) {
  if (target.kind === 'element' && target.el) return target.el.scrollTop;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

/**
 * @param {{ kind: 'element' | 'window', el: HTMLElement | null }} target
 * @param {number} y
 */
function writeScrollY(target, y) {
  if (target.kind === 'element' && target.el) {
    target.el.scrollTop = y;
    return;
  }
  window.scrollTo(0, y);
}

/**
 * Mount scroll tracking + restore while a note is open.
 * @param {HTMLElement} preferredRoot browse-pane (may or may not be the scroller)
 * @param {{ id: string, topic: string }} note
 * @returns {{ dispose: () => void }}
 */
export function mountNoteReadingProgress(preferredRoot, note) {
  markNoteOpened(note);

  const saved = getNoteProgress(note.id);
  const targetY = saved?.scrollY ?? 0;
  let disposed = false;
  let timer = 0;
  let target = resolveScrollTarget(preferredRoot);
  const statusEl = /** @type {HTMLElement | null} */ (
    preferredRoot.querySelector('[data-reading-status]')
  );

  /** @param {string} text */
  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  const restore = () => {
    if (disposed) return;
    target = resolveScrollTarget(preferredRoot);
    // Always apply (including 0) so note→note navigation does not keep prior Y.
    writeScrollY(target, targetY);
  };

  // Restore after layout (markdown + mermaid may change height).
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
  const lateRestore = window.setTimeout(restore, 160);

  if (targetY > 40) {
    setStatus(`本机阅读进度：已回到上次位置（约 ${Math.round(targetY)}px）`);
  } else {
    setStatus('本机阅读进度：已记为上次打开 · 滚动会自动保存');
  }

  function persistScroll() {
    if (disposed) return;
    target = resolveScrollTarget(preferredRoot);
    const y = readScrollY(target);
    saveNoteScroll(note.id, y);
    setStatus(
      y > 40
        ? `本机阅读进度：已保存滚动位置（约 ${Math.round(y)}px）`
        : '本机阅读进度：已记为上次打开 · 滚动会自动保存',
    );
  }

  function onScroll() {
    window.clearTimeout(timer);
    timer = window.setTimeout(persistScroll, SCROLL_DEBOUNCE_MS);
  }

  function onLeave() {
    window.clearTimeout(timer);
    persistScroll();
  }

  // Listen on both: whichever is the live scroller will fire.
  preferredRoot.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', onLeave);
  window.addEventListener('beforeunload', onLeave);

  return {
    dispose() {
      disposed = true;
      window.clearTimeout(timer);
      window.clearTimeout(lateRestore);
      preferredRoot.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onLeave);
      window.removeEventListener('beforeunload', onLeave);
      persistScroll();
    },
  };
}

/**
 * Shared list-item markup for home / opensource indexes.
 * @param {{
 *   id: string,
 *   title: string,
 *   topic: string,
 *   metaHtml: string,
 *   extraClass?: string,
 *   afterLinkHtml?: string,
 * }} opts
 * @param {{
 *   visited: boolean,
 *   isContinue: boolean,
 *   continueScope: 'global' | 'topic' | null,
 * }} marks
 */
export function noteListItemHtml(opts, marks) {
  const classes = ['note-card'];
  if (opts.extraClass) classes.push(opts.extraClass);
  if (marks.visited) classes.push('is-visited');
  if (marks.isContinue) classes.push('is-continue');

  let badge = '';
  if (marks.isContinue) {
    const scope =
      marks.continueScope === 'topic'
        ? '本 Topic 上次阅读'
        : '上次阅读到这里';
    badge = `<span class="note-progress-badge" title="${scope}">继续阅读</span>`;
  } else if (marks.visited) {
    badge = `<span class="note-progress-badge note-progress-badge--visited" title="本机已打开过">读过</span>`;
  }

  return `
    <li class="${classes.join(' ')}">
      <a href="#/note/${encodeURIComponent(opts.id)}">
        <span class="note-card__row">
          <span class="note-title">${opts.title}</span>
          ${badge}
        </span>
        <span class="note-meta">${opts.metaHtml}</span>
      </a>
      ${opts.afterLinkHtml || ''}
    </li>`;
}

/**
 * Resolve continue / visited marks for a note id against current progress.
 * @param {string} noteId
 * @param {string} topic
 * @param {ProgressState} [state]
 */
export function marksForNote(noteId, topic, state = loadReadingProgress()) {
  const visited = Boolean(state.notes[noteId]);
  const isGlobal = state.globalLastId === noteId;
  const isTopicLast = state.lastByTopic[topic] === noteId;
  const isContinue = isGlobal || isTopicLast;
  /** @type {'global' | 'topic' | null} */
  let continueScope = null;
  if (isGlobal) continueScope = 'global';
  else if (isTopicLast) continueScope = 'topic';
  return { visited, isContinue, continueScope };
}

/**
 * Compact “继续阅读” strip for home / topic indexes.
 * @param {{ id: string, title: string, topic: string } | null} note
 * @param {string} [labelHint]
 */
export function continueReadingBannerHtml(note, labelHint = '') {
  if (!note) return '';
  const progress = getNoteProgress(note.id);
  const scrollHint =
    progress && progress.scrollY > 40
      ? `<span class="continue-reading__scroll">已记滚动位置</span>`
      : '';
  const hint = labelHint
    ? `<span class="continue-reading__hint">${labelHint}</span>`
    : '';
  return `
    <aside class="continue-reading" aria-label="继续阅读">
      <a class="continue-reading__link" href="#/note/${encodeURIComponent(note.id)}">
        <span class="continue-reading__label">继续阅读</span>
        <span class="continue-reading__title">${note.title}</span>
        ${hint}
        ${scrollHint}
      </a>
    </aside>`;
}
