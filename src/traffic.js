// Live traffic — UDOT open incident data (no key, CORS-open).
// Source: "UDOT Road Events" Feature Service (services6.arcgis.com), the same
// events that power udottraffic.utah.gov. Point events carry category,
// start/end dates and severity. Ghostway maps them onto road-graph edges as
// speed reductions so routing and ETAs account for real conditions.
//
// Degrades gracefully: any fetch/parse failure returns { ok:false, events:[] }
// and routing falls back to free-flow speeds.

const UDOT_EVENTS_URL =
  'https://services6.arcgis.com/KaHXE9OkiB9e63uE/arcgis/rest/services/UDOT_Events/FeatureServer/0/query';

export const INCIDENT_SEVERITY = {
  closure: { speedFactor: 0.15, radius: 220, label: 'Road closure' },
  emergency: { speedFactor: 0.25, radius: 180, label: 'Emergency maintenance' },
  lane: { speedFactor: 0.5, radius: 150, label: 'Lane closure' },
  roadwork: { speedFactor: 0.62, radius: 130, label: 'Construction' },
  incident: { speedFactor: 0.45, radius: 170, label: 'Incident' },
  alert: { speedFactor: 0.82, radius: 110, label: 'Traffic alert' },
};

function severityOf(cat, type, fullClosure) {
  const c = String(cat || '').toLowerCase();
  if (fullClosure === 'True' || c.includes('closure')) return 'closure';
  if (c.includes('emergency')) return 'emergency';
  if (c.includes('lane')) return 'lane';
  if (type === 'accidentsAndIncidents' || c.includes('disabled') || c.includes('incident')) return 'incident';
  if (c.includes('construction') || c.includes('roadwork') || c.includes('maintenance')) return 'roadwork';
  return 'alert';
}

const CELL = 0.0025; // ~215 m grid — must match router's incident cell size
let cache = null;

export async function loadTraffic(bbox, force = false) {
  if (cache && !force && Date.now() - cache.at < 5 * 60 * 1000) return cache;
  try {
    const [w, s, e, n] = bbox;
    const url =
      `${UDOT_EVENTS_URL}?where=1%3D1&outFields=EventCategory,EventType,IsFullClosure,Description,RoadwayName,PlannedEndDate&` +
      `resultRecordCount=2000&geometryType=esriGeometryEnvelope&geometry=${w}%2C${s}%2C${e}%2C${n}&inSR=4326&` +
      `spatialRel=esriSpatialRelIntersects&returnGeometry=true&f=json`;
    // ArcGIS intermittently 504s/times out on the spatial query; retry with
    // backoff. Successful runs take 5-10 s, so allow 20 s per attempt.
    let res;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    if (!res.ok) throw new Error(`traffic fetch ${res.status}`);
    const j = await res.json();
    const now = Date.now() / 1000;
    const events = [];
    for (const f of j.features || []) {
      const a = f.attributes || {};
      if (!f.geometry) continue;
      // Drop events already ended (PlannedEndDate missing = treat as live).
      if (a.PlannedEndDate && a.PlannedEndDate < now) continue;
      const sev = severityOf(a.EventCategory, a.EventType, a.IsFullClosure);
      const params = INCIDENT_SEVERITY[sev];
      events.push({
        lon: f.geometry.x,
        lat: f.geometry.y,
        severity: sev,
        speedFactor: params.speedFactor,
        radius: params.radius,
        label: params.label,
        category: a.EventCategory || '',
        road: a.RoadwayName || '',
        desc: (a.Description || '').slice(0, 300),
      });
    }
    cache = { ok: true, events, grid: buildGrid(events), at: Date.now() };
    // Merge per-state DOT feeds (ID/AZ/NV/CO verified) into the cache. A fetch
    // that finishes after the UDOT layer updates the cache in place — next
    // reader within the 5-min TTL gets the merged set.
    loadDotFeeds(bbox, events).then((extra) => {
      if (extra.length && cache && cache.at === Date.now()) {
        cache.events = cache.events.concat(extra);
        cache.grid = buildGrid(cache.events);
      }
    }).catch(() => {});
    return cache;
  } catch (e) {
    console.warn('traffic load failed', e.message);
    cache = { ok: false, events: [], grid: new Map(), at: Date.now() };
    return cache;
  }
}

