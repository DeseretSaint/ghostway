// Pixel-level contrast verification for skip link.
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
import zlib from 'node:zlib';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 60s'); process.exit(2); }, 60000).unref();

function relLum(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function lumArr(rgb) {
  return 0.2126 * relLum(rgb[0]) + 0.7152 * relLum(rgb[1]) + 0.0722 * relLum(rgb[2]);
}
function contrast(a, b) {
  const la = lumArr(a), lb = lumArr(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function parsePng(buf) {
  let pos = 8, width = 0, height = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); pos += 4;
    const type = buf.toString('ascii', pos, pos + 4); pos += 4;
    const data = buf.subarray(pos, pos + len); pos += len;
    pos += 4;
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idat));
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = decompressed[y * (stride + 1)];
    const src = decompressed.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const dst = px.subarray(y * stride, y * stride + stride);
    for (let x = 0; x < stride; x++) {
      const raw = src[x];
      const a = x >= channels ? dst[x - channels] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = (y > 0 && x >= channels) ? px[(y - 1) * stride + x - channels] : 0;
      let v;
      switch (f) {
        case 0: v = raw; break;
        case 1: v = raw + a; break;
        case 2: v = raw + b; break;
        case 3: v = raw + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = raw + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c));
          break;
        }
        default: v = raw;
      }
      dst[x] = v & 0xff;
    }
  }
  return { px, width, height, channels, stride };
}

function getPixel(data, x, y, channels, stride) {
  return [data[x * channels + y * stride + 0], data[x * channels + y * stride + 1], data[x * channels + y * stride + 2]];
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

    // Screenshot the card area around the skip button.
    const ctxX = Math.max(0, skipRect.x - 20);
    const ctxY = Math.max(0, skipRect.y - 20);
    const ctxW = skipRect.w + 40;
    const ctxH = skipRect.h + 40;
    const buf = await page.screenshot({ encoding: 'binary', clip: { x: ctxX, y: ctxY, width: ctxW, height: ctxH } });
    const { px, width, height, channels, stride } = parsePng(Buffer.from(buf));

    const bx = skipRect.x - ctxX;
    const by = skipRect.y - ctxY;

    // Count colors in the button area.
    const colorCount = {};
    for (let dy = 0; dy < skipRect.h; dy++) {
      for (let dx = 0; dx < skipRect.w; dx++) {
        const rgb = getPixel(px, bx + dx, by + dy, channels, stride);
        const key = rgb.join(',');
        colorCount[key] = (colorCount[key] || 0) + 1;
      }
    }

    const sorted = Object.entries(colorCount).sort((a, b) => b[1] - a[1]);
    const bgRgb = sorted[0][0].split(',').map(Number);

    // Find the color with the highest contrast vs background (the text).
    let bestContrast = 0;
    let textRgb = null;
    for (const [color, count] of sorted.slice(1)) {
      const rgb = color.split(',').map(Number);
      const c = contrast(bgRgb, rgb);
      if (c > bestContrast) { bestContrast = c; textRgb = rgb; }
    }

    // Also get the computed CSS values.
    const computed = await page.evaluate(() => {
      const skip = document.querySelector('#obSkip');
      const card = document.querySelector('.ob-card');
      const next = document.querySelector('#obNext');
      return {
        skipColor: getComputedStyle(skip).color,
        cardBg: getComputedStyle(card).backgroundColor,
        cardBgImage: getComputedStyle(card).backgroundImage,
        nextColor: getComputedStyle(next).color,
        nextBg: getComputedStyle(next).backgroundColor,
      };
    });

    console.log(`\n=== ${theme.toUpperCase()} THEME ===`);
    console.log(`Skip rect: x=${skipRect.x}, y=${skipRect.y}, w=${skipRect.w}, h=${skipRect.h}`);
    console.log(`Computed: skip=${computed.skipColor}, cardBg=${computed.cardBg}, cardBgImage=${computed.cardBgImage}`);
    console.log(`Computed next: color=${computed.nextColor}, bg=${computed.nextBg}`);
    console.log(`Pixel bg (most common): rgb(${bgRgb.join(',')}) = ${(sorted[0][1] / (skipRect.w * skipRect.h) * 100).toFixed(1)}%`);
    if (textRgb) console.log(`Pixel text (highest contrast): rgb(${textRgb.join(',')})`);
    console.log(`Pixel contrast: ${bestContrast.toFixed(2)}:1  ${bestContrast >= 4.5 ? 'PASS' : 'FAIL'}`);

    // Regression check: obNext (CTA) button contrast.
    const nextRect = await page.evaluate(() => {
      const r = document.querySelector('#obNext').getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    });
    const nbx = nextRect.x - ctxX;
    const nby = nextRect.y - ctxY;
    // Sample button center.
    const nextCenter = getPixel(px, nbx + Math.floor(nextRect.w / 2), nby + Math.floor(nextRect.h / 2), channels, stride);
    const nextEdge = getPixel(px, nbx + 2, nby + Math.floor(nextRect.h / 2), channels, stride);
    const nextCenterLum = lumArr(nextCenter);
    const nextEdgeLum = lumArr(nextEdge);
    // The button is teal (#0d9488 or similar). If center and edge are very similar, it's solid.
    console.log(`obNext pixel center: rgb(${nextCenter.join(',')}) vs edge: rgb(${nextEdge.join(',')})`);

    await page.close().catch(() => {});
  }

  await browser.close().catch(() => {});
  kill();
}

run().catch((e) => { console.error(e); process.exit(1); });
