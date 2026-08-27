import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 120s'); process.exit(2); }, 120000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
p.on('pageerror', (e) => console.log('PAGEERROR:', String(e.message).slice(0,300)));
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });
async function pick(sel, q) { await p.type(sel, q); try { await p.waitForSelector('#suggestions .sugg', { timeout: 8000 }); await p.click('#suggestions .sugg'); } catch { await p.focus(sel); await p.keyboard.press('Enter'); } await wait(500); }
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
const info = await p.evaluate(() => {
  const m = window.__gw.map.map;
  const out = {};
  out.dotLayerExists = !!m.getLayer('waypoint-dot');
  out.haloLayerExists = !!m.getLayer('waypoint-halo');
  if (out.dotLayerExists) {
    const l = m.getLayer('waypoint-dot');
    out.dotVisibility = l.visibility;
    out.dotPaint = l.paint;
  }
  // all waypoint-related layers in style order
  out.styleLayers = m.getStyle().layers.filter(l => /waypoint|route/.test(l.id)).map(l => l.id);
  // source features
  const sf = m.querySourceFeatures('waypoint');
  out.sourceFeatureCount = sf.length;
  return out;
});
console.log(JSON.stringify(info, null, 2));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
