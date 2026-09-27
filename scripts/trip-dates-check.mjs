// Q42 trip date-range: APG range calendar (44px cells, roving tabindex,
// keyboard nav) + WZDx activity-window filter on the route card badge. The
// badge count is cross-checked against an independent Node computation from
// the shipped snapshot (same bbox + window), so the whole date pipeline is
// verified end to end.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // Deep-link boot on the PG → Costco corridor (also exercises Q119).
  await page.goto(`${url}?from=-111.759,40.364&to=-111.834,40.394`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#startNavBtn', { visible: true, timeout: 60000 });

  // 1. Trip dates sheet: calendar renders with APG semantics + 44px cells.
  await page.click('#tripDatesBtn');
  await page.waitForSelector('.cal-grid', { visible: true, timeout: 5000 });
  const cal = await page.evaluate(() => {
    const day = document.querySelector('.cal-day');
    const r = day.getBoundingClientRect();
    return {
      gridRole: document.querySelector('.cal-grid').getAttribute('role'),
      cellRole: document.querySelector('.cal-cell').getAttribute('role'),
      cellW: r.width, cellH: r.height,
      tabbables: [...document.querySelectorAll('.cal-day')].filter(b => b.tabIndex === 0).length,
      ariaSelected: document.querySelector('.cal-cell').getAttribute('aria-selected'),
    };
  });

  // 2. Keyboard range selection: 3 × ArrowRight → Enter (start),
  //    5 × ArrowRight → Enter (end).
  await page.evaluate(() => document.querySelector('.cal-day[tabindex="0"]').focus());
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const midSummary = await page.evaluate(() => document.getElementById('tripSummary').textContent);
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const range = await page.evaluate(() => {
    const m = document.getElementById('tripSummary').textContent.match(/(\d{4}-\d{2}-\d{2}) → (\d{4}-\d{2}-\d{2})/);
    return m ? { start: m[1], end: m[2] } : null;
  });

  // 3. Save → ISO storage + badge on the route card.
  await page.click('#tripSave');
  await page.waitForFunction(() => {
    const b = document.getElementById('tripBadge');
    return b && !b.hidden && b.textContent.length > 0;
  }, { timeout: 15000 });
  const saved = await page.evaluate(() => ({
    stored: JSON.parse(localStorage.getItem('gw-trip-dates') || 'null'),
    badge: document.getElementById('tripBadge').textContent,
  }));

  // 4. Independent Node cross-check of the badge count from the snapshot.
  const data = JSON.parse(gunzipSync(fs.readFileSync('public/data/wzdx-national.json.gz')));
  const [w, s, e, n] = [-111.759 - 0.05, 40.364 - 0.05, -111.834 + 0.05, 40.394 + 0.05];
  const t0 = Date.parse(range.start) / 1000, t1 = Date.parse(range.end) / 1000;
  let expected = 0;
  for (const arr of Object.values(data.states)) {
    for (const z of arr) {
      const zs = typeof z.s === 'number' ? z.s : -Infinity;
      const ze = typeof z.e === 'number' ? z.e : Infinity;
      if (ze < t0 || zs > t1) continue;
      if (z.c.some((c) => c[0] >= w && c[0] <= e && c[1] >= s && c[1] <= n)) expected++;
    }
  }
  const badgeCount = parseInt((saved.badge.match(/^(\d+) work zone/) || [])[1] ?? '-1', 10);
  const badgeSaysZero = /^No work zones scheduled/.test(saved.badge);

  // 5. Reopen: saved range is selected; Clear empties storage + badge.
  await page.click('#tripDatesBtn');
  await page.waitForSelector('.cal-grid', { visible: true, timeout: 5000 });
  const selectedCells = await page.evaluate(() => document.querySelectorAll('.cal-cell[aria-selected="true"]').length);
  await page.click('#tripClear');
  await new Promise(r => setTimeout(r, 500));
  const cleared = await page.evaluate(() => ({
    stored: localStorage.getItem('gw-trip-dates'),
    badgeHidden: document.getElementById('tripBadge').hidden,
  }));

  const checks = {
    apgGrid: cal.gridRole === 'grid' && cal.cellRole === 'gridcell',
    cells44: cal.cellW >= 43.5 && cal.cellH >= 43.5,
    rovingTabindex: cal.tabbables === 1,
    keyboardStart: /Start: \d{4}-\d{2}-\d{2}/.test(midSummary),
    keyboardRange: !!range,
    isoStored: saved.stored && saved.stored.start === range.start && saved.stored.end === range.end,
    badgeShown: saved.badge.length > 0,
    badgeCountTruth: badgeSaysZero ? expected === 0 : badgeCount === expected,
    savedSelectedOnReopen: selectedCells >= 1,
    clearWorks: cleared.stored === null && cleared.badgeHidden,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ cal, midSummary, range, badge: saved.badge, expected, selectedCells, cleared, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('TRIP DATES PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
