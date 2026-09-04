// Pixel contrast sampler for skip link — grid sampling.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

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

async function run() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

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

    // Screenshot just the skip link area.
    const ctxRect = {
      x: Math.max(0, skipRect.x - 10),
      y: Math.max(0, skipRect.y - 10),
      width: skipRect.w + 20,
      height: skipRect.h + 20,
    };
    const buf = await page.screenshot({ encoding: 'binary', clip: ctxRect });
    const raw = Buffer.from(buf);

    // Parse PNG.
    let pos = 8, width = 0, height = 0, colorType = 0;
    const idat = [];
    while (pos < raw.length) {
      const len = raw.readUInt32BE(pos); pos += 4;
      const type = raw.toString('ascii', pos, pos + 4); pos += 4;
      const data = raw.subarray(pos, pos + len); pos += len;
      pos += 4;
      if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
      else if (type === 'IDAT') idat.push(data);
      else if (type === 'IEND') break;
    }

    const { inflateSync } = await import('zlib');
    const decompressed = inflateSync(Buffer.concat(idat));
    const channels = colorType === 6 ? 4 : 3;
    const stride = width * channels;
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
            val = raw + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c));
            break;
          }
          default: val = raw;
        }
        dstRow[x] = val & 0xff;
      }
    }

    // Sample a grid within the button area.
    const bx = skipRect.x - ctxRect.x;
    const by = skipRect.y - ctxRect.y;
    const colors = {};
    let textColor = null, bgColor = null;

    for (let dy = 5; dy < skipRect.h - 5; dy += 2) {
      for (let dx = 5; dx < skipRect.w - 5; dx += 2) {
        const px = bx + dx, py = by + dy;
        const r = unfiltered[px * channels + py * stride + 0];
        const g = unfiltered[px * channels + py * stride + 1];
        const b = unfiltered[px * channels + py * stride + 2];
        const key = `${r},${g},${b}`;
        colors[key] = (colors[key] || 0) + 1;
      }
    }

    // Sort by frequency.
    const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
    console.log(`\n=== ${theme.toUpperCase()} THEME ===`);
    console.log(`Button area: x=${skipRect.x}, y=${skipRect.y}, w=${skipRect.w}, h=${skipRect.h}`);
    console.log('Top 10 colors (r,g,b: count):');
    for (const [color, count] of sorted.slice(0, 10)) {
      console.log(`  ${color}: ${count}`);
    }

    // The most common color is the background. The second most common (if different) is likely text.
    if (sorted.length >= 2) {
      const bg = sorted[0][0].split(',').map(Number);
      const text = sorted[1][0].split(',').map(Number);
      const ratio = contrast(text, bg);
      console.log(`\nText color (2nd most common): rgb(${text.join(',')})`);
      console.log(`Bg color (most common): rgb(${bg.join(',')})`);
      console.log(`Contrast ratio: ${ratio.toFixed(2)}:1`);
      console.log(`WCAG AA 4.5:1 for 13px text: ${ratio >= 4.5 ? 'PASS' : 'FAIL'}`);
    } else if (sorted.length === 1) {
      console.log('Only one color found — text may not be rendering or is same as bg.');
    }

    await page.close().catch(() => {});
  }

  await browser.close().catch(() => {});
  kill();
}

run().catch((e) => { console.error(e); process.exit(1); });
