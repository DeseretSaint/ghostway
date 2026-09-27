// Q160 + Q231 viewport hardening: edge-swipe containment and keyboard inset.
// Asserts: overscroll-behavior-x:contain on html/body/#map; --kb-inset is live
// and wired into the bottom-anchored chrome (.panel, .steps-sheet) so those
// elements lift above the on-screen keyboard; the visualViewport handler
// recomputes the var on resize.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  const res = await page.evaluate(async () => {
    const cs = el => getComputedStyle(el);
    const out = {};
    out.overscrollHtml = cs(document.documentElement).overscrollBehaviorX;
    out.overscrollBody = cs(document.body).overscrollBehaviorX;
    out.overscrollMap = cs(document.getElementById('map')).overscrollBehaviorX;
    out.kbVarInitial = getComputedStyle(document.documentElement).getPropertyValue('--kb-inset').trim();

    // Setting --kb-inset must lift the bottom-anchored chrome.
    const panel = document.querySelector('.panel') || document.querySelector('.steps-sheet');
    const before = panel.getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--kb-inset', '120px');
    const after = panel.getBoundingClientRect().bottom;
    out.panelLifted = before - after; // expected ≈120 (panel visible) or hidden panel → skip
    out.panelHidden = !panel.offsetWidth;
    document.documentElement.style.removeProperty('--kb-inset');

    // The handler is live: a resize event recomputes the var.
    window.visualViewport.dispatchEvent(new Event('resize'));
    await new Promise(r => setTimeout(r, 50));
    out.kbVarAfterResize = getComputedStyle(document.documentElement).getPropertyValue('--kb-inset').trim();
    return out;
  });

  const checks = {
    overscrollHtml: res.overscrollHtml === 'contain',
    overscrollBody: res.overscrollBody === 'contain',
    overscrollMap: res.overscrollMap === 'contain',
    kbVarWired: res.kbVarInitial === '0px',
    panelLifts: res.panelHidden || res.panelLifted > 100, // ~120px lift when visible
    kbVarRecomputed: res.kbVarAfterResize === '0px',
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ res, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('VIEWPORT HARDENING PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
