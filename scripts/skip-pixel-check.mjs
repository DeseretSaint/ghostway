// Pixel contrast sampler for skip link using actual screenshot pixels.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import { writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 60s'); process.exit(2); }, 60000).unref();

function relLum(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(rgb1, rgb2) {
  const l1 = relLum(rgb1), l2 = relLum(rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseRgb(s) {
  return (s.match(/\d+/g) || []).map(Number);
}

async function sampleScreenshotPixel(path, x, y) {
  // Use Python PIL via subprocess (not available). Fallback: use canvas module.
  // Actually, just use Chrome's CDP Page.captureScreenshot with clip, then parse PNG.
  // Simpler: take screenshot of just the skip link area and use getImageData.
  return null;
}

async function run() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  const results = {};

  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => {
      const w = document.querySelector('#onboarding');
      return w && !w.hidden;
    }, { timeout: 10000 });
    await wait(400);

    const skipRect = await page.evaluate(() => {
      const r = document.querySelector('#obSkip').getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });

    // Screenshot just the skip link area (with context for gradient).
    const ctxRect = {
      x: Math.max(0, skipRect.x - 20),
      y: Math.max(0, skipRect.y - 20),
      width: skipRect.w + 40,
      height: skipRect.h + 40,
    };
    const buf = await page.screenshot({ encoding: 'binary', clip: ctxRect });

    // Parse PNG pixel data using zlib + manual PNG parse (PNG with alpha).
    // Filter type 2 (truecolor), 8-bit depth, non-interlaced.
    const raw = Buffer.from(buf);
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    let pos = 8;
    let width = 0, height = 0, bitDepth = 0, colorType = 0;
    const idat = [];

    while (pos < raw.length) {
      const len = raw.readUInt32BE(pos); pos += 4;
      const type = raw.toString('ascii', pos, pos + 4); pos += 4;
      const data = raw.subarray(pos, pos + len); pos += len;
      pos += 4; // CRC

      if (type === 'IHDR') {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        bitDepth = data[8];
        colorType = data[9];
      } else if (type === 'IDAT') {
        idat.push(data);
      } else if (type === 'IEND') {
        break;
      }
    }

    const { inflateSync } = await import('zlib');
    const decompressed = inflateSync(Buffer.concat(idat));

    // For colorType 6 (truecolor with alpha), each pixel is 4 bytes.
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 4;
    const stride = width * channels;

    // Unfilter: PNG uses per-row filters.
    const unfiltered = Buffer.alloc(height * stride);
    for (let y = 0; y < height; y++) {
      const filter = decompressed[y * (stride + 1)];
      const srcRow = decompressed.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
      const dstRow = unfiltered.subarray(y * stride, y * stride + stride);

      for (let x = 0; x < stride; x++) {
        const raw = srcRow[x];
        const a = x >= channels ? dstRow[x - channels] : 0;
        const b = y > 0 ? unfiltered[(y - 1) * stride + x] : 0;
        const c = (y > 0 && x >= channels) ? unfiltered[(y - 1) * stride + x - channels] : 0;

        let val;
        switch (filter) {
          case 0: val = raw; break;
          case 1: val = raw + a; break;
          case 2: val = raw + b; break;
          case 3: val = raw + ((a + b) >> 1); break;
          case 4: {
            const p = a + b - c;
            const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
            const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
            val = raw + pr;
            break;
          }
          default: val = raw;
        }
        dstRow[x] = val & 0xff;
      }
    }

    // Sample pixels at the skip link center.
    // ctxRect has the skip button at (skipRect.x - ctxRect.x + skipRect.w/2, skipRect.y - ctxRect.y + skipRect.h/2)
    const cx = (skipRect.x - ctxRect.x) + Math.floor(skipRect.w / 2);
    const cy = (skipRect.y - ctxRect.y) + Math.floor(skipRect.h / 2);

    // Sample the skip button center (text color).
    const textPixel = [unfiltered[cx * channels + cy * stride + 0], unfiltered[cx * channels + cy * stride + 1], unfiltered[cx * channels + cy * stride + 2]];
    const textAlpha = channels === 4 ? unfiltered[cx * channels + cy * stride + 3] : 255;

    // Sample the card area near the button top (gradient background).
    const bgPixel = [unfiltered[(cx) * channels + (cy - 10) * stride + 0], unfiltered[(cx) * channels + (cy - 10) * stride + 1], unfiltered[(cx) * channels + (cy - 10) * stride + 2]];

    const ratio = contrast(textPixel, bgPixel);

    console.log(`\n=== ${theme.toUpperCase()} THEME ===`);
    console.log(`Skip rect: x=${skipRect.x}, y=${skipRect.y}, w=${skipRect.w}, h=${skipRect.h}`);
    console.log(`Sample at: cx=${cx}, cy=${cy}`);
    console.log(`Text pixel (at skip center): rgb(${textPixel.join(',')}) alpha=${textAlpha}`);
    console.log(`Bg pixel (10px above center): rgb(${bgPixel.join(',')})`);
    console.log(`Contrast ratio: ${ratio.toFixed(2)}:1`);
    console.log(`WCAG AA 4.5:1 for 13px text: ${ratio >= 4.5 ? 'PASS ✅' : 'FAIL ❌'}`);

    results[theme] = { textPixel, bgPixel, ratio };

    await page.close().catch(() => {});
  }

  await browser.close().catch(() => {});
  kill();
}

run().catch((e) => { console.error(e); process.exit(1); });
