// DOT-feed registry verification: fetch LIVE data from every registered state
// feed, parse with the real adapters, and assert ≥3 states produce valid
// events in Ghostway's traffic-event shape. Exit 0 = registry healthy.
// Usage: node scripts/dot-feeds-check.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Load the ES modules directly.
const { DOT_FEEDS, STATE_BBOX, statesForBbox, parseWzdx, parseCarsReports } =
  await import('../src/data/dot-feeds.js');

const TIMEOUT = 25000;
async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  const res = await fetch(url, { signal: ctrl.signal });
  clearTimeout(t);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

let okStates = 0;
const report = [];
for (const [st, feeds] of Object.entries(DOT_FEEDS)) {
  if (!feeds.length) { report.push(`${st}: no registered feed (fallback path) — skip`); continue; }
  for (const feed of feeds) {
    try {
      const j = await fetchJson(feed.url);
      const ev = feed.parse(j, STATE_BBOX[st]);
      const valid = ev.every((e) =>
        typeof e.lon === 'number' && typeof e.lat === 'number' &&
        typeof e.severity === 'string' && typeof e.speedFactor === 'number' &&
        e.speedFactor > 0 && e.speedFactor <= 1 && typeof e.radius === 'number' &&
        typeof e.label === 'string' && typeof e.desc === 'string'
      );
      if (!valid) throw new Error('invalid event shape');
      if (ev.length === 0) {
        // A CARS TG feed can legitimately return [] when the state has no
        // unarchived event reports right now — that's a healthy response, not
        // a parse failure. Mark verified-but-empty; it doesn't count toward
        // the ≥3-state gate but also doesn't fail the check.
        report.push(`${st}: ${feed.name} — live, parse OK, 0 active events right now`);
        continue;
      }
      okStates++;
      report.push(`${st}: ${feed.name} — ${ev.length} events, shape OK`);
    } catch (err) {
      report.push(`${st}: ${feed.name} — FAIL: ${err.message}`);
    }
  }
}

// State-detection sanity
const ut = statesForBbox([-112.1, 40.2, -111.9, 40.4]);
const cross = statesForBbox([-114.5, 37.0, -108.5, 41.5]);
console.log(`state detection: UT-only bbox → [${ut.join(',')}] (want UT); UT-CO-spanning → [${cross.join(',')}] (want UT,CO)`);
const detectOk = ut.length === 1 && ut[0] === 'UT' && cross.includes('UT') && cross.includes('CO');

console.log(report.join('\n'));
console.log(`\n${okStates} state feeds parsed live data with valid shape`);
if (okStates >= 3 && detectOk) {
  console.log('DOT-FEEDS PASS ✅ — registry adapters verified against live data');
  process.exit(0);
} else {
  console.error('DOT-FEEDS FAIL ❌');
  process.exit(1);
}
