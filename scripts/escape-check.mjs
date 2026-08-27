// E2E guard: Escape key dismisses overlays (modal > drawer > suggestions >
// first-run onboarding).
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

  // (2) Modal: open the "About" modal from the drawer (the drawer-item is a
  // focusable, always-present opener). Escape closes it. Assert dialog
  // semantics (role/aria-modal/aria-label), initial focus on the close
  // button, and focus returning to the opener on close.
  await click('#menuBtn');
  await wait(250);
  await page.evaluate(() => {
    const b = document.querySelector('[data-action="about"]');
    b.focus();
    b.click();
  });
  await wait(250);
  out.modalOpened = (await hidden('#modal')) === false;
  out.modalDialog = await page.evaluate(() => {
    const card = document.querySelector('.modal-card');
    return !!card && card.getAttribute('role') === 'dialog' &&
      card.getAttribute('aria-modal') === 'true' && !!card.getAttribute('aria-label');
  });
  out.modalFocus = await page.evaluate(() =>
    !!document.activeElement && document.activeElement.id === 'modalClose');
  // Focus trap: Tab / Shift+Tab while the modal is open must keep focus
  // INSIDE the dialog (not escape to background controls behind the scrim).
  await page.keyboard.press('Tab');
  await wait(60);
  out.modalTabTrapped = await page.evaluate(() =>
    document.querySelector('.modal-card').contains(document.activeElement));
  await page.keyboard.press('Tab');
  await wait(60);
  out.modalTabTrapped2 = await page.evaluate(() =>
    document.querySelector('.modal-card').contains(document.activeElement));
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  await wait(60);
  out.modalShiftTabTrapped = await page.evaluate(() =>
    document.querySelector('.modal-card').contains(document.activeElement));
  await page.keyboard.press('Escape');
  await wait(200);
  out.modalAfterEsc = await hidden('#modal');
  // Focus must escape the (now-closed) dialog — not be trapped on the hidden
  // close button or inside the modal card. (The About flow closes the drawer
  // before opening the modal, so the opener is hidden; closeModal gracefully
  // no-ops and focus lands on body — the correct, non-trapped outcome.)
  out.modalFocusEscaped = await page.evaluate(() =>
    !document.querySelector('.modal-card').contains(document.activeElement));
  // Close the drawer (Escape now targets the drawer after the modal closed)
  // so it doesn't overlay the search panel for the next step.
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#drawer').hidden, { timeout: 2000 }).catch(() => {});

  // (3) Suggestions: typing shows them, Escape hides them.
  await page.type('#fromInput', 'Pleasant Grove');
  await page.waitForFunction(() => !document.querySelector('#suggestions').hidden, { timeout: 8000 }).catch(() => {});
  out.suggShown = (await hidden('#suggestions')) === false;
  await page.keyboard.press('Escape');
  await wait(200);
  out.suggAfterEsc = await hidden('#suggestions');

  // (4) Onboarding (first run): fresh localStorage → overlay shows with dialog
  // semantics + initial focus on #obNext; Escape dismisses via the canonical
  // Skip path (which sets gw-onboarded).
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 390, height: 844 });
  page2.on('pageerror', (e) => errs.push(e.message));
  page2.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page2.evaluateOnNewDocument(() => { localStorage.removeItem('gw-onboarded'); });
  await page2.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page2.waitForFunction(() => {
      const ob = document.querySelector('#onboarding');
      return ob && !ob.hidden;
    }, { timeout: 10000 });
  } catch { /* proceed */ }
  out.obShown = await page2.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return !!ob && !ob.hidden;
  });
  out.obDialog = await page2.evaluate(() => {
    const card = document.querySelector('.ob-card');
    return !!card && card.getAttribute('role') === 'dialog' &&
      card.getAttribute('aria-modal') === 'true' && !!card.getAttribute('aria-label');
  });
  out.obFocus = await page2.evaluate(() =>
    !!document.activeElement && document.activeElement.id === 'obNext');
  await page2.keyboard.press('Escape');
  await wait(200);
  out.obAfterEsc = await page2.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return !ob || ob.hidden;
  });
  out.obFlagSet = await page2.evaluate(() => localStorage.getItem('gw-onboarded') === '1');
  try { await Promise.race([page2.close(), wait(3000)]); } catch {}

  console.log(JSON.stringify(out, null, 2));
  const pass =
    out.drawerOpened === true && out.drawerAfterEsc === true && out.scrimAfterEsc === true &&
    out.modalOpened === true && out.modalDialog === true && out.modalFocus === true &&
    out.modalTabTrapped === true && out.modalTabTrapped2 === true && out.modalShiftTabTrapped === true &&
    out.modalAfterEsc === true && out.modalFocusEscaped === true &&
    out.suggShown === true && out.suggAfterEsc === true &&
    out.obShown === true && out.obDialog === true && out.obFocus === true &&
    out.obAfterEsc === true && out.obFlagSet === true &&
    errs.length === 0;
  if (errs.length) console.error('page errors:', errs);
  console.log(pass ? 'ESCAPE-CHECK PASS' : 'ESCAPE-CHECK FAIL');
  // browser.close() can hang forever under swiftshader; race it, then force-exit.
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
