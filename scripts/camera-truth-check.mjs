// The badge counts what the map admits (Keaton field report 2026-09-27: "it
// claims camera data unavailable despite routing past a camera the map itself
// admits is there"). Regression: with Overpass DEAD (it rate-limits constantly),
// the camera pool must still fill from the DeFlock tiles (the map's own source)
// + the bundled snapshot — so the badge can never say "unavailable" while the
// map renders cameras along the route.
import { startPreview, crashGuard } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let b;
try {
  b = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  crashGuard(kill, () => [b]);
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  // Kill Overpass at the network layer — the pool must survive on tiles + snapshot.
  await p.setRequestInterception(true);
  p.on('request', (req) => {
    if (req.url().includes('overpass')) req.abort();
    else req.continue();
  });
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await p.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await p.reload({ waitUntil: 'networkidle2' });
  await p.waitForFunction(() => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'), { timeout: 15000 });

  // The pool the badge counts: must include tile cameras even with Overpass dead.
  const pool = await p.evaluate(async () => {
    const bbox = [-111.82, 40.32, -111.70, 40.44]; // Highland / Pleasant Grove
    const feats = await window.__gw.cameras.getCameras(bbox);
    return {
      total: feats.length,
      fromTiles: feats.filter((f) => f.properties?.source === 'deflock-tiles').length,
    };
  });

  // Route past cameras with Overpass dead → badge must never hedge.
  async function pick(inputSel, query) {
    await p.evaluate((sel) => { const el = document.querySelector(sel); if (el) el.value = ''; }, inputSel);
    await p.type(inputSel, query);
    try {
      await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 });
      await p.evaluate(() => document.querySelector('#suggestions .sugg:not(.sugg-recent)')?.click());
    } catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
    await new Promise((r) => setTimeout(r, 500));
  }
  await pick('#toInput', 'Costco Lehi');
  await pick('#fromInput', 'Pleasant Grove Utah');
  await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
  const badge = await p.evaluate(() => document.querySelector('.rc-badge')?.textContent?.trim() || '');
  const chipMeta = await p.evaluate(() => [...document.querySelectorAll('.mode-chip .chip-meta')].map((e) => e.textContent.trim()));

  const checks = {
    poolSurvivesOutage: pool.total >= 50,
    tilesFeedPool: pool.fromTiles >= 1,
    badgeNeverHedges: !/unavailable/i.test(badge),
    badgeCountsKnown: /Fully clear|Passes/.test(badge),
    chipsHonest: chipMeta.every((t) => !/n\/a/.test(t)),
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ pool, badge, chipMeta, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('CAMERA TRUTH PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (b) await b.close().catch(() => {});
  await kill();
}
