import { CONFIG } from './config.js';
import { pointToSegmentM } from './utils.js';

// OpenStreetMap Overpass + DeFlock fallback for finding cameras along a route.
// The live map uses DeFlock vector tiles; this module is the routing backend's
// view of cameras (it needs raw coordinates, not tiles).
//
// Strategy: fetch a camera pool for a bbox once (cached), then the router
// iterates — re-routing around the cameras that are still on the path until it
// converges. This avoids hammering Overpass on every iteration.

// Cameras from an in-memory list within `corridorM` of a route polyline.
// Exported so the Valhalla fallback engine can share the exact same detection
// logic as the own-graph router.
export function nearRouteFromList(line, feats, corridorM = CONFIG.avoidance.routeCorridorM) {
  if (!line || line.length < 2) return [];
  return feats.filter((f) => {
    const c = f.geometry.coordinates;
    for (let i = 0; i < line.length - 1; i++) {
      if (pointToSegmentM(c, line[i], line[i + 1]) <= corridorM) return true;
    }
    return false;
  });
}

export class CameraStore {
  constructor() {
    this._cache = new Map(); // bbox key -> features (overpass or fallback)
    this._geojson = null; // bundled fallback
    this._poolCache = new Map(); // bbox key -> features (deduped pool)
  }

  async loadFallback() {
    try {
      const r = await fetch(CONFIG.cameraGeojson);
      if (r.ok) this._geojson = await r.json();
    } catch (_) {
      /* offline / missing — routing still works without avoidance */
    }
    return this._geojson;
  }

  async _overpass(bbox) {
    const key = bbox.join(',');
    if (this._cache.has(key)) return this._cache.get(key);
    const [w, s, e, n] = bbox;
    const q = `[out:json][timeout:25];(
      node["man_made"="surveillance"]({s},{w},{n},{e});
      node["surveillance:type"="ALPR"]({s},{w},{n},{e});
      node["deflock"]({s},{w},{n},{e});
    );out center 300;`.replace(/\{(\w)\}/g, (_, k) => ({ w, s, e, n }[k]));
    try {
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
      });
      if (!res.ok) throw new Error('overpass ' + res.status);
      const j = await res.json();
      const feats = j.elements
        .filter((el) => el.lat != null && el.lon != null)
        .map((el) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
          properties: {
            brand: el.tags.manufacturer || el.tags.brand || el.tags.operator || 'Unknown',
            operator: el.tags.operator || '',
            kind: el.tags['surveillance:type'] || el.tags.surveillance || 'camera',
            osmId: el.id,
          },
        }));
      this._cache.set(key, feats);
      return feats;
    } catch (err) {
      if (this._geojson) return this._inBox(this._geojson.features, bbox);
      return [];
    }
  }

  _inBox(feats, [w, s, e, n]) {
    return feats.filter((f) => {
      const [lon, lat] = f.geometry.coordinates;
      return lon >= w && lon <= e && lat >= s && lat <= n;
    });
  }

  // Returns the (cached) camera pool for a bbox, used by the iterative router.
  async getCameras(bbox) {
    const key = bbox.join(',');
    if (this._poolCache.has(key)) return this._poolCache.get(key);
    const feats = await this._overpass(bbox);
    this._poolCache.set(key, feats);
    return feats;
  }

  // Cameras from an in-memory list within `corridorM` of a route polyline.
  // Delegates to the shared free function above.
  nearRouteFromList(line, feats, corridorM = CONFIG.avoidance.routeCorridorM) {
    return nearRouteFromList(line, feats, corridorM);
  }

  // Convenience used before the iterative router existed; kept for fallback.
  async camerasNearRoute(line, corridorM = CONFIG.avoidance.routeCorridorM) {
    if (!line || line.length < 2) return [];
    let w = 180, s = 90, e = -180, n = -90;
    for (const [lon, lat] of line) {
      w = Math.min(w, lon); s = Math.min(s, lat);
      e = Math.max(e, lon); n = Math.max(n, lat);
    }
    const buf = corridorM / 111320;
    const feats = await this._overpass([w - buf, s - buf, e + buf, n + buf]);
    return this.nearRouteFromList(line, feats, corridorM);
  }
}
