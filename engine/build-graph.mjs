// Build Ghostway's own road graph from the Wasatch Front OSM extract.
// Output: a compact binary graph (+ gzip) the browser loads once and routes over.
//
//   engine/data/wasatch-roads.geojson  (osmium export, drivable highways)
//   engine/data/cameras-usa.geojson    (DeFlock national camera snapshot)
//                ↓
//   public/graph/wasatch-graph.bin(.gz)
//
// Binary layout (all little-endian), magic "GWR2" (4B) — GWR1 graphs (no
// turn table) still parse:
//   nodeCount u32, edgeCount u32
//   bbox: 4 × f64  (w, s, e, n)
//   nodes:  nodeCount × (i32 lon×1e6, i32 lat×1e6)
//   edges:  struct-of-arrays:
//     a u32[edgeCount], b u32[edgeCount], len u16 (m), spd u8 (km/h),
//     cam u8 (exposure penalty 0-255), ow u8 (0 bi / 1 a→b / 2 b→a),
//     name u16 (index into names dictionary, 65535 = none)
//   names: u16 count, then each: u16 len + utf8 bytes
//
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isAlprCamera } from '../src/config.js';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA = join(DIR, 'data');
const OUT = join(DIR, '..', 'public', 'graph');

// Shipping region: full state of Utah (where users test first in the Wasatch
// front, then statewide — St. George, Cedar City, Ogden, Park City, SLC, Provo).
const BBOX = { w: -114.0, s: 37.0, e: -109.0, n: 42.0 };

const SPEED = {
  motorway: 110, motorway_link: 70,
  trunk: 95, trunk_link: 60,
  primary: 75, primary_link: 55,
  secondary: 60, secondary_link: 50,
  tertiary: 50, tertiary_link: 45,
  unclassified: 45, residential: 40,
  living_street: 20, road: 40,
};
const DRIVABLE = new Set(Object.keys(SPEED));

console.log('loading roads…');
const roads = JSON.parse(readFileSync(join(DATA, 'wasatch-roads.geojson'), 'utf8'));
console.log('loading cameras…');
const cams = JSON.parse(readFileSync(join(DATA, 'cameras-usa.geojson'), 'utf8'));

const inBox = ([lon, lat]) => lon >= BBOX.w && lon <= BBOX.e && lat >= BBOX.s && lat <= BBOX.n;

// ---- 1. Collect drivable ways inside the region ----
const ways = [];
const nodeIds = new Set();
for (const f of roads.features) {
  const p = f.properties || {};
  if (f.geometry.type !== 'LineString') continue;
  if (!DRIVABLE.has(p.highway)) continue;
  if (p.access === 'private' || p.access === 'no') continue;
  const coords = f.geometry.coordinates;
  if (!coords.some(inBox)) continue;
  ways.push({ coords, p, osmId: p.osmId ?? null });
  for (const c of coords) if (inBox(c)) nodeIds.add(c.join(','));
}
console.log(`ways: ${ways.length}, unique nodes: ${nodeIds.size}`);

// ---- 2. Index nodes ----
const idOf = new Map();
const nodeLon = new Int32Array(nodeIds.size);
const nodeLat = new Int32Array(nodeIds.size);
let ni = 0;
for (const key of nodeIds) {
  const [lon, lat] = key.split(',').map(Number);
  idOf.set(key, ni);
  nodeLon[ni] = Math.round(lon * 1e6);
  nodeLat[ni] = Math.round(lat * 1e6);
  ni++;
}
const nodeCount = ni;

// ---- 3. Camera spatial grid (~180m cells, 1-cell halo) ----
const CELL = 0.002;
const camGrid = new Map();
for (const f of cams.features) {
  const [lon, lat] = f.geometry.coordinates;
  if (!inBox([lon, lat])) continue;
  // Hard guard: non-road research devices (indoor/facility centroids) must
  // never add routing exposure — only cameras facing roads may penalize edges.
  if (f.properties && f.properties.roadRelevant === false) continue;
  // ALPR classification shares isAlprCamera() with the live map layer
  // (plate-reader brands + traffic-facing cameras), single source of truth.
  const isAlpr = isAlprCamera(f.properties || {});
  const w = isAlpr ? 1.0 : 0.25;
  // ^ non-ALPR alone never reaches the strict floor (64): 0.25×255 = 63.75,
  //   so generic surveillance weighs routes down but never walls them.
  const gx = Math.floor(lon / CELL);
  const gy = Math.floor(lat / CELL);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const k = (gx + dx) + ',' + (gy + dy);
      if (!camGrid.has(k)) camGrid.set(k, []);
      camGrid.get(k).push({ lon, lat, w });
    }
  }
}

