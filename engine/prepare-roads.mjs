// engine/prepare-roads.mjs
// Produce the compact roads build-input the graph builder consumes.
// NOTE: the output (engine/data/wasatch-roads.build.geojson, ~26 MB) is a
// REGENERABLE ARTIFACT and stays gitignored (engine/data/*.geojson) — too
// heavy for git; rerun this script whenever the OSM export changes.
//
// The full Utah roads export (engine/data/wasatch-roads.geojson, gitignored)
// comes from osmium:
//   osmium tags-filter utah-latest.osm.pbf \
//     "w/highway=motorway,motorway_link,trunk,trunk_link,primary,primary_link,\
// secondary,secondary_link,tertiary,tertiary_link,unclassified,residential,\
// living_street,road" -o wasatch-roads.osm.pbf
//   osmium extract -b -114.0,37.0,-109.0,42.0 wasatch-roads.osm.pbf -o wasatch.osm.pbf
//   osmium export wasatch.osm.pbf -f geojson -o wasatch-roads.geojson
//
// build-graph.mjs only consumes drivable LineStrings and reads exactly five
// properties (highway, access, maxspeed, oneway, name). This script trims the
// full export down to precisely those features + properties, so the committed
// build-input is small and a rebuild is byte-identical.
//
// Run (only when OSM roads change — cameras are refreshed separately by CI):
//   node engine/prepare-roads.mjs
//
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const DATA = join(DIR, 'data');
const SRC = join(DATA, 'wasatch-roads.geojson');      // full osmium export (gitignored)
const OUT = join(DATA, 'wasatch-roads.build.geojson'); // committed build-input

// Must match build-graph.mjs exactly.
const BBOX = { w: -114.0, s: 37.0, e: -109.0, n: 42.0 };
const DRIVABLE = new Set([
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
  'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential',
  'living_street', 'road',
]);
const inBox = ([lon, lat]) => lon >= BBOX.w && lon <= BBOX.e && lat >= BBOX.s && lat <= BBOX.n;

const full = JSON.parse(readFileSync(SRC, 'utf8'));
const features = [];
for (const f of full.features) {
  if (f.geometry.type !== 'LineString') continue;
  const p = f.properties || {};
  if (!DRIVABLE.has(p.highway)) continue;
  if (p.access === 'private' || p.access === 'no') continue;
  if (!f.geometry.coordinates.some(inBox)) continue;
  const props = { highway: p.highway };
  if (p.access) props.access = p.access;
  if (p.maxspeed) props.maxspeed = p.maxspeed;
  if (p.oneway) props.oneway = p.oneway;
  if (p.name) props.name = p.name;
  features.push({ type: 'Feature', geometry: f.geometry, properties: props });
}
const out = JSON.stringify({ type: 'FeatureCollection', features });
writeFileSync(OUT, out);
let coords = 0;
for (const f of features) coords += f.geometry.coordinates.length;
console.log(`wrote ${OUT}`);
console.log(`  drivable LineStrings: ${features.length}, coords: ${coords}, ${(out.length / 1e6).toFixed(2)} MB`);
