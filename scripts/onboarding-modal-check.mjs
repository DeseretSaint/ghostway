// Fire #21 fix verification: #onboarding must have role=dialog + aria-modal +
// aria-label, AND its focusable elements must be trapped (Tab cycles within
// .ob-card, Shift+Tab reverses, Escape dismisses).
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

  // First-run onboarding path: no gw-onboarded in localStorage.
  await page.evaluateOnNewDocument(() => { localStorage.removeItem('gw-onboarded'); });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page.waitForFunction(() => {
      const ob = document.querySelector('#onboarding');
      return ob && !ob.hidden;
    }, { timeout: 10000 });
  } catch { /* proceed */ }
  await wait(400);

  const out = {};
  out.onboardingAttrs = await page.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return ob ? {
      role: ob.getAttribute('role'),
      ariaModal: ob.getAttribute('aria-modal'),
      ariaLabel: ob.getAttribute('aria-label'),
      hidden: ob.hidden,
    } : null;
  });
  out.initialFocus = await page.evaluate(() =>
    !!document.activeElement && document.activeElement.id === 'obNext');

  // Tab from initial focus → focus should stay inside .ob-card.
  await page.keyboard.press('Tab');
  await wait(60);
  out.tabInside = await page.evaluate(() => {
    const card = document.querySelector('.ob-card');
    return card && card.contains(document.activeElement);
  });
  // Press Tab a few more times to walk through the focusable elements, then
  // verify we're still inside .ob-card (i.e. trap held).
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    await wait(40);
  }
  out.tabStillInside = await page.evaluate(() => {
    const card = document.querySelector('.ob-card');
    return card && card.contains(document.activeElement);
  });

  // Shift+Tab backwards — should still stay inside.
  await page.keyboard.down('Shift');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    await wait(40);
  }
  await page.keyboard.up('Shift');
  out.shiftTabInside = await page.evaluate(() => {
    const card = document.querySelector('.ob-card');
    return card && card.contains(document.activeElement);
  });

  // Escape dismisses.
  await page.keyboard.press('Escape');
  await wait(200);
  out.afterEsc = await page.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return { hidden: !!ob?.hidden, flagSet: localStorage.getItem('gw-onboarded') === '1' };
  });

  console.log(JSON.stringify(out, null, 2));
  const pass =
    out.onboardingAttrs &&
    out.onboardingAttrs.role === 'dialog' &&
    out.onboardingAttrs.ariaModal === 'true' &&
    !!out.onboardingAttrs.ariaLabel &&
    out.onboardingAttrs.hidden === false &&
    out.initialFocus === true &&
    out.tabInside === true &&
    out.tabStillInside === true &&
    out.shiftTabInside === true &&
    out.afterEsc.hidden === true &&
    out.afterEsc.flagSet === true &&
    errs.length === 0;
  if (errs.length) console.error('page errors:', errs);
  console.log(pass ? 'ONBOARDING-MODAL PASS' : 'ONBOARDING-MODAL FAIL');
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
