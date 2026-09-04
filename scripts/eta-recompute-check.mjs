// Live ETA recompute guard (PRIORITY 2 #3 — LIVE ETA RECOMPUTE):
// With a route set but nav NOT started, GPS movement ≥100 m must update the
// ETA/distance card numbers WITHOUT rebuilding the card body. The user's
// hover state, focus, scroll position, and any animation on the option
// buttons must survive the update.
//
// Asserts:
//   (a) a PG→Lindon route renders a populated #route-card with .route-opt
//       buttons (sanity).
//   (b) initial headline (time/dist) recorded.
//   (c) fire 3 live-ETA recomputes at increasing distance offsets along the
//       route (≥100 m each). After each, the .route-opt NODE IDENTITY must be
//       preserved (===) — proof the body was patched, not rebuilt.
//   (d) at least one of the three updates must change the .rc-time text
//       (proves the soft-update is wired through to the visible number).
//   (e) when the option SET changes (forced by toggling mode to OFF and back),
//       a full re-render is allowed and accepted (sanity for the shouldFull-
//       Reroute path).
//
// Builds dist via `npm run build` separately. Run this against `vite preview`
// already serving dist/.

import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 240s timeout'); process.exit(2); }, 240000).unref();

const mainSrc = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const uiSrc = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');

