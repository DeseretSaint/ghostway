// Refreshes the camera snapshots (run monthly by CI, or locally):
//   1) public/cameras/cameras.geojson — small SHIPPED fallback: Wasatch Front
//      only (the own-graph coverage region). Used when Overpass is down.
//   2) engine/data/cameras-usa.geojson — full national MERGED snapshot for
//      graph builds (engine/build-graph.mjs). NOT shipped.
//
// Sources (both public research data, source-tagged per feature):
//   A. DeFlock (data.dontgetflocked.com) — community-mapped cameras (OSM +
//      volunteers), ODbL/CC-BY. The trusted base layer.
//   B. flocksurveillance.org/data/cameras.tsv — Joshua Michael's published
//      Flock-device research dataset (335k devices incl. status, facing
//      rotation, install dates). PROVENANCE NOTE: this dataset originates
//      from independent vulnerability research on Flock systems and is
//      published as research (fair-use framing on the source site). It is
//      used here at BUILD TIME as enrichment only: we ingest only in-service,
//      active, plate-reading ROAD devices, every added point carries
//      source:"flocksurveillance.org", and the whole enrichment can be
//      removed by dropping source B below.
//
// Merge policy:
//   - Base = DeFlock. A Flock-research point within DEDUPE_M of a DeFlock
//     point is the SAME camera: it only FILLS missing metadata (facing
//     direction) and records the match — it never duplicates the point.
//   - Flock-research points with no DeFlock neighbor are ADDED (the gap fill):
//     in-service + active + plate-reading only. Indoor cameras (schools,
//     jails, restrooms — "wing" NVRs etc.), planned and decommissioned
//     devices are excluded (they would poison routing with false exposure).
//   - DeFlock points are never deleted by this merge.
//
// Run with: node scripts/fetch-cameras.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import { isAlprCamera } from '../src/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_OUT = join(__dirname, '..', 'public', 'cameras');
const ENGINE_OUT = join(__dirname, '..', 'engine', 'data');
const URL = 'https://data.dontgetflocked.com/cameras.geojson.gz';
const FLOCK_URL = 'https://flocksurveillance.org/data/cameras.tsv';

// Coverage region = the shipped road graph bbox (see engine/build-graph.mjs).
const BBOX = { w: -114.0, s: 37.0, e: -109.0, n: 42.0 };

// Same-camera radius (meters) for DeFlock ↔ Flock-research matching. 30 m is
// the scale the graph builder uses for exposure and comfortably covers
// OSM-node vs device-coordinate jitter for one physical pole.
const DEDUPE_M = 30;

const UA = 'ghostway-ci/1.0 (+https://github.com/DeseretSaint/ghostway) Mozilla/5.0';

async function fetchBuf(url, timeoutMs = 300000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // Upstream (Cloudflare) 403s bare Node fetch — send a UA + accept headers.
    // Retry with backoff: transient edge blocks happen on CI runner egress IPs.
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: {
            'User-Agent': UA,
            'Accept': 'application/geo+json, application/json, text/tab-separated-values, */*',
            'Accept-Encoding': 'gzip, identity',
          },
        });
        if (res.ok) return Buffer.from(await res.arrayBuffer());
        console.warn(`attempt ${attempt}: HTTP ${res.status}`);
      } catch (e) {
        console.warn(`attempt ${attempt}: ${e.message}`);
      }
      if (attempt < 4) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
    throw new Error('fetch failed ' + url);
  } finally {
    clearTimeout(t);
  }
}

