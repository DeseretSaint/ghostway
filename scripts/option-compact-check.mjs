// Option-card compaction check (PRIORITY 4 #2, updated for #31 mode-chip UI).
// The route card now shows ONE route (the selected mode's) with a chip row
// to switch modes — the old stacked .route-opt chooser is gone.
//
// Asserts:
//   (a) no legacy detour-warning strings ("camera-walled", "clear route too
//       long", "costs extra time") anywhere on the card
//   (b) chip meta present on every chip (duration · camera count)
//   (c) KEEP set:
//       - 3 mode chips (Clearest/Balanced/Fastest)
//       - per-chip camera count on EVERY chip
//       - "Fully clear of known cameras" badge renders when 0-camera option
//         exists (Lehi, Strict mode)
//       - single route card (no .route-opt chooser)
//   (d) build clean (run `npm run build` separately)
//   (e) interact-check + zero-scroll-check + escape-check still PASS (run
//       separately; this script focuses on a/b/c).

import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 240s timeout'); process.exit(2); }, 240000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
let b;
let fail = false;

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

  // --- Corridor 1: Lehi (0-camera Clearest option → "Fully clear" badge) ---
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
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.mode-chip').length === 3; }",
    { timeout: 60000 }
  );
  await wait(500);

  const lehi = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    const chips = Array.from(card.querySelectorAll('.mode-chip'));
    const cardText = card.innerText;
    const cardHtml = card.innerHTML;
    return {
      chipCount: chips.length,
      chipMetaCount: chips.filter((c) => c.querySelector('.chip-meta')).length,
      chipCamCount: chips.filter((c) => /cam/.test(c.textContent)).length,
      routeOptCount: card.querySelectorAll('.route-opt').length,
      legacy: {
        'camera-walled': /camera[-\s]walled/i.test(cardText) || /camera[-\s]walled/i.test(cardHtml),
        'clear route too long': /clear route too long/i.test(cardText) || /clear route too long/i.test(cardHtml),
        'costs extra time': /costs extra time/i.test(cardText) || /costs extra time/i.test(cardHtml),
      },
      fullyClearBadge: /Fully clear of known cameras/i.test(cardText),
      rcHeadPresent: !!card.querySelector('.rc-head'),
      rcTimePresent: !!card.querySelector('.rc-time'),
      rcDistPresent: !!card.querySelector('.rc-dist'),
    };
  });

  console.log('\n--- Corridor 1: Lehi (0-cam Clearest → "Fully clear" badge) ---');
  must(lehi.chipCount === 3, `(c) 3 mode chips present (got ${lehi.chipCount})`);
  must(lehi.routeOptCount === 0, `(c) no .route-opt chooser (got ${lehi.routeOptCount})`);
  must(lehi.chipMetaCount === 3, `(b) chip meta (duration · cams) on every chip (${lehi.chipMetaCount}/3)`);
  must(lehi.chipCamCount === 3, `(b) per-chip camera count on every chip (${lehi.chipCamCount}/3)`);
  must(lehi.rcHeadPresent && lehi.rcTimePresent && lehi.rcDistPresent, `(c) single route card with rc-head/time/dist`);
  must(
    !lehi.legacy['camera-walled'] && !lehi.legacy['clear route too long'] && !lehi.legacy['costs extra time'],
    `(a) no legacy detour-warning strings present (${JSON.stringify(lehi.legacy)})`
  );
  must(lehi.fullyClearBadge, `(c) "Fully clear of known cameras" badge rendered (0-cams Strict option)`);

  // --- Corridor 2: BYU (Strict falls back → chip meta still honest) ---
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
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.mode-chip').length === 3; }",
    { timeout: 60000 }
  );
  await wait(500);

  const byu = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    const chips = Array.from(card.querySelectorAll('.mode-chip'));
    const cardText = card.innerText;
    const cardHtml = card.innerHTML;
    return {
      chipCount: chips.length,
      chipMetaCount: chips.filter((c) => c.querySelector('.chip-meta')).length,
      chipCamCount: chips.filter((c) => /cam/.test(c.textContent)).length,
      routeOptCount: card.querySelectorAll('.route-opt').length,
      legacy: {
        'camera-walled': /camera[-\s]walled/i.test(cardText) || /camera[-\s]walled/i.test(cardHtml),
        'clear route too long': /clear route too long/i.test(cardText) || /clear route too long/i.test(cardHtml),
        'costs extra time': /costs extra time/i.test(cardText) || /costs extra time/i.test(cardHtml),
      },
      rcHeadPresent: !!card.querySelector('.rc-head'),
    };
  });

  console.log('\n--- Corridor 2: BYU (Strict falls back → chip meta honest) ---');
  must(byu.chipCount === 3, `(c) 3 mode chips present (got ${byu.chipCount})`);
  must(byu.routeOptCount === 0, `(c) no .route-opt chooser (got ${byu.routeOptCount})`);
  must(byu.chipMetaCount === 3, `(b) chip meta on every chip (${byu.chipMetaCount}/3)`);
  must(byu.chipCamCount === 3, `(b) per-chip camera count on every chip (${byu.chipCamCount}/3)`);
  must(byu.rcHeadPresent, `(c) single route card with rc-head`);
  must(
    !byu.legacy['camera-walled'] && !byu.legacy['clear route too long'] && !byu.legacy['costs extra time'],
    `(a) no legacy detour-warning strings present (${JSON.stringify(byu.legacy)})`
  );

  // Filter expected environmental errors: CORS blocks on external WZDx feeds
  // (Idaho 511, CDOT TG, AZ 511) are pre-existing and unrelated to option-card
  // compaction. Same filter applied in zero-scroll + interact checks.
  const realErrs = errs.filter((e) => !/favicon|cotg\.carsprogram|511\.idaho|az511\.gov|CORS policy|Failed to load resource/.test(e));
  if (realErrs.length) { fail = true; console.error('PAGE ERRORS:', realErrs); }

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
