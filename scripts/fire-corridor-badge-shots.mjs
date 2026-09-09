// Fire corridor badge-truth v6 — reload page per corridor for clean state.
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

async function driveCorridor(browser, url, c) {
  console.log(`\n=== ${c.label} ===`);
  const page = await browser.newPage();
  await page.setViewport({ width: VP.width, height: VP.height, deviceScaleFactor: VP.deviceScaleFactor });
  
  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') {
      logs.push(`[error] ${m.text()}`);
      console.log('CONSOLE_ERR:', m.text());
    }
  });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

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

  // Read card state
  const cardState = await page.evaluate(() => {
    const card = document.querySelector('#route-card');
    const debug = window.__ghostwayDebug;
    
    // Read mode chips
    const chips = document.querySelectorAll('.mode-chip');
    const chipData = Array.from(chips).map(c => ({
      mode: c.dataset.mode,
      text: c.textContent.trim().replace(/\s+/g, ' '),
      active: c.classList.contains('active')
    }));
    
    // Read headline
    const time = card?.querySelector('.rc-time')?.textContent;
    const arrive = card?.querySelector('.rc-arrive')?.textContent;
    const dist = card?.querySelector('.rc-dist')?.textContent;
    const badge = card?.querySelector('.rc-badge')?.textContent?.trim()?.replace(/\s+/g, ' ');
    
    return {
      cardText: card ? card.textContent.trim().replace(/\s+/g, ' ').substring(0, 400) : 'NO_CARD',
      cardHidden: card ? card.hidden : 'NO_CARD',
      chips: chipData,
      headline: { time, arrive, dist, badge },
      debug: debug || 'NO_DEBUG'
    };
  });
  
  console.log(`${c.label} routed:`, routed);
  console.log(`${c.label} chips:`, JSON.stringify(cardState.chips));
  console.log(`${c.label} headline:`, JSON.stringify(cardState.headline));
  
  // Screenshot
  const file = `${OUT}/2026-09-09-fire-corridor-${c.label}-390.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);
  
  await page.close();
  return { corridor: c.label, routed, cardState, logs };
}

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
    const r = await driveCorridor(browser, url, c);
    results.push(r);
  }

  writeFileSync(`${OUT}/2026-09-09-fire-corridor-results.json`, JSON.stringify(results, null, 2));
  await browser.close();
  kill();
  console.log('\nDONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
