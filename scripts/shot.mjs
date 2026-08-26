// Screenshot proof: starts a preview server, loads Ghostway in headless Chrome,
// drives a real route (Pleasant Grove -> a point north, past a Flock camera),
// and saves a PNG of the result.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();


async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1100,800'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 800 });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  // Wait for the splash to dismiss (it covers the controls for up to ~4.4s).
  try {
    await page.waitForFunction(() => {
      const s = document.querySelector('#splash');
      return !s || s.hidden;
    }, { timeout: 8000 });
  } catch {}
  await wait(500);

  // Fill from/to via suggestions (current UI auto-routes once both endpoints
  // are picked; #goBtn stays hidden until the panel is expanded). In-page
  // click + retry: the suggestion list re-renders on debounce, which can make
  // a pre-fetched ElementHandle stale ("not clickable or not an Element").
  async function pick(inputSel, query) {
    await page.type(inputSel, query);
    for (let i = 0; i < 12; i++) {
      const ok = await page.evaluate(() => {
        const el = document.querySelector('#suggestions .sugg');
        if (!el) return false;
        el.click();
        return true;
      });
      if (ok) return;
      await wait(500);
    }
    await page.focus(inputSel);
    await page.keyboard.press('Enter');
  }
  await pick('#fromInput', 'Pleasant Grove, Utah');
  await wait(500);
  await pick('#toInput', 'Lindon, Utah');
  await wait(600);
  // If auto-route hasn't fired and Go is visible, give it a real click.
  const goVisible = await page.evaluate(() => {
    const r = document.querySelector('#goBtn').getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  if (goVisible) await page.click('#goBtn');
  // Wait until a route line is actually drawn (route source has features).
  try {
    await page.waitForFunction(
      () => {
        const g = window.__ghostwayDebug;
        return g && g.routed === true;
      },
      { timeout: 15000 }
    );
  } catch (e) {
    console.log('warn: route not flagged, capturing anyway');
  }
  await wait(1500); // let map + camera tiles load

  await page.screenshot({ path: 'shot-route.png' });
  console.log('console errors:', errors.length ? errors.slice(0, 8) : 'none');

  // Open the menu -> donate to prove that surface renders.
  await page.evaluate(() => document.querySelector('#menuBtn').click());
  await wait(400);
  await page.evaluate(() => document.querySelector('[data-action="donate"]').click());
  await wait(700);
  await page.screenshot({ path: 'shot-donate.png' });

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log('screenshots saved');
  process.exit(errors.filter((e) => !/favicon/.test(e)).length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
