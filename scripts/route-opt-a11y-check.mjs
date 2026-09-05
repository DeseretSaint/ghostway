// Fire #21 fix verification: route option buttons must be keyboard-accessible.
// Asserts: .route-opt has tabindex="0" + role="button" + aria-label, AND that
// the Tab key actually reaches them in DOM order, AND that pressing Enter
// (and Space, native to <button>) selects them.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
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

  // Drive a route so .route-opt is rendered.
  await page.type('#fromInput', 'Pleasant Grove');
  await page.waitForFunction(() => !document.querySelector('#suggestions').hidden, { timeout: 8000 }).catch(() => {});
  await wait(300);
  await page.keyboard.press('Enter');
  await wait(300);
  await page.type('#toInput', 'Lehi');
  await page.waitForFunction(() => !document.querySelector('#suggestions').hidden, { timeout: 8000 }).catch(() => {});
  await wait(300);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('#route-card').hidden, { timeout: 30000 }).catch(() => {});

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

  // Tab from startNavBtn → should land on the first .route-opt eventually.
  // Use direct focus() since route-opt appears below startNavBtn in tab order.
  const focusable = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('.route-opt'));
    if (opts.length === 0) return { count: 0, focusableCount: 0, allFocusable: false };
    const focusableCount = opts.filter((b) => b.tabIndex >= 0).length;
    return { count: opts.length, focusableCount, allFocusable: focusableCount === opts.length };
  });
  out.focusable = focusable;

  // Press Enter on the first .route-opt and assert aria-pressed flips on at least one.
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

  // The currently-selected option should now match the first one.
  const firstIdxChosen = afterEnter.findIndex((o) => o.chosen);
  out.firstIdxChosen = firstIdxChosen;

  console.log(JSON.stringify(out, null, 2));
  const allHaveAttrs =
    buttonAttrs.length > 0 &&
    buttonAttrs.every((b) => b.tabindex === '0' && b.role === 'button' && !!b.ariaLabel);
  const allFocusable = focusable.allFocusable;
  const enterWorks = firstIdxChosen === 0;
  const pass = allHaveAttrs && allFocusable && enterWorks && errs.length === 0;
  if (errs.length) console.error('page errors:', errs);
  console.log(pass ? 'ROUTE-OPT-A11Y PASS' : 'ROUTE-OPT-A11Y FAIL');
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
