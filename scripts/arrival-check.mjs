// Hermetic UI smoke for the Maps-parity arrival clock (.rc-arrive).
// Spawns its own vite preview (lib-preview), drives a real PG→Lehi route,
// and asserts the route card shows "Arrive <time>".
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

  async function pick(inputSel, query) {
    await p.type(inputSel, query);
    try { await p.waitForSelector('#suggestions .sugg', { timeout: 6000 }); await p.click('#suggestions .sugg'); }
    catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
    await wait(500);
  }
  await pick('#toInput', 'Costco Lehi');
  await pick('#fromInput', 'Pleasant Grove Utah');

  const goVisible = await p.evaluate(() => {
    const r = document.querySelector('#goBtn').getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !document.querySelector('#route-actions').hidden;
  });
  if (goVisible) await p.click('#goBtn');
  await p.waitForFunction(
    "() => !document.querySelector('#route-card').hidden || document.querySelector('#status')?.textContent?.includes('failed')",
    { timeout: 40000 }
  );
  const early = await p.evaluate(() => ({
    status: document.querySelector('#status')?.textContent?.slice(0, 120),
    opts: document.querySelectorAll('.route-opt').length,
    html: document.querySelector('#route-card')?.innerHTML?.slice(0, 500),
  }));
  console.log('EARLY status:', early.status, '| opts:', early.opts);
  console.log('EARLY html:', early.html);
  await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 90000 });
  // Routing finishes asynchronously after the engine is ready — wait for the
  // card to actually populate with the arrival clock before reading it.
  await p.waitForSelector('#route-card .rc-arrive', { timeout: 30000 });

  const arrive = await p.evaluate(() => {
    const el = document.querySelector('#route-card .rc-arrive');
    const card = document.querySelector('#route-card');
    return { txt: el ? el.textContent.trim() : null, html: card ? card.innerHTML.slice(0, 600) : 'NO CARD', hidden: card ? card.hidden : 'n/a' };
  });
  console.log('rc-arrive:', JSON.stringify(arrive.txt));
  console.log('card html:', arrive.html);
  const ok = !!arrive.txt && /Arrive\s+\d/.test(arrive.txt);
  console.log('arrival clock present:', ok);
  console.log('page errors:', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
  if (ok && errs.filter((e) => !/favicon|404/.test(e)).length === 0) code = 0;
  try { await Promise.race([b.close(), wait(5000)]); } catch {}
} catch (e) {
  console.error('arrival-check failed:', e.message);
  code = 1;
} finally {
  preview.kill();
}
process.exit(code);
