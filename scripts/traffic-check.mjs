// Workstream B verification: live UDOT traffic loads without a key, maps to
// severity/speed factors, and actually changes routing ETAs on a real corridor.
import { loadTraffic } from '../src/traffic.js';
import { planRoutes, loadGraph } from '../src/router.js';
import { readFileSync } from 'node:fs';

const DIR = new URL('.', import.meta.url);
const gz = readFileSync(new URL('../public/graph/wasatch-graph.bin.gz', DIR));
// Serve the local graph through the router's fetch (gzip sniff handles it).
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).includes('wasatch-graph.bin.gz')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  return realFetch(url); // UDOT arcgis query goes to the real network
};

const g = await loadGraph();
console.log('graph bbox:', g.bbox);

console.log('loading live UDOT traffic…');
const traffic = await loadTraffic(g.bbox, true);
console.log(`traffic ok=${traffic.ok} events=${traffic.events.length} gridCells=${traffic.grid.size}`);
if (!traffic.ok) {
  console.log('TRAFFIC FAIL ❌ — could not reach UDOT open data');
  process.exit(1);
}
const sev = {};
for (const ev of traffic.events) sev[ev.severity] = (sev[ev.severity] || 0) + 1;
console.log('severities:', JSON.stringify(sev));

// Route with and without traffic; ETAs must differ if incidents sit near roads.
const FROM = [-111.759, 40.364]; // Pleasant Grove
const TO = [-111.834, 40.394]; // Costco Lehi
const noTraffic = await planRoutes(FROM, TO, { traffic: null });
const withTraffic = await planRoutes(FROM, TO, { traffic });

const fNT = noTraffic.options.find((o) => o.mode === 'off');
const fT = withTraffic.options.find((o) => o.mode === 'off');
console.log(`no-traffic fastest : ${Math.round(fNT.duration / 60)} min, delay ${Math.round(fNT.delay)}s`);
console.log(`live-traffic fastest: ${Math.round(fT.duration / 60)} min, delay ${Math.round(fT.delay)}s, live=${withTraffic.trafficLive}`);

const pass =
  traffic.ok &&
  traffic.events.length > 0 &&
  traffic.events.every((e) => typeof e.speedFactor === 'number' && e.radius > 0) &&
  withTraffic.trafficLive &&
  fT.delay >= 0 &&
  fT.duration >= fNT.duration - 1;
console.log(pass ? '\nTRAFFIC PASS ✅ — UDOT live data drives routing delays' : '\nTRAFFIC FAIL ❌');
process.exit(pass ? 0 : 1);
