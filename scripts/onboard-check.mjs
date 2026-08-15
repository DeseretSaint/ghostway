// Workstream D: splash shows on load and dismisses; first-run onboarding walks
// 3 steps (real clicks), persists; second load skips onboarding.
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });

// 1) Splash visible immediately after load, then gone.
const splashEarly = await p.evaluate(() => {
  const s = document.querySelector('#splash');
  return { exists: !!s, hidden: s?.hidden };
});
console.log('splash at load:', JSON.stringify(splashEarly));
await p.waitForFunction('window.__ghostwaySplash === "done"', { timeout: 8000 });
await wait(600);
const splashLate = await p.evaluate(() => document.querySelector('#splash').hidden);
console.log('splash dismissed:', splashLate);

// 2) Onboarding appears (fresh profile), walks 3 steps with real clicks.
const obShown = await p.evaluate(() => !document.querySelector('#onboarding').hidden);
console.log('onboarding shown:', obShown);
const titles = [];
for (let i = 0; i < 3; i++) {
  const t = await p.evaluate(() => document.querySelector('.ob-step h3')?.textContent);
  titles.push(t);
  // hit-test the Next button (protocol requirement: real click + hit test)
  const hit = await p.evaluate(() => {
    const el = document.querySelector('#obNext');
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return top ? top.tagName + (top.id ? '#' + top.id : '') : 'none';
  });
  if (hit !== 'BUTTON#obNext') console.log('  WARN: next button hit-test ->', hit);
  await p.click('#obNext');
  await wait(350);
}
console.log('onboarding steps:', JSON.stringify(titles));
const obDone = await p.waitForFunction('window.__ghostwayOnboarded === "done"', { timeout: 5000 }).then(() => true).catch(() => false);
console.log('onboarding completed:', obDone);
const persisted = await p.evaluate(() => localStorage.getItem('gw-onboarded'));
console.log('persisted flag:', persisted);

// 3) Reload — onboarding must NOT show again.
await p.reload({ waitUntil: 'networkidle2' });
await wait(1500);
const obSecond = await p.evaluate(() => document.querySelector('#onboarding').hidden);
console.log('onboarding hidden on second load:', obSecond);

await p.screenshot({ path: 'ob-shot.png' });
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 3));
await b.close();

const pass =
  splashEarly.exists && !splashEarly.hidden && splashLate &&
  obShown && titles.length === 3 && titles.every(Boolean) && obDone &&
  persisted === '1' && obSecond;
console.log(pass ? '\nONBOARDING PASS ✅ — splash + first-run flow work' : '\nONBOARDING FAIL ❌');
process.exit(pass ? 0 : 1);
