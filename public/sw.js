// Ghostway service worker — makes the app installable and usable offline.
// Caches the app shell immediately; caches map/API responses on first use
// (stale-while-revalidate) so a saved route still renders without signal.

const VERSION = 'ghostway-v1';
const SHELL = `${VERSION}-shell`;
const TILES = `${VERSION}-tiles`;

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Classify a request: tile (PMTiles/MVT/XYZ) and API (routing/search) get
// stale-while-revalidate; the app shell gets cache-first then network.
function isTile(url) {
  return (
    /\.(pbf|mvt|png|jpg|webp)(\?|$)/.test(url.pathname) ||
    url.hostname.includes('openfreemap.org') ||
    url.hostname.includes('dontgetflocked.com') ||
    url.hostname.includes('maplibre') ||
    /\/tiles?\//.test(url.pathname) ||
    /\/\{z\}\//.test(url.pathname)
  );
}
function isApi(url) {
  return (
    url.hostname.includes('brouter.de') ||
    url.hostname.includes('photon.komoot.io') ||
    url.hostname.includes('routing.openstreetmap.de') ||
    url.hostname.includes('overpass-api.de')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (isApi(url) || isTile(url)) {
    event.respondWith(staleWhileRevalidate(req, TILES));
    return;
  }

  // App shell: cache-first, fall back to cached index when offline.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).catch(() => caches.match('./index.html').then((h) => h || Response.error()))
    )
  );
});

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || network;
}
