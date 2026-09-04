// A11y: cards-open ARIA hooks — verify #route-card has role/aria-label, each
// .route-opt button toggles aria-pressed when selected, and .rc-head has
// aria-live="polite" so screen readers announce ETA changes.
//
// Round-23 ux item (manager round-23). Stubs geolocation like the other
// route-driving suites so we can render a real route card and assert the
// DOM contract.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout — force exit'); process.exit(2); }, 120000).unref();

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

// Drive a real route so the card renders.
async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try {
    await p.waitForFunction(
      () => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'),
      { timeout: 12000 }
    );
    await p.click('#suggestions .sugg:not(.sugg-recent)');
  } catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(400);

// 1) #route-card has role="region" + aria-label.
const regionMeta = await p.evaluate(() => {
  const card = document.querySelector('#route-card');
  return {
    exists: !!card,
    role: card?.getAttribute('role') || null,
    label: card?.getAttribute('aria-label') || null,
  };
});

// 2) .route-opt buttons exist with aria-pressed.
const initialBtns = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  return opts.map((b, i) => ({
    i,
    pressed: b.getAttribute('aria-pressed'),
    chosen: b.classList.contains('chosen'),
  }));
});

// 3) Click a non-chosen option and verify aria-pressed toggles.
const beforeClick = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  return opts.findIndex((b) => !b.classList.contains('chosen'));
});
await p.evaluate((i) => document.querySelectorAll('.route-opt')[i]?.click(), beforeClick);
await wait(300);
const afterClick = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  return opts.map((b, i) => ({ i, pressed: b.getAttribute('aria-pressed'), chosen: b.classList.contains('chosen') }));
});

// 4) .rc-head has aria-live="polite".
const headLive = await p.evaluate(() => {
  const head = document.querySelector('#route-card .rc-head');
  return { exists: !!head, live: head?.getAttribute('aria-live') || null, atomic: head?.getAttribute('aria-atomic') || null };
});

console.log('region:', JSON.stringify(regionMeta));
console.log('initial btns:', JSON.stringify(initialBtns));
console.log('clicked index:', beforeClick);
console.log('after click:', JSON.stringify(afterClick));
console.log('rc-head aria-live:', JSON.stringify(headLive));
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

// Pass criteria: route-card has role=region + aria-label, ≥2 route-opts with
// aria-pressed initially, exactly one is aria-pressed=true, clicking a
// non-chosen option toggles aria-pressed to the new chosen index, and
// .rc-head has aria-live=polite.
const pass =
  regionMeta.exists &&
  regionMeta.role === 'region' &&
  typeof regionMeta.label === 'string' &&
  regionMeta.label.length > 0 &&
  initialBtns.length >= 2 &&
  initialBtns.filter((b) => b.pressed === 'true').length === 1 &&
  afterClick.filter((b) => b.pressed === 'true').length === 1 &&
  afterClick[beforeClick].pressed === 'true' &&
  headLive.exists &&
  headLive.live === 'polite';

console.log(pass ? '\nARIA-CARDS PASS ✅ — route card has region/aria-label, options toggle aria-pressed, rc-head is aria-live' : '\nARIA-CARDS FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);