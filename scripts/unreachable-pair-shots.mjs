// Test the disconnected-pair fallback path using the suggestion UI.
// The EXACT pair 35/50 (seed 20260827) is near Santaquin, UT → south of Provo.
// We use nearby city names to trigger the same component mismatch.
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout — force exit'); process.exit(2); }, 120000).unref();

const OUT = 'ux-shots';
const TS = new Date().toISOString().slice(0, 10);

const SCENARIOS = [
  { from: 'Santaquin, Utah', to: 'Gunnison, Utah', name: 'disconnected-fallback' },
  { from: 'Pleasant Grove, Utah', to: 'Salt Lake City, Utah', name: 'pg-to-slc' },
];

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3 },
];

async function pickSuggestion(page, inputSel, query) {
  await page.type(inputSel, query);
  await wait(1500);
  const clicked = await page.evaluate(() => {
    const el = document.querySelector('#suggestions .sugg');
    if (!el) return false;
    el.click();
    return true;
  });
  await wait(500);
  return clicked;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  for (const vp of VIEWPORTS) {
    for (const sc of SCENARIOS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor });
      const errors = [];
      const warnings = [];
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
        if (m.type() === 'warning') warnings.push(m.text());
      });
      page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

      await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
      await wait(2600);

      await page.evaluate(() => {
        const ob = document.querySelector('#obSkip'); if (ob) ob.click();
        const sp = document.querySelector('#splash'); if (sp) sp.remove();
      });
      await wait(300);

      // Pick from/to via suggestions
      const fromOk = await pickSuggestion(page, '#fromInput', sc.from);
      const toOk = await pickSuggestion(page, '#toInput', sc.to);
      console.log(`[${sc.name}] from: ${fromOk}, to: ${toOk}`);
      await wait(500);

      // Click Route
      await page.evaluate(() => {
        const btn = document.querySelector('#goBtn');
        if (btn) btn.click();
      });

      // Wait for route (Valhalla is slower, give it 30s)
      try {
        await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 30000 });
      } catch (e) {
        console.log(`[${sc.name}] route flag not set after 30s`);
      }
      await wait(2000);

      // Screenshot
      await page.screenshot({ path: `${OUT}/${TS}-${sc.name}-${vp.name}-routecard.png` });

      // Capture results
      const debug = await page.evaluate(() => window.__ghostwayDebug || null);
      const routeCard = await page.evaluate(() => {
        const card = document.querySelector('#routeCard') || document.querySelector('.route-card');
        if (!card) return { found: false };
        return { found: true, text: card.innerText?.slice(0, 600), hidden: card.hidden };
      });
      const status = await page.evaluate(() => {
        const s = document.querySelector('#status') || document.querySelector('.status');
        return s ? s.textContent.trim() : 'no status';
      });

      console.log(`[${sc.name}] debug:`, JSON.stringify(debug));
      console.log(`[${sc.name}] routeCard:`, JSON.stringify(routeCard));
      console.log(`[${sc.name}] status: "${status}"`);
      if (warnings.length) console.log(`[${sc.name}] WARNINGS:`, warnings.slice(0, 5));
      if (errors.length) console.log(`[${sc.name}] ERRORS:`, errors.slice(0, 5));

      await page.close();
    }
  }

  await browser.close();
  kill();
  console.log('DONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
