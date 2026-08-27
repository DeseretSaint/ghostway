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

import { CONFIG } from './config.js';

// Region-aware graph loading. Ghostway may ship several prebuilt road graphs
// (one per coverage region, see CONFIG.engineRegions). A graph is fetched
// LAZILY — only when a route actually enters that region's coverage box — so a
// user in, say, Denver never downloads the ~6 MB Wasatch graph they won't use.
// Outside every shipped region we fall back to the key-free national Valhalla
// engine (see valhalla.js), then BRouter/OSRM.

let graph = null;
let loadedRegionId = null;
let loadPromise = null;

export function graphStatus() {
  return graph ? 'ready' : loadPromise ? 'loading' : 'idle';
}

export function loadedRegion() {
  return loadedRegionId;
}

function inBox(lon, lat, [w, s, e, n]) {
  return lon >= w && lon <= e && lat >= s && lat <= n;
}

// True when a coordinate falls inside any shipped graph's coverage box.
// Does NOT require the graph to be downloaded — used to decide whether to use
// the local engine at all (vs Valhalla), and to trigger a lazy load.
export function regionCovers(lon, lat) {
  return CONFIG.engineRegions.some((r) => inBox(lon, lat, r.bbox));
}

function regionFor(lon, lat) {
  return CONFIG.engineRegions.find((r) => inBox(lon, lat, r.bbox)) || null;
}

// Load the graph for the region covering (lon,lat) — or pass a region object
// directly. Caches the promise/result; one region loads per session.
export async function loadGraph(lon, lat, onProgress) {
  const region = (lon && typeof lon === 'object' ? lon : regionFor(lon, lat)) || CONFIG.engineRegions[0];
  if (!region) throw new Error('no engine region configured');
  if (graph && loadedRegionId === region.id) return graph;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const res = await fetch(region.url);
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
    loadedRegionId = region.id;
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
    if (eOw[i] !== 2) outStart[ea[i] + 1]++; // a->b arc unless oneway b->a (ow=2)
    if (eOw[i] !== 1) outStart[eB[i] + 1]++; // reverse arc unless strictly a->b
  }
  for (let i = 0; i < nodeCount; i++) outStart[i + 1] += outStart[i];
  const arcTo = new Uint32Array(arcCount);
  const arcEdge = new Uint32Array(arcCount);
  const arcRev = new Uint8Array(arcCount); // 1 = traversed against storage direction
  const cursor = outStart.slice(0, nodeCount);
  for (let i = 0; i < E; i++) {
    const a = ea[i], b = eB[i];
    let p;
    if (eOw[i] !== 2) {
      p = cursor[a]++;
      arcTo[p] = b; arcEdge[p] = i; arcRev[p] = 0;
    }
    if (eOw[i] !== 1) {
      p = cursor[b]++;
      arcTo[p] = a; arcEdge[p] = i; arcRev[p] = 1;
    }
  }

  // Node degree (undirected edge count per node) — junction penalty input.
  const nodeDeg = new Uint8Array(nodeCount);
  for (let i = 0; i < E; i++) {
    if (nodeDeg[ea[i]] < 255) nodeDeg[ea[i]]++;
    if (nodeDeg[eB[i]] < 255) nodeDeg[eB[i]]++;
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
    nodeDeg,
    grid, CELL,
  };
}

// ---- ETA calibration (iteration 8) ----
// Production costing models (Valhalla et al.) derate posted speeds on
// signalized road classes and charge junction delays. Benchmark target:
// PG → Costco Lehi within ±10% of Valhalla's 10 min (see
// scripts/eta-benchmark.mjs). spd is the posted km/h on the edge.
export const effFactor = (spd) => (spd >= 95 ? 0.95 : spd >= 60 ? 0.86 : spd >= 45 ? 0.82 : 0.78);
export const junctionPenalty = (spd) => (spd >= 95 ? 0 : spd >= 60 ? 7 : spd >= 40 ? 5 : 3.5);

export function inGraphRegion(lon, lat) {
  if (!graph) return false;
  const [w, s, e, n] = graph.bbox;
  return lon >= w && lon <= e && lat >= s && lat <= n;
}

