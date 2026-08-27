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
await p.evaluateOnNewDocument(() => localStorage.setItem('gw-onboarded','1'));
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(sel, q) { await p.type(sel, q); try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); } catch { await p.focus(sel); await p.keyboard.press('Enter'); } await wait(500); }
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(2000);
const card = await p.evaluate(() => {
  const pill = document.querySelector('#engineStatus');
  return {
    pillHTML: pill ? pill.innerHTML.slice(0,120) : 'NONE',
    pillHasRawSVG: pill ? /<svg/i.test(pill.textContent) : false,
    opts: [...document.querySelectorAll('.route-opt')].map(o => o.querySelector('.opt-label')?.textContent + ' | ' + o.querySelector('.opt-meta')?.textContent),
    optCount: document.querySelectorAll('.route-opt').length,
  };
});
console.log('PILL HTML:', card.pillHTML);
console.log('PILL raw SVG leaked:', card.pillHasRawSVG);
console.log('OPTION COUNT:', card.optCount);
card.opts.forEach(o => console.log('  ', o));
console.log('ERRORS:', errs.filter(e=>!/favicon|404/.test(e)).slice(0,5));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