// ---- Per-state DOT event feeds (queue item 12) ----
// State-DOT-agnostic incident layer: for every state the corridor touches that
// has a verified key-free feed, fetch + parse it in parallel and merge into the
// event set. States without a feed degrade silently to the national WZDx
// snapshot + community reports. Registry + parsers: src/data/dot-feeds.js.
import { DOT_FEEDS, statesForBbox } from './data/dot-feeds.js';

async function loadDotFeeds(bbox, existingEvents) {
  const states = statesForBbox(bbox);
  const jobs = [];
  for (const st of states) {
    for (const feed of DOT_FEEDS[st] || []) {
      // Skip a feed if the primary layer (e.g. UDOT) already covers this state.
      if (st === 'UT' && existingEvents.length) continue;
      jobs.push(
        (async () => {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 20000);
          const res = await fetch(feed.url, { signal: ctrl.signal });
          clearTimeout(t);
          if (!res.ok) throw new Error(`${feed.name} ${res.status}`);
          const j = await res.json();
          return feed.parse(j, bbox);
        })().catch((e) => {
          console.warn(`dot feed ${feed.name} failed:`, e.message);
          return [];
        })
      );
    }
  }
  const results = await Promise.all(jobs);
  return results.flat();
}

function buildGrid(events) {
  const grid = new Map();
  for (const ev of events) {
    const r = INCIDENT_SEVERITY[ev.severity].radius;
    const halo = Math.ceil(r / (CELL * 111320)) + 1;
    const gx = Math.floor(ev.lon / CELL);
    const gy = Math.floor(ev.lat / CELL);
    for (let dx = -halo; dx <= halo; dx++) {
      for (let dy = -halo; dy <= halo; dy++) {
        const k = (gx + dx) + ',' + (gy + dy);
        let arr = grid.get(k);
        if (!arr) grid.set(k, (arr = []));
        arr.push(ev);
      }
    }
  }
  return grid;
}

export function incidentsNear(grid, lon, lat) {
  if (!grid || !grid.size) return [];
  const k = Math.floor(lon / CELL) + ',' + Math.floor(lat / CELL);
  return grid.get(k) || [];
}

// ---- Nationwide work zones (iteration 17) ----
// UDOT events are Utah-only. Outside Utah, Ghostway loads a CI-refreshed
// snapshot of every active state WZDx feed (scripts/fetch-wzdx-national.mjs)
// and renders work zones on the map + avoids full closures in routing.
const WZDX_URL = 'data/wzdx-national.json.gz';
let wzdxCache = null;

export async function loadNationalWzdx(bbox, force = false) {
  if (wzdxCache && !force && Date.now() - wzdxCache.at < 30 * 60 * 1000) return wzdxCache;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const res = await fetch(WZDX_URL, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`wzdx fetch ${res.status}`);
    const buf = await res.arrayBuffer();
    // Hosts may serve .gz pre-inflated (Content-Encoding: gzip) — sniff magic.
    const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
    let raw;
    if (head[0] === 0x1f && head[1] === 0x8b) {
      const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
      raw = await new Response(stream).arrayBuffer();
    } else {
      raw = buf;
    }
    const data = JSON.parse(new TextDecoder().decode(raw));
    const [w, s, e, n] = bbox;
    const zones = [];
    for (const key of Object.keys(data.states || {})) {
      for (const z of data.states[key]) {
        const coords = z.c || [];
        if (coords.length < 2) continue;
        const touches = coords.some((c) => c[0] >= w && c[0] <= e && c[1] >= s && c[1] <= n);
        if (!touches) continue;
        zones.push({ coords, factor: z.f || 0.85, road: z.r || '' });
      }
    }
    wzdxCache = { ok: true, zones, asOf: data.asOf, at: Date.now() };
    return wzdxCache;
  } catch (err) {
    console.warn('national wzdx load failed', err.message);
    wzdxCache = { ok: false, zones: [], asOf: null, at: Date.now() };
    return wzdxCache;
  }
}

// Full-closure points from the national snapshot inside a bbox — fed to the
// Valhalla tier as exclude_locations so routing avoids closed roads nationwide.
export function closurePointsNear(zones, bbox, cap = 25) {
  const [w, s, e, n] = bbox;
  const pts = [];
  for (const z of zones || []) {
    if (z.factor > 0.25) continue; // only hard closures
    const mid = z.coords[Math.floor(z.coords.length / 2)];
    if (mid[0] >= w && mid[0] <= e && mid[1] >= s && mid[1] <= n) {
      pts.push(mid);
      if (pts.length >= cap) return pts;
    }
  }
  return pts;
}
