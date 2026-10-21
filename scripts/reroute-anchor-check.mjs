// G-71 reroute case (Keaton field report 2026-10-20): the driver is sitting
// beside F#006 State St @ E Main St WB and the app reroutes mid-drive. The old
// behaviour re-served a "Clearest" line whose START ran back past F006 (~13 m)
// because astar() exempts the origin node — that exemption is honest for a
// parked car at a boxed destination, not for a line the driver is about to
// follow. A reroute must anchor at the nearest unboxed node with a clear route
// to the destination (or refuse, so the caller keeps the line on screen).
//
// Self-validating: the non-reroute planning below MUST reproduce the exposure,
// otherwise this probe proves nothing.
import { planRoutes } from '../src/router.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const gz = readFileSync(join(DIR, '..', 'public', 'graph', 'wasatch-graph.bin.gz'));
globalThis.fetch = async () => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  return { ok: true, status: 200, arrayBuffer: async () => ab };
};

const HOME_DEPOT = [-111.82294, 40.38422];
const F006 = [-111.827125, 40.38907];
const kx = 111320 * Math.cos((40.389 * Math.PI) / 180);

// Distance from a camera to the SERVED polyline (segments, not just vertices).
function distToLine(coords, c) {
  let best = Infinity;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1], b = coords[i];
    const ax = a[0] * kx, ay = a[1] * 110540, bx = b[0] * kx, by = b[1] * 110540;
    const px = c[0] * kx, py = c[1] * 110540;
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
    best = Math.min(best, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  }
  return best;
}

// Distance from the camera to the FIRST 200 m of the line: the exposure this
// probe is about is at the start, not somewhere on the State St corridor.
function startExposure(coords, c, windowM = 200) {
  const out = [coords[0]];
  let acc = 0;
  for (let i = 1; i < coords.length && acc < windowM; i++) {
    const a = coords[i - 1], b = coords[i];
    acc += Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * 110540);
    out.push(b);
  }
  return distToLine(out, c);
}

const pickStrict = (opts) => opts.find((o) => o.mode === 'strict') || null;

console.log('1) mid-drive planning WITHOUT reroute anchoring (old behaviour)…');
const old = await planRoutes(F006, HOME_DEPOT, {});
let oldDist = Infinity, oldModes = [];
for (const o of old.options) {
  oldModes.push(`${o.mode}:${o.cameras}`);
  oldDist = Math.min(oldDist, distToLine(o.coords, F006));
}
console.log(`   options=${oldModes.join(',')} best dist-to-F006 = ${oldDist.toFixed(1)} m`);

console.log('2) reroute from the same boxed origin…');
let strictDist = Infinity, anchor = null, held = false, opts = 0, startExp = Infinity;
try {
  const rr = await planRoutes(F006, HOME_DEPOT, { reroute: true });
  const s = pickStrict(rr.options);
  opts = rr.options.length;
  if (s) {
    strictDist = distToLine(s.coords, F006);
    startExp = startExposure(s.coords, F006);
    anchor = s.startAnchorM;
    console.log(`   strict dist-to-F006 = ${strictDist.toFixed(1)} m, anchor=${anchor} m, start-exposure=${startExp.toFixed(1)} m`);
  }
} catch (e) {
  if (e.code === 'REROUTE_HELD') {
    held = true;
    console.log('   REROUTE_HELD (origin has no unboxed anchor with a clear route)');
  } else throw e;
}

const checks = {
  reproducesWithoutAnchoring: oldDist < 75, // the defect is real on this corridor
  rerouteClearsCamera: held || strictDist >= 75,
  startIsClean: held || startExp >= 75,
  optionsServed: held || opts > 0,
};
for (const [k, v] of Object.entries(checks)) console.log(`${v ? 'PASS' : 'FAIL'}  ${k}`);
const fail = Object.entries(checks).filter(([, v]) => !v);
if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
console.log('REROUTE ANCHOR PASS ✅');
