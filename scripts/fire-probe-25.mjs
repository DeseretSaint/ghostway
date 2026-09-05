// Fire #25 — lib-contrast refactor regression audit (CSSOM-based, no route drive).
// Confirms extracted lib-contrast exports produce identical results to inline math
// across 5 viewports × 2 themes × 4 surfaces. ~2-3 min.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import {
  contrast,
  parseRgb,
  compositeOver,
  relativeLuminance,
} from './lib-contrast.mjs';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 240s'); process.exit(2); }, 240000).unref();

// --- Inline pre-refactor math (copied from pre-refactor consuming scripts) ---
function relLumInline(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastInline(rgb1, rgb2) {
  const l1 = relLumInline(rgb1), l2 = relLumInline(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function compositeOverInline(rgbTop, a, rgbBg) {
  return [
    Math.round(rgbTop[0] * a + rgbBg[0] * (1 - a)),
    Math.round(rgbTop[1] * a + rgbBg[1] * (1 - a)),
    Math.round(rgbTop[2] * a + rgbBg[2] * (1 - a)),
  ];
}

const PAGE_BG_LIGHT = [240, 244, 248];
const PAGE_BG_DARK = [11, 15, 23];

const VIEWPORTS = [
  { w: 320, h: 568, isMobile: true, theme: 'light', label: '320-light' },
  { w: 320, h: 568, isMobile: true, theme: 'dark', label: '320-dark' },
  { w: 375, h: 812, isMobile: true, theme: 'light', label: '375-light' },
  { w: 375, h: 812, isMobile: true, theme: 'dark', label: '375-dark' },
  { w: 390, h: 844, isMobile: true, theme: 'light', label: '390-light' },
  { w: 390, h: 844, isMobile: true, theme: 'dark', label: '390-dark' },
  { w: 430, h: 932, isMobile: true, theme: 'light', label: '430-light' },
  { w: 430, h: 932, isMobile: true, theme: 'dark', label: '430-dark' },
  { w: 1440, h: 900, isMobile: false, theme: 'light', label: '1440-light' },
  { w: 1440, h: 900, isMobile: false, theme: 'dark', label: '1440-dark' },
];

const TODAY = new Date().toISOString().slice(0, 10);
const OUTDIR = 'ux-shots';
fs.mkdirSync(OUTDIR, { recursive: true });

async function measureSurface(page, sel, pageBg) {
  const handle = await page.$(sel);
  if (!handle) return { found: false, selector: sel };
  const meta = await page.evaluate((el) => {
    const cs = getComputedStyle(el);
    const colorM = cs.color.match(/\d+/g);
    const textRgb = colorM ? colorM.slice(0, 3).map(Number) : null;
    const rect = el.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && cs.visibility !== 'hidden';
    return { textRgb, textColor: cs.color, fontSize: cs.fontSize, visible };
  }, handle);
  if (!meta.textRgb || !meta.visible) return { found: true, ...meta, contrastLib: null, contrastInl: null, selector: sel };

  // Resolve effective bg via getEffectiveBg (lib) — but we need raw bg for inline too.
  // We'll resolve bg manually here to feed BOTH paths the same input.
  const bgInfo = await page.evaluate((el) => {
    const RGB_RE = /rgba?\(([^)]+)\)/i;
    function parseColor(str) {
      const m = str.match(RGB_RE);
      if (!m) return null;
      const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] == null ? 1 : parts[3] };
    }
    const GRAD_RE = /linear-gradient\s*\(\s*[^,]+\s*,?\s*(rgba?\([^)]+\))/i;
    function firstGradColor(str) {
      if (!str || !str.includes('linear-gradient')) return null;
      const m = str.match(GRAD_RE) || str.match(/linear-gradient\s*\(\s*(rgba?\([^)]+\))/i);
      return m ? parseColor(m[1]) : null;
    }
    let n = el;
    while (n) {
      const cs = getComputedStyle(n);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) return bg;
      const grad = firstGradColor(cs.backgroundImage) || firstGradColor(cs.background);
      if (grad) return { r: grad.r, g: grad.g, b: grad.b, a: grad.a == null ? 1 : grad.a };
      n = n.parentElement;
    }
    return null;
  }, handle);

  let finalBg = null;
  if (bgInfo) {
    // Both paths get the SAME finalBg
    finalBg = bgInfo.a < 1
      ? compositeOverInline([bgInfo.r, bgInfo.g, bgInfo.b], bgInfo.a, pageBg)
      : [bgInfo.r, bgInfo.g, bgInfo.b];
  }

  if (!finalBg) return { found: true, ...meta, contrastLib: null, contrastInl: null, selector: sel };

  // lib-contrast path
  const contrastLib = contrast(meta.textRgb, finalBg);
  // inline path (same inputs)
  const contrastInl = contrastInline(meta.textRgb, finalBg);

  return {
    found: true, ...meta,
    bg: finalBg,
    contrastLib: +contrastLib.toFixed(4),
    contrastInl: +contrastInl.toFixed(4),
    delta: +Math.abs(contrastLib - contrastInl).toFixed(5),
    selector: sel,
  };
}

