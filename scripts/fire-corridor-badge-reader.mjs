// Fire corridor badge-reader v4 — with mode chip check + full card dump.
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout — force exit'); process.exit(2); }, 120000).unref();

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
    
    // Clear inputs using native setter to trigger React state updates
    await page.evaluate(() => {
      const fi = document.querySelector('#fromInput');
      const ti = document.querySelector('#toInput');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      if (fi) { nativeInputValueSetter.call(fi, ''); fi.dispatchEvent(new Event('input', { bubbles: true })); }
      if (ti) { nativeInputValueSetter.call(ti, ''); ti.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await wait(500);

    // Type from
    await page.focus('#fromInput');
    await page.keyboard.type(c.from, { delay: 50 });
    await wait(1200);
    
    // Type to
    await page.focus('#toInput');
    await page.keyboard.type(c.to, { delay: 50 });
    await wait(1200);
    
    // Click go
    await page.evaluate(() => {
      const go = document.querySelector('#goBtn');
      if (go) go.click();
    });

    try {
      await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
    } catch (e) {
      console.log(`warn: ${c.label} route flag NOT set`);
    }
    await wait(2500);

    // Read full card state
    const cardState = await page.evaluate(() => {
      const result = {};
      
      // Mode chips
      const modeChips = document.querySelectorAll('[class*="mode-chip"], [class*="modeChip"], [data-mode]');
      result.modeChips = Array.from(modeChips).map(m => ({
        text: m.textContent.trim(),
        class: m.className,
        active: m.classList.contains('active') || m.getAttribute('aria-pressed') === 'true'
      }));
      
      // Selected mode
      const selectedMode = document.querySelector('.mode-chip.active, [data-mode].active, [aria-pressed="true"]');
      result.selectedMode = selectedMode ? selectedMode.textContent.trim() : 'UNKNOWN';
      
      // Route card full text
      const card = document.querySelector('#routeCard') || document.querySelector('.route-card');
      result.cardText = card ? card.textContent.trim().replace(/\s+/g, ' ') : 'NO_CARD';
      
      // Camera-related elements
      const camElements = document.querySelectorAll('[class*="cam"], [class*="camera"], [class*="badge"]');
      result.camElements = Array.from(camElements).map(e => ({
        tag: e.tagName,
        class: e.className,
        text: e.textContent.trim().substring(0, 50)
      })).slice(0, 15);
      
      // Debug
      result.debug = window.__ghostwayDebug || 'NO_DEBUG';
      
      // Full page text snippet
      result.pageSnippet = document.body.innerText.substring(0, 800).replace(/\s+/g, ' ');
      
      return result;
    });
    
    console.log(`${c.label} selectedMode:`, cardState.selectedMode);
    console.log(`${c.label} cardText:`, cardState.cardText);
    console.log(`${c.label} pageSnippet:`, cardState.pageSnippet.substring(0, 300));
    
    // Screenshot
    const file = `${OUT}/2026-09-09-fire-corridor-${c.label}-390.png`;
    await page.screenshot({ path: file });
    console.log('saved', file);
    
    results.push({ corridor: c.label, cardState });
  }

  writeFileSync(`${OUT}/2026-09-09-fire-corridor-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
  kill();
  console.log('\nDONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
