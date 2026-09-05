// Shared WCAG contrast measurement utilities for multi-viewport a11y probes.
// Used by battery-hint-check, camchip-check, onboard-check.
// Asserts AA contrast (≥4.5:1) on key UI elements at every viewport + theme.

function relLum(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(rgb1, rgb2) {
  const l1 = relLum(rgb1), l2 = relLum(rgb2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseRgb(s) {
  if (!s) return null;
  const m = s.match(/\d+/g);
  // Handle both rgb(r,g,b) and rgba(r,g,b,a) — take only first 3 channels.
  return m ? m.slice(0, 3).map(Number) : null;
}

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
