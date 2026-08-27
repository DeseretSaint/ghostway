// Hermetic UI check: distance-tradeoff line on route options (round 81,
// driver-preference research follow-through). Each non-fastest option whose
// distance differs from the fastest by ≥0.1 km must show "↓ X shorter than
// fastest" (accent) or "↑ X longer than fastest" (muted); the fastest option
// itself shows no tradeoff line. Drives a real PG→Costco route (Keaton's
// repro corridor) through the REAL UI path: state → #goBtn → renderEngineCard.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
let b;
try {
  b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Keaton's repro corridor: PG → Costco Lehi.
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

  const res = await p.evaluate(() => {
    const opts = [...document.querySelectorAll('#route-card .route-opt')];
    const rows = opts.map((el) => ({
      label: el.querySelector('.opt-label')?.textContent?.trim() || '',
      meta: el.querySelector('.opt-meta')?.textContent?.trim() || '',
      tradeoff: el.querySelector('.opt-tradeoff')?.textContent?.trim() || null,
      tradeoffClass: el.querySelector('.opt-tradeoff')?.className || null,
    }));
    // Ground truth: engine option distances (meters) from app state.
    // "fastest" = the mode 'off' option (same definition as ui.js).
    const route = window.__gw?.state?.route;
    const dists = route?.engine ? route.options.map((o) => o.distance) : null;
    let fastestIdx = route?.engine ? route.options.findIndex((o) => o.mode === 'off') : -1;
    if (fastestIdx < 0) fastestIdx = 0;
    return { rows, dists, fastestIdx, count: opts.length };
  });
  console.log(JSON.stringify(res, null, 2));

  let ok = res.count >= 2 && Array.isArray(res.dists) && res.dists.length === res.count;
  if (!ok) console.error('FAIL: route options / state distances mismatch');
  // Fastest option: no tradeoff line.
  if (res.rows[res.fastestIdx]?.tradeoff) { ok = false; console.error('FAIL: fastest option shows a tradeoff line'); }
  // Non-fastest options with a real distance delta (≥100 m): tradeoff line
  // present + direction matches the engine distances.
  res.rows.forEach((r, i) => {
    if (i === res.fastestIdx) return;
    const delta = res.dists[i] - res.dists[res.fastestIdx];
    if (Math.abs(delta) < 100) {
      if (r.tradeoff) { ok = false; console.error(`FAIL: opt ${i} shows tradeoff for delta < 100 m`); }
      return;
    }
    if (!r.tradeoff) { ok = false; console.error(`FAIL: opt ${i} missing tradeoff line (delta ${Math.round(delta)} m)`); return; }
    const wantShorter = delta < 0;
    const isShorter = r.tradeoff.includes('shorter');
    if (isShorter !== wantShorter) { ok = false; console.error(`FAIL: opt ${i} direction wrong: "${r.tradeoff}" vs delta ${Math.round(delta)} m`); }
    if (wantShorter && !/shorter/.test(r.tradeoffClass || '')) { ok = false; console.error(`FAIL: opt ${i} shorter class missing`); }
    console.log(`opt ${i} (${r.label}): "${r.tradeoff}" — direction ${isShorter === wantShorter ? 'OK' : 'WRONG'}`);
  });
  // Option buttons still work after the extra span: click each, assert it
  // becomes the chosen one (aria-pressed) and the card re-renders intact.
  for (let i = 0; i < res.count; i++) {
    await p.evaluate((idx) => {
      document.querySelectorAll('#route-card .route-opt')[idx]?.click();
    }, i);
    await wait(250);
    const pressed = await p.evaluate(() =>
      [...document.querySelectorAll('#route-card .route-opt')].map((el) => el.getAttribute('aria-pressed'))
    );
    if (pressed.filter((v) => v === 'true').length !== 1 || pressed[i] !== 'true') {
      ok = false; console.error(`FAIL: option click ${i} did not select (pressed=${JSON.stringify(pressed)})`);
    }
  }
  if (errs.length) { ok = false; console.error('PAGE ERRORS:', errs); }
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
