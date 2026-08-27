import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 120s'); process.exit(2); }, 120000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
p.on('pageerror', (e) => console.log('PAGEERROR:', String(e.message).slice(0,300)));
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(sel, q) { await p.type(sel, q); try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); } catch { await p.focus(sel); await p.keyboard.press('Enter'); } await wait(500); }
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
// Instrument the map's waypoint internals
await p.evaluate(() => {
  window.__wp = { down:0, move:0, up:0, drag:0, handlers:0 };
  const mv = window.__gw.map;
  // wrap internal handlers by listening to raw canvas events
  const c = mv.map.getCanvas();
  window.__realC = c;
  c.addEventListener('mousedown', () => window.__wp.down++, true);
  c.addEventListener('mousemove', () => window.__wp.move++, true);
  c.addEventListener('mouseup', () => window.__wp.up++, true);
  // also count handler fires
  const orig = mv._waypointDragHandlers;
  Object.defineProperty(mv, '_waypointDragHandlers', { get(){ return orig; }, set(v){ /*noop*/ } });
});
const handle = await p.evaluate(() => { const m = window.__gw.map.map; const f = m.getSource('waypoint')._data.features[0].geometry.coordinates; const px = m.project(f); return {x:px.x, y:px.y}; });
console.log('handle screen:', JSON.stringify(handle));
await p.mouse.move(handle.x, handle.y); await wait(150);
await p.mouse.down(); await wait(100);
await p.mouse.move(handle.x+40, handle.y, { steps:5 }); await wait(100);
await p.mouse.move(handle.x+80, handle.y, { steps:5 }); await wait(100);
await p.mouse.move(handle.x+110, handle.y, { steps:5 }); await wait(150);
await p.mouse.up(); await wait(3000);
const res = await p.evaluate(() => ({
  raw: window.__wp,
  wpDragging: window.__gw.map._wpDragging,
  viaRoute: window.__ghostwayDebug?.viaRoute,
  waypoint: window.__gw.state.waypoint,
}));
console.log('RAW EVENTS:', JSON.stringify(res.raw));
console.log('_wpDragging:', res.wpDragging);
console.log('viaRoute:', res.viaRoute);
console.log('waypoint:', JSON.stringify(res.waypoint));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
