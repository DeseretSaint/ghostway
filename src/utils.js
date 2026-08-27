// Small shared helpers.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Escape untrusted strings before interpolating into innerHTML. Street names,
// camera brand/operator/mount tags, Photon results, and OSM note ids are all
// externally editable (anyone can edit OSM; DeFlock ingests those tags), so
// every one of them is a potential HTML-injection vector.
export function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Distance units preference (Maps parity): 'mi' (default, imperial) or 'km'
// (metric). Persisted in localStorage. The whole app reads through
// fmtDistance/fmtNavDistance so flipping the pref re-skins every distance.
// Default is imperial (mph/mi) for US users (Keaton's preference).
export function getUnits() {
  try { const v = localStorage.getItem('gw-units'); return v === 'km' ? 'km' : 'mi'; } catch { return 'mi'; }
}
export function setUnits(u) {
  try { localStorage.setItem('gw-units', u === 'mi' ? 'mi' : 'km'); } catch {}
}

export function fmtDistance(m) {
  if (m == null) return '';
  if (getUnits() === 'mi') {
    const mi = m / 1609.344;
    if (mi < 0.1) return `${Math.max(0, Math.round((m * 3.28084) / 50) * 50)} ft`;
    if (mi < 10) return `${mi.toFixed(1)} mi`;
    return `${Math.round(mi)} mi`;
  }
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

// Navigation-style distance countdown (rounds like real nav apps):
// 1.2 mi → 0.5 mi → 800 ft  (or 1.2 km → 800 m in metric).
export function fmtNavDistance(m) {
  if (m == null) return '';
  if (getUnits() === 'km') {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }
  const ft = m * 3.28084;
  if (ft < 1000) return `${Math.max(0, Math.round(ft / 50) * 50)} ft`;
  const mi = ft / 5280;
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

export function fmtSpeed(mps, unit) {
  if (mps == null || !isFinite(mps)) return '';
  // Default follows the persisted distance-units pref (round-75 toggle):
  // km → km/h, mi → mph. Explicit unit arg still wins for callers that pin.
  const u = unit || (getUnits() === 'mi' ? 'mph' : 'kmh');
  if (u === 'mph') return `${Math.round(mps * 2.23694)} mph`;
  return `${Math.round(mps * 3.6)} km/h`;
}

// Light haptic tap where supported (Android Chrome). iOS ignores.
export function haptic() {
  try {
    navigator.vibrate && navigator.vibrate(10);
  } catch {}
}

export function fmtDuration(sec) {
  if (sec == null) return '';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

// Maps-parity arrival clock: "now + drive time" as a short local time
// (e.g. "2:45 PM"). Avoids timezone surprises by using the locale clock.
export function fmtArrive(sec) {
  if (sec == null) return '';
  const d = new Date(Date.now() + sec * 1000);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Point-to-line-segment distance (meters). Used to find cameras near a route.
export function pointToSegmentM(p, a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (d) => (d * 180) / Math.PI;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const lon1 = toRad(a[0]);
  const lon2 = toRad(b[0]);
  const latp = toRad(p[1]);
  const lonp = toRad(p[0]);

  // Local equirectangular projection around the route midpoint.
  const latm = toRad((a[1] + b[1]) / 2);
  const x = (lon) => (lon - lon1) * Math.cos(latm) * R;
  const y = (lat) => (lat - lat1) * R;
  const ax = x(lon2), ay = y(lat2);
  const px = x(lonp), py = y(latp);
  const dx = ax, dy = ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - 0) * dx + (py - 0) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = t * dx, cy = t * dy;
  return Math.hypot(px - cx, py - cy);
}

export async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`);
  return res.json();
}

// GeoJSON point helper for the camera source.
export function camFeature(coords, props) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: coords },
    properties: props || {},
  };
}

// OSMDroid/Overpass-free: a local cache of the bundled GeoJSON camera set,
// used as a fallback when vector tiles are unavailable, and for routing detours.
let _camCache = null;
export async function loadCameraGeoJSON(url) {
  if (_camCache) return _camCache;
  const r = await fetch(url);
  if (!r.ok) throw new Error('camera geojson missing');
  _camCache = await r.json();
  return _camCache;
}
