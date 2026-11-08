import { existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const CACHE_DIR = '.gallery-cache';
const FFMPEG = process.env.GALLERY_FFMPEG || process.env.FFMPEG || 'ffmpeg';

/** @type {Map<string, Promise<string | null>>} */
const inFlight = new Map();
let active = 0;
/** @type {(() => void)[]} */
const waitQueue = [];
const MAX_CONCURRENT = 2;

/**
 * Sidecar JPEG next to the video under `<album>/.gallery-cache/<file>.poster.jpg`.
 * Cached files stay under GALLERY_ROOT (e.g. D:\\视频) — never committed.
 * @param {string} videoAbs
 */
export function posterCachePath(videoAbs) {
  return join(dirname(videoAbs), CACHE_DIR, `${basename(videoAbs)}.poster.jpg`);
}

/** @param {string} name */
export function isPosterCacheName(name) {
  return name === CACHE_DIR || name.endsWith('.poster.jpg');
}

/**
 * Return cached poster path if fresh, else null (does not spawn ffmpeg).
 * @param {string} videoAbs
 */
export function getCachedPosterPath(videoAbs) {
  const cached = posterCachePath(videoAbs);
  try {
    if (!existsSync(cached) || !statSync(cached).isFile() || statSync(cached).size <= 0) {
      return null;
    }
    if (statSync(cached).mtimeMs < statSync(videoAbs).mtimeMs) return null;
    return cached;
  } catch {
    return null;
  }
}

/**
 * Ensure a small JPEG poster exists for videoAbs; return absolute path or null.
 * Uses ffmpeg (seek ~1s, scale ≤480w). Safe to call many times — cache + coalesce.
 * Prefer getCachedPosterPath + background ensure for HTTP handlers so video
 * Range requests are not starved by long ffmpeg work holding connections.
 * @param {string} videoAbs
 * @returns {Promise<string | null>}
 */
export function ensureVideoPoster(videoAbs) {
  const hit = getCachedPosterPath(videoAbs);
  if (hit) return Promise.resolve(hit);

  const existing = inFlight.get(videoAbs);
  if (existing) return existing;

  const cached = posterCachePath(videoAbs);
  const job = (async () => {
    await acquireSlot();
    try {
      // Re-check after waiting for a slot.
      const again = getCachedPosterPath(videoAbs);
      if (again) return again;

      mkdirSync(dirname(cached), { recursive: true });
      const tmp = `${cached}.${process.pid}.${Date.now()}.tmp.jpg`;
      const ok =
        (await runFfmpegPoster(videoAbs, tmp, 1)) || (await runFfmpegPoster(videoAbs, tmp, 0));
      if (!ok) {
        try {
          unlinkSync(tmp);
        } catch {
          /* ignore */
        }
        return null;
      }
      try {
        renameSync(tmp, cached);
      } catch {
        try {
          unlinkSync(tmp);
        } catch {
          /* ignore */
        }
        return existsSync(cached) ? cached : null;
      }
      return cached;
    } finally {
      inFlight.delete(videoAbs);
      releaseSlot();
    }
  })();

  inFlight.set(videoAbs, job);
  return job;
}

/**
 * @param {string} input
 * @param {string} output
 * @param {number} seekSec
 */
function runFfmpegPoster(input, output, seekSec) {
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    String(seekSec),
    '-i',
    input,
    '-frames:v',
    '1',
    '-vf',
    'scale=480:-2:flags=fast_bilinear',
    '-q:v',
    '6',
    output,
  ];
  return new Promise((resolvePromise) => {
    const child = spawn(FFMPEG, args, { windowsHide: true, shell: false });
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      resolvePromise(false);
    }, 45_000);
    child.on('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(false);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(code === 0 && existsSync(output) && statSync(output).size > 0);
    });
  });
}

function acquireSlot() {
  if (active < MAX_CONCURRENT) {
    active += 1;
    return Promise.resolve();
  }
  return new Promise((resolvePromise) => {
    waitQueue.push(() => {
      active += 1;
      resolvePromise();
    });
  });
}

function releaseSlot() {
  active = Math.max(0, active - 1);
  const next = waitQueue.shift();
  if (next) next();
}
