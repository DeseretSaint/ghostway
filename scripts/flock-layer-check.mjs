// The cohesive "every camera" Flock layer: the full 335k-device research
// dataset renders on the map behind the "Flock" chip — road plate readers in
// ALPR red, everything else (indoor/facility/planned) as neutral-blue dots —
// while only road-relevant devices may influence routing.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'), { timeout: 15000 });

  // 1. Layers sheet: Flock off by default (opt-in dataset), then enable → full data loads.
  await page.click('#layersBtn');
  const before = await page.evaluate(() => ({
    pressed: document.getElementById('lyrFlock').checked ? 'true' : 'false',
  }));
  await page.evaluate(() => document.getElementById('lyrFlock').click());
  await page.waitForFunction(() => (window.__gwFlockCount || 0) >= 330000, { timeout: 45000 });
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
      pressed: document.getElementById('lyrFlock').checked ? 'true' : 'false',
    };
  });

  // 2. Toggle off → layers hidden; toggle back on persists across reload.
  await page.evaluate(() => document.getElementById('lyrFlock').click());
  await new Promise(r => setTimeout(r, 300));
  const afterOff = await page.evaluate(() => ({
    pressed: document.getElementById('lyrFlock').checked ? 'true' : 'false',
    hidden: window.__gwMap.getLayoutProperty('flock-road-pts', 'visibility') === 'none',
  }));
  await page.evaluate(() => document.getElementById('lyrFlock').click()); // back on → persisted
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => (window.__gwFlockCount || 0) >= 330000, { timeout: 45000 });
  const persisted = await page.evaluate(() => ({
    pressed: document.getElementById('lyrFlock').checked ? 'true' : 'false',
    count: window.__gwFlockCount,
  }));

  const checks = {
    offByDefault: before.pressed === 'false',
    fullDatasetLoads: loaded.count >= 330000,
    roadSplitSane: loaded.roadCount >= 120000 && loaded.roadCount <= 130000 && loaded.otherCount >= 200000,
    bothLayers: loaded.roadLayer && loaded.otherLayer,
    visibleWhenOn: loaded.roadVisible !== 'none',
    chipOn: loaded.pressed === 'true',
    toggleHides: afterOff.pressed === 'false' && afterOff.hidden,
    persistsAcrossReload: persisted.pressed === 'true' && persisted.count >= 330000,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ before, loaded, afterOff, persisted, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('FLOCK LAYER PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
