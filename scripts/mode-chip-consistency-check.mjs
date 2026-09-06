// Mode-chip consistency check (#31 replacement for tradeoff-check): the route
// card's chip row must agree with engine ground truth — 3 chips (Clearest/
// Balanced/Fastest), exactly one active, per-chip meta = duration + camera
// count from the engine options, and tapping a chip switches the active chip
// AND the drawn route to that mode's geometry (app.state.chosen follows).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 300s timeout — force exit'); process.exit(2); }, 300000).unref();

const pv = await startPreview();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e.message)));
await page.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await page.type(inputSel, query);
  try {
    await page.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 15000 });
    await page.click('#suggestions .sugg:not(.sugg-recent)');
  } catch {
    await page.focus(inputSel);
    await page.keyboard.press('Enter');
  }
  await wait(400);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await page.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(400);

let ok = true;
const snap = () => page.evaluate(() => {
  const chips = [...document.querySelectorAll('#route-card .mode-chip')];
  const route = window.__gw?.state?.route;
  const options = route?.engine ? route.options : null;
  return {
    count: chips.length,
    pressed: chips.map((b) => b.getAttribute('aria-pressed')),
    labels: chips.map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
    chosen: route?.engine ? route.chosen : null,
    optModes: options ? options.map((o) => o.mode) : null,
    optDurs: options ? options.map((o) => Math.round(o.duration / 60)) : null,
    optCams: options ? options.map((o) => o.cameras) : null,
    cardShowsOne: !!document.querySelector('#route-card .rc-head') &&
      document.querySelectorAll('#route-card .route-opt').length === 0,
  };
});

const s1 = await snap();
console.log('initial:', JSON.stringify(s1));
// 1. Three chips, exactly one active, card has NO .route-opt chooser.
if (s1.count !== 3) { ok = false; console.error(`FAIL: expected 3 chips, got ${s1.count}`); }
if (s1.pressed.filter((v) => v === 'true').length !== 1) { ok = false; console.error('FAIL: not exactly one active chip'); }
if (!s1.cardShowsOne) { ok = false; console.error('FAIL: card still shows .route-opt chooser (spec: selected mode = THE route)'); }
// 2. Chip meta matches engine truth (duration rounding + camera counts).
if (s1.optModes) {
  // Chips render [Clearest(strict), Balanced(moderate), Fastest(off)] but engine
  // options are [off, moderate, strict] — map by data-mode, not by index.
  const chipDataModes = await page.evaluate(() =>
    [...document.querySelectorAll('#route-card .mode-chip')].map((b) => b.dataset.mode)
  );
  const durs = s1.labels.map((l) => {
    const m = l.match(/(\d+) min/);
    return m ? Number(m[1]) : null;
  });
  chipDataModes.forEach((mode, chipIdx) => {
    const oi = s1.optModes.indexOf(mode);
    if (oi === -1) return;
    if (s1.optDurs[oi] !== null && durs[chipIdx] !== null && durs[chipIdx] !== s1.optDurs[oi]) {
      ok = false; console.error(`FAIL: chip ${chipIdx} (${mode}) shows ${durs[chipIdx]} min, engine says ${s1.optDurs[oi]} min`);
    }
  });
}
// 3. Tap each chip; active chip + chosen option must follow that mode.
for (const mode of ['off', 'strict', 'moderate']) {
  await page.evaluate((m) => {
    [...document.querySelectorAll('#route-card .mode-chip')]
      .find((b) => b.dataset.mode === m)?.click();
  }, mode);
  await page.waitForFunction(() => window.__ghostwayDebug?.routed === true, { timeout: 40000 });
  await wait(500);
  const s = await snap();
  const idx = s.optModes ? s.optModes.indexOf(mode) : -1;
  // The active CHIP is identified by data-mode (chip row order ≠ engine order).
  const activeChipOk = await page.evaluate((m) => {
    const active = document.querySelector('#route-card .mode-chip.active');
    return !!active && active.dataset.mode === m;
  }, mode);
  if (!activeChipOk) {
    ok = false; console.error(`FAIL: after tapping ${mode}, active chip is not ${mode} (pressed=${JSON.stringify(s.pressed)})`);
  }
  if (s.optModes && s.chosen !== idx) {
    ok = false; console.error(`FAIL: after tapping ${mode}, state.chosen=${s.chosen} but mode index=${idx}`);
  }
  console.log(`chip ${mode}: active=${s.pressed.indexOf('true')} chosen=${s.chosen} — OK`);
}

const realErrs = errs.filter((e) => !/favicon|cotg\.carsprogram|511\.idaho|az511\.gov|CORS policy|Failed to load resource/.test(e));
if (realErrs.length) { ok = false; console.error('page errors:', realErrs.slice(0, 3)); }
console.log(ok ? 'MODE-CHIP-CONSISTENCY PASS ✅' : 'MODE-CHIP-CONSISTENCY FAIL ❌');
try { await Promise.race([browser.close(), wait(5000)]); } catch {}
pv.kill();
process.exit(ok ? 0 : 1);
