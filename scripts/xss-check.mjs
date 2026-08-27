// XSS hardening E2E (security axis): externally-editable strings — community
// report brand/note (localStorage), street names in the nav banner (graph/OSM)
// — are injected with HTML payloads and must render as inert TEXT, never as
// live markup. Asserts: no injected element appears, no onerror fires, and
// the raw payload is visible as literal text.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const PAYLOAD = '<img src=x onerror="window.__xss=1">';
const REPORT_LONLAT = [-111.759, 40.364];

const { kill } = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(([lon, lat], payload) => {
  localStorage.setItem('gw-onboarded', '1');
  // Hostile community report persisted BEFORE the app loads.
  localStorage.setItem('gw-reports', JSON.stringify([{
    id: 'xss1', createdAt: new Date().toISOString(),
    lon, lat, kind: 'alpr',
    brand: payload, note: payload, publishedNoteId: payload,
  }]));
  window.__gps = { handlers: [] };
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: (cb) => cb({ coords: { longitude: lon, latitude: lat, speed: 0 } }),
      watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
      clearWatch: () => {},
    },
    configurable: true,
  });
}, REPORT_LONLAT, PAYLOAD);

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
await wait(1200);

// ---- 1) Report modal: hostile brand/note/publishedNoteId from localStorage ----
// Center the map on the report dot and poll until it is actually rendered,
// then click its exact pixel (real hit on the reports-dots layer).
const dot = await p.evaluate(async ([lon, lat]) => {
  const m = window.__gw.map.map;
  document.querySelector('#panel').hidden = true; // don't let the sheet eat the click
  m.jumpTo({ center: [lon, lat], zoom: 14 });
  let pt = null;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const feats = m.queryRenderedFeatures({ layers: ['reports-dots'] });
    if (feats.length) { pt = m.project(feats[0].geometry.coordinates); break; }
  }
  return pt ? { x: pt.x, y: pt.y, ok: true } : { ok: false };
}, REPORT_LONLAT);
console.log('report dot rendered:', dot.ok);
if (dot.ok) {
  await p.mouse.click(dot.x, dot.y);
  await wait(700);
}
const reportModal = await p.evaluate((payload) => {
  const body = document.querySelector('#modalBody');
  const open = body && !document.querySelector('#modal').hidden;
  return {
    open,
    injectedImgs: body ? body.querySelectorAll('img[src="x"]').length : -1,
    fired: window.__xss === 1,
    literalBrand: body ? body.textContent.includes(payload) : false,
  };
}, PAYLOAD);
console.log('report modal:', JSON.stringify(reportModal));
await p.evaluate(() => { const s = document.querySelector('#scrim'); if (s && !s.hidden) s.click(); });
await wait(400);

// ---- 2) Nav banner: hostile street name in the step list ----
const banner = await p.evaluate((payload) => {
  const a = window.__gw;
  a._navSteps = [
    { instruction: 'Head out', name: payload, distance: 120, startS: 0, modifier: 'depart', speedLimit: null, cameras: 0 },
    { instruction: 'Turn left', name: payload, distance: 300, startS: 120, modifier: 'left', speedLimit: null, cameras: 0 },
  ];
  a._navRouteCoords = [[-111.759, 40.364], [-111.758, 40.365]];
  a._routeCum = [0, 150];
  a._routeTotal = 150;
  a._totalDuration = 60;
  a._camPts = [];
  a.state.route = { engine: true, options: [{}], chosen: 0 };
  a.state.navigating = true;
  a.startNav();
  const bn = document.querySelector('#navBanner');
  const text = bn ? bn.textContent : '';
  const out = {
    shown: bn && !bn.hidden,
    injectedImgs: bn ? bn.querySelectorAll('img[src="x"]').length : -1,
    fired: window.__xss === 1,
    literalInText: text.includes(payload),
  };
  a.stopNav();
  return out;
}, PAYLOAD);
console.log('nav banner:', JSON.stringify(banner));

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
kill();

const pass =
  reportModal.open && reportModal.injectedImgs === 0 && !reportModal.fired && reportModal.literalBrand &&
  banner.shown && banner.injectedImgs === 0 && !banner.fired && banner.literalInText &&
  errs.filter((e) => !/favicon|404/.test(e)).length === 0;
console.log(pass
  ? '\nXSS-CHECK PASS ✅ — hostile report fields + street names render as inert text'
  : '\nXSS-CHECK FAIL ❌');
process.exit(pass ? 0 : 1);
