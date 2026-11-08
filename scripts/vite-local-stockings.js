import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_STOCKINGS_ROOT = resolve(REPO_ROOT, 'private', 'stockings');
const LOCAL_PREFIX = '/__local/stockings';
/** Optional gitignored one-line path override (same idea as STOCKINGS_ROOT). */
const LOCAL_ROOT_FILE = resolve(REPO_ROOT, '.stockings-root.local');

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
 * Dev-only middleware + production build guard for local stockings media.
 * Never copies private / external media into `dist`; refuses emit if paths leak.
 * Media roots (private/stockings or STOCKINGS_ROOT e.g. D:\\视频) are never bundled.
 */
export function localStockingsPlugin() {
  return {
    name: 'local-stockings',
    apply: undefined, // both serve + build (guard on build)
    configureServer(server) {
      const root = resolveStockingsRoot(server.config.envDir || REPO_ROOT, server.config.mode);
      const layout = resolveAlbumLayout(root);
      logRootOnce(root, layout);

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

        if (!subPath || subPath === 'index.json') {
          sendJson(res, buildIndex(layout));
          return;
        }

        // Synthetic per-album listing: /__local/stockings/albums/<id>/index.json
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
          const items = listMedia(albumDir);
          sendJson(res, {
            id: albumId,
            items,
            // Backward-compatible name list (images + videos).
            images: items.map((it) => it.name),
          });
          return;
        }

        // Media file: /__local/stockings/albums/<id>/<file>
        const albumFileMatch = /^albums\/([^/]+)\/(.+)$/i.exec(subPath);
        if (albumFileMatch) {
          const albumId = albumFileMatch[1];
          const fileRel = albumFileMatch[2];
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
            `[local-stockings] Refusing to emit private path into production bundle: ${fileName}`,
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
 * Resolve media root: STOCKINGS_ROOT env → .stockings-root.local → private/stockings.
 * Intended Windows path for this machine: D:\\视频
 * @param {string} envDir
 * @param {string} mode
 */
function resolveStockingsRoot(envDir, mode) {
  const fromShell = (process.env.STOCKINGS_ROOT || '').trim();
  if (fromShell) return resolve(fromShell);

  const env = loadEnv(mode || 'development', envDir || REPO_ROOT, '');
  const fromDotenv = (env.STOCKINGS_ROOT || '').trim();
  if (fromDotenv) return resolve(fromDotenv);

  if (existsSync(LOCAL_ROOT_FILE)) {
    const line = readFileSync(LOCAL_ROOT_FILE, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => l && !l.startsWith('#'));
    if (line) return resolve(line);
  }

  return DEFAULT_STOCKINGS_ROOT;
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
    `[local-stockings] media root: ${root} (${exists ? 'found' : 'missing'}) · layout=${layout.mode}`,
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
      `[local-stockings] Private assets leaked into dist:\n${leaked.map((p) => `  - ${p}`).join('\n')}`,
    );
  }
}

/** @param {string} relPath */
function isPrivateLeakPath(relPath) {
  const n = relPath.replace(/\\/g, '/').toLowerCase();
  return (
    n.includes('private/stockings') ||
    n.includes('__local/stockings') ||
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
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  for (const id of dirs) {
    albumSpecs.push({ id, title: id, dir: join(layout.albumsParent, id) });
  }

  for (const spec of albumSpecs) {
    const items = listMedia(spec.dir);
    const coverItem = pickCover(items);
    payload.albums.push({
      id: spec.id,
      title: spec.title,
      count: items.length,
      cover: coverItem
        ? `${LOCAL_PREFIX}/albums/${encodeURIComponent(spec.id)}/${encodeURIComponent(coverItem.name)}`
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
 * @param {{ name: string, kind: 'image' | 'video' }[]} items
 */
function pickCover(items) {
  return items.find((it) => it.kind === 'image') || items[0] || null;
}

/** @param {string} dir */
function listMedia(dir) {
  if (!existsSync(dir)) return [];
  /** @type {{ name: string, kind: 'image' | 'video' }[]} */
  const items = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    try {
      if (!statSync(abs).isFile()) continue;
    } catch {
      continue;
    }
    const ext = extname(name).toLowerCase();
    if (IMAGE_EXT.has(ext)) items.push({ name, kind: 'image' });
    else if (VIDEO_EXT.has(ext)) items.push({ name, kind: 'video' });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'en'));
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
 */
function streamFile(req, res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stat = statSync(filePath);
  const size = stat.size;
  const range = req.headers.range;

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store');
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
 */
function sendJson(res, data) {
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME['.json']);
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data, null, 2));
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
