// Hermetic UI check: camera-walled gate-snap badge on the BYU corridor.
// Drives a real PG→BYU route in the headless UI and asserts the Clearest
// card shows "clear to within ~N m" (router.js clearTail flag, ui.js badge).
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

  // Use the exact audit corridor endpoints (avoidance-audit.mjs 'PG → BYU Provo')
  // so the UI probe matches the verified gate-snap measurement, then drive the
  // REAL UI path: state → #goBtn click → onRoute → renderEngineCard.
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.6553, 40.2523], label: 'BYU Provo' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'BYU Provo';
    document.querySelector('#route-actions').hidden = false;
  });
  // Wait for the splash to dismiss (it hides up to ~4.4s; clicks through it
  // never reach #goBtn).
  await p.waitForFunction(() => {
    const s = document.querySelector('#splash');
    return !s || s.classList.contains('hidden') || getComputedStyle(s).opacity === '0';
  }, { timeout: 15000 });
  await wait(300);
  await p.click('#goBtn');
  await wait(3000);
  const dbg = await p.evaluate(() => ({
    status: document.querySelector('#status')?.textContent?.slice(0, 100),
    goDisabled: document.querySelector('#goBtn')?.disabled,
    engine: window.__ghostwayEngine,
    cardHidden: document.querySelector('#route-card')?.hidden,
  }));
  console.log('post-click state:', JSON.stringify(dbg));
  await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 90000 });
  await p.waitForFunction(
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.route-opt').length >= 2; }",
    { timeout: 60000 }
  );

  const res = await p.evaluate(() => {
    const opts = [...document.querySelectorAll('#route-card .route-opt')].map((el) => ({
      label: el.querySelector('.rc-title, .opt-title, h3, h4, .rc-name')?.textContent?.trim() || el.textContent.trim().slice(0, 60),
      warn: [...el.querySelectorAll('.opt-warn')].map((w) => w.textContent.trim()),
    }));
    return opts;
  });
  console.log('options:', JSON.stringify(res, null, 1));
  const clearest = res.find((o) => /clear/i.test(o.label));
  const gateBadge = res.flatMap((o) => o.warn).find((w) => /clear to within ~\d/.test(w));
  const walledBadge = res.flatMap((o) => o.warn).find((w) => /best effort — camera-walled/.test(w));
  console.log('clearest option found:', !!clearest);
  console.log('gate-snap badge:', JSON.stringify(gateBadge || null));
  console.log('walled best-effort badge (should be ABSENT on BYU now):', JSON.stringify(walledBadge || null));
  const cleanErrs = errs.filter((e) => !/favicon|404/.test(e));
  console.log('page errors:', cleanErrs.slice(0, 5));
  const ok = !!gateBadge && !walledBadge && cleanErrs.length === 0;
  console.log(ok ? 'PASS' : 'FAIL');
  if (ok) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('byu-gate-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
