// Ghostway's own routing engine.
// Loads the prebuilt road graph (engine/build-graph.mjs) and runs A* with a
// per-edge cost function that bakes camera exposure into the price of every
// road segment — no third-party re-route hacks.
//
// Cost modes (the avoidance toggle):
//   strict   — cameras are near-forbidden; accepts long detours.
//   moderate — cameras are expensive; detour is capped vs the fastest route.
//   off      — fastest route; cameras shown on the map only.
//
// planRoutes() always returns up to 3 options (Clearest / Balanced / Fastest)
// with per-option ETA and camera count so the user picks BEFORE driving.

const GRAPH_URL = 'graph/wasatch-graph.bin.gz';

let graph = null;
let loadPromise = null;

export function graphStatus() {
  return graph ? 'ready' : loadPromise ? 'loading' : 'idle';
}

export async function loadGraph(onProgress) {
  if (graph) return graph;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const res = await fetch(GRAPH_URL);
    if (!res.ok) throw new Error(`graph fetch ${res.status}`);
    const buf = await res.arrayBuffer();
    // Some hosts (GitHub Pages, vite preview) serve .gz with Content-Encoding:
    // gzip, so the browser already inflated the response. Sniff the magic to
    // tell whether we still hold gzip bytes (1f 8b) or the raw graph (GWR1).
    const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
    let raw;
    if (head[0] === 0x1f && head[1] === 0x8b) {
      const ds = new DecompressionStream('gzip');
      const stream = new Blob([buf]).stream().pipeThrough(ds);
      raw = await new Response(stream).arrayBuffer();
    } else {
      raw = buf;
    }
    onProgress && onProgress('parse');
    graph = parseGraph(raw);
    return graph;
  })();
  loadPromise.catch(() => (loadPromise = null));
  return loadPromise;
}

function parseGraph(raw) {
  const dv = new DataView(raw);
  let o = 0;
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== 'GWR1') throw new Error('bad graph magic');
  o = 4;
  const nodeCount = dv.getUint32(o, true); o += 4;
  const edgeCount = dv.getUint32(o, true); o += 4;
  const bbox = [dv.getFloat64(o, true), dv.getFloat64(o + 8, true), dv.getFloat64(o + 16, true), dv.getFloat64(o + 24, true)];
  o += 32;

  const nodesSize = nodeCount * 8;
  const nodeBuf = raw.slice(o, o + nodesSize);
  const nodeLon = new Int32Array(nodeBuf, 0, nodeCount);
  const nodeLat = new Int32Array(nodeBuf, nodeCount * 4, nodeCount);
  o += nodesSize;

  const E = edgeCount;
  const namePad = E % 2; // keep the u16 name array aligned
  const edgeBytes = E * 15 + namePad;
  const eb = raw.slice(o, o + edgeBytes);
  // struct-of-arrays within the edge block: a(4E) b(4E) len(2E) spd(E) cam(E) ow(E) [pad] name(2E)
  const ea = new Uint32Array(eb, 0, E);
  const eB = new Uint32Array(eb, E * 4, E);
  const eLen = new Uint16Array(eb, E * 8, E);
  const eSpd = new Uint8Array(eb, E * 10, E);
  const eCam = new Uint8Array(eb, E * 11, E);
  const eOw = new Uint8Array(eb, E * 12, E);
  const eName = new Uint16Array(eb, E * 13 + namePad, E);
  o += edgeBytes;

  // Names dictionary.
  const td = new TextDecoder();
  const nameCount = dv.getUint16(o, true); o += 2;
  const names = new Array(nameCount);
  const bytes = new Uint8Array(raw);
  for (let i = 0; i < nameCount; i++) {
    const len = dv.getUint16(o, true); o += 2;
    names[i] = td.decode(bytes.subarray(o, o + len));
    o += len;
  }

  // Adjacency (forward-star). Each edge yields 1-2 directed arcs.
  let arcCount = 0;
  for (let i = 0; i < E; i++) arcCount += eOw[i] === 0 ? 2 : 1;
  const outStart = new Uint32Array(nodeCount + 1);
  for (let i = 0; i < E; i++) {
    outStart[ea[i] + 1]++;
    if (eOw[i] !== 1) outStart[eB[i] + 1]++; // reverse arc unless strictly a→b
  }
  for (let i = 0; i < nodeCount; i++) outStart[i + 1] += outStart[i];
  const arcTo = new Uint32Array(arcCount);
  const arcEdge = new Uint32Array(arcCount);
  const arcRev = new Uint8Array(arcCount); // 1 = traversed against storage direction
  const cursor = outStart.slice(0, nodeCount);
  for (let i = 0; i < E; i++) {
    const a = ea[i], b = eB[i];
    let p = cursor[a]++;
    arcTo[p] = b; arcEdge[p] = i; arcRev[p] = 0;
    if (eOw[i] !== 1) {
      p = cursor[b]++;
      arcTo[p] = a; arcEdge[p] = i; arcRev[p] = 1;
    }
  }

  // Spatial grid of nodes for snapping (~250m cells).
  const CELL = 0.0025;
  const grid = new Map();
  for (let n = 0; n < nodeCount; n++) {
    const k = Math.floor(nodeLon[n] / 1e6 / CELL) + ',' + Math.floor(nodeLat[n] / 1e6 / CELL);
    let arr = grid.get(k);
    if (!arr) grid.set(k, (arr = []));
    arr.push(n);
  }

  return {
    nodeCount, edgeCount, bbox, names,
    nodeLon, nodeLat,
    ea, eB, eLen, eSpd, eCam, eOw, eName,
    outStart, arcTo, arcEdge, arcRev,
    grid, CELL,
  };
}

