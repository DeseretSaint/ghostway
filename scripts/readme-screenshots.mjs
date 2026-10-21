// README screenshot capture (t_gwreadme1): docs/screenshots/route-options.png
// and docs/screenshots/navigation.png regenerated from the CURRENT build.
//
// Why this exists: the README shipped 2026-09-25 screenshots taken BEFORE the
// routing fixes (mode chips with independent camera counts, per-mode camera
// truth, camera-aware reroute). Keaton 2026-10-21: "it uses old screenshots
// before routing got fixed."
//
// Harness standard matches engine-e2e.mjs: hermetic vite preview (poll-until-up),
// puppeteer-core + system chromium, 390x844 @2x mobile viewport, returning-user
// localStorage, real app code paths only (no injected innerHTML):
//   1. app.setEndpoints(from, to) + await app.onRoute()  -> the same planner the
//      Route button calls (routeWithFallbacks: on-device graph first)
//   2. assert the route card rendered >=2 mode chips each carrying a camera count
//   3. screenshot viewport -> docs/screenshots/route-options.png
//   4. app.startNav() (geolocation stubbed, no GPS headless) -> real
//      showNavBanner()/renderNavStep() -> screenshot -> navigation.png
//   5. assert banner fields populated, print console errors
//
// Usage:
//   GW_CHROME_PATH=/usr/sbin/chromium node scripts/readme-screenshots.mjs
//   node scripts/readme-screenshots.mjs --probe   # route candidates, no writes
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME =
  process.env.GW_CHROME_PATH ||
  process.env.CHROME_PATH ||
  '/usr/sbin/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => {
  console.error('WATCHDOG: 300s timeout — force exit');
  process.exit(2);
}, 300000).unref();

const PROBE = process.argv.includes('--probe');
const OUT_DIR = 'docs/screenshots';

