// Shared WCAG contrast measurement utilities for multi-viewport a11y probes.
// Used by battery-hint-check, camchip-check, onboard-check, fire-multi-viewport-contrast.
// Asserts AA contrast (>=4.5:1) on key UI elements at every viewport + theme.
import { PNG } from 'pngjs';

// --- WCAG 2.x luminance + contrast ---

function relLum(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Spec-name alias for relLum.
export function relativeLuminance(rgb) {
  return relLum(rgb);
}

export function contrast(rgb1, rgb2) {
  const l1 = relLum(rgb1), l2 = relLum(rgb2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Spec-name alias for contrast.
export function contrastRatio(rgb1, rgb2) {
  return contrast(rgb1, rgb2);
}

// --- Color parsing ---

export function parseRgb(s) {
  if (!s) return null;
  const m = s.match(/\d+/g);
  // Handle both rgb(r,g,b) and rgba(r,g,b,a) — take only first 3 channels.
  return m ? m.slice(0, 3).map(Number) : null;
}

// Returns {r, g, b, a} from rgba()/rgb() strings. a defaults to 1.
export function parseRgba(s) {
  if (!s) return null;
  const m = s.match(/[\d.]+/g);
  if (!m) return null;
  return {
    r: parseFloat(m[0]),
    g: parseFloat(m[1]),
    b: parseFloat(m[2]),
    a: m.length >= 4 ? parseFloat(m[3]) : 1,
  };
}

// --- Alpha compositing ---

// Composite a translucent foreground (rgbTop at alpha a) over an opaque rgbBg.
export function compositeOver(rgbTop, a, rgbBg) {
  return [
    Math.round(rgbTop[0] * a + rgbBg[0] * (1 - a)),
    Math.round(rgbTop[1] * a + rgbBg[1] * (1 - a)),
    Math.round(rgbTop[2] * a + rgbBg[2] * (1 - a)),
  ];
}

// --- Effective background resolution ---

// Walk up from el until a non-transparent background is found.
// Resolves rgba() + linear-gradient() backgrounds. Returns {r, g, b, a}.
export async function getEffectiveBg(page, handle) {
  return await page.evaluate((el) => {
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
}

// --- Pixel sampling ---

// Take a screenshot of page, decode PNG, return [r,g,b] at viewport coords (x,y).
// viewport.deviceScaleFactor maps viewport CSS px -> device px.
export async function samplePixel(page, viewport, x, y) {
  const buffer = await page.screenshot({ type: 'png' });
  const png = PNG.sync.read(buffer);
  const dpr = viewport.deviceScaleFactor || 1;
  const px = Math.floor(x * dpr);
  const py = Math.floor(y * dpr);
  if (px < 0 || py < 0 || px >= png.width || py >= png.height) return null;
  const idx = (py * png.width + px) * 4;
  return [png.data[idx], png.data[idx + 1], png.data[idx + 2]];
}

// --- High-level verify ---

// Sample the text-color pixel at elSelector's center and the bg-color pixel at
// bgSelector's center, compute WCAG contrast, return {ratio, pass, textRgb, bgRgb}.
export async function verifyAtPixel(page, viewport, elSelector, bgSelector, opts = {}) {
  const min = opts.min || 4.5;

  const coords = await page.evaluate((elSel, bgSel) => {
    const el = document.querySelector(elSel);
    const bg = document.querySelector(bgSel);
    if (!el || !bg) return null;
    const elRect = el.getBoundingClientRect();
    const bgRect = bg.getBoundingClientRect();
    return {
      elX: elRect.x + elRect.width / 2,
      elY: elRect.y + elRect.height / 2,
      bgX: bgRect.x + bgRect.width / 2,
      bgY: bgRect.y + bgRect.height / 2,
    };
  }, elSelector, bgSelector);

  if (!coords) return { ratio: 0, pass: false, error: 'element not found' };

  const textRgb = await samplePixel(page, viewport, coords.elX, coords.elY);
  const bgRgb = await samplePixel(page, viewport, coords.bgX, coords.bgY);

  if (!textRgb || !bgRgb) return { ratio: 0, pass: false, error: 'pixel out of bounds' };

  const ratio = contrast(textRgb, bgRgb);
  return {
    ratio,
    pass: ratio >= min,
    textRgb,
    bgRgb,
  };
}

// --- Viewport + theme constants ---

// Full viewport ladder from the fire #19 regression sweep.
// 320=small phone, 375=iPhone SE, 390=iPhone 14, 430=large phone,
// 720=small tablet, 1024=tablet, 1440=desktop.
export const VIEWPORT_LADDER = [
  { width: 320, height: 568, isMobile: true },
  { width: 375, height: 812, isMobile: true },
  { width: 390, height: 844, isMobile: true },
  { width: 430, height: 932, isMobile: true },
  { width: 720, height: 1280, isMobile: true },
  { width: 1024, height: 1366, isMobile: false },
  { width: 1440, height: 900, isMobile: false },
];

export const THEMES = ['light', 'dark'];

export const AA_THRESHOLD = 4.5;
