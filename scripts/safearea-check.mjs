// Hermetic guard: landscape/safe-area CSS — asserts the env(safe-area-inset-*)
// rules are live in the computed style (with 0-inset fallback = unchanged
// portrait geometry) and that the landscape left/right rules exist in dist CSS.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 800));

  const geo = await page.evaluate(() => {
    const cs = el => el ? getComputedStyle(el) : null;
    const topbar = cs(document.querySelector('#topbar'));
    const panel = cs(document.querySelector('.panel'));
    return {
      topbarLeft: topbar?.left, panelLeft: panel?.left, panelRight: panel?.right,
      panelVisible: !!document.querySelector('.panel')?.offsetWidth,
    };
  });

  // dist CSS must contain the new landscape-aware rules
  const fs = await import('node:fs');
  const cssFile = fs.readdirSync('dist/assets').find(f => f.endsWith('.css'));
  const css = fs.readFileSync(`dist/assets/${cssFile}`, 'utf8');
  const checks = {
    // 844px-wide landscape phone hits the min-width:720px branch → 16px offsets
    topbarLeft16: geo.topbarLeft === '16px',
    panelRight16: geo.panelRight === '16px',
    panelVisible: geo.panelVisible > 0,
    // dist CSS is minified (no space after comma) — match minified forms
    cssTopbarL: css.includes('max(10px,env(safe-area-inset-left))'),
    cssTopbarR: css.includes('max(10px,env(safe-area-inset-right))'),
    cssModalPad: css.includes('max(20px,env(safe-area-inset-right))'),
    cssDrawerPad: css.includes('max(16px,env(safe-area-inset-left))'),
    cssOnboardPad: css.includes('max(18px,env(safe-area-inset-left))'),
    cssRecenterR: css.includes('calc(12px + env(safe-area-inset-right))'),
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ geo, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('SAFE-AREA LANDSCAPE PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  await Promise.race([browser?.close(), new Promise(r => setTimeout(r, 4000))]);
  kill();
  process.exit(0);
}
