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
  /** @type {{ dispose: () => void } | null} */
  let activeLightbox = null;

  /**
   * @param {{ dispose: () => void } | null} handle
   */
  const setLightbox = (handle) => {
    activeLightbox?.dispose();
    activeLightbox = handle;
  };

  wireFetchForm(fetchForm, fetchStatus, body, () => cancelled, setLightbox);
  void loadAlbums(body, () => cancelled, setLightbox);

  return {
    dispose() {
      cancelled = true;
      setLightbox(null);
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
 * @param {(h: { dispose: () => void } | null) => void} setLightbox
 */
function wireFetchForm(form, statusEl, body, isCancelled, setLightbox) {
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
        await loadAlbums(body, isCancelled, setLightbox);
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
 * @param {(h: { dispose: () => void } | null) => void} setLightbox
 */
async function loadAlbums(body, isCancelled, setLightbox) {
  setLightbox(null);
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
        void openAlbum(body, id, isCancelled, setLightbox);
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
  // Cover URL is a poster JPEG when the album lead item is a video (204 until cached).
  return `<img src="${escapeAttr(cover)}" alt="" loading="lazy" decoding="async" data-gal-poster-img ${
    coverKind === 'video' ? 'class="loc-gallery__album-cover--video"' : ''
  } onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'loc-gallery__album-placeholder',textContent:'视频'}))" />`;
}

/**
 * @param {HTMLElement} body
 * @param {string} albumId
 * @param {() => boolean} isCancelled
 * @param {(h: { dispose: () => void } | null) => void} setLightbox
 */
async function openAlbum(body, albumId, isCancelled, setLightbox) {
  const viewer = /** @type {HTMLElement | null} */ (body.querySelector('[data-gal-viewer]'));
  const list = /** @type {HTMLElement | null} */ (body.querySelector('[data-gal-albums]'));
  if (!viewer) return;

  setLightbox(null);
  viewer.hidden = false;
  if (list) list.hidden = true;
  viewer.innerHTML = `<p class="loc-gallery__status">加载相册…</p>`;

  try {
    const albumRes = await fetch(
      `/__local/gallery/albums/${encodeURIComponent(albumId)}/index.json`,
      { cache: 'no-store' },
    );

    /** @type {{ name: string, kind: 'image' | 'video', poster?: string | null }[]} */
    let items = [];
    if (albumRes.ok) {
      const albumData = await albumRes.json();
      if (Array.isArray(albumData.items) && albumData.items.length) {
        items = albumData.items.map((it) => {
          const name = String(it.name);
          const kind = it.kind === 'video' || isVideoName(name) ? 'video' : 'image';
          return {
            name,
            kind,
            poster:
              kind === 'video'
                ? it.poster ||
                  `/__local/gallery/albums/${encodeURIComponent(albumId)}/poster/${encodeURIComponent(name)}`
                : null,
          };
        });
      } else if (Array.isArray(albumData.images)) {
        items = albumData.images.map((name) => {
          const n = String(name);
          const kind = isVideoName(n) ? 'video' : 'image';
          return {
            name: n,
            kind,
            poster:
              kind === 'video'
                ? `/__local/gallery/albums/${encodeURIComponent(albumId)}/poster/${encodeURIComponent(n)}`
                : null,
          };
        });
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

    /** @type {{ name: string, kind: 'image' | 'video', src: string, poster: string | null }[]} */
    const entries = items.map((it) => ({
      name: it.name,
      kind: it.kind,
      src: `/__local/gallery/albums/${encodeURIComponent(albumId)}/${encodeURIComponent(it.name)}`,
      poster: it.poster || null,
    }));

    viewer.innerHTML = `
      <button type="button" class="loc-gallery__back" data-gal-back>← 全部相册</button>
      <h2 class="loc-gallery__album-heading">${escapeHtml(albumId === '__root__' ? '根目录' : albumId)}</h2>
      <ul class="loc-gallery__grid" data-gal-grid>
        ${entries
          .map((it, idx) => {
            if (it.kind === 'video') {
              return `<li class="loc-gallery__cell">
                <button type="button" class="loc-gallery__thumb loc-gallery__thumb--video" data-gal-open="${idx}" aria-label="打开 ${escapeAttr(it.name)}">
                  ${
                    it.poster
                      ? `<img src="${escapeAttr(it.poster)}" alt="" loading="lazy" decoding="async" data-gal-poster-img data-gal-poster-retry="${escapeAttr(it.poster)}" />`
                      : '<span class="loc-gallery__thumb-fallback">视频</span>'
                  }
                  <span class="loc-gallery__thumb-play" aria-hidden="true">▶</span>
                </button>
              </li>`;
            }
            return `<li class="loc-gallery__cell">
              <button type="button" class="loc-gallery__thumb" data-gal-open="${idx}" aria-label="打开 ${escapeAttr(it.name)}">
                <img src="${escapeAttr(it.src)}" alt="${escapeAttr(it.name)}" loading="lazy" decoding="async" />
              </button>
            </li>`;
          })
          .join('')}
      </ul>
      <div class="loc-gallery__lightbox" data-gal-lightbox hidden>
        <button type="button" class="loc-gallery__lb-close" data-gal-lb-close aria-label="关闭">×</button>
        <button type="button" class="loc-gallery__lb-nav loc-gallery__lb-nav--prev" data-gal-lb-prev aria-label="上一项">‹</button>
        <button type="button" class="loc-gallery__lb-nav loc-gallery__lb-nav--next" data-gal-lb-next aria-label="下一项">›</button>
        <div class="loc-gallery__lb-stage" data-gal-lb-stage></div>
        <p class="loc-gallery__lb-meta"><span data-gal-lb-cap></span> <span data-gal-lb-count></span></p>
      </div>
    `;
    const lbHandle = wireLightbox(viewer, entries);
    setLightbox(lbHandle);
    wirePosterRetries(viewer);
    wireBack(viewer, list, () => setLightbox(null));
  } catch {
    if (isCancelled()) return;
    viewer.innerHTML = `
      <button type="button" class="loc-gallery__back" data-gal-back>← 全部相册</button>
      <p class="loc-gallery__empty">无法读取相册「${escapeHtml(albumId)}」。</p>
    `;
    wireBack(viewer, list, () => setLightbox(null));
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

/**
 * Poster endpoint returns 204 until ffmpeg finishes in the background.
 * Soft-retry a few times so thumbs appear without blocking video connections.
 * @param {ParentNode} root
 */
function wirePosterRetries(root) {
  root.querySelectorAll('img[data-gal-poster-retry]').forEach((img) => {
    const url = img.getAttribute('data-gal-poster-retry') || '';
    let tries = 0;
    const bump = () => {
      tries += 1;
      if (tries > 4 || !url) {
        img.replaceWith(Object.assign(document.createElement('span'), {
          className: 'loc-gallery__thumb-fallback',
          textContent: '视频',
        }));
        return;
      }
      window.setTimeout(() => {
        img.src = `${url}${url.includes('?') ? '&' : '?'}r=${tries}`;
      }, 1200 * tries);
    };
    img.addEventListener('error', bump);
  });
}

/**
 * Grid → lightbox with prev/next (buttons + ←/→). Videos load only when shown.
 * @param {HTMLElement} viewer
 * @param {{ name: string, kind: 'image' | 'video', src: string, poster: string | null }[]} entries
 * @returns {{ close: () => void, dispose: () => void }}
 */
function wireLightbox(viewer, entries) {
  const lb = /** @type {HTMLElement} */ (viewer.querySelector('[data-gal-lightbox]'));
  const stage = /** @type {HTMLElement} */ (viewer.querySelector('[data-gal-lb-stage]'));
  const cap = /** @type {HTMLElement} */ (viewer.querySelector('[data-gal-lb-cap]'));
  const count = /** @type {HTMLElement} */ (viewer.querySelector('[data-gal-lb-count]'));
  let index = 0;

  const show = (i) => {
    if (!entries.length) return;
    index = ((i % entries.length) + entries.length) % entries.length;
    const it = entries[index];
    releaseVideos(stage);
    if (it.kind === 'video') {
      stage.innerHTML = `
        <video class="loc-gallery__lb-media" controls playsinline preload="auto" title="${escapeAttr(it.name)}"></video>
        <p class="loc-gallery__lb-status" data-gal-lb-status>加载中…</p>`;
      const video = /** @type {HTMLVideoElement} */ (stage.querySelector('video'));
      const status = /** @type {HTMLElement | null} */ (stage.querySelector('[data-gal-lb-status]'));
      const clearStatus = () => {
        if (status) status.hidden = true;
      };
      video.addEventListener('loadeddata', clearStatus, { once: true });
      video.addEventListener('playing', clearStatus, { once: true });
      video.addEventListener('error', () => {
        if (status) {
          status.hidden = false;
          status.textContent =
            '无法播放（编码可能不被浏览器支持，或文件读失败）。可试 WebM/H.264 MP4，并确认 GALLERY_ROOT 路径正确（Windows 建议 D:/视频）。';
        }
      });
      // Dev server is `/`; keep root-absolute `/__local/...` (not Pages base-relative).
      video.src = it.src;
      void video.play().catch(() => {
        /* autoplay may be blocked; controls still work once buffered */
      });
    } else {
      stage.innerHTML = `<img class="loc-gallery__lb-media" src="${escapeAttr(it.src)}" alt="${escapeAttr(it.name)}" decoding="async" />`;
    }
    cap.textContent = it.name;
    count.textContent = `（${index + 1} / ${entries.length}）`;
    lb.hidden = false;
  };

  const close = () => {
    releaseVideos(stage);
    stage.innerHTML = '';
    lb.hidden = true;
  };

  const onKey = (ev) => {
    if (lb.hidden) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      close();
    } else if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      show(index - 1);
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      show(index + 1);
    }
  };

  viewer.querySelectorAll('[data-gal-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-gal-open') || '0');
      show(i);
    });
  });
  viewer.querySelector('[data-gal-lb-prev]')?.addEventListener('click', () => show(index - 1));
  viewer.querySelector('[data-gal-lb-next]')?.addEventListener('click', () => show(index + 1));
  viewer.querySelector('[data-gal-lb-close]')?.addEventListener('click', () => close());
  lb.addEventListener('click', (ev) => {
    if (ev.target === lb) close();
  });
  window.addEventListener('keydown', onKey);

  return {
    close,
    dispose() {
      window.removeEventListener('keydown', onKey);
      close();
    },
  };
}

