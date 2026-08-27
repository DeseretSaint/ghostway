// Probe 2: what does the REAL planRoutes serve for PG -> Costco Lehi?
import { planRoutes, loadGraph } from '../src/router.js';
import { readFileSync } from 'node:fs';

const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).includes('wasatch-graph.bin.gz')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  return realFetch(url);
};
await loadGraph();

const res = await planRoutes([-111.759, 40.364], [-111.834, 40.394], { prefer: 'strict' });
const mi = (m) => (m / 1609.34).toFixed(2);
const mn = (s) => (s / 60).toFixed(1);
for (const o of res.options) {
  const r = o.route;
  const fb = o.mode === 'strict' ? ` [strictFallback=${o.strictFallback} overBudget=${o.overBudget} walled=${o.walled} clearToM=${o.clearToM}]` : '';
  console.log(`${o.label.padEnd(10)} ${mi(r.distance)} mi / ${mn(r.duration)} min / ${r.cameras} cams${fb}`);
}
