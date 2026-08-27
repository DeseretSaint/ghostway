// Hermetic UI smoke for the Maps-parity offline banner (#offlineBanner).
// Spawns its own vite preview (lib-preview), flips the page offline/online via
// CDP Network.emulateNetworkConditions, and asserts the banner shows/hides.
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
  await p.waitForSelector('#offlineBanner', { timeout: 10000 });

  const online = await p.evaluate(() => ({
    hidden: document.querySelector('#offlineBanner').hidden,
    role: document.querySelector('#offlineBanner').getAttribute('role'),
    onLine: navigator.onLine,
  }));
  console.log('online state:', JSON.stringify(online));

  const cdp = await p.createCDPSession();
  await cdp.send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await p.waitForFunction(() => document.querySelector('#offlineBanner').hidden === false, { timeout: 10000 });
  const off = await p.evaluate(() => ({
    hidden: document.querySelector('#offlineBanner').hidden,
    onLine: navigator.onLine,
    text: document.querySelector('#offlineBanner').textContent.trim(),
  }));
  console.log('offline state:', JSON.stringify(off));

  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await p.waitForFunction(() => document.querySelector('#offlineBanner').hidden === true, { timeout: 10000 });
  const back = await p.evaluate(() => ({ hidden: document.querySelector('#offlineBanner').hidden, onLine: navigator.onLine }));
  console.log('back-online state:', JSON.stringify(back));

  const ok = online.hidden === true && online.role === 'status'
    && off.hidden === false && /offline/i.test(off.text)
    && back.hidden === true;
  console.log('banner toggles with connectivity:', ok);
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok && errs.filter((e) => !/favicon|404/.test(e)).length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('offline-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
