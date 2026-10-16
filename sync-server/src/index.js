/* inkGuide eşitleme servisi (sync.inkguide.uk)
   Uçtan uca şifreli: kitaplar istemcide, kullanıcının şifresinden türetilen
   anahtarla şifrelenir; bu servis yalnızca okunamayan veri saklar.
   Şifre de buraya gelmez — istemci şifreden iki ayrı anahtar türetir:
   biri kitap anahtarını açar (cihazda kalır), öteki giriş için gönderilir
   (authKey) ve burada yalnızca SHA-256 özeti tutulur. */

const MAX_DATA = 1_900_000;   // shortcut: D1 satır sınırı ~2 MB; daha büyük kitaplar gelirse veriyi R2'ye taşı
const MAX_BOOKS = 300;
const SESSION_DAYS = 365;
const LOCK_AFTER = 10, LOCK_MS = 15 * 60 * 1000;

const ORIGINS = [/^https:\/\/(www\.)?inkguide\.uk$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = ORIGINS.some(r => r.test(origin)) ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    } : {};
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let res;
    try {
      res = await route(req, env);
    } catch (e) {
      res = json({ error: e.expose ? e.message : 'server' }, e.status || 500);
      if (!e.expose) console.error(e);
    }
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  }
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const fail = (msg, status = 400) => Object.assign(new Error(msg), { status, expose: true });

const B64 = /^[A-Za-z0-9+/]+=*$/;
function b64(v, name, max = 512) {
  if (typeof v !== 'string' || !v || v.length > max || !B64.test(v)) throw fail('bad_' + name);
  return v;
}
function username(v) {
  const u = String(v || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,32}$/.test(u)) throw fail('bad_username');
  return u;
}
async function sha256(str) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function sameHash(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  return x.length === y.length && crypto.subtle.timingSafeEqual(x, y);
}
async function body(req) {
  try { return await req.json(); } catch { throw fail('bad_json'); }
}
function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' })[c]);
}
async function openSession(env, user) {
  const token = newToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, username, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), user, Date.now() + SESSION_DAYS * 864e5).run();
  return token;
}
async function authed(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{20,})$/);
  if (!m) throw fail('auth', 401);
  const row = await env.DB.prepare('SELECT username, expires_at FROM sessions WHERE token_hash = ?')
    .bind(await sha256(m[1])).first();
  if (!row || row.expires_at < Date.now()) throw fail('auth', 401);
  return { user: row.username, tokenHash: await sha256(m[1]) };
}

/* Giriş ve kurtarma ortak: hatalı denemeler sayılır, 10'dan sonra 15 dk kilit */
async function checkSecret(env, user, column, secret) {
  const row = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(user).first();
  const now = Date.now();
  if (row && row.locked_until > now) throw fail('locked', 429);
  const ok = row && sameHash(row[column], await sha256(secret));
  if (!ok) {
    if (row) {
      const fails = row.fails + 1;
      await env.DB.prepare('UPDATE users SET fails = ?, locked_until = ? WHERE username = ?')
        .bind(fails >= LOCK_AFTER ? 0 : fails, fails >= LOCK_AFTER ? now + LOCK_MS : 0, user).run();
    }
    throw fail('bad_login', 401);
  }
  if (row.fails) await env.DB.prepare('UPDATE users SET fails = 0 WHERE username = ?').bind(user).run();
  return row;
}

