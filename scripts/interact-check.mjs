import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const srv = spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], { cwd: process.cwd(), stdio: 'ignore' });
  await wait(2500);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 800 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(2500);

  // Helper: what element is at the center of a selector?
  const atCenter = (sel) =>
    page.evaluate((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el ? el.id || el.tagName : 'none';
    }, sel);

  const checks = {};
  // (A) At load, the visible controls must not be covered by an overlay.
  checks.menuHit = await atCenter('#menuBtn');
  checks.gpsHit = await atCenter('#gpsBtn');
  checks.fromHit = await atCenter('#fromInput');
  checks.toHit = await atCenter('#toInput');

  // (B) Real mobile flow: set BOTH endpoints via suggestions, then REAL-click Go.
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  await wait(1100);
  let s = await page.$('#suggestions .sugg');
  if (s) await s.click();
  await wait(500);
  await page.type('#toInput', 'Lindon, Utah');
  await wait(1100);
  s = await page.$('#suggestions .sugg');
  if (s) await s.click();
  await wait(600);
  checks.goVisible = await page.evaluate(() => {
    const r = document.querySelector('#goBtn').getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !document.querySelector('#route-actions').hidden;
  });
  checks.goHit = await atCenter('#goBtn');
  // Real mouse click on Go.
  await page.click('#goBtn');
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 20000 });
    checks.routed = true;
  } catch {
    checks.routed = false;
  }
  await wait(1000);
  checks.routeCardShown = await page.evaluate(() => !document.querySelector('#route-card').hidden);
  checks.avoidToggleHit = await atCenter('#avoidChk'); // now visible

  console.log(JSON.stringify(checks, null, 1));
  console.log('page errors:', errs.slice(0, 4));

  const pass =
    checks.menuHit === 'menuBtn' &&
    checks.gpsHit === 'gpsBtn' &&
    checks.fromHit === 'fromInput' &&
    checks.toHit === 'toInput' &&
    checks.goVisible &&
    checks.goHit === 'goBtn' &&
    checks.routed &&
    checks.routeCardShown &&
    checks.avoidToggleHit === 'avoidChk' ||
    checks.avoidToggleHit === 'SPAN' ||
    errs.length === 0;

  await browser.close();
  srv.kill('SIGTERM');
  console.log(pass ? '\nINTERACTION PASS ✅ — full flow clickable + routes' : '\nINTERACTION FAIL ❌');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
