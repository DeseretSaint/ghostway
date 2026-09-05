// Fire #23 — INDEPENDENT multi-viewport contrast probe via getComputedStyle.
// Single browser, multiple pages (avoids repeated Chrome launch overhead).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { contrast } from './lib-contrast.mjs';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s'); process.exit(2); }, 180000).unref();

const PAGE_BG_LIGHT = [240, 244, 248];
const PAGE_BG_DARK  = [11, 15, 23];

function compositeOver(rgbTop, a, rgbBg) {
  return [
    Math.round(rgbTop[0] * a + rgbBg[0] * (1 - a)),
    Math.round(rgbTop[1] * a + rgbBg[1] * (1 - a)),
    Math.round(rgbTop[2] * a + rgbBg[2] * (1 - a)),
  ];
}

async function getEffectiveBg(page, handle) {
  return await page.evaluate((el) => {
    const RGB_RE = /rgba?\(([^)]+)\)/i;
    function parseColor(str) {
      const m = str.match(RGB_RE);
      if (!m) return null;
      const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] == null ? 1 : parts[3] };
    }
    const GRAD_RE = /linear-gradient\s*\(\s*[^,]+\s*,\s*rgba?\([^)]+\)/i;
    function firstGradColor(str) {
      if (!str || !str.includes('linear-gradient')) return null;
      // Extract the first color stop after the angle/direction.
      const m = str.match(/linear-gradient\s*\([^,]*,\s*(rgba?\([^)]+\))/i) ||
                str.match(/linear-gradient\s*\(\s*(rgba?\([^)]+\))/i);
      return m ? parseColor(m[1]) : null;
    }
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) return bg;
      // Gradient backgrounds are fully opaque — use first stop as proxy.
      const grad = firstGradColor(cs.backgroundImage) || firstGradColor(cs.background);
      if (grad) return { r: grad.r, g: grad.g, b: grad.b, a: grad.a == null ? 1 : grad.a };
      n = n.parentElement;
    }
    return null;
  }, handle);
}

async function measureSelector(page, sel, pageBg) {
  const handle = await page.$(sel);
  if (!handle) return { found: false };
  const meta = await page.evaluate((el) => {
    const cs = getComputedStyle(el);
    const colorM = cs.color.match(/\d+/g);
    const textRgb = colorM ? colorM.slice(0, 3).map(Number) : null;
    const rect = el.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden';
    return { textRgb, textColor: cs.color, fontSize: cs.fontSize, visible };
  }, handle);
  if (!meta.textRgb || !meta.visible) return { found: true, ...meta, contrast: null, bg: null };
  const bg = await getEffectiveBg(page, handle);
  let finalBg = null;
  if (bg) {
    finalBg = bg.a < 1 ? compositeOver([bg.r, bg.g, bg.b], bg.a, pageBg) : [bg.r, bg.g, bg.b];
  }
  return { found: true, ...meta, contrast: finalBg ? contrast(meta.textRgb, finalBg) : null, bg: finalBg };
}

const TODAY = new Date().toISOString().slice(0, 10);
const OUTDIR = 'ux-shots';
fs.mkdirSync(OUTDIR, { recursive: true });

const pv = await startPreview();
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
});

const RUNS = [
  { w: 320,  h: 568,  isMobile: true,  theme: 'light', label: '320-light' },
  { w: 320,  h: 568,  isMobile: true,  theme: 'dark',  label: '320-dark' },
  { w: 375,  h: 812,  isMobile: true,  theme: 'light', label: '375-light' },
  { w: 1440, h: 900,  isMobile: false, theme: 'light', label: '1440-light' },
  { w: 1440, h: 900,  isMobile: false, theme: 'dark',  label: '1440-dark' },
];

