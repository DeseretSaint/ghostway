// Hermetic test for the persistent camera-cache (gw-cam-cache) in CameraStore.
// Verifies: initial empty state → fetch populates → reload rehydrates → TTL staleness clears.
import { CameraStore } from '../src/camera-store.js';
import { readFileSync } from 'node:fs';

const CACHE_KEY = 'gw-cam-cache';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock a minimal fetch that returns synthetic camera data.
function makeMockFetch(syntheticFeats) {
  return async (url) => {
    const u = String(url);
    if (u.includes('cameras.geojson')) {
      return { ok: true, status: 200, json: async () => ({ type: 'FeatureCollection', features: syntheticFeats }) };
    }
    if (u.includes('overpass')) {
      return { ok: true, status: 200, json: async () => ({ elements: syntheticFeats.map((f) => ({ lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], tags: f.properties, id: f.properties.osmId })) }) };
    }
    throw new Error('unexpected fetch: ' + u);
  };
}

const syntheticFeats = [
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-111.76, 40.35] }, properties: { brand: 'Flock Safety', operator: '', kind: 'camera', osmId: 1 } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [-111.77, 40.36] }, properties: { brand: 'Flock Safety', operator: '', kind: 'camera', osmId: 2 } },
];

let pass = true;
function assert(cond, msg) {
  if (!cond) {
    console.log('FAIL:', msg);
    pass = false;
  } else {
    console.log('OK:', msg);
  }
}

// Ensure clean localStorage
if (typeof localStorage !== 'undefined') localStorage.removeItem(CACHE_KEY);
// Node 24+ has global localStorage; if not, use a polyfill
if (typeof localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const realFetch = globalThis.fetch;
globalThis.fetch = makeMockFetch(syntheticFeats);

try {
  // --- Test 1: initial state ---
  const store1 = new CameraStore();
  const rehydrated = store1.rehydrate();
  assert(rehydrated === 0, 'Test 1: no cache rehydrated from empty localStorage');

  // --- Test 2: fetch populates pool + persists ---
  const bbox = [-111.8, 40.3, -111.7, 40.4];
  const pool = await store1.getCameras(bbox);
  assert(pool.length === 2, `Test 2: fetch populates pool (${pool.length} features)`);

  // Verify localStorage was written
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
  assert(cached && cached.pools, 'Test 2b: localStorage has cache data');
  assert(Object.keys(cached.pools).length === 1, 'Test 2c: one bbox key persisted');

  // --- Test 3: new store rehydrates from localStorage ---
  const store2 = new CameraStore();
  const rehydrated2 = store2.rehydrate();
  assert(rehydrated2 === 1, 'Test 3: rehydrated 1 pool from localStorage');

  // Pool should be served from rehydrated cache (no new fetch needed)
  const pool2 = await store2.getCameras(bbox);
  assert(pool2.length === 2, `Test 3b: rehydrated pool has ${pool2.length} features`);

  // --- Test 4: rehydrate is idempotent ---
  const rehydrated3 = store2.rehydrate();
  assert(rehydrated3 === 0, 'Test 4: second rehydrate returns 0 (already done)');

  // --- Test 5: stale cache (expired TTL) is cleared ---
  // Manually write an old cache entry
  const oldData = {
    version: 1,
    ts: Date.now() - 8 * 24 * 3600 * 1000, // 8 days ago
    pools: { 'old-bbox': syntheticFeats },
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(oldData));
  const store3 = new CameraStore();
  const rehydrated4 = store3.rehydrate();
  assert(rehydrated4 === 0, 'Test 5: stale cache (8 days old) not rehydrated');
  assert(localStorage.getItem(CACHE_KEY) === null, 'Test 5b: stale cache cleared from localStorage');

  // --- Test 6: version mismatch discards cache ---
  const badVerData = {
    version: 99,
    ts: Date.now(),
    pools: { 'bad-bbox': syntheticFeats },
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(badVerData));
  const store4 = new CameraStore();
  const rehydrated5 = store4.rehydrate();
  assert(rehydrated5 === 0, 'Test 6: version mismatch discards cache');

  // --- Test 7: cache survives "reload" (new store, same localStorage) ---
  // Write fresh cache via store1's _persist
  localStorage.removeItem(CACHE_KEY);
  const freshStore = new CameraStore();
  await freshStore.getCameras(bbox); // fetch + persist
  const rawAfterPersist = localStorage.getItem(CACHE_KEY);
  assert(rawAfterPersist !== null, 'Test 7: cache persisted after fetch');

  // Simulate reload: new store reads same localStorage
  const reloadedStore = new CameraStore();
  const rehydrated6 = reloadedStore.rehydrate();
  assert(rehydrated6 === 1, 'Test 7b: reloaded store rehydrates from localStorage');
  const poolAfterReload = await reloadedStore.getCameras(bbox);
  assert(poolAfterReload.length === 2, `Test 7c: pool survives reload (${poolAfterReload.length} features)`);

  console.log(pass ? '\\nPERSISTENT CAMERA CACHE PASS ✅' : '\\nPERSISTENT CAMERA CACHE FAIL ❌');
  globalThis.fetch = realFetch;
  process.exit(pass ? 0 : 1);
} catch (e) {
  console.error('test threw:', e);
  globalThis.fetch = realFetch;
  process.exit(1);
}
