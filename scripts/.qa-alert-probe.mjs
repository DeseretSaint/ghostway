import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG'); process.exit(2); }, 150000).unref();
const pv = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForSelector('#suggestions .sugg:not(.sugg-recent)', { timeout: 8000 }); await p.click('#suggestions .sugg:not(.sugg-recent)'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 30000 });
await wait(500);

const diag = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')].map((o) => ({
    txt: o.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
    pressed: o.getAttribute('aria-pressed'),
  }));
  return {
    nOpts: opts.length,
    opts,
    navCoordsLen: (window.__ghostwayNavCoords || []).length,
    debug: window.__ghostwayDebug,
    chosenState: window.__gw?.state?.chosen,
    modeState: window.__gw?.state?.mode,
    avoidState: window.__gw?.state?.avoid,
  };
});
console.log('BEFORE PICK FASTEST:', JSON.stringify(diag, null, 2));

const pickedFastest = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  const fast = opts.find((o) => o.textContent.includes('Fastest'));
  if (fast) { fast.click(); return true; }
  return false;
});
console.log('picked Fastest:', pickedFastest);
await wait(800);

const after = await p.evaluate(() => ({
  navCoordsLen: (window.__ghostwayNavCoords || []).length,
  chosenState: window.__gw?.state?.chosen,
  optsPressed: [...document.querySelectorAll('.route-opt')].map((o) => o.getAttribute('aria-pressed')),
  startNavVisible: !!document.querySelector('#startNavBtn') && !document.querySelector('#startNavBtn').hidden,
}));
console.log('AFTER PICK FASTEST:', JSON.stringify(after, null, 2));

await p.click('#startNavBtn');
await wait(600);
const post = await p.evaluate(() => ({
  navCoordsLen: (window.__ghostwayNavCoords || []).length,
  navigating: window.__gw?.state?.navigating,
  gpsHandlers: window.__gps.handlers.length,
}));
console.log('AFTER STARTNAV:', JSON.stringify(post, null, 2));
console.log('ERRORS', errs.slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
pv.kill();
process.exit(0);
