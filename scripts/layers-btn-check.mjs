// Layers chip gate (Keaton field report 2026-10-21).
//
// The #layersBtn chip is a DISCLOSURE toggle for #layersSheet, so:
//   - aria-expanded and the visual pressed state (.on) must track the SHEET,
//     not the camera/Flock layer state (that state lives on the row checkboxes);
//   - the icon must stay visibly rendered in BOTH states. Its SVG strokes are
//     currentColor, and the old `#layersBtn.on { color: #3ad6c5 }` painted the
//     strokes the same teal as the accent fill, so the lit chip read as a
//     solid block.
//
// Asserts, at 320 / 390 / 430 px width:
//   1. initial: aria-expanded=false, no .on, sheet hidden, icon visible
//   2. click   -> aria-expanded=true, .on, sheet visible, icon visible
//   3. click   -> aria-expanded=false, no .on, sheet hidden, icon visible
//   4. toggling a LAYER row does not light the chip (semantics separated)
//   5. zero console/page errors
//
// Icon visibility is measured from real pixels: the chip is screenshotted, the
// icon box is scanned, and the stroke pixels must clear 3:1 contrast against
// the chip's own dominant background colour (WCAG 1.4.11, non-text UI).
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import { startPreview, crashGuard } from './lib-preview.mjs';
import { parseRgb, contrast } from './lib-contrast.mjs';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 300s timeout — force exit'); process.exit(2); }, 300000).unref();

const CANDIDATES = [
  process.env.GW_CHROME_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const CHROME = CANDIDATES.find((p) => fs.existsSync(p));
if (!CHROME) { console.error('no Chrome/Chromium found — set GW_CHROME_PATH'); process.exit(2); }
console.log('chrome:', CHROME);

const WIDTHS = [320, 390, 430];
const MIN_STROKE_CONTRAST = 3;   // WCAG 1.4.11 non-text UI
const MIN_INK_PIXELS = 8;        // a rendered glyph leaves far more than this

const pv = await startPreview();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
crashGuard(pv, () => [browser]);

const failures = [];
function check(width, name, ok, detail) {
  if (!ok) failures.push(`${width}px ${name}: ${detail}`);
  console.log(`  ${ok ? 'PASS' : 'FAIL'} | ${width}px | ${name}${ok ? '' : ' — ' + detail}`);
}

// Screenshot the chip, then report its dominant background colour and how many
// pixels inside the icon box actually contrast with it.
async function pixelReport(page) {
  const box = await page.evaluate(() => {
    const btn = document.querySelector('#layersBtn');
    const svg = btn.querySelector('svg');
    const r = btn.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    return {
      btn: { x: r.x, y: r.y, w: r.width, h: r.height },
      icon: { x: s.x, y: s.y, w: s.width, h: s.height },
    };
  });
  const clip = {
    x: Math.round(box.btn.x),
    y: Math.round(box.btn.y),
    width: Math.max(4, Math.round(box.btn.w)),
    height: Math.max(4, Math.round(box.btn.h)),
  };
  const png = PNG.sync.read(Buffer.from(await page.screenshot({ clip, type: 'png' })));
  const at = (x, y) => {
    const i = (y * png.width + x) * 4;
    return [png.data[i], png.data[i + 1], png.data[i + 2]];
  };
  // Dominant colour across the whole chip = its visible background.
  const counts = new Map();
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const key = at(x, y).join(',');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  let dominant = null;
  let best = -1;
  for (const [k, n] of counts) if (n > best) { best = n; dominant = k.split(',').map(Number); }

  const sx = png.width / clip.width;
  const sy = png.height / clip.height;
  const x0 = Math.max(0, Math.floor((box.icon.x - clip.x) * sx));
  const x1 = Math.min(png.width - 1, Math.ceil((box.icon.x - clip.x + box.icon.w) * sx));
  const y0 = Math.max(0, Math.floor((box.icon.y - clip.y) * sy));
  const y1 = Math.min(png.height - 1, Math.ceil((box.icon.y - clip.y + box.icon.h) * sy));

  let ink = 0;
  let maxRatio = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ratio = contrast(at(x, y), dominant);
      if (ratio >= MIN_STROKE_CONTRAST) ink++;
      if (ratio > maxRatio) maxRatio = ratio;
    }
  }
  return { dominant, ink, maxRatio: Number(maxRatio.toFixed(2)), iconPx: (x1 - x0 + 1) * (y1 - y0 + 1) };
}

