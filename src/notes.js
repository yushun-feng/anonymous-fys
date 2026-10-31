import { seriesFromPath, chapterOrderFrom, compareNotes } from './note-sort.js';

const rawModules = import.meta.glob('../notes/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * @param {string} raw
 * @returns {{ meta: Record<string, unknown>, body: string }}
 */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }

  const yaml = match[1];
  const body = match[2];
  /** @type {Record<string, unknown>} */
  const meta = {};

  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();

    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      meta[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return { meta, body };
}

/**
 * @typedef {{
 *   id: string,
 *   path: string,
 *   title: string,
 *   tags: string[],
 *   topic: string,
 *   updated: string,
 *   order: number,
 *   series: string,
 *   body: string,
 * }} Note
 */

export { seriesFromPath, chapterOrderFrom, compareNotes };

/** @returns {Note[]} */
export function loadNotes() {
  /** @type {Note[]} */
  const notes = [];

  for (const [modulePath, raw] of Object.entries(rawModules)) {
    if (modulePath.endsWith('/CONVENTIONS.md')) continue;

    const { meta, body } = parseFrontmatter(/** @type {string} */ (raw));
    const relative = modulePath.replace(/^\.\.\/notes\//, '');
    const id = relative.replace(/\.md$/, '');
    const series = seriesFromPath(relative);

    notes.push({
      id,
      path: relative,
      title: String(meta.title ?? id),
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
      topic: String(meta.topic ?? relative.split('/')[0] ?? 'misc'),
      updated: String(meta.updated ?? ''),
      order: chapterOrderFrom(relative, meta),
      series,
      body,
    });
  }

  notes.sort(compareNotes);

  return notes;
}

/** @param {string} id */
export function getNoteById(id) {
  return loadNotes().find((n) => n.id === id) ?? null;
}
