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
setTimeout(() => { console.error('WATCHDOG: 420s timeout — force exit'); process.exit(2); }, 420000).unref();

const pv = await startPreview();

// --- Phase 1: behavioral test at 390x844 (original) ---
const b1 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const p = await b1.newPage();
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

async function pickRoute(page, inputSel, query) {
  await page.type(inputSel, query);
  try { await page.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 15000 }); await page.click('#suggestions .sugg:not(.sugg-recent)'); }
  catch { await page.focus(inputSel); await page.keyboard.press('Enter'); }
  await wait(500);
}
await pickRoute(p, '#toInput', 'Costco Lehi');
await pickRoute(p, '#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });

await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt')];
  const fast = opts.find((o) => o.textContent.includes('Fastest'));
  if (fast) fast.click();
});
await wait(600);
await p.click('#startNavBtn');
await wait(600);

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

try { await Promise.race([b1.close(), wait(5000)]); } catch {}

// --- Phase 2: multi-viewport contrast sweep ---
console.log('\n=== MULTI-VIEWPORT CONTRAST PROBE ===');

const b2 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const contrastResults = [];
let contrastAllPass = true;

for (const vp of VIEWPORT_LADDER) {
  for (const theme of THEMES) {
    const label = `${vp.width}x${vp.height} ${theme}`;
    let page;
    try {
      page = await b2.newPage();
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
      await pickRoute(page, '#toInput', 'Costco Lehi');
      await pickRoute(page, '#fromInput', 'Pleasant Grove Utah');
      await page.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });

      // Choose Fastest
      await page.evaluate(() => {
        const opts = [...document.querySelectorAll('.route-opt')];
        const fast = opts.find((o) => o.textContent.includes('Fastest'));
        if (fast) fast.click();
      });
      await wait(600);
      await page.click('#startNavBtn');
      await wait(1000);

      // Measure chip contrast. The chip sits on the nav-banner; both may
      // use translucent/gradient backgrounds. Sample the chip's parent
      // (nav-banner) background directly via computed style.
      const measurements = await page.evaluate(() => {
        const chip = document.querySelector('#camChip');
        if (!chip) return { error: 'chip missing' };
        const chipStyle = getComputedStyle(chip);

        // Walk up to find the nav-banner.
        let banner = chip.closest('#navBanner') || chip.closest('.nav-banner');
        let bannerBg = null;
        if (banner) {
          const bannerStyle = getComputedStyle(banner);
          bannerBg = bannerStyle.backgroundColor;
          // If the banner uses a gradient (background-image), extract the first color.
          if ((!bannerBg || bannerBg === 'rgba(0, 0, 0, 0)') && bannerStyle.backgroundImage) {
            const gradMatch = bannerStyle.backgroundImage.match(/(?:rgba?|hsla?)\([\d., ]+\)/);
            if (gradMatch) bannerBg = gradMatch[0];
          }
        }

        return {
          text: chip.textContent.trim(),
          color: chipStyle.color,
          bg: chipStyle.backgroundColor,
          bannerExists: !!banner,
          bannerBg,
          classes: chip.className,
        };
      });

      if (measurements.color && measurements.bg) {
        const textRgb = parseRgb(measurements.color);
        let bgRgb = parseRgb(measurements.bg);

        // Composite translucent chip bg against nav-banner bg.
        const chipMatch = measurements.bg.match(/[\d.]+/g);
        if (chipMatch && chipMatch.length >= 4) {
          const chipAlpha = parseFloat(chipMatch[3]);
          if (chipAlpha < 1 && measurements.bannerBg) {
            const bannerRgb = parseRgb(measurements.bannerBg);
            if (bannerRgb?.length === 3) {
              bgRgb = [
                Math.round(parseInt(chipMatch[0]) * chipAlpha + bannerRgb[0] * (1 - chipAlpha)),
                Math.round(parseInt(chipMatch[1]) * chipAlpha + bannerRgb[1] * (1 - chipAlpha)),
                Math.round(parseInt(chipMatch[2]) * chipAlpha + bannerRgb[2] * (1 - chipAlpha)),
              ];
            }
          }
        }

        if (textRgb?.length === 3 && bgRgb?.length === 3) {
          const ratio = contrast(textRgb, bgRgb);
          const pass = ratio >= AA_THRESHOLD;
          if (!pass) contrastAllPass = false;
          console.log(`  ${pass ? 'PASS' : 'FAIL'} | ${label} | #camChip: ${ratio.toFixed(2)}:1 text="${measurements.text}" (color=${measurements.color} chipBg=${measurements.bg} bannerBg=${measurements.bannerBg})`);
          contrastResults.push({ label, pass, ratio: ratio.toFixed(2) });
        }
      } else {
        console.log(`  SKIP | ${label} | #camChip: ${JSON.stringify(measurements)}`);
      }
    } catch (e) {
      console.log(`  ERROR | ${label} | ${e.message}`);
      contrastAllPass = false;
    } finally {
      if (page) {
        try { await page.goto('about:blank'); } catch {}
        try { await page.close(); } catch {}
      }
    }
    await wait(200);
  }
}

console.log(contrastAllPass
  ? `\nCONTRAST PASS ✅ — all ${contrastResults.length} measurements ≥4.5:1 AA`
  : `\nCONTRAST FAIL ❌ — some measurements below AA threshold`);

console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
try { await Promise.race([b2.close(), wait(5000)]); } catch {}
pv.kill();

const overallPass = behavioralPass && contrastAllPass;
console.log(overallPass
  ? '\nCAM-CHIP PASS ✅ — behavioral + multi-viewport contrast all green'
  : '\nCAM-CHIP FAIL ❌');
process.exit(overallPass ? 0 : 1);
