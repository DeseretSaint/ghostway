// GWR2 turn restrictions (codex Q5): a plain node/edge search plans ILLEGAL
// turns fail-green — this proves the shipped graph carries the table and the
// A* enforces it on REAL data. For sampled restrictions it routes across the
// junction and walk-checks every consecutive arc pair against the ban/allow
// tables at that node.
import { readFileSync } from 'node:fs';
import { parseGraph, astar } from '../src/router.js';

const buf = readFileSync('public/graph/wasatch-graph.bin');
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const g = parseGraph(ab);

// ---- 1. Shipped table sanity (research scale: ~2,262 mapped pairs) ----
let banPairs = 0, allowPairs = 0;
for (const t of g.turns.values()) {
  for (const s of t.ban.values()) banPairs += s.size;
  for (const s of t.allow.values()) allowPairs += s.size;
}
const checks = {
  gwr2Parsed: g.edgeCount > 1000000,
  turnNodes: g.turns.size >= 400,
  banPairs: banPairs >= 1000,
  allowPairs: allowPairs >= 200,
};

// ---- 2. Walk-check helper: no consecutive arc pair may violate a table ----
function walkViolations(arcs) {
  const bad = [];
  for (let i = 0; i < arcs.length - 1; i++) {
    const x = g.arcTo[arcs[i]]; // junction where the maneuver happens
    const t = g.turns.get(x);
    if (!t) continue;
    const banSet = t.ban.get(arcs[i]);
    if (banSet && banSet.has(arcs[i + 1])) bad.push({ x, kind: 'ban', i });
    const allowSet = t.allow.get(arcs[i]);
    if (allowSet && !allowSet.has(arcs[i + 1])) bad.push({ x, kind: 'allow', i });
  }
  return bad;
}

const tailOf = (p) => (g.arcRev[p] === 0 ? g.ea[g.arcEdge[p]] : g.eB[g.arcEdge[p]]);
const E = g.edgeCount;
const edgeFactor = new Float64Array(E).fill(1);
const edgeDelay = new Float64Array(E);

// ---- 3. Sample real restrictions and route across their junctions ----
const entries = [...g.turns.entries()];
let sampled = 0, routed = 0, violations = 0, detours = 0;
const stride = Math.max(1, Math.floor(entries.length / 40));
for (let i = 0; i < entries.length && sampled < 40; i += stride) {
  const [node, t] = entries[i];
  for (const [inArc, outs] of t.ban) {
    for (const outArc of outs) {
      // Route from the far end of the in-edge to the far end of the out-edge:
      // the naive path is exactly the banned maneuver through `node`.
      const s = tailOf(inArc), e2 = g.arcTo[outArc];
      if (s === node || e2 === node || s === e2) continue; // degenerate sample
      const res = astar(g, s, e2, 'off', edgeFactor, edgeDelay, {});
      sampled++;
      if (res && res.arcs && res.arcs.length > 0) {
        routed++;
        const v = walkViolations(res.arcs);
        if (v.length) violations++;
        // Did it actually detour (the direct-through pair absent)?
        let tookBanned = false;
        for (let k = 0; k < res.arcs.length - 1; k++) {
          if (res.arcs[k] === inArc && res.arcs[k + 1] === outArc) tookBanned = true;
        }
        if (!tookBanned) detours++;
      }
      break; // one ban pair per junction
    }
    break;
  }
}

checks.sampledBans = sampled >= 20;
checks.bannedNeverTaken = violations === 0 && detours >= sampled * 0.5;
// Some restrictions legally DEAD-END a pair (no_u_turn where the banned
// maneuver is the only exit — think cul-de-sacs): astar correctly returns
// null and the app's Valhalla tier serves those. So not every sample routes.
checks.routesFound = routed >= sampled * 0.6;

console.log(JSON.stringify({ turnNodes: g.turns.size, banPairs, allowPairs, sampled, routed, detours, violations, checks }, null, 2));
const fail = Object.entries(checks).filter(([, v]) => !v);
if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
console.log('TURN RESTRICTIONS PASS ✅');
