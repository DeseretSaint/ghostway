// Screenshot proof: starts a preview server, loads Ghostway in headless Chrome,
// drives a real route (Pleasant Grove -> a point north, past a Flock camera),
// and saves a PNG of the result.
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();


function serve() {
  const p = spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
  return p;
}

async function main() {
  const srv = serve();
  await wait(2500);
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
  await wait(2500); // let map + camera tiles load

  // Fill from/to and route. Pleasant Grove -> Lindon (passes Flock cameras).
  await page.waitForSelector('#goBtn', { visible: true });
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  await wait(1200);
  await page.type('#toInput', 'Lindon, Utah');
  await wait(1200);
  await page.evaluate(() => document.querySelector('#goBtn').click());
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
  srv.kill('SIGTERM');
  console.log('screenshots saved');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
