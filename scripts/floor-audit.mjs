// Floor-regression guard for the strict-mode safety floor (round 21).
// Claim under test: NO edge with cam byte <= 160 (i.e. strict-legal) may pass
// within ~30 m of an ALPR camera. The builder scores exposure from samples
// <=40 m apart, so a stale graph (built before dense sampling landed) or a
// builder regression can silently ship strict-legal edges inside read range.
//
// Method: parse public/graph/wasatch-graph.bin(.gz) directly, recompute the
// TRUE min distance from every strict-legal edge to every in-bbox ALPR camera
// by dense 5 m sampling (8x denser than the builder). Independent of the
// router and the builder's scoring.
//
// Usage: node scripts/floor-audit.mjs [path-to-graph.bin-or-.gz]
// (default: public/graph/wasatch-graph.bin, falling back to the .gz)
//
// Exit 0 = PASS (0 violations), exit 1 = FAIL (violations listed).
// Run after every graph rebuild: node scripts/floor-audit.mjs
//
// NOTE (2026-08-26, round 25): an earlier /tmp version of this audit read
// edge endpoints at offA+e / offB+e (missing the *4 stride), decoding garbage
// geometry and reporting 10 phantom violations. Offsets below match the
// builder's struct-of-arrays layout exactly (a,b u32 → stride 4; len u16 → 2).
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isAlprCamera } from '../src/config.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argPath = process.argv[2];
const binPath = join(ROOT, 'public/graph/wasatch-graph.bin');
const gzPath = binPath + '.gz';
const buf = argPath
  ? (argPath.endsWith('.gz') ? gunzipSync(readFileSync(argPath)) : readFileSync(argPath))
  : (existsSync(binPath) ? readFileSync(binPath) : gunzipSync(readFileSync(gzPath)));
if (buf.toString('latin1', 0, 4) !== 'GWR1') throw new Error('bad magic');
const nodeCount = buf.readUInt32LE(4);
const edgeCount = buf.readUInt32LE(8);
const bbox = { w: buf.readDoubleLE(12), s: buf.readDoubleLE(20), e: buf.readDoubleLE(28), n: buf.readDoubleLE(36) };

// Nodes: all lons then all lats (i32 ×1e6)
const nodeLon = new Float64Array(nodeCount);
const nodeLat = new Float64Array(nodeCount);
for (let i = 0; i < nodeCount; i++) nodeLon[i] = buf.readInt32LE(44 + i * 4) / 1e6;
const latBase = 44 + nodeCount * 4;
for (let i = 0; i < nodeCount; i++) nodeLat[i] = buf.readInt32LE(latBase + i * 4) / 1e6;

// Edges: struct-of-arrays — A u32, B u32, LEN u16, SPD u8, CAM u8, OW u8, NAME u16
const eBase = latBase + nodeCount * 4;
const offA = eBase, offB = eBase + edgeCount * 4, offLen = offB + edgeCount * 4;
const offSpd = offLen + edgeCount * 2, offCam = offSpd + edgeCount;

// ALPR cameras from the same national snapshot the graph was built from
const cams = JSON.parse(readFileSync(join(ROOT, 'engine/data/cameras-usa.geojson'), 'utf8'));
const inBox = ([lon, lat]) => lon >= bbox.w && lon <= bbox.e && lat >= bbox.s && lat <= bbox.n;
const alpr = [];
for (const f of cams.features) {
  if (!inBox(f.geometry.coordinates)) continue;
  if (!isAlprCamera(f.properties || {})) continue;
  alpr.push({ lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] });
}
console.log(`ALPR cameras in bbox: ${alpr.length} (of ${cams.features.length} national)`);

// Grid for min-distance queries (same CELL/halo scheme as builder)
const CELL = 0.002;
const grid = new Map();
for (const c of alpr) {
  const gx = Math.floor(c.lon / CELL), gy = Math.floor(c.lat / CELL);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const k = (gx + dx) + ',' + (gy + dy);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(c);
  }
}
function minDistAlpr(lon, lat) {
  const gx = Math.floor(lon / CELL), gy = Math.floor(lat / CELL);
  const list = grid.get(gx + ',' + gy);
  if (!list) return Infinity;
  const cosLat = Math.cos(lat * Math.PI / 180);
  let best = Infinity;
  for (const c of list) {
    const dx = (c.lon - lon) * 111320 * cosLat, dy = (c.lat - lat) * 111320;
    const d = Math.hypot(dx, dy);
    if (d < best) best = d;
  }
  return best;
}

// Strict floor: cam byte <=160 edges must stay >=31.4 m from every ALPR cam
// (30 m floor + tolerance for builder sample spacing).
const FLOOR = 31.4;
let camPos = 0, audited = 0, forbidden = 0;
const buckets = { '<20': 0, '20-25': 0, '25-30': 0, '30-40': 0, '40-60': 0, '60-100': 0 };
const violations = [];
const t0 = Date.now();
for (let e = 0; e < edgeCount; e++) {
  const cam = buf.readUInt8(offCam + e);
  if (cam === 0) continue; // byte 0 = builder proved >=100 m from every camera
  camPos++;
  if (cam > 160) { forbidden++; continue; } // forbidden side; not a safety hole
  audited++;
  const a = buf.readUInt32LE(offA + e * 4), b = buf.readUInt32LE(offB + e * 4);
  const len = buf.readUInt16LE(offLen + e * 2);
  const lon1 = nodeLon[a], lat1 = nodeLat[a], lon2 = nodeLon[b], lat2 = nodeLat[b];
  const n = Math.max(2, Math.ceil(len / 5) + 1); // 5 m sampling
  let best = Infinity, bestLon = 0, bestLat = 0;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const lon = lon1 + (lon2 - lon1) * t, lat = lat1 + (lat2 - lat1) * t;
    const d = minDistAlpr(lon, lat);
    if (d < best) { best = d; bestLon = lon; bestLat = lat; }
  }
  if (best < 20) buckets['<20']++;
  else if (best < 25) buckets['20-25']++;
  else if (best < 30) buckets['25-30']++;
  else if (best < 40) buckets['30-40']++;
  else if (best < 60) buckets['40-60']++;
  else buckets['60-100']++;
  if (best < FLOOR) violations.push({ e, cam, d: +best.toFixed(1), lon: +bestLon.toFixed(6), lat: +bestLat.toFixed(6), len });
}
console.log(`edges: ${edgeCount}, cam>0: ${camPos}, strict-legal audited: ${audited}, forbidden(>160): ${forbidden}`);
console.log(`true min ALPR distance histogram (audited edges):`, buckets);
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (violations.length) {
  violations.sort((x, y) => x.d - y.d);
  console.log(`FAIL: ${violations.length} strict-legal edges pass < ${FLOOR} m from an ALPR camera:`);
  for (const v of violations.slice(0, 20)) console.log(`  edge ${v.e}: ${v.d} m (cam byte ${v.cam}, len ${v.len} m) @ ${v.lat},${v.lon}`);
  if (violations.length > 20) console.log(`  … ${violations.length - 20} more`);
  process.exit(1);
}
console.log(`PASS: 0 strict-legal edges within ${FLOOR} m of any ALPR camera`);
