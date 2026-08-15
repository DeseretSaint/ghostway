import { readFileSync } from 'node:fs';

const j = JSON.parse(readFileSync(new URL('./data/cameras-usa.geojson', import.meta.url), 'utf8'));
const feats = j.features;
console.log('total cameras:', feats.length);

const brands = {};
let inBbox = 0;
const WASATCH = { w: -112.3, e: -111.2, s: 39.9, n: 41.1 };
const box = [];
for (const f of feats) {
  const p = f.properties || {};
  const b = p.brand || p.operator || 'unknown';
  brands[b] = (brands[b] || 0) + 1;
  const [lon, lat] = f.geometry.coordinates;
  if (lon >= WASATCH.w && lon <= WASATCH.e && lat >= WASATCH.s && lat <= WASATCH.n) {
    inBbox++;
    box.push({ lon, lat, brand: b, dir: p.direction });
  }
}
console.log('brands (top 10):', Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 10));
console.log('cameras in Wasatch bbox:', inBbox);
console.log('sample in bbox:', JSON.stringify(box.slice(0, 5), null, 1));
