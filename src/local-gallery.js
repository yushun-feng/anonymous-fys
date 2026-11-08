/**
 * Local-only private gallery shell.
 * Loaded only under `import.meta.env.DEV` via dynamic import from main.js.
 * Assets come from the Vite `/__local/gallery/` middleware — never bundled.
 */

const INDEX_URL = '/__local/gallery/index.json';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.ogv']);

/**
 * @param {HTMLElement} root
 * @returns {{ dispose: () => void }}
 */
export function mountLocalGallery(root) {
  const style = document.createElement('style');
  style.textContent = GALLERY_CSS;
  root.appendChild(style);

  const shell = document.createElement('section');
  shell.className = 'loc-gallery';
  shell.innerHTML = `
    <header class="loc-gallery__header">
      <p class="loc-gallery__eyebrow">LOCAL ONLY · NOT DEPLOYED</p>
      <h1 class="loc-gallery__title">本地相册</h1>
      <p class="loc-gallery__lede">
        本机媒体目录（默认 <code>private/gallery/</code>；可用 <code>GALLERY_ROOT</code> 指向如 <code>D:\\视频</code>）。
        支持图片与视频；本页只在 <code>npm run dev</code> 可用，媒体<strong>不会</strong>进 git / Pages。
      </p>
      <form class="loc-gallery__fetch" data-gal-fetch>
        <label class="loc-gallery__fetch-label" for="gal-fetch-url">粘贴 Twitter/X 或抖音链接，下载到媒体根下的 <code>twitter/</code> 或 <code>douyin/</code></label>
        <div class="loc-gallery__fetch-row">
          <input id="gal-fetch-url" class="loc-gallery__fetch-input" type="url" name="url" placeholder="https://x.com/… 或 https://v.douyin.com/…" autocomplete="off" spellcheck="false" />
          <button type="submit" class="loc-gallery__fetch-btn">抓取下载</button>
        </div>
        <p class="loc-gallery__fetch-status" data-gal-fetch-status hidden></p>
      </form>
    </header>
    <div class="loc-gallery__body" data-gal-body>
      <p class="loc-gallery__status">正在读取本地相册…</p>
    </div>
  `;
  root.appendChild(shell);

  const body = /** @type {HTMLElement} */ (shell.querySelector('[data-gal-body]'));
  const fetchForm = /** @type {HTMLFormElement} */ (shell.querySelector('[data-gal-fetch]'));
  const fetchStatus = /** @type {HTMLElement} */ (shell.querySelector('[data-gal-fetch-status]'));
  let cancelled = false;

  wireFetchForm(fetchForm, fetchStatus, body, () => cancelled);
  void loadAlbums(body, () => cancelled);

  return {
    dispose() {
      cancelled = true;
      style.remove();
      shell.remove();
    },
  };
}

/**
 * @param {HTMLFormElement} form
 * @param {HTMLElement} statusEl
 * @param {HTMLElement} body
 * @param {() => boolean} isCancelled
 */
function wireFetchForm(form, statusEl, body, isCancelled) {
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const input = /** @type {HTMLInputElement | null} */ (form.querySelector('[name="url"]'));
    const btn = /** @type {HTMLButtonElement | null} */ (form.querySelector('button[type="submit"]'));
    const url = (input?.value || '').trim();
    if (!url) {
      setFetchStatus(statusEl, '请粘贴链接', true);
      return;
    }
    if (btn) btn.disabled = true;
    setFetchStatus(statusEl, '正在下载（需本机已安装 yt-dlp）…', false);
    void (async () => {
      try {
        const res = await fetch('/__local/gallery/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (isCancelled()) return;
        if (!res.ok || !data.ok) {
          setFetchStatus(statusEl, data.error || `下载失败（HTTP ${res.status}）`, true);
          return;
        }
        const where = data.outDir || data.source || '';
        setFetchStatus(
          statusEl,
          `已保存到 ${where}${data.files?.length ? ` · ${data.files.length} 个文件` : ''}。相册列表已刷新。`,
          false,
        );
        if (input) input.value = '';
        await loadAlbums(body, isCancelled);
      } catch {
        if (isCancelled()) return;
        setFetchStatus(statusEl, '请求失败：请确认 npm run dev 正在运行且 yt-dlp 可用', true);
      } finally {
        if (btn) btn.disabled = false;
      }
    })();
  });
}

