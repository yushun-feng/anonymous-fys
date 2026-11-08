import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import {
  classifyGalleryFetchUrl,
  fetchGalleryVideo,
  resolveFetchOutDir,
} from './local-gallery-fetch.js';
import { ensureVideoPoster, isPosterCacheName } from './local-gallery-poster.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_GALLERY_ROOT = resolve(REPO_ROOT, 'private', 'gallery');
const LOCAL_PREFIX = '/__local/gallery';
/** Optional gitignored one-line path override (same idea as GALLERY_ROOT). */
const LOCAL_ROOT_FILE = resolve(REPO_ROOT, '.gallery-root.local');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv', '.m4v', '.ogv']);

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.m4v': 'video/x-m4v',
  '.ogv': 'video/ogg',
  '.json': 'application/json; charset=utf-8',
};

/**
 * Dev-only middleware + production build guard for local private gallery media.
 * Never copies private / external media into `dist`; refuses emit if paths leak.
 * Media roots (private/gallery or GALLERY_ROOT e.g. D:\\视频) are never bundled.
 */
export function localGalleryPlugin() {
  return {
    name: 'local-gallery',
    apply: undefined, // both serve + build (guard on build)
    configureServer(server) {
      const envDir = server.config.envDir || REPO_ROOT;
      const mode = server.config.mode;
      const bootRoot = resolveGalleryRoot(envDir, mode);
      logRootOnce(bootRoot, resolveAlbumLayout(bootRoot));

      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith(LOCAL_PREFIX)) {
          next();
          return;
        }

        const url = new URL(rawUrl, 'http://local.dev');
        const subPath = decodeURIComponent(url.pathname.slice(LOCAL_PREFIX.length)).replace(
          /^\/+/,
          '',
        );
        // Re-resolve each request so newly downloaded album folders appear.
        const root = resolveGalleryRoot(envDir, mode);
        const layout = resolveAlbumLayout(root);

        if (subPath === 'fetch' || subPath === 'fetch/') {
          void handleFetch(req, res, layout);
          return;
        }

        if (!subPath || subPath === 'index.json') {
          sendJson(res, buildIndex(layout));
          return;
        }

        // Synthetic per-album listing: /__local/gallery/albums/<id>/index.json
        const albumIndexMatch = /^albums\/([^/]+)\/index\.json$/i.exec(subPath);
        if (albumIndexMatch) {
          const albumId = albumIndexMatch[1];
          const albumDir = resolveAlbumDir(layout, albumId);
          if (!albumDir || !existsSync(albumDir) || !statSync(albumDir).isDirectory()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Not found');
            return;
          }
          const items = listMedia(albumDir, albumId);
          sendJson(res, {
            id: albumId,
            items,
            // Backward-compatible name list (images + videos).
            images: items.map((it) => it.name),
          });
          return;
        }

        // Lazy poster JPEG: /__local/gallery/albums/<id>/poster/<videofile>
        const posterMatch = /^albums\/([^/]+)\/poster\/(.+)$/i.exec(subPath);
        if (posterMatch) {
          void handlePoster(req, res, layout, posterMatch[1], posterMatch[2]);
          return;
        }

        // Media file: /__local/gallery/albums/<id>/<file>
        const albumFileMatch = /^albums\/([^/]+)\/(.+)$/i.exec(subPath);
        if (albumFileMatch) {
          const albumId = albumFileMatch[1];
          const fileRel = albumFileMatch[2];
          // Do not serve cache internals as album media via this path.
          if (fileRel.split(/[/\\]/).some((p) => isPosterCacheName(p) || p === '.gallery-cache')) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Not found');
            return;
          }
          const albumDir = resolveAlbumDir(layout, albumId);
          if (!albumDir) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Not found');
            return;
          }
          const filePath = safeResolveUnder(albumDir, fileRel);
          if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Not found');
            return;
          }
          streamFile(req, res, filePath);
          return;
        }

        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not found');
      });
    },
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (isPrivateLeakPath(fileName)) {
          throw new Error(
            `[local-gallery] Refusing to emit private path into production bundle: ${fileName}`,
          );
        }
      }
    },
    writeBundle(options) {
      const outDir = options.dir ? resolve(options.dir) : resolve(REPO_ROOT, 'dist');
      assertNoPrivateInDist(outDir);
    },
  };
}

/**
 * Resolve media root: GALLERY_ROOT env → .gallery-root.local → private/gallery.
 * Intended Windows path for this machine: D:\\视频
 * @param {string} envDir
 * @param {string} mode
 */
