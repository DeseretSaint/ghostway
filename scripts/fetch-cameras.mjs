// Refreshes the camera snapshots (run monthly by CI, or locally):
//   1) public/cameras/cameras.geojson — small SHIPPED fallback: Wasatch Front
//      only (the own-graph coverage region). Used when Overpass is down.
//   2) engine/data/cameras-usa.geojson — full national DeFlock snapshot for
//      graph builds (engine/build-graph.mjs). NOT shipped.
//
// Run with: node scripts/fetch-cameras.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_OUT = join(__dirname, '..', 'public', 'cameras');
const ENGINE_OUT = join(__dirname, '..', 'engine', 'data');
const URL = 'https://data.dontgetflocked.com/cameras.geojson.gz';

// Coverage region = the shipped road graph bbox (see engine/build-graph.mjs).
const BBOX = { w: -112.12, s: 39.95, e: -111.33, n: 40.86 };

async function main() {
  await mkdir(PUBLIC_OUT, { recursive: true });
  console.log('Fetching', URL);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 300000);
  // Upstream (Cloudflare) 403s bare Node fetch — send a UA + accept headers.
  // Retry with backoff: transient edge blocks happen on CI runner egress IPs.
  let res;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      res = await fetch(URL, {
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'ghostway-ci/1.0 (+https://github.com/DeseretSaint/ghostway) Mozilla/5.0',
          'Accept': 'application/geo+json, application/json, */*',
          'Accept-Encoding': 'gzip, identity',
        },
      });
      if (res.ok) break;
      console.warn(`attempt ${attempt}: HTTP ${res.status}`);
    } catch (e) {
      console.warn(`attempt ${attempt}: ${e.message}`);
    }
    if (attempt < 4) await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  clearTimeout(t);
  if (!res || !res.ok) throw new Error('fetch failed ' + (res && res.status));
  const buf = Buffer.from(await res.arrayBuffer());
  // Upstream serves plain GeoJSON despite the .gz name; handle both.
  let text;
  try {
    text = gunzipSync(buf).toString('utf8');
  } catch {
    text = buf.toString('utf8');
  }
  const full = JSON.parse(text);
  console.log(`upstream: ${full.features.length} cameras`);

  // 1) Full national snapshot for graph builds (local only, gitignored).
  await mkdir(ENGINE_OUT, { recursive: true });
  await writeFile(join(ENGINE_OUT, 'cameras-usa.geojson'), text);
  console.log(`wrote engine/data/cameras-usa.geojson (${(text.length / 1e6).toFixed(1)} MB)`);

  // 2) Shipped fallback: Wasatch box only, trimmed properties.
  const inBox = full.features.filter((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return lon >= BBOX.w && lon <= BBOX.e && lat >= BBOX.s && lat <= BBOX.n;
  });
  const trimmed = {
    type: 'FeatureCollection',
    _meta: {
      source: URL,
      asOf: new Date().toISOString(),
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
      },
    })),
  };
  const out = JSON.stringify(trimmed);
  await writeFile(join(PUBLIC_OUT, 'cameras.geojson'), out);
  console.log(`wrote public/cameras/cameras.geojson — ${trimmed.features.length} cameras, ${(out.length / 1024).toFixed(0)} KB`);
  if (trimmed.features.length < 100) {
    throw new Error('sanity check failed: unexpectedly few cameras in the Wasatch box');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
