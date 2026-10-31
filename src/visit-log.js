/**
 * Visitor access beacon for static GitHub Pages.
 *
 * Pages itself does not expose visitor IPs to the repo owner. This module:
 * 1) Optionally POSTs a JSON record (time, path, approx geo/IP via public geo API,
 *    device/browser fields) to `VITE_VISIT_LOG_ENDPOINT` (webhook / Worker / form sink).
 * 2) Optionally loads Umami / Plausible / GoatCounter when their env vars are set.
 *
 * True edge IP logging still needs Cloudflare (or similar) in front of the site,
 * or a logging endpoint that records the connecting client IP on the server side.
 */

const SESSION_KEY = 'anonymous-fys-visit-session';
const GEO_CACHE_KEY = 'anonymous-fys-visit-geo';
const GEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const ENDPOINT = String(import.meta.env.VITE_VISIT_LOG_ENDPOINT || '').trim();
const GEO_ENABLED = String(import.meta.env.VITE_VISIT_LOG_GEO || '1') !== '0';
const GEO_URL = String(import.meta.env.VITE_VISIT_LOG_GEO_URL || 'https://ipapi.co/json/').trim();

const UMAMI_SRC = String(import.meta.env.VITE_UMAMI_SRC || '').trim();
const UMAMI_WEBSITE_ID = String(import.meta.env.VITE_UMAMI_WEBSITE_ID || '').trim();
const PLAUSIBLE_DOMAIN = String(import.meta.env.VITE_PLAUSIBLE_DOMAIN || '').trim();
const PLAUSIBLE_SRC = String(
  import.meta.env.VITE_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js',
).trim();
const GOATCOUNTER_CODE = String(import.meta.env.VITE_GOATCOUNTER_CODE || '').trim();

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

/** @param {string} ua */
function parseBrowser(ua) {
  const s = ua || '';
  if (/Edg\//i.test(s)) return 'Edge';
  if (/OPR\//i.test(s) || /Opera/i.test(s)) return 'Opera';
  if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) return 'Chrome';
  if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) return 'Safari';
  if (/Firefox\//i.test(s)) return 'Firefox';
  if (/MSIE|Trident/i.test(s)) return 'IE';
  return 'Other';
}

/** @param {string} ua */
function parseOs(ua) {
  const s = ua || '';
  if (/Windows NT/i.test(s)) return 'Windows';
  if (/Android/i.test(s)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(s)) return 'iOS';
  if (/Mac OS X|Macintosh/i.test(s)) return 'macOS';
  if (/CrOS/i.test(s)) return 'ChromeOS';
  if (/Linux/i.test(s)) return 'Linux';
  return 'Other';
}

function isMobileUa(ua) {
  return /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua || '');
}

function collectDevice() {
  const nav = typeof navigator !== 'undefined' ? navigator : /** @type {Navigator} */ ({});
  const ua = nav.userAgent || '';
  const platform = nav.platform || nav.userAgentData?.platform || '';
  const language = nav.language || (nav.languages && nav.languages[0]) || '';
  const languages = Array.isArray(nav.languages) ? [...nav.languages] : language ? [language] : [];
  const screenW = typeof screen !== 'undefined' ? screen.width : null;
  const screenH = typeof screen !== 'undefined' ? screen.height : null;
  const availW = typeof screen !== 'undefined' ? screen.availWidth : null;
  const availH = typeof screen !== 'undefined' ? screen.availHeight : null;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : null;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : null;
  const timezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {
      return '';
    }
  })();

  const mobile = isMobileUa(ua) || (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);

  return {
    userAgent: ua,
    platform,
    os: parseOs(ua),
    browser: parseBrowser(ua),
    language,
    languages,
    mobile: Boolean(mobile),
    screen: {
      width: screenW,
      height: screenH,
      availWidth: availW,
      availHeight: availH,
      pixelRatio: dpr,
    },
    viewport: {
      width: viewportW,
      height: viewportH,
    },
    timezone,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    maxTouchPoints: nav.maxTouchPoints ?? null,
  };
}

function currentPath() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * @returns {Promise<{
 *   ip?: string,
 *   city?: string,
 *   region?: string,
 *   country?: string,
 *   countryCode?: string,
 *   latitude?: number,
 *   longitude?: number,
 *   org?: string,
 *   raw?: unknown,
 * } | null>}
 */