async function readState(page) {
  return page.evaluate(() => {
    const btn = document.getElementById('layersBtn');
    const sheet = document.getElementById('layersSheet');
    const svg = btn.querySelector('svg');
    const probe = svg.querySelector('path') || svg;
    const stroke = getComputedStyle(probe).stroke;
    const r = sheet.getBoundingClientRect();
    return {
      expanded: btn.getAttribute('aria-expanded'),
      onClass: btn.classList.contains('on'),
      sheetHidden: sheet.hasAttribute('hidden'),
      sheetVisible: !sheet.hasAttribute('hidden') && r.width > 0 && r.height > 0 && getComputedStyle(sheet).display !== 'none',
      stroke: stroke && stroke !== 'none' ? stroke : getComputedStyle(svg).color,
      chipColor: getComputedStyle(btn).color,
      chipBg: getComputedStyle(btn).backgroundColor,
      camOn: !!(window.__gw && window.__gw._camLayerOn),
    };
  });
}

// Boot the app with explicit layer prefs. `pref.flock: '1'` reproduces Keaton's
// live state (the Flock layer is on by default), which is exactly where the old
// chip lit up at boot and the lit glyph vanished into the accent fill.
async function openPage(width, pref = {}) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!/favicon|\.png$|\.ico$/.test(u)) errors.push(`requestfailed ${u} ${r.failure()?.errorText || ''}`);
  });
  await page.evaluateOnNewDocument((p) => {
    try {
      localStorage.setItem('gw-onboarded', '1');
      localStorage.setItem('gw-cam-layer', p.cam ?? '0');
      localStorage.setItem('gw-flock-layer', p.flock ?? '0');
    } catch { /* private mode */ }
    const mock = {
      getCurrentPosition: (cb) => cb({ coords: { longitude: -111.759, latitude: 40.364, speed: 0 } }),
      watchPosition: () => 0,
      clearWatch: () => {},
    };
    Object.defineProperty(navigator, 'geolocation', { value: mock, configurable: true });
  }, pref);
  await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(pv.url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
  await page.waitForSelector('#layersBtn', { visible: true, timeout: 60000 });
  await wait(400);
  return { page, errors };
}

const cleanErrors = (errors) => errors.filter((e) => !/favicon|404|ERR_ABORTED|net::ERR_FAILED.*tile/i.test(e));

const results = [];
for (const width of WIDTHS) {
  const { page, errors } = await openPage(width, { cam: '0', flock: '0' });

  console.log(`\n=== ${width}x844 ===`);
  const s0 = await readState(page);
  const p0 = await pixelReport(page);
  check(width, 'initial aria-expanded=false', s0.expanded === 'false', `got ${s0.expanded}`);
  check(width, 'initial chip not .on', s0.onClass === false, 'has .on at boot');
  check(width, 'initial sheet hidden', s0.sheetHidden && !s0.sheetVisible, JSON.stringify(s0));
  check(width, 'initial icon visible', p0.ink >= MIN_INK_PIXELS, `ink px ${p0.ink} < ${MIN_INK_PIXELS} (${JSON.stringify(p0)})`);

  await page.click('#layersBtn');
  await wait(250);
  const s1 = await readState(page);
  const p1 = await pixelReport(page);
  const stroke1 = parseRgb(s1.stroke);
  check(width, 'click -> aria-expanded=true', s1.expanded === 'true', `got ${s1.expanded}`);
  check(width, 'click -> chip .on', s1.onClass === true, 'chip did not light while sheet open');
  check(width, 'click -> sheet visible', s1.sheetVisible && !s1.sheetHidden, JSON.stringify(s1));
  check(width, 'open icon visible (pixels)', p1.ink >= MIN_INK_PIXELS, `ink px ${p1.ink} < ${MIN_INK_PIXELS} (${JSON.stringify(p1)})`);
  const strokeRatio = stroke1 ? contrast(stroke1, p1.dominant) : 0;
  check(width, 'open icon stroke != fill', !!stroke1 && stroke1.join(',') !== p1.dominant.join(','),
    `${s1.stroke} vs bg ${p1.dominant.join(',')}`);
  check(width, `open icon stroke contrast >= ${MIN_STROKE_CONTRAST}:1`, strokeRatio >= MIN_STROKE_CONTRAST,
    `${strokeRatio.toFixed(2)}:1`);

  await page.click('#layersBtn');
  await wait(250);
  const s2 = await readState(page);
  const p2 = await pixelReport(page);
  check(width, 'click again -> aria-expanded=false', s2.expanded === 'false', `got ${s2.expanded}`);
  check(width, 'click again -> chip not .on', s2.onClass === false, 'chip stayed lit after close');
  check(width, 'click again -> sheet hidden', s2.sheetHidden && !s2.sheetVisible, JSON.stringify(s2));
  check(width, 'closed icon still visible', p2.ink >= MIN_INK_PIXELS, `ink px ${p2.ink} < ${MIN_INK_PIXELS} (${JSON.stringify(p2)})`);

  // Semantics separation: enabling a LAYER must not light the chip once the
  // sheet is closed. The layer's honest indicator is the row checkbox.
  await page.click('#layersBtn');
  await wait(200);
  await page.evaluate(() => document.getElementById('lyrCameras').click());
  await wait(400);
  const s3 = await readState(page);
  check(width, 'layer row toggles camera layer', s3.camOn === true, 'app._camLayerOn stayed false');
  await page.click('#layersBtn');
  await wait(250);
  const s4 = await readState(page);
  check(width, 'closed with layer ON -> chip not .on', s4.onClass === false && s4.expanded === 'false',
    JSON.stringify({ on: s4.onClass, expanded: s4.expanded, camOn: s4.camOn }));
  check(width, 'layer ON still reflected by row checkbox', s4.camOn === true, 'camera layer lost');
  // restore the layer pref so the run leaves no persisted state behind
  await page.click('#layersBtn');
  await wait(200);
  await page.evaluate(() => document.getElementById('lyrCameras').click());
  await wait(200);
  await page.click('#layersBtn');

  const clean = cleanErrors(errors);
  check(width, 'zero console errors', clean.length === 0, JSON.stringify(clean.slice(0, 4)));

  results.push({ width, s0, p0, s1, p1, s2, p2, s3, s4, errors: clean });
  await page.close();
}

