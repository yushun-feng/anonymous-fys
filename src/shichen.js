/**
 * Twelve 时辰 helpers (Asia/Shanghai wall clock).
 * Panorama left→right: 子丑寅卯辰巳午未申酉戌亥.
 */

/** @typedef {{ id: string, name: string, range: string, index: number }} Shichen */

/** @type {Omit<Shichen, 'index'>[]} */
const RAW = [
  { id: 'zi', name: '子', range: '23:00–01:00' },
  { id: 'chou', name: '丑', range: '01:00–03:00' },
  { id: 'yin', name: '寅', range: '03:00–05:00' },
  { id: 'mao', name: '卯', range: '05:00–07:00' },
  { id: 'chen', name: '辰', range: '07:00–09:00' },
  { id: 'si', name: '巳', range: '09:00–11:00' },
  { id: 'wu', name: '午', range: '11:00–13:00' },
  { id: 'wei', name: '未', range: '13:00–15:00' },
  { id: 'shen', name: '申', range: '15:00–17:00' },
  { id: 'you', name: '酉', range: '17:00–19:00' },
  { id: 'xu', name: '戌', range: '19:00–21:00' },
  { id: 'hai', name: '亥', range: '21:00–23:00' },
];

/** @type {Shichen[]} */
export const SHICHEN_LIST = RAW.map((s, index) => ({ ...s, index }));

/**
 * Shanghai local hour 0–23.
 * @param {Date} [date]
 */
export function shanghaiHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  return Number.isFinite(hour) ? hour : 0;
}

/**
 * Map hour → 时辰 index (子=0 … 亥=11).
 * @param {number} hour
 */
export function shichenIndexFromHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  return Math.floor(((h + 1) % 24) / 2);
}

/**
 * @param {Date} [date]
 * @returns {Shichen}
 */
export function currentShichen(date = new Date()) {
  const index = shichenIndexFromHour(shanghaiHour(date));
  return SHICHEN_LIST[index];
}

/**
 * background-position-x % to center the active slice (12 equal columns).
 * @param {number} index
 */
export function shichenFocusPercent(index) {
  const i = Math.min(11, Math.max(0, index));
  return ((i + 0.5) / 12) * 100;
}

const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const BG_URL = `${String(BASE_URL).replace(/\/?$/, '/')}notes-assets/daily/forbidden-city-shichen.jpg`;

/**
 * Apply panorama CSS vars + data attrs on <html>.
 * @param {{ route?: string }} [opts]
 */
export function applyShichenAtmosphere(opts = {}) {
  const root = document.documentElement;
  const s = currentShichen();
  const route = opts.route || root.dataset.route || 'home';
  root.dataset.route = route;
  root.dataset.shichen = s.id;
  root.dataset.shichenName = s.name;
  root.style.setProperty('--shichen-panorama', `url("${BG_URL}")`);
  root.style.setProperty('--shichen-focus', `${shichenFocusPercent(s.index)}%`);
  root.style.setProperty('--shichen-index', String(s.index));
  // Soft tint hint from time of day (cool night / warm dusk)
  const cool = s.index <= 2 || s.index >= 10;
  const warm = s.index >= 8 && s.index <= 9;
  root.style.setProperty(
    '--shichen-tint',
    cool ? 'rgba(20, 36, 64, 0.35)' : warm ? 'rgba(90, 40, 20, 0.28)' : 'rgba(12, 22, 28, 0.22)',
  );
  return s;
}