function resolveGalleryRoot(envDir, mode) {
  const fromShell = (process.env.GALLERY_ROOT || '').trim();
  if (fromShell) return resolve(fromShell);

  const env = loadEnv(mode || 'development', envDir || REPO_ROOT, '');
  const fromDotenv = (env.GALLERY_ROOT || '').trim();
  if (fromDotenv) return resolve(fromDotenv);

  if (existsSync(LOCAL_ROOT_FILE)) {
    const line = readFileSync(LOCAL_ROOT_FILE, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith('#'));
    if (line) return resolve(line);
  }

  return DEFAULT_GALLERY_ROOT;
}

/**
 * Album layout:
 * - Prefer `<root>/albums/<album>/` when that folder exists (repo scaffold).
 * - Else each immediate subdirectory is an album (typical for D:\\视频).
 * - Flat media files at root become a synthetic album named after the folder (or "root").
 * @param {string} root
 */
function resolveAlbumLayout(root) {
  const albumsNested = resolve(root, 'albums');
  if (existsSync(albumsNested) && statSync(albumsNested).isDirectory()) {
    return { root, albumsParent: albumsNested, mode: /** @type {const} */ ('nested-albums') };
  }
  return { root, albumsParent: root, mode: /** @type {const} */ ('direct') };
}

/**
 * @param {{ root: string, albumsParent: string, mode: 'nested-albums' | 'direct' }} layout
 * @param {string} albumId
 */
function resolveAlbumDir(layout, albumId) {
  if (layout.mode === 'direct' && albumId === '__root__') {
    return layout.root;
  }
  return safeResolveUnder(layout.albumsParent, albumId);
}

let didLogRoot = false;
/**
 * @param {string} root
 * @param {{ mode: string, albumsParent: string }} layout
 */
function logRootOnce(root, layout) {
  if (didLogRoot) return;
  didLogRoot = true;
  const exists = existsSync(root);
  console.info(
    `[local-gallery] media root: ${root} (${exists ? 'found' : 'missing'}) · layout=${layout.mode}`,
  );
}

/** @param {string} outDir */
function assertNoPrivateInDist(outDir) {
  if (!existsSync(outDir)) return;
  /** @type {string[]} */
  const leaked = [];
  walk(outDir, (abs) => {
    const rel = relative(outDir, abs).split(sep).join('/');
    if (isPrivateLeakPath(rel)) leaked.push(rel);
  });
  if (leaked.length) {
    throw new Error(
      `[local-gallery] Private assets leaked into dist:\n${leaked.map((p) => `  - ${p}`).join('\n')}`,
    );
  }
}

/** @param {string} relPath */
function isPrivateLeakPath(relPath) {
  const n = relPath.replace(/\\/g, '/').toLowerCase();
  return (
    n.includes('private/gallery') ||
    n.includes('__local/gallery') ||
    /(^|\/)private(\/|$)/.test(n)
  );
}

/**
 * @param {{ root: string, albumsParent: string, mode: 'nested-albums' | 'direct' }} layout
 */
function buildIndex(layout) {
  /** @type {{ root: string, albums: { id: string, title: string, count: number, cover: string | null, coverKind: 'image' | 'video' | null }[] }} */
  const payload = { root: layout.root, albums: [] };
  if (!existsSync(layout.albumsParent)) return payload;

  /** @type {{ id: string, title: string, dir: string }[]} */
  const albumSpecs = [];

  if (layout.mode === 'direct') {
    const rootItems = listMedia(layout.root);
    if (rootItems.length) {
      albumSpecs.push({
        id: '__root__',
        title: folderDisplayName(layout.root) || '全部',
        dir: layout.root,
      });
    }
  }

  const dirs = readdirSync(layout.albumsParent, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !isPosterCacheName(d.name))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  for (const id of dirs) {
    albumSpecs.push({ id, title: id, dir: join(layout.albumsParent, id) });
  }

  for (const spec of albumSpecs) {
    const items = listMedia(spec.dir, spec.id);
    const coverItem = pickCover(items);
    payload.albums.push({
      id: spec.id,
      title: spec.title,
      count: items.length,
      cover: coverItem
        ? coverItem.kind === 'video' && coverItem.poster
          ? coverItem.poster
          : `${LOCAL_PREFIX}/albums/${encodeURIComponent(spec.id)}/${encodeURIComponent(coverItem.name)}`
        : null,
      coverKind: coverItem ? coverItem.kind : null,
    });
  }
  return payload;
}

/** @param {string} absPath */
function folderDisplayName(absPath) {
  const parts = absPath.replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1] || '';
}

/**
 * @param {{ name: string, kind: 'image' | 'video', poster?: string | null }[]} items
 */
function pickCover(items) {
  return items.find((it) => it.kind === 'image') || items[0] || null;
}

/**
 * @param {string} dir
 * @param {string} [albumId]
 */