/**
 * @param {HTMLElement} viewer
 * @param {HTMLElement | null} list
 * @param {() => void} [onLeave]
 */
function wireBack(viewer, list, onLeave) {
  viewer.querySelector('[data-gal-back]')?.addEventListener('click', () => {
    onLeave?.();
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
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}
.loc-gallery__thumb {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) - 2px);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  font: inherit;
}
.loc-gallery__thumb:hover,
.loc-gallery__thumb:focus-visible {
  border-color: var(--accent);
  outline: none;
}
.loc-gallery__thumb img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
  background: rgba(0, 0, 0, 0.35);
}
.loc-gallery__thumb-fallback {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  color: var(--muted);
  font-size: 0.85rem;
}
.loc-gallery__thumb-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(15, 20, 25, 0.72);
  color: var(--accent);
  font-size: 0.8rem;
  pointer-events: none;
}
.loc-gallery__lightbox {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  grid-template-rows: 1fr auto;
  align-items: center;
  justify-items: center;
  padding: 3.5rem 3.5rem 1.25rem;
  background: rgba(0, 0, 0, 0.86);
}
.loc-gallery__lightbox[hidden] {
  display: none !important;
}
.loc-gallery__lb-stage {
  max-width: min(96vw, 1100px);
  max-height: calc(100vh - 6.5rem);
  display: grid;
  place-items: center;
}
.loc-gallery__lb-media {
  max-width: 96vw;
  max-height: calc(100vh - 6.5rem);
  width: auto;
  height: auto;
  object-fit: contain;
  background: #000;
  border-radius: calc(var(--radius) - 2px);
}
video.loc-gallery__lb-media {
  width: min(96vw, 1100px);
}
.loc-gallery__lb-meta {
  margin: 0.75rem 0 0;
  color: #ddd;
  font-size: 0.85rem;
  text-align: center;
  max-width: 90vw;
  word-break: break-all;
}
.loc-gallery__lb-status {
  margin: 0.5rem 0 0;
  color: #ccc;
  font-size: 0.85rem;
  text-align: center;
  max-width: 36rem;
}
.loc-gallery__lb-close,
.loc-gallery__lb-nav {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(15, 20, 25, 0.65);
  color: #eee;
  cursor: pointer;
  font: inherit;
  line-height: 1;
}
.loc-gallery__lb-close {
  top: 0.85rem;
  right: 0.85rem;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: calc(var(--radius) - 2px);
  font-size: 1.4rem;
}
.loc-gallery__lb-nav {
  top: 50%;
  transform: translateY(-50%);
  width: 2.6rem;
  height: 2.6rem;
  border-radius: calc(var(--radius) - 2px);
  font-size: 1.6rem;
}
.loc-gallery__lb-nav--prev { left: 0.7rem; }
.loc-gallery__lb-nav--next { right: 0.7rem; }
.loc-gallery__lb-close:hover,
.loc-gallery__lb-nav:hover,
.loc-gallery__lb-close:focus-visible,
.loc-gallery__lb-nav:focus-visible {
  border-color: var(--accent);
  outline: none;
}
`;