export function inGraphRegion(lon, lat) {
  if (!graph) return false;
  const [w, s, e, n] = graph.bbox;
  return lon >= w && lon <= e && lat >= s && lat <= n;
}

export function nearestNode(lon, lat) {
  const g = graph;
  const CELL = g.CELL;
  const gx = Math.floor(lon / CELL);
  const gy = Math.floor(lat / CELL);
  let best = -1, bestD = Infinity;
  for (let ring = 0; ring < 8 && best === -1; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const arr = g.grid.get((gx + dx) + ',' + (gy + dy));
        if (!arr) continue;
        for (const n of arr) {
          const dLon = (g.nodeLon[n] / 1e6 - lon) * 111320 * Math.cos((lat * Math.PI) / 180);
          const dLat = (g.nodeLat[n] / 1e6 - lat) * 111320;
          const d = dLon * dLon + dLat * dLat;
          if (d < bestD) { bestD = d; best = n; }
        }
      }
    }
    if (best !== -1) break;
  }
  return { node: best, dist: Math.sqrt(bestD) };
}

// ---- Cost modes ----
// camWeight is in seconds per unit of camera exposure (0-255 per edge).
const MODES = {
  off: { camWeight: 0, capFactor: Infinity, label: 'Fastest' },
  moderate: { camWeight: 6, capFactor: 1.25, label: 'Balanced' },
  strict: { camWeight: 60, capFactor: Infinity, label: 'Clearest' },
};

