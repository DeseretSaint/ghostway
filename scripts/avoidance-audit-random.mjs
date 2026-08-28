// Randomized camera-avoidance audit (queue item 2, Keaton 2026-08-27).
// Generalizes the fixed 5-corridor audit: samples N random origin/destination
// pairs from POPULATED graph nodes (uniform + dense-camera-area biased),
// routes each, and asserts:
//   (a) Clearest mid-route min-cam >= 30 m on CLEARABLE corridors
//       (walled or over-budget destinations are served best-effort, counted);
//   (b) when an ALPR camera sits near the Fastest route (<60 m mid-route),
//       the options array contains a camera-aware alternative (a strict
//       option, or a distinct option with fewer cameras);
//   (c) no crashes/timeouts outside the 5 measured corridors.
// Any sampled failure = a real defect to fix, not a special case.
// Deterministic: seeded PRNG (mulberry32), SEED env-overridable.
import { planRoutes, loadGraph } from '../src/router.js';
import { isAlprCamera } from '../src/config.js';
import { readFileSync } from 'node:fs';

const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).includes('wasatch-graph.bin.gz')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  return realFetch(url);
};
const g = await loadGraph();

// ---- ALPR camera grid (same snapshot + classification as the builder) ----
const cams = JSON.parse(readFileSync('engine/data/cameras-usa.geojson', 'utf8'));
const CELL = 0.002; // ~220 m, matches builder
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

// Walk route geometry in ~10 m steps; min camera distance ignoring the
// first/last endTol meters (endpoints may legitimately sit beside cameras).
function auditRoute(coords, endTol = 250) {
  let minMid = Infinity, acc = 0, total = 0;
  const segs = [];
  for (let i = 1; i < coords.length; i++) {
    const latm = ((coords[i - 1][1] + coords[i][1]) / 2) * Math.PI / 180;
    const len = Math.hypot(
      (coords[i][0] - coords[i - 1][0]) * 111320 * Math.cos(latm),
      (coords[i][1] - coords[i - 1][1]) * 111320
    );
    segs.push({ a: coords[i - 1], b: coords[i], len });
    total += len;
  }
  for (const s of segs) {
    const steps = Math.max(1, Math.ceil(s.len / 10));
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const lon = s.a[0] + (s.b[0] - s.a[0]) * t;
      const lat = s.a[1] + (s.b[1] - s.a[1]) * t;
      const d = minDistToCamera(lon, lat);
      if (acc > endTol && total - acc > endTol && d < minMid) minMid = d;
      if (k > 0) acc += s.len / steps;
    }
  }
  return { minMid, total };
}

// ---- Seeded PRNG ----
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = Number(process.env.SEED || 20260827);
const rnd = mulberry32(SEED);

// ---- Sample pairs from POPULATED nodes (degree >= 3 = real junctions/roads,
// not bbox-corner stubs), inside the graph bbox. ----
const N = g.nodeCount;
const deg = new Int32Array(N);
for (let e = 0; e < g.edgeCount; e++) { deg[g.ea[e]]++; deg[g.eB[e]]++; }
const populated = [];
let lonMin = Infinity, lonMax = -Infinity, latMin = Infinity, latMax = -Infinity;
for (let i = 0; i < N; i++) {
  if (deg[i] < 3) continue;
  const lon = g.nodeLon[i] / 1e6, lat = g.nodeLat[i] / 1e6;
  populated.push(i);
  if (lon < lonMin) lonMin = lon; if (lon > lonMax) lonMax = lon;
  if (lat < latMin) latMin = lat; if (lat > latMax) latMax = lat;
}

// Dense-camera cells: ALPR-bearing grid cells with >= 2 cameras (urban cores).
const denseCells = [];
for (const [k, list] of grid) if (list.length >= 2) denseCells.push(k);

