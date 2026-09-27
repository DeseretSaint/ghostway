// Q122 OS text-scaling respect: typography must be rem/em so an installed
// iPhone PWA inherits the system font size (WebKit -apple-system-body), and
// layouts must survive the TOP of the iOS Larger Text range (AX5 ≈ 312%).
// Gate: zero px font-size in the shipped CSS; no horizontal overflow at 200%
// and 312%; primary button labels not horizontally clipped at 312%.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  // 1. Mechanical CSS gate: every font-size WE author is rem/em so installed
  // PWAs inherit OS text size. Upstream MapLibre's bundled stylesheet ships px
  // chrome type — allowed, but only for .maplibregl-* selectors (we override
  // the visible ones: ctrl-scale, ctrl-attrib).
  const cssFile = fs.readdirSync('dist/assets').find(f => f.endsWith('.css'));
  const css = fs.readFileSync(`dist/assets/${cssFile}`, 'utf8');
  const pxFatRules = [...css.matchAll(/([^{}]+)\{[^}]*font-size:\s*[\d.]+px/g)]
    .map(m => m[1].trim())
    .filter(sel => !sel.includes('maplibregl'));
  const ourSource = fs.readFileSync('src/styles.css', 'utf8');
  const pxFonts = ourSource.match(/font-size:\s*[\d.]+px/g) || [];

  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'), { timeout: 15000 });

  const scaleProbe = (rootPx) => page.evaluate((rp) => {
    document.documentElement.style.fontSize = rp;
    return new Promise(res => setTimeout(() => {
      const de = document.scrollingElement;
      const bodyOverflow = de.scrollWidth - de.clientWidth;
      // Primary buttons must not clip their labels horizontally.
      const clipped = [];
      for (const btn of document.querySelectorAll('button, .route-opt, .mode-btn')) {
        if (!btn.offsetWidth || !btn.textContent.trim()) continue;
        if (btn.scrollWidth > btn.clientWidth + 2) clipped.push((btn.id || btn.className) + ':' + btn.scrollWidth + '>' + btn.clientWidth);
      }
      res({ rootPx: rp, bodyOverflow, clipped });
    }, 120));
  }, rootPx);

  const at100 = await scaleProbe('16px');
  const at200 = await scaleProbe('32px');
  const at312 = await scaleProbe('49.92px');
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

  const checks = {
    zeroPxFontSizes: pxFonts.length === 0 && pxFatRules.length === 0,
    noHOverflow100: at100.bodyOverflow <= 1,
    noHOverflow200: at200.bodyOverflow <= 1,
    noHOverflow312: at312.bodyOverflow <= 1,
    noClippedButtons312: at312.clipped.length === 0,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ pxFonts: pxFonts.slice(0, 5), at100, at200, at312, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('TEXT SCALE PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
