// Q143 field mode (sunlight/outdoor legibility): gated on prefers-contrast:more
// (no hand-rolled toggle). Asserts the max-contrast surface holds ≥7:1 text
// headroom in BOTH themes (sun reflectance costs ~2:1), surfaces are solid
// (no glass/alpha over the map), and boundaries thicken.
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });

  const probe = () => page.evaluate(() => {
    const lum = ([r, g, b]) => {
      const f = v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const parse = (c) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
      const h = c.match(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i);
      if (h) {
        let s = h[1];
        if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
        return { rgb: [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)], a: 1 };
      }
      return null;
    };
    const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
    const cs = getComputedStyle(document.documentElement);
    const tok = (n) => parse(cs.getPropertyValue(n).trim());
    const bg = tok('--bg'), panel = tok('--panel');
    const out = {
      inkOnBg: ratio(tok('--ink').rgb, bg.rgb),
      mutedOnBg: ratio(tok('--muted').rgb, bg.rgb),
      accentOnPanel: ratio(tok('--accent').rgb, panel.rgb),
      dangerOnPanel: ratio(tok('--danger').rgb, panel.rgb),
      lineOnBg: ratio(tok('--line').rgb, bg.rgb),
      panelAlpha: panel.a,
    };
    const chip = getComputedStyle(document.querySelector('.map-chip'));
    out.chipBlur = chip.backdropFilter || chip.webkitBackdropFilter || '';
    out.chipBg = chip.backgroundColor;
    const navB = getComputedStyle(document.querySelector('.panel') || document.body);
    out.panelBorder = navB.borderTopWidth;
    return out;
  });

  // Field mode (dark default theme). Raw CDP: puppeteer's emulateMediaFeatures
  // allowlist doesn't know prefers-contrast.
  const cdp = await page.createCDPSession();
  const emulate = (features) => cdp.send('Emulation.setEmulatedMedia', { features });
  await emulate([{ name: 'prefers-contrast', value: 'more' }]);
  await new Promise(r => setTimeout(r, 150));
  const dark = await probe();

  // Field mode + light theme.
  await emulate([
    { name: 'prefers-contrast', value: 'more' },
    { name: 'prefers-color-scheme', value: 'light' },
  ]);
  await new Promise(r => setTimeout(r, 150));
  const light = await probe();

  const min7 = (p) => p.inkOnBg >= 7 && p.mutedOnBg >= 7 && p.accentOnPanel >= 7 && p.dangerOnPanel >= 7;
  const solid = (p) => p.panelAlpha === 1 && /none/.test(p.chipBlur) && /rgba\(.*,\s*1\)$|rgb\(/.test(p.chipBg);
  const checks = {
    darkText7: min7(dark),
    lightText7: min7(light),
    darkSolid: solid(dark),
    lightSolid: solid(light),
    darkBoundary3: dark.lineOnBg >= 3,
    lightBoundary3: light.lineOnBg >= 3,
    thickerBorders: parseFloat(dark.panelBorder) >= 2,
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ dark, light, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('FIELD MODE (SUNLIGHT) PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
