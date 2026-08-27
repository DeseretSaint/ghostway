// Measure pairwise geometric overlap between generated options.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const gz = readFileSync(new URL('../public/graph/wasatch-graph.bin.gz', import.meta.url));
const raw = gunzipSync(gz);
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) });

const router = await import(new URL('../src/router.js', import.meta.url).href);
const PG = [-111.7448, 40.3642];
const COSTCO = [-111.8506, 40.3886];

const { options } = await router.planRoutes(PG, COSTCO, { avoidHighways: true });

// Reimplement overlap here to measure (same algo as router's routeOverlap).
function overlap(aCoords, bCoords) {
  const kx = Math.cos((bCoords[0][1] * Math.PI) / 180) * 111320;
  const ky = 111320;
  const CELL = 120;
  const grid = new Map();
  for (const c of aCoords) {
    const k = Math.floor((c[0] * kx) / CELL) + ',' + Math.floor((c[1] * ky) / CELL);
    let arr = grid.get(k); if (!arr) grid.set(k, (arr = []));
    arr.push([c[0] * kx, c[1] * ky]);
  }
  let near = 0, total = 0;
  for (let i = 1; i < bCoords.length; i++) {
    const x0 = bCoords[i-1][0]*kx, y0 = bCoords[i-1][1]*ky;
    const x1 = bCoords[i][0]*kx, y1 = bCoords[i][1]*ky;
    const segLen = Math.hypot(x1-x0, y1-y0);
    if (segLen < 1) continue;
    total += segLen;
    const mx = (x0+x1)/2, my = (y0+y1)/2;
    const gx = Math.floor(mx/CELL), gy = Math.floor(my/CELL);
    let best = Infinity;
    for (let dx=-1; dx<=1 && best>60; dx++) for (let dy=-1; dy<=1 && best>60; dy++) {
      const pts = grid.get((gx+dx)+','+(gy+dy));
      if (!pts) continue;
      for (const [px,py] of pts) { const d = Math.hypot(px-mx, py-my); if (d<best) { best=d; if (best<=60) break; } }
    }
    if (best <= 60) near += segLen;
  }
  return total ? near/total : 0;
}

console.log('options:', options.map(o => o.label).join(', '));
for (let i = 0; i < options.length; i++) {
  for (let j = i+1; j < options.length; j++) {
    const ov = overlap(options[i].coords, options[j].coords);
    console.log(`  ${options[i].label} vs ${options[j].label}: overlap=${(ov*100).toFixed(1)}%`);
  }
}
