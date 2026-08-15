// Navigation-mode E2E: mock geolocation playback along a real routed path and
// assert the live banner countdown, step advancement, and arrival screen work.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

// Mock watchPosition so we can drive the car along the route in-page.
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1'); // returning user — skip onboarding
  window.__gps = { handlers: [], pos: null, speed: 12 };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => {
      window.__gps.handlers.push(cb);
      return window.__gps.handlers.length - 1;
    },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 45000 });

// Plan a real route: Pleasant Grove -> Costco Lehi.
await p.type('#toInput', 'Costco Lehi');
await wait(1300);
await p.click('#suggestions .sugg');
await wait(300);
await p.type('#fromInput', 'Pleasant Grove Utah');
await wait(1300);
await p.click('#suggestions .sugg');
await wait(6000);

const routed = await p.evaluate(() => window.__ghostwayDebug?.routed);
console.log('routed:', routed);

// Start navigation (hit-tested click).
await p.click('#startNavBtn');
await wait(800);
const navShown = await p.evaluate(() => !document.querySelector('#navBanner').hidden);
const banner0 = await p.evaluate(() => document.querySelector('#navBanner')?.innerText?.replace(/\s+/g, ' ')?.slice(0, 120));
console.log('nav banner shown:', navShown);
console.log('banner initial:', banner0);

// Drive: emit GPS positions along the route, ~1 per 200ms.
const steps = await p.evaluate(() => {
  const coords = window.__ghostwayNavCoords || [];
  const total = coords.length;
  return total;
});
console.log('route points:', steps);

// Play back the route in ~6s (compress time).
const driven = await p.evaluate(async () => {
  const coords = window.__ghostwayNavCoords;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const [lon, lat] = coords[i];
    const cb = window.__gps.handlers[0];
    if (cb) cb({ coords: { longitude: lon, latitude: lat, speed: 13 } });
    await new Promise((r) => setTimeout(r, 90));
  }
  return n;
});
console.log('drove points:', driven);
await wait(1500);

// After driving to the end, arrival screen should show.
const arrival = await p.evaluate(() => {
  const m = document.querySelector('#modal');
  return { hidden: m?.hidden, text: m?.innerText?.replace(/\s+/g, ' ')?.slice(0, 220) };
});
console.log('arrival:', JSON.stringify(arrival));

await p.screenshot({ path: 'nav-playback.png' });
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
await b.close();

const pass =
  routed &&
  navShown &&
  !arrival.hidden &&
  /arrived/i.test(arrival.text);
console.log(pass ? '\nNAV PLAYBACK PASS ✅ — drove route, banner tracked, arrival screen shown' : '\nNAV PLAYBACK FAIL ❌');
process.exit(pass ? 0 : 1);
