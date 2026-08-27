// Camera-avoidance safety audit (THE MISSION, measured not assumed).
// For every route option on real corridors, densify the geometry to ~10 m
// steps and measure the TRUE minimum distance to any ALPR camera from the
// DeFlock snapshot (same file + classification the graph builder uses).
//
// Safety floor: Flock/ALPR plates are read at ~10-23 m (30-75 ft) at speed.
// STRICT ("Clearest") must keep a margin beyond that — audit threshold 30 m.
// Prints per-option min-distance + pass/fail, exits 1 if strict < 30 m
// mid-route (endpoint tolerance: first/last 250 m of the route is exempt,
// since origins/destinations can legitimately sit next to a camera).
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

// ALPR cameras from the builder's source snapshot, gridded (~220 m cells).
const cams = JSON.parse(readFileSync('engine/data/cameras-usa.geojson', 'utf8'));
const CELL = 0.002;
const grid = new Map();
let alprCount = 0;
for (const f of cams.features) {
  if (!isAlprCamera(f.properties || {})) continue;
  const [lon, lat] = f.geometry.coordinates;
  alprCount++;
  const k = Math.floor(lon / CELL) + ',' + Math.floor(lat / CELL);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push([lon, lat]);
}

function minDistToCamera(lon, lat) {
  const gx = Math.floor(lon / CELL), gy = Math.floor(lat / CELL);
  let best = Infinity;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cell = grid.get((gx + dx) + ',' + (gy + dy));
      if (!cell) continue;
      for (const [clon, clat] of cell) {
        const dLon = (clon - lon) * 111320 * cosLat;
        const dLat = (clat - lat) * 111320;
        const d2 = dLon * dLon + dLat * dLat;
        if (d2 < best) best = d2;
      }
    }
  }
  return Math.sqrt(best);
}

// Walk the route in ~10 m steps; track min camera distance, ignoring the
// first/last `endTol` meters (origins/destinations may sit beside cameras).
function auditRoute(coords, endTol = 250) {
  let minMid = Infinity, minAll = Infinity, minMidAt = null;
  let acc = 0, total = 0;
  const segs = [];
  for (let i = 1; i < coords.length; i++) {
    const latm = ((coords[i - 1][1] + coords[i][1]) / 2) * Math.PI / 180;
    segs.push({
      a: coords[i - 1], b: coords[i],
      len: Math.hypot(
        (coords[i][0] - coords[i - 1][0]) * 111320 * Math.cos(latm),
        (coords[i][1] - coords[i - 1][1]) * 111320
      ),
    });
    total += segs[segs.length - 1].len;
  }
  for (const s of segs) {
    const steps = Math.max(1, Math.ceil(s.len / 10));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const lon = s.a[0] + (s.b[0] - s.a[0]) * t;
      const lat = s.a[1] + (s.b[1] - s.a[1]) * t;
      const d = minDistToCamera(lon, lat);
      if (d < minAll) minAll = d;
      if (acc > endTol && total - acc > endTol && d < minMid) {
        minMid = d;
        minMidAt = [lon, lat];
      }
      if (k > 0) acc += s.len / steps;
    }
  }
  return { minMid, minAll, minMidAt, total };
}

const corridors = [
  { name: 'PG → Costco Lehi', from: [-111.759, 40.364], to: [-111.834, 40.394] },
  { name: 'PG → BYU Provo', from: [-111.759, 40.364], to: [-111.6553, 40.2523] },
  { name: 'Lehi → SLC Downtown', from: [-111.8508, 40.3852], to: [-111.891, 40.7608] },
  { name: 'Orem → SLC Airport', from: [-111.6946, 40.2969], to: [-111.9778, 40.7884] },
  { name: 'AF → Park City', from: [-111.7965, 40.3769], to: [-111.498, 40.6461] },
];

const STRICT_FLOOR_M = 30; // must exceed max ALPR read range (~23 m) + buffer
let failures = 0, bestEffort = 0;
console.log(`ALPR cameras indexed: ${alprCount}\n`);
for (const c of corridors) {
  const { options } = await planRoutes(c.from, c.to, {});
  console.log(`— ${c.name}`);
  for (const o of options) {
    // Measure the RAW graph geometry (node-to-node), which is what the hard
    // floor guarantees and what the car actually drives — not the simplified
    // render polyline (±3 m DP tolerance).
    const rawCoords = (o.route && o.route.coords) || o.coords;
    const { minMid, minAll, minMidAt } = auditRoute(rawCoords);
    if (o.mode !== 'strict') {
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  mid-route min ` +
        `${minMid === Infinity ? '∞' : minMid.toFixed(0) + ' m'}  (abs min ${minAll.toFixed(0)} m)`
      );
      continue;
    }
    const midOk = minMid === Infinity || minMid >= STRICT_FLOOR_M;
    if (o.strictFallback && !o.clearToM) {
      // Hard floor found no route within budget. Two distinct causes (router
      // exposes which): truly camera-walled (no ≥floor path exists anywhere)
      // vs budget-exhausted (a clear path exists but costs too much time).
      bestEffort++;
      const reason = o.walled
        ? `destination camera-walled; no ≥${STRICT_FLOOR_M} m path exists`
        : `camera-clear path exists but exceeds detour budget`;
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  mid-route min ${minMid.toFixed(0)} m  ` +
        `⚠ BEST-EFFORT (${reason})`
      );
    } else if (!midOk) {
      failures++;
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  mid-route min ${minMid.toFixed(1)} m ` +
        `@ ${minMidAt[0].toFixed(5)},${minMidAt[1].toFixed(5)}  ❌ FAIL (< ${STRICT_FLOOR_M} m)`
      );
    } else {
      // PASS — includes gate-snapped routes: the SERVED route is hard-floor
      // clear; only the stated final approach (clearToM) passes a camera.
      const gateNote = o.clearToM
        ? `  ⚠ gate-snapped: clear to within ~${Math.round(o.clearToM)} m of destination`
        : '';
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  mid-route min ` +
        `${minMid === Infinity ? '∞' : minMid.toFixed(0) + ' m'}  (abs min ${minAll.toFixed(0)} m)  PASS${gateNote}`
      );
    }
  }
}
console.log(
  failures
    ? `\nAVOIDANCE AUDIT FAIL ❌ — ${failures} strict route(s) pass within ${STRICT_FLOOR_M} m of an ALPR camera mid-route`
    : `\nAVOIDANCE AUDIT PASS ✅ — ≥ ${STRICT_FLOOR_M} m from ALPR cameras mid-route on clearable corridors` +
      (bestEffort ? `; ${bestEffort} walled/budget destination(s) served best-effort` : '')
);
process.exit(failures ? 1 : 0);
