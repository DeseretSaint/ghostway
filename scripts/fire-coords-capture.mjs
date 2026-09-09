// Fire corridor coords-capture v8 — inject spy into planRoutes.
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
    
    // Inject a spy BEFORE page scripts run
    await page.evaluateOnNewDocument(() => {
      window.__fireCoords = [];
      // Patch console.log to capture route coords
      const origLog = console.log;
      console.log = (...args) => {
        const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
        if (msg.includes('from=') || msg.includes('to=') || msg.includes('planRoutes') || msg.includes('CAM-COUNT')) {
          window.__fireCoords.push(msg);
        }
        origLog.apply(console, args);
      };
    });
    
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

    // Read coords from spy
    const coords = await page.evaluate(() => ({
      fireCoords: window.__fireCoords,
      debug: window.__ghostwayDebug,
      cardText: document.querySelector('#route-card')?.textContent?.trim()?.replace(/\s+/g, ' ')?.substring(0, 400)
    }));
    
    console.log(`${c.label} spy logs:`, coords.fireCoords.length);
    coords.fireCoords.forEach(l => console.log('  LOG:', l.substring(0, 300)));
    console.log(`${c.label} cardText:`, coords.cardText);
    
    // Screenshot
    const file = `${OUT}/2026-09-09-fire-corridor-${c.label}-390.png`;
    await page.screenshot({ path: file });
    
    await page.close();
    results.push({ corridor: c.label, coords });
  }

  writeFileSync(`${OUT}/2026-09-09-fire-coords-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
  kill();
  console.log('\nDONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
