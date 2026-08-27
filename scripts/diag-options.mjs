// Diagnose PG -> Costco Lehi option generation using the REAL router code.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

const gz = readFileSync(new URL('../public/graph/wasatch-graph.bin.gz', import.meta.url));
const raw = gunzipSync(gz);

// Stub fetch so router.loadGraph() reads the local graph bytes.
globalThis.fetch = async (url) => {
  return {
    ok: true,
    arrayBuffer: async () => raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  };
};
// DecompressionStream not needed: we hand it already-gunzipped bytes; router
// sniffs magic. Our bytes start with 'GWR1' so it skips inflate. Good.

const router = await import(new URL('../src/router.js', import.meta.url).href);

// Pleasant Grove (residential) -> Costco Lehi. Approximate real coords.
const PG = [-111.7448, 40.3642];
const COSTCO = [-111.8506, 40.3886];

for (const avoidHighways of [false, true]) {
  const { options } = await router.planRoutes(PG, COSTCO, { avoidHighways });
  console.log(`\n=== avoidHighways=${avoidHighways} ===`);
  for (const o of options) {
    console.log(`  [${o.mode}] ${o.label}: ${(o.distance/1000).toFixed(1)} km, ${Math.round(o.duration/60)} min, ${o.cameras} cam${o.overBudget?' OVER-BUDGET':''}${o.strictFallback?' (softCam fallback)':''}`);
  }
}