// Weighted snapping (field report #8 — airport centroid snapped to a
// dead-end stub and the route looped): prefer well-connected through-road
// nodes over degree-1/2 stubs even when the stub is marginally closer. A
// 400 m penalty on low-degree nodes lets a real intersection/arterial node
// within ~400 m win over a dead end. Selection uses distance + low-degree
// penalty so a real arterial node wins over a closer dead-end stub; the
// caller-facing `dist` is the TRUE snapping distance (meters), never the
// score — folding the penalty into it corrupts every downstream snap check
// (e.g. planRoutes' >1200 m guard).
//
// nearestCandidates returns the snap candidates of the first non-empty grid
// ring (minCandidates>1 keeps scanning rings until enough are collected),
// sorted by snap score. nearestNode is its first entry — byte-for-byte the
// historical behaviour. Gate-snap uses the extra candidates: a geocoded
// point can land on the wrong side of the camera wall while a sibling node
// a few hundred metres away has a short clear tail.
export function nearestCandidates(lon, lat, minCandidates = 1) {
  const g = graph;
  const CELL = g.CELL;
  const gx = Math.floor(lon / CELL);
  const gy = Math.floor(lat / CELL);
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const out = [];
  for (let ring = 0; ring < 8; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const arr = g.grid.get((gx + dx) + ',' + (gy + dy));
        if (!arr) continue;
        for (const n of arr) {
          const dLon = (g.nodeLon[n] / 1e6 - lon) * 111320 * cosLat;
          const dLat = (g.nodeLat[n] / 1e6 - lat) * 111320;
          const d = Math.sqrt(dLon * dLon + dLat * dLat);
          const deg = g.nodeDeg[n];
          const penalty = deg >= 3 ? 0 : deg === 2 ? 120 : 400;
          out.push({ node: n, dist: d, score: d + penalty });
        }
      }
    }
    if (out.length >= minCandidates) break;
  }
  out.sort((a, b) => a.score - b.score);
  return out;
}

export function nearestNode(lon, lat) {
  const c = nearestCandidates(lon, lat);
  return c.length ? { node: c[0].node, dist: c[0].dist } : { node: -1, dist: Infinity };
}

// ---- Cost modes ----
// camWeight is in seconds per unit of camera exposure (0-255 per edge).
// hardCam (strict only): edges whose exposure byte exceeds this are FORBIDDEN,
// not just expensive. Derivation: the builder scores (1 - d/100m)·255 per
// camera, sampling every ≤40 m along each edge. An edge whose true closest
// approach is <30 m therefore samples ≥ (1 - √(30²+20²)/100)·255 ≈ 163 even
// in the worst case (closest point midway between samples). Threshold 160
// catches every sub-30 m pass with margin → strict can never route within
// ALPR read range (~10-23 m at speed) plus buffer. Multiple cameras only add
// exposure (safe direction); non-ALPR cameras weigh 0.5 and alone stay under
// the floor, which is intended (they don't read plates).
export const HARD_CAM_EXPOSURE = 160;
// Generalized cost (engine-rebuild plan step 1): drivers do NOT minimize
// time — distance carries independent disutility (fuel/wear/perceived effort,
// Wardman 1985) and <50% of drivers take the fastest route (Ramming 2002).
// distW is seconds of disutility per meter of distance, added to the SEARCH
// score only; reported duration/distance metrics stay honest pure-time.
// Tuned so a route must save ~1 min of time per extra km to win — the direct
// surface arterial then beats a freeway detour that only saves a minute or
// two (the natural-route preference from the driver-preference research).
const DIST_W = 0.06;

export const MODES = {
  off: { camWeight: 0, capFactor: Infinity, hardCam: 0, distW: 0, label: 'Fastest' },
  moderate: { camWeight: 6, capFactor: 1.25, hardCam: 0, distW: DIST_W, label: 'Balanced' },
  strict: { camWeight: 60, capFactor: Infinity, hardCam: HARD_CAM_EXPOSURE, distW: DIST_W, label: 'Clearest' },
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

function astar(g, startNode, endNode, mode, edgeFactor, edgeDelay, { softCam = false, maxCost = Infinity, penalty = null } = {}) {
  const cfg = MODES[mode];
  // Hard exposure floor (strict): forbidden edges, except roads touching the
  // origin/destination — those may legitimately sit beside a camera.
  const hardFloor = cfg.hardCam && !softCam ? cfg.hardCam : 0;
  const N = g.nodeCount;
  const gScore = new Float64Array(N).fill(Infinity);
  const prevArc = new Int32Array(N).fill(-1);
  const prevFrom = new Int32Array(N).fill(-1); // node each arc was entered from
  const closed = new Uint8Array(N);
  // Time-only accumulation for the detour budget: camera cost must not eat
  // into the budget (maxCost is real driving seconds, not avoidance weight).
  const tScore = maxCost < Infinity ? new Float64Array(N).fill(Infinity) : null;

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
      // Strict safety floor: never traverse a high-exposure edge unless it is
      // the first/last road of the trip (endpoint exemption).
      if (hardFloor && g.eCam[e] > hardFloor && u !== startNode && v !== endNode) continue;
      const len = g.eLen[e];
      const spd = g.eSpd[e];
      // Effective speed: posted speed derated for signals/urban friction.
      let timeSec = len / ((spd * effFactor(spd)) / 3.6);
      timeSec /= edgeFactor[e]; // live traffic slows the edge
      // Junction delay: entering an intersection (degree ≥ 3) costs signal/turn time.
      if (g.nodeDeg[v] >= 3) timeSec += junctionPenalty(spd);
      const camCost = cfg.camWeight * (g.eCam[e] / 255) * (len / 100); // exposure scales with length under camera
      // Generalized cost: distance disutility (search score only; the budget
      // tracker tScore and reported metrics stay pure driving time).
      const distCost = cfg.distW * len;
      // Avoid-highways penalty: search-only multiplier (metrics stay honest).
      const pen = penalty ? penalty[e] : 1;
      const ng = gScore[u] + (timeSec + camCost) * pen + distCost;
      if (ng < gScore[v]) {
        // Detour budget: prune paths whose real driving time exceeds it.
        if (tScore) {
          const nt = tScore[u] + timeSec * pen;
          if (nt > maxCost) continue;
          tScore[v] = nt;
        }
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
  let distance = 0, time = 0, camUnits = 0, delay = 0, highwayKm = 0;
  const coords = [];
  let cameraClusters = 0, inCluster = false;
  coords.push([g.nodeLon[startNode] / 1e6, g.nodeLat[startNode] / 1e6]);
  for (const p of arcs) {
    const e = g.arcEdge[p];
    const toNode = g.arcTo[p];
    const len = g.eLen[e];
    const spd = g.eSpd[e];
    distance += len;
    if (spd >= 95) highwayKm += len / 1000; // freeway-class (posted ≥95 km/h)
    let seg = (len / ((spd * effFactor(spd)) / 3.6)) / edgeFactor[e];
    if (g.nodeDeg[toNode] >= 3) seg += junctionPenalty(spd);
    time += seg;
    delay += edgeDelay[e];
    const cam = g.eCam[e];
    camUnits += cam * (len / 100);
    if (cam > 40) {
      if (!inCluster) { cameraClusters++; inCluster = true; }
    } else {
      inCluster = false;
    }
    coords.push([g.nodeLon[toNode] / 1e6, g.nodeLat[toNode] / 1e6]);
  }

  return {
    coords, distance, duration: time,
    cameras: cameraClusters, camUnits,
    highwayKm, // freeway-class kilometers (posted ≥95 km/h) — for the
                // "avoid highway + avoid camera + shortest" smart default
    delay, // seconds lost to live traffic
    expansions, arcs,
  };
}

// Simplify the route polyline for rendering — proper Douglas-Peucker in
// METER space. The old degree-space cross-product tolerance dropped real
// street corners (a 90° city turn between short segments fell under it),
// making the drawn line cut across building blocks. DP with a 3 m chord
// tolerance keeps every real corner and only removes jitter on straights.
export function simplify(coords, tolM = 3) {
  if (coords.length <= 2) return coords;
  const kx = Math.cos((coords[0][1] * Math.PI) / 180) * 111320;
  const ky = 111320;
  const x = coords.map((c) => c[0] * kx);
  const y = coords.map((c) => c[1] * ky);
  const keep = new Uint8Array(coords.length);
  keep[0] = 1;
  keep[coords.length - 1] = 1;
  const stack = [[0, coords.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    if (e - s < 2) continue;
    const ax = x[s], ay = y[s], dx = x[e] - ax, dy = y[e] - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = s + 1; i < e; i++) {
      let d;
      if (len2 === 0) {
        d = Math.hypot(x[i] - ax, y[i] - ay);
      } else {
        const t = Math.max(0, Math.min(1, ((x[i] - ax) * dx + (y[i] - ay) * dy) / len2));
        d = Math.hypot(x[i] - (ax + t * dx), y[i] - (ay + t * dy));
      }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tolM && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return coords.filter((_, i) => keep[i]);
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

// One position per camera cluster along the path (contiguous exposed arcs =
// one pass), with its distance along the route. Powers the live camera
// counter during navigation.
function cameraClusterPositions(g, route) {
  const pts = [];
  let inCluster = false;
  let clusterStart = 0;
  let acc = 0;
  for (const p of route.arcs) {
    const e = g.arcEdge[p];
    const exposed = g.eCam[e] > 40;
    if (exposed && !inCluster) {
      inCluster = true;
      clusterStart = acc;
    }
    if (!exposed && inCluster) {
      const toNode = g.arcTo[p];
      pts.push({ at: Math.round((clusterStart + acc) / 2), lon: g.nodeLon[toNode] / 1e6, lat: g.nodeLat[toNode] / 1e6 });
      inCluster = false;
    }
    acc += g.eLen[e];
  }
  if (inCluster) {
    const lastArc = route.arcs[route.arcs.length - 1];
    const toNode = g.arcTo[lastArc];
    pts.push({ at: Math.round((clusterStart + acc) / 2), lon: g.nodeLon[toNode] / 1e6, lat: g.nodeLat[toNode] / 1e6 });
  }
  return pts;
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

// Camera-walled destinations: find the "gate" where the clear network ends on
// the approach to the destination, and the driving distance of the exposed
// tail beyond it. buildClearIndex runs ONCE per origin: (1) forward BFS from
// the origin over floor-legal edges (the first road may sit beside a camera —
// mirrors astar's start exemption) marks the clear set; (2) reverse adjacency
// (one O(E) pass). clearTailTo then runs a reverse Dijkstra from ANY
// destination node over ALL edges, popping in increasing u→t distance; the
// first clear node popped is the gate with the SHORTEST exposed tail. Returns
// { node, tailM } or null. The split lets gate-snap probe several snap
// candidates around a geocoded point without rebuilding the index each time.
function buildClearIndex(g, sNode, floor) {
  const N = g.nodeCount;
  const clear = new Uint8Array(N);
  const stack = [sNode];
  clear[sNode] = 1;
  while (stack.length) {
    const u = stack.pop();
    for (let p = g.outStart[u]; p < g.outStart[u + 1]; p++) {
      const v = g.arcTo[p];
      if (clear[v]) continue;
      if (u !== sNode && g.eCam[g.arcEdge[p]] > floor) continue;
      clear[v] = 1;
      stack.push(v);
    }
  }

  // Reverse adjacency (one O(E) pass) so we can relax u→t distances from t.
  const arcCount = g.arcTo.length;
  const inDeg = new Uint32Array(N);
  for (let p = 0; p < arcCount; p++) inDeg[g.arcTo[p]]++;
  const revStart = new Uint32Array(N + 1);
  for (let n = 0; n < N; n++) revStart[n + 1] = revStart[n] + inDeg[n];
  const revFrom = new Int32Array(arcCount);
  const revEdge = new Int32Array(arcCount);
  const cur = revStart.slice(0, N);
  for (let u = 0; u < N; u++) {
    for (let p = g.outStart[u]; p < g.outStart[u + 1]; p++) {
      const q = cur[g.arcTo[p]]++;
      revFrom[q] = u;
      revEdge[q] = g.arcEdge[p];
    }
  }
  return { g, clear, revStart, revFrom, revEdge };
}

function clearTailTo(idx, tNode) {
  const { g, clear, revStart, revFrom, revEdge } = idx;
  if (clear[tNode]) return null; // not actually walled
  const N = g.nodeCount;
  const dist = new Float64Array(N).fill(Infinity);
  const closed = new Uint8Array(N);
  const heap = new Heap();
  dist[tNode] = 0;
  heap.push(0, tNode);
  const MAX_TAIL = 500; // never gate-snap across an exposed tail this long
  while (heap.size) {
    const u = heap.pop();
    if (closed[u]) continue;
    closed[u] = 1;
    if (dist[u] > MAX_TAIL) break; // later pops only get farther
    if (clear[u]) return { node: u, tailM: dist[u] };
    for (let q = revStart[u]; q < revStart[u + 1]; q++) {
      const v = revFrom[q];
      if (closed[v]) continue;
      const nd = dist[u] + g.eLen[revEdge[q]];
      if (nd < dist[v]) { dist[v] = nd; heap.push(nd, v); }
    }
  }
  return null;
}

// ---- Public planning API: returns up to 3 options ----
export async function planRoutes(from, to, { prefer = 'moderate', traffic = null, communityCams = [], avoidHighways = false } = {}) {
  const g = await loadGraph();
  const s = nearestNode(from[0], from[1]);
  const t = nearestNode(to[0], to[1]);
  if (s.node === -1 || t.node === -1) throw new Error('Outside the coverage area');
  if (s.dist > 1200 || t.dist > 1200) throw new Error('Start or destination is too far from a road in the coverage area');

  // Community camera reports: bake user-reported cameras into the edge
  // exposure (same radius/weighting as the graph builder), so routes react
  // immediately — before any OSM/DeFlock review lands.
  let graph = g;
  if (communityCams && communityCams.length) {
    const merged = new Uint8Array(g.eCam); // copy
    const CELL = 0.002; // ~220 m grid, matches builder
    const grid = new Map();
    for (const c of communityCams) {
      const gx = Math.floor(c.lon / CELL);
      const gy = Math.floor(c.lat / CELL);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const k = gx + dx + ',' + (gy + dy);
          if (!grid.has(k)) grid.set(k, []);
          grid.get(k).push(c);
        }
      }
    }
    const R = 100; // meters of influence, same as builder
    for (let e = 0; e < g.edgeCount; e++) {
      const a = g.ea[e], b = g.eB[e];
      const pts = [
        [g.nodeLon[a] / 1e6, g.nodeLat[a] / 1e6],
        [(g.nodeLon[a] + g.nodeLon[b]) / 2e6, (g.nodeLat[a] + g.nodeLat[b]) / 2e6],
        [g.nodeLon[b] / 1e6, g.nodeLat[b] / 1e6],
      ];
      let extra = 0;
      for (const [plon, plat] of pts) {
        const cell = grid.get(Math.floor(plon / CELL) + ',' + Math.floor(plat / CELL));
        if (!cell) continue;
        const cosLat = Math.cos((plat * Math.PI) / 180);
        for (const c of cell) {
          const dLon = (c.lon - plon) * 111320 * cosLat;
          const dLat = (c.lat - plat) * 111320;
          const d2 = dLon * dLon + dLat * dLat;
          if (d2 <= R * R) extra = Math.max(extra, Math.round((1 - Math.sqrt(d2) / R) * 255));
        }
      }
      if (extra) merged[e] = Math.min(255, merged[e] + extra);
    }
    graph = { ...g, eCam: merged };
  }

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

  const fastest = astar(graph, s.node, t.node, 'off', edgeFactor, edgeDelay);
  if (!fastest) throw new Error('No route found');

  const options = [{ mode: 'off', label: 'Fastest', route: fastest }];

  // Avoid-highways option (surface-street preference knob, engine-rebuild plan
  // step 3 — Valhalla use_highways analog): freeway-class edges (≥95 km/h
  // posted) carry a search-only cost factor (reported metrics stay honest).
  // Runs on the GENERALIZED cost model (mode 'moderate' = distance disutility
  // + light camera weighting) instead of pure time, so the option picks the
  // natural arterial chain a local would take — shorter distance, camera-aware
  // — not just the time-optimal surface path. Offered when it produces a
  // genuinely different shape within a sane detour (≤1.6x distance).
  if (avoidHighways) {
    const hwPenalty = new Float32Array(graph.edgeCount);
    for (let e = 0; e < graph.edgeCount; e++) hwPenalty[e] = graph.eSpd[e] >= 95 ? 3.0 : 1.0;
    const noHw = astar(graph, s.node, t.node, 'moderate', edgeFactor, edgeDelay, { penalty: hwPenalty });
    if (noHw && !similar(noHw, fastest) && noHw.distance <= fastest.distance * 1.6) {
      options.push({ mode: 'no_highways', label: 'No highways', route: noHw });
    }
  }

  const balanced = astar(graph, s.node, t.node, 'moderate', edgeFactor, edgeDelay);
  // Offer Balanced whenever it's a sane detour — the geometry-aware dedupe
  // below drops it if it traces the same road as Fastest. The old gate also
  // required fewer cameras, which hid surface-street alternatives whenever
  // camera counts tied (the "only Fastest shows" complaint).
  if (balanced && balanced.distance <= fastest.distance * 1.35) {
    options.push({ mode: 'moderate', label: 'Balanced', route: balanced });
  }

  // Strict = hard safety floor first (no edge within ALPR read range), under
  // a DETOUR BUDGET: avoidance may cost at most 25% extra time plus a 90 s
  // absolute floor (short trips still dodge cameras near the endpoints).
  // capFactor was declared on MODES but never enforced — this is the fix for
  // the "forced detour" complaint (PG→Costco Clearest was +38% time).
  const strictBudget = fastest.duration * 1.25 + 90;
  // Distance-aware acceptance (engine-rebuild plan step 2): the budget above is
  // time-only, which rejects clear routes that add little or no distance but a
  // few minutes. Drivers accept time-for-distance trades on short urban trips
  // (Wardman 1985: distance carries independent disutility; Ramming 2002: <50%
  // of drivers take the fastest route) — a clear route within ~+10% distance
  // (min 300 m slack) is served under a relaxed time cap, so the natural
  // shorter-distance arterial beats a marginally-faster camera path.
  const distSlack = Math.max(300, fastest.distance * 0.10);
  const strictTimeCap = fastest.duration * 1.5 + 180;
  // Unbounded strict search, budget checked AFTER. The in-search maxCost prune
  // tracks time on the best-score label only and can reject a camera-free route
  // whose TRUE time fits the budget — measured on PG→Costco: the 0-camera route
  // is 846 s, the budget is 863 s, yet the budgeted search returned null and the
  // served "Clearest" still passed a camera (strictFallback). Same unbounded +
  // post-search-check pattern gate-snap already uses below.
  const strictProbe = astar(graph, s.node, t.node, 'strict', edgeFactor, edgeDelay, {});
  const distOk = strictProbe && (strictProbe.distance - fastest.distance) <= distSlack;
  let clearest = strictProbe && (strictProbe.duration <= strictBudget || (distOk && strictProbe.duration <= strictTimeCap)) ? strictProbe : null;
  let strictFallback = false;
  let overBudget = false;
  let walled = false;
  let clearToM = 0;
  if (!clearest) {
    // Camera-walled or budget-exhausted. The unbounded probe already tells us
    // which: null = truly walled (no ≥floor path anywhere); an over-budget hit
    // = a clear path exists but costs too much time.
    walled = strictProbe === null;
    if (walled) {
      // Gate-snap: the clear network ends a short drive from the destination
      // (measured: BYU tail = 118 m / 4 edges). Route hard-floor-clear to the
      // gate instead of serving the whole exposed tail best-effort — the
      // mid-route ≥floor guarantee holds on the served route, and only the
      // honest final approach passes a camera. The gate route must detour
      // around the cameras guarding the approach, so it gets a relaxed budget
      // (2x fastest + 5 min) rather than the clear-to-destination budget; it
      // is only ever offered for a walled destination, where the alternative
      // is a best-effort route that breaks the safety floor.
      //
      // Dest-radius search: a geocoded point can snap to a node on the wrong
      // side of the camera wall (photon's BYU centroid does — tail >200 m)
      // while a sibling snap candidate a few hundred metres away has a short
      // clear tail. Probe the primary snap plus up to 4 more candidates and
      // take the shortest qualifying tail. The clear index is built once.
      const idx = buildClearIndex(graph, s.node, HARD_CAM_EXPOSURE);
      let tail = clearTailTo(idx, t.node);
      let tailExtra = 0; // candidate→dest straight-line, added to the honest badge
      if (!tail || tail.tailM > 200) {
        for (const c of nearestCandidates(to[0], to[1], 5)) {
          if (c.node === t.node || c.dist > 400) continue;
          const alt = clearTailTo(idx, c.node);
          if (alt && alt.tailM <= 200 && (!tail || alt.tailM < tail.tailM)) { tail = alt; tailExtra = c.dist; }
        }
      }
      if (tail && tail.tailM <= 200 && tail.node !== s.node) {
        const gateBudget = fastest.duration * 2 + 300;
        // Unbounded search, budget checked after: the in-search maxCost prune
        // tracks time on the best-score label only and can reject a route
        // whose true time fits the budget (observed on this very corridor).
        const gateRoute = astar(graph, s.node, tail.node, 'strict', edgeFactor, edgeDelay, {});
        if (gateRoute && gateRoute.duration <= gateBudget) {
          clearest = gateRoute;
          clearToM = tail.tailM + tailExtra;
          overBudget = gateRoute.duration > strictBudget;
        }
      }
    }
    if (!clearest) {
      clearest = astar(graph, s.node, t.node, 'strict', edgeFactor, edgeDelay, { softCam: true, maxCost: strictBudget });
    }
    strictFallback = true;
  }
  if (!clearest) {
    // Nothing fits the budget: give the user the true clearest path anyway,
    // flagged so the UI can say "best effort — costs extra time".
    clearest = astar(graph, s.node, t.node, 'strict', edgeFactor, edgeDelay, { softCam: true });
    strictFallback = true;
    overBudget = true;
  }
  if (clearest) clearest.strictFallback = strictFallback;
  if (clearest) clearest.overBudget = overBudget;
  if (clearest) clearest.walled = walled;
  if (clearest) clearest.clearToM = clearToM;
  if (clearest) {
    // Offer Clearest whenever it's a plausible alternative — even when camera
    // counts tie Fastest (dense corridors: the surface-street option may pass
    // the same camera count on completely different roads). Geometry-aware
    // dedupe below drops it if it's the same shape; overBudget flags the cost.
    if (clearest.distance <= fastest.distance * 2) {
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
    o.instructions = instructionsFor(graph, o.route);
    o.coords = simplify(o.route.coords);
    o.cameras = o.route.cameras;
    o.cameraPoints = cameraClusterPositions(graph, o.route);
    o.highwayKm = o.route.highwayKm || 0;
    o.distance = o.route.distance;
    o.duration = o.route.duration;
    o.delay = o.route.delay || 0;
    if (o.mode === 'strict') {
      o.strictFallback = !!o.route.strictFallback;
      o.overBudget = !!o.route.overBudget;
      o.walled = !!o.route.walled;
      o.clearToM = o.route.clearToM || 0;
    }
  }

  return { options: uniq, graph: g, snapFrom: s, snapTo: t, trafficLive: !!(traffic && traffic.ok && traffic.events.length) };
}

function similar(a, b) {
  // Geometry-aware sameness: two options are "the same route" only when they
  // trace nearly the same road. The old distance+camera-count comparison
  // merged genuinely different corridors (I-15 vs State Street with similar
  // distance and equal camera counts) and hid real alternatives from the user.
  if (Math.abs(a.distance - b.distance) / Math.max(a.distance, 1) > 0.25) return false;
  return routeOverlap(a.coords, b.coords) > 0.85;
}

// Fraction of route B's length that runs within 60 m of route A (grid-indexed,
// O(n)). Symmetric enough for dedupe: corridors that split for any meaningful
// stretch (a different arterial, a freeway vs its frontage road) score low.
function routeOverlap(aCoords, bCoords) {
  if (!aCoords || !bCoords || aCoords.length < 2 || bCoords.length < 2) return 0;
  const kx = Math.cos((bCoords[0][1] * Math.PI) / 180) * 111320;
  const ky = 111320;
  const CELL = 120; // meters
  const grid = new Map();
  for (const c of aCoords) {
    const k = Math.floor((c[0] * kx) / CELL) + ',' + Math.floor((c[1] * ky) / CELL);
    let arr = grid.get(k);
    if (!arr) grid.set(k, (arr = []));
    arr.push([c[0] * kx, c[1] * ky]);
  }
  let near = 0, total = 0;
  for (let i = 1; i < bCoords.length; i++) {
    const x0 = bCoords[i - 1][0] * kx, y0 = bCoords[i - 1][1] * ky;
    const x1 = bCoords[i][0] * kx, y1 = bCoords[i][1] * ky;
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    if (segLen < 1) continue;
    total += segLen;
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const gx = Math.floor(mx / CELL), gy = Math.floor(my / CELL);
    let best = Infinity;
    for (let dx = -1; dx <= 1 && best > 60; dx++) {
      for (let dy = -1; dy <= 1 && best > 60; dy++) {
        const pts = grid.get((gx + dx) + ',' + (gy + dy));
        if (!pts) continue;
        for (const [px, py] of pts) {
          const d = Math.hypot(px - mx, py - my);
          if (d < best) { best = d; if (best <= 60) break; }
        }
      }
    }
    if (best <= 60) near += segLen;
  }
  return total ? near / total : 0;
}
