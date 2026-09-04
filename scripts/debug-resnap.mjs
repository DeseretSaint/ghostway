import { loadGraph, nearestNode, nearestNodeInComponent, endpointsConnected } from '../src/router.js';
import { readFileSync } from 'node:fs';

const gz = readFileSync('public/graph/wasatch-graph.bin.gz');
globalThis.fetch = async () => ({ ok: true, status: 200, arrayBuffer: async () => gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength) });
const g = await loadGraph();

const FROM = [-111.6106, 40.1738];
const TO = [-111.5440, 39.9701];

const s1 = nearestNode(FROM[0], FROM[1]);
const t1 = nearestNode(TO[0], TO[1]);
console.log('Original snaps:');
console.log('  from:', s1.node, 'comp:', g.comp[s1.node], 'dist:', s1.dist.toFixed(1));
console.log('  to:  ', t1.node, 'comp:', g.comp[t1.node], 'dist:', t1.dist.toFixed(1));
console.log('  same comp:', g.comp[s1.node] === g.comp[t1.node]);
console.log('  largestComponent:', g.largestComponent);

const s2 = nearestNodeInComponent(FROM[0], FROM[1], g.largestComponent);
const t2 = nearestNodeInComponent(TO[0], TO[1], g.largestComponent);
console.log('Re-snapped to largest:');
console.log('  from:', s2.node, 'comp:', g.comp[s2.node], 'dist:', s2.dist.toFixed(1));
console.log('  to:  ', t2.node, 'comp:', g.comp[t2.node], 'dist:', t2.dist.toFixed(1));
console.log('  same comp:', g.comp[s2.node] === g.comp[t2.node]);
console.log('  within 1200m:', s2.dist <= 1200 && t2.dist <= 1200);
