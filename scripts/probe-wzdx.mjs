// Probe the national WZDx feed registry (data.transportation.gov) to find
// live, CORS-friendly, key-free statewide work-zone feeds Ghostway can use
// outside Utah (UDOT is Utah-only).
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync('/tmp/wzdx-registry.json', 'utf8'));
const urlOf = (r) => {
  const u = r.url;
  if (!u) return null;
  if (typeof u === 'string') return u;
  return u.url || u.link || null;
};

const candidates = registry
  .map((r) => ({ state: r.state, name: r.feedname, url: urlOf(r), active: r.active, freq: r.datafeed_frequency_update }))
  .filter((r) => r.url && /^https?:/.test(r.url));

console.log('feeds with usable URLs:', candidates.length);

let live = 0, cors = 0;
const results = [];
for (const c of candidates.slice(0, 15)) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(c.url, { signal: ctrl.signal, headers: { Accept: 'application/json', Origin: 'https://deseretsaint.github.io' } });
    clearTimeout(t);
    const ctype = res.headers.get('content-type') || '';
    const corsH = res.headers.get('access-control-allow-origin') || 'none';
    let n = 0, fresh = false;
    if (res.ok && /json|geojson/.test(ctype)) {
      const j = await res.json();
      n = (j.features || []).length;
      const upd = j.feed_update_date || j.feed_update || j.road_event_feed_info?.update_date || '';
      fresh = upd ? Date.now() - Date.parse(upd) < 30 * 24 * 3600 * 1000 : false;
    }
    if (res.ok) live++;
    if (corsH === '*') cors++;
    results.push({ ...c, status: res.status, features: n, fresh, cors: corsH });
    console.log(`${(c.state || '').padEnd(4)} ${String(res.status)} feats=${String(n).padStart(5)} fresh=${fresh ? 'Y' : 'n'} cors=${corsH.padEnd(4)} ${(c.url || '').slice(0, 58)}`);
  } catch (e) {
    results.push({ ...c, error: e.message });
    console.log(`${(c.state || '').padEnd(4)} ERR ${e.message.slice(0, 40)}`);
  }
}
console.log(`\nlive: ${live}/${Math.min(15, candidates.length)} · CORS-open: ${cors}`);
