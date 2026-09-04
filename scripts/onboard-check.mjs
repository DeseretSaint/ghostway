// Workstream D: splash shows on load and dismisses; first-run onboarding walks
// 3 steps (real clicks), persists; second load skips onboarding.
// Viewports: 375 (iPhone SE), 390 (iPhone 14), 1440 (desktop).
// Also verifies the "Show tour" trigger in the settings drawer.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const pv = await startPreview();

async function runViewport(width, height, isMobile) {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width, height, isMobile, hasTouch: isMobile, deviceScaleFactor: isMobile ? 2 : 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));

  // Fresh profile: clear flag, then reload so init() sees no flag.
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(() => { localStorage.removeItem('gw-onboarded'); });
  await p.reload({ waitUntil: 'networkidle2' });

  const result = { width };

  // 1) Splash visible at load, then dismissed.
  const splashEarly = await p.evaluate(() => {
    const s = document.querySelector('#splash');
    return { exists: !!s, hidden: s?.hidden };
  });
  result.splashAtLoad = splashEarly.exists && !splashEarly.hidden;
  await p.waitForFunction('window.__ghostwaySplash === "done"', { timeout: 8000 }).catch(() => {});
  await wait(600);
  result.splashDismissed = await p.evaluate(() => document.querySelector('#splash').hidden);

  // 2) Onboarding overlay shows.
  result.obShown = await p.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return !!ob && !ob.hidden;
  });

  // Walk 3 steps with real clicks.
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

  // 3) Reload — onboarding must NOT show again (flag persists).
  await p.reload({ waitUntil: 'networkidle2' });
  await wait(1500);
  result.obHiddenSecond = await p.evaluate(() => document.querySelector('#onboarding').hidden);

  result.errors = errs.filter((e) => !/favicon|404|CORS|Failed to load/.test(e));
  console.log(`@${width}x${height}: splash=${result.splashAtLoad ? 'Y' : 'N'}/${result.splashDismissed ? 'gone' : 'stuck'} ob=${result.obShown ? 'Y' : 'N'} steps=${JSON.stringify(titles)} done=${result.obDone ? 'Y' : 'N'} persisted=${result.persisted ? 'Y' : 'N'} second=${result.obHiddenSecond ? 'hidden' : 'shown'} errs=${result.errors.length}`);

  try { await Promise.race([b.close(), wait(5000)]); } catch {}
  return { ...result, pass: result.splashAtLoad && result.splashDismissed && result.obShown && titles.length === 3 && titles.every(Boolean) && result.obDone && result.persisted && result.obHiddenSecond && result.errors.length === 0 };
}

// Test "Show tour" trigger from settings drawer.
async function runTourTrigger() {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));

  // Returning user: set flag, reload, confirm onboarding hidden.
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 8000 }).catch(() => {});
  await wait(500);

  const result = {};

  // Confirm onboarding is hidden for returning user.
  result.obHiddenReturning = await p.evaluate(() => document.querySelector('#onboarding').hidden);

  // Open drawer, click "Show tour".
  await p.click('#menuBtn');
  await wait(300);
  result.drawerOpened = await p.evaluate(() => !document.querySelector('#drawer').hidden);
  await p.click('[data-action="tour"]');
  await wait(400);

  // Onboarding should now show (tour triggered).
  result.tourShown = await p.evaluate(() => {
    const ob = document.querySelector('#onboarding');
    return !!ob && !ob.hidden;
  });
  result.tourTitle = await p.evaluate(() => document.querySelector('.ob-step h3')?.textContent);

  result.errors = errs.filter((e) => !/favicon|404|CORS|Failed to load/.test(e));
  console.log(`tour-trigger: returningHidden=${result.obHiddenReturning ? 'Y' : 'N'} drawer=${result.drawerOpened ? 'Y' : 'N'} tour=${result.tourShown ? 'Y' : 'N'} title="${result.tourTitle}" errs=${result.errors.length}`);

  try { await Promise.race([b.close(), wait(5000)]); } catch {}
  return { ...result, pass: result.obHiddenReturning && result.drawerOpened && result.tourShown && !!result.tourTitle && result.errors.length === 0 };
}

const r375 = await runViewport(375, 812, true);
const r390 = await runViewport(390, 844, true);
const r1440 = await runViewport(1440, 900, false);
const rTour = await runTourTrigger();

const allPass = r375.pass && r390.pass && r1440.pass && rTour.pass;
console.log(`\n375: ${r375.pass ? 'PASS' : 'FAIL'} | 390: ${r390.pass ? 'PASS' : 'FAIL'} | 1440: ${r1440.pass ? 'PASS' : 'FAIL'} | tour-trigger: ${rTour.pass ? 'PASS' : 'FAIL'}`);
console.log(allPass ? '\nONBOARDING+TOUR PASS ✅ — all viewports + drawer trigger work' : '\nONBOARDING+TOUR FAIL ❌');
pv.kill();
process.exit(allPass ? 0 : 1);
