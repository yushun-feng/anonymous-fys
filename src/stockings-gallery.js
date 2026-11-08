/**
 * Local-only stockings gallery shell.
 * Loaded only under `import.meta.env.DEV` via dynamic import from main.js.
 * Assets come from the Vite `/__local/stockings/` middleware — never bundled.
 */

const INDEX_URL = '/__local/stockings/index.json';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.ogv']);

/**
 * @param {HTMLElement} root
 * @returns {{ dispose: () => void }}
 */
export function mountStockingsGallery(root) {
  const style = document.createElement('style');
  style.textContent = GALLERY_CSS;
  root.appendChild(style);

  const shell = document.createElement('section');
  shell.className = 'stk-gallery';
  shell.innerHTML = `
    <header class="stk-gallery__header">
      <p class="stk-gallery__eyebrow">LOCAL ONLY · NOT DEPLOYED</p>
      <h1 class="stk-gallery__title">Stockings</h1>
      <p class="stk-gallery__lede">
        本机媒体目录（默认 <code>private/stockings/</code>；可用 <code>STOCKINGS_ROOT</code> 指向如 <code>D:\\视频</code>）。
        支持图片与视频；本页只在 <code>npm run dev</code> 可用，媒体<strong>不会</strong>进 git / Pages。
      </p>
    </header>
    <div class="stk-gallery__body" data-stk-body>
      <p class="stk-gallery__status">正在读取本地相册…</p>
    </div>
  `;
  root.appendChild(shell);

  const body = /** @type {HTMLElement} */ (shell.querySelector('[data-stk-body]'));
  let cancelled = false;

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
    const rootHint = data.root ? escapeHtml(data.root) : 'private/stockings';
    if (!albums.length) {
      body.innerHTML = `
        <p class="stk-gallery__empty">还没有相册。当前根目录：<code>${rootHint}</code>。</p>
        <p class="stk-gallery__hint">
          子文件夹 = 相册；根目录扁平的图片/视频也会显示。
          Windows 可在 <code>.env.local</code> 设 <code>STOCKINGS_ROOT=D:\\视频</code>，或写入 gitignored 的 <code>.stockings-root.local</code>。
          说明见 <code>private/stockings/README.md</code>。
        </p>
      `;
      return;
    }

    body.innerHTML = `
      <p class="stk-gallery__root-hint">媒体根：<code>${rootHint}</code></p>
      <ul class="stk-gallery__albums" data-stk-albums>
        ${albums
          .map(
            (a) => `
          <li>
            <button type="button" class="stk-gallery__album" data-album-id="${escapeAttr(a.id)}">
              <span class="stk-gallery__album-visual" aria-hidden="true">
                ${renderCover(a.cover, a.coverKind)}
              </span>
              <span class="stk-gallery__album-meta">
                <span class="stk-gallery__album-title">${escapeHtml(a.title)}</span>
                <span class="stk-gallery__album-count">${a.count} 项</span>
              </span>
            </button>
          </li>`,
          )
          .join('')}
      </ul>
      <div class="stk-gallery__viewer" data-stk-viewer hidden></div>
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
      <p class="stk-gallery__empty">本地相册接口不可用。请确认正在运行 <code>npm run dev</code>（不是 Pages / preview）。</p>
    `;
  }
}

/**
 * @param {string | null | undefined} cover
 * @param {string | null | undefined} coverKind
 */
function renderCover(cover, coverKind) {
  if (!cover) return '<span class="stk-gallery__album-placeholder">空</span>';
  if (coverKind === 'video' || isVideoName(cover)) {
    return `<span class="stk-gallery__album-placeholder stk-gallery__album-placeholder--video">视频</span>`;
  }
  return `<img src="${escapeAttr(cover)}" alt="" loading="lazy" />`;
}

/**
 * @param {HTMLElement} body
 * @param {string} albumId
 * @param {() => boolean} isCancelled
 */