// ---- Flock-research TSV → devices (ALL kept for the map; road filter flagged) ----
// The map shows EVERY device (the single cohesive surveillance view), but only
// ROAD-RELEVANT plate readers may influence routing — indoor wings (schools,
// jails, restrooms), drones, gateways etc. sit at facility centroids and would
// poison avoidance with false exposure. Each row keeps a roadRelevant flag;
// the graph builder skips roadRelevant === false.
//
// STATUS IS NOT EVIDENCE (Keaton field report 2026-09-30): the scraped
// dataset said "inPlanning" for F#006 State St @ E Main St WB — a plate
// reader he has personally verified reads plates — and "Clearest" drove
// straight through it. 83k rows say "inPlanning", 38k "decommissioned": the
// field is junk in both directions. Routing now keys on DEVICE CLASS +
// placement only; a device the dataset places on a road is avoided whatever
// the status column claims. "Clear means clear."
const NON_ROAD_TYPE = /^(factoryFixture|backhaulBox|talkDown|wingGateway|multiEvidenceDevice|drone|droneControllerBox|droneRadar|droneDockingStation|external)$/i;
const INDOOR_NAME = /\b(shower|restroom|bathroom|toilet|jail|detention|holding|cell|sally ?port|lobby|hallway|corridor|gym|cafeteria|classroom|interior|indoor|warehouse|kitchen|dorm|ward|clinic|office|server|evidence|locker|laundry|visitation|intake)\b/i;
function parseFlockTsv(text) {
  const lines = text.split('\n');
  const out = [];
  let total = 0, bad = 0, road = 0;
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split('\t');
    if (c.length < 8) continue;
    total++;
    const lat = Number(c[0]), lon = Number(c[1]);
    const type = c[2], status = c[3], active = c[4], name = c[5], features = c[6] || '';
    const rot = c[7] === '' ? null : Number(c[7]);
    const created = c[13] || '';
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { bad++; continue; }
    const roadRelevant = !NON_ROAD_TYPE.test(type) && !INDOOR_NAME.test(name || '');
    if (roadRelevant) road++;
    out.push({
      lon, lat, type, status, active, name,
      rot: Number.isFinite(rot) ? rot : null,
      created,
      roadRelevant,
    });
  }
  console.log(`flock research: ${total} rows → ${out.length} kept (${road} road-relevant plate readers, ${bad} invalid coords)`);
  return out;
}

function gridKey(lon, lat, cell) {
  return Math.floor(lon / cell) + ',' + Math.floor(lat / cell);
}

