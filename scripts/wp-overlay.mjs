import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 120s'); process.exit(2); }, 120000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(sel, q) { await p.type(sel, q); try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); } catch { await p.focus(sel); await p.keyboard.press('Enter'); } await wait(500); }
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
const dump = await p.evaluate(() => {
  const handle = window.__gw.map.map.project(window.__gw.map.map.getSource('waypoint')._data.features[0].geometry.coordinates);
  const cx = handle.x, cy = handle.y;
  // what element is at that point (DOM)?
  const el = document.elementFromPoint(cx, cy);
  // climb to see id/class
  const chain = [];
  let e = el;
  for (let i=0; i<6 && e; i++) { chain.push((e.id?('#'+e.id):'') + (e.className && e.className.baseVal!==undefined?('.'+e.className.baseVal):(typeof e.className==='string'?'.'+e.className.split(' ').join('.'):'')) || e.tagName); e = e.parentElement; }
  // canvas pointer-events?
  const canvas = window.__gw.map.map.getCanvas();
  const cs = getComputedStyle(canvas);
  return { cx, cy, topEl: chain[0], chain, canvasPointerEvents: cs.pointerEvents, canvasZ: cs.zIndex, canvasPosition: cs.position };
});
console.log(JSON.stringify(dump, null, 2));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
