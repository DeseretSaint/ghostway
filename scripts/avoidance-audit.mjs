// Camera-avoidance safety audit (THE MISSION, measured not assumed).
// For every route option on real corridors, densify the geometry to ~10 m
// steps and measure the TRUE minimum distance to any ALPR camera from the
// DeFlock snapshot (same file + classification the graph builder uses).
//
// Safety floor: Flock/ALPR plates are read at ~10-23 m (30-75 ft) at speed.
// The SHIPPED floor is stricter than the read range: src/router.js
// HARD_CAM_EXPOSURE = 64 forbids strict-mode edges within ~75 m of a plate
// reader ("Clear means clear", Keaton field report 2026-09-30). This audit
// holds that promise, not the weaker read-range one: STRICT ("Clearest") must
// keep >= 75 m over the WHOLE served polyline. No endpoint tolerance — the
// final approach into a walled lot is where the reader sits (2026-10-20).
// Prints per-option min-distance + pass/fail, exits 1 if strict < 75 m.
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
const alprPts = [];
let alprCount = 0;
for (const f of cams.features) {
  if (!isAlprCamera(f.properties || {})) continue;
  const [lon, lat] = f.geometry.coordinates;
  alprCount++;
  alprPts.push([lon, lat]);
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

// Walk the route in ~10 m steps; track the true minimum camera distance over
// the FULL polyline (endpoints included) plus, informationally, the mid-route
// minimum (first/last 250 m excluded). G-71: the pass criterion is the FULL
// measure — the final approach into a walled lot is where the reader sits, so
// exempting it is how the Home Depot route passed this audit while a dot sat
// on the served line (Keaton, 2026-10-20).
function auditRoute(coords, endTol = 250) {
  let minMid = Infinity, minAll = Infinity, minMidAt = null, minAllAt = null;
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
      if (d < minAll) { minAll = d; minAllAt = [lon, lat]; }
      if (acc > endTol && total - acc > endTol && d < minMid) {
        minMid = d;
        minMidAt = [lon, lat];
      }
      if (k > 0) acc += s.len / steps;
    }
  }
  return { minMid, minAll, minMidAt, minAllAt, total };
}

// Named regression cases. Each ID is a route Keaton reported (or a corridor a
// field report was measured on); the ID is stable so a failure names the
// report it breaks. `expect` is the contract, not a snapshot:
//   'clear'       — strict MUST serve a route clear of the floor mid-route.
//                   A best-effort fallback here is a REGRESSION.
//   'best-effort' — destination is camera-walled or the clear path breaks the
//                   detour budget; honest best-effort is acceptable, but a
//                   strict option that silently passes a camera is NOT.
const corridors = [
  {
    id: 'K1', name: 'PG → Costco Lehi', expect: 'clear',
    why: 'Keaton report #1 (2026-08): Clearest forced a highway hop and still passed a plate reader on State St',
    from: [-111.759, 40.364], to: [-111.834, 40.394],
  },
  {
    id: 'K2', name: 'PG → BYU Provo', expect: 'best-effort',
    why: 'Keaton report #2: destination gate is camera-walled (tail 118 m) — must serve gate-snap honest best-effort, never a silent pass',
    from: [-111.759, 40.364], to: [-111.6553, 40.2523],
  },
  {
    id: 'K3', name: 'Lehi → SLC Downtown', expect: 'clear',
    why: 'long-corridor detour quality: avoidance must survive an 18 km trip',
    from: [-111.8508, 40.3852], to: [-111.891, 40.7608],
  },
  {
    id: 'K4', name: 'Orem → SLC Airport', expect: 'clear',
    why: 'airport corridor: freeway-heavy, must still find a clear surface alternative',
    from: [-111.6946, 40.2969], to: [-111.9778, 40.7884],
  },
  {
    id: 'homedepot-flock', name: 'PG → Home Depot American Fork', expect: 'clear',
    why: 'Keaton report 2026-10-20: live route to Home Depot American Fork hugged a Flock plate reader; destination lot is camera-walled, so Clearest must gate-snap and stay clear mid-route',
    from: [-111.759, 40.364], to: [-111.8229, 40.3842],
    dest: 'Home Depot #4417, 885 W Grassland Dr, American Fork UT',
  },
  {
    id: 'K6', name: 'State St N → S across F#006 (600 m trip)', expect: 'clear',
    why: 'Keaton field report 2026-10-21: a 600 m hop past F#006 served a 2.6x loop. Measured: every crossing within 285 m of the reader is camera-blocked or dead-ends, so the loop is geometry-forced, not routing slop. This corridor locks that in: clear, near-optimal, and disclosed on the card.',
    from: [-111.827125, 40.3918], to: [-111.827125, 40.3865],
  },
  {
    id: 'K5', name: 'AF → Park City', expect: 'best-effort',
    why: 'Keaton report #4 (detour quality): canyon corridors cannot always clear within budget — must say so, not over-detour silently',
    from: [-111.7965, 40.3769], to: [-111.498, 40.6461],
  },
];