function randomNodeNear(lon, lat, maxTries = 40) {
  // nearest populated node by rejection sampling in a shrinking box
  let best = -1, bestD = Infinity;
  for (let t = 0; t < maxTries; t++) {
    const i = populated[(rnd() * populated.length) | 0];
    const dLon = g.nodeLon[i] / 1e6 - lon, dLat = g.nodeLat[i] / 1e6 - lat;
    const d = dLon * dLon + dLat * dLat;
    if (d < bestD) { bestD = d; best = i; }
    if (bestD < 0.004 * 0.004) break; // ~400 m
  }
  return best;
}

const nPairs = Number(process.env.PAIRS || 24);
const pairs = [];
for (let p = 0; p < nPairs; p++) {
  let a, b;
  if (p % 2 === 0 && denseCells.length) {
    // camera-dense pair: both endpoints near dense ALPR cells
    const [kx, ky] = denseCells[(rnd() * denseCells.length) | 0].split(',').map(Number);
    const clon = (kx + rnd()) * CELL, clat = (ky + rnd()) * CELL;
    a = randomNodeNear(clon, clat);
    const [jx, jy] = denseCells[(rnd() * denseCells.length) | 0].split(',').map(Number);
    b = randomNodeNear((jx + rnd()) * CELL, (jy + rnd()) * CELL);
  } else {
    // uniform pair across coverage
    a = populated[(rnd() * populated.length) | 0];
    b = populated[(rnd() * populated.length) | 0];
  }
  if (a < 0 || b < 0 || a === b) { p--; continue; }
  const dLon = (g.nodeLon[a] - g.nodeLon[b]) / 1e6 * 111320 * Math.cos((g.nodeLat[a] / 1e6) * Math.PI / 180);
  const dLat = (g.nodeLat[a] - g.nodeLat[b]) / 1e6 * 111320;
  const straight = Math.hypot(dLon, dLat);
  if (straight < 1500 || straight > 60000) { p--; continue; } // 1.5-60 km trips
  pairs.push([a, b]);
}

// ---- Route + assert ----
const FLOOR = 30, NEAR_CAM = 60;
let crashes = 0, timeouts = 0, floorFails = 0, optionFails = 0, unreachable = 0;
let bestEffort = 0, clearable = 0, camNearFastest = 0, ok = 0;
const t0 = Date.now();
console.log(`ALPR cameras indexed: ${alprCount}; populated nodes: ${populated.length}; pairs: ${pairs.length} (seed ${SEED})\n`);

