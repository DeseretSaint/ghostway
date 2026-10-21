// Q119 + Q121 share route: deep links (?from=&to=&mode= open routed) and the
// share sheet (link + QR). The QR is verified by DECODING it (jsqr round-trip
// must return exactly the shared link) — a rendered-but-wrong QR fails here.
import { startPreview } from './lib-preview.mjs';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import jsQR from 'jsqr';

// Chrome path: env override, else the first binary that exists on this box.
// The old hardcoded macOS path made this check unrunnable on Linux CI.
const CHROME = [
  process.env.GW_CHROME_PATH,
  '/usr/lib/chromium/chromium',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) {
  console.error('No Chrome/Chromium binary found; set GW_CHROME_PATH');
  process.exit(2);
}

// Cold start on a fresh profile downloads ~14 MB of map data and then builds
// the route network (17 s observed on this box). 150 s total was razor thin;
// the earlier 60 s wait for the start button failed on slow runs, not on a
// real regression.
const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 300000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 1. Deep link: PG → Costco Lehi, moderate mode — must open routed.
  await page.goto(`${url}?from=-111.759,40.364&to=-111.834,40.394&mode=moderate`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#startNavBtn', { visible: true, timeout: 120000 }); // engine planned the route
  const deep = await page.evaluate(() => ({
    from: document.getElementById('fromInput').value,
    to: document.getElementById('toInput').value,
    mode: document.querySelector('.mode-btn.active')?.dataset.mode || '',
    modeLabel: document.querySelector('.mode-btn.active')?.textContent || '',
    rcTime: document.querySelector('.rc-time')?.textContent || '',
  }));

  // 2. Share sheet: QR renders and round-trips to the exact link.
  await page.click('#menuBtn');
  // Menu opens with an animation; clicking the item before it is on screen
  // silently misses and the share sheet never mounts.
  await page.waitForSelector('[data-action="share"]', { visible: true, timeout: 10000 });
  await new Promise((r) => setTimeout(r, 400));
  await page.click('[data-action="share"]');
  await page.waitForSelector('#shareQr', { visible: true, timeout: 15000 });
  // The encoder is a lazy chunk: the canvas exists at its default 300x150 for a
  // few frames before renderShareQr sets width and draws. Waiting only on
  // width>0 read a blank canvas and failed the decode as a false regression.
  await page.waitForFunction(() => {
    const c = document.getElementById('shareQr');
    return c && c.width > 100 && c.width === c.height;
  }, { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 300));
  const sheet = await page.evaluate(() => {
    const c = document.getElementById('shareQr');
    const img = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    return {
      link: document.getElementById('shareUrl').value,
      w: c.width, h: c.height,
      data: Array.from(img.data),
      role: c.getAttribute('role'),
      hasCopy: !!document.getElementById('shareCopy'),
    };
  });
  const decoded = jsQR(new Uint8ClampedArray(sheet.data), sheet.w, sheet.h);

  // 3. Copy button writes the link to the clipboard.
  await page.evaluate(() => {
    window.__copied = null;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } },
      configurable: true,
    });
  });
  await page.click('#shareCopy');
  await new Promise(r => setTimeout(r, 300));
  const copied = await page.evaluate(() => ({
    copied: window.__copied,
    status: document.getElementById('status').textContent,
  }));

  // 4. Hostile/invalid params are ignored (no crash, no phantom endpoints).
  await page.goto(`${url}?from=banana&to=999,999&mode=<script>`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#topbar', { timeout: 15000 });
  const hostile = await page.evaluate(() => ({
    from: document.getElementById('fromInput').value,
    to: document.getElementById('toInput').value,
    errors: window.__hostileErrors || 0,
  }));

  const checks = {
    deepFrom: /Shared point \(40\.3640/.test(deep.from),
    deepTo: /Shared point \(40\.3940/.test(deep.to),
    deepMode: deep.mode === 'moderate',
    deepRouted: deep.rcTime.length > 0,
    qrRendered: sheet.w > 100 && sheet.role === 'img',
    qrRoundTrip: decoded !== null && decoded.data === sheet.link,
    linkHasState: (() => { const u = new URL(sheet.link); return u.searchParams.get('from') === '-111.759,40.364' && u.searchParams.get('to') === '-111.834,40.394' && u.searchParams.get('mode') === 'moderate'; })(),
    copyWorks: copied.copied === sheet.link && /copied/i.test(copied.status),
    hostileIgnored: hostile.from === '' && hostile.to === '',
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ deep, link: sheet.link, decoded: decoded?.data?.slice(0, 60), copied: copied.status, hostile, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('SHARE ROUTE PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
