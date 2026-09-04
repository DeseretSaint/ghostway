// Pixel contrast sampler for skip link.
// Loads the onboarding overlay in light theme, samples the actual rendered
// pixel color behind the skip button, and computes WCAG contrast ratio.
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
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function run() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto('http://localhost:4173/?fresh=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => {
    const w = document.querySelector('#onboarding');
    return w && !w.hidden;
  }, { timeout: 10000 });
  await wait(400);

  // Sample the rendered pixel color at the skip button center.
  const skipRect = await page.evaluate(() => {
    const r = document.querySelector('#obSkip').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
  });

  // Take a screenshot and read the pixel color via canvas.
  const buf = await page.screenshot({ encoding: 'binary' });
  const { createCanvas, loadImage } = await import('canvas').catch(() => ({}));
  
  // Use CDP to sample the actual rendered color at the point.
  const client = await page.createCDPSession();
  const { r, g, b, a } = await client.send('Page.getDOMSamplingProfile', {}).catch(() => null) || {};
  
  // Alternative: use screenshot + pixel read via sharp/jimp. Simpler: use page.evaluate with getImageData.
  const pixelColor = await page.evaluate((sx, sy) => {
    // Draw the current page to a canvas to sample pixels.
    const c = document.createElement('canvas');
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    const ctx = c.getContext('2d');
    // Can't draw DOM directly; use html2canvas? Not available.
    // Instead, sample via elementFromPoint + computed style of the PARENT at that point.
    const el = document.elementFromPoint(sx, sy);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      el: el.className || el.tagName,
      bg: cs.bgColor || cs.backgroundColor,
      color: cs.color,
    };
  }, skipRect.x, skipRect.y);

  console.log('Skip button rect:', JSON.stringify(skipRect));
  console.log('Element at skip center:', JSON.stringify(pixelColor));

  // Also sample the card's background at the same point (the skip button is transparent).
  const cardColor = await page.evaluate((sx, sy) => {
    // The skip button has bg:none, so the element behind it is the card.
    // Temporarily hide skip to sample what's behind.
    const skip = document.querySelector('#obSkip');
    const prev = skip.style.display;
    skip.style.display = 'none';
    const el = document.elementFromPoint(sx, sy);
    skip.style.display = prev;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      cls: el.className,
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage,
    };
  }, skipRect.x, skipRect.y);

  console.log('Card bg behind skip:', JSON.stringify(cardColor));

  // Compute contrast: skip text color vs card bg.
  const skipTextColor = await page.evaluate(() => getComputedStyle(document.querySelector('#obSkip')).color);
  console.log('Skip text color:', skipTextColor);

  // Parse rgb from "rgb(r, g, b)"
  const parseRgb = (s) => (s.match(/\d+/g) || []).map(Number);
  const textRgb = parseRgb(skipTextColor);
  
  // The card bg is a gradient. Sample the gradient color at the top.
  const gradientColor = await page.evaluate(() => {
    const card = document.querySelector('.ob-card');
    const cs = getComputedStyle(card);
    // The gradient is "linear-gradient(180deg, rgba(24,32,50,0.98) 0%, var(--panel) 100%)"
    // At the top (y=0%), it's rgba(24,32,50,0.98).
    // Parse the gradient string.
    const m = cs.backgroundImage.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ? Number(m[4]) : 1] : null;
  });
  console.log('Card gradient top color:', JSON.stringify(gradientColor));

  if (textRgb.length === 3 && gradientColor) {
    const bgRgb = [gradientColor[0], gradientColor[1], gradientColor[2]];
    const ratio = contrast(textRgb, bgRgb);
    console.log(`\nContrast ratio (skip text vs card gradient top): ${ratio.toFixed(2)}:1`);
    console.log(`WCAG AA 4.5:1 required: ${ratio >= 4.5 ? 'PASS' : 'FAIL'}`);
  }

  await browser.close().catch(() => {});
  kill();
}

run().catch((e) => { console.error(e); process.exit(1); });
