/* Mobil şifreleme — lib/mobil.js'teki zarfla birebir aynı format.
   Neden crypto.subtle değil: sayfa yerel ağda http://<ip> üzerinden açıldığında
   tarayıcı "güvenli bağlam" saymaz ve crypto.subtle vermez. Bu yüzden saf JS
   aes-js (AES-256-CTR) + js-sha256 (HMAC) kullanılır: encrypt-then-MAC.
   Rastgelelik için crypto.getRandomValues her bağlamda çalışır. */

const MobilKripto = (() => {

  function b64uToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function b64ToBytes(s) { return b64uToBytes(s); }

  function bytesToB64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function concat(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0); out.set(b, a.length);
    return out;
  }

  // Sırdan anahtar türetme: sunucuyla aynı etiketler
  function keysFrom(secretB64u) {
    const secret = b64uToBytes(secretB64u);
    const enc = new Uint8Array(sha256.hmac.array(secret, 'inkguide-enc'));
    const mac = new Uint8Array(sha256.hmac.array(secret, 'inkguide-mac'));
    return { enc, mac };
  }

  function seal(secretB64u, obj) {
    const { enc, mac } = keysFrom(secretB64u);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const pt = new TextEncoder().encode(JSON.stringify(obj));
    const ct = new aesjs.ModeOfOperation.ctr(enc, new aesjs.Counter(iv)).encrypt(pt);
    const tag = new Uint8Array(sha256.hmac.array(mac, concat(iv, ct)));
    return { v: 1, iv: bytesToB64(iv), ct: bytesToB64(ct), mac: bytesToB64(tag) };
  }

  // Doğrulanamayan zarf → null
  function open(secretB64u, env) {
    try {
      if (!env || env.v !== 1) return null;
      const { enc, mac } = keysFrom(secretB64u);
      const iv = b64ToBytes(env.iv);
      const ct = b64ToBytes(env.ct);
      const expect = new Uint8Array(sha256.hmac.array(mac, concat(iv, ct)));
      const given = b64ToBytes(env.mac);
      if (given.length !== expect.length) return null;
      let diff = 0;
      for (let i = 0; i < given.length; i++) diff |= given[i] ^ expect[i];
      if (diff !== 0) return null;
      const pt = new aesjs.ModeOfOperation.ctr(enc, new aesjs.Counter(iv)).decrypt(ct);
      return JSON.parse(new TextDecoder().decode(pt));
    } catch {
      return null;
    }
  }

  return { seal, open };
})();