async function openAlbum(body, albumId, isCancelled) {
  const viewer = /** @type {HTMLElement | null} */ (body.querySelector('[data-stk-viewer]'));
  const list = /** @type {HTMLElement | null} */ (body.querySelector('[data-stk-albums]'));
  if (!viewer) return;

  viewer.hidden = false;
  if (list) list.hidden = true;
  viewer.innerHTML = `<p class="stk-gallery__status">加载相册…</p>`;

  try {
    const albumRes = await fetch(
      `/__local/stockings/albums/${encodeURIComponent(albumId)}/index.json`,
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
        <button type="button" class="stk-gallery__back" data-stk-back>← 全部相册</button>
        <p class="stk-gallery__empty">相册「${escapeHtml(albumId)}」里还没有图片或视频。</p>
      `;
      wireBack(viewer, list);
      return;
    }

    viewer.innerHTML = `
      <button type="button" class="stk-gallery__back" data-stk-back>← 全部相册</button>
      <h2 class="stk-gallery__album-heading">${escapeHtml(albumId === '__root__' ? '根目录' : albumId)}</h2>
      <ul class="stk-gallery__grid">
        ${items
          .map((it) => {
            const src = `/__local/stockings/albums/${encodeURIComponent(albumId)}/${encodeURIComponent(it.name)}`;
            if (it.kind === 'video') {
              return `<li class="stk-gallery__cell stk-gallery__cell--video">
                <video src="${escapeAttr(src)}" controls playsinline preload="metadata" title="${escapeAttr(it.name)}"></video>
                <span class="stk-gallery__caption">${escapeHtml(it.name)}</span>
              </li>`;
            }
            return `<li class="stk-gallery__cell">
              <a href="${escapeAttr(src)}" target="_blank" rel="noopener">
                <img src="${escapeAttr(src)}" alt="${escapeAttr(it.name)}" loading="lazy" />
              </a>
            </li>`;
          })
          .join('')}
      </ul>
    `;
    wireBack(viewer, list);
  } catch {
    if (isCancelled()) return;
    viewer.innerHTML = `
      <button type="button" class="stk-gallery__back" data-stk-back>← 全部相册</button>
      <p class="stk-gallery__empty">无法读取相册「${escapeHtml(albumId)}」。</p>
    `;
    wireBack(viewer, list);
  }
}

/**
 * @param {HTMLElement} viewer
 * @param {HTMLElement | null} list
 */
function wireBack(viewer, list) {
  viewer.querySelector('[data-stk-back]')?.addEventListener('click', () => {
    viewer.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.removeAttribute('src');
      v.load();
    });
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
.stk-gallery {
  padding: 0.5rem 0 2rem;
}
.stk-gallery__header {
  margin-bottom: 1.25rem;
}
.stk-gallery__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.stk-gallery__title {
  margin: 0 0 0.4rem;
  font-size: 1.75rem;
  font-weight: 650;
}
.stk-gallery__lede {
  margin: 0;
  color: var(--muted);
  max-width: 42rem;
}
.stk-gallery__root-hint {
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.stk-gallery__status,
.stk-gallery__empty,
.stk-gallery__hint {
  color: var(--muted);
}
.stk-gallery__albums {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
.stk-gallery__album {
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
.stk-gallery__album:hover,
.stk-gallery__album:focus-visible {
  border-color: var(--accent);
  outline: none;
}
.stk-gallery__album-visual {
  aspect-ratio: 4 / 3;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
}
.stk-gallery__album-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.stk-gallery__album-placeholder {
  color: var(--muted);
  font-size: 0.85rem;
}
.stk-gallery__album-placeholder--video {
  letter-spacing: 0.06em;
}
.stk-gallery__album-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.7rem 0.75rem;
}
.stk-gallery__album-title {
  font-weight: 600;
}
.stk-gallery__album-count {
  font-size: 0.8rem;
  color: var(--muted);
}
.stk-gallery__back {
  margin: 0 0 0.85rem;
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
  font: inherit;
}
.stk-gallery__album-heading {
  margin: 0 0 0.85rem;
  font-size: 1.2rem;
}
.stk-gallery__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
.stk-gallery__cell--video {
  grid-column: 1 / -1;
  max-width: 56rem;
}
.stk-gallery__grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid var(--border);
  display: block;
  background: rgba(0, 0, 0, 0.35);
}
.stk-gallery__grid video {
  width: 100%;
  max-height: min(70vh, 720px);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid var(--border);
  display: block;
  background: #000;
}
.stk-gallery__caption {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--muted);
  word-break: break-all;
}
`;
