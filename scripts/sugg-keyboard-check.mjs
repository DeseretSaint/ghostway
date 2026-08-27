// Hermetic UI smoke for Maps-parity keyboard navigation of search suggestions
// (slot-B round 60). Spawns its own vite preview (lib-preview), types a real
// query, then drives ArrowDown/ArrowUp from the input and asserts focus moves
// through the suggestion rows (wrapping), and that Enter on a focused row
// selects it (fills the field + hides the panel).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG: 150s timeout'); process.exit(2); }, 150000).unref();

const preview = await startPreview({ port: 4173 });
let code = 1;
try {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e.message)));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(preview.url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Type a real query into the destination field and wait for result rows.
  await p.click('#toInput');
  await p.type('#toInput', 'provo', { delay: 15 });
  await p.waitForSelector('#suggestions:not([hidden]) .sugg', { timeout: 12000 });
  const nRows = await p.evaluate(() => document.querySelectorAll('#suggestions .sugg').length);
  console.log('rows:', nRows);

  const activeId = () => p.evaluate(() => document.activeElement?.id || document.activeElement?.className || 'body');

  // ArrowDown from the field → first row.
  await p.keyboard.press('ArrowDown');
  const afterDown1 = await p.evaluate(() => ({
    cls: document.activeElement?.className,
    name: document.activeElement?.querySelector('.sugg-name')?.textContent?.trim(),
  }));
  console.log('after ArrowDown #1:', JSON.stringify(afterDown1));
  const okDown1 = /sugg/.test(afterDown1.cls || '') && !!afterDown1.name;

  // ArrowDown again → second row (when >1 row exists).
  let okDown2 = true;
  if (nRows > 1) {
    await p.keyboard.press('ArrowDown');
    const afterDown2 = await p.evaluate(() => ({
      idx: [...document.querySelectorAll('#suggestions .sugg')].indexOf(document.activeElement),
    }));
    console.log('after ArrowDown #2 idx:', afterDown2.idx);
    okDown2 = afterDown2.idx === 1;
  }

  // ArrowUp from the first row wraps to the LAST row.
  await p.click('#toInput'); // back to the field
  await p.keyboard.press('ArrowUp');
  const afterUp = await p.evaluate(() => ({
    idx: [...document.querySelectorAll('#suggestions .sugg')].indexOf(document.activeElement),
  }));
  console.log('after ArrowUp from field idx:', afterUp.idx, '(expect', nRows - 1, ')');
  const okUpWrap = afterUp.idx === nRows - 1;

  // Enter on the focused row selects it: field filled, panel hidden.
  await p.keyboard.press('Enter');
  await wait(400);
  const afterEnter = await p.evaluate(() => ({
    value: document.querySelector('#toInput').value,
    boxHidden: document.querySelector('#suggestions').hidden,
  }));
  console.log('after Enter:', JSON.stringify(afterEnter));
  const okEnter = afterEnter.boxHidden && afterEnter.value.length > 0;

  console.log('down1:', okDown1, '| down2:', okDown2, '| up-wrap:', okUpWrap, '| enter-selects:', okEnter);
  const clean = errs.filter((e) => !/favicon|404/.test(e)).length === 0;
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (okDown1 && okDown2 && okUpWrap && okEnter && clean) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('sugg-keyboard-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
