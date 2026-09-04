// Zero-scroll geometry probe: the panel must fit the route card (headline +
// badge + 3 options + Start button) WITHOUT vertical scrolling at 320-430px.
// Verifies: panel.scrollHeight <= panel.clientHeight (no scroll bar needed).
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
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  let ok = true;
  for (const width of [320, 390, 430]) {
    await p.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
    await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
    await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
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
    await wait(500);

    const geo = await p.evaluate(() => {
      const panel = document.querySelector('#panel');
      const card = document.querySelector('#route-card');
      const search = document.querySelector('#search');
      const routeActions = document.querySelector('#route-actions');
      const avoidToggle = document.querySelector('#avoid-toggle');
      // When route card is shown, search + route-actions + avoid-toggle are hidden.
      // The panel contains: route-card + status (hidden).
      return {
        panelScrollH: panel?.scrollHeight || 0,
        panelClientH: panel?.clientHeight || 0,
        panelMaxH: panel ? getComputedStyle(panel).maxHeight : '',
        cardScrollH: card?.scrollHeight || 0,
        cardClientH: card?.clientHeight || 0,
        cardOffsetTop: card?.offsetTop || 0,
        searchHidden: search?.hidden,
        routeActionsHidden: routeActions?.hidden,
        avoidToggleHidden: avoidToggle?.hidden,
        panelPad: panel ? getComputedStyle(panel).padding : '',
      };
    });

    const scrolls = geo.panelScrollH > geo.panelClientH + 1;
    if (scrolls) ok = false;
    console.log(`@${width}px: panel ${geo.panelScrollH}/${geo.panelClientH} (max ${geo.panelMaxH}), card ${geo.cardScrollH}/${geo.cardClientH} @top ${geo.cardOffsetTop}, searchHidden=${geo.searchHidden}, actionsHidden=${geo.routeActionsHidden}, avoidHidden=${geo.avoidToggleHidden} — ${scrolls ? 'SCROLLS (FAIL)' : 'ZERO SCROLL (OK)'}`);
  }

  // Filter expected environmental errors: CORS blocks on external WZDx feeds
  // (Idaho 511, CDOT TG) are pre-existing and unrelated to zero-scroll geometry.
  const realErrs = errs.filter((e) => !/cotg\.carsprogram|511\.idaho|CORS policy|Failed to load resource/.test(e));
  if (realErrs.length) { ok = false; console.error('PAGE ERRORS:', realErrs); }
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
