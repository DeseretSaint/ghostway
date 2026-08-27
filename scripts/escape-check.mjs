// E2E guard: Escape key dismisses overlays (modal > drawer > suggestions).
// Keyboard accessibility — mouse users have the × buttons and scrim; keyboard
// users had no way to dismiss the drawer/modal. Verifies the real close path
// (the handler clicks the canonical close buttons, so scrim/animation logic
// in main.js is exercised, not bypassed).
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
  // Returning user: skip first-run onboarding overlay.
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
  // In-page click (CDP click can fail when an overlay edge covers the button;
  // the handler only cares that the click event fired — same as shot.mjs).
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);

  const out = {};

  // (1) Drawer: open via menu button, Escape closes it (closeDrawer plays the
  // exit animation then hides — allow up to ~600ms for animationend/timeout).
  await click('#menuBtn');
  await wait(250);
  out.drawerOpened = (await hidden('#drawer')) === false;
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#drawer').hidden, { timeout: 2000 }).catch(() => {});
  out.drawerAfterEsc = await hidden('#drawer');
  out.scrimAfterEsc = await hidden('#scrim');

  // (2) Modal: open the "why?" info modal, Escape closes it.
  await click('#camInfoBtn');
  await wait(250);
  out.modalOpened = (await hidden('#modal')) === false;
  await page.keyboard.press('Escape');
  await wait(200);
  out.modalAfterEsc = await hidden('#modal');

  // (3) Suggestions: typing shows them, Escape hides them.
  await page.type('#fromInput', 'Pleasant Grove');
  await page.waitForFunction(() => !document.querySelector('#suggestions').hidden, { timeout: 8000 }).catch(() => {});
  out.suggShown = (await hidden('#suggestions')) === false;
  await page.keyboard.press('Escape');
  await wait(200);
  out.suggAfterEsc = await hidden('#suggestions');

  console.log(JSON.stringify(out, null, 2));
  const pass =
    out.drawerOpened === true && out.drawerAfterEsc === true && out.scrimAfterEsc === true &&
    out.modalOpened === true && out.modalAfterEsc === true &&
    out.suggShown === true && out.suggAfterEsc === true &&
    errs.length === 0;
  if (errs.length) console.error('page errors:', errs);
  console.log(pass ? 'ESCAPE-CHECK PASS' : 'ESCAPE-CHECK FAIL');
  // browser.close() can hang forever under swiftshader; race it, then force-exit.
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