/**
 * @param {HTMLElement} el
 * @param {string} text
 * @param {boolean} isError
 */
function setFetchStatus(el, text, isError) {
  el.hidden = false;
  el.textContent = text;
  el.classList.toggle('is-error', isError);
}

/**
 * @param {HTMLElement} body
 * @param {() => boolean} isCancelled
 */
async function loadAlbums(body, isCancelled) {
  try {
    const res = await fetch(INDEX_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`index ${res.status}`);
    /** @type {{ root?: string, albums?: { id: string, title: string, count: number, cover: string | null, coverKind?: string | null }[] }} */
    const data = await res.json();
    if (isCancelled()) return;

    const albums = Array.isArray(data.albums) ? data.albums : [];
    const rootHint = data.root ? escapeHtml(data.root) : 'private/gallery';
    if (!albums.length) {
      body.innerHTML = `
        <p class="loc-gallery__empty">还没有相册。当前根目录：<code>${rootHint}</code>。</p>
        <p class="loc-gallery__hint">
          子文件夹 = 相册；根目录扁平的图片/视频也会显示。
          Windows 可在 <code>.env.local</code> 设 <code>GALLERY_ROOT=D:\\视频</code>，或写入 gitignored 的 <code>.gallery-root.local</code>。
          说明见 <code>private/gallery/README.md</code>。
        </p>
      `;
      return;
    }

    body.innerHTML = `
      <p class="loc-gallery__root-hint">媒体根：<code>${rootHint}</code></p>
      <ul class="loc-gallery__albums" data-gal-albums>
        ${albums
          .map(
            (a) => `
          <li>
            <button type="button" class="loc-gallery__album" data-album-id="${escapeAttr(a.id)}">
              <span class="loc-gallery__album-visual" aria-hidden="true">
                ${renderCover(a.cover, a.coverKind)}
              </span>
              <span class="loc-gallery__album-meta">
                <span class="loc-gallery__album-title">${escapeHtml(a.title)}</span>
                <span class="loc-gallery__album-count">${a.count} 项</span>
              </span>
            </button>
          </li>`,
          )
          .join('')}
      </ul>
      <div class="loc-gallery__viewer" data-gal-viewer hidden></div>
    `;

    body.querySelectorAll('[data-album-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-album-id') || '';
        void openAlbum(body, id, isCancelled);
      });
    });
  } catch {
    if (isCancelled()) return;
    body.innerHTML = `
      <p class="loc-gallery__empty">本地相册接口不可用。请确认正在运行 <code>npm run dev</code>（不是 Pages / preview）。</p>
    `;
  }
}

/**
 * @param {string | null | undefined} cover
 * @param {string | null | undefined} coverKind
 */
function renderCover(cover, coverKind) {
  if (!cover) return '<span class="loc-gallery__album-placeholder">空</span>';
  if (coverKind === 'video' || isVideoName(cover)) {
    return `<span class="loc-gallery__album-placeholder loc-gallery__album-placeholder--video">视频</span>`;
  }
  return `<img src="${escapeAttr(cover)}" alt="" loading="lazy" />`;
}

/**
 * @param {HTMLElement} body
 * @param {string} albumId
 * @param {() => boolean} isCancelled
 */
