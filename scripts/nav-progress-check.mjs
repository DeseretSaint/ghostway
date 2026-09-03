// Hermetic nav progress-bar E2E (C12 #126): drive a real route with mocked
// GPS and assert the banner is in compact mode by default (safety-first glance
// density), the progress bar fills left→right with real progress, ETA counts
// down live, the camera chip shows "Clear" for a camera-free route, and the
// approach emphasis fires near turns. Spawns its own preview so it runs
// standalone with no orphan vite servers.
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

const fillPct = () => p.evaluate(() => {
  const el = document.querySelector('#navProgressFill');
  if (!el) return null;
  return parseFloat(el.style.width) || 0;
});
const etaMin = () => p.evaluate(() => {
  const el = document.querySelector('#navEta');
  if (!el) return null;
  const t = el.textContent || '';
  const m = t.match(/(\d+)\s*min/);
  const h = t.match(/(\d+)\s*h/);
  if (!m && !h) return null;
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
});
const camChip = () => p.evaluate(() => {
  const el = document.querySelector('#camChip');
  return el ? el.textContent.trim() : null;
});
const bannerState = () => p.evaluate(() => {
  const banner = document.querySelector('#navBanner');
  if (!banner) return null;
  const elHidden = (sel) => {
    const el = banner.querySelector(sel);
    return !el || el.getClientRects().length === 0;
  };
  return {
    compact: banner.classList.contains('compact'),
    thenHidden: elHidden('.nav-then'),
    progressHidden: elHidden('.nav-progress'),
    arriveHidden: elHidden('.nav-arrive'),
    densityInBanner: !!banner.querySelector('#densityBtn'),
  };
});

const w0 = await fillPct();
const e0 = await etaMin();
const cam0 = await camChip();
const state0 = await bannerState();
// Round 68: ARIA live-region mirror of voice guidance.
const live0 = await p.evaluate(() => {
  const el = document.querySelector('#navLive');
  if (!el) return null;
  const cs = getComputedStyle(el);
  return {
    text: el.textContent,
    role: el.getAttribute('role'),
    live: el.getAttribute('aria-live'),
    hiddenW: cs.width,
  };
});
console.log('nav start — fill:', w0, '| eta:', e0, '| cam:', cam0, '| banner:', JSON.stringify(state0), '| live:', JSON.stringify(live0));

await p.evaluate(() => {
  window.__liveSeen = [];
  const el = document.querySelector('#navLive');
  if (el) new MutationObserver(() => {
    if (el.textContent) window.__liveSeen.push(el.textContent);
  }).observe(el, { childList: true, characterData: true, subtree: true });
});
await drive(0, 0.45, 25);
await wait(800);
const w1 = await fillPct();
const e1 = await etaMin();
console.log('~45% drive — fill:', w1, '| eta:', e1);
await drive(0.45, 0.9, 25);
await wait(800);
const w2 = await fillPct();
const e2 = await etaMin();
const cam2 = await camChip();
console.log('~90% drive — fill:', w2, '| eta:', e2, '| cam:', cam2);

// Round 65: maneuver-approach emphasis.
const appr = await p.evaluate(async () => {
  const coords = window.__ghostwayNavCoords;
  const seen = { t: false, f: false, animOk: false, distColor: null };
  let last = null;
  const n = coords.length;
  const step = Math.max(1, Math.floor(n / 120));
  for (let i = Math.floor(n * 0.05); i < n * 0.95; i += step) {
    const [lon, lat] = coords[i];
    let heading = 0;
    if (last) {
      const dx = lon - last[0], dy = lat - last[1];
      if (Math.hypot(dx, dy) > 1e-8) heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    }
    last = [lon, lat];
    window.__gps.handlers[0]({ coords: { longitude: lon, latitude: lat, speed: 13, heading } });
    await new Promise((r) => setTimeout(r, 60));
    const banner = document.querySelector('#navBanner');
    if (!banner || banner.hidden) continue;
    if (banner.classList.contains('approach')) {
      seen.t = true;
      const icon = banner.querySelector('.nav-icon');
      const dist = banner.querySelector('.nav-dist');
      if (icon && getComputedStyle(icon).animationName === 'approach-pulse') seen.animOk = true;
      if (dist) seen.distColor = getComputedStyle(dist).color;
    } else seen.f = true;
    if (seen.t && seen.f && seen.animOk) break;
  }
  return seen;
});
console.log('approach scan:', JSON.stringify(appr));
const liveSeen = await p.evaluate(() => window.__liveSeen || []);
console.log('live-region announcements during drive:', liveSeen.length, liveSeen.slice(0, 3));

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 4));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

// C12 #126: banner defaults to compact (safety-first). The "then" preview,
// progress bar, arrival clock, and density toggle are all hidden. The camera
// chip shows "Clear" for a camera-free route (the mission payoff).
const pass =
  // Compact by default.
  state0.compact && state0.thenHidden && state0.progressHidden && state0.arriveHidden && !state0.densityInBanner &&
  // Camera chip shows "Clear" for a camera-free route.
  cam0 === 'Clear' &&
  // Progress bar fills monotonically.
  w0 !== null && w0 < 10 &&
  w1 > w0 + 10 && w2 > w1 + 10 && w2 > 60 &&
  // ETA counts down live.
  e0 !== null && e1 !== null && e1 < e0 && e2 !== null && e2 < e1 &&
  // Approach emphasis fires near turns.
  appr.t && appr.f && appr.animOk && appr.distColor === 'rgb(255, 170, 64)' &&
  // SR live region announces.
  live0 !== null && live0.role === 'status' && live0.live === 'polite' &&
  live0.hiddenW === '1px' && (live0.text || '').length > 3 &&
  liveSeen.length >= 1;

console.log(pass ? '\nNAV-PROGRESS PASS ✅ — compact default + Clear chip + bar fills + ETA counts down + approach emphasis + SR live region' : '\nNAV-PROGRESS FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);