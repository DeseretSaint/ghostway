// ETA accuracy benchmark (Workstream B contract item):
// Compare Ghostway ETAs against Valhalla's production costing on 5 real
// corridors. Inside-coverage corridors also include the own-graph engine.
import { valhallaRoute } from '../src/valhalla.js';
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

const corridors = [
  { name: 'PG → Costco Lehi', from: [-111.759, 40.364], to: [-111.834, 40.394] },
  { name: 'Pleasant Grove → Provo (BYU)', from: [-111.759, 40.364], to: [-111.6553, 40.2523] },
  { name: 'Lehi → SLC Downtown', from: [-111.8508, 40.3852], to: [-111.891, 40.7608] },
  { name: 'American Fork → Park City', from: [-111.7965, 40.3769], to: [-111.498, 40.6461] },
  { name: 'Orem → Salt Lake Airport', from: [-111.6946, 40.2969], to: [-111.9778, 40.7884] },
];

// Coverage check uses the graph's own bbox (loaded above).
import { inGraphRegion } from '../src/router.js';

console.log('corridor | valhalla ETA | own engine ETA | diff');
for (const c of corridors) {
  let line = `${c.name.padEnd(32)}`;
  try {
    const v = await valhallaRoute(c.from, c.to, null);
    const vm = Math.round(v.duration / 60);
    const vk = (v.distance / 1000).toFixed(1);
    line += ` | ${vm} min (${vk} km)`;
    if (inGraphRegion(c.from[0], c.from[1]) && inGraphRegion(c.to[0], c.to[1])) {
      const { options } = await planRoutes(c.from, c.to, { traffic: null });
      const fastest = options.find((o) => o.mode === 'off');
      const om = Math.round(fastest.duration / 60);
      const ok = (fastest.distance / 1000).toFixed(1);
      line += ` | ${om} min (${ok} km) | ${om - vm >= 0 ? '+' : ''}${om - vm} min`;
    } else {
      line += ' | — (outside graph)';
    }
  } catch (e) {
    line += ` | ERROR: ${e.message}`;
  }
  console.log(line);
}
console.log('\nNote: Valhalla = production costing model (reference); own engine = OSM maxspeed + road-class profile.');
