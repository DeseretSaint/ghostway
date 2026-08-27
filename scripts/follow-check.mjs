// Follow-mode E2E: drive a route with mocked GPS and assert the camera follows
// (bearing rotation + pitch), the user marker renders, panning pauses follow
// (recenter button appears), and recenter resumes follow.
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
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

// Mock geolocation with heading + speed so follow mode has real inputs.
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1'); // returning user — skip onboarding
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
  try {
    await p.waitForSelector('#suggestions .sugg', { timeout: 6000 });
    await p.click('#suggestions .sugg');
  } catch {
    await p.focus(inputSel);
    await p.keyboard.press('Enter');
  }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 30000 });
await p.click('#startNavBtn');
await wait(600);

// Drive ~25% of the route with a moving heading.
const drive = async (fromPct, toPct, pts) => {
  return p.evaluate(
    async ({ fromPct, toPct, pts }) => {
      const coords = window.__ghostwayNavCoords;
      const start = Math.floor(coords.length * fromPct);
      const end = Math.min(coords.length - 1, Math.floor(coords.length * toPct));
      const step = Math.max(1, Math.floor((end - start) / pts));
      let last = null;
      for (let i = start; i <= end; i += step) {
        const [lon, lat] = coords[i];
        let heading = 0;
        if (last) {
          const dx = lon - last[0], dy = lat - last[1];
          if (Math.hypot(dx, dy) > 1e-8) heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
        }
        last = [lon, lat];
        window.__gps.handlers[0]({ coords: { longitude: lon, latitude: lat, speed: 13, heading } });
        await new Promise((r) => setTimeout(r, 130));
      }
      return end - start;
    },
    { fromPct, toPct, pts }
  );
};

await drive(0, 0.25, 14);
await wait(1200); // let easeTo settle

const cam = await p.evaluate(() => {
  const m = window.__gw.map.map;
  return {
    bearing: Math.round(m.getBearing()),
    pitch: Math.round(m.getPitch()),
    zoom: +m.getZoom().toFixed(1),
    userDotVisible: !!m.getLayer('user-dot') && m.getLayoutProperty('user-dot', 'visibility') !== 'none',
    followActive: window.__gw._followActive,
    recenterHidden: document.querySelector('#recenterBtn').hidden,
  };
});
console.log('follow state:', JSON.stringify(cam));

// User pans the map → follow should pause, recenter appears.
await p.mouse.move(195, 450);
await p.mouse.down();
await p.mouse.move(195, 350, { steps: 8 });
await p.mouse.up();
await wait(700);
const afterPan = await p.evaluate(() => ({
  followActive: window.__gw._followActive,
  recenterHidden: document.querySelector('#recenterBtn').hidden,
}));
console.log('after pan:', JSON.stringify(afterPan));

// Tap recenter → follow resumes.
await p.click('#recenterBtn');
await wait(700);
const afterRecenter = await p.evaluate(() => ({
  followActive: window.__gw._followActive,
  recenterHidden: document.querySelector('#recenterBtn').hidden,
}));
console.log('after recenter:', JSON.stringify(afterRecenter));

// Drive more so the camera rotates to a new heading; screenshot for vision.
await drive(0.25, 0.4, 10);
await wait(1200);
const cam2 = await p.evaluate(() => {
  const m = window.__gw.map.map;
  return { bearing: Math.round(m.getBearing()), pitch: Math.round(m.getPitch()) };
});
console.log('later camera:', JSON.stringify(cam2));
await p.screenshot({ path: 'follow-shot.png' });

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 4));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const pass =
  cam.pitch >= 40 &&
  cam.zoom >= 15.5 &&
  cam.userDotVisible &&
  cam.followActive === true &&
  cam.recenterHidden === true &&
  afterPan.followActive === false &&
  afterPan.recenterHidden === false &&
  afterRecenter.followActive === true &&
  afterRecenter.recenterHidden === true;
console.log(pass ? '\nFOLLOW PASS ✅ — bearing camera, pan-pause, recenter all work' : '\nFOLLOW FAIL ❌');
pv.kill();
process.exit(pass ? 0 : 1);
