// Verify that the disconnected-pair fix works: the pair that was previously
// unreachable (pair 35/50, seed 20260827) now routes successfully after the
// component-aware re-snap in planRoutes().
import { planRoutes, loadGraph, endpointsConnected, nearestNode, nearestNodeInComponent } from '../src/router.js';
import { readFileSync } from 'node:fs';

const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
globalThis.fetch = async () => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  return { ok: true, status: 200, arrayBuffer: async () => ab };
};
await loadGraph();

// Pair 35/50 from the audit (seed 20260827): previously unreachable.
const FROM = [-111.6106, 40.1738];
const TO = [-111.5440, 39.9701];

console.log('Testing previously unreachable pair 35/50 (seed 20260827)');
console.log(`  origin:      ${FROM}`);
console.log(`  destination: ${TO}`);

// Confirm the endpoints ARE in different components (the root cause).
const s = nearestNode(FROM[0], FROM[1]);
const t = nearestNode(TO[0], TO[1]);
console.log(`\n  snapFrom: node ${s.node}, dist ${s.dist.toFixed(1)}m`);
console.log(`  snapTo:   node ${t.node}, dist ${t.dist.toFixed(1)}m`);

// Endpoints should be connected after re-snap (or in the same component).
const connected = endpointsConnected(FROM, TO);
console.log(`  endpointsConnected (original snaps): ${connected}`);

// Now actually route it.
const { options } = await planRoutes(FROM, TO, {});
console.log(`\n  planRoutes returned ${options.length} option(s):`);
for (const o of options) {
  console.log(`    ${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1)} km  ${Math.round(o.duration / 60)} min  cameras: ${o.cameras}`);
}

const fastest = options.find((o) => o.mode === 'off');
const clearest = options.find((o) => o.mode === 'strict');

const pass =
  options.length >= 1 &&
  fastest &&
  fastest.distance > 0 &&
  fastest.duration > 0;

console.log(
  pass
    ? `\nRE-SNAP PASS ✅ — previously unreachable pair now routes successfully`
    : `\nRE-SNAP FAIL ❌ — pair still unreachable after re-snap`
);
process.exit(pass ? 0 : 1);
