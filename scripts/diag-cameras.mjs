// Deep probe: where is the camera, and does a 0-camera route exist at all?
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const gz = readFileSync(new URL('../public/graph/wasatch-graph.bin.gz', import.meta.url));
const raw = gunzipSync(gz);
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) });

const router = await import(new URL('../src/router.js', import.meta.url).href);

const PG = [-111.7448, 40.3642];
const COSTCO = [-111.8506, 40.3886];

// Access internals via a full plan, then inspect the chosen route's camera edges.
const { options, graph } = await router.planRoutes(PG, COSTCO, {});
const g = graph;

// Reconstruct fastest route edges and find camera edges + their names/coords.
// planRoutes doesn't expose raw edges, so re-run nearestNode + inspect eCam along coords.
const fast = options.find(o => o.mode === 'off');
console.log('Fastest:', (fast.distance/1000).toFixed(1), 'km', Math.round(fast.duration/60), 'min', fast.cameras, 'cam');
console.log('cameraPoints:', JSON.stringify(fast.cameraPoints));

// Now: is there ANY 0-camera path? Run strict with a very generous budget.
// We can't call astar directly (not exported), but planRoutes strict with softCam
// already tried. Let's check the clearest option's camera location.
const clear = options.find(o => o.mode === 'strict');
if (clear) {
  console.log('\nClearest:', (clear.distance/1000).toFixed(1), 'km', Math.round(clear.duration/60), 'min', clear.cameras, 'cam', clear.overBudget?'OVER-BUDGET':'in-budget', clear.strictFallback?'softCam':'hard');
  console.log('clearest cameraPoints:', JSON.stringify(clear.cameraPoints));
}

// Check the no_highways option camera location
const nh = options.find(o => o.mode === 'no_highways');
if (nh) console.log('\nNo-highways cams:', JSON.stringify(nh.cameraPoints));

// Where are ALL cameras in the corridor bbox?
const [w,s,e,n] = [-111.87, 40.34, -111.72, 40.41];
let camEdges = 0, camInCorridor = [];
for (let ed = 0; ed < g.edgeCount; ed++) {
  if (g.eCam[ed] > 40) {
    camEdges++;
    const a = g.ea[ed];
    const lon = g.nodeLon[a]/1e6, lat = g.nodeLat[a]/1e6;
    if (lon>=w && lon<=e && lat>=s && lat<=n) {
      camInCorridor.push({ lon:+lon.toFixed(5), lat:+lat.toFixed(5), cam:g.eCam[ed], name:g.names ? g.names[g.eName[ed]] : '?' });
    }
  }
}
console.log('\nTotal high-exposure edges in graph:', camEdges);
console.log('Cameras in PG-Costco corridor:', camInCorridor.length);
camInCorridor.slice(0,20).forEach(c => console.log('  ', c.lon, c.lat, 'exp', c.cam, c.name));
