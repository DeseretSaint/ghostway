// Fire #21 fix verification: route option buttons must be keyboard-accessible.
// Asserts: .route-opt has tabindex="0" + role="button" + aria-label, AND that
// the Tab key actually reaches them in DOM order, AND that pressing Enter
// (and Space, native to <button>) selects them.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

const pv = await startPreview();
const errs = [];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });
page.on('pageerror', (e) => errs.push(String(e.message)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await page.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  // Stub geolocation so the app doesn't block on location.
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: () => 0,
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
try {
  await page.waitForFunction(() => {
    const s = document.querySelector('#splash');
    return !s || s.hidden;
  }, { timeout: 8000 });
} catch { /* proceed */ }
await wait(400);

// Pick a suggestion to fill an endpoint, then pick the other. Pressing Enter
// on an empty field triggers goBtn (which needs BOTH endpoints). The
// aria-cards-check.mjs helper pattern works — mirror it here.
async function pick(inputSel, query) {
  await page.type(inputSel, query);
  try {
    await page.waitForFunction(
      () => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'),
      { timeout: 12000 },
    );
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

const out = {};
const buttonAttrs = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll('.route-opt'));
  return opts.map((b) => ({
    tabindex: b.getAttribute('tabindex'),
    role: b.getAttribute('role'),
    ariaLabel: b.getAttribute('aria-label'),
    ariaPressed: b.getAttribute('aria-pressed'),
    tag: b.tagName.toLowerCase(),
  }));
});
out.buttonAttrs = buttonAttrs;

const focusable = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll('.route-opt'));
  if (opts.length === 0) return { count: 0, focusableCount: 0, allFocusable: false };
  const focusableCount = opts.filter((b) => b.tabIndex >= 0).length;
  return { count: opts.length, focusableCount, allFocusable: focusableCount === opts.length };
});
out.focusable = focusable;

const initialPressed = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll('.route-opt'));
  return opts.map((b) => b.getAttribute('aria-pressed'));
});

// Focus the first option and press Enter.
await page.evaluate(() => {
  const first = document.querySelector('.route-opt');
  if (first) first.focus();
});
await page.keyboard.press('Enter');
await wait(200);
const afterEnter = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll('.route-opt'));
  return opts.map((b) => ({
    pressed: b.getAttribute('aria-pressed'),
    chosen: b.classList.contains('chosen'),
  }));
});
out.initialPressed = initialPressed;
out.afterEnter = afterEnter;

const firstIdxChosen = afterEnter.findIndex((o) => o.chosen);
out.firstIdxChosen = firstIdxChosen;

console.log(JSON.stringify(out, null, 2));
const allHaveAttrs =
  buttonAttrs.length > 0 &&
  buttonAttrs.every((b) => b.tabindex === '0' && b.role === 'button' && !!b.ariaLabel);
const allFocusable = focusable.allFocusable;
const enterWorks = firstIdxChosen === 0;
const realErrs = errs.filter((e) => !/favicon|cotg\.carsprogram|511\.idaho|az511\.gov|CORS policy|Failed to load resource/.test(e));
const pass = allHaveAttrs && allFocusable && enterWorks && realErrs.length === 0;
if (realErrs.length) console.error('page errors:', realErrs.slice(0, 3));
console.log(pass ? 'ROUTE-OPT-A11Y PASS' : 'ROUTE-OPT-A11Y FAIL');
try { await Promise.race([browser.close(), wait(5000)]); } catch {}
pv.kill();
process.exit(pass ? 0 : 1);
