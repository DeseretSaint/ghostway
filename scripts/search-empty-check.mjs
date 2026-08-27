// Hermetic UI smoke for the Maps-parity "No results" empty state (slot-B round 57).
// Spawns its own vite preview (lib-preview), types a query that matches nothing
// into the destination field, and asserts the suggestions panel shows a
// non-interactive empty-state row instead of silently vanishing.
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

  // Focus the destination field and type a nonsense query that matches nothing.
  await p.click('#toInput');
  await p.type('#toInput', 'zzqqxxnoresultsyyy123', { delay: 10 });

  // Wait for the empty-state row to appear (debounce 280ms + geocode/empty).
  await p.waitForSelector('#suggestions:not([hidden]) .sugg-empty', { timeout: 12000 });

  const res = await p.evaluate(() => {
    const box = document.querySelector('#suggestions');
    const empty = document.querySelector('#suggestions .sugg-empty');
    const name = empty?.querySelector('.sugg-name')?.textContent?.trim();
    const sub = empty?.querySelector('.sugg-sub')?.textContent?.trim();
    // Ensure the empty state did NOT also render interactive suggestion buttons.
    const suggBtns = document.querySelectorAll('#suggestions .sugg').length;
    return {
      boxVisible: box && !box.hidden,
      hasEmpty: !!empty,
      name,
      sub,
      suggBtns,
      role: empty?.getAttribute('role'),
    };
  });
  console.log('empty-state:', JSON.stringify(res));

  const okName = res.hasEmpty && res.boxVisible && res.name === 'No results';
  const okNoBtns = res.suggBtns === 0; // empty state, not a results list
  const okText = !!res.sub && /Try a different/.test(res.sub);
  const okRole = res.role === 'status';
  console.log('name=No results:', okName, '| no sugg buttons:', okNoBtns, '| hint text:', okText, '| role=status:', okRole);
  const clean = errs.filter((e) => !/favicon|404/.test(e)).length === 0;
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (okName && okNoBtns && okText && okRole && clean) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('search-empty-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
