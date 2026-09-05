// Fire #25 — PIXEL-sampling spot-check using lib samplePixel (per directive).
// Verifies the new samplePixel export produces the same rgb as inline PNG decode
// at the SAME coords on the SAME buffer. One viewport (390-light, primary mobile).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { contrast as libContrast, samplePixel as libSample } from './lib-contrast.mjs';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 120s'); process.exit(2); }, 120000).unref();

function relLumInline(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastInline(a, b) {
  const l1 = relLumInline(a), l2 = relLumInline(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function decodePixel(raw, dpr, x, y) {
  const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const png = PNG.sync.read(buffer);
  const px = Math.floor(x * dpr);
  const py = Math.floor(y * dpr);
  if (px < 0 || py < 0 || px >= png.width || py >= png.height) return null;
  const idx = (py * png.width + px) * 4;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2]];
}

async function main() {
  const pv = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
  });
  const vp = { width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 };
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(300);
  await page.evaluate(() => {
    const el = document.querySelector('#batteryHint');
    if (el) { el.hidden = false; el.style.cssText += ';display:block!important;z-index:9999;'; }
  });
  await wait(200);

  // Resolve #batteryHint center coords
  const coords = await page.evaluate(() => {
    const el = document.querySelector('#batteryHint');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!coords) { console.log('batteryHint not found'); await browser.close(); await pv.kill(); return; }

  // INLINE path: take our own screenshot, decode pixel
  const buffer = await page.screenshot({ type: 'png' });
  const inlRgb = decodePixel(buffer, vp.deviceScaleFactor, coords.x, coords.y);

  // LIB path: call samplePixel (takes its own screenshot internally)
  const libRgb = await libSample(page, vp, coords.x, coords.y);

  // Compute both ratios
  const inlRatio = contrastInline(inlRgb, [240, 244, 248]); // page bg light
  const libRatio = libContrast(libRgb, [240, 244, 248]);

  const rgbDelta = Math.max(Math.abs(inlRgb[0]-libRgb[0]), Math.abs(inlRgb[1]-libRgb[1]), Math.abs(inlRgb[2]-libRgb[2]));
  const ratioDelta = Math.abs(inlRatio - libRatio);

  console.log(`Pixel RGB — inline: rgb(${inlRgb.join(',')})  lib: rgb(${libRgb.join(',')})  maxChannelΔ=${rgbDelta}`);
  console.log(`Ratio    — inline: ${inlRatio.toFixed(4)}         lib: ${libRatio.toFixed(4)}         Δ=${ratioDelta.toFixed(5)}`);
  console.log(rgbDelta <= 2 && ratioDelta < 0.01 ? '✅ samplePixel matches inline decode' : '❌ MISMATCH');

  fs.writeFileSync('ux-shots/fire-25-pixel-sample-check.json', JSON.stringify({
    viewport: '390-light', coords, inlRgb, libRgb, rgbDelta, inlRatio, libRatio, ratioDelta,
    pass: rgbDelta <= 2 && ratioDelta < 0.01,
  }, null, 2));

  await browser.close();
  await pv.kill();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });