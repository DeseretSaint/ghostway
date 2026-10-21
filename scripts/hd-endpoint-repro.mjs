// Repro for 2026-10-20 routing failure: PG -> Home Depot American Fork.
// Measures the SERVED strict polyline over its WHOLE length, endpoints
// included, against the raw ALPR snapshot the audit uses.
import { planRoutes, loadGraph } from '../src/router.js';
import { isAlprCamera } from '../src/config.js';
import { readFileSync } from 'node:fs';

const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  if (String(url).includes('wasatch-graph.bin.gz')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  return realFetch(url, opts);
};
await loadGraph();

const gj = JSON.parse(readFileSync('engine/data/cameras-usa.geojson', 'utf8'));
const cams = [];
for (const f of gj.features) {
  if (!isAlprCamera(f.properties || {})) continue;
  const [lon, lat] = f.geometry.coordinates;
  cams.push({ lon, lat });
}
console.log('ALPR cameras:', cams.length);

const FROM = [-111.759, 40.364];
const TO = [-111.8229, 40.3842];
const pad = 0.05;
const pool = cams.filter((c) =>
  c.lon > Math.min(FROM[0], TO[0]) - pad && c.lon < Math.max(FROM[0], TO[0]) + pad &&
  c.lat > Math.min(FROM[1], TO[1]) - pad && c.lat < Math.max(FROM[1], TO[1]) + pad);
console.log('pool near corridor:', pool.length);

function minAll(coords, list) {
  let best = Infinity, at = null;
  const kx = 111320 * Math.cos((coords[0][1] * Math.PI) / 180), ky = 110540;
  for (const c of list) {
    const cx = c.lon * kx, cy = c.lat * ky;
    for (let i = 0; i < coords.length - 1; i++) {
      const x1 = coords[i][0] * kx, y1 = coords[i][1] * ky;
      const x2 = coords[i + 1][0] * kx, y2 = coords[i + 1][1] * ky;
      const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
      let t = L2 ? ((cx - x1) * dx + (cy - y1) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(cx - (x1 + t * dx), cy - (y1 + t * dy));
      if (d < best) { best = d; at = [c.lon, c.lat]; }
    }
  }
  return { min: best, at };
}
function distToLine(coords, c) {
  const kx = 111320 * Math.cos((coords[0][1] * Math.PI) / 180), ky = 110540;
  let best = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const x1 = coords[i][0] * kx, y1 = coords[i][1] * ky;
    const x2 = coords[i + 1][0] * kx, y2 = coords[i + 1][1] * ky;
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
    let t = L2 ? ((c.lon * kx - x1) * dx + (c.lat * ky - y1) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(c.lon * kx - (x1 + t * dx), c.lat * ky - (y1 + t * dy));
    if (d < best) best = d;
  }
  return best;
}
function nearCount(coords, list, r = 75) { return list.filter((c) => distToLine(coords, c) < r).length; }

for (const [tag, opts] of [['no-pool', {}], ['with-pool', { deflockCams: pool }]]) {
  const { options } = await planRoutes(FROM, TO, opts);
  console.log('\n=== ' + tag + ' ===');
  for (const o of options) {
    const coords = o.route.coords;
    const m = minAll(coords, cams);
    const end = coords[coords.length - 1];
    console.log(`${o.mode.padEnd(8)} label=${o.label} cams=${o.cameras} corridor=${o.corridorCount || 0}` +
      ` fallback=${!!o.strictFallback} clearToM=${Math.round(o.clearToM || 0)} servedTo=${end.map((v) => v.toFixed(5)).join(',')}` +
      ` offEnd=${o.destOffsetM ?? '-'}m minCam=${m.min.toFixed(1)}m near75=${nearCount(coords, cams)}`);
    if (o.nearCameras) console.log('   nearCameras:', JSON.stringify(o.nearCameras));
  }
}
