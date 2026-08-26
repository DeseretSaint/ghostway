// UX screenshot proof for the polish goal loop.
// Boots a preview server, loads Ghostway in headless Chrome at several
// viewports, and captures the key UI surfaces: search panel, route card,
// nav banner (injected), drawer, and a modal. Saves PNGs under ux-shots/.
//
// Usage: node scripts/ux-shots.mjs
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

const OUT = 'ux-shots';

function serve() {
  return spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 3 },
  { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1 },
];

async function capture(page, vp, label) {
  const file = `${OUT}/${vp.name}-${label}.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const srv = serve();
  await wait(2600);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
    await wait(2600); // map + camera tiles

    // Dismiss splash/onboarding if present.
    await page.evaluate(() => {
      const ob = document.querySelector('#obSkip'); if (ob) ob.click();
      const sp = document.querySelector('#splash'); if (sp) sp.remove();
    });
    await wait(300);

    // 1) Search panel (default state).
    await capture(page, vp, 'search');

    // 2) Route card: fill from/to and route.
    await page.type('#fromInput', 'Pleasant Grove, Utah'); await wait(900);
    await page.type('#toInput', 'Lindon, Utah'); await wait(900);
    await page.evaluate(() => document.querySelector('#goBtn').click());
    try {
      await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 });
    } catch (e) { console.log('warn: route flag not set, capturing anyway'); }
    await wait(1400);
    await capture(page, vp, 'routecard');

    // 3) Nav banner: inject a representative banner for a static capture.
    await page.evaluate(() => {
      const b = document.querySelector('#navBanner');
      b.hidden = false;
      b.innerHTML = `
        <button id="navStop" class="nav-stop" aria-label="Stop navigation">✕</button>
        <div class="nav-icon" aria-hidden="true">↱</div>
        <div class="nav-step">
          <div class="nav-dist" id="navDist">0.4 mi</div>
          <div class="nav-dir">Turn right onto <b>State St</b></div>
          <div class="nav-then">then ↑ continue · Main St</div>
        </div>
        <div class="nav-side">
          <div class="nav-side-row">
            <button id="voiceBtn" class="nav-voice on" aria-label="Toggle voice">🔊</button>
            <button id="densityBtn" class="nav-voice" aria-label="Toggle density">▤</button>
          </div>
          <div class="speed-limit"><span class="sl-num">35</span><span class="sl-lbl">MAX</span></div>
          <div id="camChip" class="cam-chip">📷 2</div>
          <div class="nav-eta">12 min</div>
        </div>`;
    });
    await wait(300);
    await capture(page, vp, 'navbanner');
    await page.evaluate(() => { document.querySelector('#navBanner').hidden = true; });

    // 4) Drawer.
    await page.evaluate(() => document.querySelector('#menuBtn').click());
    await wait(400);
    await capture(page, vp, 'drawer');
    await page.evaluate(() => document.querySelector('#closeDrawer').click());
    await wait(300);

    // 5) Modal (About).
    await page.evaluate(() => document.querySelector('#menuBtn').click());
    await wait(300);
    await page.evaluate(() => document.querySelector('[data-action="about"]').click());
    await wait(500);
    await capture(page, vp, 'modal');

    console.log(`[${vp.name}] console errors:`, errors.length ? errors.slice(0, 6) : 'none');
    await page.close();
  }

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  srv.kill('SIGTERM');
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
