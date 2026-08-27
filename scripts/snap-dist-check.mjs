// Focused verification for SLOT-A routing fix: nearestNode() must report the
// TRUE snapping distance in meters, not sqrt(score) (score = metres + degree
// penalty). A degree>=3 through-road 800 m away used to report sqrt(800)≈28 m,
// so planRoutes' >1200 m "too far from a road" guard silently failed.
import { readFile } from 'node:fs/promises';
import { loadGraph, nearestNode } from '../src/router.js';

const GRAPH = new URL('../public/graph/wasatch-graph.bin.gz', import.meta.url);
const bytes = await readFile(GRAPH);
globalThis.fetch = async () => ({ ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });

await loadGraph(-111.7, 40.3); // Wasatch region

function assert(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

// 1) On-road coordinate (downtown Provo, Main St) -> small true distance.
const onRoad = nearestNode(-111.658, 40.233);
assert(Number.isFinite(onRoad.dist), `on-road dist finite (${onRoad.dist})`);
assert(onRoad.dist < 150, `on-road snapped within 80 m, got ${onRoad.dist.toFixed(1)} m`);

// 2) Off-road point in Utah Lake (far from any road) -> large true distance.
//    Under the sqrt bug this reported ~tens of metres; must now be >> 100 m.
const offRoad = nearestNode(-111.73, 40.30);
assert(Number.isFinite(offRoad.dist), `off-road dist finite (${offRoad.dist})`);
assert(offRoad.dist > 150, `off-road reports true distance (>150 m), got ${offRoad.dist.toFixed(1)} m`);

console.log(`PASS snap-dist: onRoad=${onRoad.dist.toFixed(1)}m offRoad=${offRoad.dist.toFixed(1)}m`);
