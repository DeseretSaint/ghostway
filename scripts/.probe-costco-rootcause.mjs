// Root-cause probe: PG -> Costco Lehi (Keaton's reported camera-route bug).
// Proves whether the camera-free (>=30m strict-floor) route is SHORTER in
// distance but rejected by the time-only detour budget.
//
// Method (same as ledger rounds 35/36/44): standalone Dijkstra replicating
// router.js cost EXACTLY (effFactor + junctionPenalty + strict hardFloor 160
// + camWeight 60), run UNBOUNDED (no maxCost) to get the true camera-free
// route, then compared against the served Fastest + the time budget.
import { loadGraph, nearestNode, effFactor, junctionPenalty, HARD_CAM_EXPOSURE } from '../src/router.js';
import { readFileSync } from 'node:fs';

const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (String(url).includes('wasatch-graph.bin.gz')) {
    const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
    return { ok: true, status: 200, arrayBuffer: async () => ab };
  }
  return realFetch(url);
};
const g = await loadGraph();

const from = [-111.759, 40.364]; // PG
const to = [-111.834, 40.394];   // Costco Lehi
const s = nearestNode(from[0], from[1]);
const t = nearestNode(to[0], to[1]);
console.log(`snap: s.node=${s.node} (${s.dist.toFixed(0)}m)  t.node=${t.node} (${t.dist.toFixed(0)}m)`);

// --- standalone exact-cost Dijkstra (mirror of router.js astar, no heuristic) ---
function dijkstra(g, sN, tN, { camWeight = 0, hardFloor = 0, maxCost = Infinity } = {}) {
  const N = g.nodeCount;
  const dist = new Float64Array(N).fill(Infinity);
  const tScore = maxCost < Infinity ? new Float64Array(N).fill(Infinity) : null;
  const prevArc = new Int32Array(N).fill(-1);
  const prevFrom = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  // simple binary heap
  const hk = [], hv = [];
  const push = (k, v) => { hk.push(k); hv.push(v); let i = hk.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (hk[p] <= hk[i]) break; [hk[p], hk[i]] = [hk[i], hk[p]]; [hv[p], hv[i]] = [hv[i], hv[p]]; i = p; } };
  const pop = () => { const tv = hv[0]; const lk = hk.pop(), lv = hv.pop(); if (hk.length) { hk[0] = lk; hv[0] = lv; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < hk.length && hk[l] < hk[m]) m = l; if (r < hk.length && hk[r] < hk[m]) m = r; if (m === i) break; [hk[m], hk[i]] = [hk[i], hk[m]]; [hv[m], hv[i]] = [hv[i], hv[m]]; i = m; } } return tv; };
  dist[sN] = 0; if (tScore) tScore[sN] = 0;
  push(0, sN);
  while (hk.length) {
    const u = pop();
    if (closed[u]) continue;
    closed[u] = 1;
    if (u === tN) break;
    for (let p = g.outStart[u]; p < g.outStart[u + 1]; p++) {
      const v = g.arcTo[p];
      if (closed[v]) continue;
      const e = g.arcEdge[p];
      if (hardFloor && g.eCam[e] > hardFloor && u !== sN && v !== tN) continue;
      const len = g.eLen[e];
      const spd = g.eSpd[e];
      let timeSec = len / ((spd * effFactor(spd)) / 3.6);
      if (g.nodeDeg[v] >= 3) timeSec += junctionPenalty(spd);
      const camCost = camWeight * (g.eCam[e] / 255) * (len / 100);
      const ng = dist[u] + timeSec + camCost;
      if (ng < dist[v]) {
        if (tScore) {
          const nt = tScore[u] + timeSec;
          if (nt > maxCost) continue;
          tScore[v] = nt;
        }
        dist[v] = ng;
        prevArc[v] = p; prevFrom[v] = u;
        push(ng, v);
      }
    }
  }
  if (prevArc[tN] === -1 && sN !== tN) return null;
  // metrics
  let distance = 0, time = 0, cams = 0, inCl = false, minCam = Infinity;
  const arcs = [];
  let cur = tN;
  while (cur !== sN) { arcs.push(prevArc[cur]); cur = prevFrom[cur]; }
  arcs.reverse();
  for (const p of arcs) {
    const e = g.arcEdge[p];
    const len = g.eLen[e]; const spd = g.eSpd[e];
    distance += len;
    let seg = len / ((spd * effFactor(spd)) / 3.6);
    if (g.nodeDeg[g.arcTo[p]] >= 3) seg += junctionPenalty(spd);
    time += seg;
    const cam = g.eCam[e];
    if (cam > 40 && !inCl) { cams++; inCl = true; } else if (cam <= 40) inCl = false;
  }
  return { distance, time, cams, arcs };
}

// 1) Fastest (off): pure time, camWeight 0.
const fastest = dijkstra(g, s.node, t.node, { camWeight: 0 });
// 2) UNBOUNDED strict: hardFloor 160 + camWeight 60, no budget.
const strictUnbounded = dijkstra(g, s.node, t.node, { camWeight: 60, hardFloor: HARD_CAM_EXPOSURE });
// 3) strict UNDER the real budget (fastest*1.25+90).
const budget = fastest.time * 1.25 + 90;
const strictBudgeted = dijkstra(g, s.node, t.node, { camWeight: 60, hardFloor: HARD_CAM_EXPOSURE, maxCost: budget });

const mi = (m) => (m / 1609.34).toFixed(2);
const mn = (s) => (s / 60).toFixed(1);
console.log(`\n=== PG -> Costco Lehi ===`);
console.log(`Fastest (off)          : ${mi(fastest.distance)} mi / ${mn(fastest.time)} min / ${fastest.cams} cams`);
console.log(`strictBudget           : ${budget.toFixed(0)} s = ${mn(budget)} min`);
console.log(`Strict UNBOUNDED (free): ${strictUnbounded ? `${mi(strictUnbounded.distance)} mi / ${mn(strictUnbounded.time)} min / ${strictUnbounded.cams} cams` : 'null (walled)'}`);
console.log(`Strict under budget    : ${strictBudgeted ? `${mi(strictBudgeted.distance)} mi / ${mn(strictBudgeted.time)} min / ${strictBudgeted.cams} cams` : 'null -> REJECTED by budget'}`);

if (strictUnbounded) {
  const dDist = strictUnbounded.distance - fastest.distance;
  const dTime = strictUnbounded.time - fastest.time;
  console.log(`\nCamera-free vs Fastest : dDist=${(dDist/1609.34).toFixed(2)} mi  dTime=+${mn(dTime)} min`);
  console.log(`Camera-free SHORTER in distance? ${strictUnbounded.distance < fastest.distance ? 'YES' : 'no'} (${mi(strictUnbounded.distance)} vs ${mi(fastest.distance)} mi)`);
  console.log(`Camera-free over time budget?    ${strictUnbounded.time > budget ? 'YES -> budget rejects it -> fallback serves camera route' : 'no'}`);
}
