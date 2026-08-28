import { planRoutes, loadGraph } from '../src/router.js';
import { readFileSync } from 'node:fs';
const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
const rf = globalThis.fetch;
globalThis.fetch = async (u) => String(u).includes('wasatch-graph.bin.gz')
  ? { ok:true, status:200, arrayBuffer: async()=>gz.buffer.slice(gz.byteOffset, gz.byteOffset+gz.byteLength) } : rf(u);
await loadGraph();
// short surface-only candidate pairs (PG/Orem residential grids)
const pairs = [
  ['PG-local-1', [-111.745, 40.360], [-111.760, 40.372]],
  ['PG-local-2', [-111.738, 40.355], [-111.752, 40.368]],
  ['Orem-local', [-111.700, 40.300], [-111.715, 40.312]],
  ['PG-local-3', [-111.750, 40.350], [-111.735, 40.362]],
];
for (const [n,[fl,fa],[tl,ta]] of pairs) {
  try {
    const res = await planRoutes([fl,fa],[tl,ta],{ avoidHighways:true });
    const opts = res.options||res;
    const f = opts.find(o=>o.mode==='off');
    const nh = opts.find(o=>o.mode==='no_highways');
    const mo = opts.find(o=>o.mode==='moderate');
    const sameNhMod = nh && mo && JSON.stringify(nh.route.coords)===JSON.stringify(mo.route.coords);
    console.log(`${n}: opts=[${opts.map(o=>o.mode).join(',')}] fastest=${(f.route.distance/1000).toFixed(1)}km hwyKm=${f.route.highwayKm.toFixed(2)} noHw=${!!nh} balanced=${!!mo} noHw==balanced?${sameNhMod}`);
  } catch(e){ console.log(`${n}: ERR ${e.message}`); }
}
