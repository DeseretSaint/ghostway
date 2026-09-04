// Probe BYU with exact coordinates to trigger gate-snap
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout'); process.exit(2); }, 120000).unref();

const OUT = 'ux-shots';
mkdirSync(OUT, { recursive: true });

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(2600);

  await page.evaluate(() => {
    const ob = document.querySelector('#obSkip'); if (ob) ob.click();
    const sp = document.querySelector('#splash'); if (sp) sp.remove();
  });
  await wait(300);

  // Set exact coordinates for BYU (matching option-compact-check.mjs)
  await page.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.6553, 40.2523], label: 'BYU Provo' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'BYU Provo';
    document.querySelector('#route-actions').hidden = false;
  });
  await wait(300);

  // Route
  await page.evaluate(() => document.querySelector('#goBtn').click());
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
  } catch (e) { console.log('warn: route flag not set'); }
  await wait(1400);

  // Screenshot
  const file = `${OUT}/mobile-390-optcompact-byu-exact.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);

  const routeInfo = await page.evaluate(() => {
    const card = document.querySelector('#route-card');
    if (!card) return { error: 'no route-card' };
    const opts = Array.from(card.querySelectorAll('.route-opt'));
    return {
      optCount: opts.length,
      warnSpans: card.querySelectorAll('.opt-warn, .opt-trouble, .opt-warn-row').length,
      cameraCountChips: card.querySelectorAll('.opt-cams').length,
      camFreeBadge: !!card.querySelector('.opt-clear-badge'),
      naturalPill: !!card.querySelector('.opt-natural'),
      gateSnapLines: Array.from(card.querySelectorAll('.opt-warn')).map(s => s.textContent.trim()),
      optMetaCount: card.querySelectorAll('.opt-meta').length,
      cardText: card.innerText.substring(0, 2000),
    };
  });
  console.log('Route result:', JSON.stringify(routeInfo, null, 2));

  await page.close();
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
