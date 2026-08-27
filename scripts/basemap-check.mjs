// Hermetic UI smoke for the Maps-parity basemap switcher (#basemapBtn).
// Spawns its own vite preview (lib-preview), taps the real button, and asserts
// the base style flips AND the custom camera/route/endpoint layers survive the
// switch (MapLibre setStyle() diffs the new base style, so re-adding must be
// idempotent — verified here).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
try {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); localStorage.removeItem('gw-basemap'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForSelector('#basemapBtn', { timeout: 10000 });
  // Splash overlay blocks interaction until the map is idle (auto-clears ≤4s).
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 20000 });

  // Seed a route so we can prove its data survives the style switch.
  await p.evaluate(() => window.__gw.map.setRoute([
    { type: 'Feature', properties: { color: '#3ad6c5' }, geometry: { type: 'LineString', coordinates: [[-111.70, 40.30], [-111.60, 40.40]] } },
  ]));

  // Is the button actually tappable (not covered by another element)?
  const cover = await p.evaluate(() => {
    const r = document.querySelector('#basemapBtn').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el ? (el.id || el.closest('button')?.id || el.tagName) : null;
  });

  const before = await p.evaluate(() => ({
    base: window.__gw.map.getBasemap(),
    btn: document.querySelector('#basemapBtn').getAttribute('aria-pressed'),
    routeFeats: window.__gw.map.map.getSource('route')._data.features.length,
  }));
  console.log('button hit-test target:', cover, '| before:', JSON.stringify(before));

  await p.click('#basemapBtn');
  await p.waitForFunction(() => window.__gw.map.getBasemap() === 'dark', { timeout: 30000 });
  await p.waitForFunction(
    () => !!window.__gw.map.map.getLayer('route-line')
       && !!window.__gw.map.map.getLayer('cameras-layer')
       && !!window.__gw.map.map.getLayer('endpoint-dots')
       && !!window.__gw.map.map.getLayer('waypoint-dot'),
    { timeout: 30000 },
  );
  await wait(400);
  const after = await p.evaluate(() => {
    const m = window.__gw.map;
    const rs = m.map.getSource('route');
    return {
      base: m.getBasemap(),
      btn: document.querySelector('#basemapBtn').getAttribute('aria-pressed'),
      on: document.querySelector('#basemapBtn').classList.contains('on'),
      routeLine: !!m.map.getLayer('route-line'),
      camLayer: !!m.map.getLayer('cameras-layer'),
      endpoints: !!m.map.getLayer('endpoint-dots'),
      waypoint: !!m.map.getLayer('waypoint-dot'),
      routeSource: rs ? (rs._data ? rs._data.features.length : 'no-_data') : 'undefined',
      styleLoaded: m.map.isStyleLoaded(),
    };
  });
  console.log('after toggle:', JSON.stringify(after));

  const ok = cover === 'basemapBtn'
    && before.base === 'standard' && before.btn === 'false' && before.routeFeats === 1
    && after.base === 'dark' && after.btn === 'true' && after.on === true
    && after.routeLine && after.camLayer && after.endpoints && after.waypoint
    && after.routeSource === 1;
  console.log('basemap toggles + custom layers rebuilt + data replayed + button tappable:', ok);
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok && errs.filter((e) => !/favicon|404/.test(e)).length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch { }
} catch (e) {
  console.error('basemap-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
