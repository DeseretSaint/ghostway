import { loadGraph } from './src/router.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const gz = readFileSync(join(DIR, 'public', 'graph', 'wasatch-graph.bin.gz'));

// Shim fetch with a proper Response (headers + streaming body).
globalThis.fetch = async (url) => {
  const ab = gz.buffer.slice(gz.byteOffset, gz.byteOffset + gz.byteLength);
  const blob = new Blob([ab]);
  const response = new Response(blob, {
    status: 200,
    headers: { 'content-length': String(gz.byteLength) }
  });
  return response;
};

let events = [];
const graph = await loadGraph(-111.9, 40.5, (p) => { events.push(p); });
console.log('events:', events.length);
console.log('first:', JSON.stringify(events[0]));
console.log('last:', JSON.stringify(events[events.length - 1]));
console.log('graph nodes:', graph.nodeCount, 'edges:', graph.edgeCount);
const parseEvents = events.filter(e => e === 'parse');
const downloadEvents = events.filter(e => e && e.stage === 'download');
console.log('parse events:', parseEvents.length, '| download events:', downloadEvents.length);
if (downloadEvents.length >= 1 && parseEvents.length === 1) {
  console.log('STREAMING PROGRESS PASS');
} else {
  console.log('STREAMING PROGRESS FAIL');
  process.exit(1);
}