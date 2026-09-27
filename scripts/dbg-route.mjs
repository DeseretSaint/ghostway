import { startPreview } from '../scripts/lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const { url, kill } = await startPreview();
const b = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERR', String(e).slice(0, 300)));
p.on('console', (m) => { if (m.type() === 'error' && !/CORS|Failed to load resource/.test(m.text())) console.log('CONSOLE', m.text().slice(0, 300)); });
await p.setViewport({ width: 390, height: 844 });
await p.goto(url, { waitUntil: 'load' });
await p.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
await p.reload({ waitUntil: 'load' });
await p.waitForFunction(() => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'), { timeout: 15000 });

async function pick(inputSel, query) {
  await p.evaluate((sel) => { const el = document.querySelector(sel); if (el) el.value = ''; }, inputSel);
  await p.type(inputSel, query);
  try {
    await p.waitForFunction(() => !document.querySelector('#suggestions .sugg-loading') && !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'), { timeout: 12000 });
    await p.evaluate(() => document.querySelector('#suggestions .sugg:not(.sugg-recent)')?.click());
  } catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await new Promise((r) => setTimeout(r, 500));
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
console.log('after picks:', JSON.stringify(await p.evaluate(() => ({
  from: window.__gw.state.from && { label: window.__gw.state.from.label, coords: window.__gw.state.from.coords },
  to: window.__gw.state.to && { label: window.__gw.state.to.label, coords: window.__gw.state.to.coords },
  status: document.getElementById('status')?.textContent?.slice(0, 80),
}))));
await new Promise((r) => setTimeout(r, 8000));
console.log('after 8s:', JSON.stringify(await p.evaluate(() => ({
  debug: window.__ghostwayDebug || null,
  status: document.getElementById('status')?.textContent?.slice(0, 120),
  card: document.querySelector('#route-card')?.textContent?.replace(/\s+/g, ' ')?.slice(0, 80),
  chips: [...document.querySelectorAll('.mode-chip .chip-meta')].map((e) => e.textContent),
}))));
await b.close();
await kill();
