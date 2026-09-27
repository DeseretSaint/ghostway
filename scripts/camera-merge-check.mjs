// Camera merge invariants (DeFlock + flocksurveillance.org research data):
// the gap-fill must ADD plate readers only, never duplicate an existing
// DeFlock point within DEDUPE_M, never include non-road/inactive devices, and
// every added point must classify as ALPR through the app's own isAlprCamera.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { isAlprCamera } from '../src/config.js';

const DEDUPE_M = 30;
const usa = JSON.parse(readFileSync('engine/data/cameras-usa.geojson', 'utf8'));
const fallback = JSON.parse(readFileSync('public/cameras/cameras.geojson', 'utf8'));

const added = usa.features.filter((f) => f.properties && f.properties.source === 'flocksurveillance.org');
const base = usa.features.filter((f) => !(f.properties && f.properties.source === 'flocksurveillance.org'));

console.log(`base(deflock): ${base.length} · added(flock research): ${added.length} · meta:`, JSON.stringify(usa._meta));

// 1. Counts consistent + meaningful gap fill.
const checks = {
  metaConsistent: usa._meta && usa._meta.flockResearchAdded === added.length,
  gapFillReal: added.length >= 10000,
  utahGain: fallback.features.filter((f) => f.properties.source === 'flocksurveillance.org').length >= 50,
};

// 2. Every added point is a valid, ALPR-classified, road-tagged record.
checks.addedAllAlpr = added.every((f) => isAlprCamera(f.properties));
checks.addedTaggedTraffic = added.every((f) => f.properties.surveillanceZone === 'traffic');
checks.addedCoordsValid = added.every((f) => {
  const [lon, lat] = f.geometry.coordinates;
  return Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= 90;
});

// 3. Dedupe invariant: no added point within DEDUPE_M of any base point.
//    Grid over BASE points, query per added point (same math as the fetch).
const CELL = 0.0003;
const grid = new Map();
const key = (lon, lat) => Math.floor(lon / CELL) + ',' + Math.floor(lat / CELL);
for (const f of base) {
  const [lon, lat] = f.geometry.coordinates;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const k = key(lon + dx * CELL, lat + dy * CELL);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(f.geometry.coordinates);
  }
}
let tooClose = 0;
for (const f of added) {
  const [lon, lat] = f.geometry.coordinates;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (const [dlon, dlat] of grid.get(key(lon, lat)) || []) {
    const dx = (dlon - lon) * 111320 * cosLat;
    const dy = (dlat - lat) * 111320;
    if (dx * dx + dy * dy < DEDUPE_M * DEDUPE_M) { tooClose++; break; }
  }
}
checks.noNearDuplicates = tooClose === 0;

// 4. Fallback snapshot provenance is trimmed + typed.
checks.fallbackTrimmed = fallback.features.every((f) =>
  f.properties.brand !== undefined && f.properties.source !== undefined &&
  f.geometry.coordinates.length === 2);

// 5. All-devices artifact (map-only): full dataset, road flags consistent with
//    the merge policy, and non-road devices NEVER reach the routing input.
const all = JSON.parse(new TextDecoder().decode(gunzipSync(readFileSync('public/cameras/flock-devices.json.gz'))));
const roadN = all.devices.reduce((n, d) => n + (d[7] === 1 ? 1 : 0), 0);
checks.allDevicesFull = all.count === all.devices.length && all.count >= 300000;
checks.roadFlagConsistent = roadN >= 100000 && added.length <= roadN;
checks.namedDevicesKept = all.devices.some((d) => typeof d[6] === 'string' && d[6].length > 0);
checks.nonRoadNeverRouted = usa.features.every((f) => !(f.properties && f.properties.roadRelevant === false));

console.log(JSON.stringify({ added: added.length, tooClose, checks }, null, 2));
const fail = Object.entries(checks).filter(([, v]) => !v);
if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
console.log('CAMERA MERGE PASS ✅');
