// Headless smoke test of the avoidance pipeline against live open APIs.
// Uses a known Flock camera in Pleasant Grove, UT and asserts that,
// with avoidance on, the route detours around it.
import { planRoute } from '../src/routing.js';

const from = [-111.7669, 40.3440]; // just south of the camera
const to = [-111.7669, 40.3580]; // just north of it
const camera = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-111.7668589, 40.3512361] },
  properties: { brand: 'Flock Safety' },
};

const stubStore = {
  async camerasNearRoute() {
    return [camera];
  },
  async loadFallback() {},
};

const result = await planRoute(from, to, { avoid: true, cameraStore: stubStore });

console.log('baseline distance (m):', Math.round(result.baseline.distance));
console.log('clear    distance (m):', Math.round(result.clear.distance));
console.log('avoided cameras      :', result.avoidedCount);
console.log('applied avoidance     :', result.applied);
console.log('detour factor         :', result.detourFactor.toFixed(3));
console.log('steps returned        :', result.steps.length);

const pass =
  result.applied &&
  result.clear.distance > result.baseline.distance &&
  result.avoidedCount === 1;

console.log(pass ? '\nPASS ✅ — route detours around the Flock camera' : '\nFAIL ❌');
process.exit(pass ? 0 : 1);
