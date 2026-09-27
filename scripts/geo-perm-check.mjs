// Q33 geolocation permission UX: pre-prompt before the native prompt (first
// run only), manual-entry alternative, no prompt-on-load, and distinct recovery
// copy per geolocation error code (1 denied / 2 unavailable / 3 timeout).
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // Stub geolocation BEFORE app load: counts calls, simulates error codes.
  // evaluateOnNewDocument persists across reloads but re-runs each load, so
  // __geoErrCode must be set AFTER every navigation.
  await page.evaluateOnNewDocument(() => {
    window.__geoCalls = 0;
    window.__geoErrCode = null;
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition(ok, err) {
          window.__geoCalls++;
          if (window.__geoErrCode) err({ code: window.__geoErrCode, message: 'stub error' });
          else ok({ coords: { longitude: -111.73, latitude: 40.23, accuracy: 5 } });
        },
      },
      configurable: true,
    });
  });

  const bootReturning = async () => {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
    // Returning user (onboarding skipped) but FIRST geolocation use.
    await page.evaluate(() => {
      // Fresh storage except the returning-user flag: kills any cached fix
      // (LOC_KEY is internal) so the lookup path actually runs.
      localStorage.clear();
      localStorage.setItem('gw-onboarded', '1');
    });
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#topbar', { timeout: 15000 });
    // init() finishes with a locate hint in #status — waiting for it guarantees
    // boot is done before we click (otherwise its late showStatus races ours).
    await page.waitForFunction(
      () => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'),
      { timeout: 15000 }
    );
    await new Promise(r => setTimeout(r, 300));
  };

  await bootReturning();
  const callsOnLoad = await page.evaluate(() => window.__geoCalls);

  // First tap → pre-prompt (NOT the native prompt).
  await page.click('#gpsBtn');
  await page.waitForSelector('#geoAllow', { visible: true, timeout: 5000 });
  const prePrompt = await page.evaluate(() => ({
    copy: document.querySelector('#modalBody')?.textContent || '',
    hasAllow: !!document.getElementById('geoAllow'),
    hasManual: !!document.getElementById('geoManual'),
    callsAfterTap: window.__geoCalls,
  }));

  // "Type a place instead" closes, focuses manual entry, sets the flag.
  await page.click('#geoManual');
  const manual = await page.evaluate(() => ({
    modalHidden: document.getElementById('modal').hidden,
    focusIsFrom: document.activeElement === document.getElementById('fromInput'),
    flag: localStorage.getItem('gw-geo-explained'),
  }));

  // Flag set → next tap goes straight to lookup (no modal), succeeds.
  await page.click('#gpsBtn');
  await new Promise(r => setTimeout(r, 400));
  const secondTap = await page.evaluate(() => ({
    modalHidden: document.getElementById('modal').hidden,
    calls: window.__geoCalls,
  }));

  // Error-code recovery copy per class. Fresh boot each time (no cached fix);
  // error code set AFTER load (the boot stub resets it).
  const statusFor = async (code) => {
    await bootReturning();
    await page.evaluate((c) => {
      localStorage.setItem('gw-geo-explained', '1'); // skip pre-prompt: error path under test
      window.__geoErrCode = c;
    }, code);
    await page.click('#gpsBtn');
    await page.waitForFunction(
      () => document.getElementById('status')?.classList.contains('warn'),
      { timeout: 5000 }
    );
    return page.evaluate(() => document.getElementById('status').textContent);
  };
  const copyDenied = await statusFor(1);
  const copyUnavailable = await statusFor(2);
  const copyTimeout = await statusFor(3);

  const checks = {
    noPromptOnLoad: callsOnLoad === 0,
    prePromptShown: prePrompt.hasAllow && prePrompt.hasManual,
    prePromptCopyBenefit: /so it can start routes from where you are/i.test(prePrompt.copy),
    noNativePromptYet: prePrompt.callsAfterTap === 0, // modal answered first
    manualCloses: manual.modalHidden,
    manualFocusesField: manual.focusIsFrom,
    flagSet: manual.flag === '1',
    secondTapStraightThrough: secondTap.modalHidden && secondTap.calls > 0,
    deniedCopy: /blocked/i.test(copyDenied) && /allow/i.test(copyDenied),
    unavailableCopy: /can.t get a location/i.test(copyUnavailable),
    timeoutCopy: /timed out/i.test(copyTimeout),
    copiesDiffer: copyDenied !== copyTimeout && copyTimeout !== copyUnavailable,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ prePrompt, manual, secondTap, copyDenied, copyUnavailable, copyTimeout, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('GEO PERMISSION UX PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
