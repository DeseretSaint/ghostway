// Refresh the WZDx work-zone snapshot for the Wasatch Front.
// The live UDOT WZDx feed has no CORS headers, so CI runs this periodically
// and commits the filtered result as a static asset the app loads at runtime.
//
//   curl https://udottraffic.utah.gov/wzdx/udot/v40/data
//     → public/data/wzdx.json  { asOf, zones: [{coords, road, dir, impact}] }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(DIR, '..', 'public', 'data', 'wzdx.json');
const FEED = 'https://udottraffic.utah.gov/wzdx/udot/v40/data';
const BBOX = { w: -112.3, s: 39.85, e: -111.2, n: 40.9 }; // slight halo past graph box

console.log('fetching', FEED);
const res = await fetch(FEED, { signal: AbortSignal.timeout(60000) });
if (!res.ok) throw new Error(`feed ${res.status}`);
const feed = await res.json();

const now = Date.now();
const zones = [];
for (const f of feed.features || []) {
  const p = f.properties || {};
  const cd = p.core_details || {};
  if (cd.event_type && cd.event_type !== 'work-zone') continue;
  // Active only: started (or starting soon) and not ended.
  const start = p.start_date ? Date.parse(p.start_date) : NaN;
  const end = p.end_date ? Date.parse(p.end_date) : NaN;
  if (!isNaN(end) && end < now) continue;
  if (!isNaN(start) && start > now + 3 * 24 * 3600 * 1000) continue;
  const coords = f.geometry && f.geometry.type === 'LineString' ? f.geometry.coordinates : [];
  if (coords.length < 2) continue;
  // Keep zones whose geometry touches the box (keep the whole line so routing
  // sees the complete segment, not just the cropped piece).
  const touches = coords.some((c) => c[0] >= BBOX.w && c[0] <= BBOX.e && c[1] >= BBOX.s && c[1] <= BBOX.n);
  if (!touches) continue;
  // Decimate long lines to ~120 m spacing to keep the payload small.
  const thin = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const [ax, ay] = thin[thin.length - 1];
    const dx = (coords[i][0] - ax) * 111320 * Math.cos((coords[i][1] * Math.PI) / 180);
    const dy = (coords[i][1] - ay) * 111320;
    if (dx * dx + dy * dy > 120 * 120 || i === coords.length - 1) thin.push(coords[i]);
  }
  zones.push({
    coords: thin.map((c) => [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))]),
    road: (cd.road_names || []).join('; ') || '',
    dir: cd.direction || '',
    impact: p.vehicle_impact || '',
    lanes: p.restricted_lane_count || 0,
    workers: p.workers_present === true ? 1 : 0,
  });
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ asOf: new Date().toISOString(), source: FEED, zones })
);
console.log(`wrote ${zones.length} work zones → ${OUT}`);
