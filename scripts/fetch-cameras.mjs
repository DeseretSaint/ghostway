// Downloads DeFlock's full ALPR camera dataset and writes it to public/cameras/.
// Run with: npm run fetch-cameras
// This is OPTIONAL — the live map uses DeFlock's vector tiles. The bundled
// GeoJSON is a fallback for offline use and for routing when tiles are blocked.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'cameras');
const URL = 'https://data.dontgetflocked.com/cameras.geojson.gz';

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Fetching', URL);
  const res = await fetch(URL);
  if (!res.ok) throw new Error('fetch failed ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  // The upstream file is actually plain GeoJSON (despite the .gz name).
  let text;
  try {
    text = await gunzip(buf);
  } catch {
    text = buf.toString('utf8');
  }
  await writeFile(join(OUT, 'cameras.geojson'), text);
  const n = (text.match(/"type":"Feature"/g) || []).length;
  console.log(`Wrote ${n} cameras to public/cameras/cameras.geojson`);
}

// Minimal gunzip using Node's zlib.
import { gunzipSync } from 'node:zlib';
function gunzip(buf) {
  return gunzipSync(buf).toString('utf8');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
