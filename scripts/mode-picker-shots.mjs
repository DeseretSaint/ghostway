// Mode-picker screenshot capture for ghostway-fire queue #2b (v2 — robust crop).
// Verifies the mode-switch UI (Strict/Balanced/Fastest) renders at 390+375+1440
// with Strict pre-selected, and saves BOTH a full-page screenshot AND a
// cropped strip centered on #modeSwitch.
//
// Usage: node scripts/mode-picker-shots.mjs
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 180s timeout — force exit'); process.exit(2); }, 180000).unref();

const OUT = 'ux-shots';
const LOG = `${OUT}/mode-picker-probe.json`;

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'mobile-375', width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: 'desktop-1440', width: 1440, height: 900, deviceScaleFactor: 1 },
];

async function probe(page) {
  return page.evaluate(() => {
    const wrap = document.querySelector('#modeSwitch');
    const toggle = document.querySelector('#avoid-toggle');
    const hidden = toggle ? toggle.hidden : null;
    const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
    const btns = Array.from((wrap || document).querySelectorAll('.mode-btn'));
    const labels = btns.map(b => (b.textContent || '').trim());
    const modes = btns.map(b => b.dataset.mode || '');
    const active = btns.find(b => b.classList.contains('active'));
    const activeMode = active?.dataset.mode || '';
    const ariaPressed = btns.map(b => b.getAttribute('aria-pressed'));
    const r = wrap ? wrap.getBoundingClientRect() : null;
    return {
      ok: !!wrap && btns.length === 3,
      why: !wrap ? '#modeSwitch missing' : (btns.length === 3 ? '' : `expected 3 buttons, got ${btns.length}`),
      toggleHidden: hidden,
      toggleRect: toggleRect ? { x: Math.round(toggleRect.x), y: Math.round(toggleRect.y), w: Math.round(toggleRect.width), h: Math.round(toggleRect.height) } : null,
      labels, modes, activeMode, ariaPressed,
      rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
    };
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });

  let failure = null;
  try {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
      // Returning user
      await page.evaluate(() => { try { localStorage.setItem('gw-onboarded', '1'); } catch {} });
      await page.reload({ waitUntil: 'networkidle2' });
      await wait(2000);
      // Drive the app into picker-visible state: setEndpoints() un-hides #avoid-toggle.
      await page.evaluate(() => {
        try {
          // Simulate two endpoints so setEndpoints() runs
          const app = window.__gwApp || (window.app);
          if (app && typeof app.setEndpoints === 'function') {
            app.setEndpoints({ label: 'Pleasant Grove, UT' }, { label: 'Lindon, UT' });
          } else {
            // Fallback: set localStorage to enable state, then unhide
            try { localStorage.setItem('gw-from', 'Pleasant Grove, UT'); localStorage.setItem('gw-to', 'Lindon, UT'); } catch {}
            const toggle = document.querySelector('#avoid-toggle');
            if (toggle) toggle.hidden = false;
          }
        } catch (e) { console.error('endpoint set failed', e); }
      });
      await wait(800);
      const probeResult = await probe(page);
      console.log(JSON.stringify({ vp: vp.name, probeResult }, null, 2));
      try {
        const { readFileSync, writeFileSync, existsSync } = await import('node:fs');
        let log = existsSync(LOG) ? JSON.parse(readFileSync(LOG, 'utf8')) : [];
        log.push({ vp: vp.name, probeResult, at: new Date().toISOString() });
        writeFileSync(LOG, JSON.stringify(log, null, 2));
      } catch (e) { console.error('log write failed', e); }
      if (!probeResult.ok) failure = { vp: vp.name, ...probeResult };

      // Full-page screenshot
      const fullFile = `${OUT}/${vp.name}-mode-picker.png`;
      await page.screenshot({ path: fullFile, fullPage: false });
      console.log('saved', fullFile);

      // Crop strip centered on the picker, padding above/below for context
      const padTop = 60;
      const padBot = 80;
      const clip = await page.evaluate((p) => {
        const r = document.querySelector('#modeSwitch').getBoundingClientRect();
        return {
          x: Math.max(0, Math.floor(r.x - 16)),
          y: Math.max(0, Math.floor(r.y - p.top)),
          width: Math.ceil(r.width + 32),
          height: Math.ceil(r.height + p.top + p.bot),
        };
      }, { top: padTop, bot: padBot });
      const cropFile = `${OUT}/${vp.name}-mode-picker-crop.png`;
      await page.screenshot({ path: cropFile, clip });
      console.log('saved', cropFile, JSON.stringify(clip));
      await page.close();
    }
  } finally {
    try { await browser.close(); } catch {}
    try { kill(); } catch {}
  }
  if (failure) { console.error('FAIL', JSON.stringify(failure)); process.exit(3); }
  console.log('mode-picker-shots DONE');
}

main().catch((e) => { console.error(e); process.exit(1); });