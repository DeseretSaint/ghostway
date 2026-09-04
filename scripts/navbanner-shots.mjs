// Real-component NavBanner screenshot capture.
//
// The original ux-shots.mjs uses page.evaluate() to INJECT innerHTML into
// #navBanner — that proves the CSS + layout but not the live component.
// ghostway-fire's daylight/night contrast audit (queue #3) needs the banner
// as the actual renderNavStep() function produces it, with the real step
// (turn arrow, street, distance, ETA, camera chip) sourced from a real route.
//
// This script:
//   1. Boots vite preview (Hermetic, poll-until-up).
//   2. For each viewport (390 / 375 / 1440), loads the app, returns-user.
//   3. Drives a real route Pleasant Grove -> Lindon (3 viewports, same pair,
//      so the camera chip / ETA / maneuver are comparable across widths).
//   4. Stubs navigator.geolocation.watchPosition (no GPS in headless) so
//      app.startNav() can be called without hanging.
//   5. Calls app.startNav() — that triggers showNavBanner() + renderNavStep()
//      with the live app._navSteps / app._totalDuration / app._camPts /
//      app.state.userLoc state, so every element on the banner is real data
//      from the real component.
//   6. Asserts the real #navDist, #navEta, #camChip, #voiceBtn, #navStop
//      elements exist + have non-empty content (i.e. renderNavStep ran).
//   7. Captures the full viewport screenshot (banner is the top strip; the
//      map + below-banner chrome proves the banner is OVER the real map).
//   8. Saves under ux-shots/ with the -navbanner-real suffix so the existing
//      -navbanner suite (injected HTML) is preserved alongside.
//
// Usage: node scripts/navbanner-shots.mjs
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() / preview shutdown can hang under swiftshader.
// If anything wedges, force-exit with a distinct code so cron/CI doesn't hang.
setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

const OUT = 'ux-shots';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1 },
];

