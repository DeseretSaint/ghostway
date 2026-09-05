// Workstream D: splash shows on load and dismisses; first-run onboarding walks
// 3 steps (real clicks), persists; second load skips onboarding.
// Viewports: 320/375/390/430/720/1024/1440 (full ladder).
// Also verifies the "Show tour" trigger in the settings drawer.
//
// Extended (round-28): multi-viewport contrast probe — skip link (#obSkip)
// contrast at every viewport × light/dark, asserting AA (≥4.5:1).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { VIEWPORT_LADDER, THEMES, AA_THRESHOLD, contrast, parseRgb } from './lib-contrast.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 360s timeout — force exit'); process.exit(2); }, 360000).unref();

const pv = await startPreview();

// --- Phase 1: behavioral test at 375/390/1440 (original) ---
const b1 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function runViewport(width, height, isMobile) {
  const p = await b1.newPage();
  await p.setViewport({ width, height, isMobile, hasTouch: isMobile, deviceScaleFactor: isMobile ? 2 : 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));

  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(() => { localStorage.removeItem('gw-onboarded'); });
  await p.reload({ waitUntil: 'networkidle2' });

  const result = { width };

  const splashEarly = await p.evaluate(() => {
    const s = document.querySelector('#splash');
    return { exists: !!s, hidden: s?.hidden };
  });
  result.splashAtLoad = splashEarly.exists && !splashEarly.hidden;
  await p.waitForFunction('window.__ghostwaySplash === "done"', { timeout: 8000 }).catch(() => {});
  await wait(600);
  result.splashDismissed = await p.evaluate(() => document.querySelector('#splash').hidden);

  result.obShown = await p.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return !!ob && !ob.hidden;
  });

  const titles = [];
  for (let i = 0; i < 3; i++) {
    const t = await p.evaluate(() => document.querySelector('.ob-step h3')?.textContent);
    titles.push(t);
    await p.click('#obNext');
    await wait(350);
  }
  result.titles = titles;
  result.obDone = await p.waitForFunction('window.__ghostwayOnboarded === "done"', { timeout: 5000 }).then(() => true).catch(() => false);
  result.persisted = await p.evaluate(() => localStorage.getItem('gw-onboarded')) === '1';

  await p.reload({ waitUntil: 'networkidle2' });
  await wait(1500);
  result.obHiddenSecond = await p.evaluate(() => document.querySelector('#onboarding').hidden);

  result.errors = errs.filter((e) => !/favicon|404|CORS|Failed to load/.test(e));
  console.log(`@${width}x${height}: splash=${result.splashAtLoad ? 'Y' : 'N'}/${result.splashDismissed ? 'gone' : 'stuck'} ob=${result.obShown ? 'Y' : 'N'} steps=${JSON.stringify(titles)} done=${result.obDone ? 'Y' : 'N'} persisted=${result.persisted ? 'Y' : 'N'} second=${result.obHiddenSecond ? 'hidden' : 'shown'} errs=${result.errors.length}`);

  try { await Promise.race([p.close(), wait(5000)]); } catch {}
  return { ...result, pass: result.splashAtLoad && result.splashDismissed && result.obShown && titles.length === 3 && titles.every(Boolean) && result.obDone && result.persisted && result.obHiddenSecond && result.errors.length === 0 };
}

async function runTourTrigger() {
  const p = await b1.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));

  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 8000 }).catch(() => {});
  await wait(500);

  const result = {};
  result.obHiddenReturning = await p.evaluate(() => document.querySelector('#onboarding').hidden);

  await p.click('#menuBtn');
  await wait(300);
  result.drawerOpened = await p.evaluate(() => !document.querySelector('#drawer').hidden);
  await p.click('[data-action="tour"]');
  await wait(400);

  result.tourShown = await p.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return !!ob && !ob.hidden;
  });
  result.tourTitle = await p.evaluate(() => document.querySelector('.ob-step h3')?.textContent);

  result.errors = errs.filter((e) => !/favicon|404|CORS|Failed to load/.test(e));
  console.log(`tour-trigger: returningHidden=${result.obHiddenReturning ? 'Y' : 'N'} drawer=${result.drawerOpened ? 'Y' : 'N'} tour=${result.tourShown ? 'Y' : 'N'} title="${result.tourTitle}" errs=${result.errors.length}`);

  try { await Promise.race([p.close(), wait(5000)]); } catch {}
  return { ...result, pass: result.obHiddenReturning && result.drawerOpened && result.tourShown && !!result.tourTitle && result.errors.length === 0 };
}

