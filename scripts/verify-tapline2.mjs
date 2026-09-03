import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.error('WATCHDOG 150s'); process.exit(2); }, 150000).unref();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = []; p.on('pageerror', (e) => errs.push(String(e.message)));
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
await wait(300);
await setField('#fromInput', 'Pleasant Grove');
await wait(500);
const goVisible = await p.$eval('#goBtn', e => { const r = e.getBoundingClientRect(); return r.width>0 && r.height>0; });
if (goVisible) await p.click('#goBtn');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1500);
// Find a visible on-map point: iterate the chosen route coords, project, pick one
// whose screen-y is in the lower 60% of the viewport (not under the panel).
const plan = await p.evaluate(() => {
  const m = window.__gw.map.map;
  const a = window.__gw;
  const panel = document.querySelector('#panel').getBoundingClientRect();
  const altIdx = a.state.chosen === 0 ? 1 : 0;
  const alt = a.state.options[altIdx];
  let best = null;
  for (let i = 0; i < alt.coords.length; i += 3) {
    const px = m.project(alt.coords[i]);
    if (px.y > 80 && px.y < panel.top - 10 && px.x > 10 && px.x < window.innerWidth - 10) {
      best = { x: px.x, y: px.y, i }; break;
    }
  }
  return { altIdx, best, panelBottom: panel.bottom, chosenBefore: a.state.chosen };
});
console.log('panelBottom:', plan.panelBottom, '| visible pt:', JSON.stringify(plan.best), '| chosenBefore=', plan.chosenBefore);
if (plan.best) {
  await p.mouse.click(plan.best.x, plan.best.y);
  await wait(800);
  const after = await p.evaluate(() => ({ chosen: window.__gw.state.chosen, label: window.__gw.state.options?.[window.__gw.state.chosen]?.label }));
  console.log('chosenAfter:', after.chosen, '|', after.label, '|', after.chosen === plan.altIdx ? 'PASS ✅' : 'FAIL ❌');
} else {
  console.log('NO visible point found (route fully under panel) — cannot tap-test');
}
console.log('ERRORS:', errs.slice(0,3));
try { await Promise.race([b.close(), wait(5000)]); } catch {}
process.exit(0);