// --- Keaton's live state: Flock layer ON at boot, sheet closed ---------------
// The old code lit the chip here (layer-state keyed) and, once the sheet opened,
// painted the glyph teal on teal. Both must be clean now.
{
  const width = 390;
  console.log(`\n=== ${width}x844 — Flock layer ON at boot ===`);
  const { page, errors } = await openPage(width, { cam: '0', flock: '1' });
  await page.waitForFunction('(window.__gwFlockCount || 0) > 0', { timeout: 60000 }).catch(() => {});
  const b0 = await readState(page);
  const bp0 = await pixelReport(page);
  check(width, 'flock-on boot: chip not lit while sheet closed', b0.onClass === false && b0.expanded === 'false',
    JSON.stringify({ on: b0.onClass, expanded: b0.expanded }));
  check(width, 'flock-on boot: icon visible', bp0.ink >= MIN_INK_PIXELS, `ink px ${bp0.ink}`);
  await page.click('#layersBtn');
  await wait(300);
  const b1 = await readState(page);
  const bp1 = await pixelReport(page);
  const bStroke = parseRgb(b1.stroke);
  const bRatio = bStroke ? contrast(bStroke, bp1.dominant) : 0;
  check(width, 'flock-on open: chip lit', b1.onClass === true && b1.expanded === 'true', JSON.stringify(b1));
  check(width, 'flock-on open: icon not a solid block', bRatio >= MIN_STROKE_CONTRAST && bp1.ink >= MIN_INK_PIXELS,
    `stroke ${b1.stroke} vs bg ${bp1.dominant.join(',')} = ${bRatio.toFixed(2)}:1, ink px ${bp1.ink}`);
  await page.click('#layersBtn');
  await wait(250);
  const b2 = await readState(page);
  check(width, 'flock-on close: chip unlit + sheet hidden', b2.onClass === false && b2.sheetHidden === true,
    JSON.stringify({ on: b2.onClass, hidden: b2.sheetHidden }));
  const cleanB = cleanErrors(errors);
  check(width, 'flock-on: zero console errors', cleanB.length === 0, JSON.stringify(cleanB.slice(0, 4)));
  results.push({ width, scenario: 'flock-on-boot', b0, bp0, b1, bp1, b2, errors: cleanB });
  await page.close();
}

console.log('\n--- raw ---');
console.log(JSON.stringify(results, null, 1));
await Promise.race([browser.close(), wait(5000)]);
pv.kill();

if (failures.length) {
  console.error(`\nLAYERS-BTN FAIL ❌ — ${failures.length} assertion(s)`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log('\nLAYERS-BTN PASS ✅ — toggle reverses, icon visible in both states, 320/390/430 clean');
process.exit(0);
