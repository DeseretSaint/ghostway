// Probe honest camera count (commit 22f6875)
// Drives the routing flow and extracts chip states + camera counts + corridor rendering
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 120s timeout'); process.exit(2); }, 120000).unref();

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 3 },
  { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1 },
];

async function main() {
  mkdirSync('ux-shots', { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor });
    
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
    await wait(3000);

    // Dismiss onboarding
    await page.evaluate(() => {
      const ob = document.querySelector('#obSkip'); if (ob) ob.click();
      const sp = document.querySelector('#splash'); if (sp) sp.remove();
    });
    await wait(300);

    // Type route
    await page.type('#fromInput', 'Pleasant Grove, Utah');
    await wait(900);
    await page.type('#toInput', 'Lindon, Utah');
    await wait(900);
    await page.evaluate(() => document.querySelector('#goBtn').click());
    
    // Wait for route
    try {
      await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
    } catch (e) { console.log(`[${vp.name}] warn: route flag not set`); }
    await wait(1800);

    // Screenshot the route card
    await page.screenshot({ path: `ux-shots/${vp.name}-honest-count.png` });

    // Extract state
    const state = await page.evaluate(() => {
      const result = {
        chips: [],
        options: [],
        corridorCamerasCount: 0,
        totalCamerasOnScreen: 0,
        camNearOpacity: null,
        baseCamOpacity: null,
        camChipText: null,
        error: null,
      };
      
      try {
        // All chip elements
        const chipEls = document.querySelectorAll('.gw-mode, [class*="gw-mode"], .mode-chip, .chip');
        result.chips = Array.from(chipEls).map(c => ({
          tag: c.tagName,
          class: c.className,
          text: c.textContent?.trim(),
          ariaPressed: c.getAttribute('aria-pressed'),
          ariaDisabled: c.getAttribute('aria-disabled'),
          disabled: c.disabled,
        }));

        // Route options
        const optEls = document.querySelectorAll('.opt-compact, [class*="opt-compact"], .route-opt, [class*="route-opt"]');
        result.options = Array.from(optEls).map(o => ({
          text: o.textContent?.trim().replace(/\s+/g, ' ').substring(0, 100),
          class: o.className,
          camText: o.querySelector('.opt-cams, [class*="cams"]')?.textContent?.trim(),
          isChosen: o.classList.contains('chosen') || o.getAttribute('aria-pressed') === 'true',
        }));

        // Camera layer rendering state
        // Check if there's a maplibre canvas
        const mapCanvas = document.querySelector('.maplibregl-canvas, canvas');
        if (mapCanvas) result.hasMapCanvas = true;
        
        // Cam chip in nav
        const navChip = document.querySelector('.cam-chip, [class*="cam-chip"]');
        if (navChip) result.camChipText = navChip.textContent?.trim();
        
        // Badge text
        const badge = document.querySelector('.opt-badge, [class*="badge"]');
        if (badge) result.badgeText = badge.textContent?.trim();
        
        // Body text around route card area
        const bodyText = document.body.innerText;
        const routeCardIdx = bodyText.indexOf('Clearest');
        if (routeCardIdx > -1) {
          result.routeCardText = bodyText.substring(Math.max(0, routeCardIdx - 50), routeCardIdx + 400);
        }
        
      } catch (e) {
        result.error = e.message;
      }
      
      return result;
    });
    
    console.log(`\n=== ${vp.name} ===`);
    console.log(JSON.stringify(state, null, 2));
    
    // Now tap "Balanced" chip if exists and re-extract
    const balancedChip = await page.$('.gw-mode[aria-pressed="false"], .gw-mode:not([aria-press])');
    if (balancedChip) {
      try {
        await balancedChip.click();
        await wait(800);
        await page.screenshot({ path: `ux-shots/${vp.name}-balanced-chip.png` });
        const balancedState = await page.evaluate(() => {
          const badge = document.querySelector('.opt-badge, [class*="badge"]');
          const camText = document.querySelector('.opt-cams, [class*="cams"]')?.textContent?.trim();
          const optEls = document.querySelectorAll('.opt-compact, [class*="opt-compact"]');
          return {
            badge: badge?.textContent?.trim(),
            camText,
            options: Array.from(optEls).map(o => ({
              text: o.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80),
              camText: o.querySelector('.opt-cams, [class*="cams"]')?.textContent?.trim(),
              isChosen: o.classList.contains('chosen'),
            })),
          };
        });
        console.log(`\n--- ${vp.name} AFTER BALANCED TAP ---`);
        console.log(JSON.stringify(balancedState, null, 2));
      } catch(e) {
        console.log(`[${vp.name}] balanced tap failed: ${e.message}`);
      }
    }
    
    // Tap "Fastest" chip and re-extract
    const chips = await page.$$('.gw-mode, [class*="gw-mode"]');
    for (const chip of chips) {
      const text = await chip.evaluate(el => el.textContent?.trim());
      if (text === 'Fastest') {
        await chip.click();
        await wait(800);
        await page.screenshot({ path: `ux-shots/${vp.name}-fastest-chip.png` });
        const fastestState = await page.evaluate(() => {
          const badge = document.querySelector('.opt-badge, [class*="badge"]');
          const optEls = document.querySelectorAll('.opt-compact, [class*="opt-compact"]');
          return {
            badge: badge?.textContent?.trim(),
            options: Array.from(optEls).map(o => ({
              text: o.textContent?.trim().replace(/\s+/g, ' ').substring(0, 80),
              camText: o.querySelector('.opt-cams, [class*="cams"]')?.textContent?.trim(),
              isChosen: o.classList.contains('chosen'),
            })),
          };
        });
        console.log(`\n--- ${vp.name} AFTER FASTEST TAP ---`);
        console.log(JSON.stringify(fastestState, null, 2));
        break;
      }
    }
    
    await page.close();
  }

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  console.log('\nDone');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
