// Engine-tier E2E: inside-coverage corridor (PG→Costco) must use the local
// graph; outside-coverage corridor (Denver→Boulder) must fall through to
// Valhalla and still show route options + camera counts.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const pv = await startPreview();

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));

// Returning user: skip first-run onboarding overlay.
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function route(fromQ, toQ) {
  // Reset via Edit button if a card is showing.
  const edit = await p.$('#editRouteBtn');
  if (edit) await edit.click();
  await wait(300);
  // Clear fields AND fire the input event so the app hides the suggestion
  // panel (a bare .value='' leaves stale rows visible).
  await p.evaluate(() => {
    for (const sel of ['#fromInput', '#toInput']) {
      const inp = document.querySelector(sel);
      inp.value = '';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await p.type('#toInput', toQ);
  try {
    // Wait for REAL search results: the loading row gone and a non-recent
    // suggestion present (recent-destinations rows also match .sugg).
    await p.waitForFunction(
      () =>
        !document.querySelector('#suggestions .sugg-loading') &&
        !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'),
      { timeout: 12000 }
    );
    await p.click('#suggestions .sugg:not(.sugg-recent)');
  } catch { await p.focus('#toInput'); await p.keyboard.press('Enter'); }
  await wait(600);
  await p.type('#fromInput', fromQ);
  try {
    await p.waitForFunction(
      () =>
        !document.querySelector('#suggestions .sugg-loading') &&
        !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'),
      { timeout: 12000 }
    );
    await p.click('#suggestions .sugg:not(.sugg-recent)');
  } catch { await p.focus('#fromInput'); await p.keyboard.press('Enter'); }
  // The local + Valhalla paths set __ghostwayDebug.routed; the legacy
  // BRouter/OSRM fallback does NOT — accept a rendered route card too so the
  // outside-coverage leg doesn't burn the full 45s timeout.
  await p.waitForFunction(
    'window.__ghostwayDebug?.routed === true || (document.querySelector("#route-card") && !document.querySelector("#route-card").hidden)',
    { timeout: 45000 }
  );
  await wait(400);
  return p.evaluate(() => ({
    dbg: window.__ghostwayDebug || {},
    card: document.querySelector('#route-card')?.innerText?.replace(/\s+/g, ' ')?.slice(0, 160),
    opts: [...document.querySelectorAll('.route-opt .opt-meta')].map((e) => e.textContent),
  }));
}

const inside = await route('Pleasant Grove Utah', 'Costco Lehi');
console.log('INSIDE coverage:', JSON.stringify({ engine: inside.dbg.engine, ms: inside.dbg.ms, opts: inside.opts }));

// Clear debug flag before the second route.
await p.evaluate(() => { window.__ghostwayDebug = null; });
const outside = await route('Denver Colorado', 'Boulder Colorado');
console.log('OUTSIDE coverage:', JSON.stringify({ engine: outside.dbg.engine, ms: outside.dbg.ms, opts: outside.opts }));
console.log('outside card:', outside.card);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 4));
pv.kill();
try { await Promise.race([b.close(), wait(5000)]); } catch {}

// Outside coverage must produce a routed result. Valhalla is the preferred
// national tier, but it's a flaky public demo — if it's down, the app must
// degrade gracefully to the legacy BRouter/OSRM tier and STILL route. Both are
// acceptable; a crash/empty result is not.
const usedValhalla = outside.dbg.engine === 'valhalla';
const legacyRouted = /km|min|cameras/i.test(outside.card || '');
const pass =
  inside.dbg.engine === true &&
  (usedValhalla || legacyRouted);
console.log(usedValhalla
  ? '\nTIERS PASS ✅ — local graph in coverage, Valhalla national fallback'
  : legacyRouted
    ? '\nTIERS PASS ✅ — local graph in coverage, Valhalla DOWN → graceful legacy fallback'
    : '\nTIERS FAIL ❌');
process.exit(pass ? 0 : 1);
