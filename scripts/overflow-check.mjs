// Hermetic UI check: route-option text overflow (queue item 5, addendum 2).
// Option text (opt-meta with badges) must NOT spill out of the route-option
// buttons at 320-430 px widths: no horizontal overflow on .route-opt /
// .route-opt-mod, and the panel must not grow horizontally. Drives a real
// PG→Costco route (Keaton's repro corridor) through the REAL UI path.
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

    const geo = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('#route-card .route-opt, #route-card .route-opt-mod')].map((el) => {
        const meta = el.querySelector('.opt-meta');
        return {
          label: (el.querySelector('.opt-label')?.textContent || el.textContent).trim().slice(0, 40),
          btnScrollW: el.scrollWidth, btnClientW: el.clientWidth,
          metaScrollW: meta ? meta.scrollWidth : 0, metaClientW: meta ? meta.clientWidth : 0,
          metaText: meta ? meta.textContent.trim() : '',
        };
      });
      const panel = document.querySelector('#panel');
      const card = document.querySelector('#route-card');
      return {
        rows,
        panelScrollW: panel?.scrollWidth || 0, panelClientW: panel?.clientWidth || 0,
        cardScrollW: card?.scrollWidth || 0, cardClientW: card?.clientWidth || 0,
        bodyScrollW: document.body.scrollWidth,
        innerW: window.innerWidth,
      };
    });

    for (const r of geo.rows) {
      if (r.btnScrollW > r.btnClientW + 1) {
        ok = false;
        console.error(`FAIL @${width}px: button horizontal overflow: "${r.label}" scrollW ${r.btnScrollW} > clientW ${r.btnClientW}`);
      }
      if (r.metaScrollW > r.metaClientW + 1) {
        ok = false;
        console.error(`FAIL @${width}px: opt-meta overflow: "${r.metaText}" scrollW ${r.metaScrollW} > clientW ${r.metaClientW}`);
      }
    }
    if (geo.panelScrollW > geo.panelClientW + 1) { ok = false; console.error(`FAIL @${width}px: panel horizontal overflow ${geo.panelScrollW} > ${geo.panelClientW}`); }
    if (geo.cardScrollW > geo.cardClientW + 1) { ok = false; console.error(`FAIL @${width}px: route-card horizontal overflow ${geo.cardScrollW} > ${geo.cardClientW}`); }
    if (geo.bodyScrollW > geo.innerW + 1) { ok = false; console.error(`FAIL @${width}px: body horizontal overflow ${geo.bodyScrollW} > ${geo.innerW}`); }
    console.log(`@${width}px: ${geo.rows.length} option rows, panel ${geo.panelScrollW}/${geo.panelClientW}, body ${geo.bodyScrollW}/${geo.innerW} — ${geo.rows.every((r) => r.btnScrollW <= r.btnClientW + 1) ? 'no overflow' : 'OVERFLOW'}`);
  }

  if (errs.length) { ok = false; console.error('PAGE ERRORS:', errs); }
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
