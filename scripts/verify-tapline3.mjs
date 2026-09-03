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
async function setField(sel, q) {
  await p.focus(sel);
  await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  await p.type(sel, q, { delay: 20 });
  await p.waitForSelector('#suggestions .sugg', { timeout: 8000 });
  const items = await p.$$('#suggestions .sugg');
  for (const it of items) { const t = await p.evaluate(e=>e.textContent, it); if (t.toLowerCase().includes(q.toLowerCase())) { await it.click(); break; } }
  await wait(600);
}
await setField('#toInput', 'Costco Lehi');
await wait(300); await setField('#fromInput', 'Pleasant Grove'); await wait(500);
const goVisible = await p.$eval('#goBtn', e => { const r = e.getBoundingClientRect(); return r.width>0 && r.height>0; });
if (goVisible) await p.click('#goBtn');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
// Instrument: log what queryRenderedFeatures returns at a visible alt point + manually fire selectOption
const dbg = await p.evaluate(() => {
  const m = window.__gw.map.map;
  const a = window.__gw;
  const panel = document.querySelector('#panel').getBoundingClientRect();
  const altIdx = a.state.chosen === 0 ? 1 : 0;
  const alt = a.state.options[altIdx];
  let best=null;
  for (let i=0;i<alt.coords.length;i+=3){ const px=m.project(alt.coords[i]); if(px.y>80&&px.y<panel.top-10){best={x:px.x,y:px.y,i};break;} }
  if(!best) return {found:false};
  const feats = m.queryRenderedFeatures([[best.x-3,best.y-3],[best.x+3,best.y+3]],{layers:['route-line']});
  return { found:true, pt:best, optIndexes: feats.map(f=>f.properties.optIndex), nFeats: feats.length };
});
console.log('DEBUG:', JSON.stringify(dbg));
// Try calling selectOption directly to confirm it works
const direct = await p.evaluate(() => { const a=window.__gw; const altIdx=a.state.chosen===0?1:0; a.selectOption(altIdx); return {chosen:a.state.chosen,label:a.state.options?.[a.state.chosen]?.label}; });
console.log('DIRECT selectOption:', JSON.stringify(direct));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
