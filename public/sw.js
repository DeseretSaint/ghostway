// Ghostway service worker — makes the app installable and usable offline.
// Caches map/API responses on first use (stale-while-revalidate) so a viewed
// area still renders without signal. The APP SHELL is served network-first and
// only falls back to cache when offline, so a new deploy reaches users
// immediately (a cached shell would otherwise stick forever across versions).

// Bump this on every release that changes the shell — it invalidates old caches.
const VERSION = 'ghostway-v22';
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
    event.respondWith(staleWhileRevalidate(req, TILES, event));
    return;
  }

  // App shell (navigation / index.html / manifest / icons): NETWORK-FIRST so a
  // new deploy is picked up immediately; fall back to cache when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, SHELL, event));
  }
});

// Read a response's body exactly ONCE and return a fresh Response built from
// the buffered bytes, so both the page and the cache get an independent copy.
// Using res.clone() + reading both sides of the tee simultaneously deadlocks on
// large bodies (e.g. the ~6 MB road graph): the SW's cache.put consumer starves
// the page's res.arrayBuffer() read, so the local engine's graph download never
// resolves and cold routes hang forever on "Downloading map data…". Reading once
// into a buffer and serving that buffer to both sides removes the tee entirely.
function cacheNameFor(req) {
  const url = new URL(req.url);
  return isTile(url) || isApi(url) ? TILES : SHELL;
}

async function consume(req, event) {
  const res = await fetch(req);
  if (!res || res.status !== 200 || req.method !== 'GET') return res;
  const buf = await res.arrayBuffer();
  const put = caches.open(cacheNameFor(req)).then((c) => c.put(req, new Response(buf, { headers: res.headers, status: res.status })));
  event.waitUntil(put.catch(() => {}));
  return new Response(buf, { headers: res.headers, status: res.status });
}

async function networkFirst(req, cacheName, event) {
  try {
    return await consume(req, event);
  } catch (e) {
    const hit = await caches.open(cacheName).then((c) => c.match(req));
    return hit || (await caches.open(cacheName).then((c) => c.match('./index.html'))) || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName, event) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = consume(req, event).catch(() => hit);
  return hit || network;
}
