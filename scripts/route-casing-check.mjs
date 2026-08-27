// Hermetic UI check: route line now has a white casing + drop shadow for
// Maps-parity legibility on any basemap. Drives a real PG→BYU route and
// asserts the new map layers exist and the route source actually drew.
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

  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.6553, 40.2523], label: 'BYU Provo' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'BYU Provo';
    document.querySelector('#route-actions').hidden = false;
  });
  await p.waitForFunction(() => {
    const s = document.querySelector('#splash');
    return !s || s.classList.contains('hidden') || getComputedStyle(s).opacity === '0';
  }, { timeout: 15000 });
  await wait(300);
  await p.click('#goBtn');
  await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 90000 });
  await p.waitForFunction(
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.route-opt').length >= 2; }",
    { timeout: 60000 }
  );

  const layers = await p.evaluate(() => {
    const m = window.__gw.map.map;
    const r = m.getSource('route');
    return {
      shadow: !!m.getLayer('route-shadow'),
      casing: !!m.getLayer('route-casing'),
      line: !!m.getLayer('route-line'),
      // route-glow must be gone (replaced by casing/shadow)
      glowGone: !m.getLayer('route-glow'),
      featCount: r && r._data ? r._data.features.length : -1,
    };
  });
  console.log('route layers:', JSON.stringify(layers));
  const cleanErrs = errs.filter((e) => !/favicon|404/.test(e));
  console.log('page errors:', cleanErrs.slice(0, 5));
  const ok = layers.shadow && layers.casing && layers.line && layers.glowGone && layers.featCount > 0 && cleanErrs.length === 0;
  console.log(ok ? 'PASS' : 'FAIL');
  if (ok) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('route-casing-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
