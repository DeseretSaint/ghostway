// Screenshot probe: mobile-390 route card at HEAD (SW v23 + directional camera awareness)
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout'); process.exit(2); }, 120000).unref();

const OUT = 'ux-shots';
const VP = { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3 };

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader', '--user-data-dir=/tmp/ghostway-fire'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: VP.width, height: VP.height, deviceScaleFactor: VP.deviceScaleFactor });

  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(3000);

  // Dismiss onboarding
  await page.evaluate(() => {
    const ob = document.querySelector('#obSkip'); if (ob) ob.click();
    const sp = document.querySelector('#splash'); if (sp) sp.remove();
  });
  await wait(500);

  // Screenshot 1: search panel
  await page.screenshot({ path: `${OUT}/2026-09-06-sw-v23-search.png` });
  console.log('saved search');

  // Type route
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  await wait(900);
  await page.type('#toInput', 'Lindon, Utah');
  await wait(900);
  await page.evaluate(() => document.querySelector('#goBtn').click());
  
  // Wait for route
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
  } catch (e) { console.log('warn: route flag not set'); }
  await wait(2000);

  // Screenshot 2: route card
  await page.screenshot({ path: `${OUT}/2026-09-06-sw-v23-routecard.png` });
  console.log('saved routecard');

  // Extract state
  const state = await page.evaluate(() => {
    const result = { chips: [], options: [], camChipText: null, error: null, swVersion: null };
    try {
      // Check SW
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        result.swVersion = navigator.serviceWorker.controller.scriptURL || 'controlling';
      } else {
        result.swVersion = 'no-controller';
      }
      
      const chipEls = document.querySelectorAll('.gw-mode, .mode-chip, .chip');
      result.chips = Array.from(chipEls).map(c => ({
        text: c.textContent?.trim(),
        ariaPressed: c.getAttribute('aria-pressed'),
        class: c.className,
      }));

      const optEls = document.querySelectorAll('.opt-compact, .route-opt');
      result.options = Array.from(optEls).map(o => ({
        text: o.textContent?.trim().replace(/\s+/g, ' ').substring(0, 100),
        camText: o.querySelector('.opt-cams')?.textContent?.trim(),
        isChosen: o.classList.contains('chosen'),
      }));

      const navChip = document.querySelector('.cam-chip');
      if (navChip) result.camChipText = navChip.textContent?.trim();

      const bodyText = document.body.innerText;
      const idx = bodyText.indexOf('Clearest');
      if (idx > -1) result.routeCardText = bodyText.substring(Math.max(0, idx - 30), idx + 300);
    } catch (e) {
      result.error = e.message;
    }
    return result;
  });

  console.log('\n=== mobile-390 state ===');
  console.log(JSON.stringify(state, null, 2));

  // Now tap Fastest chip to verify directional awareness
  const chips = await page.$$('.gw-mode');
  for (const chip of chips) {
    const text = await chip.evaluate(el => el.textContent?.trim());
    if (text === 'Fastest') {
      await chip.click();
      await wait(1000);
      await page.screenshot({ path: `${OUT}/2026-09-06-sw-v23-fastest.png` });
      console.log('saved fastest');
      
      const fastState = await page.evaluate(() => {
        const optEls = document.querySelectorAll('.opt-compact, .route-opt');
        return Array.from(optEls).map(o => ({
          text: o.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80),
          camText: o.querySelector('.opt-cams')?.textContent?.trim(),
          isChosen: o.classList.contains('chosen'),
        }));
      });
      console.log('Fastest options:', JSON.stringify(fastState, null, 2));
      break;
    }
  }

  console.log('console errors:', errors.length ? errors.slice(0, 8) : 'none');

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  console.log('done');
  process.exit(errors.filter((e) => !/favicon/.test(e)).length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
