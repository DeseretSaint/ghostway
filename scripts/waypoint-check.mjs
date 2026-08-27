// Waypoint drag E2E (Workstream C): after routing, a grab-handle appears at
// the route midpoint; dragging it with a REAL mouse drag re-routes through
// the drop point (stitched two-leg route); the card reflects the via route.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const pv = await startPreview();

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(800);

// 1) Handle exists at route midpoint.
const handle = await p.evaluate(() => {
  const m = window.__gw.map.map;
  const src = m.getSource('waypoint');
  const feats = src && src._data ? src._data.features : [];
  return { count: feats.length, coords: feats[0] && feats[0].geometry.coordinates };
});
console.log('handle present:', JSON.stringify(handle));

// 2) Project the handle to screen coords and drag it ~90px east with a real
//    mouse gesture (mousedown → move → up on the waypoint layer).
const pt = await p.evaluate((c) => {
  const px = window.__gw.map.map.project(c);
  return { x: px.x, y: px.y };
}, handle.coords);
console.log('handle screen pos:', JSON.stringify(pt));

const target = { x: pt.x + 110, y: pt.y };
await p.mouse.move(pt.x, pt.y);
await wait(150);
await p.mouse.down();
await p.mouse.move(pt.x + 40, pt.y, { steps: 4 });
await p.mouse.move(pt.x + 80, pt.y, { steps: 4 });
await p.mouse.move(target.x, target.y, { steps: 4 });
await wait(150);
await p.mouse.up();

// 3) Via route computed through the drop point.
await p.waitForFunction('window.__ghostwayDebug?.viaRoute === true', { timeout: 30000 });
const via = await p.evaluate(() => ({
  viaSource: window.__ghostwayDebug.viaSource,
  card: document.querySelector('#route-card')?.innerText?.replace(/\s+/g, ' ')?.slice(0, 140),
  optionLabel: document.querySelector('.route-opt .opt-label')?.textContent,
}));
console.log('via result:', JSON.stringify(via));

// 4) The stitched route passes near the drop point (within ~300 m).
const nearDrop = await p.evaluate((drop) => {
  const sel = window.__gw.state.options[0];
  const R = 6371000, r = (d) => (d * Math.PI) / 180;
  const cos = Math.cos(r(40.38));
  return sel.coords.some((c) => {
    const dx = (c[0] - drop[0]) * 111320 * cos;
    const dy = (c[1] - drop[1]) * 111320;
    return dx * dx + dy * dy < 300 * 300;
  });
}, await p.evaluate(() => window.__gw.state.waypoint));
console.log('route passes near drop point:', nearDrop);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
pv.kill();
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  handle.count === 1 &&
  via.viaSource &&
  /Via waypoint|via/i.test(via.optionLabel || via.card || '') &&
  nearDrop;
console.log(pass ? '\nWAYPOINT PASS ✅ — drag re-routes through the drop point' : '\nWAYPOINT FAIL ❌');
process.exit(pass ? 0 : 1);
