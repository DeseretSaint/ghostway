// Report-a-camera E2E: drawer → report modal → map placement (real click) →
// form → save → purple marker renders → persisted in localStorage. OSM
// publish is deliberately NOT exercised here (anonymous note creation on a
// shared public database should stay a human decision; the API call shape is
// covered separately).
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
await wait(1500);

// 1) Open drawer, hit-test the report button.
await p.click('#menuBtn');
await wait(500);
const reportHit = await p.evaluate(() => {
  const el = [...document.querySelectorAll('.drawer-item')].find((x) => x.dataset.action === 'report');
  if (!el) return 'missing';
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  // A hit on a descendant (SVG icon inside the button) still activates it.
  return top && (top === el || el.contains(top)) ? 'hit' : top ? top.tagName : 'none';
});
console.log('report button hit-test:', reportHit);
await p.click('.drawer-item[data-action="report"]');
await wait(500);
const introShown = await p.evaluate(() => !document.querySelector('#modal').hidden && /Report a camera/.test(document.querySelector('#modal').innerText));
console.log('intro modal shown:', introShown);

// 2) Enter placement mode and tap a real map point (real click, mid-map).
await p.click('#reportPick');
await wait(400);
const placing = await p.evaluate(() => window.__gw._reportMode === true);
console.log('placement mode:', placing);
await p.mouse.click(195, 350);
await wait(600);

// 3) Form appears; fill and save (hit-tested buttons).
const formShown = await p.evaluate(() => {
  const m = document.querySelector('#modal');
  return !m.hidden && !!document.querySelector('#rpKind') && !!document.querySelector('#rpBrand');
});
console.log('form shown:', formShown);
await p.select('#rpKind', 'alpr');
await p.type('#rpBrand', 'Test Flock');
await p.type('#rpNote', 'e2e test camera');
const saveHit = await p.evaluate(() => {
  const el = document.querySelector('#rpSave');
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return top && (top === el || el.contains(top)) ? 'hit' : top ? top.tagName : 'none';
});
console.log('save button hit-test:', saveHit);
await p.click('#rpSave');
await wait(500);

// 4) Publish offer appears — choose "Keep it local" (never auto-publish).
const offerShown = await p.evaluate(() => !document.querySelector('#modal').hidden && !!document.querySelector('#pubNo'));
console.log('publish offer shown:', offerShown);
await p.click('#pubNo');
await wait(400);

// 5) Persistence + marker.
const state = await p.evaluate(() => {
  const stored = JSON.parse(localStorage.getItem('gw-reports') || '[]');
  const src = window.__gw.map.map.getSource('reports');
  const feats = src && src._data ? src._data.features : [];
  return { storedCount: stored.length, kind: stored[0] && stored[0].kind, brand: stored[0] && stored[0].brand, markerCount: feats.length };
});
console.log('state:', JSON.stringify(state));

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  reportHit === 'hit' && introShown && placing && formShown &&
  saveHit === 'hit' && offerShown &&
  state.storedCount === 1 && state.kind === 'alpr' && state.brand === 'Test Flock' &&
  state.markerCount === 1;
console.log(pass ? '\nREPORT-FLOW PASS ✅ — report saved locally, marker rendered' : '\nREPORT-FLOW FAIL ❌');
process.exit(pass ? 0 : 1);
