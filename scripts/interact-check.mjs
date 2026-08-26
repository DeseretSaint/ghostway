import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

async function main() {
  // Poll until the preview server accepts connections (fixed sleeps are flaky
  // — npx cold-start can exceed them → ERR_CONNECTION_REFUSED).
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 800 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  // Test as a RETURNING user so first-run onboarding doesn't cover the map.
  await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  // Wait for the splash to dismiss (it hides up to ~4.4s; hit-testing through
  // it yields 'splash' for every control = false FAIL).
  try {
    await page.waitForFunction(() => {
      const s = document.querySelector('#splash');
      return !s || s.hidden;
    }, { timeout: 8000 });
  } catch { /* proceed anyway; hits will show what's covering */ }
  await wait(500);

  // Helper: what element is at the center of a selector?
  // NOTE: SVG children have className as SVGAnimatedString (an object, not a
  // string) — coerce with getAttribute('class') so hits serialize usefully.
  // A hit on a DESCENDANT of the control (e.g. an SVG icon path inside a
  // button) still activates the control, so it counts as hitting the control.
  const atCenter = (sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return 'missing';
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (!hit) return 'none';
      if (hit === el || el.contains(hit)) {
        return el.id || el.getAttribute('class') || el.tagName;
      }
      return hit.id || hit.getAttribute('class') || hit.tagName;
    }, sel);

  const checks = {};
  // (A) At load, the visible controls must not be covered by an overlay.
  checks.menuHit = await atCenter('#menuBtn');
  checks.gpsHit = await atCenter('#gpsBtn');
  checks.fromHit = await atCenter('#fromInput');
  checks.toHit = await atCenter('#toInput');

  // (B) Real mobile flow: set BOTH endpoints via suggestions, then REAL-click Go.
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  await wait(1100);
  let s = await page.$('#suggestions .sugg');
  if (s) await s.click();
  await wait(500);
  await page.type('#toInput', 'Lindon, Utah');
  await wait(1100);
  s = await page.$('#suggestions .sugg');
  if (s) await s.click();
  await wait(600);
  checks.goVisible = await page.evaluate(() => {
    const r = document.querySelector('#goBtn').getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !document.querySelector('#route-actions').hidden;
  });
  checks.goHit = await atCenter('#goBtn');
  // Picking both endpoints auto-routes now; if Go is still visible (auto-route
  // pending), give it a real click. Otherwise routing already ran.
  if (checks.goHit === 'goBtn') {
    await page.click('#goBtn');
  }
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 30000 });
    checks.routed = true;
  } catch {
    checks.routed = false;
  }
  await wait(1000);
  checks.routeCardShown = await page.evaluate(() => !document.querySelector('#route-card').hidden);
  // (C) After routing the search panel collapses (Google Maps behavior). The
  //     Start button must be clickable; the mode switch lives behind "Edit".
  checks.startNavHit = await atCenter('#startNavBtn');
  const edit = await page.$('#editRouteBtn');
  if (edit) {
    await edit.click();
    await wait(400);
    checks.modeHit = await atCenter('.mode-btn.active');
  } else {
    checks.modeHit = await atCenter('.mode-btn.active');
  }

  console.log(JSON.stringify(checks, null, 1));
  console.log('page errors:', errs.slice(0, 4));

  const pass =
    checks.menuHit === 'menuBtn' &&
    checks.gpsHit === 'gpsBtn' &&
    checks.fromHit === 'fromInput' &&
    checks.toHit === 'toInput' &&
    checks.routed &&
    checks.routeCardShown &&
    String(checks.modeHit).includes('mode-btn') &&
    checks.startNavHit === 'startNavBtn' &&
    errs.filter((e) => !/favicon/.test(e)).length === 0;

  // browser.close() can hang forever under swiftshader; race it, then force-exit.
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log(pass ? '\nINTERACTION PASS ✅ — full flow clickable + routes' : '\nINTERACTION FAIL ❌');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
