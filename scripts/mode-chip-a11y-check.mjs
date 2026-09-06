// Mode-chip a11y check (#31 rewrite of route-opt-a11y-check): the route card's
// .mode-chip row must be keyboard-operable with correct ARIA radiogroup
// semantics — tabindex="0", role="button", aria-label per chip, aria-pressed
// on exactly the active mode, and Enter on a chip switches modes (card
// re-renders with the new active chip).
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

const out = {};
const chipAttrs = await page.evaluate(() => {
  const chips = Array.from(document.querySelectorAll('.mode-chip'));
  return chips.map((b) => ({
    tabindex: b.getAttribute('tabindex'),
    role: b.getAttribute('role'),
    ariaLabel: b.getAttribute('aria-label'),
    ariaPressed: b.getAttribute('aria-pressed'),
    tag: b.tagName.toLowerCase(),
  }));
});
out.chipAttrs = chipAttrs;

const focusable = await page.evaluate(() => {
  const chips = Array.from(document.querySelectorAll('.mode-chip'));
  if (chips.length === 0) return { count: 0, focusableCount: 0, allFocusable: false };
  const focusableCount = chips.filter((b) => b.tabIndex >= 0).length;
  return { count: chips.length, focusableCount, allFocusable: focusableCount === chips.length };
});
out.focusable = focusable;

const initialPressed = await page.evaluate(() =>
  Array.from(document.querySelectorAll('.mode-chip')).map((b) => b.getAttribute('aria-pressed'))
);
out.initialPressed = initialPressed;

// Focus a non-active chip and press Enter — mode must switch (re-route) and
// the chip row must re-render with the new active chip.
await page.evaluate(() => {
  const target = Array.from(document.querySelectorAll('.mode-chip'))
    .find((b) => b.getAttribute('aria-pressed') !== 'true');
  if (target) target.focus();
});
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__ghostwayDebug?.routed === true, { timeout: 40000 });
await wait(600);
const afterEnter = await page.evaluate(() => {
  const chips = Array.from(document.querySelectorAll('.mode-chip'));
  return {
    count: chips.length,
    pressed: chips.map((b) => b.getAttribute('aria-pressed')),
    exactlyOneActive: chips.filter((b) => b.getAttribute('aria-pressed') === 'true').length === 1,
  };
});
out.afterEnter = afterEnter;

console.log(JSON.stringify(out, null, 2));
const allHaveAttrs =
  chipAttrs.length === 3 &&
  chipAttrs.every((b) => b.tabindex === '0' && b.role === 'button' && !!b.ariaLabel);
const allFocusable = focusable.allFocusable && focusable.count === 3;
const pressedOk =
  initialPressed.filter((v) => v === 'true').length === 1 && afterEnter.exactlyOneActive;
const switchedOk = JSON.stringify(initialPressed) !== JSON.stringify(afterEnter.pressed);
const realErrs = errs.filter((e) => !/favicon|cotg\.carsprogram|511\.idaho|az511\.gov|CORS policy|Failed to load resource/.test(e));
const pass = allHaveAttrs && allFocusable && pressedOk && switchedOk && realErrs.length === 0;
if (realErrs.length) console.error('page errors:', realErrs.slice(0, 3));
console.log(pass ? 'MODE-CHIP-A11Y PASS' : 'MODE-CHIP-A11Y FAIL');
try { await Promise.race([browser.close(), wait(5000)]); } catch {}
pv.kill();
process.exit(pass ? 0 : 1);
