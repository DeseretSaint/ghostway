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

async function setField(sel, q) {
  // focus, select-all, delete, type, then pick the FIRST suggestion that contains the query words
  await p.focus(sel);
  await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
  await p.keyboard.press('Backspace');
  await p.type(sel, q, { delay: 20 });
  await p.waitForSelector('#suggestions .sugg', { timeout: 8000 });
  // pick a suggestion whose text includes the destination token, else first
  const sugg = await p.evaluate((qw) => {
    const items = [...document.querySelectorAll('#suggestions .sugg')];
    const hit = items.find(e => e.textContent.toLowerCase().includes(qw.toLowerCase()));
    return hit ? true : false;
  }, q);
  if (sugg) {
    const items = await p.$$('#suggestions .sugg');
    for (const it of items) {
      const t = await p.evaluate(e=>e.textContent, it);
      if (t.toLowerCase().includes(q.toLowerCase())) { await it.click(); break; }
    }
  } else {
    await p.keyboard.press('Enter');
  }
  await wait(600);
}

await setField('#toInput', 'Costco Lehi');
await wait(300);
await setField('#fromInput', 'Pleasant Grove');
await wait(500);
console.log('FROM:', await p.$eval('#fromInput', e=>e.value), '| TO:', await p.$eval('#toInput', e=>e.value));
// Click Go
const goVisible = await p.$eval('#goBtn', e => { const r = e.getBoundingClientRect(); return r.width>0 && r.height>0; });
if (goVisible) { await p.click('#goBtn'); }
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
const r = await p.evaluate(() => {
  const a = window.__gw;
  return { from: a.state.from?.label, to: a.state.to?.label, chosenIdx: a.state.chosen,
    chosenLabel: a.state.options?.[a.state.chosen]?.label, chosenCam: a.state.options?.[a.state.chosen]?.cameras,
    chosenHw: +(a.state.options?.[a.state.chosen]?.highwayKm||0).toFixed(1),
    opts: a.state.options?.map(o=>({label:o.label,km:+(o.distance/1000).toFixed(1),cam:o.cameras,hw:+(o.highwayKm||0).toFixed(1),dur:Math.round(o.duration/60)})),
    badge: document.querySelector('.rc-badge')?.textContent };
});
console.log('CHOSEN DEFAULT:', r.chosenLabel, `(${r.chosenCam} cam, ${r.chosenHw} hw km)`);
console.log('BADGE:', r.badge);
r.opts.forEach(o=>console.log('  ', o.label.padEnd(10), o.km+'km', o.cam+'cam', o.hw+'hwkm', o.dur+'min'));
console.log('ERRORS:', errs.filter(e=>!/favicon|404/.test(e)).slice(0,5));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
