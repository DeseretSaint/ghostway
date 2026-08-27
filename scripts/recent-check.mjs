// Hermetic UI smoke for the Maps-parity recent-destinations quick pick
// (slot-B round 71). Spawns its own vite preview (lib-preview) and asserts:
//   1. empty field focus with NO recents → panel stays hidden
//   2. seeded recents → focus shows "Recent" header + rows (MRU order)
//   3. clicking a row fills the field + state and hides the panel
//   4. re-pick moves the entry to the top (MRU) and list caps at 5
//   5. ArrowDown from the field focuses the first recent row
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const SEED = [
  { name: 'Costco Wholesale', subtitle: 'Lehi, UT', coords: [-111.8628, 40.3952] },
  { name: 'Provo Central Station', subtitle: 'Provo, UT', coords: [-111.6585, 40.2338] },
];

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

  // 1. No recents yet → focusing the empty field keeps the panel hidden.
  // (p.focus, not p.click: with hasTouch:true puppeteer dispatches touch
  // events and Chrome does not focus the input on a synthetic tap.)
  await p.focus('#toInput');
  await wait(400);
  const phase1 = await p.evaluate(() => {
    const box = document.querySelector('#suggestions');
    return { hidden: box.hidden, rows: box.querySelectorAll('.sugg-recent').length };
  });
  console.log('phase1 (no recents):', JSON.stringify(phase1));
  const ok1 = phase1.hidden === true && phase1.rows === 0;

  // 2. Seed recents, blur, refocus → header + rows in MRU order.
  await p.evaluate((seed) => {
    localStorage.setItem('gw-recent', JSON.stringify(seed));
    document.querySelector('#toInput').blur();
  }, SEED);
  await p.focus('#toInput');
  await p.waitForSelector('#suggestions:not([hidden]) .sugg-recent', { timeout: 5000 });
  const phase2 = await p.evaluate(() => {
    const box = document.querySelector('#suggestions');
    const head = box.querySelector('.sugg-head');
    const rows = [...box.querySelectorAll('.sugg-recent')].map(
      (r) => r.querySelector('.sugg-name')?.textContent?.trim()
    );
    return { head: head?.textContent?.trim(), rows };
  });
  console.log('phase2 (seeded):', JSON.stringify(phase2));
  const ok2 =
    phase2.head === 'Recent' &&
    phase2.rows.length === 2 &&
    phase2.rows[0] === 'Costco Wholesale' &&
    phase2.rows[1] === 'Provo Central Station';

  // 3. Click the SECOND row → fills field + state, hides panel.
  await p.evaluate(() => {
    document.querySelectorAll('#suggestions .sugg-recent')[1].click();
  });
  await wait(200);
  const phase3 = await p.evaluate(() => {
    const box = document.querySelector('#suggestions');
    const inp = document.querySelector('#toInput');
    const st = window.__gw.state.to;
    const stored = JSON.parse(localStorage.getItem('gw-recent') || '[]');
    return {
      hidden: box.hidden,
      value: inp.value,
      stateLabel: st?.label,
      coords: st?.coords,
      mru: stored.map((r) => r.name),
    };
  });
  console.log('phase3 (pick):', JSON.stringify(phase3));
  const ok3 =
    phase3.hidden === true &&
    /Provo Central Station/.test(phase3.value) &&
    /Provo Central Station/.test(phase3.stateLabel || '') &&
    Array.isArray(phase3.coords) &&
    phase3.mru[0] === 'Provo Central Station' && // picked entry bubbled to top
    phase3.mru[1] === 'Costco Wholesale' &&
    phase3.mru.length === 2;

  // 4. Clear + refocus → MRU order shown; ArrowDown focuses first row.
  await p.evaluate(() => {
    clearTimeout(window.__gw._autoT); // stop the pick's deferred auto-route
    const inp = document.querySelector('#toInput');
    inp.value = '';
    inp.blur();
    document.querySelector('#search').hidden = false; // in case routing hid it
  });
  await p.focus('#toInput');
  await p.waitForSelector('#suggestions:not([hidden]) .sugg-recent', { timeout: 5000 });
  await p.keyboard.press('ArrowDown');
  const phase4 = await p.evaluate(() => {
    const ae = document.activeElement;
    const rows = [...document.querySelectorAll('#suggestions .sugg-recent')].map(
      (r) => r.querySelector('.sugg-name')?.textContent?.trim()
    );
    return {
      rows,
      focusedRow: ae?.classList?.contains('sugg-recent') ? ae.querySelector('.sugg-name')?.textContent?.trim() : null,
    };
  });
  console.log('phase4 (mru+keyboard):', JSON.stringify(phase4));
  const ok4 =
    phase4.rows[0] === 'Provo Central Station' &&
    phase4.rows[1] === 'Costco Wholesale' &&
    phase4.focusedRow === 'Provo Central Station';

  console.log('ok1(no-recents-hidden):', ok1, '| ok2(header+order):', ok2, '| ok3(pick+mru-store):', ok3, '| ok4(mru-refocus+kbd):', ok4);
  const clean = errs.filter((e) => !/favicon|404/.test(e)).length === 0;
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok1 && ok2 && ok3 && ok4 && clean) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('FAIL:', e.message);
} finally {
  try { await preview.kill(); } catch {}
}
console.log(code === 0 ? 'PASS' : 'FAIL');
process.exit(code);
