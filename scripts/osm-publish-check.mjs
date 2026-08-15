// OSM notes publish request shape — verified against a LOCAL mock server.
// Deliberately does NOT post to the real OpenStreetMap database (anonymous
// note creation on shared public infrastructure stays a human decision).
import { createServer } from 'node:http';
import { publishReportToOsm } from '../src/reports.js';

let captured = null;
const server = createServer((req, res) => {
  captured = { method: req.method, url: req.url };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ type: 'FeatureCollection', features: [{ properties: { id: 12345 } }] }));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const rec = { lon: -111.7669, lat: 40.3512, kind: 'alpr', brand: 'Flock Safety', note: 'on pole facing northbound' };
const noteId = await publishReportToOsm(rec, `http://localhost:${port}/api/0.6/notes.json`);
server.close();

console.log('method:', captured.method);
console.log('url:', decodeURIComponent(captured.url));
console.log('noteId:', noteId);

const url = new URL('http://x' + captured.url);
const text = url.searchParams.get('text');
const pass =
  captured.method === 'POST' &&
  Math.abs(Number(url.searchParams.get('lat')) - 40.3512) < 1e-9 &&
  Math.abs(Number(url.searchParams.get('lon')) + 111.7669) < 1e-9 &&
  /Ghostway report/.test(text) &&
  /ALPR/.test(text) &&
  /Flock Safety/.test(text) &&
  /man_made=surveillance/.test(text) &&
  /northbound/.test(text) &&
  noteId === 12345;
console.log(pass ? '\nOSM-PUBLISH PASS ✅ — request shape correct (mock server)' : '\nOSM-PUBLISH FAIL ❌');
process.exit(pass ? 0 : 1);
