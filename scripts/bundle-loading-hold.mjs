// Capture true mid-loading state by holding the engine chunk and screenshotting
// WHILE the button is in "Routing..." state.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG'); process.exit(2); }, 120000).unref();

const VIEWPORTS = [
  { w: 390, h: 844, name: 'mobile-390', deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { w: 375, h: 812, name: 'mobile-375', deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { w: 1440, h: 900, name: 'desktop-1440', deviceScaleFactor: 1, isMobile: false, hasTouch: false },
];

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const out = [];
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });

    const client = await page.createCDPSession();
    await client.send('Network.enable');
    // Match ANY chunk matching /engine/ OR the bundle-check graph properties
    // so we capture the lazy-load moment regardless of naming
    const engineRe = /assets\/(engine|router)[A-Za-z0-9_-]*\.js(\?|$)/;
    let chunkHeld = false;
    await client.send('Network.setRequestInterception', { patterns: [{ urlPattern: '*' }] });
    client.on('Network.requestIntercepted', async (evt) => {
      const url = evt.request.url;
      if (!chunkHeld && engineRe.test(url)) {
        chunkHeld = true;
        // Hold 5s so the loading state is unambiguously captured
        await wait(5000);
        await client.send('Network.continueInterceptedRequest', { interceptionId: evt.interceptionId });
      } else {
        await client.send('Network.continueInterceptedRequest', { interceptionId: evt.interceptionId });
      }
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await page.waitForFunction(() => {
        const s = document.querySelector('#splash');
        return !s || s.hidden;
      }, { timeout: 8000 });
    } catch {}
    await wait(400);

    async function pick(inputSel, query) {
      await page.type(inputSel, query);
      for (let i = 0; i < 12; i++) {
        const ok = await page.evaluate(() => {
          const el = document.querySelector('#suggestions .sugg');
          if (!el) return false;
          el.click();
          return true;
        });
        if (ok) return;
        await wait(400);
      }
      await page.focus(inputSel);
      await page.keyboard.press('Enter');
    }
    await pick('#fromInput', 'Pleasant Grove, Utah');
    await wait(300);
    await pick('#toInput', 'Lindon, Utah');
    await wait(300);

    // Fire route manually
    await page.evaluate(() => document.querySelector('#goBtn')?.click());
    // Wait until the button enters loading state, then capture
    try {
      await page.waitForFunction(() => {
        const b = document.querySelector('#goBtn');
        return b && b.disabled && b.textContent && b.textContent.toLowerCase().includes('routing');
      }, { timeout: 4000 });
    } catch {}
    const state = await page.evaluate(() => {
      const b = document.querySelector('#goBtn');
      return { text: b?.textContent, classes: b?.className, disabled: b?.disabled };
    });
    const file = `ux-shots/${vp.name}-bundle-loading-real.png`;
    await page.screenshot({ path: file, fullPage: false });

    out.push({ viewport: vp.name, chunkHeld, state, file });
    await page.close();
  }

  console.log(JSON.stringify(out, null, 2));
  try { await Promise.race([browser.close(), wait(4000)]); } catch {}
  kill();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