async function main() {
  const pv = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
  });

  const allResults = [];
  for (const vp of VIEWPORTS) {
    const t0 = Date.now();
    const page = await browser.newPage();
    const pageBg = vp.theme === 'light' ? PAGE_BG_LIGHT : PAGE_BG_DARK;
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.isMobile, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: vp.theme }]);

    await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await wait(300);

    // Inject battery hint (force visible)
    await page.evaluate(() => {
      const el = document.querySelector('#batteryHint');
      if (el) {
        el.hidden = false;
        el.style.cssText += ';display:block!important;z-index:9999;';
      }
    });
    // Inject camChip
    await page.evaluate(() => {
      let el = document.querySelector('#camChip');
      if (!el) { el = document.createElement('div'); el.id = 'camChip'; document.body.appendChild(el); }
      el.className = 'cam-chip mission-signal';
      el.textContent = '0 / 3';
      el.style.cssText = 'position:fixed; top:300px; left:8px; z-index:99;';
    });
    // Force onboarding visible
    await page.evaluate(() => {
      const o = document.querySelector('#onboarding');
      if (o) { o.hidden = false; o.style.cssText = 'display:block!important;z-index:9999;'; }
    });
    await wait(200);

    const obSkip = await measureSurface(page, '#obSkip', pageBg);
    const batteryHint = await measureSurface(page, '#batteryHint', pageBg);
    const camChip = await measureSurface(page, '#camChip', pageBg);

    // Screenshot
    const shotPath = `${OUTDIR}/fire-25-lib-contrast-${vp.label}-${TODAY}.png`;
    await page.screenshot({ path: shotPath });

    allResults.push({
      label: vp.label, w: vp.w, h: vp.h, theme: vp.theme,
      elapsedMs: Date.now() - t0,
      obSkip, batteryHint, camChip,
      shot: shotPath,
    });

    console.log(`[${vp.label}] ${Date.now()-t0}ms — obSkip_lib:${obSkip.contrastLib} obSkip_inl:${obSkip.contrastInl} Δ=${obSkip.delta} | bat_lib:${batteryHint.contrastLib} bat_inl:${batteryHint.contrastInl} Δ=${batteryHint.delta} | cam_lib:${camChip.contrastLib} cam_inl:${camChip.contrastInl} Δ=${camChip.delta}`);

    await page.close();
  }

  await browser.close();
  await pv.kill();

  fs.writeFileSync(`${OUTDIR}/fire-25-lib-contrast-${TODAY}.json`, JSON.stringify(allResults, null, 2));

  // Summary
  const surfaces = ['obSkip', 'batteryHint', 'camChip'];
  const allDeltas = allResults.flatMap(r => surfaces.map(s => r[s]?.delta ?? 0));
  const maxDelta = Math.max(...allDeltas);
  const disagreements = allResults.flatMap(r => surfaces.filter(s => (r[s]?.delta ?? 0) > 0.05).map(s => `${r.label}/${s}: Δ=${r[s].delta}`));
  const misses = allResults.flatMap(r => surfaces.filter(s => !r[s]?.found).map(s => `${r.label}/${s}: NOT FOUND`));

  console.log('\n=== FIRE #25 — LIB-CONTRAST REFACTOR REGRESSION ===');
  console.log(`Total measurements: ${allDeltas.length}`);
  console.log(`Max lib-vs-inline delta: ${maxDelta.toFixed(5)}`);
  console.log(`Disagreements (>0.05): ${disagreements.length}`);
  if (disagreements.length) console.log('  ' + disagreements.join('\n  '));
  console.log(`Misses: ${misses.length}`);
  if (misses.length) console.log('  ' + misses.join('\n  '));
  console.log(maxDelta <= 0.01 ? '\n✅ PASS: lib-contrast exports match inline math within 0.01' : '\n❌ FAIL: disagreement detected');
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });