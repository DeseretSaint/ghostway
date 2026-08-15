import { CONFIG } from './config.js';
import { pointToSegmentM, haversine } from './utils.js';

// OpenStreetMap Overpass + DeFlock fallback for finding cameras along a route.
// The live map uses DeFlock vector tiles; this module is the routing backend's
// view of cameras (it needs raw coordinates, not tiles).
//
// Strategy (to stay within public-router limits):
//  1) Get a baseline route from BRouter (no avoidance).
//  2) Pull every camera within `routeCorridorM` of that baseline.
//  3) Re-route with those cameras as "nogos" (capped at maxNogos, nearest first).

export class CameraStore {
  constructor() {
    this._cache = new Map(); // bbox key -> features (overpass)
    this._geojson = null; // bundled fallback
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

  // Query Overpass for surveillance / ALPR nodes in a bounding box [w,s,e,n].
  async _overpass(bbox) {
    const key = bbox.join(',');
    if (this._cache.has(key)) return this._cache.get(key);
    const [w, s, e, n] = bbox;
    const q = `[out:json][timeout:25];(
      node["man_made"="surveillance"]({s},{w},{n},{e});
      node["surveillance:type"="ALPR"]({s},{w},{n},{e});
      node["deflock"]({s},{w},{n},{e});
    );out center 200;`.replace(/\{(\w)\}/g, (_, k) => ({ w, s, e, n }[k]));
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
      // Fall back to bundled geojson if present.
      if (this._geojson) return this._inBox(this._geojson.features, bbox);
      return [];
    }
  }

  _inBox(feats, [w, s, e, n]) {
    return feats.filter(
      (f) => {
        const [lon, lat] = f.geometry.coordinates;
        return lon >= w && lon <= e && lat >= s && lat <= n;
      }
    );
  }

  // Cameras near a route polyline (array of [lon,lat]).
  async camerasNearRoute(line, corridorM = CONFIG.avoidance.routeCorridorM) {
    if (!line || line.length < 2) return [];
    // bbox of line + corridor buffer in degrees (~corridorM/111320 for lat).
    let w = 180, s = 90, e = -180, n = -90;
    for (const [lon, lat] of line) {
      w = Math.min(w, lon); s = Math.min(s, lat);
      e = Math.max(e, lon); n = Math.max(n, lat);
    }
    const buf = corridorM / 111320;
    w -= buf; s -= buf; e += buf; n += buf;

    // Gather cameras from Overpass (or fallback) for the bbox.
    const feats = await this._overpass([w, s, e, n]);

    // Keep only those within `corridorM` of any segment.
    const near = feats.filter((f) => {
      const c = f.geometry.coordinates;
      for (let i = 0; i < line.length - 1; i++) {
        if (pointToSegmentM(c, line[i], line[i + 1]) <= corridorM) return true;
      }
      return false;
    });

    // Sort by distance to route, nearest first (so we keep the most relevant
    // when we must cap the count).
    near.sort((a, b) => routeDist(a.geometry.coordinates) - routeDist(b.geometry.coordinates));
    function routeDist(c) {
      let best = Infinity;
      for (let i = 0; i < line.length - 1; i++) {
        best = Math.min(best, pointToSegmentM(c, line[i], line[i + 1]));
      }
      return best;
    }
    return near.slice(0, CONFIG.avoidance.maxNogos);
  }
}
