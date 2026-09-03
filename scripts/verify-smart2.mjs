import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 150s'); process.exit(2); }, 150000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => { if (m.type()==='error') errs.push(m.text()); });
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded','1'); localStorage.setItem('gw-mode','moderate'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(sel, q) {
  const el = await p.$(sel);
  await el.click({ clickCount: 3 });
  await p.keyboard.press('Backspace');
  await p.type(sel, q);
  try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); }
  catch { await p.focus(sel); await p.keyboard.press('Enter'); }
  await wait(600);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(2000);
const r = await p.evaluate(() => {
  const a = window.__gw;
  return {
    from: a.state.from,
    to: a.state.to,
    engineReady: a._engineReady,
    engineFlag: window.__ghostwayEngine,
    nOpts: a.state.options?.length,
    chosenIdx: a.state.chosen,
    opts: a.state.options?.map(o=>({mode:o.mode,label:o.label,km:+(o.distance/1000).toFixed(1),cam:o.cameras,hw:+(o.highwayKm||0).toFixed(1),dur:Math.round(o.duration/60)})),
    routeChosen: a.state.route?.chosen,
    debug: window.__ghostwayDebug,
    status: document.querySelector('#status')?.textContent,
  };
});
console.log(JSON.stringify(r, null, 2));
console.log('ERRORS:', errs.slice(0,5));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
