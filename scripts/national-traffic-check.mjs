// Nationwide traffic (iteration 17): verify the CI-harvested WZDx snapshot
// loads, parses, and yields closure points for routing outside Utah.
// Runs against the real public/data/wzdx-national.json.gz (built by
// scripts/fetch-wzdx-national.mjs).
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const raw = readFileSync('public/data/wzdx-national.json');
const data = JSON.parse(raw.toString());
console.log(`snapshot asOf: ${data.asOf}`);
const states = Object.keys(data.states || {});
console.log(`states with work zones: ${states.length} → ${states.join(', ')}`);
let zones = 0, closures = 0;
for (const k of states) {
  for (const z of data.states[k]) {
    zones++;
    if ((z.f || 0.85) <= 0.25) closures++;
  }
}
console.log(`total zones: ${zones} · hard closures: ${closures}`);

// Now exercise the app's loader + closure extractor against the gz payload.
const gz = gzipSync(raw, { level: 9 });
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).includes('wzdx-national')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  return realFetch(url);
};
const { loadNationalWzdx, closurePointsNear } = await import('../src/traffic.js');

// Pick a corridor inside a state known to have closures (Texas has many).
// Use a broad national bbox to be safe.
const bbox = [-112.0, 29.0, -95.0, 41.0];
const wz = await loadNationalWzdx(bbox, true);
console.log(`loader ok=${wz.ok} zones=${wz.zones.length} asOf=${wz.asOf}`);
const pts = closurePointsNear(wz.zones, bbox, 20);
console.log(`closure points fed to routing: ${pts.length}`);

const pass =
  data.asOf && states.length >= 3 && zones > 100 &&
  wz.ok && wz.zones.length > 50 && pts.length >= 1;
console.log(pass ? '\nNATIONAL-TRAFFIC PASS ✅ — WZDx snapshot loads and yields closures' : '\nNATIONAL-TRAFFIC FAIL ❌');
process.exit(pass ? 0 : 1);