async function route(req, env) {
  const url = new URL(req.url);
  const p = url.pathname, M = req.method;

  if (M === 'POST' && p === '/v1/signup') {
    const b = await body(req);
    const user = username(b.username);
    const exists = await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(user).first();
    if (exists) throw fail('taken', 409);
    await env.DB.prepare(`INSERT INTO users (username, auth_hash, rec_hash, wrapped_p, wrapped_r, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`).bind(
      user, await sha256(b64(b.authKey, 'authKey')), await sha256(b64(b.recAuth, 'recAuth')),
      b64(b.wrappedP, 'wrappedP'), b64(b.wrappedR, 'wrappedR'), Date.now()).run();
    return json({ token: await openSession(env, user) });
  }

  if (M === 'POST' && p === '/v1/login') {
    const b = await body(req);
    const user = username(b.username);
    const row = await checkSecret(env, user, 'auth_hash', b64(b.authKey, 'authKey'));
    return json({ token: await openSession(env, user), wrappedP: row.wrapped_p });
  }

  if (M === 'POST' && p === '/v1/recover') {
    const b = await body(req);
    const user = username(b.username);
    const row = await checkSecret(env, user, 'rec_hash', b64(b.recAuth, 'recAuth'));
    return json({ token: await openSession(env, user), wrappedR: row.wrapped_r });
  }

  const { user, tokenHash } = await authed(req, env);

  if (M === 'POST' && p === '/v1/password') {
    const b = await body(req);
    await env.DB.prepare('UPDATE users SET auth_hash = ?, wrapped_p = ? WHERE username = ?')
      .bind(await sha256(b64(b.authKey, 'authKey')), b64(b.wrappedP, 'wrappedP'), user).run();
    // Şifre değişince (ör. kurtarma sonrası) diğer cihazların oturumları kapanır
    await env.DB.prepare('DELETE FROM sessions WHERE username = ? AND token_hash != ?').bind(user, tokenHash).run();
    return json({ ok: true });
  }

  if (M === 'POST' && p === '/v1/logout') {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return json({ ok: true });
  }

  if (M === 'GET' && p === '/v1/books') {
    const { results } = await env.DB.prepare('SELECT id, rev, deleted, updated_at FROM books WHERE username = ?')
      .bind(user).all();
    return json({ books: results.map(r => ({ id: r.id, rev: r.rev, deleted: !!r.deleted, updatedAt: r.updated_at })) });
  }

  const m = p.match(/^\/v1\/books\/([0-9a-f-]{36})$/);
  if (m) {
    const id = m[1];
    const current = () => env.DB.prepare('SELECT rev, data, deleted, updated_at FROM books WHERE username = ? AND id = ?')
      .bind(user, id).first();

    if (M === 'GET') {
      const r = await current();
      if (!r) throw fail('not_found', 404);
      return json({ id, rev: r.rev, data: r.data, deleted: !!r.deleted, updatedAt: r.updated_at });
    }

    if (M === 'PUT') {
      const b = await body(req);
      const data = b64(b.data, 'data', MAX_DATA);
      const baseRev = Number.isInteger(b.baseRev) && b.baseRev >= 0 ? b.baseRev : 0;
      const now = Date.now();
      // Yalnızca istemcinin gördüğü sürümün üstüne yazılır; araya başka cihaz girdiyse 409
      let r = await env.DB.prepare(`UPDATE books SET rev = rev + 1, data = ?, deleted = 0, updated_at = ?
        WHERE username = ? AND id = ? AND rev = ?`).bind(data, now, user, id, baseRev).run();
      if (!r.meta.changes && baseRev === 0) {
        const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM books WHERE username = ?').bind(user).first();
        if (n.n >= MAX_BOOKS) throw fail('too_many', 413);
        r = await env.DB.prepare(`INSERT INTO books (username, id, rev, data, deleted, updated_at)
          VALUES (?, ?, 1, ?, 0, ?) ON CONFLICT DO NOTHING`).bind(user, id, data, now).run();
      }
      if (!r.meta.changes) {
        const c = await current();
        return json({ conflict: true, rev: c.rev, data: c.data, deleted: !!c.deleted }, 409);
      }
      return json({ rev: (await current()).rev });
    }

    if (M === 'DELETE') {
      await env.DB.prepare(`UPDATE books SET rev = rev + 1, data = NULL, deleted = 1, updated_at = ?
        WHERE username = ? AND id = ?`).bind(Date.now(), user, id).run();
      return json({ ok: true });
    }
  }

  throw fail('not_found', 404);
}