async function main() {
  await mkdir(PUBLIC_OUT, { recursive: true });
  console.log('Fetching', URL);
  const buf = await fetchBuf(URL);
  // Upstream serves plain GeoJSON despite the .gz name; handle both.
  let text;
  try {
    text = gunzipSync(buf).toString('utf8');
  } catch {
    text = buf.toString('utf8');
  }
  const full = JSON.parse(text);
  console.log(`deflock: ${full.features.length} cameras`);

  // ---- Merge stage: Flock-research enrichment ----
  console.log('Fetching', FLOCK_URL);
  const flockText = (await fetchBuf(FLOCK_URL)).toString('utf8');
  const flock = parseFlockTsv(flockText);

  // Spatial grid over DeFlock points (33 m cells; 3×3 halo = full dedupe radius).
  const CELL = 0.0003;
  const grid = new Map();
  full.features.forEach((f, idx) => {
    const [lon, lat] = f.geometry.coordinates;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = gridKey(lon + dx * CELL, lat + dy * CELL, CELL);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(idx);
      }
    }
  });
  const nearDeflock = (lon, lat) => {
    const cands = grid.get(gridKey(lon, lat, CELL)) || [];
    let best = null, bestD2 = Infinity;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    for (const idx of cands) {
      const [dlon, dlat] = full.features[idx].geometry.coordinates;
      const dx = (dlon - lon) * 111320 * cosLat;
      const dy = (dlat - lat) * 111320;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = idx; }
    }
    return bestD2 <= DEDUPE_M * DEDUPE_M ? best : null;
  };

  let matched = 0, added = 0, dirFilled = 0;
  const addedFeatures = [];
  const matchedRows = new Set();
  for (const c of flock) {
    if (!c.roadRelevant) continue; // indoor/etc: map-only (flock-devices.json.gz)
    const hit = nearDeflock(c.lon, c.lat);
    if (hit !== null) {
      matched++;
      matchedRows.add(c);
      const f = full.features[hit];
      f.properties = f.properties || {};
      // Fill missing facing metadata (DeFlock direction is sparse).
      if ((f.properties.direction === null || f.properties.direction === undefined) && c.rot !== null) {
        f.properties.direction = c.rot;
        dirFilled++;
      }
      f.properties.flockType = c.type;
      continue;
    }
    // GAP FILL: no DeFlock neighbor — add as a tagged Flock-research point.
    // Engine props stay lean (name/status detail lives in the corpus file).
    addedFeatures.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
      properties: {
        brand: 'Flock Safety',
        operator: '',
        surveillanceZone: 'traffic', // plate reader facing a road (isAlprCamera)
        direction: c.rot,
        source: 'flocksurveillance.org',
        roadRelevant: true,
        flockType: c.type,
      },
    });
    added++;
  }
  console.log(`merge: ${matched} matched DeFlock (direction filled on ${dirFilled}) · ${added} added (road gap fill)`);

  const mergedFeatures = full.features.concat(addedFeatures);
  const merged = {
    type: 'FeatureCollection',
    _meta: {
      sources: [URL, FLOCK_URL],
      asOf: new Date().toISOString(),
      deflock: full.features.length,
      flockResearchAdded: added,
      flockResearchMatched: matched,
      directionFilled: dirFilled,
    },
    features: mergedFeatures,
  };

  // 1) Full national MERGED snapshot for graph builds (local only, gitignored).
  await mkdir(ENGINE_OUT, { recursive: true });
  const mergedText = JSON.stringify(merged);
  await writeFile(join(ENGINE_OUT, 'cameras-usa.geojson'), mergedText);
  console.log(`wrote engine/data/cameras-usa.geojson (${(mergedText.length / 1e6).toFixed(1)} MB)`);

  // 2) Shipped fallback: Wasatch box only, trimmed properties.
  const inBox = mergedFeatures.filter((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return lon >= BBOX.w && lon <= BBOX.e && lat >= BBOX.s && lat <= BBOX.n;
  });
  const trimmed = {
    type: 'FeatureCollection',
    _meta: {
      sources: merged._meta.sources,
      asOf: merged._meta.asOf,
      region: 'wasatch-front',
      count: inBox.length,
    },
    features: inBox.map((f) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: {
        brand: f.properties.brand || '',
        operator: f.properties.operator || '',
        surveillanceZone: f.properties.surveillanceZone || '',
        osmId: f.properties.osmId,
        direction: f.properties.direction ?? null, // degrees, 0=N, 90=E — for directional awareness
        source: f.properties.source || 'deflock',
      },
    })),
  };
  const out = JSON.stringify(trimmed);
  await writeFile(join(PUBLIC_OUT, 'cameras.geojson'), out);
  console.log(`wrote public/cameras/cameras.geojson — ${trimmed.features.length} cameras, ${(out.length / 1024).toFixed(0)} KB`);
  if (trimmed.features.length < 100) {
    throw new Error('sanity check failed: unexpectedly few cameras in the Wasatch box');
  }

  // 3) ALL Flock devices (every type, every status) for the map's cohesive
  //    surveillance view — compact arrays, gzipped. Map-only: never used for
  //    routing. [lon, lat, type, status, active, rotation|null, name, roadFlag]
  const devices = flock.map((c) => [
    Number(c.lon.toFixed(5)), Number(c.lat.toFixed(5)),
    c.type, c.status, c.active === '1' ? 1 : 0,
    c.rot, (c.name || '').slice(0, 72), c.roadRelevant ? 1 : 0,
  ]);
  const flockAll = {
    v: 1,
    asOf: merged._meta.asOf,
    source: FLOCK_URL,
    count: devices.length,
    devices,
  };
  const flockGz = gzipSync(Buffer.from(JSON.stringify(flockAll)), { level: 9 });
  await writeFile(join(PUBLIC_OUT, 'flock-devices.json.gz'), flockGz);
  console.log(`wrote public/cameras/flock-devices.json.gz — ${devices.length} devices, ${(flockGz.length / 1e6).toFixed(1)} MB gz`);

  // 4) THE LOCAL CORPUS — the app's complete camera database. Every DeFlock
  //    point + every Flock research device, one gzipped file the app downloads
  //    once and then counts/displays from LOCAL data. No fetch can fail at the
  //    moment of truth: the badge can never be blinder than the map. (Keaton
  //    field report 2026-09-27, third report: "still lying — unavailable while
  //    showing me routed past a camera it documents".)
  //    rows: [lon5, lat5, cls 'alpr'|'surv'|'device', road 0/1, name48]
  const rows = [];
  for (const f of mergedFeatures) {
    const [lon, lat] = f.geometry.coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    const p = f.properties || {};
    rows.push([
      Number(lon.toFixed(5)), Number(lat.toFixed(5)),
      isAlprCamera(p) ? 'alpr' : 'surv', 1,
      String(p.name || p.brand || '').slice(0, 48),
    ]);
  }
  // Non-road research devices (matched + road-unmatched rows are already in
  // mergedFeatures above — no double counting).
  for (const c of flock) {
    if (matchedRows.has(c) || c.roadRelevant) continue;
    rows.push([
      Number(c.lon.toFixed(5)), Number(c.lat.toFixed(5)),
      'device', 0,
      (c.name || '').slice(0, 48),
    ]);
  }
  const corpus = { v: 1, asOf: merged._meta.asOf, sources: merged._meta.sources, count: rows.length, rows };
  const corpusGz = gzipSync(Buffer.from(JSON.stringify(corpus)), { level: 9 });
  await writeFile(join(PUBLIC_OUT, 'all-cameras.json.gz'), corpusGz);
  console.log(`wrote public/cameras/all-cameras.json.gz — ${rows.length} rows, ${(corpusGz.length / 1e6).toFixed(1)} MB gz`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
