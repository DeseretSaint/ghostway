// Route-quality audit: for each corridor, compare Fastest vs Balanced vs
// Clearest on distance, time, cameras, highway share, detour ratio, and the
// actual road names used. The "forced highway" complaint shows up as a
// Clearest route with high highway share + big detour on a short trip.
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
const g = await loadGraph();

const corridors = [
  { name: 'PG → Costco Lehi (Keaton case)', from: [-111.759, 40.364], to: [-111.834, 40.394] },
  { name: 'PG → Provo BYU', from: [-111.759, 40.364], to: [-111.6553, 40.2523] },
  { name: 'Lehi → SLC Downtown', from: [-111.8508, 40.3852], to: [-111.891, 40.7608] },
  { name: 'AF → Park City', from: [-111.7965, 40.3769], to: [-111.498, 40.6461] },
  { name: 'Orem → SLC Airport', from: [-111.6946, 40.2969], to: [-111.9778, 40.7884] },
];

function roadProfile(opt) {
  // Reconstruct per-edge stats from the raw route arcs.
  const r = opt.route || opt;
  const arcs = r.arcs || [];
  let hw = 0, arterial = 0, local = 0, total = 0;
  const names = new Map();
  for (const p of arcs) {
    const e = g.arcEdge[p];
    const len = g.eLen[e];
    const spd = g.eSpd[e];
    total += len;
    if (spd >= 95) hw += len;
    else if (spd >= 60) arterial += len;
    else local += len;
    const ni = g.eName[e];
    const nm = ni !== 65535 ? g.names[ni] : '';
    if (nm) names.set(nm, (names.get(nm) || 0) + len);
  }
  const top = [...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([n, l]) => `${n} ${(l / 1000).toFixed(1)}km`).join(', ');
  return { hwPct: Math.round((hw / total) * 100), artPct: Math.round((arterial / total) * 100), locPct: Math.round((local / total) * 100), top };
}

for (const c of corridors) {
  console.log(`\n=== ${c.name} ===`);
  const { options } = await planRoutes(c.from, c.to, { traffic: null });
  const fastest = options.find((o) => o.mode === 'off');
  for (const o of options) {
    const prof = roadProfile(o);
    const detour = fastest ? (o.distance / fastest.distance).toFixed(2) : '—';
    const extraMin = fastest ? ((o.duration - fastest.duration) / 60).toFixed(1) : '—';
    console.log(`  ${o.label.padEnd(9)} ${(o.distance / 1000).toFixed(1).padStart(5)} km  ${Math.round(o.duration / 60)} min  cams=${o.cameras}  detour=${detour}x (+${extraMin} min)  hw=${prof.hwPct}% art=${prof.artPct}% local=${prof.locPct}%`);
    console.log(`            roads: ${prof.top}`);
  }
}