// ---- Binary min-heap on Float64 keys ----
class Heap {
  constructor() { this.k = []; this.v = []; }
  push(key, val) {
    const k = this.k, v = this.v;
    k.push(key); v.push(val);
    let i = k.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (k[p] <= k[i]) break;
      [k[p], k[i]] = [k[i], k[p]];
      [v[p], v[i]] = [v[i], v[p]];
      i = p;
    }
  }
  pop() {
    const k = this.k, v = this.v;
    const top = v[0];
    const lk = k.pop(), lv = v.pop();
    if (k.length) {
      k[0] = lk; v[0] = lv;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < k.length && k[l] < k[m]) m = l;
        if (r < k.length && k[r] < k[m]) m = r;
        if (m === i) break;
        [k[m], k[i]] = [k[i], k[m]];
        [v[m], v[i]] = [v[i], v[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.k.length; }
}

function astar(g, startNode, endNode, mode, edgeFactor, edgeDelay) {
  const cfg = MODES[mode];
  const N = g.nodeCount;
  const gScore = new Float64Array(N).fill(Infinity);
  const prevArc = new Int32Array(N).fill(-1);
  const prevFrom = new Int32Array(N).fill(-1); // node each arc was entered from
  const closed = new Uint8Array(N);

  const tLon = g.nodeLon[endNode] / 1e6;
  const tLat = g.nodeLat[endNode] / 1e6;
  const h = (n) => {
    // optimistic straight-line time at max speed (traffic-free by design)
    const dLon = (g.nodeLon[n] / 1e6 - tLon) * 111320 * Math.cos((tLat * Math.PI) / 180);
    const dLat = (g.nodeLat[n] / 1e6 - tLat) * 111320;
    return Math.hypot(dLon, dLat) / (120 / 3.6);
  };

  const heap = new Heap();
  gScore[startNode] = 0;
  heap.push(h(startNode), startNode);

  let expansions = 0;
  const MAX_EXPANSIONS = 900000;

  while (heap.size) {
    const u = heap.pop();
    if (closed[u]) continue;
    closed[u] = 1;
    expansions++;
    if (u === endNode) break;
    if (expansions > MAX_EXPANSIONS) break;

    for (let p = g.outStart[u]; p < g.outStart[u + 1]; p++) {
      const v = g.arcTo[p];
      if (closed[v]) continue;
      const e = g.arcEdge[p];
      const len = g.eLen[e];
      let timeSec = len / (g.eSpd[e] / 3.6);
      timeSec /= edgeFactor[e]; // live traffic slows the edge
      const camCost = cfg.camWeight * (g.eCam[e] / 255) * (len / 100); // exposure scales with length under camera
      const ng = gScore[u] + timeSec + camCost;
      if (ng < gScore[v]) {
        gScore[v] = ng;
        prevArc[v] = p;
        prevFrom[v] = u;
        heap.push(ng + h(v), v);
      }
    }
  }

  if (prevArc[endNode] === -1 && startNode !== endNode) return null;

  // Reconstruct path.
  const arcs = [];
  let cur = endNode;
  while (cur !== startNode) {
    const p = prevArc[cur];
    if (p === -1) return null;
    arcs.push(p);
    cur = prevFrom[cur];
  }
  arcs.reverse();

  // Path metrics.
  let distance = 0, time = 0, camUnits = 0, delay = 0;
  const coords = [];
  let cameraClusters = 0, inCluster = false;
  coords.push([g.nodeLon[startNode] / 1e6, g.nodeLat[startNode] / 1e6]);
  for (const p of arcs) {
    const e = g.arcEdge[p];
    const len = g.eLen[e];
    distance += len;
    time += (len / (g.eSpd[e] / 3.6)) / edgeFactor[e];
    delay += edgeDelay[e];
    const cam = g.eCam[e];
    camUnits += cam * (len / 100);
    if (cam > 40) {
      if (!inCluster) { cameraClusters++; inCluster = true; }
    } else {
      inCluster = false;
    }
    const toNode = g.arcTo[p];
    coords.push([g.nodeLon[toNode] / 1e6, g.nodeLat[toNode] / 1e6]);
  }

  return {
    coords, distance, duration: time,
    cameras: cameraClusters, camUnits,
    delay, // seconds lost to live traffic
    expansions, arcs,
  };
}

// Simplify coords (drop near-collinear points) for rendering + instructions.
function simplify(coords, tolDeg = 2e-6) {
  if (coords.length <= 2) return coords;
  const out = [coords[0]];
  for (let i = 1; i < coords.length - 1; i++) {
    const [ax, ay] = out[out.length - 1];
    const [bx, by] = coords[i];
    const [cx, cy] = coords[i + 1];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(cross) > tolDeg) out.push(coords[i]);
  }
  out.push(coords[coords.length - 1]);
  return out;
}

