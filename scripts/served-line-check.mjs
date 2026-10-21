// Measure the SERVED strict polyline (dumped from the running APK over CDP)
// against the exact camera pool the app serves, over the WHOLE line incl. both
// endpoints. Usage: node scripts/served-line-check.mjs /tmp/served.json
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const dump = JSON.parse(readFileSync(process.argv[2] || '/tmp/served.json', 'utf8'));
const pool = JSON.parse(gunzipSync(readFileSync('public/cameras/all-cameras.json.gz')));
const cams = pool.rows.map((r) => [r[0], r[1]]);
const coords = dump.coords;
const kx = 111320 * Math.cos((coords[0][1] * Math.PI) / 180);
const ky = 110540;

function distToSeg(p, a, b) {
  const ax = a[0] * kx, ay = a[1] * ky, bx = b[0] * kx, by = b[1] * ky;
  const px = p[0] * kx, py = p[1] * ky;
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function minToCams(p) {
  let m = Infinity;
  for (const c of cams) {
    // cheap prefilter ~1.2 km
    if (Math.abs(c[0] - p[0]) * kx > 1200 || Math.abs(c[1] - p[1]) * ky > 1200) continue;
    const d = Math.hypot((c[0] - p[0]) * kx, (c[1] - p[1]) * ky);
    if (d < m) m = d;
  }
  return m;
}

let total = 0;
const segs = [];
for (let i = 1; i < coords.length; i++) {
  const a = coords[i - 1], b = coords[i];
  const len = Math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * ky);
  segs.push({ a, b, len, start: total });
  total += len;
}

let minAll = Infinity, at = null, near = 0;
for (const s of segs) {
  const steps = Math.max(1, Math.ceil(s.len / 10));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const p = [s.a[0] + (s.b[0] - s.a[0]) * t, s.a[1] + (s.b[1] - s.a[1]) * t];
    const d = minToCams(p);
    if (d < 75) near++;
    if (d < minAll) { minAll = d; at = p; }
  }
}
// Also the vertex-level check the old audit used (would have missed corners).
let minVert = Infinity;
for (const c of coords) minVert = Math.min(minVert, minToCams(c));

console.log(`pool: ${pool.count} cameras, asOf ${pool.asOf}`);
console.log(`served: mode=${dump.mode} cams=${dump.cams} fallback=${dump.fb} drop-off=${dump.off} m, ${coords.length} pts, ${(total / 1609.34).toFixed(2)} mi`);
console.log(`min distance to ANY pool camera over full served line: ${minAll.toFixed(1)} m @ ${at[0].toFixed(5)},${at[1].toFixed(5)}`);
console.log(`samples within 75 m: ${near}`);
console.log(`min over vertices only (legacy method): ${minVert.toFixed(1)} m`);
console.log(minAll >= 75 ? 'SERVED LINE CLEAR ✅' : 'SERVED LINE HAS A CAMERA WITHIN 75 m ❌');
process.exit(minAll >= 75 ? 0 : 1);
