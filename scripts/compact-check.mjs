// Compact banner mode (Workstream D): density toggle switches the nav banner
// to a slim layout (no next-step preview / speed-limit sign), persists the
// preference, and survives a reload.
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
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await p.click('#startNavBtn');
await wait(600);

// 1) Full mode defaults: preview + speed limit present, no compact class.
const full = await p.evaluate(() => ({
  compact: document.querySelector('#navBanner').classList.contains('compact'),
  hasThen: !!document.querySelector('#navBanner .nav-then'),
  hasLimit: !!document.querySelector('#navBanner .speed-limit'),
  height: document.querySelector('#navBanner').offsetHeight,
}));
console.log('full mode:', JSON.stringify(full));

// 2) Hit-test the density toggle, then click it.
const hit = await p.evaluate(() => {
  const el = document.querySelector('#densityBtn');
  if (!el) return 'missing';
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  // A hit on a descendant (SVG icon inside the button) still activates it.
  return top && (top === el || el.contains(top)) ? 'hit' : top ? top.tagName + (top.id ? '#' + top.id : '') : 'none';
});
console.log('density button hit-test:', hit);
await p.click('#densityBtn');
await wait(400);

// 3) Compact mode: class on, preview + speed limit visually hidden.
const compact = await p.evaluate(() => ({
  compact: document.querySelector('#navBanner').classList.contains('compact'),
  thenHidden: (() => {
    const el = document.querySelector('#navBanner .nav-then');
    return !el || el.getClientRects().length === 0;
  })(),
  limitHidden: (() => {
    const el = document.querySelector('#navBanner .speed-limit');
    return !el || el.getClientRects().length === 0;
  })(),
  height: document.querySelector('#navBanner').offsetHeight,
  persisted: localStorage.getItem('gw-compact'),
}));
console.log('compact mode:', JSON.stringify(compact));

// 4) Reload — preference must survive.
await p.reload({ waitUntil: 'networkidle2' });
await wait(2500);
// Re-route after reload (state resets).
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await p.click('#startNavBtn');
await wait(600);
const afterReload = await p.evaluate(() => document.querySelector('#navBanner').classList.contains('compact'));
console.log('compact after reload:', afterReload);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  !full.compact && full.hasThen && full.hasLimit &&
  hit === 'hit' &&
  compact.compact && compact.thenHidden && compact.limitHidden &&
  compact.height < full.height &&
  compact.persisted === '1' &&
  afterReload;
console.log(pass ? '\nCOMPACT PASS ✅ — density toggle works, persists, slims the banner' : '\nCOMPACT FAIL ❌');
process.exit(pass ? 0 : 1);
