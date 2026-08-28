// Per-state DOT live-event feeds (queue item 12 — state-DOT-agnostic traffic).
// Every feed below was fetched + verified live on 2026-08-28 (key-free,
// CORS-open where required). Formats: WZDx 4.x GeoJSON (id/az/nv) and the
// CARS 511 platform's TG event-reports JSON (co).
//
// Fallback rule: states WITHOUT a verified feed (WY, NM) degrade silently to
// the national WZDx snapshot + community reports — no error surface.
//
// Event shape is Ghostway's traffic-event shape:
//   { lon, lat, severity, speedFactor, radius, label, category, road, desc }

export const STATE_BBOX = {
  UT: [-114.05, 36.99, -109.04, 42.01],
  ID: [-117.25, 41.98, -111.04, 49.00],
  WY: [-111.06, 40.99, -104.05, 45.01],
  CO: [-109.06, 36.99, -102.04, 41.01],
  NV: [-120.01, 35.00, -114.04, 42.00],
  AZ: [-114.82, 31.33, -108.98, 37.01],
  NM: [-109.05, 31.33, -103.00, 37.00],
  CA: [-124.48, 32.53, -114.13, 42.01],
};

// WZDx vehicle_impact → Ghostway severity mapping.
function wzdxSeverity(vehicleImpact) {
  switch (vehicleImpact) {
    case 'all-lanes-closed': return 'closure';
    case 'some-lanes-closed': return 'lane';
    case 'alternating-one-way': return 'lane';
    case 'reduced-width': return 'lane';
    case 'all-lanes-open': return 'roadwork';
    default: return 'roadwork';
  }
}

// Parse a WZDx 4.x FeatureCollection into traffic events, filtered to bbox.
export function parseWzdx(fc, bbox) {
  const [w, s, e, n] = bbox;
  const now = Date.now();
  const events = [];
  for (const f of fc.features || []) {
    const p = f.properties || {};
    // End-date filter (WZDx dates are ISO 8601).
    const end = p.end_date || (p.core_details && null);
    if (end && Date.parse(end) < now) continue;
    const coords = f.geometry && f.geometry.coordinates;
    if (!coords || !coords.length) continue;
    // MultiPoint/LineString → keep points inside the bbox (cap 1 per feature
    // to bound the event count on long corridors).
    const pts = (f.geometry.type === 'MultiPoint' || f.geometry.type === 'LineString')
      ? coords.filter((c) => c[0] >= w && c[0] <= e && c[1] >= s && c[1] <= n).slice(0, 1)
      : coords[0] ? [coords] : [];
    const sev = wzdxSeverity(p.vehicle_impact);
    const params = { closure: ['closure', 0.15, 220], lane: ['lane', 0.5, 150], roadwork: ['roadwork', 0.62, 130] }[sev];
    const cd = p.core_details || {};
    for (const c of pts) {
      events.push({
        lon: c[0], lat: c[1],
        severity: sev, speedFactor: params[1], radius: params[2],
        label: params[0] === 'closure' ? 'Road closure' : params[0] === 'lane' ? 'Lane closure' : 'Construction',
        category: p.work_zone_type || 'work-zone',
        road: (cd.road_names || []).join(', '),
        desc: String(cd.description || '').slice(0, 300),
      });
    }
  }
  return events;
}

// CARS 511 TG event-reports (cotg gateway). Shape: array of reports with
// beginTime/updateTime {time}, eventDescription, location {latitude,longitude,roadName}.
export function parseCarsReports(reports, bbox) {
  const [w, s, e, n] = bbox;
  const now = Date.now();
  const events = [];
  for (const r of reports || []) {
    const loc = r.location || {};
    const lat = loc.latitude, lon = loc.longitude;
    if (lat == null || lon == null) continue;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    const upd = (r.updateTime && r.updateTime.time) || 0;
    if (upd && new Date(upd).getTime() + 7 * 86400000 < now) continue;
    const ed = r.eventDescription || {};
    const headline = String(ed.descriptionHeader || '').toLowerCase();
    const full = String(ed.descriptionFull || '');
    let sev = 'incident', label = 'Incident';
    if (headline.includes('closure') || /closed/i.test(full.slice(0, 120))) { sev = 'closure'; label = 'Road closure'; }
    else if (headline.includes('construction') || headline.includes('roadwork')) { sev = 'roadwork'; label = 'Construction'; }
    else if (headline.includes('lane')) { sev = 'lane'; label = 'Lane closure'; }
    const params = { closure: [0.15, 220], lane: [0.5, 150], roadwork: [0.62, 130], incident: [0.45, 170] }[sev];
    events.push({
      lon, lat, severity: sev, speedFactor: params[0], radius: params[1],
      label, category: r.icon || sev,
      road: loc.roadName || '',
      desc: full.slice(0, 300),
    });
  }
  return events;
}

// Registry: state → array of { name, url, parse } fetch jobs. All verified
// 2026-08-28. WY/NM: no verified key-free feed — absent on purpose.
export const DOT_FEEDS = {
  ID: [
    { name: 'Idaho 511 WZDx', url: 'https://511.idaho.gov/api/wzdx', parse: parseWzdx },
  ],
  AZ: [
    { name: 'AZ511 WZDx', url: 'https://az511.gov/api/wzdx', parse: parseWzdx },
  ],
  NV: [
    { name: 'NV Roads WZDx', url: 'https://www.nvroads.com/api/wzdx', parse: parseWzdx },
  ],
  CO: [
    { name: 'CDOT TG event reports', url: 'https://cotg.carsprogram.org/tgevents/api/eventReports', parse: parseCarsReports },
  ],
  UT: [], // UT has its own primary path (UDOT ArcGIS, loadTraffic) — kept there.
  WY: [], // No verified key-free feed; WZDx national snapshot covers work zones.
  NM: [], // No verified key-free feed.
  CA: [], // Caltrans has no key-free incident feed; WZDx national covers work zones.
};

// Which states does a bbox/route touch? Simple point-in-bbox per state.
export function statesForBbox(bbox) {
  const [w, s, e, n] = bbox;
  const out = [];
  for (const [st, [bw, bs, be, bn]] of Object.entries(STATE_BBOX)) {
    if (w <= be && e >= bw && s <= bn && n >= bs) out.push(st);
  }
  return out;
}
