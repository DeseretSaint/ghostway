// Night/low-light variant capture for navbanner-shots audit (fire queue #3).
// Wraps navbanner-shots.mjs but forces prefers-color-scheme: dark per page,
// then captures day + night for each viewport.
// Writes ux-shots/<vp>-navbanner-real-<day|night>{,-crop}.png
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 180s'); process.exit(2); }, 180000).unref();

const OUT = 'ux-shots';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1 },
];

async function assertRealBanner(page) {
  return page.evaluate(() => {
    const banner = document.querySelector('#navBanner');
    if (!banner || banner.hidden) return { ok: false };
    const dist = document.querySelector('#navDist')?.textContent?.trim() || '';
    const dir = document.querySelector('.nav-dir')?.textContent?.trim() || '';
    const eta = document.querySelector('#navEta')?.textContent?.trim() || '';
    const chip = document.querySelector('#camChip')?.textContent?.trim() || '';
    if (!dist || !dir || !eta || !chip) return { ok: false };
    // Capture computed colors for contrast math
    const style = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { color: cs.color, bg: cs.backgroundColor, fz: cs.fontSize, fw: cs.fontWeight };
    };
    return {
      ok: true, dist, dir, eta, chip,
      distStyle: style('#navDist'),
      dirStyle: style('.nav-dir'),
      etaStyle: style('#navEta'),
      chipStyle: style('#camChip'),
      bannerStyle: style('#navBanner'),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      colorScheme: getComputedStyle(document.documentElement).colorScheme || 'normal',
    };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  const summary = [];
  let totalErrors = 0;

  for (const vp of VIEWPORTS) {
    for (const variant of ['day', 'night']) {
      console.log(`\n=== ${vp.name} / ${variant} ===`);
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: variant === 'night' ? 'dark' : 'light' }]);
      await page.setViewport({
        width: vp.width, height: vp.height,
        deviceScaleFactor: vp.deviceScaleFactor,
        isMobile: vp.isMobile, hasTouch: vp.hasTouch,
      });
      await page.evaluateOnNewDocument(() => {
        if (navigator.geolocation && !navigator.geolocation.__gwStubbed) {
          const stub = {
            watchPosition: (ok) => { try { ok && ok({ coords: { longitude: -111.6406, latitude: 40.3644, speed: 0, heading: 0, accuracy: 5 }, timestamp: Date.now() }); } catch {} return 1; },
            clearWatch: () => {},
            getCurrentPosition: (ok) => { try { ok && ok({ coords: { longitude: -111.6406, latitude: 40.3644, speed: 0, heading: 0, accuracy: 5 }, timestamp: Date.now() }); } catch {} },
          };
          try {
            Object.defineProperty(navigator, 'geolocation', { value: stub, configurable: true });
            navigator.geolocation.__gwStubbed = true;
          } catch {}
        }
        try { localStorage.setItem('gw-onboarded', '1'); } catch {}
      });
      await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
      await page.evaluate(() => { try { localStorage.setItem('gw-onboarded', '1'); } catch {} });
      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForFunction('window.__gw !== undefined', { timeout: 30000 });
      await wait(2200);
      await page.evaluate(() => {
        const ob = document.querySelector('#obSkip'); if (ob) ob.click();
        const sp = document.querySelector('#splash'); if (sp) sp.remove();
      });
      await wait(300);
      await page.type('#fromInput', 'Pleasant Grove, Utah');
      await wait(900);
      await page.type('#toInput', 'Lindon, Utah');
      await wait(900);
      await page.evaluate(() => document.querySelector('#goBtn').click());
      try {
        await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 20000 });
      } catch {}
      await wait(1600);
      const navReady = await page.evaluate(() => {
        const a = window.__gw;
        if (!a || !a.state || !a.state.route) return { ok: false, why: 'no route' };
        try { a.startNav(); } catch (e) { return { ok: false, why: e.message }; }
        return { ok: true };
      });
      if (!navReady.ok) { console.error(' FAIL nav', navReady.why); totalErrors++; await page.close(); continue; }
      await wait(800);
      const state = await assertRealBanner(page);
      if (!state.ok) { console.error(' FAIL banner'); totalErrors++; await page.close(); continue; }
      const file = `${OUT}/${vp.name}-navbanner-${variant}.png`;
      await page.screenshot({ path: file });
      const bannerBox = await page.evaluate(() => {
        const b = document.querySelector('#navBanner');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      if (bannerBox && bannerBox.width > 0 && bannerBox.height > 0) {
        await page.screenshot({ path: `${OUT}/${vp.name}-navbanner-${variant}-crop.png`, clip: bannerBox });
      }
      console.log(`  saved ${file} (chip=${state.chip}, scheme=${state.colorScheme})`);
      summary.push({ vp: vp.name, variant, file, ...state });
      await page.close();
    }
  }

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  process.exit(totalErrors ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });