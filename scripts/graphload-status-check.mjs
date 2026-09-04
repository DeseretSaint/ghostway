// Hermetic UX guard: first route in a region must show staged graph-load
// feedback ("Downloading map data…" → "Building route network…") instead of
// sitting on a static "Routing…" while the ~6 MB graph downloads.
// Spawns its own vite preview (lib-preview), throttles the download via CDP so
// the load window is observable, records every #status text with a
// MutationObserver, drives a real PG→Costco route, asserts both stages seen.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 200s timeout'); process.exit(2); }, 200000).unref();

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
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 90000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Record every #status text change. Capture the text from the mutation's
  // addedNodes (not by re-reading textContent) so fast successive sets are
  // each recorded even when MutationObserver batches them into one callback.
  await p.evaluate(() => {
    window.__statusLog = [];
    const s = document.querySelector('#status');
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'childList') {
          for (const n of m.addedNodes) if (n.nodeType === 3 && n.textContent.trim()) window.__statusLog.push(n.textContent);
        } else if (m.type === 'characterData' && m.target.textContent.trim()) {
          window.__statusLog.push(m.target.textContent);
        }
      }
    }).observe(s, { childList: true, characterData: true, subtree: true });
    if (!s.hidden && s.textContent.trim()) window.__statusLog.push(s.textContent);
  });

  async function pick(inputSel, query) {
    await p.type(inputSel, query);
    try { await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 }); await p.click('#suggestions .sugg:not(.sugg-recent)'); }
    catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
    await wait(400);
  }
  await pick('#toInput', 'Costco Lehi');
  await pick('#fromInput', 'Pleasant Grove Utah');

  await p.waitForFunction(
    "() => !document.querySelector('#route-card').hidden || document.querySelector('#status')?.textContent?.includes('failed')",
    { timeout: 120000 }
  );

  const { log, cardOk, opts, dbg, fin } = await p.evaluate(() => ({
    log: window.__statusLog,
    cardOk: !document.querySelector('#route-card').hidden,
    opts: document.querySelectorAll('.route-opt').length,
    dbg: window.__ghostwayDebug,
    fin: { status: document.querySelector('#status')?.textContent, engine: window.__ghostwayEngine, traffic: window.__ghostwayTraffic },
  }));
  console.log('final state:', JSON.stringify(fin), '| debug:', JSON.stringify(dbg));
  const texts = log;
  const sawDownload = texts.some((t) => t.includes('Downloading map data'));
  const sawParse = texts.some((t) => t.includes('Building route network'));
  // Order: download stage must appear before the parse stage.
  const di = texts.findIndex((t) => t.includes('Downloading map data'));
  const pi = texts.findIndex((t) => t.includes('Building route network'));
  const ordered = di !== -1 && pi !== -1 && di < pi;
  console.log('status log:', JSON.stringify(texts));
  console.log('saw download stage:', sawDownload, '| saw parse stage:', sawParse, '| ordered:', ordered);
  console.log('route card visible:', cardOk, '| options:', opts);
  const realErrs = errs.filter((e) => !/favicon|404|cotg\.carsprogram|511\.idaho|az511\.gov|CORS policy|Failed to load resource/.test(e));
  console.log('page errors:', realErrs.slice(0, 5));
  if (sawDownload && sawParse && ordered && cardOk && opts >= 1 && realErrs.length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('graphload-status-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