async function openAlbum(body, albumId, isCancelled) {
  const viewer = /** @type {HTMLElement | null} */ (body.querySelector('[data-gal-viewer]'));
  const list = /** @type {HTMLElement | null} */ (body.querySelector('[data-gal-albums]'));
  if (!viewer) return;

  viewer.hidden = false;
  if (list) list.hidden = true;
  viewer.innerHTML = `<p class="loc-gallery__status">加载相册…</p>`;

  try {
    const albumRes = await fetch(
      `/__local/gallery/albums/${encodeURIComponent(albumId)}/index.json`,
      { cache: 'no-store' },
    );

    /** @type {{ name: string, kind: 'image' | 'video' }[]} */
    let items = [];
    if (albumRes.ok) {
      const albumData = await albumRes.json();
      if (Array.isArray(albumData.items) && albumData.items.length) {
        items = albumData.items.map((it) => ({
          name: String(it.name),
          kind: it.kind === 'video' || isVideoName(it.name) ? 'video' : 'image',
        }));
      } else if (Array.isArray(albumData.images)) {
        items = albumData.images.map((name) => ({
          name: String(name),
          kind: isVideoName(name) ? 'video' : 'image',
        }));
      }
    }

    if (isCancelled()) return;

    if (!items.length) {
      viewer.innerHTML = `
        <button type="button" class="loc-gallery__back" data-gal-back>← 全部相册</button>
        <p class="loc-gallery__empty">相册「${escapeHtml(albumId)}」里还没有图片或视频。</p>
      `;
      wireBack(viewer, list);
      return;
    }

    viewer.innerHTML = `
      <button type="button" class="loc-gallery__back" data-gal-back>← 全部相册</button>
      <h2 class="loc-gallery__album-heading">${escapeHtml(albumId === '__root__' ? '根目录' : albumId)}</h2>
      <ul class="loc-gallery__grid">
        ${items
          .map((it, idx) => {
            const src = `/__local/gallery/albums/${encodeURIComponent(albumId)}/${encodeURIComponent(it.name)}`;
            if (it.kind === 'video') {
              // Click-to-play: no <video src> until activated — avoids N metadata fetches.
              return `<li class="loc-gallery__cell loc-gallery__cell--video" data-gal-video-cell data-src="${escapeAttr(src)}" data-name="${escapeAttr(it.name)}">
                <button type="button" class="loc-gallery__video-tile" data-gal-video-play data-idx="${idx}">
                  <span class="loc-gallery__video-play" aria-hidden="true">▶</span>
                  <span class="loc-gallery__caption">${escapeHtml(it.name)}</span>
                </button>
              </li>`;
            }
            return `<li class="loc-gallery__cell">
              <a href="${escapeAttr(src)}" target="_blank" rel="noopener">
                <img src="${escapeAttr(src)}" alt="${escapeAttr(it.name)}" loading="lazy" decoding="async" />
              </a>
            </li>`;
          })
          .join('')}
      </ul>
    `;
    wireVideoCells(viewer);
    wireBack(viewer, list);
  } catch {
    if (isCancelled()) return;
    viewer.innerHTML = `
      <button type="button" class="loc-gallery__back" data-gal-back>← 全部相册</button>
      <p class="loc-gallery__empty">无法读取相册「${escapeHtml(albumId)}」。</p>
    `;
    wireBack(viewer, list);
  }
}

/** Tear down any active <video> elements to free decoder / network. */
function releaseVideos(root) {
  root.querySelectorAll('video').forEach((v) => {
    v.pause();
    v.removeAttribute('src');
    v.load();
  });
}

/** @param {HTMLElement} cell */
function renderVideoTile(cell) {
  const name = cell.getAttribute('data-name') || '';
  releaseVideos(cell);
  cell.innerHTML = `
    <button type="button" class="loc-gallery__video-tile" data-gal-video-play>
      <span class="loc-gallery__video-play" aria-hidden="true">▶</span>
      <span class="loc-gallery__caption">${escapeHtml(name)}</span>
    </button>`;
}

/**
 * Only one video plays at a time; media loads on click.
 * @param {HTMLElement} viewer
 */
function wireVideoCells(viewer) {
  viewer.addEventListener('click', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    const btn = t.closest('[data-gal-video-play]');
    if (!btn || !viewer.contains(btn)) return;
    const cell = btn.closest('[data-gal-video-cell]');
    if (!cell) return;

    viewer.querySelectorAll('[data-gal-video-cell]').forEach((other) => {
      if (other !== cell && other.querySelector('video')) renderVideoTile(other);
    });

    const src = cell.getAttribute('data-src') || '';
    const name = cell.getAttribute('data-name') || '';
    releaseVideos(cell);
    cell.innerHTML = `
      <video controls playsinline preload="metadata" title="${escapeAttr(name)}"></video>
      <span class="loc-gallery__caption">${escapeHtml(name)}</span>`;
    const video = /** @type {HTMLVideoElement | null} */ (cell.querySelector('video'));
    if (!video) return;
    video.src = src;
    video.addEventListener('play', () => {
      viewer.querySelectorAll('video').forEach((v) => {
        if (v !== video) v.pause();
      });
    });
    void video.play().catch(() => {
      /* autoplay may be blocked; controls remain usable */
    });
  });
}

/**
 * @param {HTMLElement} viewer
 * @param {HTMLElement | null} list
 */
function wireBack(viewer, list) {
  viewer.querySelector('[data-gal-back]')?.addEventListener('click', () => {
    releaseVideos(viewer);
    viewer.hidden = true;
    viewer.innerHTML = '';
    if (list) list.hidden = false;
  });
}

/** @param {string} name */
function isVideoName(name) {
  const i = name.lastIndexOf('.');
  const ext = i >= 0 ? name.slice(i).toLowerCase() : '';
  if (VIDEO_EXT.has(ext)) return true;
  if (IMAGE_EXT.has(ext)) return false;
  return false;
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {string} s */
function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

const GALLERY_CSS = `
.loc-gallery {
  padding: 0.5rem 0 2rem;
}
.loc-gallery__header {
  margin-bottom: 1.25rem;
}
.loc-gallery__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.loc-gallery__title {
  margin: 0 0 0.4rem;
  font-size: 1.75rem;
  font-weight: 650;
}
.loc-gallery__lede {
  margin: 0;
  color: var(--muted);
  max-width: 42rem;
}
.loc-gallery__fetch {
  margin-top: 1.1rem;
  max-width: 42rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.loc-gallery__fetch-label {
  font-size: 0.85rem;
  color: var(--muted);
}
.loc-gallery__fetch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.loc-gallery__fetch-input {
  flex: 1 1 14rem;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 2px);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  font: inherit;
}
.loc-gallery__fetch-input:focus-visible {
  outline: none;
  border-color: var(--accent);
}
.loc-gallery__fetch-btn {
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 2px);
  background: rgba(15, 20, 25, 0.75);
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.loc-gallery__fetch-btn:hover,
.loc-gallery__fetch-btn:focus-visible {
  border-color: var(--accent);
  outline: none;
}
.loc-gallery__fetch-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}
.loc-gallery__fetch-status {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
  white-space: pre-wrap;
  word-break: break-word;
}
.loc-gallery__fetch-status.is-error {
  color: #e8a0a0;
}
.loc-gallery__root-hint {
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.loc-gallery__status,
.loc-gallery__empty,
.loc-gallery__hint {
  color: var(--muted);
}
.loc-gallery__albums {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
.loc-gallery__album {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: rgba(15, 20, 25, 0.55);
  color: inherit;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
}
.loc-gallery__album:hover,
.loc-gallery__album:focus-visible {
  border-color: var(--accent);
  outline: none;
}
.loc-gallery__album-visual {
  aspect-ratio: 4 / 3;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
}
.loc-gallery__album-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.loc-gallery__album-placeholder {
  color: var(--muted);
  font-size: 0.85rem;
}
.loc-gallery__album-placeholder--video {
  letter-spacing: 0.06em;
}
.loc-gallery__album-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.7rem 0.75rem;
}
.loc-gallery__album-title {
  font-weight: 600;
}
.loc-gallery__album-count {
  font-size: 0.8rem;
  color: var(--muted);
}
.loc-gallery__back {
  margin: 0 0 0.85rem;
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
  font: inherit;
}
.loc-gallery__album-heading {
  margin: 0 0 0.85rem;
  font-size: 1.2rem;
}
.loc-gallery__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
.loc-gallery__cell--video {
  grid-column: 1 / -1;
  max-width: 56rem;
}
.loc-gallery__grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid var(--border);
  display: block;
  background: rgba(0, 0, 0, 0.35);
}
.loc-gallery__video-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  width: 100%;
  min-height: 9rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 2px);
  background: rgba(0, 0, 0, 0.45);
  color: inherit;
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.loc-gallery__video-tile:hover,
.loc-gallery__video-tile:focus-visible {
  border-color: var(--accent);
  outline: none;
}
.loc-gallery__video-play {
  display: inline-grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(15, 20, 25, 0.7);
  color: var(--accent);
  font-size: 0.85rem;
}
.loc-gallery__grid video {
  width: 100%;
  max-height: min(70vh, 720px);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid var(--border);
  display: block;
  background: #000;
}
.loc-gallery__caption {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--muted);
  word-break: break-all;
}
.loc-gallery__video-tile .loc-gallery__caption {
  margin-top: 0;
}
`;
