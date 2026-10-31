/**
 * Visit-log receiver for anonymous-fys (`src/visit-log.js` beacons).
 *
 * POST  — accept JSON body (also text/plain JSON from sendBeacon), enrich with
 *         Cloudflare connecting IP / cf geo, store to KV when bound, else log + 204.
 * GET   — when KV is bound, return recent entries (optional READ_TOKEN gate).
 * OPTIONS — CORS preflight.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const MAX_BODY_BYTES = 64 * 1024;

/**
 * @param {number} status
 * @param {BodyInit | null} [body]
 * @param {Record<string, string>} [extra]
 */
function respond(status, body = null, extra = {}) {
  const headers = { ...CORS_HEADERS, ...extra };
  if (body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }
  return new Response(body, { status, headers });
}

function json(status, data) {
  return respond(status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
  });
}

/** @param {Request} request */
function clientMeta(request) {
  const cf = request.cf || {};
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('True-Client-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    null;

  return {
    connectingIp: ip,
    country: cf.country || null,
    colo: cf.colo || null,
    city: cf.city || null,
    region: cf.region || null,
    timezone: cf.timezone || null,
    asn: cf.asn ?? null,
    asOrganization: cf.asOrganization || null,
    latitude: cf.latitude || null,
    longitude: cf.longitude || null,
  };
}

/**
 * Parse beacon body: application/json or text/plain JSON (Pages sendBeacon).
 * @param {Request} request
 */
async function parsePayload(request) {
  const raw = await request.text();
  if (!raw || !raw.trim()) {
    return { ok: true, payload: {}, raw: '' };
  }
  if (raw.length > MAX_BODY_BYTES) {
    return { ok: false, error: 'body too large' };
  }
  try {
    const payload = JSON.parse(raw);
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, error: 'JSON object required' };
    }
    return { ok: true, payload, raw };
  } catch {
    return { ok: false, error: 'invalid JSON' };
  }
}

/**
 * Normalize fields we care about; keep unknown keys under `extra`.
 * @param {Record<string, unknown>} payload
 * @param {ReturnType<typeof clientMeta>} edge
 */
function buildEntry(payload, edge) {
  const device = payload.device && typeof payload.device === 'object' ? payload.device : null;
  const geo = payload.geo && typeof payload.geo === 'object' ? payload.geo : null;
  const location =
    payload.location && typeof payload.location === 'object' ? payload.location : null;

  return {
    receivedAt: new Date().toISOString(),
    event: typeof payload.event === 'string' ? payload.event : 'pageview',
    time: typeof payload.time === 'string' ? payload.time : null,
    path: typeof payload.path === 'string' ? payload.path : null,
    referrer: typeof payload.referrer === 'string' ? payload.referrer : null,
    title: typeof payload.title === 'string' ? payload.title : null,
    sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : null,
    unlocked: typeof payload.unlocked === 'boolean' ? payload.unlocked : payload.unlocked ?? null,
    // Client-reported (approx) + edge-verified connecting IP / CF geo
    ip: typeof payload.ip === 'string' ? payload.ip : geo?.ip || null,
    location,
    geo,
    device,
    edge,
    note: typeof payload.note === 'string' ? payload.note : undefined,
  };
}

/** @param {string} [iso] */
function kvKey(iso) {
  const t = iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toISOString() : new Date().toISOString();
  const rand = crypto.randomUUID().slice(0, 8);
  // Lexicographic order ≈ chronological for ISO timestamps
  return `visit:${t}:${rand}`;
}

/**
 * @param {KVNamespace} kv
 * @param {object} entry
 * @param {number} maxRecent
 */
async function storeEntry(kv, entry, maxRecent) {
  const key = kvKey(entry.time || entry.receivedAt);
  await kv.put(key, JSON.stringify(entry), {
    // Keep ~90 days; adjust if needed
    expirationTtl: 90 * 24 * 60 * 60,
  });

  // Best-effort trim of oldest keys beyond maxRecent * 2 (list is eventual).
  try {
    const listed = await kv.list({ prefix: 'visit:', limit: 1000 });
    const keys = listed.keys.map((k) => k.name).sort();
    const overflow = keys.length - maxRecent * 2;
    if (overflow > 0) {
      await Promise.all(keys.slice(0, overflow).map((name) => kv.delete(name)));
    }
  } catch {
    /* ignore trim errors */
  }

  return key;
}

/**
 * @param {KVNamespace} kv
 * @param {number} limit
 */
async function listRecent(kv, limit) {
  const listed = await kv.list({ prefix: 'visit:', limit: 1000 });
  const names = listed.keys.map((k) => k.name).sort().reverse().slice(0, limit);
  const entries = await Promise.all(
    names.map(async (name) => {
      const raw = await kv.get(name);
      if (!raw) return null;
      try {
        return { key: name, ...JSON.parse(raw) };
      } catch {
        return { key: name, raw };
      }
    }),
  );
  return entries.filter(Boolean);
}

/**
 * @param {Request} request
 * @param {string | undefined} readToken
 */
function authorizeRead(request, readToken) {
  if (!readToken) return true;
  const auth = request.headers.get('Authorization') || '';
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const url = new URL(request.url);
  const q = url.searchParams.get('token') || '';
  return bearer === readToken || q === readToken;
}

export default {
  /**
   * @param {Request} request
   * @param {{
   *   VISIT_LOG?: KVNamespace,
   *   MAX_RECENT?: string,
   *   READ_TOKEN?: string,
   * }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return respond(204);
    }

    const maxRecent = Math.min(
      500,
      Math.max(1, Number.parseInt(String(env.MAX_RECENT || '100'), 10) || 100),
    );
    const kv = env.VISIT_LOG;

    if (method === 'POST') {
      const parsed = await parsePayload(request);
      if (!parsed.ok) {
        return json(400, { error: parsed.error });
      }

      const edge = clientMeta(request);
      const entry = buildEntry(parsed.payload, edge);

      if (kv) {
        const key = await storeEntry(kv, entry, maxRecent);
        console.log('visit stored', key, entry.path, edge.connectingIp);
        return respond(204);
      }

      // No KV: acknowledge and leave a Worker log line (wrangler tail / dashboard Logs).
      console.log('visit', JSON.stringify(entry));
      return respond(204);
    }

    if (method === 'GET') {
      const path = url.pathname.replace(/\/+$/, '') || '/';
      if (path !== '/' && path !== '/recent') {
        return json(404, { error: 'not found' });
      }

      if (!kv) {
        return json(501, {
          error: 'KV not configured',
          hint: 'Create a KV namespace, bind as VISIT_LOG in wrangler.toml, redeploy. Until then POST still returns 204 and logs.',
        });
      }

      if (!authorizeRead(request, env.READ_TOKEN)) {
        return json(401, { error: 'unauthorized' });
      }

      const limitParam = Number.parseInt(url.searchParams.get('limit') || '', 10);
      const limit = Number.isFinite(limitParam)
        ? Math.min(maxRecent, Math.max(1, limitParam))
        : maxRecent;
      const entries = await listRecent(kv, limit);
      return json(200, { count: entries.length, entries });
    }

    return json(405, { error: 'method not allowed' });
  },
};
