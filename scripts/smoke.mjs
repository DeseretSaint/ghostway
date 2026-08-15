// Deterministic unit test of the ITERATIVE AVOIDANCE loop.
// We mock global fetch so BRouter returns (a) a straight baseline and
// (b) a longer detour whenever any nogos are present. This proves the router
// keeps re-routing until cameras are cleared, independent of the live server.
import { planRoute } from '../src/routing.js';

// Straight road west->east at lat 40.352, 20 points.
const BASE = [];
for (let i = 0; i <= 20; i++) BASE.push([-111.776 + (i / 20) * 0.019, 40.352]);

// A detour that bows north (avoiding cameras on the straight line).
const DETOUR = [];
for (let i = 0; i <= 20; i++) {
  const t = i / 20;
  DETOUR.push([-111.776 + t * 0.019, 40.352 + Math.sin(t * Math.PI) * 0.004]);
}

function geojson(coords, dist) {
  return {
    features: [
      {
        type: 'Feature',
        properties: { 'track-length': String(dist), 'total-time': String(dist / 10) },
        geometry: { type: 'LineString', coordinates: coords },
      },
    ],
  };
}

// Cameras sitting on the straight baseline at 25% and 60%.
const cameras = [
  { type: 'Feature', geometry: { type: 'Point', coordinates: [BASE[5][0], BASE[5][1]] }, properties: { brand: 'Flock Safety' } },
  { type: 'Feature', geometry: { type: 'Point', coordinates: [BASE[12][0], BASE[12][1]] }, properties: { brand: 'Flock Safety' } },
];

// Intercept fetch: BRouter routing URL -> baseline or detour; everything else real.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes('brouter.de/brouter')) {
    const hasNogo = u.includes('nogos=');
    const body = geojson(hasNogo ? DETOUR : BASE, hasNogo ? 4000 : 2000);
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
  }
  if (u.includes('routing.openstreetmap.de')) {
    // OSRM turn-by-turn: return a couple of steps.
    return {
      ok: true,
      status: 200,
      json: async () => ({
        routes: [
          {
            legs: [
              { steps: [
                { maneuver: { type: 'depart' }, distance: 1000, duration: 100, name: 'Main St' },
                { maneuver: { type: 'arrive' }, distance: 1000, duration: 100, name: '' },
              ] },
            ],
          },
        ],
      }),
    };
  }
  return realFetch(url, opts);
};

const stubStore = {
  async getCameras() {
    return cameras;
  },
  nearRouteFromList(line, feats, corridorM) {
    return feats.filter((f) => {
      const c = f.geometry.coordinates;
      for (let i = 0; i < line.length - 1; i++) {
        if (pointToSeg(c, line[i], line[i + 1]) <= corridorM) return true;
      }
      return false;
    });
  },
  async loadFallback() {},
};

function pointToSeg(p, a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const latm = toRad((a[1] + b[1]) / 2);
  const ax = (b[0] - a[0]) * Math.cos(latm) * R;
  const ay = (b[1] - a[1]) * R;
  const px = (p[0] - a[0]) * Math.cos(latm) * R;
  const py = (p[1] - a[1]) * R;
  const len2 = ax * ax + ay * ay || 1;
  let t = (px * ax + py * ay) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - t * ax, py - t * ay);
}

const result = await planRoute([-111.776, 40.352], [-111.757, 40.352], {
  avoid: true,
  cameraStore: stubStore,
});

console.log('baseline distance (m):', Math.round(result.baseline.distance));
console.log('clear    distance (m):', Math.round(result.clear.distance));
console.log('avoided cameras      :', result.avoidedCount);
console.log('remaining cameras    :', result.remainingCount);
console.log('applied avoidance     :', result.applied);
console.log('detour factor         :', result.detourFactor.toFixed(3));

// With our mock, the detour (4000m) avoids both cameras; loop should reach it.
const pass = result.applied && result.avoidedCount >= 1 && result.clear.distance > result.baseline.distance;
console.log(pass ? '\nPASS ✅ — iterative avoidance detoured around cameras' : '\nFAIL ❌');
process.exit(pass ? 0 : 1);
