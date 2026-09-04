// Hermetic UI smoke for the camera-layer toggle persistence (#camLayerBtn).
// Verifies the toggle survives reload via localStorage (gw-cam-layer),
// matching the basemap-toggle persistence pattern.
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

  // Fresh session: no camera-layer pref, no onboarded flag.
  // (evaluateOnNewDocument runs on EVERY navigation including reloads —
  // so we only use it for the one-time onboarded flag, and clear the
  // camera-layer pref manually before the first goto.)
  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('gw-onboarded', '1');
  });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(() => localStorage.removeItem('gw-cam-layer'));
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForSelector('#camLayerBtn', { timeout: 10000 });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 20000 });

  // --- Default state: ON ---
  const defaultState = await p.evaluate(() => ({
    camVisible: window.__gw.map._camVisible,
    btnOff: document.querySelector('#camLayerBtn').classList.contains('off'),
    camLayerLayout: window.__gw.map.map.getLayoutProperty('cameras-layer', 'visibility'),
    heatLayout: window.__gw.map.map.getLayoutProperty('cameras-heat', 'visibility'),
  }));
  console.log('default state:', JSON.stringify(defaultState));

  // --- Toggle OFF ---
  await p.click('#camLayerBtn');
  await wait(400);
  const afterOff = await p.evaluate(() => ({
    camVisible: window.__gw.map._camVisible,
    btnOff: document.querySelector('#camLayerBtn').classList.contains('off'),
    camLayerLayout: window.__gw.map.map.getLayoutProperty('cameras-layer', 'visibility'),
    heatLayout: window.__gw.map.map.getLayoutProperty('cameras-heat', 'visibility'),
    ls: localStorage.getItem('gw-cam-layer'),
  }));
  console.log('after toggle OFF:', JSON.stringify(afterOff));

  // --- Reload: should persist OFF ---
  await p.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForSelector('#camLayerBtn', { timeout: 10000 });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 20000 });
  await wait(400);
  const afterReloadOff = await p.evaluate(() => ({
    camVisible: window.__gw.map._camVisible,
    btnOff: document.querySelector('#camLayerBtn').classList.contains('off'),
    camLayerLayout: window.__gw.map.map.getLayoutProperty('cameras-layer', 'visibility'),
    heatLayout: window.__gw.map.map.getLayoutProperty('cameras-heat', 'visibility'),
    ls: localStorage.getItem('gw-cam-layer'),
  }));
  console.log('after reload (OFF persisted):', JSON.stringify(afterReloadOff));

  // --- Toggle back ON ---
  await p.click('#camLayerBtn');
  await wait(400);
  const afterOn = await p.evaluate(() => ({
    camVisible: window.__gw.map._camVisible,
    btnOff: document.querySelector('#camLayerBtn').classList.contains('off'),
    camLayerLayout: window.__gw.map.map.getLayoutProperty('cameras-layer', 'visibility'),
    heatLayout: window.__gw.map.map.getLayoutProperty('cameras-heat', 'visibility'),
    ls: localStorage.getItem('gw-cam-layer'),
  }));
  console.log('after toggle ON:', JSON.stringify(afterOn));

  // --- Reload: should persist ON ---
  await p.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await p.waitForSelector('#camLayerBtn', { timeout: 10000 });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 20000 });
  await wait(400);
  const afterReloadOn = await p.evaluate(() => ({
    camVisible: window.__gw.map._camVisible,
    btnOff: document.querySelector('#camLayerBtn').classList.contains('off'),
    camLayerLayout: window.__gw.map.map.getLayoutProperty('cameras-layer', 'visibility'),
    heatLayout: window.__gw.map.map.getLayoutProperty('cameras-heat', 'visibility'),
    ls: localStorage.getItem('gw-cam-layer'),
  }));
  console.log('after reload (ON persisted):', JSON.stringify(afterReloadOn));

  const ok =
    // Default ON
    defaultState.camVisible === true && defaultState.btnOff === false &&
    defaultState.camLayerLayout === 'visible' && defaultState.heatLayout === 'visible' &&
    // Toggle OFF
    afterOff.camVisible === false && afterOff.btnOff === true &&
    afterOff.camLayerLayout === 'none' && afterOff.heatLayout === 'none' &&
    afterOff.ls === '0' &&
    // Reload keeps OFF
    afterReloadOff.camVisible === false && afterReloadOff.btnOff === true &&
    afterReloadOff.camLayerLayout === 'none' && afterReloadOff.heatLayout === 'none' &&
    afterReloadOff.ls === '0' &&
    // Toggle ON
    afterOn.camVisible === true && afterOn.btnOff === false &&
    afterOn.camLayerLayout === 'visible' && afterOn.heatLayout === 'visible' &&
    afterOn.ls === '1' &&
    // Reload keeps ON
    afterReloadOn.camVisible === true && afterReloadOn.btnOff === false &&
    afterReloadOn.camLayerLayout === 'visible' && afterReloadOn.heatLayout === 'visible' &&
    afterReloadOn.ls === '1';

  console.log('camera-layer persistence (default ON → toggle OFF → reload → toggle ON → reload):', ok);
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok && errs.filter((e) => !/favicon|404/.test(e)).length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch { }
} catch (e) {
  console.error('cam-layer-persist-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
