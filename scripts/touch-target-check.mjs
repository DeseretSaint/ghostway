// Verify .clear-btn and .modal-close render at >=44px after the touch-target fix.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const { url, kill } = await startPreview();
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
const errors = [];
page.on('pageerror', e => { const s = String(e); if (!s.includes('webglcontextcreationerror')) errors.push(s); });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForFunction(() => !document.querySelector('#splash') || getComputedStyle(document.querySelector('#splash')).opacity === '0' || document.querySelector('#splash').hidden, { timeout: 15000 }).catch(() => {});

// Reveal the clear buttons by typing into both fields.
await page.focus('#fromInput');
await page.type('#fromInput', 'Pleasant Grove');
await page.focus('#toInput');
await page.type('#toInput', 'Lehi');
await new Promise(r => setTimeout(r, 300));

const clear = await page.evaluate(() => {
  const el = document.querySelector('.clear-btn');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { w: r.width, h: r.height, display: cs.display, hidden: el.hidden };
});

// Open the modal to reveal .modal-close (it's a persistent element in #modal).
const modal = await page.evaluate(async () => {
  const m = document.querySelector('#modal');
  if (m) m.hidden = false;
  await new Promise(r => setTimeout(r, 300));
  const el = document.querySelector('.modal-close');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { w: r.width, h: r.height, display: cs.display, hidden: el.hidden };
});

console.log(JSON.stringify({ clear, modal, errors }, null, 1));
const ok = clear && clear.w >= 44 && clear.h >= 44 && modal && modal.w >= 44 && modal.h >= 44 && errors.length === 0;
console.log(ok ? 'TOUCH-TARGET PASS ✅' : 'TOUCH-TARGET FAIL ❌');
await Promise.race([browser.close(), new Promise(r => setTimeout(r, 3000))]);
kill();
process.exit(ok ? 0 : 1);