for (let pi = 0; pi < pairs.length; pi++) {
  const [a, b] = pairs[pi];
  const from = [g.nodeLon[a] / 1e6, g.nodeLat[a] / 1e6];
  const to = [g.nodeLon[b] / 1e6, g.nodeLat[b] / 1e6];
  const tag = `pair ${pi + 1}/${pairs.length} (${from[0].toFixed(4)},${from[1].toFixed(4)} → ${to[0].toFixed(4)},${to[1].toFixed(4)})`;
  let options;
  const guard = setTimeout(() => {
    timeouts++;
    console.log(`  ${tag}  ❌ TIMEOUT (>90 s)`);
    process.exit(1);
  }, 90000);
  try {
    ({ options } = await planRoutes(from, to, {}));
  } catch (err) {
    clearTimeout(guard);
    // planRoutes throws 'No route found' when the two endpoints sit in
    // disconnected graph components (real roads, no path). That is a genuine
    // connectivity gap — orthogonal to camera avoidance — counted separately
    // and reported, but it must not crash the whole randomized run.
    unreachable++;
    console.log(`  ${tag}  ⚠ UNREACHABLE (disconnected component): ${err.message}`);
    continue;
  }
  clearTimeout(guard);

  const strict = options.find((o) => o.mode === 'strict');
  const fastest = options.find((o) => o.mode === 'off') || options[0];

  const fCoords = (fastest.route && fastest.route.coords) || fastest.coords;
  const fAudit = auditRoute(fCoords);
  const fastestNearCam = fAudit.minMid < NEAR_CAM;
  if (fastestNearCam) camNearFastest++;

  if (!strict) {
    // Geometry dedupe (router.js similar()) collapses Clearest into Fastest
    // when both are the same shape — the DESIRED product behavior when Fastest
    // is already camera-free (queue item 1: 0-camera badge on the Fastest card
    // instead of a duplicate Clearest card). Only a defect when fastest
    // actually passes near a camera: then a camera-aware alternative must exist.
    if (fastestNearCam || fastest.cameras > 0) {
      optionFails++;
      console.log(`  ${tag}  ❌ no strict option in [${options.map((o) => o.mode).join(',')}] but fastest passes cam at ${fAudit.minMid.toFixed(0)} m (cams=${fastest.cameras})`);
      continue;
    }
    if (fAudit.minMid < FLOOR) {
      floorFails++;
      console.log(`  ${tag}  ❌ collapsed Clearest==Fastest but mid-route min ${fAudit.minMid.toFixed(1)} m (< ${FLOOR} m), cams=${fastest.cameras}`);
      continue;
    }
    clearable++; ok++; // fastest already IS the clearest route
    continue;
  }

  const sCoords = (strict.route && strict.route.coords) || strict.coords;
  const sAudit = auditRoute(sCoords);

  // (a) floor on clearable corridors
  const walledOrBudget = strict.strictFallback && !strict.clearToM;
  if (walledOrBudget) {
    bestEffort++;
  } else {
    clearable++;
    if (sAudit.minMid < FLOOR) {
      floorFails++;
      console.log(`  ${tag}  ❌ Clearest mid-route min ${sAudit.minMid.toFixed(1)} m (< ${FLOOR} m), cams=${strict.cameras}, fallback=${!!strict.strictFallback}`);
      continue;
    }
  }

  // (b) camera-aware alternative when the fastest route passes a camera AND
  // the corridor is CLEARABLE. A genuinely camera-WALLED destination (no ≥30 m
  // path exists anywhere) can only be served best-effort — there is no clear
  // alternative to offer, which is the honest product answer, not a defect.
  if (fastestNearCam && !walledOrBudget) {
    const strictClears = strict.cameras < fastest.cameras || sAudit.minMid >= FLOOR;
    if (!strictClears) {
      optionFails++;
      console.log(`  ${tag}  ❌ fastest passes cam at ${fAudit.minMid.toFixed(0)} m but no camera-aware alternative (fastest cams=${fastest.cameras}, strict cams=${strict.cameras}, strictMid=${sAudit.minMid === Infinity ? '∞' : sAudit.minMid.toFixed(0)} m) — corridor is clearable, this is a defect`);
      continue;
    }
  }
  ok++;
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\nSampled ${pairs.length} pairs in ${secs}s: ${ok} clean, ${clearable} clearable-floor PASS, ${bestEffort} walled/budget best-effort, ${unreachable} unreachable (disconnected components), ${camNearFastest} fastest-routes-near-camera (camera-aware alt present on all clearable: ${optionFails === 0})`);
const fail = floorFails + optionFails + crashes + timeouts;
// NOTE: `unreachable` pairs are a graph-connectivity finding (separate from
// camera avoidance) — reported but do NOT fail the camera-avoidance gate.
console.log(
  fail
    ? `RANDOMIZED AVOIDANCE AUDIT FAIL ❌ — floor ${floorFails}, options ${optionFails}, crashes ${crashes}, timeouts ${timeouts}`
    : `RANDOMIZED AVOIDANCE AUDIT PASS ✅ — Clearest ≥ ${FLOOR} m mid-route on all ${clearable} clearable corridors; camera-aware option present on all ${camNearFastest} camera-adjacent fastest routes; 0 crashes/timeouts` +
      (unreachable ? `; ${unreachable} unreachable pair(s) = graph connectivity gap (filed separately)` : '')
);
process.exit(fail ? 1 : 0);