const VIEWPORT = {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

// Candidate corridors inside the shipped graph coverage. Labels are what a user
// would see in the from/to fields.
const PAIRS = [
  { id: 'pg-slc', from: { label: 'Pleasant Grove, Utah', coords: [-111.7386, 40.3644] }, to: { label: 'Salt Lake City, Utah', coords: [-111.891, 40.7608] } },
  { id: 'provo-slc', from: { label: 'Provo, Utah', coords: [-111.6585, 40.2338] }, to: { label: 'Salt Lake City, Utah', coords: [-111.891, 40.7608] } },
  { id: 'orem-lehi', from: { label: 'Orem, Utah', coords: [-111.6946, 40.2969] }, to: { label: 'Lehi, Utah', coords: [-111.8508, 40.3916] } },
  { id: 'pg-slcairport', from: { label: 'Pleasant Grove, Utah', coords: [-111.7386, 40.3644] }, to: { label: 'Salt Lake City International Airport', coords: [-111.9791, 40.7899] } },
];

// This host has 3.7 GB RAM and runs other worker chromium sessions, so a probe
// that opens every pair in one process grows memory. Probe one pair per
// process: GW_PAIR=<id> node scripts/readme-screenshots.mjs --probe
if (PROBE && !process.env.GW_PAIR) {
  console.error(
    'FAIL: --probe requires GW_PAIR (one pair per process). Candidates: ' +
      PAIRS.map((p) => p.id).join(', ')
  );
  process.exit(1);
}

const pickPair = () => {
  const wanted = process.env.GW_PAIR;
  if (!wanted) return PAIRS[0];
  const p = PAIRS.find((x) => x.id === wanted);
  if (!p) throw new Error(`GW_PAIR=${wanted} not in list: ${PAIRS.map((x) => x.id).join(', ')}`);
  return p;
};

async function readCard(page) {
  return page.evaluate(() => {
    const chips = [...document.querySelectorAll('.mode-chip')].map((b) => ({
      mode: b.dataset.mode,
      label: (b.textContent || '').trim().replace(/\s+/g, ' '),
      pressed: b.getAttribute('aria-pressed'),
      active: b.classList.contains('active'),
      meta: (b.querySelector('.chip-meta')?.textContent || '').trim(),
    }));
    return {
      chips,
      time: (document.querySelector('.rc-time')?.textContent || '').trim(),
      dist: (document.querySelector('.rc-dist')?.textContent || '').trim(),
      arrive: (document.querySelector('.rc-arrive')?.textContent || '').trim(),
      badge: (document.querySelector('.rc-badge')?.textContent || '').trim(),
      detour: (document.querySelector('.rc-detour')?.textContent || '').trim(),
      pill: (document.querySelector('#enginePill')?.textContent || '').trim(),
      startBtn: !!document.querySelector('#startNavBtn'),
      engine: window.__ghostwayEngine || null,
      debug: window.__ghostwayDebug || null,
    };
  });
}

async function readBanner(page) {
  return page.evaluate(() => {
    const b = document.querySelector('#navBanner');
    return {
      hidden: !b || b.hidden,
      dist: (document.querySelector('#navDist')?.textContent || '').trim(),
      dir: (document.querySelector('.nav-dir')?.textContent || '').trim(),
      eta: (document.querySelector('#navEta')?.textContent || '').trim(),
      chip: (document.querySelector('#camChip')?.textContent || '').trim(),
      speed: (document.querySelector('#navSpeed')?.textContent || '').trim(),
      voice: !!document.querySelector('#voiceBtn'),
      stop: !!document.querySelector('#navStop'),
    };
  });
}

async function route(page, pair) {
  console.log(`[route] start ${pair.id}`);
  const t0 = Date.now();
  await page.evaluate(
    (f, t) => {
      // onRoute() reads app.state.from/to and calls setEndpoints() itself, so
      // this is the exact planner the Route button invokes — not a side door.
      const a = window.__gw;
      a.state.from = f;
      a.state.to = t;
      return a.onRoute();
    },
    pair.from,
    pair.to
  );
  console.log(`[route] onRoute resolved in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await page.waitForFunction(
    () =>
      window.__ghostwayDebug?.routed === true &&
      document.querySelectorAll('.mode-chip').length >= 2 &&
      !!document.querySelector('#startNavBtn'),
    { timeout: 120000 }
  );
  // Map tiles + camera dots settle before the shot.
  await wait(2500);
}

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  // No GPS headless: startNav() would otherwise wait on a fix.
  await page.evaluateOnNewDocument(() => {
    try {
      const stub = {
        watchPosition: (ok) => {
          try {
            ok && ok({ coords: { longitude: -111.7386, latitude: 40.3644, speed: 0, heading: 0, accuracy: 5 }, timestamp: Date.now() });
          } catch {}
          return 1;
        },
        clearWatch: () => {},
        getCurrentPosition: (ok) => {
          try {
            ok && ok({ coords: { longitude: -111.7386, latitude: 40.3644, speed: 0, heading: 0, accuracy: 5 }, timestamp: Date.now() });
          } catch {}
        },
      };
      Object.defineProperty(navigator, 'geolocation', { value: stub, configurable: true });
      localStorage.setItem('gw-onboarded', '1');
      localStorage.setItem('gw-mode', 'strict');
    } catch {}
  });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:4173/', { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction('window.__gw !== undefined', { timeout: 60000 });
  // Splash / onboarding must not cover the capture.
  await page.evaluate(() => {
    const ob = document.querySelector('#obSkip');
    if (ob) ob.click();
    const sp = document.querySelector('#splash');
    if (sp) sp.remove();
  });
  await wait(1200);
  page.__errors = errors;
  return page;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    // A real route on this 1.5M-node graph takes tens of seconds under
    // load; the default 180s CDP protocolTimeout aborted page.evaluate()
    // mid-route in the first probe run. Give it room.
    protocolTimeout: 600000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-unsafe-swiftshader',
      '--window-size=390,844',
      // This host has ~3.8 GB RAM and runs other worker chromium sessions.
      // Do NOT cap --js-flags heap here: a 640 MB cap made V8 major-GC
      // continuously over the 1.5M-node graph and the route never returned
      // (Runtime.callFunctionOn timeout, probe run 6).
      '--renderer-process-limit=1',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  });

  let failure = null;
  try {
    if (PROBE) {
      const results = [];
      for (const pair of process.env.GW_PAIR ? [pickPair()] : PAIRS) {
        const page = await newPage(browser);
        try {
          await route(page, pair);
          const card = await readCard(page);
          const row = {
            id: pair.id,
            chips: card.chips.map((c) => `${c.label} [${c.meta}]`),
            time: card.time,
            dist: card.dist,
            badge: card.badge,
            pill: card.pill,
            engine: card.engine,
            options: card.debug?.options,
          };
          results.push(row);
          console.log(JSON.stringify(row));
        } catch (e) {
          results.push({ id: pair.id, error: e.message });
          console.log(JSON.stringify({ id: pair.id, error: e.message }));
        } finally {
          await page.close();
        }
      }
      console.log('\nPROBE SUMMARY\n' + JSON.stringify(results, null, 2));
      return;
    }

    const pair = pickPair();
    console.log(`pair: ${pair.id} (${pair.from.label} -> ${pair.to.label})`);

    // --- route-options.png: route card with Clearest / Balanced / Fastest chips
    const page = await newPage(browser);
    await route(page, pair);
    const card = await readCard(page);
    console.log('card:', JSON.stringify(card, null, 1));

    const counted = card.chips.filter((c) => /\d+\s*cam/.test(c.meta));
    const distinctCam = new Set(card.chips.map((c) => (c.meta.match(/(\d+)\s*cam/) || [])[1]).filter(Boolean));
    if (card.chips.length < 2) throw new Error(`expected >=2 mode chips, got ${card.chips.length}`);
    if (counted.length !== card.chips.length) throw new Error(`a mode chip is missing its camera count: ${JSON.stringify(card.chips)}`);
    if (distinctCam.size < 2) throw new Error(`camera counts identical across modes (${[...distinctCam]}) — screenshot would not show avoidance at work`);
    if (!card.startBtn) throw new Error('no Start navigation button on the route card');

    await page.screenshot({ path: `${OUT_DIR}/route-options.png` });
    console.log('saved', `${OUT_DIR}/route-options.png`);

    // --- navigation.png: active nav, real banner, live camera counter
    const navReady = await page.evaluate(() => {
      const a = window.__gw;
      if (!a || !a.state || !a.state.route) return { ok: false, why: 'no route in state' };
      try {
        a.startNav();
      } catch (e) {
        return { ok: false, why: 'startNav threw: ' + e.message };
      }
      return { ok: true };
    });
    if (!navReady.ok) throw new Error('startNav failed: ' + navReady.why);
    await page.waitForFunction(() => !document.querySelector('#navBanner').hidden, { timeout: 20000 });
    // startNav() calls setFollow(true), which re-centers/pitches the camera.
    // 1.5 s was not enough for the new view's tiles: the first capture
    // (15:23) came out with a blank basemap behind the route line. Poll
    // areTilesLoaded() rather than trusting MapLibre 'idle': one of the app's
    // sources keeps the map from ever going idle, so 'idle' never fires under
    // a live route (observed: 25 s timeout, zoom 16.5, pitch 55).
    const settled = await page.evaluate(
      () =>
        new Promise((res) => {
          const m = window.__gw?.map?.map;
          if (!m) return res({ ok: false, why: 'no-map' });
          const t0 = Date.now();
          const tick = () => {
            let loaded = false;
            try {
              loaded = m.loaded() && m.areTilesLoaded();
            } catch { /* style mid-swap */ }
            if (loaded) return res({ ok: true, afterMs: Date.now() - t0 });
            if (Date.now() - t0 > 30000) return res({ ok: false, why: 'tiles-timeout', afterMs: Date.now() - t0 });
            setTimeout(tick, 400);
          };
          tick();
        })
    );
    const view = await page.evaluate(() => {
      const m = window.__gw.map.map;
      return { zoom: +m.getZoom().toFixed(2), pitch: +m.getPitch().toFixed(1), bearing: Math.round(m.getBearing()) };
    });
    console.log(`map tiles: ${JSON.stringify(settled)}`, JSON.stringify(view));
    // Extra beat for the symbol/road layers to paint after tiles arrive.
    await wait(3000);
    const banner = await readBanner(page);
    console.log('banner:', JSON.stringify(banner));
    if (banner.hidden) throw new Error('nav banner hidden');
    for (const k of ['dist', 'dir', 'eta', 'chip']) {
      if (!banner[k]) throw new Error(`nav banner #${k} empty — renderNavStep did not run`);
    }
    if (!banner.voice || !banner.stop) throw new Error('nav banner missing voice/stop controls');
    await page.screenshot({ path: `${OUT_DIR}/navigation.png` });
    console.log('saved', `${OUT_DIR}/navigation.png`);

    const errs = page.__errors.filter((e) => !/favicon|404/.test(e));
    console.log('ERRORS', JSON.stringify(errs.slice(0, 8)));
    if (errs.length) failure = `console errors: ${errs.slice(0, 3).join(' | ')}`;
  } finally {
    try {
      await Promise.race([browser.close(), wait(5000)]);
    } catch {}
    try {
      kill();
    } catch {}
  }
  if (failure) {
    console.error('FAIL', failure);
    process.exit(1);
  }
  console.log(PROBE ? 'PROBE DONE' : 'readme-screenshots DONE');
  process.exit(0);
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
