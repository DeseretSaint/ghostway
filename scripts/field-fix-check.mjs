// Field-report regression (iteration 19):
//  (a) committing bare "Costco" resolves to the NEAREST Costco (Lehi), not the
//      global top hit (Tulsa) — the commit path, not just the dropdown.
//  (b) searching an airport resolves to a routable terminal/entrance, not the
//      aerodrome centroid, so the route doesn't loop into the airfield.
import { readFileSync } from 'node:fs';

// Load the shipped router with the graph so nearestNode snapping is real.
const { planRoutes, loadGraph } = await import('../src/router.js');
const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (u.includes('wasatch-graph.bin.gz')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  if (u.includes('photon.komoot.io')) return realFetch(url, opts);
  return realFetch(url, opts);
};
await loadGraph();

// Mirror main.js resolveInput + isAreaPoi + findEntrance.
const haversine = (a, b) => {
  const R = 6371000, r = (d) => (d * Math.PI) / 180;
  const dLat = r(b[1] - a[1]), dLon = r(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
async function searchPlaces(query, limit, near) {
  const bias = near ? `&lat=${near[1]}&lon=${near[0]}` : '';
  const pool = Math.max(limit * 3, 15);
  const res = await fetch(`https://photon.komoot.io/api?q=${encodeURIComponent(query)}&limit=${pool}${bias}`);
  const j = await res.json();
  let places = (j.features || []).map((f) => {
    const p = f.properties;
    return { name: p.name || p.street || query, coords: f.geometry.coordinates, raw: p };
  });
  if (near && places.length > 1) places = places.map((pl) => ({ ...pl, _d: haversine(near, pl.coords) })).sort((a, b) => a._d - b._d);
  return places.slice(0, limit);
}
const isAreaPoi = (place) => {
  const p = place.raw || {};
  return p.osm_value === 'aerodrome' || p.osm_value === 'campus' || p.osm_value === 'golf_course';
};
const findEntrance = (results, area) => {
  if (!results || !results.length) return null;
  let best = null, bestRank = 99, bestD = Infinity;
  for (const r of results) {
    if (r === area) continue;
    const rp = r.raw || {};
    if (/hotel|inn|suites|motel|lodging/i.test((rp.osm_key || '') + ' ' + (rp.osm_value || ''))) continue;
    let rank = 99;
    if (rp.osm_key === 'aeroway' && rp.osm_value === 'terminal') rank = 0;
    else if (rp.osm_value === 'entrance' || rp.osm_value === 'gate') rank = 1;
    else if (rp.osm_value === 'parking') rank = 2;
    else if (/terminal|departure|arrival/i.test(r.name || '') && rp.osm_key === 'aeroway') rank = 3;
    else if (rp.osm_key === 'building') rank = 6;
    if (rank > 6) continue;
    const d = haversine(area.coords, r.coords);
    if (d < 8000 && (rank < bestRank || (rank === bestRank && d < bestD))) {
      bestRank = rank; bestD = d; best = r;
    }
  }
  return best;
};
async function resolveInput(query, near) {
  const places = await searchPlaces(query, 8, near);
  if (!places.length) return null;
  const nameMatchesQuery = (name, q) => {
    if (!name) return false;
    const n = name.toLowerCase();
    const tokens = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (!tokens.length) return true;
    return tokens.every((t) => n.includes(t));
  };
  const area = places.find((r) => isAreaPoi(r) && nameMatchesQuery(r.name, query)) || (isAreaPoi(places[0]) ? places[0] : null);
  if (area) {
    let entrance = findEntrance(places, area);
    if (!entrance) {
      const more = await searchPlaces(area.name + ' terminal', 6, near).catch(() => []);
      entrance = findEntrance([...places, ...more], area);
    }
    if (entrance) return { ...entrance, _area: area.name };
  }
  return places[0];
}

const PG = [-111.759, 40.364]; // Keaton's Pleasant Grove

// (a) Costco commit → must be Lehi, not Tulsa/Palm Desert.
const costco = await resolveInput('Costco', PG);
console.log('Costco commit →', costco.name, '·', costco.raw.city || costco.raw.state);
const costcoOK = /Lehi|Orem|, UT|Utah/i.test([costco.raw.city, costco.raw.state].join(' ')) && haversine(PG, costco.coords) < 60000;

// (b) Airport commit → terminal entrance, not aerodrome centroid; and the
// resulting route must be efficient (not a loop into the airfield).
const airport = await resolveInput('Salt Lake City Airport', [-111.891, 40.7608]);
console.log('Airport commit →', airport.name, '·', airport.raw.osm_key + '=' + airport.raw.osm_value, airport._area ? '(via area ' + airport._area + ')' : '');
const airportOK = !isAreaPoi(airport); // resolved to an entrance, not the aerodrome area
let routeOK = false, km = 0;
if (airportOK) {
  const { options } = await planRoutes([-111.891, 40.7608], airport.coords, { traffic: null });
  const fast = options.find((o) => o.mode === 'off');
  km = fast.distance / 1000;
  console.log('downtown → airport route:', km.toFixed(1), 'km (was 16.6 km via centroid)');
  routeOK = km < 14; // efficient, no loop
}

const pass = costcoOK && airportOK && routeOK;
console.log(pass ? '\nFIELD-FIX PASS ✅ — Costco commits nearest, airport routes to entrance efficiently' : '\nFIELD-FIX FAIL ❌');
process.exit(pass ? 0 : 1);
