// Camera count truth-check: load cameras.geojson, geocode corridor endpoints
// (matching UI behavior), route on the prebuilt graph, and assert the badge
// count matches the raw distance scan for each. FAILS if the badge count
// doesn't match the raw scan.
import { planRoutes } from '../src/router.js';
import { searchPlaces } from '../src/search.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));

// ---- Save native fetch BEFORE shimming ----
const nativeFetch = globalThis.fetch;

// ---- Load graph (shim fetch → local bin) ----
const gz = readFileSync(join(DIR, '..', 'public', 'graph', 'wasatch-graph.bin.gz'));
globalThis.fetch = async (url) => {
  if (typeof url === 'string' && (url.includes('graph') || url.includes('bin'))) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  // Real fetch for Photon geocoding
  return nativeFetch(url);
};

// ---- Load cameras.geojson ----
const geojson = JSON.parse(readFileSync(join(DIR, '..', 'public', 'cameras', 'cameras.geojson'), 'utf8'));
const cams = (geojson.features || []).map((f) => ({
  lon: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
}));

console.log(`Loaded ${cams.length} cameras\n`);

// ---- Corridors to test (geocoded to match UI) ----
const CORRIDOR_QUERIES = [
  { name: 'PG → Costco Lehi', from: 'Pleasant Grove, Utah', to: 'Costco Lehi, Utah', expect: 'any' },
  { name: 'PG → Lindon', from: 'Pleasant Grove, Utah', to: 'Lindon, Utah', expect: 0 },
  { name: 'PG → BYU Provo', from: 'Pleasant Grove, Utah', to: 'BYU Provo, Utah', expect: 'multiple' },
  { name: 'PG → Downtown SLC', from: 'Pleasant Grove, Utah', to: 'Downtown Salt Lake City, Utah', expect: 'multiple' },
];

// ---- Geocode endpoints ----
async function geocode(query) {
  const results = await searchPlaces(query, 1);
  if (!results || results.length === 0) {
    throw new Error(`Geocoding failed for: ${query}`);
  }
  return { lon: results[0].coords[0], lat: results[0].coords[1] };
}

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

for (const c of CORRIDOR_QUERIES) {
  console.log(`\n=== ${c.name} ===`);

  // Geocode endpoints (matching UI behavior)
  console.log(`Geocoding "${c.from}" → "${c.to}"...`);
  const fromCoords = await geocode(c.from);
  const toCoords = await geocode(c.to);
  console.log(`From: [${fromCoords.lon.toFixed(6)}, ${fromCoords.lat.toFixed(6)}]`);
  console.log(`To:   [${toCoords.lon.toFixed(6)}, ${toCoords.lat.toFixed(6)}]`);

  const from = [fromCoords.lon, fromCoords.lat];
  const to = [toCoords.lon, toCoords.lat];

  console.log('Planning routes (loads graph first)…');
  const { options } = await planRoutes(from, to, { deflockCams: cams });

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

    const trueCount = rawCameraCount(coords, from, to);
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
  console.log('COUNT-TRUTH-CHECK PASS ✅ — all corridors: badge matches raw distance scan (geocoded endpoints)');
  process.exit(0);
} else {
  console.log(`COUNT-TRUTH-CHECK FAIL ❌ — ${failures} mismatch(es)`);
  process.exit(1);
}
