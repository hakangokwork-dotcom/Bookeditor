/* inkGuide Mobil service worker — uygulama kabuğunu önbelleğe alır ki
   sayfa (güvenli bağlamda: https/localhost) çevrimdışıyken de açılabilsin.
   Yerel ağ http'de tarayıcı service worker'a izin vermez; sayfa yine çalışır,
   yalnızca çevrimdışı açılış garantisi olmaz. */

const CACHE = 'inkguide-mobil-v1';
const SHELL = [
  './',
  'index.html',
  'mobil.css',
  'mobil.js',
  'kripto.js',
  'ikon.svg',
  'manifest.webmanifest',
  '/i18n.js',
  '/vendor/aes.js',
  '/vendor/sha256.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// API istekleri her zaman ağa gider; kabuk dosyaları önbellekten (yoksa ağdan) gelir
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && url.origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
