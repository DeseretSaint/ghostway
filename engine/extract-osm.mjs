// engine/extract-osm.mjs
// Pure-Node replacement for the osmium CLI chain (works locally AND in CI —
// one extraction path, no system deps). Reads a region .osm.pbf and writes
// BOTH build-graph inputs:
//
//   engine/data/wasatch-roads.geojson — drivable ways as LineStrings with the
//     five tags build-graph reads (highway, access, maxspeed, oneway, name)
//     PLUS `osmId` (the way's OSM id) for turn-restriction mapping.
//   engine/data/restrictions.json — type=restriction relations with a via
//     NODE: { id, restriction, from, to, via, viaLon, viaLat } (way ids for
//     from/to; node coords for via). Via-WAY restrictions are counted and
//     skipped (they need multi-edge expansion — logged honestly).
//
// Usage: node engine/extract-osm.mjs [path/to/region.osm.pbf]
//        (default: engine/data/utah-latest.osm.pbf)
//
import { createReadStream, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import osmpbf from 'osm-pbf-parser';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA = join(DIR, 'data');
const SRC = process.argv[2] || join(DATA, 'utah-latest.osm.pbf');

const DRIVABLE = new Set([
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
  'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential',
  'living_street', 'road',
]);

function batches(file) {
  // osm-pbf-parser emits an old-style stream (no async iteration) — wrap it in
  // a pull queue with pause/resume backpressure so a 170 MB PBF can't balloon
  // the queue faster than we consume it.
  const src = createReadStream(file).pipe(osmpbf());
  const queue = [];
  let done = false, error = null, notify = null;
  const wake = () => { if (notify) { const n = notify; notify = null; n(); } };
  src.on('data', (items) => {
    queue.push(items);
    if (queue.length >= 8) src.pause();
    wake();
  });
  src.on('end', () => { done = true; wake(); });
  src.on('error', (e) => { error = e; done = true; wake(); });
  return {
    async *[Symbol.asyncIterator]() {
      while (queue.length || !done) {
        if (queue.length) {
          const items = queue.shift();
          if (queue.length <= 4) src.resume();
          yield items;
          continue;
        }
        await new Promise((res) => { notify = res; });
        if (error) throw error;
      }
      if (error) throw error;
    },
  };
}

// ---- Pass 1: drivable ways + restriction relations + needed node ids ----
console.log(`pass 1: scanning ${SRC}…`);
const ways = [];            // { id, refs, props }
const restrictions = [];    // { id, restriction, from, to, via }
const needed = new Set();
let viaWaySkipped = 0, conditionalSkipped = 0, multiMemberSkipped = 0;

for await (const items of batches(SRC)) {
  for (const it of items) {
    if (it.type === 'way') {
      const t = it.tags || {};
      if (!DRIVABLE.has(t.highway)) continue;
      if (t.access === 'private' || t.access === 'no') continue;
      const props = { highway: t.highway };
      if (t.access) props.access = t.access;
      if (t.maxspeed) props.maxspeed = t.maxspeed;
      if (t.oneway) props.oneway = t.oneway;
      if (t.name) props.name = t.name;
      ways.push({ id: it.id, refs: it.refs, props });
      for (const r of it.refs) needed.add(r);
    } else if (it.type === 'relation') {
      const t = it.tags || {};
      if (t.type !== 'restriction') continue;
      const val = t.restriction || '';
      if (!val || val.includes(';') || t['restriction:conditional']) {
        conditionalSkipped++;
        continue;
      }
      const froms = (it.members || []).filter((m) => m.role === 'from' && m.type === 'way');
      const tos = (it.members || []).filter((m) => m.role === 'to' && m.type === 'way');
      const vias = (it.members || []).filter((m) => m.role === 'via');
      if (froms.length !== 1 || tos.length !== 1 || vias.length !== 1) {
        multiMemberSkipped++;
        continue;
      }
      if (vias[0].type === 'way') {
        viaWaySkipped++;
        continue;
      }
      restrictions.push({ id: it.id, restriction: val, from: froms[0].id, to: tos[0].id, via: vias[0].id });
      needed.add(vias[0].id);
    }
  }
}
console.log(`  drivable ways: ${ways.length} · via-node restrictions: ${restrictions.length}`);
console.log(`  skipped — via-way: ${viaWaySkipped}, conditional: ${conditionalSkipped}, multi-member: ${multiMemberSkipped}`);

// ---- Pass 2: coordinates for needed nodes ----
console.log('pass 2: resolving node coordinates…');
const idxOf = new Map();
const lon = [];
const lat = [];
for await (const items of batches(SRC)) {
  for (const it of items) {
    if (it.type !== 'node' || !needed.has(it.id)) continue;
    if (idxOf.has(it.id)) continue;
    idxOf.set(it.id, lon.length);
    lon.push(it.lon);
    lat.push(it.lat);
  }
}
console.log(`  resolved ${lon.length} / ${needed.size} needed nodes`);
if (lon.length < needed.size * 0.99) {
  console.error('WARNING: >1% of needed nodes unresolved — is this a full-region extract?');
}

// ---- Emit roads geojson (streamed) ----
mkdirSync(DATA, { recursive: true });
const roadsOut = join(DATA, 'wasatch-roads.geojson');
console.log('writing roads geojson…');
let emitted = 0;
{
  const ws = (await import('node:fs')).createWriteStream(roadsOut);
  const write = (s) => new Promise((res) => ws.write(s, res));
  await write('{"type":"FeatureCollection","features":[');
  let first = true;
  for (const w of ways) {
    const coords = [];
    for (const r of w.refs) {
      const i = idxOf.get(r);
      if (i === undefined) continue;
      coords.push([lon[i], lat[i]]);
    }
    if (coords.length < 2) continue;
    const feat = JSON.stringify({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { ...w.props, osmId: w.id } });
    await write((first ? '' : ',') + feat);
    first = false;
    emitted++;
    if (emitted % 100000 === 0) console.log(`  …${emitted}`);
  }
  await write(']}');
  await new Promise((res) => ws.end(res));
}
console.log(`  roads emitted: ${emitted} → ${roadsOut}`);

// ---- Emit restrictions (with via node coords) ----
const out = [];
for (const r of restrictions) {
  const i = idxOf.get(r.via);
  if (i === undefined) continue; // via node outside extract
  out.push({ ...r, viaLon: lon[i], viaLat: lat[i] });
}
writeFileSync(join(DATA, 'restrictions.json'), JSON.stringify(out));
console.log(`  restrictions written: ${out.length}`);
