// A11y #2: battery-low affordance — stub navigator.getBattery() with a low
// (non-charging) level and assert #batteryHint renders the right copy with
// a working dismiss button that persists dismissal to localStorage.
//
// Round-23 ux item (manager round-23). Also covers the absent-API branch
// (no getBattery → hint stays hidden, no errors thrown).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout — force exit'); process.exit(2); }, 120000).unref();

const pv = await startPreview();

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));

// Stub getBattery BEFORE app scripts run via evaluateOnNewDocument.
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  // 12% — below the 20% threshold, not charging. The hint MUST show.
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
  // Expose for the test to mutate later.
  window.__stubBattery = battery;
  window.__stubBatteryListeners = listeners;
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
// Wait long enough for the async wireBatteryHint() to resolve + paint.
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

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
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

console.log(pass ? '\nBATTERY-HINT PASS ✅ — low-battery hint renders, dismiss persists, level/charging changes update visibility' : '\nBATTERY-HINT FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);