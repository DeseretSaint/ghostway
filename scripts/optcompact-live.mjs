// Connect to existing Chrome and screenshot the route card with real content
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout'); process.exit(2); }, 120000).unref();

const OUT = 'ux-shots';
mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await wait(2600);

  // Dismiss splash/onboarding
  await page.evaluate(() => {
    const ob = document.querySelector('#obSkip'); if (ob) ob.click();
    const sp = document.querySelector('#splash'); if (sp) sp.remove();
  });
  await wait(300);

  // Fill from/to and route (Pleasant Grove -> Lindon)
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  await wait(900);
  await page.type('#toInput', 'Lindon, Utah');
  await wait(900);
  await page.evaluate(() => document.querySelector('#goBtn').click());
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
  } catch (e) { console.log('warn: route flag not set'); }
  await wait(1400);

  // Screenshot the route card
  const file = `${OUT}/mobile-390-optcompact-routecard.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);

  // Extract DOM info
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
  console.log('DOM:', JSON.stringify(domInfo, null, 2));

  await page.close();
  browser.disconnect();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
