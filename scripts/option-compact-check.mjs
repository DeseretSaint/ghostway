// Option-card compaction check (PRIORITY 4 #2): the route option card must
// carry ONLY the compact tradeoffs the human-feel-lab spec calls out, and
// the old detour-complaint warn spans ("best effort — camera-walled",
// "best effort — clear route too long", "costs extra time") must be gone.
//
// Asserts (per QUEUE-ghostway-ux.md #5):
//   (a) no .opt-warn / .opt-trouble className on the route card (both corridors)
//   (b) opt-meta suffix still present (duration · distance · cams · hw · delay)
//   (c) KEEP set:
//       - per-option camera count chip on EVERY option
//       - "Camera-free route" badge renders when a 0-camera option exists (Lehi)
//       - "Most natural" pill template present in source (conditional feature)
//       - honest gate-snap "clear to within ~N m" renders when Strict falls back (BYU)
//   (d) build clean (run `npm run build` separately)
//   (e) interact-check + zero-scroll-check + escape-check still PASS (run
//       separately; this script focuses on a/b/c).

import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 240s timeout'); process.exit(2); }, 240000).unref();

// Structural check: the "Most natural" pill template must exist in ui.js
// (it's a conditional feature — only renders when a non-fastest option is
// shorter AND uses no more highway — so we verify the template, not a
// specific corridor render).
const uiSrc = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const naturalTplPresent = /opt-natural[\s\S]{0,200}Most natural/.test(uiSrc);
const camFreeTplPresent = /opt-clear-badge[\s\S]{0,200}Camera-free route/.test(uiSrc);
const gateSnapTplPresent = /clear to within/.test(uiSrc);

console.log('--- Structural template checks (ui.js) ---');
console.log(`${naturalTplPresent ? 'OK  ' : 'FAIL'} "Most natural" pill template present`);
console.log(`${camFreeTplPresent ? 'OK  ' : 'FAIL'} "Camera-free route" badge template present`);
console.log(`${gateSnapTplPresent ? 'OK  ' : 'FAIL'} gate-snap "clear to within ~N m" template present`);

const preview = await startPreview({ port: 4173 });
let code = 1;
let b;
let fail = !naturalTplPresent || !camFreeTplPresent || !gateSnapTplPresent;

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

  // --- Corridor 1: Lehi (0-camera Clearest option → camera-free badge renders) ---
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.8226, 40.3885], label: 'Costco, Lehi' };
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

  const lehi = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    const opts = Array.from(card.querySelectorAll('.route-opt'));
    const cardText = card.innerText;
    const cardHtml = card.innerHTML;
    return {
      optCount: opts.length,
      warnSpans: card.querySelectorAll('.opt-warn, .opt-trouble, .opt-warn-row').length,
      legacy: {
        'camera-walled': /camera[-\s]walled/i.test(cardText) || /camera[-\s]walled/i.test(cardHtml),
        'clear route too long': /clear route too long/i.test(cardText) || /clear route too long/i.test(cardHtml),
        'costs extra time': /costs extra time/i.test(cardText) || /costs extra time/i.test(cardHtml),
      },
      optsMissingMeta: opts.filter((o) => !o.querySelector('.opt-meta')).length,
      cameraCountChips: card.querySelectorAll('.opt-cams').length,
      camFreeBadge: !!card.querySelector('.opt-clear-badge'),
    };
  });

  console.log('\n--- Corridor 1: Lehi (0-cam Clearest → camera-free badge) ---');
  must(lehi.optCount >= 2, `route options rendered (got ${lehi.optCount})`);
  must(lehi.warnSpans === 0, `(a) no .opt-warn / .opt-trouble className survives (got ${lehi.warnSpans})`);
  must(
    !lehi.legacy['camera-walled'] && !lehi.legacy['clear route too long'] && !lehi.legacy['costs extra time'],
    `(a) no legacy detour-warning strings present (${JSON.stringify(lehi.legacy)})`
  );
  must(lehi.optsMissingMeta === 0, `(b) opt-meta suffix present on every option (missing on ${lehi.optsMissingMeta})`);
  must(lehi.cameraCountChips === lehi.optCount, `(c) per-option camera count on every option (${lehi.cameraCountChips}/${lehi.optCount})`);
  must(lehi.camFreeBadge, `(c) "Camera-free route" badge rendered (0-cams option present)`);

  // --- Corridor 2: BYU (Strict falls back → gate-snap renders) ---
  // Reload to reset state cleanly for the second corridor.
  await p.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.6553, 40.2523], label: 'BYU Provo' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'BYU Provo';
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

  const byu = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    const opts = Array.from(card.querySelectorAll('.route-opt'));
    const cardText = card.innerText;
    const cardHtml = card.innerHTML;
    return {
      optCount: opts.length,
      warnSpans: card.querySelectorAll('.opt-warn, .opt-trouble, .opt-warn-row').length,
      legacy: {
        'camera-walled': /camera[-\s]walled/i.test(cardText) || /camera[-\s]walled/i.test(cardHtml),
        'clear route too long': /clear route too long/i.test(cardText) || /clear route too long/i.test(cardHtml),
        'costs extra time': /costs extra time/i.test(cardText) || /costs extra time/i.test(cardHtml),
      },
      optsMissingMeta: opts.filter((o) => !o.querySelector('.opt-meta')).length,
      cameraCountChips: card.querySelectorAll('.opt-cams').length,
      gateSnapLines: Array.from(card.querySelectorAll('.opt-warn'))
        .map((s) => s.textContent.trim())
        .filter((t) => /clear to within/i.test(t)).length,
      gateSnapSample: (card.querySelector('.opt-warn')?.textContent || '').trim(),
    };
  });

  console.log('\n--- Corridor 2: BYU (Strict falls back → gate-snap) ---');
  must(byu.optCount >= 2, `route options rendered (got ${byu.optCount})`);
  must(byu.warnSpans >= 1, `(a) .opt-warn span present for gate-snap (got ${byu.warnSpans}) — this is the KEEP, not a removal target`);
  must(
    !byu.legacy['camera-walled'] && !byu.legacy['clear route too long'] && !byu.legacy['costs extra time'],
    `(a) no legacy detour-warning strings present (${JSON.stringify(byu.legacy)})`
  );
  must(byu.optsMissingMeta === 0, `(b) opt-meta suffix present on every option (missing on ${byu.optsMissingMeta})`);
  must(byu.cameraCountChips === byu.optCount, `(c) per-option camera count on every option (${byu.cameraCountChips}/${byu.optCount})`);
  must(
    byu.gateSnapLines >= 1,
    `(c) honest gate-snap "clear to within ~N m" rendered (got ${byu.gateSnapLines}; sample="${byu.gateSnapSample}")`
  );

  if (errs.length) { fail = true; console.error('PAGE ERRORS:', errs); }

  console.log('');
  console.log(`Reminder: also confirm npm run build is clean and scripts/interact-check.mjs + scripts/zero-scroll-check.mjs + scripts/escape-check.mjs all PASS (run those separately; this script covers a/b/c).`);
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