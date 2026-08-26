// Camera data-quality test: tap a real DeFlock camera marker on the live tile
// layer and verify the modal shows ALPR classification + direction + mount +
// data freshness (Workstream camera layer pass).
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 45000 });
await wait(2000);

// Zoom into Pleasant Grove where Flock cameras are dense, then wait for the
// camera point layer to have rendered features.
// Center the map precisely on a known camera from the shipped snapshot so one
// is guaranteed to be rendered in the visible band (above the bottom panel).
import { readFileSync } from 'node:fs';
const snap = JSON.parse(readFileSync('public/cameras/cameras.geojson', 'utf8'));
let cam0 = null;
if (snap.features && snap.features.length) {
  cam0 = snap.features[0].geometry.coordinates;
} else {
  // Snapshot is an empty placeholder — fall back to a verified PG camera.
  cam0 = [-111.7668589, 40.3512361];
}
console.log('centering on known camera:', JSON.stringify(cam0));
await p.evaluate((c) => {
  window.__gw.map.map.jumpTo({ center: c, zoom: 14.5 });
}, cam0);
await wait(3500);

// Find a rendered camera feature's screen position (must be above the bottom
// panel, y < 500) and hit-test it.
const cam = await p.evaluate(() => {
  const m = window.__gw.map.map;
  const feats = m.queryRenderedFeatures({ layers: ['cameras-layer'] });
  for (const f of feats) {
    if (!f.properties || !f.properties.brand) continue;
    const px = m.project(f.geometry.coordinates);
    if (px.y > 120 && px.y < 500 && px.x > 20 && px.x < 370) {
      return { props: f.properties, x: px.x, y: px.y };
    }
  }
  return null;
});
if (!cam) {
  console.log('no rendered cameras found');
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
  process.exit(1);
}
console.log('camera props:', JSON.stringify(cam.props));
console.log('screen pos:', cam.x.toFixed(0), cam.y.toFixed(0));

// Real click on the camera marker (protocol: real hit-testing, not .click()).
await p.mouse.move(cam.x, cam.y);
await wait(150);
const hitEl = await p.evaluate(({ x, y }) => {
  const el = document.elementFromPoint(x, y);
  return el ? el.tagName : 'none';
}, { x: cam.x, y: cam.y });
await p.mouse.down();
await p.mouse.up();
await wait(700);

const modal = await p.evaluate(() => {
  const m = document.querySelector('#modal');
  return { hidden: m?.hidden, text: m?.innerText?.replace(/\s+/g, ' ')?.slice(0, 400) };
});
console.log('modal:', JSON.stringify(modal));
console.log('hitEl at center:', hitEl);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const isAlpr = cam.props.surveillanceZone === 'traffic' ||
  /flock|rekor|platesmart|motorola|genetec|leonardo|neology|axon|ekin|redspeed/i.test(cam.props.brand || '');
const showsAlpr = /plate reader/i.test(modal.text);
const showsGeneric = /Surveillance camera/i.test(modal.text);
const showsMeta = /Faces|Mounted on|Mapped/i.test(modal.text);
const pass = !modal.hidden && (isAlpr ? showsAlpr : showsGeneric) && showsMeta;
console.log(pass ? '\nCAMERA-MODAL PASS ✅ — ALPR classification + metadata render' : '\nCAMERA-MODAL FAIL ❌');
process.exit(pass ? 0 : 1);