function bearing(a, b) {
  const latm = ((a[1] + b[1]) / 2) * Math.PI / 180;
  const dx = (b[0] - a[0]) * Math.cos(latm);
  const dy = b[1] - a[1];
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

// Turn-by-turn from our own graph geometry (Workstream A.5).
export function instructionsFor(g, route) {
  const coords = route.coords;
  if (coords.length < 2) return [];

  const segDist = (a, b) => {
    const latm = ((a[1] + b[1]) / 2) * Math.PI / 180;
    return Math.hypot((b[0] - a[0]) * 111320 * Math.cos(latm), (b[1] - a[1]) * 111320);
  };

  // Per-arc attributes + cumulative start distance along the route.
  const arcsInfo = [];
  let acc = 0;
  for (const p of route.arcs) {
    const e = g.arcEdge[p];
    arcsInfo.push({ name: g.eName[e], len: g.eLen[e], spd: g.eSpd[e], cam: g.eCam[e], start: acc });
    acc += g.eLen[e];
  }
  const nameAt = (i) => {
    const s = arcsInfo[Math.min(i, arcsInfo.length - 1)];
    return s && s.name !== 65535 ? g.names[s.name] || '' : '';
  };

  const maneuvers = [{ at: 0, turn: 'depart', name: nameAt(0) }];
  let cum = 0;
  for (let i = 1; i < coords.length - 1; i++) {
    cum += segDist(coords[i - 1], coords[i]);
    const b1 = bearing(coords[i - 1], coords[i]);
    const b2 = bearing(coords[i], coords[i + 1]);
    let d = b2 - b1;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    const nm = nameAt(i);
    const nameChanged = nm !== nameAt(i - 1);
    if (Math.abs(d) > 25 || (nameChanged && Math.abs(d) > 10)) {
      maneuvers.push({ at: cum, turn: turnFor(d), name: nm });
    }
  }
  maneuvers.push({ at: route.distance, turn: 'arrive', name: nameAt(coords.length - 2) });

  const steps = [];
  for (let i = 0; i < maneuvers.length - 1; i++) {
    const m = maneuvers[i];
    const from = m.at;
    const to = maneuvers[i + 1].at;
    // Attribute arcs to this step: arc counted if its midpoint is inside.
    let speedLimit = 0;
    let cams = 0;
    for (const a of arcsInfo) {
      const mid = a.start + a.len / 2;
      if (mid >= from && mid < to) {
        if (a.spd > speedLimit) speedLimit = a.spd;
        if (a.cam > 40) cams++;
      }
    }
    steps.push({
      instruction: maneuverText(m.turn),
      modifier: m.turn,
      distance: Math.round(to - from),
      name: m.name || '',
      at: Math.round(m.at),
      speedLimit: speedLimit || null, // km/h of the fastest edge in this step
      cameras: cams,
    });
  }
  return steps;
}

function turnFor(deg) {
  if (deg > 150) return 'u-turn';
  if (deg > 55) return 'right';
  if (deg > 25) return 'slight_right';
  if (deg < -150) return 'u-turn';
  if (deg < -55) return 'left';
  if (deg < -25) return 'slight_left';
  return 'straight';
}

function maneuverText(t) {
  return {
    depart: 'Head out',
    arrive: 'Arrive at destination',
    left: 'Turn left',
    right: 'Turn right',
    slight_left: 'Bear left',
    slight_right: 'Bear right',
    sharp_left: 'Sharp left',
    sharp_right: 'Sharp right',
    'u-turn': 'Make a U-turn',
    straight: 'Continue',
  }[t] || 'Continue';
}

// ---- Public planning API: returns up to 3 options ----
export async function planRoutes(from, to, { prefer = 'moderate', traffic = null } = {}) {
  const g = await loadGraph();
  const s = nearestNode(from[0], from[1]);
  const t = nearestNode(to[0], to[1]);
  if (s.node === -1 || t.node === -1) throw new Error('Outside the coverage area');
  if (s.dist > 1200 || t.dist > 1200) throw new Error('Start or destination is too far from a road in the coverage area');

  // Precompute per-edge live-traffic factors once for all mode runs.
  const edgeFactor = new Float32Array(g.edgeCount).fill(1);
  const edgeDelay = new Float64Array(g.edgeCount);
  if (traffic && traffic.grid && traffic.grid.size) {
    const cos = Math.cos((40.35 * Math.PI) / 180);
    for (let e = 0; e < g.edgeCount; e++) {
      const a = g.ea[e], b = g.eB[e];
      const midLon = (g.nodeLon[a] + g.nodeLon[b]) / 2e6;
      const midLat = (g.nodeLat[a] + g.nodeLat[b]) / 2e6;
      const k = Math.floor(midLon / 0.0025) + ',' + Math.floor(midLat / 0.0025);
      const evs = traffic.grid.get(k);
      if (!evs) continue;
      let worst = 1;
      for (const ev of evs) {
        const dLon = (ev.lon - midLon) * 111320 * cos;
        const dLat = (ev.lat - midLat) * 111320;
        if (dLon * dLon + dLat * dLat <= ev.radius * ev.radius) {
          if (ev.speedFactor < worst) worst = ev.speedFactor;
        }
      }
      edgeFactor[e] = worst;
      edgeDelay[e] = (g.eLen[e] / (g.eSpd[e] / 3.6)) * (1 / worst - 1);
    }
  }

  const fastest = astar(g, s.node, t.node, 'off', edgeFactor, edgeDelay);
  if (!fastest) throw new Error('No route found');

  const options = [{ mode: 'off', label: 'Fastest', route: fastest }];

  const balanced = astar(g, s.node, t.node, 'moderate', edgeFactor, edgeDelay);
  if (balanced && balanced.cameras < fastest.cameras && balanced.distance <= fastest.distance * 1.35) {
    options.push({ mode: 'moderate', label: 'Balanced', route: balanced });
  } else if (balanced && balanced.distance <= fastest.distance * 1.05) {
    options.push({ mode: 'moderate', label: 'Balanced', route: balanced });
  }

  const clearest = astar(g, s.node, t.node, 'strict', edgeFactor, edgeDelay);
  if (clearest) {
    // strict is only a distinct option if it actually avoids more cameras
    const bestSoFar = Math.min(...options.map((o) => o.route.cameras));
    if (clearest.cameras < bestSoFar) {
      options.push({ mode: 'strict', label: 'Clearest', route: clearest });
    } else if (!options.some((o) => o.mode === 'moderate') && clearest.cameras < fastest.cameras) {
      options.push({ mode: 'strict', label: 'Clearest', route: clearest });
    }
  }

  // Dedupe near-identical shapes.
  const uniq = [];
  for (const o of options) {
    if (!uniq.some((u) => similar(u.route, o.route))) uniq.push(o);
  }

  // Attach instructions + geometry.
  for (const o of uniq) {
    o.instructions = instructionsFor(g, o.route);
    o.coords = simplify(o.route.coords);
    o.cameras = o.route.cameras;
    o.distance = o.route.distance;
    o.duration = o.route.duration;
    o.delay = o.route.delay || 0;
  }

  return { options: uniq, graph: g, snapFrom: s, snapTo: t, trafficLive: !!(traffic && traffic.ok && traffic.events.length) };
}

function similar(a, b) {
  if (Math.abs(a.distance - b.distance) / Math.max(a.distance, 1) > 0.03) return false;
  if (a.cameras !== b.cameras) return false;
  return true;
}