// "Clear means clear" is 75 m in the engine (src/router.js HARD_CAM_EXPOSURE
// = 64 → ~75 m), not the bare ALPR read range (~23 m). Auditing at 30 m would
// pass routes the product promises are clear, so the audit holds the shipped
// claim: the minimum clear distance over the WHOLE served polyline must be
// >= 75 m. No endpoint tolerance: an exempted final approach is exactly where
// a lot-entrance reader sat while the card said "Clearest" (2026-10-20).
const STRICT_FLOOR_M = 75;
// Detour-quality oracle (Keaton directive 2026-10-21): "Clearest" is allowed to
// be slower than Fastest, but it must not be slower than it has to be. Dijkstra
// over the same graph, same hard camera floor, minimising LENGTH, gives the
// shortest camera-clear path that exists. Comparing the served Clearest against
// that oracle separates two very different outcomes:
//   served <= oracle*1.15          → the detour is geometry-forced, not routing
//                                    slop. Any cost vs Fastest must be DISCLOSED
//                                    on the card (rc-detour), not hidden.
//   served >  oracle*1.15 + snap   → over-detour REGRESSION.
// The oracle is deliberately a lower bound (it ignores turn costs and live
// traffic), so a small positive gap is expected and not a failure.
const ORACLE_SLOP = 1.15;
function clearOracle(g, s, t) {
  if (!g || s < 0 || t < 0 || s === t) return null;
  const N = g.nodeCount;
  const dist = new Float64Array(N).fill(Infinity);
  const done = new Uint8Array(N);
  dist[s] = 0;
  // Binary heap of [cost, node]; the graph is ~1M nodes and the search is
  // bounded by the clear subgraph, so a plain array heap is fast enough here.
  const heap = [[0, s]];
  const push = (c, n) => {
    heap.push([c, n]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]]; i = p;
    }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [c, n] = pop();
    if (done[n]) continue;
    done[n] = 1;
    if (n === t) return c;
    for (let k = g.outStart[n]; k < g.outStart[n + 1]; k++) {
      const e = g.arcEdge[k];
      if (g.eCam[e] >= 64) continue; // same hard floor the router uses
      const to = g.arcTo[k];
      if (done[to]) continue;
      const nc = c + g.eLen[e];
      if (nc < dist[to]) { dist[to] = nc; push(nc, to); }
    }
  }
  return null;
}
let failures = 0, bestEffort = 0, detours = 0;
console.log(`ALPR cameras indexed: ${alprCount}`);
console.log(`Strict floor under test: ${STRICT_FLOOR_M} m over the full polyline (no endpoint tolerance)\n`);
for (const c of corridors) {
  const res = await planRoutes(c.from, c.to, {});
  const { options } = res;
  const oracleM = clearOracle(res.graph, res.snapFrom && res.snapFrom.node, res.snapTo && res.snapTo.node);
  console.log(`— ${c.id} ${c.name}  [expect: ${c.expect}]`);
  console.log(`  clear-path oracle (shortest ≥${STRICT_FLOOR_M} m clear line): ${oracleM == null ? 'none exists' : Math.round(oracleM) + ' m'}`);
  console.log(`  repro: ${c.why}`);
  // A corridor that serves no Clearest option at all is a failure for an
  // expect:'clear' case: the user picked Clearest and got nothing camera-aware.
  // This used to slip through because the loop only inspected options present.
  let strictSeen = false;
  for (const o of options) {
    if (o.mode === 'strict') strictSeen = true;
    // Measure the RAW graph geometry (node-to-node), which is what the hard
    // floor guarantees and what the car actually drives — not the simplified
    // render polyline (±3 m DP tolerance).
    const rawCoords = (o.route && o.route.coords) || o.coords;
    const { minMid, minAll, minAllAt } = auditRoute(rawCoords);
    const abs = minAll === Infinity ? '∞' : minAll.toFixed(0) + ' m';
    const mid = minMid === Infinity ? '∞' : minMid.toFixed(0) + ' m';
    if (o.mode !== 'strict') {
      console.log(`  ${o.label.padEnd(9)} cams=${o.cameras}  full min ${abs}  (mid-route ${mid})`);
      continue;
    }
    const fullOk = minAll === Infinity || minAll >= STRICT_FLOOR_M;
    const gateNote = o.destOffsetM > 40
      ? `  ⚠ serves to a drop-off ${o.destOffsetM} m from the pin` : '';
    if (fullOk) {
      // Detour quality: the clear line must be close to the SHORTEST clear
      // line, not merely clear. A route that wanders 40% past the optimum is
      // the "2.6x loop" complaint in a different form.
      const slack = (o.destOffsetM || 0) + 50;
      if (oracleM != null && o.distance > oracleM * ORACLE_SLOP + slack) {
        failures++;
        console.log(
          `  ${o.label.padEnd(9)} cams=${o.cameras}  full min ${abs}  ` +
          `❌ OVER-DETOUR: served ${Math.round(o.distance)} m vs ${Math.round(oracleM)} m oracle ` +
          `(+${Math.round(o.distance - oracleM)} m, allowed +${Math.round((ORACLE_SLOP - 1) * 100)}% + ${Math.round(slack)} m snap)`
        );
        continue;
      }
      // Overhead vs Fastest that survives the oracle is geometry-forced (no
      // shorter clear line exists). It is allowed, but the route card must say
      // so: that disclosure is what the UI check covers.
      const fast = options.find((x) => x.mode === 'off');
      let disclosure = '';
      if (fast && o.distance > fast.distance * 1.4 && oracleM != null && o.distance <= oracleM * ORACLE_SLOP + slack) {
        detours++;
        disclosure = `  geometry-forced detour ${(o.distance / fast.distance).toFixed(2)}x vs Fastest ` +
          `(${Math.round((o.duration - fast.duration) / 60)} min extra) — card must disclose`;
      }
      // The served line is clear over its whole length. A gate-snapped route
      // counts: it stops before the reader, and the drop-off distance is
      // stated rather than pretended away.
      const best = o.strictFallback
        ? `  (best-effort: ${o.walled ? 'walled destination' : 'detour budget'})` : '';
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  full min ${abs}  (mid-route ${mid})  PASS${gateNote}${best}${disclosure}`
      );
      continue;
    }
    if (o.strictFallback) {
      bestEffort++;
      const reason = o.walled
        ? `destination camera-walled; no ≥${STRICT_FLOOR_M} m path exists`
        : `camera-clear path exists but exceeds detour budget`;
      if (c.expect === 'clear') {
        failures++;
        console.log(
          `  ${o.label.padEnd(9)} cams=${o.cameras}  full min ${abs}  ` +
          `❌ REGRESSION: ${c.id} must serve a clear route (needed ${STRICT_FLOOR_M} m) — got best-effort (${reason})`
        );
        continue;
      }
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  full min ${abs}  ` +
        `⚠ BEST-EFFORT (${reason}) — expected for ${c.id}${gateNote}`
      );
    } else {
      // No fallback flag and a reader on the served line: a silent pass. This
      // is the failure mode G-71 forbids outright.
      failures++;
      console.log(
        `  ${o.label.padEnd(9)} cams=${o.cameras}  full min ${minAll.toFixed(1)} m ` +
        `@ ${minAllAt[0].toFixed(5)},${minAllAt[1].toFixed(5)}  ❌ FAIL: silent clear claim (< ${STRICT_FLOOR_M} m)`
      );
    }
  }
  if (!strictSeen && c.expect === 'clear') {
    failures++;
    console.log(
      `  Clearest  ❌ REGRESSION: no camera-aware option served at all ` +
      `(options: ${options.map((o) => o.label).join(', ') || 'none'})`
    );
  }
}
console.log(
  failures
    ? `\nAVOIDANCE AUDIT FAIL ❌ — ${failures} strict route(s) pass within ${STRICT_FLOOR_M} m of an ALPR camera on the served polyline`
    : `\nAVOIDANCE AUDIT PASS ✅ — ≥ ${STRICT_FLOOR_M} m from ALPR cameras over the full served polyline on clearable corridors` +
      (bestEffort ? `; ${bestEffort} walled/budget destination(s) served best-effort` : '') +
      (detours ? `; ${detours} geometry-forced detour(s) disclosed on the card` : '')
);
process.exit(failures ? 1 : 0);
