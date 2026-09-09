// Camera count truth-check: load cameras.geojson, route multiple corridors
// on the prebuilt graph, and assert the badge count matches the raw distance
// scan for each. FAILS if the badge count doesn't match the raw scan.
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

// ---- Corridors to test ----
const CORRIDORS = [
  { name: 'PG → Costco Lehi', from: [-111.759, 40.364], to: [-111.834, 40.394], expect: 'any' },
  { name: 'PG → Lindon', from: [-111.759, 40.364], to: [-111.720, 40.345], expect: 0 },
  { name: 'PG → BYU Provo', from: [-111.759, 40.364], to: [-111.6553, 40.2523], expect: 'multiple' },
  { name: 'PG → Downtown SLC', from: [-111.759, 40.364], to: [-111.891, 40.7608], expect: 'multiple' },
];

// ---- Raw distance scan helper ----
const RAD = Math.PI / 180;
function rawCameraCount(coords, from, to) {
  const cosLat = Math.cos(((from[1] + to[1]) / 2) * RAD);
  const kx = 111320 * cosLat;
  const ky = 110540;
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
  return trueCount;
}

let failures = 0;

for (const c of CORRIDORS) {
  console.log(`\n=== ${c.name} ===`);
  console.log('Planning routes (loads graph first)…');
  const { options } = await planRoutes(c.from, c.to, { deflockCams: cams });

  for (const o of options) {
    console.log(
      `  ${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1)} km  ` +
      `${Math.round(o.duration / 60)} min  cameras: ${o.cameras}`
    );
  }

  // ---- Truth check: raw distance scan of all cameras vs route polyline ----
  for (const o of options) {
    if (o.mode !== 'strict') continue; // test the badge mode
    const coords = o.route.coords || o.coords;
    if (!coords || coords.length < 2) {
      console.log(`  SKIP ${o.mode}: no polyline`);
      continue;
    }

    const trueCount = rawCameraCount(coords, c.from, c.to);
    const badge = o.cameras ?? 0;
    const status = badge === trueCount ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${o.mode}: badge=${badge} truth=${trueCount}`);
    if (badge !== trueCount) {
      console.log(`    MISMATCH — badge claims ${badge}, raw scan found ${trueCount} cameras within 75m`);
      failures++;
    }

    // Assert expected camera count semantics
    if (c.expect === 0 && trueCount !== 0) {
      console.log(`    EXPECTED 0 cameras but found ${trueCount}`);
      failures++;
    } else if (c.expect === 'multiple' && trueCount < 1) {
      console.log(`    EXPECTED multiple cameras but found ${trueCount}`);
      failures++;
    }
  }
}

console.log('');
if (failures === 0) {
  console.log('COUNT-TRUTH-CHECK PASS ✅ — all corridors: badge matches raw distance scan');
  process.exit(0);
} else {
  console.log(`COUNT-TRUTH-CHECK FAIL ❌ — ${failures} mismatch(es)`);
  process.exit(1);
}
