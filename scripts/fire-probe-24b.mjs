import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const { kill } = await startPreview();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true });
setTimeout(() => { console.error('WATCHDOG 90s'); process.exit(2); }, 90000).unref();

await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
await wait(1500);

await page.type('#fromInput', 'Pleasant Grove');
await wait(1500);
await page.evaluate(() => {
  const s = document.querySelector('#suggestions');
  if (s && s.children.length) s.children[0].click();
});
await wait(500);
await page.type('#toInput', 'Lehi');
await wait(1500);
await page.evaluate(() => {
  const s = document.querySelector('#suggestions');
  if (s && s.children.length) s.children[0].click();
});
await wait(8000); // route compute

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
