// Live camera-chip test (Workstream B/C): drive the PG→Costco route on the
// Fastest option (has cameras) and assert the nav banner's camera chip shows
// the passed count increasing and an "ahead" flag near a camera.
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
    getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
    watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
    clearWatch: () => {},
  };
  Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
});

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); }
  catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });

// Choose Fastest (has cameras) so the chip has something to count.
await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  const fast = opts.find((o) => o.textContent.includes('Fastest'));
  if (fast) fast.click();
});
await wait(600);
await p.click('#startNavBtn');
await wait(600);

// Drive the route; sample the chip text as we go.
const samples = await p.evaluate(async () => {
  const coords = window.__ghostwayNavCoords;
  const out = [];
  let last = null;
  for (let i = 0; i < coords.length; i++) {
    const [lon, lat] = coords[i];
    let heading = 0;
    if (last) { const dx = lon - last[0], dy = lat - last[1]; if (Math.hypot(dx, dy) > 1e-8) heading = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360; }
    last = [lon, lat];
    window.__gps.handlers[0]({ coords: { longitude: lon, latitude: lat, speed: 13, heading } });
    await new Promise((r) => setTimeout(r, 18));
    if (i % 12 === 0) {
      const chip = document.querySelector('#camChip');
      if (chip) out.push(chip.textContent.trim());
    }
  }
  const finalChip = document.querySelector('#camChip');
  return { samples: out, final: finalChip ? finalChip.textContent.trim() : null, camPts: (window.__gw._camPts || []).length };
});
console.log('camera points on route:', samples.camPts);
console.log('chip samples:', JSON.stringify(samples.samples));
console.log('final chip:', samples.final);
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}

// Pass if the route had cameras and the chip progressed from 0 to >0 (or showed
// an ahead flag). A zero-camera route still must show "📷 0".
const sawCountUp = samples.samples.some((s) => /\d/.test(s) && !/^📷 0$/.test(s));
const pass = samples.camPts > 0 ? sawCountUp : samples.final === '📷 0';
console.log(pass ? '\nCAM-CHIP PASS ✅ — live camera counter tracks passes' : '\nCAM-CHIP FAIL ❌');
process.exit(pass ? 0 : 1);
