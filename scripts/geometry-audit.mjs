// Route-geometry audit (ledger queue: "Route-line anti-cut"). Verifies the
// Douglas-Peucker render simplification in src/router.js can never let the
// drawn line drift off the true road geometry: with a 3 m chord tolerance,
// EVERY raw route point must sit ≤3 m from the simplified polyline — the DP
// invariant. Anything larger means the line visually cuts a corner/building.
// Measured in true meters (local equirectangular per point), with highway-
// heavy + canyon corridors where long gentle curves are the risky case.
import { planRoutes } from '../src/router.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const gz = readFileSync(join(DIR, '..', 'public', 'graph', 'wasatch-graph.bin.gz'));
// Shim fetch to serve the local gz graph (router.js inflates via DecompressionStream).
globalThis.fetch = async () => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  return { ok: true, status: 200, arrayBuffer: async () => ab };
};

const corridors = [
  { name: 'PG → Costco Lehi (Keaton case)', from: [-111.759, 40.364], to: [-111.834, 40.394] },
  { name: 'Lehi → SLC Downtown (I-15 heavy)', from: [-111.8508, 40.3852], to: [-111.891, 40.7608] },
  { name: 'AF → Park City (canyon curves)', from: [-111.7965, 40.3769], to: [-111.498, 40.6461] },
  { name: 'Orem → SLC Airport (long mixed)', from: [-111.6946, 40.2969], to: [-111.9778, 40.7884] },
  { name: 'PG → Provo BYU (urban grid)', from: [-111.759, 40.364], to: [-111.6553, 40.2523] },
];

const M = 111320;
const TOL_M = 3;       // must match simplify()'s default tolM
const PASS_M = 3.1;    // +0.1 m float/projection epsilon

function pointToSegDistM(p, a, b) {
  const kx = M * Math.cos((p[1] * Math.PI) / 180);
  const px = p[0] * kx, py = p[1] * M;
  const ax = a[0] * kx, ay = a[1] * M;
  const bx = b[0] * kx, by = b[1] * M;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Max over raw points of (distance to nearest simplified segment).
function maxDeviationM(raw, simp) {
  let max = 0;
  for (const p of raw) {
    let best = Infinity;
    for (let i = 0; i < simp.length - 1; i++) {
      const d = pointToSegDistM(p, simp[i], simp[i + 1]);
      if (d < best) { best = d; if (best === 0) break; }
    }
    if (best > max) max = best;
  }
  return max;
}

const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
let fail = 0, routes = 0, worst = 0;

for (const c of corridors) {
  const { options } = await planRoutes(c.from, c.to, {});
  for (const o of options) {
    const raw = o.route.coords, simp = o.coords;
    routes++;
    const dev = maxDeviationM(raw, simp);
    const endsOk = samePt(raw[0], simp[0]) && samePt(raw[raw.length - 1], simp[simp.length - 1]);
    const ok = dev <= PASS_M && endsOk;
    if (!ok) fail++;
    worst = Math.max(worst, dev);
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${c.name} [${o.label}]  ` +
      `maxDev ${dev.toFixed(2)} m (limit ${TOL_M} m)  ` +
      `pts ${raw.length}→${simp.length} (${Math.round((100 * simp.length) / raw.length)}%)  ` +
      `endpoints ${endsOk ? 'kept' : 'LOST'}`
    );
  }
}

console.log(`\n${routes} routes audited, worst deviation ${worst.toFixed(2)} m (DP invariant ≤ ${TOL_M} m)`);
if (fail) { console.log(`GEOMETRY-AUDIT FAIL: ${fail} route(s) exceed tolerance or lost endpoints`); process.exit(1); }
console.log('GEOMETRY-AUDIT PASS — drawn line never leaves the road geometry');
