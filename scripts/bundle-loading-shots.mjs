// Bundle-size loading-state audit screenshots: capture the "Routing..." button
// state at 390 / 375 / 1440 right after the user taps Calculate, before the
// engine chunk arrives. Throttles the engine chunk via CDP so the loading
// state is observable.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 120s'); process.exit(2); }, 120000).unref();

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

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });

    // Throttle ONLY the engine chunk so the loading state is observable
    const client = await page.createCDPSession();
    await client.send('Network.enable');
    const engineChunkRe = /assets\/engine-[A-Za-z0-9_-]+\.js$/;
    const t0 = Date.now();
    const engineTimes = [];
    await client.send('Network.setRequestInterception', { patterns: [{ urlPattern: '*' }] });
    client.on('Network.requestIntercepted', async (evt) => {
      const url = evt.request.url;
      if (engineChunkRe.test(url)) {
        // Hold the engine chunk ~2s so the "Routing..." button state is visible
        await wait(2000);
        engineTimes.push({ url, msFromStart: Date.now() - t0 });
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

    // Fill from/to via suggestion click
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
    await wait(400);
    await pick('#toInput', 'Lindon, Utah');
    await wait(400);

    // Trigger Calculate and capture mid-loading. Auto-route usually fires
    // when both endpoints are picked, so we capture immediately and again
    // a moment later to be safe.
    const goVisible = await page.evaluate(() => {
      const r = document.querySelector('#goBtn')?.getBoundingClientRect();
      return r && r.width > 0 && r.height > 0;
    });
    if (goVisible) await page.click('#goBtn');

    // Capture immediately while the engine chunk is throttled.
    // Wait just long enough for the button to enter loading state.
    await wait(300);
    const loadingState1 = await page.evaluate(() => {
      const btn = document.querySelector('#goBtn');
      return {
        text: btn?.textContent,
        classes: btn?.className,
        disabled: btn?.disabled,
      };
    });
    const file1 = `ux-shots/${vp.name}-bundle-loading.png`;
    await page.screenshot({ path: file1, fullPage: false });

    // Wait for the throttled engine chunk to land + route to render
    try {
      await page.waitForFunction(
        () => window.__ghostwayDebug?.routed === true,
        { timeout: 8000 }
      );
    } catch {}
    await wait(500);
    const file2 = `ux-shots/${vp.name}-bundle-routed.png`;
    await page.screenshot({ path: file2, fullPage: false });
    const debug = await page.evaluate(() => window.__ghostwayDebug);

    console.log(JSON.stringify({
      viewport: vp.name,
      loadingState1,
      routed: debug,
      engineChunkTimings: engineTimes,
      files: [file1, file2],
    }, null, 2));

    await page.close();
  }

  try { await Promise.race([browser.close(), wait(4000)]); } catch {}
  kill();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
