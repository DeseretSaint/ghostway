// Screenshot capture for Lehi corridor (camera-free badge) and BYU corridor (gate-snap)
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout'); process.exit(2); }, 180000).unref();

const OUT = 'ux-shots';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile-390-optcompact', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'mobile-375-optcompact', width: 375, height: 812, deviceScaleFactor: 3 },
  { name: 'desktop-1440-optcompact', width: 1440, height: 900, deviceScaleFactor: 1 },
];

async function captureCorridor(page, vp, from, to, label) {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(2600);

  await page.evaluate(() => {
    const ob = document.querySelector('#obSkip'); if (ob) ob.click();
    const sp = document.querySelector('#splash'); if (sp) sp.remove();
  });
  await wait(300);

  await page.type('#fromInput', from);
  await wait(900);
  await page.type('#toInput', to);
  await wait(900);
  await page.evaluate(() => document.querySelector('#goBtn').click());
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
  } catch (e) { console.log('warn: route flag not set'); }
  await wait(1400);

  const file = `${OUT}/${vp.name}-${label}.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);

  const domInfo = await page.evaluate(() => {
    const card = document.querySelector('#route-card');
    if (!card) return { error: 'no route-card' };
    const opts = Array.from(card.querySelectorAll('.route-opt'));
    return {
      optCount: opts.length,
      warnSpans: card.querySelectorAll('.opt-warn, .opt-trouble, .opt-warn-row').length,
      cameraCountChips: card.querySelectorAll('.opt-cams').length,
      camFreeBadge: !!card.querySelector('.opt-clear-badge'),
      naturalPill: !!card.querySelector('.opt-natural'),
      gateSnapLines: Array.from(card.querySelectorAll('.opt-warn')).map(s => s.textContent.trim()).filter(t => /clear to within/i.test(t)),
      optMetaCount: card.querySelectorAll('.opt-meta').length,
      cardText: card.innerText.substring(0, 2000),
    };
  });
  console.log(`[${vp.name}] ${label} DOM:`, JSON.stringify(domInfo, null, 2));
}

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor });
    await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
    
    // Lehi corridor (0-camera Clearest → camera-free badge)
    await captureCorridor(page, vp, 'Pleasant Grove, Utah', 'Costco, Lehi', 'lehi');
    
    // BYU corridor (Strict falls back → gate-snap)
    await captureCorridor(page, vp, 'Pleasant Grove, Utah', 'BYU Provo', 'byu');
    
    await page.close();
  }

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
