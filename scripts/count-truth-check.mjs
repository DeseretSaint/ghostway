// count-truth-check.mjs — Field-truth assertion for camera badges.
// Loads the shipped cameras.geojson, runs the real router for PG→Costco Lehi,
// recomputes the corridor count INDEPENDENTLY from raw polyline distance,
// and asserts the badge's count matches. FAILS if the badge says 0 but a
// camera is within 75 m of the route polyline.
import { planRoutes } from '../src/router.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const gz = readFileSync(join(DIR, '..', 'public', 'graph', 'wasatch-graph.bin.gz'));
const geojson = JSON.parse(readFileSync(join(DIR, '..', 'public', 'cameras', 'cameras.geojson'), 'utf8'));

// Shim fetch to serve the local gz graph.
globalThis.fetch = async () => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  return { ok: true, status: 200, arrayBuffer: async () => ab };
};

const FROM = [-111.759, 40.364]; // Pleasant Grove
const TO = [-111.834, 40.394]; // Costco Lehi (1200 East)

// Filter cameras to the corridor bbox (same pad as deflockCamsNear).
const pad = 0.05;
const w = Math.min(FROM[0], TO[0]) - pad, e = Math.max(FROM[0], TO[0]) + pad;
const s = Math.min(FROM[1], TO[1]) - pad, n = Math.max(FROM[1], TO[1]) + pad;
const corridorCams = geojson.features
  .map((f) => ({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }))
  .filter((c) => c.lon >= w && c.lon <= e && c.lat >= s && c.lat <= n);

console.log(`planning routes with ${corridorCams.length} corridor cameras…`);
const { options } = await planRoutes(FROM, TO, { deflockCams: corridorCams });

// Independent raw-distance count: project each camera to the route polyline,
// count how many are within 75 m. This is the GROUND TRUTH.
function rawCorridorCount(coords, cams) {
  if (!coords.length || !cams.length) return 0;
  const rad = Math.PI / 180;
  const cos0 = Math.cos(((coords[0][1] + coords[coords.length - 1][1]) / 2) * rad);
  const kx = 111320 * cos0, ky = 110540;
  let count = 0;
  for (const c of cams) {
    const cx = c.lon * kx, cy = c.lat * ky;
    let best = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const x1 = coords[i][0] * kx, y1 = coords[i][1] * ky;
      const x2 = coords[i + 1][0] * kx, y2 = coords[i + 1][1] * ky;
      const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
      let t = L2 ? ((cx - x1) * dx + (cy - y1) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx, py = y1 + t * dy;
      const d2 = (cx - px) ** 2 + (cy - py) ** 2;
      if (d2 < best) best = d2;
    }
    if (best < 75 * 75) count++;
  }
  return count;
}

let allPass = true;
for (const o of options) {
  const truth = rawCorridorCount(o.coords, corridorCams);
  const badge = o.cameras || 0;
  const ok = badge === truth;
  console.log(
    `${o.mode.padEnd(9)} badge=${badge}  truth=${truth}  ${ok ? '✅' : '❌ MISMATCH'}`
  );
  if (!ok) allPass = false;
}

// Hard assertion: if ANY option's badge says 0 but truth > 0, FAIL.
const lying = options.filter((o) => (o.cameras || 0) === 0 && rawCorridorCount(o.coords, corridorCams) > 0);
if (lying.length) {
  console.error(`\nFAIL ❌ — ${lying.length} option(s) lie: badge says 0 but cameras are within 75 m`);
  process.exit(1);
}

console.log(allPass ? '\nPASS ✅ — all badges match raw-distance truth' : '\nFAIL ❌ — badge/truth mismatch');
process.exit(allPass ? 0 : 1);