const allResults = [];
for (const run of RUNS) {
  const t0 = Date.now();
  const page = await browser.newPage();
  const pageBg = run.theme === 'light' ? PAGE_BG_LIGHT : PAGE_BG_DARK;
  await page.setViewport({ width: run.w, height: run.h, isMobile: run.isMobile, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: run.theme }]);
  let pageErrs = 0;
  page.on('pageerror', () => pageErrs++);

  await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(300);

  // Inject battery hint.
  await page.evaluate(() => {
    const el = document.querySelector('#batteryHint');
    if (el) {
      el.hidden = false;
      el.innerHTML = 'Battery low — 12% remaining' +
        '<button id="batteryDismiss" class="battery-dismiss" aria-label="Dismiss">×</button>';
    }
  });

  // Inject camChip.
  await page.evaluate(() => {
    let el = document.querySelector('#camChip');
    if (!el) { el = document.createElement('div'); el.id = 'camChip'; document.body.appendChild(el); }
    el.className = 'cam-chip mission-signal';
    el.textContent = '0 / 3';
    el.style.cssText = 'position:fixed; top:300px; left:8px; z-index:99;';
  });

  await wait(200);

  const obSkip = await measureSelector(page, '#obSkip', pageBg);
  const batHint = await measureSelector(page, '#batteryHint', pageBg);
  const camChip = await measureSelector(page, '#camChip', pageBg);

  const shots = {};
  // Force onboarding visible for its shot.
  await page.evaluate(() => { const o = document.querySelector('#onboarding'); if (o) { o.hidden = false; o.style.cssText = 'display:block!important;z-index:9999;'; } });
  shots.obSkip = path.join(OUTDIR, `fire-obskip-${run.label}-${TODAY}.png`);
  await page.screenshot({ path: shots.obSkip });

  await page.evaluate(() => { const o = document.querySelector('#onboarding'); if (o) o.hidden = true; });
  await wait(50);
  await page.evaluate(() => { const e = document.querySelector('#batteryHint'); if (e) { e.hidden = false; e.style.cssText += ';display:block!important;z-index:9999;top:80px;left:8px;right:8px;'; } });
  shots.batteryHint = path.join(OUTDIR, `fire-battery-hint-${run.label}-${TODAY}.png`);
  await page.screenshot({ path: shots.batteryHint });

  shots.camChip = path.join(OUTDIR, `fire-camchip-${run.label}-${TODAY}.png`);
  await page.screenshot({ path: shots.camChip });

  allResults.push({ label: run.label, w: run.w, h: run.h, theme: run.theme, elapsedMs: Date.now() - t0, pageErrors: pageErrs, obSkip, batteryHint: batHint, camChip, shots });

  console.log(`[${run.label}] ${Date.now()-t0}ms — obSkip:${obSkip.contrast?.toFixed(2)} bat:${batHint.contrast?.toFixed(2)} cam:${camChip.contrast?.toFixed(2)} errs:${pageErrs}`);

  await page.close();
}

function verdict(r) {
  if (r == null) return 'INCONCLUSIVE';
  if (r >= 7) return 'AAA';
  if (r >= 4.5) return 'AA';
  return 'FAIL';
}

console.log('\n=== FIRE #23 — INDEPENDENT MULTI-VIEWPORT CONTRAST ===\n');
for (const r of allResults) {
  console.log(`\n--- ${r.label} (${r.w}x${r.h}, ${r.theme}) — ${r.elapsedMs}ms ---`);
  for (const key of ['obSkip', 'batteryHint', 'camChip']) {
    const m = r[key];
    if (!m?.found) { console.log(`  ${key.padEnd(12)} NOT FOUND`); continue; }
    if (!m.visible) { console.log(`  ${key.padEnd(12)} NOT VISIBLE`); continue; }
    const ratio = m.contrast?.toFixed(2) ?? 'N/A';
    const v = verdict(m.contrast);
    const bgStr = m.bg ? `bg=rgb(${m.bg.join(',')})` : 'bg=?';
    console.log(`  ${key.padEnd(12)} text=rgb(${m.textRgb.join(',')})  ${bgStr}  ratio=${ratio}  → ${v}`);
  }
}

fs.writeFileSync(path.join(OUTDIR, `fire-multi-viewport-contrast-${TODAY}.json`), JSON.stringify(allResults, null, 2));
console.log('\nDONE');
await browser.close();
await pv.kill();
process.exit(0);
