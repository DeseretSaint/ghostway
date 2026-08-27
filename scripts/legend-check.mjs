// E2E guard: the on-map camera legend (#legendBtn → #legendPanel) opens and
// closes, and shows the Flock / other-ALPR / density swatches. UX slot-B work:
// a user-facing explanation of what the camera dots mean (on-screen camera
// display). Mirrors escape-check.mjs (lib-preview spawn + watchdog/close race).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang under swiftshader/headless Chrome.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 800 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page.waitForFunction(() => {
      const s = document.querySelector('#splash');
      return !s || s.hidden;
    }, { timeout: 8000 });
  } catch { /* proceed */ }
  await wait(400);

  const hidden = (sel) => page.evaluate((s) => {
    const el = document.querySelector(s);
    return !el ? 'missing' : el.hidden;
  }, sel);
  const count = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);

  const out = {};
  out.btnExists = (await count('#legendBtn')) === 1;
  out.panelExists = (await count('#legendPanel')) === 1;
  out.hiddenInitially = (await hidden('#legendPanel')) === true;

  await click('#legendBtn');
  await wait(300);
  out.openAfterClick = (await hidden('#legendPanel')) === false;
  out.ariaExpanded = await page.evaluate(() => document.querySelector('#legendBtn').getAttribute('aria-expanded'));
  // Flock dot (#ff4d6d), other dot (#ffaa40), density swatch → 2 .legend-dot + 1 .legend-swatch.
  out.dots = await count('#legendPanel .legend-dot');
  out.swatch = await count('#legendPanel .legend-swatch');
  out.rows = await count('#legendPanel .legend-row');

  await click('#legendBtn');
  await wait(300);
  out.hiddenAfterSecondClick = (await hidden('#legendPanel')) === true;

  console.log(JSON.stringify(out, null, 2));
  const pass =
    out.btnExists && out.panelExists && out.hiddenInitially &&
    out.openAfterClick && out.ariaExpanded === 'true' &&
    out.dots === 2 && out.swatch === 1 && out.rows === 3 &&
    out.hiddenAfterSecondClick && errs.length === 0;
  if (errs.length) console.error('page errors:', errs);
  console.log(pass ? 'LEGEND-CHECK PASS' : 'LEGEND-CHECK FAIL');
  try { await Promise.race([browser.close(), wait(5000)]); } catch { }
  kill();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
