// Verify: search panel (52vh) vs route card (80vh) panel sizing.
// When search is shown, panel should be 52vh; when route card is shown, 80vh.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
let b;
try {
  b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Check search panel height before routing
  const searchPanel = await p.evaluate(() => {
    const panel = document.querySelector('#panel');
    return {
      maxH: getComputedStyle(panel).maxHeight,
      hasExpanded: panel.classList.contains('panel--expanded'),
    };
  });

  // Route
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.8226, 40.3885], label: 'Costco, Lehi' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'Costco, Lehi';
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
  await wait(300);

  // Check panel height with route card shown
  const routePanel = await p.evaluate(() => {
    const panel = document.querySelector('#panel');
    return {
      maxH: getComputedStyle(panel).maxHeight,
      hasExpanded: panel.classList.contains('panel--expanded'),
    };
  });

  // Click "Edit route" to go back to search
  await p.click('#editRouteBtn');
  await wait(300);

  // Check panel height with search shown again
  const backToSearch = await p.evaluate(() => {
    const panel = document.querySelector('#panel');
    return {
      maxH: getComputedStyle(panel).maxHeight,
      hasExpanded: panel.classList.contains('panel--expanded'),
      searchHidden: document.querySelector('#search').hidden,
    };
  });

  console.log('Search panel:', JSON.stringify(searchPanel));
  console.log('Route panel:', JSON.stringify(routePanel));
  console.log('Back to search:', JSON.stringify(backToSearch));

  const ok = !searchPanel.hasExpanded && routePanel.hasExpanded && !backToSearch.hasExpanded;
  console.log(ok ? 'PASS' : 'FAIL');
  code = ok ? 0 : 1;
} catch (e) {
  console.error('ERROR:', e.message);
  code = 1;
} finally {
  try { await Promise.race([b?.close(), wait(5000)]); } catch {}
  try { preview.kill(); } catch {}
  process.exit(code);
}
