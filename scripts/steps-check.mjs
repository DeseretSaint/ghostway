// Hermetic turn-by-turn directions sheet E2E (slot-B): start a real route,
// tap the nav banner to open the full maneuver list, and assert the sheet
// renders one row per step, highlights the current step, and closes via the
// close button + Escape. Spawns its own preview (round-23 pattern) so it runs
// standalone with no orphan vite servers.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const pv = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

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
  try {
    await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 });
    await p.click('#suggestions .sugg:not(.sugg-recent)');
  } catch {
    await p.focus(inputSel);
    await p.keyboard.press('Enter');
  }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 30000 });
await p.click('#startNavBtn');
await wait(600);

// Sheet should be hidden before we tap the banner.
const hiddenBefore = await p.evaluate(() => document.querySelector('#stepsSheet').hidden);
// Tap the banner's maneuver text (not a button) to open the list.
await p.click('#navBanner .nav-step');
await wait(300);
const open = await p.evaluate(() => {
  const sheet = document.querySelector('#stepsSheet');
  const rows = document.querySelectorAll('#stepsList .steps-row');
  const cur = document.querySelectorAll('#stepsList .steps-row.current');
  return {
    hidden: sheet.hidden,
    rows: rows.length,
    current: cur.length,
    steps: (window.__gw._navSteps || []).length,
  };
});
// Close via the close button.
await p.click('#stepsClose');
await wait(200);
const closed1 = await p.evaluate(() => document.querySelector('#stepsSheet').hidden);
// Re-open then close via Escape.
await p.click('#navBanner .nav-step');
await wait(200);
await p.keyboard.press('Escape');
await wait(200);
const closed2 = await p.evaluate(() => document.querySelector('#stepsSheet').hidden);

console.log('hiddenBefore:', hiddenBefore, '| open:', JSON.stringify(open), '| closedBtn:', closed1, '| closedEsc:', closed2);
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 4));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  hiddenBefore === true &&
  open.hidden === false &&
  open.rows === open.steps &&
  open.rows >= 3 &&
  open.current === 1 &&
  closed1 === true &&
  closed2 === true &&
  errs.filter((e) => !/favicon|404/.test(e)).length === 0;
console.log(pass ? '\nSTEPS-SHEET PASS ✅ — tap banner opens full maneuver list, current step highlighted, closes via button + Escape' : '\nSTEPS-SHEET FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);
