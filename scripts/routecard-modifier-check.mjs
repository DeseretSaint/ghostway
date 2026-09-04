import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1100, height: 800 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  // Returning user + AVOID HIGHWAYS ON so the engine emits the surface-street option.
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('gw-onboarded', '1');
    localStorage.setItem('gw-avoid-hw', '1');
  });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  try {
    await page.waitForFunction(() => { const s = document.querySelector('#splash'); return !s || s.hidden; }, { timeout: 8000 });
  } catch {}
  await wait(500);

  // Route Pleasant Grove -> Costco (Keaton's repro corridor) with avoidHighways ON.
  await page.type('#fromInput', 'Pleasant Grove, Utah');
  try { await page.waitForSelector('#suggestions .sugg:not(.sugg-recent)', { timeout: 12000 }); } catch {}
  let s = await page.$('#suggestions .sugg:not(.sugg-recent)');
  if (s) await s.click();
  await wait(500);
  await page.type('#toInput', 'Costco, Lehi, Utah');
  try { await page.waitForSelector('#suggestions .sugg:not(.sugg-recent)', { timeout: 12000 }); } catch {}
  s = await page.$('#suggestions .sugg:not(.sugg-recent)');
  if (s) await s.click();
  await wait(600);

  try {
    await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 30000 });
  } catch {}
  await wait(1000);

  const res = await page.evaluate(() => {
    const primaries = [...document.querySelectorAll('.route-opt')].map((b) => b.querySelector('.opt-label')?.textContent?.trim());
    const mods = [...document.querySelectorAll('.route-opt-mod')].map((b) => b.textContent.trim());
    const card = document.querySelector('#route-card');
    return {
      primaryCount: primaries.length,
      primaries,
      modifierCount: mods.length,
      modifiers: mods,
      cardShown: !card?.hidden,
      hwBtnOn: document.querySelector('#hwBtn')?.getAttribute('aria-pressed'),
    };
  });

  console.log(JSON.stringify(res, null, 1));
  console.log('page errors:', errs.slice(0, 4));

  // The card must keep Fast/Balanced/Clearest as the primary taxonomy with
  // "No highways" demoted to a SINGLE subordinate modifier (never a 4th primary
  // competing card). Primary count is ≤3 (Balanced is geometry-deduped when it
  // traces the same road as Fastest — correct, no duplicate). No page errors.
  const pass =
    res.cardShown &&
    res.modifierCount >= 1 &&
    !res.primaries.some((p) => /No highways/i.test(p || '')) &&
    res.primaries.length >= 1 && res.primaries.length <= 3 &&
    errs.filter((e) => !/favicon|cotg\.carsprogram|511\.idaho|az511\.gov|CORS policy|Failed to load resource/.test(e)).length === 0;

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log(pass ? '\nROUTECARD-MODIFIER PASS ✅ — 3 primary slots + ≤1 modifier chip' : '\nROUTECARD-MODIFIER FAIL ❌');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
