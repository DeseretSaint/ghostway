// Search location bias (iteration 18 fix): typing bare "Costco" with GPS
// active must surface UTAH Costcos nearest first — not Palm Desert/Bismarck/
// Tulsa like the field report showed.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(() => {
  localStorage.setItem('gw-onboarded', '1');
  window.__gps = { handlers: [] };
  const mock = {
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0, accuracy: 10 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
await wait(1500);

// Set GPS location first (like Keaton did — "My location" as start).
await p.click('#gpsBtn');
await wait(1200);

// Type bare "Costco" — the exact query from the bug report.
await p.type('#toInput', 'Costco');
await wait(1800);

const results = await p.evaluate(() => {
  return [...document.querySelectorAll('#suggestions .sugg')].map((el) => el.innerText.replace(/\s+/g, ' ').trim());
});
console.log('suggestions for "Costco":');
results.slice(0, 6).forEach((r) => console.log('  ' + r));

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

const utahish = /Utah|, UT|Lehi|Orem|Saratoga|Provo|American Fork|Pleasant Grove|Sandy|Riverton|Draper/i;
const badOnes = results.filter((r) => /Tulsa|Bismarck|Palm Desert|New Berlin|Coralville/i.test(r));
const pass = results.length >= 3 && badOnes.length === 0 && results.filter((r) => utahish.test(r)).length >= 3;
console.log(pass ? '\nSEARCH-BIAS PASS ✅ — nearby Costcos first, no out-of-state spam' : '\nSEARCH-BIAS FAIL ❌');
process.exit(pass ? 0 : 1);
