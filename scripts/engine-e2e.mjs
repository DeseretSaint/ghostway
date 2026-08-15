// End-to-end: engine integration over the real built app (vite preview).
// 1. Graph loads (window.__ghostwayEngine === 'ready')
// 2. Route PG → Lehi Costco via search + real clicks
// 3. Route-options card renders with ≥2 options + camera counts
// 4. Clicking an alternate option re-draws (hit-tested)
// 5. Mode switch Strict re-routes and avoids ≥ as many cameras
// 6. Start navigation banner shows (hit-tested)
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

// Returning user: skip first-run onboarding overlay.
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });

// Wait for engine graph to load.
await p.waitForFunction('window.__ghostwayEngine !== undefined', { timeout: 45000 });
const engine = await p.evaluate(() => window.__ghostwayEngine);
console.log('engine status:', engine);

// Real hit-test helper: elementFromPoint at element center.
async function hit(sel) {
  const box = await p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || el.hidden || el.offsetParent === null) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, id: el.id || el.className };
  }, sel);
  if (!box) return null;
  const top = await p.evaluate(({ x, y }) => {
    const t = document.elementFromPoint(x, y);
    return t ? (t.id || t.className || t.tagName) : 'none';
  }, box);
  return top;
}

// Robust pick: wait for a suggestion, else press Enter (commits typed text).
async function pickSuggestion(inputSel, query) {
  await p.type(inputSel, query);
  try {
    await p.waitForSelector('#suggestions .sugg', { timeout: 6000 });
    await p.click('#suggestions .sugg');
  } catch {
    await p.focus(inputSel);
    await p.keyboard.press('Enter');
  }
  await wait(500);
}
await pickSuggestion('#toInput', 'Costco Lehi');
await pickSuggestion('#fromInput', 'Pleasant Grove Utah');

// Real-click the Route button — but only if it's still visible (picking both
// endpoints may have auto-routed already and collapsed the panel).
const goVisible = await p.evaluate(() => {
  const r = document.querySelector('#goBtn').getBoundingClientRect();
  return r.width > 0 && r.height > 0 && !document.querySelector('#route-actions').hidden;
});
if (goVisible) await p.click('#goBtn');
await p.waitForFunction(
  "() => !document.querySelector('#route-card').hidden || document.querySelector('#status')?.textContent?.includes('failed')",
  { timeout: 40000 }
);
const cardText = await p.evaluate(() => document.querySelector('#route-card')?.innerText?.replace(/\s+/g, ' ')?.slice(0, 400) || 'none');
console.log('card:', cardText);

const optCount = await p.evaluate(() => document.querySelectorAll('.route-opt').length);
console.log('options shown:', optCount);

// Hit-test an option + click the non-chosen one.
const optHit = await hit('.route-opt:not(.chosen)');
console.log('option hit:', optHit);
if (optCount >= 2) {
  await p.click('.route-opt:not(.chosen)');
  await wait(800);
  console.log('after switch, chosen label:', await p.evaluate(() => document.querySelector('.route-opt.chosen .opt-label')?.textContent));
}

// Switch to Strict mode and re-route. The mode switch lives behind "Edit route"
// now that the panel collapses after routing.
const editBtn = await p.$('#editRouteBtn');
if (editBtn) {
  await editBtn.click();
  await wait(400);
}
const strictHit = await hit('.mode-btn[data-mode="strict"]');
console.log('strict btn hit:', strictHit);
await p.click('.mode-btn[data-mode="strict"]');
await p.waitForFunction("() => !document.querySelector('#route-card').hidden && document.querySelector('.route-opt.chosen')", { timeout: 30000 });
await wait(1500);
const afterStrict = await p.evaluate(() => {
  const opts = [...document.querySelectorAll('.route-opt .opt-meta')].map((e) => e.textContent);
  return opts;
});
console.log('strict-mode options:', JSON.stringify(afterStrict));

// Start navigation (hit-tested).
const navHit = await hit('#startNavBtn');
console.log('start nav hit:', navHit);
await p.click('#startNavBtn');
await wait(800);
const navShown = await p.evaluate(() => !document.querySelector('#navBanner').hidden);
console.log('nav banner shown:', navShown);
const hasVoiceBtn = await p.evaluate(() => !!document.querySelector('#voiceBtn'));
console.log('voice toggle in banner:', hasVoiceBtn);

await p.screenshot({ path: 'engine-e2e.png' });
console.log('ERRORS', errs.filter((e) => !/favicon|404/.test(e)).slice(0, 5));
await b.close();
