// Valhalla fallback engine test: a corridor OUTSIDE Ghostway's Wasatch graph
// (Denver → Boulder) must route through Valhalla with real instructions, and
// camera exclusion must change the route shape.
import { valhallaPlanRoutes, valhallaRoute } from '../src/valhalla.js';

// Minimal camera-store stub with a deterministic pool near the corridor.
const pool = [
  { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [-104.9735, 39.7810] } }, // on I-70/US36 corridor area
  { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [-105.0830, 39.9050] } }, // near Boulder
];
const store = {
  getCameras: async () => pool,
  nearRouteFromList(line, feats, cor) {
    // reuse the shared logic via import
    return [];
  },
};

const FROM = [-104.9903, 39.7392]; // Denver downtown
const TO = [-105.2705, 40.015]; // Boulder

console.log('routing Denver → Boulder via Valhalla…');
const t0 = Date.now();
const { options, source } = await valhallaPlanRoutes(FROM, TO, store, { mode: 'moderate' });
const ms = Date.now() - t0;
console.log(`source: ${source} · ${ms} ms`);
for (const o of options) {
  console.log(`  ${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1)} km · ${Math.round(o.duration / 60)} min · ${o.cameras} cameras · ${o.instructions.length} steps`);
}
const sel = options[0];
console.log('first steps:', sel.instructions.slice(0, 3).map((s) => `${s.instruction} ${s.name}`).join(' | '));

// Camera-exclusion mechanics: exclude a point ON the baseline and verify change.
console.log('\nexclude_locations mechanics:');
const base = await valhallaRoute(FROM, TO, null);
const mid = base.coords[Math.floor(base.coords.length / 2)];
const avoided = await valhallaRoute(FROM, TO, [mid]);
console.log(`baseline ${(base.distance / 1000).toFixed(2)} km vs avoided ${(avoided.distance / 1000).toFixed(2)} km`);
const changed = Math.abs(base.distance - avoided.distance) > 10;
console.log('route changed by exclusion:', changed);

const pass =
  source === 'valhalla' &&
  options.length >= 1 &&
  options.every((o) => o.distance > 1000 && o.duration > 60 && o.instructions.length > 2) &&
  sel.instructions.some((s) => /Turn|Continue|Head|Merge|Take/.test(s.instruction)) &&
  changed;
console.log(pass ? '\nVALHALLA PASS ✅ — national fallback routes + avoidance works' : '\nVALHALLA FAIL ❌');
process.exit(pass ? 0 : 1);
