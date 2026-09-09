// Fire corridor route-trace v5 — full logging of geocode + route pipeline.
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

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

  const page = await browser.newPage();
  await page.setViewport({ width: VP.width, height: VP.height, deviceScaleFactor: VP.deviceScaleFactor });
  
  // Capture ALL console logs
  const allLogs = [];
  page.on('console', (m) => {
    const entry = `[${m.type()}] ${m.text()}`;
    allLogs.push(entry);
    if (m.type() === 'error') console.log('CONSOLE_ERR:', m.text());
  });
  page.on('pageerror', (e) => {
    allLogs.push(`[pageerror] ${e.message}`);
    console.log('PAGE_ERR:', e.message);
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(2600);
  await page.evaluate(() => {
    const ob = document.querySelector('#obSkip'); if (ob) ob.click();
    const sp = document.querySelector('#splash'); if (sp) sp.remove();
  });
  await wait(500);

  const results = [];

  for (const c of CORRIDORS) {
    console.log(`\n=== ${c.label} ===`);
    
    // Clear inputs
    await page.evaluate(() => {
      const fi = document.querySelector('#fromInput');
      const ti = document.querySelector('#toInput');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (fi) { nativeSetter.call(fi, ''); fi.dispatchEvent(new Event('input', { bubbles: true })); }
      if (ti) { nativeSetter.call(ti, ''); ti.dispatchEvent(new Event('input', { bubbles: true })); }
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
    
    // Capture input values BEFORE clicking go
    const inputVals = await page.evaluate(() => ({
      from: document.querySelector('#fromInput')?.value,
      to: document.querySelector('#toInput')?.value
    }));
    console.log('inputs before go:', inputVals);
    
    // Click go
    await page.evaluate(() => {
      const go = document.querySelector('#goBtn');
      if (go) go.click();
    });

    // Wait for route flag
    let routed = false;
    try {
      await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
      routed = true;
    } catch (e) {
      console.log(`warn: ${c.label} route flag NOT set`);
    }
    await wait(2500);

    // Read app state
    const appState = await page.evaluate(() => {
      const app = window.__ghostwayApp || window.app || window.ghostway;
      const card = document.querySelector('#route-card');
      return {
        cardText: card ? card.textContent.trim().replace(/\s+/g, ' ').substring(0, 400) : 'NO_CARD',
        cardHidden: card ? card.hidden : 'NO_CARD',
        cardChildren: card ? card.children.length : -1,
        debug: window.__ghostwayDebug || 'NO_DEBUG',
        appState: app?.state ? {
          from: app.state.from?.label || app.state.from?.coords || 'null',
          to: app.state.to?.label || app.state.to?.coords || 'null',
          optionsCount: app.state.options?.length || 0,
          routeEngine: app.state.route?.engine || false,
          chosen: app.state.chosen
        } : 'NO_APP'
      };
    });
    
    console.log(`${c.label} routed:`, routed);
    console.log(`${c.label} appState:`, JSON.stringify(appState.appState));
    console.log(`${c.label} cardHidden:`, appState.cardHidden);
    console.log(`${c.label} cardText:`, appState.cardText);
    
    // Screenshot
    const file = `${OUT}/2026-09-09-fire-corridor-${c.label}-390.png`;
    await page.screenshot({ path: file });
    console.log('saved', file);
    
    results.push({ corridor: c.label, routed, appState });
  }

  writeFileSync(`${OUT}/2026-09-09-fire-corridor-trace.json`, JSON.stringify(results, null, 2));
  writeFileSync(`${OUT}/2026-09-09-fire-corridor-all-logs.log`, allLogs.join('\n'));
  await browser.close();
  kill();
  console.log('\nDONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
