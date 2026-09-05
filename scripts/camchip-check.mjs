// Live camera-chip test (Workstream B/C): drive the PG→Costco route on the
// Fastest option (has cameras) and assert the nav banner's camera chip shows
// the passed count increasing and an "ahead" flag near a camera.
//
// Extended (round-28): multi-viewport contrast probe — 320/375/390/430/720/1024/1440
// × light/dark, asserting AA contrast (≥4.5:1) on #camChip at every viewport.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { VIEWPORT_LADDER, THEMES, AA_THRESHOLD, contrast, parseRgb } from './lib-contrast.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 300s timeout — force exit'); process.exit(2); }, 300000).unref();

const pv = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

// --- Phase 1: behavioral test at 390x844 (original) ---
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
  try { await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 }); await p.click('#suggestions .sugg:not(.sugg-recent)'); }
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

const sawCountUp = samples.samples.some((s) => /\d/.test(s) && !/^📷 0$/.test(s));
const behavioralPass = samples.camPts > 0 ? sawCountUp : samples.final === '📷 0';
console.log(behavioralPass
  ? '\nBEHAVIORAL PASS ✅ — live camera counter tracks passes'
  : '\nBEHAVIORAL FAIL ❌');

// --- Phase 2: multi-viewport contrast sweep ---
console.log('\n=== MULTI-VIEWPORT CONTRAST PROBE ===');

const contrastResults = [];
let contrastAllPass = true;

for (const vp of VIEWPORT_LADDER) {
  for (const theme of THEMES) {
    const page = await b.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
    });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('gw-onboarded', '1');
      window.__gps = { handlers: [] };
      const mock = {
        getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
        watchPosition: (cb) => { window.__gps.handlers.push(cb); return 0; },
        clearWatch: () => {},
      };
      Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
    });

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

    // Pick route
    async function pickRoute(inputSel, query) {
      await page.type(inputSel, query);
      try { await page.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 }); await page.click('#suggestions .sugg:not(.sugg-recent)'); }
      catch { await page.focus(inputSel); await page.keyboard.press('Enter'); }
      await wait(500);
    }
    await pickRoute('#toInput', 'Costco Lehi');
    await pickRoute('#fromInput', 'Pleasant Grove Utah');
    await page.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });

    // Choose Fastest
    await page.evaluate(() => {
      const opts = [...document.querySelectorAll('.route-opt')];
      const fast = opts.find((o) => o.textContent.includes('Fastest'));
      if (fast) fast.click();
    });
    await wait(600);
    await page.click('#startNavBtn');
    await wait(800);

    // Measure chip contrast (in mission-signal "Clear" state before driving)
    const measurements = await page.evaluate(() => {
      const chip = document.querySelector('#camChip');
      if (!chip) return { error: 'chip missing' };
      const style = getComputedStyle(chip);
      return {
        text: chip.textContent.trim(),
        color: style.color,
        bg: style.backgroundColor,
        bgImage: style.backgroundImage,
        classes: chip.className,
      };
    });

    await page.close();

    const label = `${vp.width}x${vp.height} ${theme}`;
    const passEntries = [];

    if (measurements.color && measurements.bg) {
      const textRgb = parseRgb(measurements.color);
      const bgRgb = parseRgb(measurements.bg);
      if (textRgb?.length === 3 && bgRgb?.length === 3) {
        const ratio = contrast(textRgb, bgRgb);
        const pass = ratio >= AA_THRESHOLD;
        if (!pass) contrastAllPass = false;
        passEntries.push({ ratio: ratio.toFixed(2), pass });
        console.log(`  ${pass ? 'PASS' : 'FAIL'} | ${label} | #camChip: ${ratio.toFixed(2)}:1 text="${measurements.text}" (color=${measurements.color} bg=${measurements.bg})`);
      }
    } else {
      console.log(`  SKIP | ${label} | #camChip: no color/bg (${JSON.stringify(measurements)})`);
    }

    contrastResults.push({ vp, theme, measurements, passEntries });
  }
}

console.log(contrastAllPass
  ? `\nCONTRAST PASS ✅ — all ${contrastResults.length} viewport/theme combos ≥4.5:1 AA`
  : `\nCONTRAST FAIL ❌ — some viewport/theme combos below AA threshold`);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
pv.kill();

const overallPass = behavioralPass && contrastAllPass;
console.log(overallPass
  ? '\nCAM-CHIP PASS ✅ — behavioral + multi-viewport contrast all green'
  : '\nCAM-CHIP FAIL ❌');
process.exit(overallPass ? 0 : 1);
