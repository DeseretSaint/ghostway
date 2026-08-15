// Ghostway service worker — makes the app installable and usable offline.
// Caches map/API responses on first use (stale-while-revalidate) so a viewed
// area still renders without signal. The APP SHELL is served network-first and
// only falls back to cache when offline, so a new deploy reaches users
// immediately (a cached shell would otherwise stick forever across versions).

// Bump this on every release that changes the shell — it invalidates old caches.
const VERSION = 'ghostway-v19';
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
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

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

  // Only handle same-origin navigations + tiles + api.
  if (url.origin !== self.location.origin && !isTile(url) && !isApi(url)) return;

  if (isApi(url) || isTile(url)) {
    event.respondWith(staleWhileRevalidate(req, TILES));
    return;
  }

  // App shell (navigation / index.html / manifest / icons): NETWORK-FIRST so a
  // new deploy is picked up immediately; fall back to cache when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, SHELL));
  }
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.status === 200 && req.method === 'GET') cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    return hit || (await cache.match('./index.html')) || Response.error();
  }
}

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
