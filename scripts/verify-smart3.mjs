import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 150s'); process.exit(2); }, 150000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded','1'); localStorage.setItem('gw-mode','moderate'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
// Set TO first
await p.click('#toInput', { clickCount: 3 });
await p.type('#toInput', 'Costco Lehi');
await p.waitForSelector('#suggestions .sugg', { timeout: 8000 });
await p.click('#suggestions .sugg');
await wait(700);
console.log('TO value:', await p.$eval('#toInput', e=>e.value));
// Now set FROM — explicitly focus + select all + type
await p.focus('#fromInput');
await p.$eval('#fromInput', e=>{ e.value=''; });
await p.type('#fromInput', 'Pleasant Grove Utah');
await p.waitForSelector('#suggestions .sugg', { timeout: 8000 });
await p.click('#suggestions .sugg');
await wait(700);
console.log('FROM value:', await p.$eval('#fromInput', e=>e.value));
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(2000);
const r = await p.evaluate(() => {
  const a = window.__gw;
  return { from: a.state.from?.label, to: a.state.to?.label, chosenIdx: a.state.chosen,
    opts: a.state.options?.map(o=>({label:o.label,km:+(o.distance/1000).toFixed(1),cam:o.cameras,hw:+(o.highwayKm||0).toFixed(1)})) };
});
console.log(JSON.stringify(r, null, 2));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
