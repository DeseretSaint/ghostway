import { PbfReader } from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';
import { CONFIG } from './config.js';

// The map draws cameras from DeFlock's live vector tiles. The badge must count
// the EXACT same source — "the map itself admits the camera is there" (Keaton
// field report 2026-09-26/27). Overpass (OSM) is a narrower, flakier mirror of
// the same data; the bundled snapshot is narrower still. This module reads the
// tiles directly so the counter can never be blinder than the map.
//
// Fail-soft: any tile error yields nothing for that tile — the caller unions
// the remaining sources. Tiles are small (a few KB each) and the service
// worker already caches them (stale-while-revalidate).

const Z = 14; // DeFlock's detail zoom — same tiles the map overzooms from.
const tileCache = new Map(); // "z/x/y" -> features[]

function lonLatToTile(lon, lat, z) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

async function tileFeatures(z, x, y) {
  const key = `${z}/${x}/${y}`;
  if (tileCache.has(key)) return tileCache.get(key);
  let feats = [];
  try {
    const url = CONFIG.cameraTileUrl.replace('{z}', z).replace('{x}', x).replace('{y}', y);
    const res = await fetch(url, { cache: 'force-cache' });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const tile = new VectorTile(new PbfReader(new Uint8Array(buf)));
      for (const name of Object.keys(tile.layers)) {
        const layer = tile.layers[name];
        for (let i = 0; i < layer.length; i++) {
          const f = layer.feature(i);
          if (f.type !== 1) continue; // points only
          const g = f.toGeoJSON(x, y, z);
          const p = f.properties || {};
          g.properties = {
            brand: p.manufacturer || p.brand || p.operator || 'Unknown',
            operator: p.operator || '',
            kind: p['surveillance:type'] || p.surveillance || 'camera',
            source: 'deflock-tiles',
          };
          feats.push(g);
        }
      }
    }
  } catch {
    /* offline / tile gone — union with other sources */
  }
  tileCache.set(key, feats);
  return feats;
}

// All tile cameras within [w, s, e, n]. Capped to the tiles that cover the box
// (a corridor bbox at planning time is 1–4 tiles).
export async function tileCameras(bbox) {
  const [w, s, e, n] = bbox;
  const tl = lonLatToTile(w, n, Z);
  const br = lonLatToTile(e, s, Z);
  const jobs = [];
  for (let x = tl.x; x <= br.x; x++) {
    for (let y = tl.y; y <= br.y; y++) {
      jobs.push(tileFeatures(Z, x, y));
    }
  }
  const out = [];
  for (const feats of await Promise.all(jobs)) out.push(...feats);
  return out;
}