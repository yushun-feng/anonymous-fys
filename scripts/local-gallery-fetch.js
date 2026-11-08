import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

/** @typedef {'twitter' | 'douyin'} GalleryFetchSource */

const ALLOWED_HOST_SUFFIXES = [
  'twitter.com',
  'x.com',
  't.co',
  'douyin.com',
  'iesdouyin.com',
  'douyinpic.com',
];

/** Serialize downloads — one at a time. */
let busy = false;

/**
 * Classify and validate a pasted social URL.
 * @param {string} raw
 * @returns {{ ok: true, url: string, source: GalleryFetchSource } | { ok: false, error: string }}
 */
export function classifyGalleryFetchUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { ok: false, error: '请粘贴链接' };

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: '链接无效' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: '仅支持 http(s) 链接' };
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (sfx) => host === sfx || host.endsWith(`.${sfx}`),
  );
  if (!allowed) {
    return { ok: false, error: '仅支持 Twitter/X 或抖音链接' };
  }

  /** @type {GalleryFetchSource} */
  let source = 'twitter';
  if (host.includes('douyin') || host.includes('iesdouyin')) source = 'douyin';
  else if (host === 't.co') source = 'twitter';

  return { ok: true, url: parsed.toString(), source };
}

/**
 * Download one video via yt-dlp into outDir (under GALLERY_ROOT).
 * Requires yt-dlp on PATH (and ffmpeg for some merges).
 * @param {{ url: string, source: GalleryFetchSource, outDir: string }} opts
 * @returns {Promise<{ ok: true, source: GalleryFetchSource, outDir: string, files: string[], log: string } | { ok: false, error: string, log?: string }>}
 */
export async function fetchGalleryVideo(opts) {
  if (busy) {
    return { ok: false, error: '已有下载任务进行中，请稍后再试' };
  }
  busy = true;
  try {
    mkdirSync(opts.outDir, { recursive: true });

    const bin = process.env.GALLERY_YTDLP || process.env.YT_DLP || 'yt-dlp';
    const args = [
      '--no-playlist',
      '--no-mtime',
      '--restrict-filenames',
      '-f',
      'bv*+ba/b',
      '--merge-output-format',
      'mp4',
      '-P',
      opts.outDir,
      '-o',
      '%(title).120B [%(id)s].%(ext)s',
      '--print',
      'after_move:filepath',
      opts.url,
    ];

    const result = await runProcess(bin, args, { timeoutMs: 10 * 60 * 1000 });
    if (result.code !== 0) {
      const hint =
        result.code === 127 || /not recognized|ENOENT|not found/i.test(result.log)
          ? '未找到 yt-dlp。请先安装并加入 PATH（Windows: winget install yt-dlp.yt-dlp），合并视频还需 ffmpeg。'
          : `下载失败（exit ${result.code}）`;
      return { ok: false, error: hint, log: tail(result.log, 4000) };
    }

    const files = result.log
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && (l.includes('/') || l.includes('\\')) && !l.startsWith('['));

    return {
      ok: true,
      source: opts.source,
      outDir: opts.outDir,
      files: [...new Set(files)].slice(-5),
      log: tail(result.log, 2000),
    };
  } finally {
    busy = false;
  }
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ timeoutMs: number }} opts
 */
function runProcess(command, args, opts) {
  return new Promise((resolvePromise) => {
    /** @type {Buffer[]} */
    const chunks = [];
    let settled = false;
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
      env: process.env,
    });

    const timer = setTimeout(() => {
      if (settled) return;
      child.kill('SIGTERM');
      settled = true;
      resolvePromise({ code: 124, log: Buffer.concat(chunks).toString('utf8') + '\n[timeout]' });
    }, opts.timeoutMs);

    child.stdout.on('data', (d) => chunks.push(Buffer.from(d)));
    child.stderr.on('data', (d) => chunks.push(Buffer.from(d)));
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ code: 127, log: String(err.message || err) });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ code: code ?? 1, log: Buffer.concat(chunks).toString('utf8') });
    });
  });
}

/** @param {string} s @param {number} n */
function tail(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(-n);
}

/**
 * @param {{ root: string, albumsParent: string, mode: string }} layout
 * @param {GalleryFetchSource} source
 */
export function resolveFetchOutDir(layout, source) {
  if (layout.mode === 'nested-albums') {
    return join(layout.albumsParent, source);
  }
  return join(layout.root, source);
}
