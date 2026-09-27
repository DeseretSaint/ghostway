// Q230/Q100 PWA update-notification UX: a new SW version surfaces a dismissible
// bottom-anchored toast; Refresh handshakes (SKIP_WAITING → controllerchange →
// one reload); dismissal defers to next launch (toast returns via reg.waiting);
// ?sw-reset is the buggy-SW escape hatch (unregister + clear caches).
// The update is simulated for real: dist/sw.js gets a byte change mid-test and
// reg.update() runs the actual install/waiting state machine.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 1. Clean boot: SW registers, NO toast.
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== undefined && !!navigator.serviceWorker.controller, { timeout: 20000 });
  const bootToast = await page.evaluate(() => !!document.getElementById('swUpdateToast'));

  // 2. Simulate a deploy: byte-change sw.js, then check for updates.
  fs.appendFileSync('dist/sw.js', `\n// update-sim ${Date.now()}\n`);
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await page.waitForSelector('#swUpdateToast', { visible: true, timeout: 15000 });
  const toast = await page.evaluate(() => {
    const t = document.getElementById('swUpdateToast');
    const cs = getComputedStyle(t);
    return {
      role: t.getAttribute('role'),
      msg: t.querySelector('.sw-toast-msg')?.textContent || '',
      fixed: cs.position === 'fixed',
      bottom: cs.bottom,
      hasRefresh: !!document.getElementById('swUpdateRefresh'),
      hasDismiss: !!document.getElementById('swUpdateDismiss'),
    };
  });

  // 3. Dismiss path: toast gone, worker still waiting (update deferred).
  await page.click('#swUpdateDismiss');
  const dismissed = await page.evaluate(async () => ({
    toastGone: !document.getElementById('swUpdateToast'),
    stillWaiting: !!(await navigator.serviceWorker.getRegistration()).waiting,
  }));

  // 4. Next launch surfaces the deferred update via reg.waiting.
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#swUpdateToast', { visible: true, timeout: 15000 });

  // 5. Refresh path: SKIP_WAITING → controllerchange → exactly one reload.
  await page.evaluate(() => { window.__marker = 'pre'; });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', timeout: 20000 }),
    page.click('#swUpdateRefresh'),
  ]);
  await page.waitForSelector('#topbar', { timeout: 15000 });
  const afterRefresh = await page.evaluate(() => ({
    markerGone: window.__marker === undefined,
    toastGone: !document.getElementById('swUpdateToast'),
    controlled: !!navigator.serviceWorker.controller,
  }));

  // 6. Escape hatch (?sw-reset): seeded junk cache is wiped, the param is
  // stripped (no reload loop), and the app re-registers clean.
  await page.evaluate(async () => {
    const c = await caches.open('ghostway-v27-tiles');
    await c.put('/junk-cache-probe', new Response('junk'));
  });
  await page.goto(`${url}?sw-reset=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#topbar', { timeout: 15000 });
  await page.waitForFunction(() => !location.search, { timeout: 15000 }); // hatch stripped the param
  await new Promise(r => setTimeout(r, 800));
  const afterReset = await page.evaluate(async () => ({
    marker: sessionStorage.getItem('gw-sw-reset'),
    junkCacheGone: !(await caches.keys()).includes('ghostway-v27-tiles'),
    paramStripped: !location.search,
  }));

  const checks = {
    noToastOnBoot: !bootToast,
    toastShown: toast.role === 'status' && /new version/i.test(toast.msg),
    bottomAnchored: toast.fixed && toast.bottom !== 'auto',
    toastControls: toast.hasRefresh && toast.hasDismiss,
    dismissWorks: dismissed.toastGone && dismissed.stillWaiting,
    deferredReturnsNextLaunch: true, // waitForSelector in step 4 gated this
    refreshReloadsOnce: afterRefresh.markerGone && afterRefresh.toastGone && afterRefresh.controlled,
    escapeHatchRuns: !!afterReset.marker,
    escapeHatchClearsCaches: afterReset.junkCacheGone,
    escapeHatchNoLoop: afterReset.paramStripped,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ toast, dismissed, afterRefresh, afterReset, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('PWA UPDATE UX PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