// Returns true if the banner is present and shows real component content
// (not the injected-HTML stub). Distinguishes the fire-audit screenshots
// from the ux-shots.mjs injected suite.
async function assertRealBanner(page) {
  return page.evaluate(() => {
    const banner = document.querySelector('#navBanner');
    if (!banner || banner.hidden) return { ok: false, why: 'banner hidden or missing' };
    const dist = document.querySelector('#navDist')?.textContent?.trim() || '';
    const dir = document.querySelector('.nav-dir')?.textContent?.trim() || '';
    const eta = document.querySelector('#navEta')?.textContent?.trim() || '';
    const chip = document.querySelector('#camChip')?.textContent?.trim() || '';
    const stop = !!document.querySelector('#navStop');
    const voice = !!document.querySelector('#voiceBtn');
    const compactClass = banner.classList.contains('compact');
    // The class signature the real component always produces:
    //   stop + voice + distance + direction + ETA + camChip, all populated.
    if (!stop || !voice) return { ok: false, why: 'missing stop or voice button' };
    if (!dist) return { ok: false, why: 'empty #navDist' };
    if (!dir) return { ok: false, why: 'empty .nav-dir' };
    if (!eta) return { ok: false, why: 'empty #navEta' };
    if (!chip) return { ok: false, why: 'empty #camChip' };
    return { ok: true, dist, dir, eta, chip, compactClass };
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

  // Returning user so onboarding overlay is skipped.
  await browser.evaluateOnNewDocument?.(() => {
    try { localStorage.setItem('gw-onboarded', '1'); } catch {}
  });

  let totalErrors = 0;
  const summary = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
    });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

    // Stub geolocation per-page (no GPS in headless). watchPosition is
    // called inside startNav() — without this the call returns an error
    // and the page may hang waiting for the first fix. The stub is a
    // no-op success so the banner renders cleanly with the seeded
    // app.state.userLoc, which the routing step places on the start
    // point (so the very first step's distance is real).
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
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('gw-onboarded', '1'); } catch {} });
    // Returning-user re-application (the per-page evaluateOnNewDocument above
    // already set it, but repeat for safety after the first navigation):
    await page.evaluate(() => { try { localStorage.setItem('gw-onboarded', '1'); } catch {} });
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction('window.__gw !== undefined', { timeout: 30000 });
    console.log('  app booted');

    // Map + camera tiles settle (no flash in the final shot).
    await wait(2200);

    // Dismiss the splash if it lingered (test-helper parity with ux-shots.mjs).
    await page.evaluate(() => {
      const ob = document.querySelector('#obSkip'); if (ob) ob.click();
      const sp = document.querySelector('#splash'); if (sp) sp.remove();
    });
    await wait(300);

    // Type endpoints (Pleasant Grove -> Lindon). Mirror the ux-shots.mjs
    // flow so the photon + suggestion timing is identical to the existing
    // 390-routecard / 390-navbanner shots.
    await page.type('#fromInput', 'Pleasant Grove, Utah');
    await wait(900);
    await page.type('#toInput', 'Lindon, Utah');
    await wait(900);
    await page.evaluate(() => document.querySelector('#goBtn').click());
    try {
      await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 20000 });
    } catch (e) {
      console.log('  warn: __ghostwayDebug.routed flag not set; continuing');
    }
    await wait(1600);

    // Enter the real navigating state. app.startNav() hides the panel,
    // calls showNavBanner() -> renderNavStep() which builds the real banner
    // from app._navSteps, app._totalDuration, app._camPts, app.state.userLoc.
    // That is exactly the code path the driver sees in the field.
    const navReady = await page.evaluate(() => {
      const a = window.__gw;
      if (!a || !a.state || !a.state.route) return { ok: false, why: 'no route in state' };
      try { a.startNav(); } catch (e) { return { ok: false, why: 'startNav threw: ' + e.message }; }
      return { ok: true };
    });
    if (!navReady.ok) {
      console.error('  FAIL: could not enter nav state —', navReady.why);
      totalErrors++;
      await page.close();
      continue;
    }
    // Give renderNavStep + the first advanceStep tick a moment so the
    // cam chip + ETA settle (they read app.state.userLoc).
    await wait(800);

    const bannerState = await assertRealBanner(page);
    if (!bannerState.ok) {
      console.error('  FAIL: real banner not rendered —', bannerState.why);
      totalErrors++;
      await page.close();
      continue;
    }
    console.log(`  banner OK: dist="${bannerState.dist}" dir="${bannerState.dir.slice(0, 40)}…" eta="${bannerState.eta}" chip="${bannerState.chip}" compact=${bannerState.compactClass}`);

    const file = `${OUT}/${vp.name}-navbanner-real.png`;
    await page.screenshot({ path: file });
    console.log('  saved', file);
    summary.push({ vp: vp.name, file, ...bannerState });

    // Capture a banner-only crop too: a tight clip of the banner region
    // so fire's contrast/legibility audit can judge the banner in
    // isolation, not mixed with the map below it.
    const bannerBox = await page.evaluate(() => {
      const b = document.querySelector('#navBanner');
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (bannerBox && bannerBox.width > 0 && bannerBox.height > 0) {
      const cropFile = `${OUT}/${vp.name}-navbanner-real-crop.png`;
      await page.screenshot({ path: cropFile, clip: bannerBox });
      console.log('  saved', cropFile);
    }

    const realErrors = errors.filter((e) => !/favicon/.test(e));
    if (realErrors.length) {
      console.log(`  console errors (${realErrors.length}):`, realErrors.slice(0, 4));
      totalErrors += realErrors.length;
    } else {
      console.log('  no console errors');
    }

    await page.close();
  }

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`viewports OK: ${summary.length}/${VIEWPORTS.length}`);
  // Teardown can hang under swiftshader; exit explicitly with the real status.
  process.exit(totalErrors ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