function camPenaltyNear(lon, lat, R = 100) {
  const gx = Math.floor(lon / CELL);
  const gy = Math.floor(lat / CELL);
  const list = camGrid.get(gx + ',' + gy);
  if (!list) return 0;
  let p = 0;
  const R2 = R * R;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (const c of list) {
    const dLon = (c.lon - lon) * 111320 * cosLat;
    const dLat = (c.lat - lat) * 111320;
    const d2 = dLon * dLon + dLat * dLat;
    if (d2 <= R2) p += (1 - Math.sqrt(d2) / R) * c.w;
  }
  return Math.min(255, Math.round(p * 255));
}

// ---- 4. Names dictionary ----
const names = [];
const nameId = new Map();
function getNameId(name) {
  if (!name) return 65535;
  if (nameId.has(name)) return nameId.get(name);
  if (names.length >= 65535) return 65535;
  const id = names.length;
  names.push(name);
  nameId.set(name, id);
  return id;
}

// ---- 5. Build edges ----
const A = [], B = [], LEN = [], SPD = [], CAM = [], OW = [], NAME = [];
// osmId → segments {e, a, b} for turn-restriction mapping (GWR2).
const waySegs = new Map();
let camEdges = 0;

for (const { coords, p, osmId } of ways) {
  const hw = p.highway;
  let spd = SPEED[hw] || 40;
  if (p.maxspeed) {
    const m = String(p.maxspeed).match(/^(\d+)( mph)?$/);
    if (m) spd = m[2] ? Math.round(Number(m[1]) * 1.609) : Number(m[1]);
  }
  spd = Math.max(5, Math.min(120, Math.round(spd)));
  const ow = p.oneway === '-1' ? 2 : (p.oneway === 'yes' || p.oneway === '1') ? 1 : 0;
  const nid = getNameId(p.name);

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const a = idOf.get(lon1 + ',' + lat1);
    const b = idOf.get(lon2 + ',' + lat2);
    if (a === undefined || b === undefined || a === b) continue;
    const latm = ((lat1 + lat2) / 2) * Math.PI / 180;
    const dx = (lon2 - lon1) * 111320 * Math.cos(latm);
    const dy = (lat2 - lat1) * 111320;
    const len = Math.round(Math.hypot(dx, dy));
    if (len <= 0 || len > 10000) continue;
    // Sample camera exposure densely along the edge (every ~40 m), not just at
    // the endpoints + midpoint. Long road segments used to miss cameras that
    // sit near the road between sample points — the field-reported "route
    // passed a camera it said it avoided" bug.
    const nSamp = Math.max(2, Math.ceil(len / 40) + 1);
    let cam = 0;
    for (let k = 0; k < nSamp; k++) {
      const t = k / (nSamp - 1);
      const p = camPenaltyNear(lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t);
      if (p > cam) cam = p;
    }
    if (cam > 0) camEdges++;
    A.push(a); B.push(b); LEN.push(len); SPD.push(spd); CAM.push(cam); OW.push(ow); NAME.push(nid);
    if (osmId != null) {
      let segs = waySegs.get(osmId);
      if (!segs) waySegs.set(osmId, (segs = []));
      segs.push({ e: A.length - 1, a, b });
    }
  }
}
const edgeCount = A.length;
console.log(`edges: ${edgeCount}, camera-exposed: ${camEdges} (${((camEdges / edgeCount) * 100).toFixed(1)}%), names: ${names.length}`);

// ---- 5b. Turn restrictions (GWR2) ----
// Map OSM type=restriction relations onto directed edge pairs at their via
// node. dir 0 = a→b traversal, dir 1 = b→a (matches arcRev in parseGraph).
// no_* → banned pair; only_* → the exit arc is ALLOW-LISTED (all other exits
// from that entry arc at the via node are forbidden at search time).
const bans = [];
const allows = [];
{
  let recs = [];
  try {
    recs = JSON.parse(readFileSync(join(DATA, 'restrictions.json'), 'utf8'));
  } catch {
    console.log('turn restrictions: restrictions.json missing — GWR2 with empty table');
  }
  let mapped = 0, unmapped = 0;
  const allowSets = new Map(); // `${node}:${inEdge}:${inDir}` → {node, inEdge, inDir, outs:Set}
  for (const r of recs) {
    const viaIdx = idOf.get(r.viaLon + ',' + r.viaLat);
    const fsegs = waySegs.get(r.from);
    const tsegs = waySegs.get(r.to);
    if (viaIdx === undefined || !fsegs || !tsegs) { unmapped++; continue; }
    const f = fsegs.find((s) => s.a === viaIdx || s.b === viaIdx);
    const t = tsegs.find((s) => s.a === viaIdx || s.b === viaIdx);
    if (!f || !t) { unmapped++; continue; }
    const inDir = f.b === viaIdx ? 0 : 1;
    const outDir = t.a === viaIdx ? 0 : 1;
    if (r.restriction.startsWith('only_')) {
      const k = viaIdx + ':' + f.e + ':' + inDir;
      let a = allowSets.get(k);
      if (!a) allowSets.set(k, (a = { node: viaIdx, inEdge: f.e, inDir, outs: new Set() }));
      a.outs.add(t.e * 2 + outDir);
    } else {
      bans.push({ node: viaIdx, inEdge: f.e, inDir, outEdge: t.e, outDir });
    }
    mapped++;
  }
  for (const a of allowSets.values()) {
    for (const out of a.outs) allows.push({ node: a.node, inEdge: a.inEdge, inDir: a.inDir, outEdge: Math.floor(out / 2), outDir: out % 2 });
  }
  console.log(`turn restrictions: ${recs.length} input · ${mapped} mapped (${bans.length} ban pairs, ${allows.length} allow pairs) · ${unmapped} unmapped`);
}

// ---- 6. Serialize binary (block layout — matches parseGraph in src/router.js) ----
// GWR2 = GWR1 + a turn-restriction table after names:
//   u32 banCount   × (node u32, inEdge u32, inDir u8, outEdge u32, outDir u8)
//   u32 allowCount × (node u32, inEdge u32, inDir u8, outEdge u32, outDir u8)
// (dir 0 = a→b, 1 = b→a; allow rows group per (node,inEdge,inDir) at parse.)
mkdirSync(OUT, { recursive: true });
const namesBytes = names.map((s) => new TextEncoder().encode(s));
const namesTotal = namesBytes.reduce((acc, b) => acc + 2 + b.length, 0);
const namePad = edgeCount % 2; // keep the u16 name array aligned for the parser
const headerSize = 4 + 4 + 4 + 8 * 4;
const nodesSize = nodeCount * 8;
const edgesSize = edgeCount * 15 + namePad;
const turnSize = 8 + (bans.length + allows.length) * 14;
const buf = Buffer.alloc(headerSize + nodesSize + edgesSize + 2 + namesTotal + turnSize);

let o = 0;
buf.write('GWR2', o); o += 4;
buf.writeUInt32LE(nodeCount, o); o += 4;
buf.writeUInt32LE(edgeCount, o); o += 4;
buf.writeDoubleLE(BBOX.w, o); o += 8;
buf.writeDoubleLE(BBOX.s, o); o += 8;
buf.writeDoubleLE(BBOX.e, o); o += 8;
buf.writeDoubleLE(BBOX.n, o); o += 8;

// Nodes: all lons, then all lats.
for (let i = 0; i < nodeCount; i++) { buf.writeInt32LE(nodeLon[i], o); o += 4; }
for (let i = 0; i < nodeCount; i++) { buf.writeInt32LE(nodeLat[i], o); o += 4; }

// Edges: struct-of-arrays blocks.
for (let i = 0; i < edgeCount; i++) { buf.writeUInt32LE(A[i], o); o += 4; }
for (let i = 0; i < edgeCount; i++) { buf.writeUInt32LE(B[i], o); o += 4; }
for (let i = 0; i < edgeCount; i++) { buf.writeUInt16LE(LEN[i], o); o += 2; }
for (let i = 0; i < edgeCount; i++) { buf.writeUInt8(SPD[i], o); o += 1; }
for (let i = 0; i < edgeCount; i++) { buf.writeUInt8(CAM[i], o); o += 1; }
for (let i = 0; i < edgeCount; i++) { buf.writeUInt8(OW[i], o); o += 1; }
o += namePad; // alignment pad before the u16 name block
for (let i = 0; i < edgeCount; i++) { buf.writeUInt16LE(NAME[i], o); o += 2; }

buf.writeUInt16LE(names.length, o); o += 2;
for (const b of namesBytes) {
  buf.writeUInt16LE(b.length, o); o += 2;
  buf.set(b, o); o += b.length;
}

// Turn table (GWR2).
const writePairs = (recs) => {
  buf.writeUInt32LE(recs.length, o); o += 4;
  for (const r of recs) {
    buf.writeUInt32LE(r.node, o); o += 4;
    buf.writeUInt32LE(r.inEdge, o); o += 4;
    buf.writeUInt8(r.inDir, o); o += 1;
    buf.writeUInt32LE(r.outEdge, o); o += 4;
    buf.writeUInt8(r.outDir, o); o += 1;
  }
};
writePairs(bans);
writePairs(allows);

const binPath = join(OUT, 'wasatch-graph.bin');
const gzPath = binPath + '.gz';
writeFileSync(binPath, buf);
writeFileSync(gzPath, gzipSync(buf, { level: 9 }));
console.log(`wrote ${binPath} (${(buf.length / 1e6).toFixed(1)} MB), gz ${(readFileSync(gzPath).length / 1e6).toFixed(1)} MB`);
