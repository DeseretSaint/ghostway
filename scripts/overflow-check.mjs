// Hermetic UI check: route-option text overflow (queue item 5, addendum 2).
// Option text (opt-meta with badges) must NOT spill out of the route-option
// buttons at 320-430 px widths: no horizontal overflow on .route-opt /
// .route-opt-mod, and the panel must not grow horizontally. Drives a real
// PG→Costco route (Keaton's repro corridor) through the REAL UI path.
//
// Round 27 rewrite (2026-10-20): the old script navigated the SAME page three
// times with deviceScaleFactor 2 and a coordinate click on #goBtn. On the
// 3.7 GB build box that OOM-killed Chromium mid-run (SIGKILL, log stopped at
// "-- width 320px"), and the coordinate click hung whenever #goBtn was under
// a collapsing panel. Now: ONE navigation, viewport-only reflow per width,
// DSF 1 (DSF does not affect CSS-px layout), evaluate-clicks, and a bounded
// retry reading the option rows. The measured invariant is unchanged.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout'); process.exit(2); }, 180000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
let b;
try {
  b = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  try {
    await p.waitForFunction(() => {
      const s = document.querySelector('#splash');
      return !s || s.hidden || s.classList.contains('hidden') || getComputedStyle(s).opacity === '0';
    }, { timeout: 20000, polling: 200 });
  } catch { /* splash may already be gone; the route click below tells us */ }
  await wait(300);

  // Drive the real UI: set both endpoints in app state, reveal the action row,
  // click Go through the DOM (a coordinate click can hang under the panel).
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.8226, 40.3885], label: 'Costco, Lehi' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'Costco, Lehi';
    document.querySelector('#route-actions').hidden = false;
  });
  await p.evaluate(() => document.querySelector('#goBtn')?.click());
  await p.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 90000 });
  // Expand the edit view if routing collapsed the search panel (Google Maps
  // behavior) so the option rows are laid out and measurable.
  await p.evaluate(() => document.querySelector('#editRouteBtn')?.click());
  await wait(500);

  const readGeo = () => p.evaluate(() => {
    // 2026-10-20: the route sheet's option rows are .mode-chip (src/ui.js), with
    // .chip-meta for the duration/camera text. Older markup used
    // .route-opt/.route-opt-mod + .opt-meta, so select both.
    const rows = [...document.querySelectorAll('#route-card .mode-chip, #route-card .route-opt, #route-card .route-opt-mod')].map((el) => {
      const meta = el.querySelector('.chip-meta, .opt-meta');
      return {
        label: (el.querySelector('.opt-label')?.textContent || el.textContent).trim().slice(0, 40),
        btnScrollW: el.scrollWidth, btnClientW: el.clientWidth,
        metaScrollW: meta ? meta.scrollWidth : 0, metaClientW: meta ? meta.clientWidth : 0,
        metaText: meta ? meta.textContent.trim() : '',
      };
    });
    const panel = document.querySelector('#panel');
    const card = document.querySelector('#route-card');
    return {
      rows,
      panelScrollW: panel?.scrollWidth || 0, panelClientW: panel?.clientWidth || 0,
      cardScrollW: card?.scrollWidth || 0, cardClientW: card?.clientWidth || 0,
      bodyScrollW: document.body.scrollWidth,
      innerW: window.innerWidth,
    };
  });

  let ok = true;
  for (const width of [320, 390, 430]) {
    console.log(`-- width ${width}px`);
    await p.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    // Reflow + a bounded retry: the first read after a viewport change can land
    // before the card finishes laying out (observed 0 rows).
    let geo = null;
    for (let i = 0; i < 12; i++) {
      await wait(200);
      geo = await readGeo();
      if (geo.rows.length >= 2) break;
    }
    if (!geo || geo.rows.length < 2) {
      ok = false;
      console.error(`FAIL @${width}px: expected >=2 option rows, got ${geo ? geo.rows.length : 'none'}`);
      continue;
    }

    for (const r of geo.rows) {
      if (r.btnScrollW > r.btnClientW + 1) {
        ok = false;
        console.error(`FAIL @${width}px: button horizontal overflow: "${r.label}" scrollW ${r.btnScrollW} > clientW ${r.btnClientW}`);
      }
      if (r.metaScrollW > r.metaClientW + 1) {
        ok = false;
        console.error(`FAIL @${width}px: opt-meta overflow: "${r.metaText}" scrollW ${r.metaScrollW} > clientW ${r.metaClientW}`);
      }
    }
    if (geo.panelScrollW > geo.panelClientW + 1) { ok = false; console.error(`FAIL @${width}px: panel horizontal overflow ${geo.panelScrollW} > ${geo.panelClientW}`); }
    if (geo.cardScrollW > geo.cardClientW + 1) { ok = false; console.error(`FAIL @${width}px: route-card horizontal overflow ${geo.cardScrollW} > ${geo.cardClientW}`); }
    if (geo.bodyScrollW > geo.innerW + 1) { ok = false; console.error(`FAIL @${width}px: body horizontal overflow ${geo.bodyScrollW} > ${geo.innerW}`); }
    console.log(`@${width}px: ${geo.rows.length} option rows, panel ${geo.panelScrollW}/${geo.panelClientW}, body ${geo.bodyScrollW}/${geo.innerW} — ${geo.rows.every((r) => r.btnScrollW <= r.btnClientW + 1) ? 'no overflow' : 'OVERFLOW'}`);
  }

  // External DOT/geocoder endpoints fail from this box without CORS; those are
  // not layout regressions. Keep them visible in the log but out of the verdict,
  // matching interact-check's filter.
  const realErrs = errs.filter((e) => !/favicon|cotg\.carsprogram|511\.idaho|CORS policy|Failed to load resource/.test(e));
  console.log(`page errors: ${errs.length} total, ${realErrs.length} app-origin`);
  if (realErrs.length) { ok = false; console.error('PAGE ERRORS:', realErrs.slice(0, 6)); }
  console.log(ok ? 'PASS' : 'FAIL');
  code = ok ? 0 : 1;
} catch (e) {
  console.error('ERROR:', e.message);
  code = 1;
} finally {
  try { await Promise.race([b?.close(), wait(5000)]); } catch {}
  try { preview.kill(); } catch {}
  process.exit(code);
}