function listMedia(dir, albumId) {
  if (!existsSync(dir)) return [];
  /** @type {{ name: string, kind: 'image' | 'video', poster?: string | null }[]} */
  const items = [];
  for (const name of readdirSync(dir)) {
    if (isPosterCacheName(name) || name.startsWith('.')) continue;
    const abs = join(dir, name);
    try {
      if (!statSync(abs).isFile()) continue;
    } catch {
      continue;
    }
    const ext = extname(name).toLowerCase();
    if (IMAGE_EXT.has(ext)) items.push({ name, kind: 'image' });
    else if (VIDEO_EXT.has(ext)) {
      /** @type {{ name: string, kind: 'image' | 'video', poster?: string | null }} */
      const item = { name, kind: 'video' };
      if (albumId) {
        item.poster = `${LOCAL_PREFIX}/albums/${encodeURIComponent(albumId)}/poster/${encodeURIComponent(name)}`;
      }
      items.push(item);
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

/**
 * Generate-or-serve a cached JPEG poster for a video (ffmpeg, ≤480px wide).
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ root: string, albumsParent: string, mode: string }} layout
 * @param {string} albumId
 * @param {string} videoName
 */
async function handlePoster(req, res, layout, albumId, videoName) {
  const albumDir = resolveAlbumDir(layout, albumId);
  if (!albumDir) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
    return;
  }
  const videoPath = safeResolveUnder(albumDir, videoName);
  if (!videoPath || !existsSync(videoPath) || !statSync(videoPath).isFile()) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
    return;
  }
  const ext = extname(videoPath).toLowerCase();
  if (!VIDEO_EXT.has(ext)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not a video');
    return;
  }

  const posterPath = await ensureVideoPoster(videoPath);
  if (!posterPath) {
    // No ffmpeg / decode failure — UI keeps play tile without a poster image.
    res.statusCode = 204;
    res.end();
    return;
  }
  // Cache once built — busted when video mtime forces rebuild in ensureVideoPoster.
  streamFile(req, res, posterPath, { cacheControl: 'private, max-age=86400' });
}

/**
 * @param {string} root
 * @param {string} subPath
 */
function safeResolveUnder(root, subPath) {
  const cleaned = normalize(subPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = resolve(root, cleaned);
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (abs !== root && !abs.startsWith(rootWithSep)) return null;
  return abs;
}

/**
 * Stream a local file; supports Range for video seeking.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} filePath
 * @param {{ cacheControl?: string }} [opts]
 */
function streamFile(req, res, filePath, opts = {}) {
  const ext = extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stat = statSync(filePath);
  const size = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', opts.cacheControl || 'no-store');
  res.setHeader('Content-Type', type);

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : size - 1;
      if (start >= size || end >= size || start > end) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${size}`);
        res.end();
        return;
      }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      createReadStream(filePath, { start, end }).pipe(res);
      return;
    }
  }

  res.statusCode = 200;
  res.setHeader('Content-Length', String(size));
  createReadStream(filePath).pipe(res);
}

/**
 * @param {import('http').ServerResponse} res
 * @param {unknown} data
 * @param {number} [status]
 */
function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', MIME['.json']);
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data, null, 2));
}

/**
 * POST /__local/gallery/fetch  { "url": "https://..." }
 * Downloads via yt-dlp into GALLERY_ROOT/twitter|douyin (never into the git tree on purpose
 * when GALLERY_ROOT points outside the repo, e.g. D:\\视频).
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {{ root: string, albumsParent: string, mode: string }} layout
 */
async function handleFetch(req, res, layout) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    sendJson(res, {
      ok: true,
      hint: 'POST JSON { "url": "<twitter|douyin link>" }. Needs yt-dlp on PATH.',
      root: layout.root,
    });
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, { ok: false, error: 'Use POST' }, 405);
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, { ok: false, error: 'Invalid JSON body' }, 400);
    return;
  }

  const classified = classifyGalleryFetchUrl(body?.url);
  if (!classified.ok) {
    sendJson(res, { ok: false, error: classified.error }, 400);
    return;
  }

  const outDir = resolveFetchOutDir(layout, classified.source);
  console.info(`[local-gallery] fetch ${classified.source} → ${outDir}`);
  const result = await fetchGalleryVideo({
    url: classified.url,
    source: classified.source,
    outDir,
  });
  if (!result.ok) {
    sendJson(res, result, 502);
    return;
  }
  sendJson(res, result);
}

/**
 * @param {import('http').IncomingMessage} req
 */
function readJsonBody(req) {
  return new Promise((resolvePromise, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(c));
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolvePromise(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * @param {string} dir
 * @param {(abs: string) => void} visitFile
 */
function walk(dir, visitFile) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, visitFile);
    else visitFile(abs);
  }
}
