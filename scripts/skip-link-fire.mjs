// Onboarding skip link contrast screenshot audit for ghostway-fire.
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s'); process.exit(2); }, 180000).unref();

const OUT = 'ux-shots';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, dpr: 3 },
  { name: 'mobile-375', width: 375, height: 812, dpr: 3 },
  { name: 'desktop-1440', width: 1440, height: 900, dpr: 1 },
];

const results = [];

async function run() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  for (const vp of VIEWPORTS) {
    for (const theme of ['dark', 'light']) {
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr });

      try {
        // Emulate color scheme BEFORE navigation.
        await page.emulateMediaFeatures([
          { name: 'prefers-color-scheme', value: theme },
        ]);

        await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.evaluate(() => localStorage.clear());
        await page.reload({ waitUntil: 'domcontentloaded' });

        // Wait for onboarding overlay.
        await page.waitForFunction(() => {
          const w = document.querySelector('#onboarding');
          return w && !w.hidden;
        }, { timeout: 10000 });
        await wait(400);

        // Get computed styles.
        const styles = await page.evaluate(() => {
          const skip = document.querySelector('#obSkip');
          const card = document.querySelector('.ob-card');
          if (!skip || !card) return null;
          const cs = getComputedStyle(skip);
          const cardCs = getComputedStyle(card);
          const skipRect = skip.getBoundingClientRect();
          return {
            skipColor: cs.color,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            cardBg: cardCs.backgroundColor,
            skipRect: { x: Math.round(skipRect.x), y: Math.round(skipRect.y), w: Math.round(skipRect.width), h: Math.round(skipRect.height) },
          };
        });

        const nextStyles = await page.evaluate(() => {
          const next = document.querySelector('#obNext');
          return next ? { color: getComputedStyle(next).color, bg: getComputedStyle(next).backgroundColor } : null;
        });

        // Full screenshot.
        const fullFile = `${OUT}/skip-link-${theme}-${vp.name}.png`;
        await page.screenshot({ path: fullFile });

        // Crop to skip link.
        let cropFile = null;
        if (styles?.skipRect) {
          const r = styles.skipRect;
          const pad = 14;
          cropFile = `${OUT}/skip-link-${theme}-${vp.name}-crop.png`;
          await page.screenshot({ path: cropFile, clip: {
            x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad),
            width: r.w + pad * 2, height: r.h + pad * 2,
          }});
        }

        results.push({ vp: vp.name, theme, styles, nextStyles, fullFile, cropFile });
        console.log(`OK ${vp.name}-${theme}: skip=${styles?.skipColor} next=${JSON.stringify(nextStyles)}`);
      } catch (e) {
        console.error(`FAIL ${vp.name}-${theme}: ${e.message}`);
        results.push({ vp: vp.name, theme, error: e.message });
      } finally {
        await page.close().catch(() => {});
      }
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  await browser.close().catch(() => {});
  kill();
}

run().catch((e) => { console.error(e); process.exit(1); });
