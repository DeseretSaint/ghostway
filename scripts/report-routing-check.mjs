// Community-report routing impact: placing a fake camera report ON the strict
// route's path must make the engine avoid it (route geometry or camera count
// changes vs. routing without the report).
import { planRoutes, loadGraph } from '../src/router.js';
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

const FROM = [-111.759, 40.364]; // Pleasant Grove
const TO = [-111.834, 40.394]; // Costco Lehi

// Baseline: strict mode without community reports.
const base = await planRoutes(FROM, TO, { traffic: null, communityCams: [] });
const baseStrict = base.options.find((o) => o.mode === 'strict') || base.options[0];
console.log(`baseline strict: ${(baseStrict.distance / 1000).toFixed(2)} km, ${baseStrict.cameras} cameras`);

// Drop a report at the midpoint of that strict route.
const mid = baseStrict.coords[Math.floor(baseStrict.coords.length / 2)];
console.log('report at:', JSON.stringify(mid));
const withReport = await planRoutes(FROM, TO, {
  traffic: null,
  communityCams: [{ lon: mid[0], lat: mid[1], kind: 'alpr' }],
});
const repStrict = withReport.options.find((o) => o.mode === 'strict') || withReport.options[0];
console.log(`with report   : ${(repStrict.distance / 1000).toFixed(2)} km, ${repStrict.cameras} cameras`);

const changed =
  Math.abs(repStrict.distance - baseStrict.distance) > 50 ||
  JSON.stringify(repStrict.coords[5]) !== JSON.stringify(baseStrict.coords[5]) ||
  repStrict.cameras !== baseStrict.cameras;
console.log('route changed by community report:', changed);

const pass = changed;
console.log(pass ? '\nREPORT-ROUTING PASS ✅ — community reports steer the engine' : '\nREPORT-ROUTING FAIL ❌');
process.exit(pass ? 0 : 1);
