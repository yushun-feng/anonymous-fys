import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const STOCKINGS_ROOT = resolve(REPO_ROOT, 'private', 'stockings');
const ALBUMS_ROOT = resolve(STOCKINGS_ROOT, 'albums');
const LOCAL_PREFIX = '/__local/stockings';

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif']);

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.avif': 'image/avif',
  '.json': 'application/json; charset=utf-8',
};

/**
 * Dev-only middleware + production build guard for private/stockings.
 * Never copies private media into `dist`; refuses emit if paths leak.
 */
export function localStockingsPlugin() {
  return {
    name: 'local-stockings',
    apply: undefined, // both serve + build (guard on build)
    configureServer(server) {
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
          sendJson(res, buildIndex());
          return;
        }

        // Synthetic per-album listing: /__local/stockings/albums/<id>/index.json
        const albumIndexMatch = /^albums\/([^/]+)\/index\.json$/i.exec(subPath);
        if (albumIndexMatch) {
          const albumId = albumIndexMatch[1];
          const albumDir = safeResolveUnder(ALBUMS_ROOT, albumId);
          if (!albumDir || !existsSync(albumDir) || !statSync(albumDir).isDirectory()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Not found');
            return;
          }
          sendJson(res, { id: albumId, images: listImages(albumDir) });
          return;
        }

        const filePath = safeResolveUnder(STOCKINGS_ROOT, subPath);
        if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Not found');
          return;
        }

        const ext = extname(filePath).toLowerCase();
        res.statusCode = 200;
        res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        createReadStream(filePath).pipe(res);
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

function buildIndex() {
  /** @type {{ albums: { id: string, title: string, count: number, cover: string | null }[] }} */
  const payload = { albums: [] };
  if (!existsSync(ALBUMS_ROOT)) return payload;

  const dirs = readdirSync(ALBUMS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'en'));

  for (const id of dirs) {
    const albumDir = join(ALBUMS_ROOT, id);
    const images = listImages(albumDir);
    payload.albums.push({
      id,
      title: id,
      count: images.length,
      cover: images[0]
        ? `${LOCAL_PREFIX}/albums/${encodeURIComponent(id)}/${encodeURIComponent(images[0])}`
        : null,
    });
  }
  return payload;
}

/** @param {string} dir */
function listImages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => IMAGE_EXT.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'en'));
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
