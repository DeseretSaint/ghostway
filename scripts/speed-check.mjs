// Hermetic speed guard: verifies the graph fetch uses streaming (chunked
// download) instead of a single blob, and that byte-level progress events
// fire DURING the download (not just once at the end). Throttles the network
// via CDP Network.emulateNetworkConditions to a 3G-like profile (750 Kbps
// down / 250 Kbps up / 100 ms RTT) BEFORE the route is requested, so the
// graph download is slow enough that multiple progress chunks must fire.
// Then asserts parse stage fires + route card renders + TTFB under budget.
// Spawns its own vite preview (lib-preview), reads progress events from the
// router's __graphStats hook, drives a real PG→Costco route.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 240s timeout'); process.exit(2); }, 240000).unref();

// 3G-like profile per spec — slow enough that 6 MB graph spans multiple chunks
// but fast enough that the route still renders within the budget.
const THROTTLE = {
  offline: false,
  latency: 100,                 // ms RTT
  downloadThroughput: 750 * 1024 / 8, // 750 Kbps → bytes/sec
  uploadThroughput:   250 * 1024 / 8, // 250 Kbps → bytes/sec
};

const TTFB_BUDGET_MS = 240000; // generous under 3G with expanded ~18MB graph

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

  // Throttle BEFORE the route triggers the graph fetch. CDP session must
  // exist before emulateNetworkConditions. Page itself starts un-throttled
  // so the initial document + JS bundle load cleanly; the graph blob is the
  // only sub-resource we want to throttle.
  const cdp = await p.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', THROTTLE);
  console.log('throttled: 750Kbps down / 250Kbps up / 100ms RTT');

  async function pick(inputSel, query) {
    await p.type(inputSel, query);
    try { await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 }); await p.click('#suggestions .sugg:not(.sugg-recent)'); }
    catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
    await wait(400);
  }

  const t0 = Date.now();
  await pick('#toInput', 'Costco Lehi');
  await pick('#fromInput', 'Pleasant Grove Utah');

  await p.waitForFunction(
    `() => {
      const card = document.querySelector('#route-card');
      return card && !card.hidden && card.querySelectorAll('.route-opt').length >= 1;
    }`,
    { timeout: 240000 }
  );

  const info = await p.evaluate(() => {
    const statusEl = document.querySelector('#status');
    const card = document.querySelector('#route-card');
    return {
      status: statusEl?.textContent || '',
      cardVisible: card ? !card.hidden : false,
      opts: document.querySelectorAll('.route-opt').length,
      stats: (window.__gwRouter && window.__gwRouter.getGraphStats) ? window.__gwRouter.getGraphStats() : { progressEvents: [], loadStart: 0, loadEnd: 0 },
    };
  });

  const ttfb = Date.now() - t0;
  const loadMs = info.stats.loadEnd && info.stats.loadStart ? info.stats.loadEnd - info.stats.loadStart : 0;
  console.log('TTFB:', ttfb, 'ms | graph load:', loadMs, 'ms');
  console.log('progress events:', info.stats.progressEvents.length);
  const first = info.stats.progressEvents[0];
  const last = info.stats.progressEvents[info.stats.progressEvents.length - 1];
  console.log('first event:', JSON.stringify(first));
  console.log('last event:', JSON.stringify(last));
  console.log('status:', JSON.stringify(info.status));
  console.log('card visible:', info.cardVisible, '| options:', info.opts);

  // Analyze progress events.
  const downloadEvents = info.stats.progressEvents.filter(e => e && e.stage === 'download');
  const parseEvents = info.stats.progressEvents.filter(e => e === 'parse');
  const hasByteInfo = downloadEvents.some(e => e.loaded > 0 && e.total > 0);
  // Spec: ≥3 progress events during download — proves streaming (single
  // arrayBuffer() would yield only 1 event on completion). At 750 Kbps a
  // ~6.6 MB graph generates dozens of chunks; 3 is a conservative floor.
  const multipleChunks = downloadEvents.length >= 3;
  const parseFired = parseEvents.length >= 1;
  const cardOk = info.cardVisible && info.opts >= 1;
  const timeOk = ttfb < TTFB_BUDGET_MS;
  const realErrs = errs.filter((e) => !/favicon|404/.test(e));

  console.log('asserts:');
  console.log('  byte-level progress:', hasByteInfo);
  console.log('  multiple chunks (>=3):', multipleChunks, '(' + downloadEvents.length + ' events)');
  console.log('  parse stage fired:', parseFired);
  console.log('  card rendered:', cardOk);
  console.log('  TTFB<' + TTFB_BUDGET_MS + 'ms:', timeOk);
  console.log('  0 page errors:', realErrs.length === 0);
  console.log('page errors:', realErrs.slice(0, 5));

  if (hasByteInfo && multipleChunks && parseFired && cardOk && timeOk && realErrs.length === 0) {
    code = 0;
    console.log('SPEED PASS ✅ — chunked streaming (throttled 3G) + byte progress + parse + route');
  } else {
    console.log('SPEED FAIL ❌');
  }
  // Reset throttling so a subsequent suite (if chained) isn't poisoned.
  try { await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); } catch {}
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('speed-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);