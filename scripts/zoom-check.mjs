// Hermetic UI smoke for the Maps-parity custom zoom control (#zoomInBtn /
// #zoomOutBtn). Spawns its own vite preview (lib-preview), taps the real
// buttons, and asserts the map zoom level actually moves and the buttons are
// tappable (not covered). Also confirms the native MapLibre NavigationControl
// is gone (no .maplibregl-ctrl-zoom class in the DOM).
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

  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForSelector('#zoomInBtn', { timeout: 10000 });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 20000 });
  await wait(600);

  const coverIn = await p.evaluate(() => {
    const r = document.querySelector('#zoomInBtn').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el ? (el.id || el.closest('button')?.id || el.tagName) : null;
  });
  const coverOut = await p.evaluate(() => {
    const r = document.querySelector('#zoomOutBtn').getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return el ? (el.id || el.closest('button')?.id || el.tagName) : null;
  });
  const nativeCtrl = await p.evaluate(() => !!document.querySelector('.maplibregl-ctrl-zoom'));

  const z0 = await p.evaluate(() => window.__gw.map.map.getZoom());
  await p.click('#zoomInBtn');
  await p.click('#zoomInBtn');
  await wait(700);
  const zIn = await p.evaluate(() => window.__gw.map.map.getZoom());
  await p.click('#zoomOutBtn');
  await wait(700);
  const zOut = await p.evaluate(() => window.__gw.map.map.getZoom());
  console.log('zoomIn cover:', coverIn, '| zoomOut cover:', coverOut, '| native ctrl present:', nativeCtrl);
  console.log('zoom:', z0.toFixed(2), '-> in', zIn.toFixed(2), '-> out', zOut.toFixed(2));

  const ok = coverIn === 'zoomInBtn' && coverOut === 'zoomOutBtn'
    && nativeCtrl === false
    && zIn > z0 + 0.5 && zOut < zIn - 0.5;
  console.log('zoom buttons tappable + map zooms + native control removed:', ok);
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok && errs.filter((e) => !/favicon|404/.test(e)).length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch { }
} catch (e) {
  console.error('zoom-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
