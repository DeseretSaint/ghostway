// A11y #2: battery-low affordance — stub navigator.getBattery() with a low
// (non-charging) level and assert #batteryHint renders the right copy with
// a working dismiss button that persists dismissal to localStorage.
//
// Extended (round-28): multi-viewport contrast probe — 320/375/390/430/720/1024/1440
// × light/dark, asserting AA contrast (≥4.5:1) on .battery-hint and .battery-dismiss.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { VIEWPORT_LADDER, THEMES, AA_THRESHOLD, contrast, parseRgb } from './lib-contrast.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 300s timeout — force exit'); process.exit(2); }, 300000).unref();

const pv = await startPreview();

// --- Phase 1: behavioral test at 390x844 (original) ---
const b1 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const p = await b1.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));

await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
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
    value: () => Promise.resolve(battery),
    configurable: true,
  });
  window.__stubBattery = battery;
  window.__stubBatteryListeners = listeners;
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
await wait(800);

// 1) Hint is visible with the expected copy.
const low = await p.evaluate(() => {
  const h = document.querySelector('#batteryHint');
  const m = document.querySelector('#batteryMsg');
  return {
    exists: !!h,
    hidden: h?.hidden,
    role: h?.getAttribute('role') || null,
    text: m?.textContent || null,
  };
});
console.log('low-battery state:', JSON.stringify(low));

// 2) Dismiss button hides the hint AND persists to localStorage.
await p.click('#batteryDismiss');
await wait(200);
const dismissed = await p.evaluate(() => {
  const h = document.querySelector('#batteryHint');
  const stored = localStorage.getItem('gw-battery-dismissed');
  return {
    hidden: h?.hidden,
    stored: !!stored,
  };
});
console.log('after dismiss:', JSON.stringify(dismissed));

// 3) Re-show path: bump battery to 80% (above threshold, charging), hint stays hidden.
await p.evaluate(() => {
  const b = window.__stubBattery;
  b.level = 0.8;
  b.charging = true;
  (window.__stubBatteryListeners.levelchange || []).forEach((cb) => cb({}));
  (window.__stubBatteryListeners.chargingchange || []).forEach((cb) => cb({}));
});
await wait(200);
const highHidden = await p.evaluate(() => document.querySelector('#batteryHint').hidden);
console.log('high + charging → hidden:', highHidden);

// 4) Drop back to 5% (not charging) → hint re-shows.
await p.evaluate(() => {
  const b = window.__stubBattery;
  b.level = 0.05;
  b.charging = false;
  (window.__stubBatteryListeners.levelchange || []).forEach((cb) => cb({}));
  (window.__stubBatteryListeners.chargingchange || []).forEach((cb) => cb({}));
});
await wait(200);
const reShown = await p.evaluate(() => {
  const h = document.querySelector('#batteryHint');
  const m = document.querySelector('#batteryMsg');
  return { hidden: h.hidden, text: m.textContent };
});
console.log('dropped to 5% → re-shown:', JSON.stringify(reShown));

const behavioralPass =
  low.exists &&
  low.hidden === false &&
  low.role === 'status' &&
  typeof low.text === 'string' &&
  /Battery low \(12%\)/.test(low.text) &&
  dismissed.hidden === true &&
  dismissed.stored === true &&
  highHidden === true &&
  reShown.hidden === false &&
  /Battery low \(5%\)/.test(reShown.text);

console.log(behavioralPass
  ? '\nBEHAVIORAL PASS ✅ — low-battery hint renders, dismiss persists, level/charging changes update visibility'
  : '\nBEHAVIORAL FAIL ❌');

try { await Promise.race([b1.close(), wait(5000)]); } catch {}

// --- Phase 2: multi-viewport contrast sweep ---
console.log('\n=== MULTI-VIEWPORT CONTRAST PROBE ===');

// Measure a single (viewport, theme) combo — exported for reuse.
async function measureBatteryContrast(browser, vp, theme) {
  const label = `${vp.width}x${vp.height} ${theme}`;
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
    });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

    // Stub getBattery for low battery to trigger the hint.
    await page.evaluate(() => {
      const battery = {
        level: 0.12, charging: false, chargingTime: Infinity, dischargingTime: 7200,
        addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
      };
      Object.defineProperty(navigator, 'getBattery', { value: () => Promise.resolve(battery), configurable: true });
    });
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
    await wait(1000);

    const measurements = await page.evaluate(() => {
      const h = document.querySelector('#batteryHint');
      const d = document.querySelector('#batteryDismiss');
      if (!h || !d) return { error: 'elements missing' };
      const hStyle = getComputedStyle(h);
      const dStyle = getComputedStyle(d);
      return {
        hidden: h.hidden,
        hColor: hStyle.color,
        hBg: hStyle.backgroundColor,
        dColor: dStyle.color,
        dBg: dStyle.backgroundColor,
      };
    });

    const results = [];

    if (measurements.hColor && measurements.hBg) {
      const textRgb = parseRgb(measurements.hColor);
      const bgRgb = parseRgb(measurements.hBg);
      if (textRgb?.length === 3 && bgRgb?.length === 3) {
        const ratio = contrast(textRgb, bgRgb);
        const pass = ratio >= AA_THRESHOLD;
        results.push({ el: '.battery-hint', label, ratio: ratio.toFixed(2), pass, textColor: measurements.hColor, bgColor: measurements.hBg });
      }
    }

    if (measurements.dColor && measurements.dBg) {
      const textRgb = parseRgb(measurements.dColor);
      const bgRgb = parseRgb(measurements.dBg);
      if (textRgb?.length === 3 && bgRgb?.length === 3) {
        const ratio = contrast(textRgb, bgRgb);
        const pass = ratio >= AA_THRESHOLD;
        results.push({ el: '.battery-dismiss', label, ratio: ratio.toFixed(2), pass, textColor: measurements.dColor, bgColor: measurements.dBg });
      }
    }

    return results;
  } finally {
    try { await page.goto('about:blank'); } catch {}
    try { await page.close(); } catch {}
  }
}

const b2 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const contrastResults = [];
let contrastAllPass = true;

for (const vp of VIEWPORT_LADDER) {
  for (const theme of THEMES) {
    try {
      const results = await measureBatteryContrast(b2, vp, theme);
      for (const r of results) {
        if (!r.pass) contrastAllPass = false;
        console.log(`  ${r.pass ? 'PASS' : 'FAIL'} | ${r.label} | ${r.el}: ${r.ratio}:1 (text=${r.textColor} bg=${r.bgColor})`);
        contrastResults.push(r);
      }
    } catch (e) {
      const label = `${vp.width}x${vp.height} ${theme}`;
      console.log(`  ERROR | ${label} | ${e.message}`);
      contrastAllPass = false;
    }
    // Brief pause between iterations to let Chrome breathe.
    await wait(200);
  }
}

console.log(contrastAllPass
  ? `\nCONTRAST PASS ✅ — all ${contrastResults.length} measurements ≥4.5:1 AA`
  : `\nCONTRAST FAIL ❌ — some measurements below AA threshold`);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b2.close(), wait(5000)]); } catch {}
pv.kill();

const overallPass = behavioralPass && contrastAllPass;
console.log(overallPass
  ? '\nBATTERY-HINT PASS ✅ — behavioral + multi-viewport contrast all green'
  : '\nBATTERY-HINT FAIL ❌');
process.exit(overallPass ? 0 : 1);
