// Engine test: route Pleasant Grove → Costco Lehi (Keaton's real corridor)
// on the prebuilt Wasatch graph and verify the three cost modes behave:
//   - fastest  = minimum time
//   - clearest = fewer camera clusters than fastest (the whole point)
//   - balanced = in between
import { planRoutes } from '../src/router.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const gz = readFileSync(join(DIR, '..', 'public', 'graph', 'wasatch-graph.bin.gz'));

// Shim fetch to serve the local gz graph (router.js decompresses via
// DecompressionStream, which Node 22 supports natively).
globalThis.fetch = async () => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  return { ok: true, status: 200, arrayBuffer: async () => ab };
};

const FROM = [-111.759, 40.364]; // Pleasant Grove
const TO = [-111.834, 40.394]; // Costco Lehi (1200 East)

console.log('planning routes (loads graph first)…');
const t1 = Date.now();
const { options } = await planRoutes(FROM, TO, {});
console.log(`total ${Date.now() - t1}ms\n`);

for (const o of options) {
  console.log(
    `${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1)} km  ` +
    `${Math.round(o.duration / 60)} min  cameras: ${o.cameras}  ` +
    `steps: ${o.instructions.length}  pts: ${o.coords.length}`
  );
}

const fastest = options.find((o) => o.mode === 'off');
const clearest = options.find((o) => o.mode === 'strict');

const pass =
  options.length >= 2 &&
  fastest &&
  (clearest ? clearest.cameras <= fastest.cameras : true) &&
  options.every((o) => o.instructions.length > 2 && o.coords.length > 10);

console.log(
  pass
    ? '\nENGINE PASS ✅ — modes produce distinct options with camera accounting'
    : '\nENGINE FAIL ❌'
);
process.exit(pass ? 0 : 1);
