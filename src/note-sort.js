/** Preferred curriculum folder order within a topic. */
const SERIES_RANK = {
  learncpp: 0,
  cherno: 1,
};

/**
 * Series folder under topic, e.g. `cpp/learncpp/ch01.md` → `learncpp`.
 * Topic-root notes (`cpp/raii.md`) use empty string.
 * @param {string} path
 */
export function seriesFromPath(path) {
  const parts = path.split('/');
  return parts.length >= 3 ? parts[1] : '';
}

/**
 * Numeric list order: frontmatter `order` wins; else filename
 * `ch12-...` / `ch14-15-...` / leading `00-...`.
 * @param {string} path
 * @param {Record<string, unknown>} meta
 */
export function chapterOrderFrom(path, meta = {}) {
  if (meta.order !== undefined && meta.order !== '') {
    const n = Number(meta.order);
    if (!Number.isNaN(n)) return n;
  }

  const base = path.split('/').pop()?.replace(/\.md$/i, '') ?? path;

  const ch = base.match(/^ch(\d+)/i);
  if (ch) return Number(ch[1]);

  const lead = base.match(/^(\d+)(?:-|$)/);
  if (lead) return Number(lead[1]);

  if (/^optional/i.test(base)) return 900;
  if (/^appendix/i.test(base)) return 910;
  return 1000;
}

/**
 * @param {{ topic: string, series: string, order: number, path: string }} a
 * @param {{ topic: string, series: string, order: number, path: string }} b
 */
export function compareNotes(a, b) {
  if (a.topic !== b.topic) return a.topic.localeCompare(b.topic);

  const sa = SERIES_RANK[a.series] ?? (a.series ? 50 : 100);
  const sb = SERIES_RANK[b.series] ?? (b.series ? 50 : 100);
  if (sa !== sb) return sa - sb;
  if (a.series !== b.series) return a.series.localeCompare(b.series);

  if (a.order !== b.order) return a.order - b.order;
  return a.path.localeCompare(b.path);
}
