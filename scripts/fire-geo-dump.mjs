// Fire corridor geocode-dumper v7 — extract geocoded coords from UI.
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

const OUT = 'ux-shots';
const VP = { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3 };

const CORRIDORS = [
  { from: 'Pleasant Grove, Utah', to: 'Lindon, Utah', label: 'pg-lindon' },
  { from: 'Pleasant Grove, Utah', to: 'BYU Provo, Utah', label: 'pg-byu' },
  { from: 'Pleasant Grove, Utah', to: 'Downtown Salt Lake City, Utah', label: 'pg-downtown-slc' },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { kill, url } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  const results = [];
  
  for (const c of CORRIDORS) {
    console.log(`\n=== ${c.label} ===`);
    const page = await browser.newPage();
    await page.setViewport({ width: VP.width, height: VP.height, deviceScaleFactor: VP.deviceScaleFactor });
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await wait(2600);
    await page.evaluate(() => {
      const ob = document.querySelector('#obSkip'); if (ob) ob.click();
      const sp = document.querySelector('#splash'); if (sp) sp.remove();
    });
    await wait(500);

    // Type from
    await page.focus('#fromInput');
    await page.keyboard.type(c.from, { delay: 40 });
    await wait(1500);
    
    // Type to
    await page.focus('#toInput');
    await page.keyboard.type(c.to, { delay: 40 });
    await wait(1500);
    
    // Click go
    await page.evaluate(() => {
      const go = document.querySelector('#goBtn');
      if (go) go.click();
    });

    // Wait for route
    try {
      await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
    } catch (e) {}
    await wait(2500);

    // Read geocoded coords from app state
    const geo = await page.evaluate(() => {
      // Try multiple ways to get the app state
      const app = window.__ghostwayApp || window.app || window.ghostway;
      const from = app?.state?.from;
      const to = app?.state?.to;
      return {
        fromLabel: from?.label || from?.name || 'NO_LABEL',
        fromCoords: from?.coords || 'NO_COORDS',
        toLabel: to?.label || to?.name || 'NO_LABEL',
        toCoords: to?.coords || 'NO_COORDS'
      };
    });
    
    console.log(`${c.label} from:`, geo.fromLabel, '→', JSON.stringify(geo.fromCoords));
    console.log(`${c.label} to:`, geo.toLabel, '→', JSON.stringify(geo.toCoords));
    
    // Screenshot
    const file = `${OUT}/2026-09-09-fire-corridor-${c.label}-390.png`;
    await page.screenshot({ path: file });
    
    await page.close();
    results.push({ corridor: c.label, geo });
  }

  writeFileSync(`${OUT}/2026-09-09-fire-geo-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
  kill();
  console.log('\nDONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
