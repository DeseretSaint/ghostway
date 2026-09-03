import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const gz = readFileSync(new URL('../public/graph/wasatch-graph.bin.gz', import.meta.url));
const raw = gunzipSync(gz);
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) });
const router = await import(new URL('../src/router.js', import.meta.url).href);

const PG = [-111.7448, 40.3642];
const COSTCO = [-111.8506, 40.3886];

// Replicate the smart-default scorer from main.js
function smartDefault(options, mode, avoid) {
  if (mode === 'off' || !avoid) { const f = options.findIndex(o=>o.mode==='off'); return f===-1?0:f; }
  let best=-1, bs=Infinity;
  options.forEach((o,i)=>{ const s=o.cameras*1e7+(o.highwayKm||0)*1000+o.distance; if(s<bs){bs=s;best=i;} });
  return best===-1?0:best;
}

for (const ah of [false, true]) {
  const { options } = await router.planRoutes(PG, COSTCO, { avoidHighways: ah });
  console.log(`\n=== avoidHighways=${ah}, mode=moderate (avoid on) ===`);
  options.forEach(o => console.log(`  [${o.mode}] ${o.label}: ${(o.distance/1000).toFixed(1)}km ${Math.round(o.duration/60)}min ${o.cameras}cam hw=${(o.highwayKm||0).toFixed(1)}km`));
  const pick = smartDefault(options, 'moderate', true);
  const o = options[pick];
  console.log(`  >>> SMART DEFAULT: ${o.label} (${o.cameras} cam, ${(o.highwayKm||0).toFixed(1)} hw km, ${(o.distance/1000).toFixed(1)} km)`);
}
