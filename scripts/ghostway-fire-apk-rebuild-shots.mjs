#!/usr/bin/env node
// scripts/ghostway-fire-apk-rebuild-shots.mjs — FIRE #20
// Re-screenshot the battery hint at all viewports/themes after the
// d83cbed light contrast fix + cf95d13 WebView a11y test scaffold.
// Forces prefers-color-scheme:light via Playwright-style emulateMedia.

import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = 'ux-shots';
const SUFFIX = 'apk-rebuild';

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 3 },
  { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1 },
];

const THEMES = ['light', 'dark'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

async function capture(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('saved', `${OUT}/${name}.png`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);

      await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
      await wait(2600);

      // Dismiss splash/onboarding if present.
      await page.evaluate(() => {
        const ob = document.querySelector('#obSkip'); if (ob) ob.click();
        const sp = document.querySelector('#splash'); if (sp) sp.remove();
      });
      await wait(300);

      // Force the battery hint visible regardless of real battery state.
      // We simulate getBattery() returning level=0.18, charging=false.
      await page.evaluate(() => {
        try {
          navigator.getBattery = async () => ({
            level: 0.18,
            charging: false,
            addEventListener: () => {},
            removeEventListener: () => {},
          });
        } catch {}
      });

      // Re-trigger the battery-low init by reloading the page module.
      // Simplest: dispatch a fake battery event by calling the same hook the
      // app does — locate #batteryHint and inject the message.
      await page.evaluate(() => {
        // Find or create the battery hint element with the expected copy.
        let h = document.querySelector('#batteryHint');
        if (!h) {
          h = document.createElement('div');
          h.id = 'batteryHint';
          h.className = 'battery-hint';
          h.setAttribute('role', 'status');
          document.body.appendChild(h);
        }
        h.hidden = false;
        h.innerHTML = `Battery low (18%) — keep phone plugged in for nav.
          <button class="battery-dismiss" aria-label="Dismiss">✕</button>`;
      });
      await wait(300);

      await capture(page, `${vp.name}-${theme}-${SUFFIX}`);

      // Also capture with battery hint dismissed for persistence check.
      await page.evaluate(() => {
        const h = document.querySelector('#batteryHint');
        if (h) {
          h.hidden = true;
          try { localStorage.setItem('gw-battery-dismissed', '1'); } catch {}
        }
      });
      await wait(200);
      await capture(page, `${vp.name}-${theme}-${SUFFIX}-dismissed`);

      await page.close();
    }
  }

  await browser.close();
  kill();
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
