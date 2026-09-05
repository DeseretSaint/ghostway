// Fire #21 fix verification: pressing Escape on #batteryHint must hide it
// AND persist dismissal to localStorage (matching the click handler). After
// reload, the hint must stay hidden until the 24h TTL elapses.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  // Stub a low-battery state.
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('gw-onboarded', '1');
    // Don't touch gw-battery-dismissed here — this hook re-fires on reload
    // too, which would erase the dismissal flag the production code wrote
    // and break the "survives reload" assertion. We'll clear it explicitly
    // on the first page via page.evaluate().
    const listeners = { levelchange: [], chargingchange: [] };
    const battery = {
      level: 0.12,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: 7200,
      addEventListener: (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); },
      removeEventListener: (ev, cb) => {
        const arr = listeners[ev] || [];
        const idx = arr.indexOf(cb);
        if (idx >= 0) arr.splice(idx, 1);
      },
      dispatchEvent: () => true,
    };
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve(battery), configurable: true,
    });
    window.__stubBattery = battery;
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
  // Clear any previously-set dismissal (first run only — won't re-run on reload).
  await page.evaluate(() => localStorage.removeItem('gw-battery-dismissed'));
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 }).catch(() => {});
  await wait(800);

  const out = {};
  out.visibleBefore = await page.evaluate(() => {
    const h = document.querySelector('#batteryHint');
    return { exists: !!h, hidden: !!h?.hidden };
  });

  // Focus the banner area (the dismiss button is the natural focus target),
  // then press Escape.
  await page.evaluate(() => {
    const b = document.querySelector('#batteryDismiss');
    if (b) b.focus();
    else {
      const h = document.querySelector('#batteryHint');
      if (h) h.focus();
    }
  });
  await page.keyboard.press('Escape');
  await wait(200);

  out.afterEsc = await page.evaluate(() => {
    const h = document.querySelector('#batteryHint');
    const stored = localStorage.getItem('gw-battery-dismissed');
    return { hidden: !!h?.hidden, stored: stored !== null };
  });

  // Reload the page; hint should stay hidden because the dismissal flag is set.
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 }).catch(() => {});
  await wait(800);

  out.afterReload = await page.evaluate(() => {
    const h = document.querySelector('#batteryHint');
    const stored = localStorage.getItem('gw-battery-dismissed');
    return { hidden: !!h?.hidden, stored: stored !== null };
  });

  console.log(JSON.stringify(out, null, 2));
  const pass =
    out.visibleBefore.exists && out.visibleBefore.hidden === false &&
    out.afterEsc.hidden === true && out.afterEsc.stored === true &&
    out.afterReload.hidden === true && out.afterReload.stored === true &&
    errs.length === 0;
  if (errs.length) console.error('page errors:', errs);
  console.log(pass ? 'BATTERY-ESCAPE-PERSIST PASS' : 'BATTERY-ESCAPE-PERSIST FAIL');
  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
