// Builds a NATIONWIDE work-zone snapshot from every active state WZDx feed
// (registry: data.transportation.gov). Run in CI (no CORS limits server-side);
// the app loads the compact result at runtime for traffic-aware routing
// outside Utah (where live UDOT events cover it).
//
//   registry → each state feed → filter+compact → public/data/wzdx-national.json

import { writeFileSync, mkdirSync, statSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, '..', 'public', 'data', 'wzdx-national.json');
const REGISTRY = 'https://data.transportation.gov/resource/69qe-yiui.json?$limit=200';

async function getJson(url, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json, application/geo+json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const urlOf = (r) => {
  const u = r.url;
  if (!u) return null;
  if (typeof u === 'string') return u;
  return u.url || u.link || null;
};

console.log('fetching registry…');
const registry = await getJson(REGISTRY);
const feeds = registry
  .map((r) => ({ state: r.state, name: r.feedname, url: urlOf(r) }))
  .filter((r) => r.url && /^https?:/.test(r.url));
console.log(`${feeds.length} feeds listed`);

const now = Date.now();
const zonesByState = {};
let totalRaw = 0, kept = 0, failed = 0;

for (const f of feeds) {
  try {
    const j = await getJson(f.url, 45000);
    const feats = j.features || [];
    totalRaw += feats.length;
    const zones = [];
    for (const feat of feats) {
      const g = feat.geometry;
      if (!g || g.type !== 'LineString' || !g.coordinates || g.coordinates.length < 2) continue;
      const p = feat.properties || {};
      // Skip ended events.
      if (p.end_date) {
        const end = Date.parse(p.end_date);
        if (!isNaN(end) && end < now) continue;
      }
      // Restriction info (if present) determines the speed factor.
      const impact = String(p.vehicle_impact || '').toLowerCase();
      const lanesClosed = Number(p.restricted_lane_count || 0);
      let factor = 0.85; // generic work zone
      if (impact.includes('closed') || impact.includes('all lanes')) factor = 0.2;
      else if (lanesClosed >= 2) factor = 0.5;
      else if (lanesClosed === 1) factor = 0.65;
      // Decimate geometry to ~250 m spacing to keep the payload compact.
      const coords = g.coordinates;
      const thin = [coords[0]];
      for (let i = 1; i < coords.length; i++) {
        const [ax, ay] = thin[thin.length - 1];
        const dx = (coords[i][0] - ax) * 111320 * Math.cos((coords[i][1] * Math.PI) / 180);
        const dy = (coords[i][1] - ay) * 111320;
        if (dx * dx + dy * dy > 250 * 250 || i === coords.length - 1) thin.push(coords[i]);
      }
      zones.push({
        c: thin.map((c) => [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))]),
        f: Number(factor.toFixed(2)),
        r: (p.road_names || []).join('; ').slice(0, 40) || undefined,
      });
      kept++;
    }
    if (zones.length) zonesByState[f.state || f.name] = zones;
    console.log(`  ${String(f.state || f.name).padEnd(12)} ${String(feats.length).padStart(6)} raw → ${String(zones.length).padStart(6)} kept`);
  } catch (e) {
    failed++;
    console.log(`  ${String(f.state || f.name).padEnd(12)} FAILED: ${e.message.slice(0, 60)}`);
  }
}

mkdirSync(dirname(OUT), { recursive: true });
const payload = { asOf: new Date().toISOString(), states: zonesByState };
writeFileSync(OUT, JSON.stringify(payload));
// Ship the gzipped version; the app decompresses client-side (same pattern as
// the routing graph). GitHub Pages serves .gz with Content-Encoding: gzip,
// and the loader sniffs the magic bytes either way.
const raw = readFileSync(OUT);
const gz = gzipSync(raw, { level: 9 });
writeFileSync(OUT + '.gz', gz);
const mb = (gz.length / 1e6).toFixed(1);
console.log(`\ntotal raw: ${totalRaw} · kept: ${kept} · feeds failed: ${failed}/${feeds.length}`);
console.log(`wrote ${OUT} (${(raw.length / 1e6).toFixed(1)} MB) + .gz (${mb} MB)`);