async function fetchApproxGeo() {
  if (!GEO_ENABLED || !GEO_URL) return null;

  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.at && Date.now() - parsed.at < GEO_CACHE_TTL_MS) {
        return parsed.geo || null;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const res = await fetch(GEO_URL, {
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Normalize common free geo API shapes (ipapi.co, ipwho.is, geojs).
    const geo = {
      ip: data.ip || data.IPv4 || data.query || undefined,
      city: data.city || undefined,
      region: data.region || data.regionName || data.region_code || undefined,
      country: data.country_name || data.country || undefined,
      countryCode: data.country_code || data.countryCode || data.country_code2 || undefined,
      latitude: data.latitude ?? data.lat ?? undefined,
      longitude: data.longitude ?? data.lon ?? data.lng ?? undefined,
      org: data.org || data.organization || data.isp || data.asn_org || undefined,
      raw: data,
    };

    try {
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ at: Date.now(), geo }));
    } catch {
      /* ignore */
    }
    return geo;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} payload
 */
function postBeacon(payload) {
  if (!ENDPOINT) return;

  const body = JSON.stringify(payload);
  // Prefer text/plain so sendBeacon / fetch stay "simple requests" (no CORS preflight).
  // Receivers should parse the raw body as JSON.
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
  } catch {
    /* fall through */
  }

  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
      mode: 'no-cors',
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ event?: string }} [opts]
 */
export async function recordVisit(opts = {}) {
  if (!ENDPOINT && !UMAMI_WEBSITE_ID && !PLAUSIBLE_DOMAIN && !GOATCOUNTER_CODE) {
    // Nothing configured — no-op (local/dev default).
    return;
  }

  const event = opts.event || 'pageview';
  const device = collectDevice();
  const geo = ENDPOINT ? await fetchApproxGeo() : null;

  if (ENDPOINT) {
    postBeacon({
      event,
      time: new Date().toISOString(),
      path: currentPath(),
      referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
      title: typeof document !== 'undefined' ? document.title || '' : '',
      sessionId: sessionId(),
      unlocked: (() => {
        try {
          return sessionStorage.getItem('anonymous-fys-gate-unlocked') === '1';
        } catch {
          return null;
        }
      })(),
      device,
      // Approx client IP/location via public geo API (not edge-verified).
      // Server-side endpoint may additionally log the real connecting IP.
      geo,
      ip: geo?.ip || null,
      location: geo
        ? {
            city: geo.city || null,
            region: geo.region || null,
            country: geo.country || null,
            countryCode: geo.countryCode || null,
            latitude: geo.latitude ?? null,
            longitude: geo.longitude ?? null,
            org: geo.org || null,
          }
        : null,
      note:
        'ip/location from browser geo API when enabled; true edge IP requires Cloudflare or a logging endpoint that records remoteAddr',
    });
  }

  // Privacy-friendly SaaS pageviews (no custom IP in our payload).
  try {
    if (PLAUSIBLE_DOMAIN && typeof window !== 'undefined' && window.plausible) {
      window.plausible('pageview');
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof window !== 'undefined' && window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: currentPath() });
    }
  } catch {
    /* ignore */
  }
}

let thirdPartyInjected = false;

/** Inject optional Umami / Plausible / GoatCounter scripts once. */
export function initVisitIntegrations() {
  if (thirdPartyInjected || typeof document === 'undefined') return;
  thirdPartyInjected = true;

  if (UMAMI_WEBSITE_ID && UMAMI_SRC) {
    const s = document.createElement('script');
    s.defer = true;
    s.src = UMAMI_SRC;
    s.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
    document.head.appendChild(s);
  }

  if (PLAUSIBLE_DOMAIN) {
    const s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', PLAUSIBLE_DOMAIN);
    s.src = PLAUSIBLE_SRC;
    document.head.appendChild(s);
  }

  if (GOATCOUNTER_CODE) {
    window.goatcounter = { path: currentPath() };
    const s = document.createElement('script');
    s.async = true;
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    s.src = '//gc.zgo.at/count.js';
    document.head.appendChild(s);
  }
}

let hashHooked = false;

/**
 * Start visit logging: third-party scripts + initial beacon + hashchange pageviews.
 * Safe to call multiple times; side effects run once.
 */
export function startVisitLogging() {
  initVisitIntegrations();
  void recordVisit({ event: 'pageview' });

  if (hashHooked || typeof window === 'undefined') return;
  hashHooked = true;
  window.addEventListener('hashchange', () => {
    void recordVisit({ event: 'pageview' });
  });
}
