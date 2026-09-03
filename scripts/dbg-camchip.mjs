import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 150s'); process.exit(2); }, 150000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
p.on('pageerror', (e) => console.log('PAGEERR', String(e.message)));
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded','1'); window.__gps={handlers:[]}; const mock={getCurrentPosition:(cb)=>cb({coords:{longitude:-111.759,latitude:40.364,speed:0}}),watchPosition:(cb)=>{window.__gps.handlers.push(cb);return 0;},clearWatch:()=>{}}; Object.defineProperty(navigator,'geolocation',{value:mock,configurable:true}); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(sel,q){ await p.type(sel,q); try{ await p.waitForSelector('#suggestions .sugg',{timeout:8000}); await p.click('#suggestions .sugg'); }catch{ await p.focus(sel); await p.keyboard.press('Enter'); } await wait(500); }
await pick('#toInput','Costco Lehi');
await pick('#fromInput','Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
const pre = await p.evaluate(() => {
  const a = window.__gw;
  return { opts: a.state.options?.map(o=>({label:o.label,cam:o.cameras,cp:(o.cameraPoints||[]).length})), chosen: a.state.chosen, camPts: a._camPts?.length };
});
console.log('PRE-CLICK:', JSON.stringify(pre));
// click Fastest
const clicked = await p.evaluate(() => { const f=[...document.querySelectorAll('.route-opt')].find(o=>o.textContent.includes('Fastest')); if(f){f.click();return true;} return false; });
console.log('clicked Fastest:', clicked);
await wait(600);
const post = await p.evaluate(() => { const a=window.__gw; return { chosen:a.state.chosen, chosenLabel:a.state.options?.[a.state.chosen]?.label, camPts:a._camPts?.length, hasNavCoords: !!window.__ghostwayNavCoords }; });
console.log('POST-CLICK:', JSON.stringify(post));
const startBtn = await p.$('#startNavBtn');
console.log('startNavBtn exists:', !!startBtn);
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
