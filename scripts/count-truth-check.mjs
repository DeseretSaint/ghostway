// Camera count truth-check: load cameras.geojson, route PG→Costco Lehi on
// the prebuilt graph, and assert the badge count matches the raw distance
// scan. FAILS if the badge claims "0 cameras" but a camera is within 75 m.
import { planRoutes } from '../src/router.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));

// ---- Load graph (shim fetch → local bin) ----
const gz = readFileSync(join(DIR, '..', 'public', 'graph', 'wasatch-graph.bin.gz'));
globalThis.fetch = async () => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  return { ok: true, status: 200, arrayBuffer: async () => ab };
};

// ---- Load cameras.geojson ----
const geojson = JSON.parse(readFileSync(join(DIR, '..', 'public', 'cameras', 'cameras.geojson'), 'utf8'));
const cams = (geojson.features || []).map((f) => ({
  lon: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
}));

console.log(`Loaded ${cams.length} cameras\n`);

// ---- Route PG → Costco Lehi ----
const FROM = [-111.759, 40.364]; // Pleasant Grove
const TO = [-111.834, 40.394];   // Costco Lehi

console.log('Planning routes (loads graph first)…');
const { options } = await planRoutes(FROM, TO, { deflockCams: cams });
console.log('');

for (const o of options) {
  console.log(
    `${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1)} km  ` +
    `${Math.round(o.duration / 60)} min  cameras: ${o.cameras}`
  );
}
console.log('');

// ---- Truth check: raw distance scan of all cameras vs route polyline ----
const RAD = Math.PI / 180;
const cosLat = Math.cos(((FROM[1] + TO[1]) / 2) * RAD);
const kx = 111320 * cosLat;
const ky = 110540;

let failures = 0;
for (const o of options) {
  if (o.mode !== 'strict') continue; // test the badge mode
  const coords = o.route.coords || o.coords;
  if (!coords || coords.length < 2) {
    console.log(`SKIP ${o.mode}: no polyline`);
    continue;
  }

  // Raw distance from each camera to the route polyline (meters)
  let trueCount = 0;
  for (const c of cams) {
    const cx = c.lon * kx;
    const cy = c.lat * ky;
    let best = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const x1 = coords[i][0] * kx, y1 = coords[i][1] * ky;
      const x2 = coords[i + 1][0] * kx, y2 = coords[i + 1][1] * ky;
      const dx = x2 - x1, dy = y2 - y1;
      const L2 = dx * dx + dy * dy;
      let t = L2 ? ((cx - x1) * dx + (cy - y1) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx, py = y1 + t * dy;
      const d2 = (cx - px) ** 2 + (cy - py) ** 2;
      if (d2 < best) best = d2;
    }
    if (best < 75 * 75) trueCount++;
  }

  const badge = o.cameras ?? 0;
  const status = badge === trueCount ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${o.mode}: badge=${badge} truth=${trueCount}`);
  if (badge !== trueCount) {
    console.log(`  MISMATCH — badge claims ${badge}, raw scan found ${trueCount} cameras within 75m`);
    failures++;
  }
}

console.log('');
if (failures === 0) {
  console.log('COUNT-TRUTH-CHECK PASS ✅ — badge matches raw distance scan');
  process.exit(0);
} else {
  console.log(`COUNT-TRUTH-CHECK FAIL ❌ — ${failures} mismatch(es)`);
  process.exit(1);
}
