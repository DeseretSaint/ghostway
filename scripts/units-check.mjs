import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

// Pick the first LIVE photon suggestion (exclude instant "recent" rows that
// appear on focus — clicking those before results arrive causes from==to
// degenerate routes, the same flake class fixed in engine-e2e/tiers).
async function pickSuggestion(page, sel, q) {
  await page.focus(sel);
  await page.type(sel, q);
  await page.waitForFunction(() => {
    const loading = document.querySelector('#suggestions .sugg-loading, #suggestions .sugg-empty');
    if (loading) return false;
    return !!document.querySelector('#suggestions .sugg:not(.sugg-recent)');
  }, { timeout: 12000 });
  const s = await page.$('#suggestions .sugg:not(.sugg-recent)');
  if (s) await s.click();
}

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 800 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('gw-onboarded', '1');
    localStorage.setItem('gw-units', 'mi');
  });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 8000 });
  } catch {}
  await wait(500);

  const checks = {};
  checks.btnExists = await page.evaluate(() => !!document.querySelector('#unitsBtn'));
  checks.labelInitial = await page.evaluate(() => document.querySelector('#unitsBtn')?.textContent?.trim());

  await pickSuggestion(page, '#fromInput', 'Pleasant Grove, Utah');
  await wait(300);
  await pickSuggestion(page, '#toInput', 'Lindon, Utah');
  await wait(500);
  const goReady = await page.evaluate(() => {
    const r = document.querySelector('#goBtn').getBoundingClientRect();
    return r.width > 0 && !document.querySelector('#route-actions').hidden;
  });
  if (goReady) await page.click('#goBtn');
  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 30000 });
    checks.routed = true;
  } catch { checks.routed = false; }
  await wait(1000);
  checks.cardShown = await page.evaluate(() => !document.querySelector('#route-card').hidden);
  checks.metaInitial = await page.evaluate(() => document.querySelector('.route-opt .opt-meta')?.textContent || '');

  // Flip to km via a DOM-level click (bypasses any overlay coordinate race).
  await page.evaluate(() => document.querySelector('#unitsBtn').click());
  await wait(400);
  checks.labelFlipped = await page.evaluate(() => document.querySelector('#unitsBtn')?.textContent?.trim());
  checks.metaFlipped = await page.evaluate(() => document.querySelector('.route-opt .opt-meta')?.textContent || '');
  checks.persisted = await page.evaluate(() => localStorage.getItem('gw-units'));

  console.log(JSON.stringify(checks, null, 1));
  console.log('page errors:', errs.slice(0, 4));

  // NOTE: 6efb209 made imperial (mi) the DEFAULT for US users, so seeding
  // gw-units='mi' means the INITIAL state is miles; clicking flips to km.
  const pass =
    checks.btnExists &&
    checks.labelInitial === 'mi' &&
    checks.routed &&
    checks.cardShown &&
    /mi/.test(checks.metaInitial) && !/0 min · 0 m/.test(checks.metaInitial) &&
    checks.labelFlipped === 'km' &&
    /km/.test(checks.metaFlipped) &&
    checks.persisted === 'km' &&
    errs.filter((e) => !/favicon/.test(e)).length === 0;

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log(pass ? '\nUNITS PASS ✅ — distance units toggle re-skins route card (km ↔ mi), persists' : '\nUNITS FAIL ❌');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
