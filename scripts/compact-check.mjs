// Compact banner mode (C12 #126): the active-nav banner defaults to COMPACT
// (safety-first glance density) and the density toggle lives in the planning
// panel (route card) — NOT inside the active-nav banner where the driver
// shouldn't be fiddling with controls. Toggle switches to full mode (re-adds
// the "then" preview, speed-limit badge, progress bar, arrival clock) and
// persists across reloads.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const pv = await startPreview();

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
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 }); await p.click('#suggestions .sugg:not(.sugg-recent)'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });

// 1) Density toggle lives in the planning panel (route card), NOT the banner.
const cardDensity = await p.evaluate(() => {
  const card = document.querySelector('#densityBtn');
  if (!card) return 'missing';
  const inCard = !!card.closest('#route-card');
  const inBanner = !!card.closest('#navBanner');
  return { inCard, inBanner, text: card.textContent.trim() };
});
console.log('route-card density toggle:', JSON.stringify(cardDensity));

// Banner must NOT carry its own density toggle anymore.
const bannerDensity = await p.evaluate(() => {
  const banner = document.querySelector('#navBanner');
  return banner ? !!banner.querySelector('#densityBtn') : 'no-banner';
});
console.log('banner density toggle (should be false):', bannerDensity);

// Start nav → banner is in COMPACT mode (default).
await p.click('#startNavBtn');
await wait(600);
const compact = await p.evaluate(() => {
  const banner = document.querySelector('#navBanner');
  const elHidden = (sel) => {
    const el = banner.querySelector(sel);
    return !el || el.getClientRects().length === 0;
  };
  return {
    compact: banner.classList.contains('compact'),
    thenHidden: elHidden('.nav-then'),
    progressHidden: elHidden('.nav-progress'),
    arriveHidden: elHidden('.nav-arrive'),
    camClear: (banner.querySelector('#camChip')?.textContent || '').includes('Clear'),
    densityInBanner: !!banner.querySelector('#densityBtn'),
    height: banner.offsetHeight,
  };
});
console.log('compact mode (default):', JSON.stringify(compact));

// 2) Stop nav → density toggle in route card switches to full.
await p.click('#navStop');
await wait(400);
await p.waitForFunction(() => !document.querySelector('#route-card')?.hidden, { timeout: 8000 });

const densityHit = await p.evaluate(() => {
  const el = document.querySelector('#densityBtn');
  if (!el) return 'missing';
  // Scroll the route card so the density button (at the bottom) is in view.
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return top && (top === el || el.contains(top)) ? 'hit' : top ? top.tagName + (top.id ? '#' + top.id : '') : 'none';
});
console.log('density toggle hit-test:', densityHit);

await p.click('#densityBtn');
await wait(300);
const afterToggle = await p.evaluate(() => ({
  persisted: localStorage.getItem('gw-compact'),
  label: document.querySelector('#densityBtn')?.textContent.trim(),
}));
console.log('after planning-panel toggle:', JSON.stringify(afterToggle));

// Start nav again → banner must now be in FULL mode.
await p.click('#startNavBtn');
await wait(600);
const full = await p.evaluate(() => {
  const banner = document.querySelector('#navBanner');
  return {
    compact: banner.classList.contains('compact'),
    thenEls: !!banner.querySelector('.nav-then'),
    progressEls: !!banner.querySelector('.nav-progress'),
    height: banner.offsetHeight,
  };
});
console.log('full mode (after toggle):', JSON.stringify(full));

// 3) Reload — preference survives (still full).
await p.reload({ waitUntil: 'networkidle2' });
await wait(2500);
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await p.click('#startNavBtn');
await wait(600);
const afterReload = await p.evaluate(() => ({
  compact: document.querySelector('#navBanner').classList.contains('compact'),
  persisted: localStorage.getItem('gw-compact'),
}));
console.log('after reload:', JSON.stringify(afterReload));

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  // Density toggle lives in the route card.
  typeof cardDensity === 'object' && cardDensity.inCard && !cardDensity.inBanner &&
  // Banner does NOT carry its own density toggle.
  bannerDensity === false &&
  // Default is compact.
  compact.compact && compact.thenHidden && compact.progressHidden && compact.arriveHidden &&
  compact.camClear && !compact.densityInBanner &&
  // Toggle is hit-testable.
  densityHit === 'hit' &&
  // Toggle flipped to full.
  afterToggle.persisted === '0' &&
  // Full banner: then + progress visible.
  !full.compact && full.thenEls && full.progressEls &&
  full.height > compact.height &&
  // Reload preserves the preference (still full).
  !afterReload.compact && afterReload.persisted === '0';

console.log(pass ? '\nCOMPACT PASS ✅ — route-card density toggle, default compact, persists, hides chrome' : '\nCOMPACT FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);