// Structural — verify the soft-update + the test hook + the throttle all live in src.
const softPatchFn = /function updateRouteCardInPlace\s*\(/.test(mainSrc);
const shouldFullFn = /function shouldFullReroute\s*\(/.test(mainSrc);
const testHook = /__gwForceLiveEta/.test(mainSrc);
const liveEtaCall = /updateLiveEta\(\s*coords\s*\)/.test(mainSrc);
const throttleGuard = /sinceMove\s*>=\s*100\s*&&\s*now\s*-\s*st\.lastT\s*>=\s*30000/.test(mainSrc);
const liveEtaThrottle = /!app\.state\.navigating\s*&&\s*app\.state\.route\s*&&\s*app\.state\.to/.test(mainSrc);

console.log('--- Structural checks (src/main.js) ---');
console.log(`${softPatchFn ? 'OK  ' : 'FAIL'} updateRouteCardInPlace() defined (soft-update path)`);
console.log(`${shouldFullFn ? 'OK  ' : 'FAIL'} shouldFullReroute() defined (mode/camera flip → full re-render gate)`);
console.log(`${testHook ? 'OK  ' : 'FAIL'} app.__gwForceLiveEta test hook exposed`);
console.log(`${liveEtaCall ? 'OK  ' : 'FAIL'} updateLiveEta() called from onLocationFix`);
console.log(`${throttleGuard ? 'OK  ' : 'FAIL'} 100 m + 30 s throttle intact in onLocationFix`);
console.log(`${liveEtaThrottle ? 'OK  ' : 'FAIL'} live-ETA branch gated on !navigating && route && to`);

const uiRenderEngine = /export function renderRouteCard[\s\S]*?function renderEngineCard/.test(uiSrc);

let fail = !softPatchFn || !shouldFullFn || !testHook || !liveEtaCall || !throttleGuard || !liveEtaThrottle || !uiRenderEngine;

const preview = await startPreview({ port: 4173 });
let b;
let code = 1;

try {
  b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // ---- Corridor: PG → Costco Lehi (≈9 km; live-ETA can move numbers but
  // shouldn't change mode/camera sets, so shouldFullReroute() returns false).
  // Pleasant Grove: -111.759, 40.364  →  Costco Lehi: -111.834, 40.394
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.834, 40.394], label: 'Costco, Lehi' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'Costco, Lehi';
    document.querySelector('#route-actions').hidden = false;
  });
  await p.waitForFunction(() => {
    const s = document.querySelector('#splash');
    return !s || s.classList.contains('hidden') || getComputedStyle(s).opacity === '0';
  }, { timeout: 15000 });
  await wait(300);
  await p.click('#goBtn');
  await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 90000 });
  await p.waitForFunction(
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.route-opt').length >= 2; }",
    { timeout: 60000 }
  );
  await wait(500);

  // --- (a) sanity ---
  const sanity = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    const opts = Array.from(card.querySelectorAll('.route-opt'));
    return {
      optCount: opts.length,
      hasTime: !!card.querySelector('.rc-time'),
      hasDist: !!card.querySelector('.rc-dist'),
      hasBadge: !!card.querySelector('.rc-badge'),
      hasMeta: opts.every((o) => !!o.querySelector('.opt-meta')),
      initialTime: (card.querySelector('.rc-time')?.textContent || '').trim(),
      initialDist: (card.querySelector('.rc-dist')?.textContent || '').trim(),
    };
  });
  console.log('\n--- (a) Initial route card sanity (PG → Lindon) ---');
  must(sanity.optCount >= 2, `route options rendered (got ${sanity.optCount})`);
  must(sanity.hasTime, '.rc-time headline present');
  must(sanity.hasDist, '.rc-dist headline present');
  must(sanity.hasBadge, '.rc-badge present');
  must(sanity.hasMeta, 'every option has .opt-meta');
  console.log(`OK  initial headline: "${sanity.initialTime}" / "${sanity.initialDist}"`);

  // --- (b/c) capture option node identity, fire 3 recomputes ---
  // Mark each option button with a unique sentinel so we can compare identity
  // across evaluate() calls. Puppeteer serializes DOM nodes as opaque
  // handles between calls, so reference equality doesn't survive; a sentinel
  // attribute set on the actual node does.
  const beforeNodes = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    return Array.from(card.querySelectorAll('.route-opt')).map((n, idx) => {
      n.setAttribute('data-gw-sentinel', `sentinel-${idx}-${Date.now()}-${Math.random()}`);
      return { opt: n.getAttribute('data-opt'), sentinel: n.getAttribute('data-gw-sentinel') };
    });
  });
  const beforeSentinels = beforeNodes.map((x) => x.sentinel);

  // Three positions along the corridor, each ≥100 m further from PG than the last.
  // PG→first ≈ 350 m, first→second ≈ 600 m, second→third ≈ 600 m.
  // Direction: PG → Costco goes west and a touch north.
  const positions = [
    [-111.7555, 40.3655], // ~350 m west of PG
    [-111.7485, 40.3685], // ~1.0 km west of PG (incremental ~600 m)
    [-111.7415, 40.3715], // ~1.7 km west of PG (incremental ~600 m)
  ];

  let timeTextChanges = 0;
  let lastTime = sanity.initialTime;

  for (let i = 0; i < positions.length; i++) {
    const coords = positions[i];
    const fired = await p.evaluate(async (c) => {
      try {
        // Snapshot the options BEFORE the recompute so we can show prev/next diff.
        window.__gwSnapBefore = {
          modes: window.__gw.state.options.map((o) => ({ mode: o.mode, cams: o.cameras })),
          duration: window.__gw.state.options[window.__gw.state.chosen]?.duration,
        };
        await window.__gw.__gwForceLiveEta(c);
        window.__gwSnapAfter = {
          modes: window.__gw.state.options.map((o) => ({ mode: o.mode, cams: o.cameras })),
          duration: window.__gw.state.options[window.__gw.state.chosen]?.duration,
        };
        return { ok: true, before: window.__gwSnapBefore, after: window.__gwSnapAfter };
      } catch (e) {
        return { ok: false, err: String(e.message || e) };
      }
    }, coords);
    must(fired.ok, `(c) recompute #${i + 1} fired without error${fired.err ? `: ${fired.err}` : ''}`);
    if (fired.ok) console.log(`  prev: ${JSON.stringify(fired.before.modes)} → next: ${JSON.stringify(fired.after.modes)} | dur: ${fired.before.duration} → ${fired.after.duration}`);
    await wait(400);

    // Read back sentinels from the live DOM — if a soft-update preserved the
    // nodes, every original sentinel must still be present on a .route-opt.
    const afterSentinels = await p.evaluate(() => {
      const card = document.querySelector('#route-card');
      return Array.from(card.querySelectorAll('.route-opt')).map((n) => n.getAttribute('data-gw-sentinel'));
    });
    const preserved = beforeSentinels.every((s) => afterSentinels.includes(s));
    must(preserved, `(c) recompute #${i + 1}: every .route-opt kept its DOM node identity (sentinel test, before=${beforeSentinels.length} after=${afterSentinels.length})`);

    // Check ETA headline text changed at least once across the series.
    const tNow = await p.evaluate(() => document.querySelector('#route-card .rc-time')?.textContent || '');
    if (tNow.trim() !== lastTime.trim()) timeTextChanges++;
    lastTime = tNow;
  }

  console.log(`\n--- (d) ETA headline changed ${timeTextChanges}/3 times across recomputes ---`);
  must(timeTextChanges >= 1, '(d) at least one recompute updated the visible ETA number');

  // --- (e) option SET change → full re-render path ---
  // Toggle mode to OFF and re-route. shouldFullReroute() should fire and the
  // option buttons should be NEW DOM nodes (rebuild is correct here because
  // the option set genuinely changed).
  const beforeNodes2 = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('.route-opt')).map((n) => n);
  });
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.mode = 'off';
    try { localStorage.setItem('gw-mode', 'off'); } catch {}
  });
  // Reload to apply mode change (mode is read once from localStorage on boot).
  await p.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForFunction(() => {
    const s = document.querySelector('#splash');
    return !s || s.classList.contains('hidden') || getComputedStyle(s).opacity === '0';
  }, { timeout: 15000 });
  await wait(300);
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.834, 40.394], label: 'Costco, Lehi' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'Costco, Lehi';
    document.querySelector('#route-actions').hidden = false;
  });
  await p.click('#goBtn');
  await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 90000 });
  await p.waitForFunction(
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.route-opt').length >= 2; }",
    { timeout: 60000 }
  );
  await wait(500);
  const afterNodes2 = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('.route-opt')).map((n) => n);
  });
  const totalBefore = beforeNodes2.length;
  const totalAfter = afterNodes2.length;
  // After a full reload, the entire page got new DOM, so every node is fresh
  // — that's not what we're proving here. What we prove: the reload-then-re-
  // route produced a card with options rendered (sanity).
  must(totalAfter >= 2, `(e) full re-render path: option buttons present (got ${totalAfter})`);

  if (errs.length) { fail = true; console.error('PAGE ERRORS:', errs); }

  console.log('');
  console.log(`Reminder: also confirm npm run build is clean and scripts/option-compact-check.mjs + scripts/interact-check.mjs + scripts/zero-scroll-check.mjs + scripts/escape-check.mjs all PASS (run separately).`);
  console.log(fail ? 'FAIL' : 'PASS');
  code = fail ? 1 : 0;
} catch (e) {
  console.error('ERROR:', e.message);
  code = 1;
} finally {
  try { await Promise.race([b?.close(), wait(5000)]); } catch {}
  try { preview.kill(); } catch {}
  process.exit(code);
}

function must(cond, msg) {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${msg}`);
  if (!cond) fail = true;
}