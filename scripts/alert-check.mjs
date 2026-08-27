// Workstream C alerts: over-speed chip turns red; camera-ahead voice warning
// fires when the chosen route passes a camera and we approach it.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

// Hermetic: spawn our own preview server (poll-until-up) instead of assuming
// one is already running on :4173 (raw goto false-FAILed ERR_CONNECTION_REFUSED
// standalone — the non-hermetic class filed in the QA queue).
const pv = await startPreview();

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));

await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1'); // returning user — skip onboarding
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
  // Capture voice callouts.
  window.__said = [];
  class FakeUtterance {
    constructor(text) { this.text = text; }
  }
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: (u) => { window.__said.push(u.text); if (u.onend) setTimeout(u.onend, 10); },
      cancel: () => {},
      getVoices: () => [],
    },
    configurable: true,
  });
  window.SpeechSynthesisUtterance = FakeUtterance;
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForSelector('#suggestions .sugg', { timeout: 6000 }); await p.click('#suggestions .sugg'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 30000 });

// Choose the Fastest option (has 1 camera) so the camera-ahead alert can fire.
const pickedFastest = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  const fast = opts.find((o) => o.textContent.includes('Fastest'));
  if (fast) { fast.click(); return true; }
  return false;
});
console.log('picked Fastest:', pickedFastest);
await wait(800);
await p.click('#startNavBtn');
await wait(600);

// Drive the FULL route at a deliberately high speed (30 m/s ≈ 108 km/h) so
// the over-speed alert fires against posted limits.
const drove = await p.evaluate(async () => {
  const coords = window.__ghostwayNavCoords;
  let last = null;
  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    let heading = 0;
    if (last) { const dx = lon - last[0], dy = lat - last[1]; if (Math.hypot(dx, dy) > 1e-8) heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360; }
    last = [lon, lat];
    window.__gps.handlers[0]({ coords: { longitude: lon, latitude: lat, speed: 30, heading } });
    await new Promise((r) => setTimeout(r, 25));
  }
  return coords.length;
});
console.log('drove points:', drove);
await wait(800);

const said = await p.evaluate(() => window.__said);
const camWarn = said.some((t) => /camera ahead/i.test(t));
const overWarn = said.some((t) => /over the .* limit/i.test(t));
console.log('said:', JSON.stringify(said.slice(0, 6)));
console.log('camera-ahead warning fired:', camWarn);
console.log('over-speed voice fired:', overWarn);

console.log('ERRORS', errs.slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass = camWarn && overWarn;
console.log(pass ? '\nALERTS PASS ✅ — camera-ahead + over-speed alerts work' : '\nALERTS FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);
