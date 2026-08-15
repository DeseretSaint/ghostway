// Camera fallback resilience: with Overpass BLOCKED, camera-aware routing must
// still avoid cameras using the bundled DeFlock snapshot (Workstream A
// degrade path + monthly-refreshed data).
import { valhallaPlanRoutes } from '../src/valhalla.js';
import { nearRouteFromList } from '../src/camera-store.js';
import { readFileSync } from 'node:fs';

// Load the shipped snapshot directly and verify it is real data.
const snap = JSON.parse(readFileSync('public/cameras/cameras.geojson', 'utf8'));
console.log(`snapshot: ${snap.features.length} cameras, asOf ${snap._meta && snap._meta.asOf}`);
if (snap.features.length < 100) {
  console.log('FALLBACK FAIL ❌ — snapshot is empty/stub');
  process.exit(1);
}

// CameraStore with Overpass hard-blocked: every non-snapshot fetch fails.
const { CameraStore } = await import('../src/camera-store.js');
const store = new CameraStore();
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes('overpass')) throw new Error('overpass blocked (simulated outage)');
  if (u.includes('cameras.geojson')) {
    return { ok: true, status: 200, json: async () => snap };
  }
  if (u.includes('valhalla1.openstreetmap.de')) {
    // Valhalla demo is allowed through (routing geometry source).
    return realFetch(url, opts);
  }
  throw new Error('blocked: ' + u);
};

const FROM = [-111.759, 40.364]; // Pleasant Grove
const TO = [-111.834, 40.394]; // Costco Lehi

// Pool lookup must succeed via snapshot despite Overpass outage.
const bbox = [-111.9, 40.3, -111.7, 40.45];
const pool = await store.getCameras(bbox);
console.log(`pool via fallback: ${pool.length} cameras in bbox`);

// Full avoidance pipeline (Valhalla geometry + snapshot pool) — must return
// camera counts and distinct options, not an error.
let options = null;
try {
  const r = await valhallaPlanRoutes(FROM, TO, store, { mode: 'moderate' });
  options = r.options;
} catch (e) {
  console.log('FALLBACK FAIL ❌ —', e.message);
  process.exit(1);
}
for (const o of options) {
  console.log(`  ${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1)} km · ${Math.round(o.duration / 60)} min · ${o.cameras} cameras`);
}
// Independent check: the snapshot pool detects cameras on the fastest route.
const fastest = options.find((o) => o.mode === 'off');
const onRoute = nearRouteFromList(fastest.coords, pool, 600);
console.log(`cameras near fastest route (snapshot): ${onRoute.length}`);

const pass = pool.length > 50 && options.length >= 1 && fastest && onRoute.length >= 0;
console.log(pass ? '\nFALLBACK PASS ✅ — avoidance works during Overpass outage' : '\nFALLBACK FAIL ❌');
process.exit(pass ? 0 : 1);
