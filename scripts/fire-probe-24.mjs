import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const { kill } = await startPreview();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });

await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'networkidle2', timeout: 45000 });
await wait(800);

// Probe initial state
const initial = await page.evaluate(() => {
  return {
    onboarded: localStorage.getItem('gw-onboarded'),
    batteryHint: !!document.querySelector('#batteryHint'),
    onboarding: !!document.querySelector('#onboarding'),
    routeCard: !!document.querySelector('#route-card'),
  };
});
console.log('INITIAL:', JSON.stringify(initial));

// Drive a route: type, click first suggestion, type second, click first
await page.type('#fromInput', 'Pleasant Grove');
await wait(800);
await page.waitForFunction(() => {
  const s = document.querySelector('#suggestions');
  return s && !s.hidden && s.children.length > 0;
}, { timeout: 8000 }).catch(() => console.log('from-sugg timeout'));
await wait(300);
await page.evaluate(() => {
  const s = document.querySelector('#suggestions');
  if (s && s.children.length) s.children[0].click();
});
await wait(500);

await page.type('#toInput', 'Lehi');
await wait(800);
await page.waitForFunction(() => {
  const s = document.querySelector('#suggestions');
  return s && !s.hidden && s.children.length > 0;
}, { timeout: 8000 }).catch(() => console.log('to-sugg timeout'));
await wait(300);
await page.evaluate(() => {
  const s = document.querySelector('#suggestions');
  if (s && s.children.length) s.children[0].click();
});

// Wait for route card
try {
  await page.waitForFunction(() => {
    const c = document.querySelector('#route-card');
    return c && !c.hidden;
  }, { timeout: 30000 });
} catch {
  console.log('route-card timeout');
}
await wait(800);

const probe = await page.evaluate(() => {
  const opts = Array.from(document.querySelectorAll('.route-opt'));
  const batteryHint = document.querySelector('#batteryHint');
  const onboarding = document.querySelector('#onboarding');
  return {
    routeCardVisible: !document.querySelector('#route-card').hidden,
    routeOptCount: opts.length,
    routeOptAttrs: opts.map((b) => ({
      tabindex: b.getAttribute('tabindex'),
      role: b.getAttribute('role'),
      ariaPressed: b.getAttribute('aria-pressed'),
      ariaLabel: b.getAttribute('aria-label')?.slice(0, 80),
      hasChosen: b.classList.contains('chosen'),
    })),
    batteryHint: batteryHint ? {
      hidden: batteryHint.hidden,
      role: batteryHint.getAttribute('role'),
      ariaLabel: batteryHint.getAttribute('aria-label'),
      tabindex: batteryHint.getAttribute('tabindex'),
    } : null,
    onboarding: onboarding ? {
      hidden: onboarding.hidden,
      role: onboarding.getAttribute('role'),
      ariaModal: onboarding.getAttribute('aria-modal'),
      ariaLabel: onboarding.getAttribute('aria-label'),
    } : null,
  };
});
console.log('PROBE:', JSON.stringify(probe, null, 2));

await browser.close();
kill();
