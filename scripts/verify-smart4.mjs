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

// Drive the real routing path directly (bypasses the flaky suggestion-dropdown
// click that keeps landing on the wrong field in headless). PG -> Costco Lehi.
await p.evaluate(async () => {
  const gw = window.__gw;
  gw.state.from = { coords: [-111.7448, 40.3642], label: 'Pleasant Grove' };
  gw.state.to = { coords: [-111.8506, 40.3886], label: 'Costco Lehi' };
  // call the real onRoute that runs routeWithFallbacks -> planRoutes -> pickOptionForMode
  await gw.onRoute();
});
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
const r = await p.evaluate(() => {
  const a = window.__gw;
  return {
    from: a.state.from?.label, to: a.state.to?.label,
    chosenIdx: a.state.chosen,
    chosenLabel: a.state.options?.[a.state.chosen]?.label,
    chosenCam: a.state.options?.[a.state.chosen]?.cameras,
    chosenHw: +(a.state.options?.[a.state.chosen]?.highwayKm||0).toFixed(1),
    opts: a.state.options?.map(o=>({label:o.label,km:+(o.distance/1000).toFixed(1),cam:o.cameras,hw:+(o.highwayKm||0).toFixed(1),dur:Math.round(o.duration/60)})),
    badge: document.querySelector('.rc-badge')?.textContent,
  };
});
console.log('FROM:', r.from, '| TO:', r.to);
console.log('CHOSEN DEFAULT:', r.chosenLabel, `(${r.chosenCam} cam, ${r.chosenHw} hw km)`);
console.log('BADGE:', r.badge);
console.log('ALL OPTIONS:'); r.opts.forEach(o=>console.log('  ', o.label.padEnd(10), o.km+'km', o.cam+'cam', o.hw+'hwkm', o.dur+'min'));
console.log('ERRORS:', errs.filter(e=>!/favicon|404/.test(e)).slice(0,5));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
