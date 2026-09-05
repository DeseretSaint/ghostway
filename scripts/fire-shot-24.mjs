import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TODAY = new Date().toISOString().slice(0, 10);
const OUTDIR = 'ux-shots';
fs.mkdirSync(OUTDIR, { recursive: true });

const { kill } = await startPreview();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
setTimeout(() => { console.error('WATCHDOG'); process.exit(2); }, 240000).unref();

async function driveRoute(page) {
  await page.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await wait(1200);
  await page.type('#fromInput', 'Pleasant Grove');
  await wait(1200);
  await page.evaluate(() => { const s = document.querySelector('#suggestions'); if (s?.children.length) s.children[0].click(); });
  await wait(400);
  await page.type('#toInput', 'Lehi');
  await wait(1200);
  await page.evaluate(() => { const s = document.querySelector('#suggestions'); if (s?.children.length) s.children[0].click(); });
  await wait(8000);
}

const RUNS = [
  { w: 320, h: 568, isMobile: true, theme: 'light' },
  { w: 375, h: 812, isMobile: true, theme: 'light' },
  { w: 390, h: 844, isMobile: true, theme: 'light' },
  { w: 430, h: 932, isMobile: true, theme: 'light' },
  { w: 1440, h: 900, isMobile: false, theme: 'light' },
  { w: 320, h: 568, isMobile: true, theme: 'dark' },
  { w: 375, h: 812, isMobile: true, theme: 'dark' },
  { w: 390, h: 844, isMobile: true, theme: 'dark' },
  { w: 430, h: 932, isMobile: true, theme: 'dark' },
  { w: 1440, h: 900, isMobile: false, theme: 'dark' },
];

for (const run of RUNS) {
  const t0 = Date.now();
  const page = await browser.newPage();
  await page.setViewport({ width: run.w, height: run.h, isMobile: run.isMobile, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: run.theme }]);
  await driveRoute(page);
  // Show onboarding overlay visibly for screenshot
  await page.evaluate(() => {
    const o = document.querySelector('#onboarding');
    if (o) { o.hidden = false; o.style.cssText = 'display:flex!important;z-index:9999;'; }
  });
  await wait(300);
  const f1 = `${OUTDIR}/a11y-fixes-onboarding-${run.w}-${run.theme}-${TODAY}.png`;
  await page.screenshot({ path: f1 });
  // Hide onboarding, show route card clean
  await page.evaluate(() => {
    const o = document.querySelector('#onboarding');
    if (o) o.hidden = true;
  });
  await wait(200);
  const f2 = `${OUTDIR}/a11y-fixes-routes-${run.w}-${run.theme}-${TODAY}.png`;
  await page.screenshot({ path: f2 });
  console.log(`[${run.w}-${run.theme}] ${Date.now()-t0}ms — ${f1}, ${f2}`);
  await page.close();
}

await browser.close();
kill();