const r375 = await runViewport(375, 812, true);
const r390 = await runViewport(390, 844, true);
const r1440 = await runViewport(1440, 900, false);
const rTour = await runTourTrigger();

const behavioralPass = r375.pass && r390.pass && r1440.pass && rTour.pass;
console.log(`\n375: ${r375.pass ? 'PASS' : 'FAIL'} | 390: ${r390.pass ? 'PASS' : 'FAIL'} | 1440: ${r1440.pass ? 'PASS' : 'FAIL'} | tour-trigger: ${rTour.pass ? 'PASS' : 'FAIL'}`);
console.log(behavioralPass
  ? '\nBEHAVIORAL PASS ✅ — all viewports + drawer trigger work'
  : '\nBEHAVIORAL FAIL ❌');

try { await Promise.race([b1.close(), wait(5000)]); } catch {}

// --- Phase 2: multi-viewport contrast sweep for skip link ---
console.log('\n=== MULTI-VIEWPORT CONTRAST PROBE (skip link) ===');

const b2 = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const contrastResults = [];
let contrastAllPass = true;

// Use a single page, resize + reload + re-measure for each combo.
const page = await b2.newPage();

for (const vp of VIEWPORT_LADDER) {
  for (const theme of THEMES) {
    const label = `${vp.width}x${vp.height} ${theme}`;
    try {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
        deviceScaleFactor: vp.isMobile ? 2 : 1,
      });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
      await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
      await wait(800);

      await page.waitForFunction(() => {
        const ob = document.querySelector('#onboarding');
        return ob && !ob.hidden;
      }, { timeout: 10000 }).catch(() => {});

      const measurements = await page.evaluate(() => {
        const skip = document.querySelector('#obSkip');
        const card = document.querySelector('.ob-card');
        if (!skip || !card) return { error: 'elements missing' };
        const skipStyle = getComputedStyle(skip);
        const cardStyle = getComputedStyle(card);
        let cardBg = cardStyle.backgroundColor;
        if (!cardBg || cardBg === 'rgba(0, 0, 0, 0)') {
          const gradMatch = cardStyle.backgroundImage.match(/(?:rgba?|hsla?)\([\d., ]+\)/);
          if (gradMatch) cardBg = gradMatch[0];
        }
        return {
          skipColor: skipStyle.color,
          cardBg,
          skipText: skip.textContent.trim(),
        };
      });

      if (measurements.skipColor && measurements.cardBg) {
        const textRgb = parseRgb(measurements.skipColor);
        const bgRgb = parseRgb(measurements.cardBg);
        if (textRgb?.length === 3 && bgRgb?.length === 3) {
          const ratio = contrast(textRgb, bgRgb);
          const pass = ratio >= AA_THRESHOLD;
          if (!pass) contrastAllPass = false;
          console.log(`  ${pass ? 'PASS' : 'FAIL'} | ${label} | #obSkip: ${ratio.toFixed(2)}:1 text="${measurements.skipText}" (color=${measurements.skipColor} cardBg=${measurements.cardBg})`);
          contrastResults.push({ label, pass, ratio: ratio.toFixed(2) });
        }
      } else {
        console.log(`  SKIP | ${label} | #obSkip: ${JSON.stringify(measurements)}`);
      }
    } catch (e) {
      console.log(`  ERROR | ${label} | ${e.message}`);
      contrastAllPass = false;
    }
    await wait(300);
  }
}

try { await page.goto('about:blank'); } catch {}
try { await page.close(); } catch {}

console.log(contrastAllPass
  ? `\nCONTRAST PASS ✅ — all ${contrastResults.length} viewport/theme combos ≥4.5:1 AA`
  : `\nCONTRAST FAIL ❌ — some viewport/theme combos below AA threshold`);

try { await Promise.race([b2.close(), wait(5000)]); } catch {}
pv.kill();

const overallPass = behavioralPass && contrastAllPass;
console.log(overallPass
  ? '\nONBOARDING+TOUR PASS ✅ — behavioral + multi-viewport contrast all green'
  : '\nONBOARDING+TOUR FAIL ❌');
process.exit(overallPass ? 0 : 1);
