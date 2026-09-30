// The cohesive "every camera" layer: the complete LOCAL corpus (every DeFlock
// point + every Flock research device) renders by default — road plate readers
// in ALPR red, indoor/facility/planned devices as neutral-blue dots — and the
// same corpus feeds the routing counter, so the badge can never be blinder
// than the map. Toggles are pure visibility (nothing is gated to download).
import { startPreview, crashGuard } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  crashGuard(kill, () => [browser]);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'), { timeout: 15000 });

  // 1. ON by default: the full corpus renders at boot (nothing gated).
  await page.waitForFunction(() => (window.__gwFlockCount || 0) >= 330000, { timeout: 60000 });
  const loaded = await page.evaluate(() => {
    const m = window.__gwMap;
    const src = m.getSource('flock-devices');
    const feats = src && src._data ? src._data.features : [];
    let road = 0;
    for (const f of feats) if (f.properties.road === 1) road++;
    return {
      count: window.__gwFlockCount,
      roadCount: road,
      otherCount: feats.length - road,
      roadLayer: !!m.getLayer('flock-road-pts'),
      otherLayer: !!m.getLayer('flock-other-pts'),
      roadVisible: m.getLayer('flock-road-pts') && m.getLayoutProperty('flock-road-pts', 'visibility'),
      checked: document.getElementById('lyrFlock').checked ? 'true' : 'false',
    };
  });

  // 2. Toggle off → layers hidden; toggle back on persists across reload.
  await page.click('#layersBtn');
  await page.evaluate(() => document.getElementById('lyrFlock').click());
  await new Promise(r => setTimeout(r, 300));
  const afterOff = await page.evaluate(() => ({
    checked: document.getElementById('lyrFlock').checked ? 'true' : 'false',
    hidden: window.__gwMap.getLayoutProperty('flock-road-pts', 'visibility') === 'none',
  }));
  await page.evaluate(() => document.getElementById('lyrFlock').click()); // back on → persisted
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => (window.__gwFlockCount || 0) >= 330000, { timeout: 60000 });
  const persisted = await page.evaluate(() => ({
    checked: document.getElementById('lyrFlock').checked ? 'true' : 'false',
    count: window.__gwFlockCount,
  }));

  const checks = {
    onByDefault: loaded.checked === 'true',
    fullDatasetLoads: loaded.count >= 330000,
    // Corrected classification (2026-09-30): device class + placement govern,
    // not the junk status field — ~350k rows are road-placed plate readers;
    // the blue class is now only genuine facility/indoor devices (~9k).
    roadSplitSane: loaded.roadCount >= 300000 && loaded.otherCount >= 5000 && loaded.otherCount <= 20000,
    bothLayers: loaded.roadLayer && loaded.otherLayer,
    visibleWhenOn: loaded.roadVisible !== 'none',
    toggleHides: afterOff.checked === 'false' && afterOff.hidden,
    persistsAcrossReload: persisted.checked === 'true' && persisted.count >= 330000,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ loaded, afterOff, persisted, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('FLOCK LAYER PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
