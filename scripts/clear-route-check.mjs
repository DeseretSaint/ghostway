// THE State Street corridor regression (Keaton field report 2026-09-30):
// "The same route to Home Depot routes me directly past the camera on State
// Street when I could easily cut through the back of the neighborhood before
// turning onto State Street to avoid it — and it would be just as fast."
//
// Two root causes, both fixed, both locked here:
//   (a) DATA: F#006 State St @ E Main St WB (a Falcon plate reader he has
//       personally verified) was classified non-road because the scraped
//       dataset says status="inPlanning". Status is not evidence — routing
//       now keys on device class + placement only.
//   (b) FLOOR: the strict hard floor was 160 (≈37 m) — a camera across a wide
//       arterial still reads your plate at 50-70 m and slipped past it.
//       Now 64 (≈75 m), the same radius the honest count uses.
//
// The test is self-validating: the FASTEST route must pass within read range
// of the camera (else the corridor is wrong and the test is vacuous), and
// CLEAREST must clear it.
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

const HOME_DEPOT = [-111.82294, 40.38422]; // The Home Depot, W Grassland Dr, American Fork
// Endpoints ON the State St corridor north of the camera so the natural
// fastest route MUST drive past F#006 (self-validating below): from State St
// ~770 m north to the Home Depot, past State @ E Main.
const FROM = [-111.8272, 40.3960];
const F006 = [-111.827125, 40.38907]; // "F#006 State St @ E Main St WB"

const minDistM = (coords, [lon, lat]) => {
  let best = Infinity;
  for (const [x, y] of coords) {
    const dx = (x - lon) * 111320 * Math.cos((lat * Math.PI) / 180);
    const dy = (y - lat) * 110540;
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
};

console.log('planning the Home Depot corridor (loads graph first)…');
const t0 = Date.now();
const { options } = await planRoutes(FROM, HOME_DEPOT, { prefer: 'strict' });
console.log(`planned in ${Date.now() - t0}ms — ${options.length} option(s)`);

const strict = options.find((o) => o.mode === 'strict');
const fastest = options.find((o) => o.mode === 'off') || options[0];

const strictDist = strict ? minDistM(strict.coords, F006) : Infinity;
const fastestDist = minDistM(fastest.coords, F006);
const arrived = minDistM([strict ? strict.coords[strict.coords.length - 1] : [0, 0]], HOME_DEPOT);

for (const o of options) {
  console.log(`  ${o.mode}: ${(o.distance / 1000).toFixed(1)} km ${Math.round(o.duration / 60)} min cams=${o.cameras} dist-to-F006=${minDistM(o.coords, F006).toFixed(0)}m`);
}

const checks = {
  strictOptionExists: !!strict && Number.isFinite(strict.distance),
  cameraOnNaturalCorridor: fastestDist < 50, // fastest really does drive past it
  clearestClearsTheCamera: strictDist >= 60, // ≥ the 75 m contract (polyline slack)
  routeReachesHomeDepot: arrived < 300,
};

console.log(JSON.stringify({ strictDist: strictDist.toFixed(0) + 'm', fastestDist: fastestDist.toFixed(0) + 'm', checks }, null, 2));
const fail = Object.entries(checks).filter(([, v]) => !v);
if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
console.log('CLEAR ROUTE PASS ✅ — Clearest bends around the State St camera');
