// Hermetic nav camera-chip E2E (C12 #126): the camera chip is the MISSION
// SIGNAL — the only data element the compact banner's side column carries.
// On a camera-free route it renders "Clear" (shieldCheck + green, the payoff);
// on a camera-bearing route it shows the live passed/total count. Either way
// app._camPassed must be a real number and the chip must reflect reality.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const pv = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try {
    await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 });
    await p.click('#suggestions .sugg:not(.sugg-recent)');
  } catch {
    await p.focus(inputSel);
    await p.keyboard.press('Enter');
  }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 30000 });
await p.click('#startNavBtn');
await wait(600);

const total = await p.evaluate(() => (window.__gw._camPts || []).length);
console.log('route camera points:', total);

const drive = async (fromPct, toPct, pts) => p.evaluate(async ({ fromPct, toPct, pts }) => {
  const coords = window.__ghostwayNavCoords;
  const start = Math.floor(coords.length * fromPct);
  const end = Math.min(coords.length - 1, Math.floor(coords.length * toPct));
  const step = Math.max(1, Math.floor((end - start) / pts));
  let last = null;
  for (let i = start; i <= end; i += step) {
    const [lon, lat] = coords[i];
    let heading = 0;
    if (last) {
      const dx = lon - last[0], dy = lat - last[1];
      if (Math.hypot(dx, dy) > 1e-8) heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    }
    last = [lon, lat];
    window.__gps.handlers[0]({ coords: { longitude: lon, latitude: lat, speed: 13, heading } });
    await new Promise((r) => setTimeout(r, 130));
  }
}, { fromPct, toPct, pts });

// Drive most of the route so every camera point is passed.
await drive(0, 0.95, 40);
await wait(1000);

const chip = await p.evaluate(() => {
  const el = document.querySelector('#camChip');
  const passed = window.__gw._camPassed;
  const pts = (window.__gw._camPts || []).length;
  return {
    text: el ? el.innerText.trim() : '',
    passed,
    pts,
    hasSlash: el ? el.innerText.includes('/') : false,
    // "Clear" state: the chip carries a .cam-clear-ic span (shieldCheck icon)
    // and the visible text reads "Clear".
    hasClearIc: !!el?.querySelector('.cam-clear-ic'),
    hasClearText: (el ? el.innerText : '').includes('Clear'),
  };
});
console.log('cam chip:', JSON.stringify(chip));

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 4));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  // Camera-free route: chip honestly renders "Clear" (shieldCheck + green).
  (chip.pts === 0 && chip.hasClearIc && chip.hasClearText) ||
  // Camera-bearing route: live count ticks and chip shows passed/total.
  (typeof chip.passed === 'number' && chip.hasSlash && chip.passed >= 1);
console.log(pass ? '\nNAV-CAMCHIP PASS ✅ — Clear chip for camera-free route (or passed/total for camera route)' : '\nNAV-CAMCHIP FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);