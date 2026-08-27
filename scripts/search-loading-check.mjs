// Hermetic UI smoke for search loading state + stale-reply guard (slot-B round 58).
// Intercepts photon requests: DELAYS the first one 2.5s, lets later ones through
// fast. Types query A, then (while A is still in flight) extends to query B.
// Asserts: (1) a non-interactive "Searching…" row shows while A is in flight,
// (2) the panel ends on B's results, (3) when A's late reply finally lands it
// is DROPPED (panel still shows B, never flickers back to A's results).
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

  // Delay ONLY the first photon forward-search by 2.5s; everything else is fast.
  let photonCount = 0;
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    const u = req.url();
    if (u.includes('photon.komoot.io/api?')) {
      photonCount += 1;
      if (photonCount === 1) { setTimeout(() => req.continue(), 2500); return; }
    }
    req.continue();
  });

  await p.evaluateOnNewDocument(() => {
    localStorage.setItem('gw-onboarded', '1');
    // The SW caches API responses (stale-while-revalidate) and would swallow
    // photon fetches before CDP interception sees them — disable it here so the
    // delay harness actually holds the real network request.
    if (navigator.serviceWorker) navigator.serviceWorker.register = () => Promise.resolve();
  });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Query A: "provo" — fires request #1 (delayed 2.5s by interception).
  await p.click('#toInput');
  await p.type('#toInput', 'provo', { delay: 15 });

  // (1) Loading row must appear while request #1 is in flight.
  await p.waitForSelector('#suggestions:not([hidden]) .sugg-loading', { timeout: 5000 });
  const loading = await p.evaluate(() => {
    const row = document.querySelector('#suggestions .sugg-loading');
    return {
      text: row?.querySelector('.sugg-name')?.textContent?.trim(),
      role: row?.getAttribute('role'),
      isButton: row?.tagName === 'BUTTON',
    };
  });
  console.log('loading-row:', JSON.stringify(loading));
  const okLoading = loading.text === 'Searching…' && loading.role === 'status' && !loading.isButton;

  // Query B: extend to "provo ut" — fires request #2 (fast) while #1 is held.
  await p.type('#toInput', ' ut', { delay: 15 });

  // (2) Panel must settle on B's results (loading row gone, real suggestions in).
  await p.waitForFunction(
    () => !document.querySelector('#suggestions .sugg-loading') &&
          document.querySelectorAll('#suggestions .sugg').length > 0,
    { timeout: 10000 }
  );
  const afterB = await p.evaluate(() =>
    [...document.querySelectorAll('#suggestions .sugg .sugg-name')].map((n) => n.textContent.trim())
  );
  console.log('results-after-B:', JSON.stringify(afterB.slice(0, 3)));
  const okB = afterB.length > 0;

  // (3) Now let request #1's late reply land (it continued at ~2.5s; give it
  // margin). The stale-reply guard must DROP it: panel still shows B's list,
  // unchanged — no flicker back to query-A results, no loading row re-shown.
  await wait(3500);
  const afterLate = await p.evaluate(() => ({
    loading: !!document.querySelector('#suggestions .sugg-loading'),
    names: [...document.querySelectorAll('#suggestions .sugg .sugg-name')].map((n) => n.textContent.trim()),
  }));
  console.log('after-late-A:', JSON.stringify({ loading: afterLate.loading, n: afterLate.names.length }));
  const okStaleDropped = !afterLate.loading &&
    afterLate.names.length === afterB.length &&
    afterLate.names.every((n, i) => n === afterB[i]);

  console.log('loading-row ok:', okLoading, '| B results ok:', okB, '| stale reply dropped:', okStaleDropped, '| photon reqs:', photonCount);
  const clean = errs.filter((e) => !/favicon|404/.test(e)).length === 0;
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (okLoading && okB && okStaleDropped && photonCount >= 2 && clean) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('search-loading-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
