// Live-ETA soft-update visual audit (fire bot #4 — commit 9e9921b).
// Captures the route card before/after 3 successive ETA recomputes at
// increasing distance offsets along the PG→Lehi corridor.
//
// Verifies with pixels: ETA numbers change, button identity preserved,
// no card re-render flash, glanceability preserved.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP_URL = 'http://localhost:4173/';
const OUT = new URL('../ux-shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const viewports = [
  { name: 'mobile-390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile-375', width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'desktop-1440', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];

const b = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const summary = [];

for (const vp of viewports) {
  const p = await b.newPage();
  p.on('pageerror', (e) => console.error(`[${vp.name}] pageerror`, e.message));
  await p.setViewport(vp);
  await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
  await p.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

  // Drive PG → Costco Lehi (same as eta-recompute-check.mjs)
  await p.evaluate(() => {
    const app = window.__gw;
    app.state.from = { coords: [-111.759, 40.364], label: 'Pleasant Grove, UT' };
    app.state.to = { coords: [-111.834, 40.394], label: 'Costco, Lehi' };
    document.querySelector('#fromInput').value = 'Pleasant Grove, UT';
    document.querySelector('#toInput').value = 'Costco, Lehi';
    document.querySelector('#route-actions').hidden = false;
  });
  await p.waitForFunction(() => {
    const s = document.querySelector('#splash');
    return !s || s.classList.contains('hidden') || getComputedStyle(s).opacity === '0';
  }, { timeout: 15000 });
  await wait(300);
  await p.click('#goBtn');
  await p.waitForFunction('window.__ghostwayEngine === "ready"', { timeout: 90000 });
  await p.waitForFunction(
    "() => { const c = document.querySelector('#route-card'); return c && !c.hidden && c.querySelectorAll('.route-opt').length >= 2; }",
    { timeout: 60000 }
  );
  await wait(800); // settle paint

  // Capture identity of the option buttons BEFORE any update.
  const before = await p.evaluate(() => {
    const card = document.querySelector('#route-card');
    const buttons = Array.from(card.querySelectorAll('.route-opt'));
    return {
      time: card.querySelector('.rc-time')?.textContent || null,
      dist: card.querySelector('.rc-dist')?.textContent || null,
      arrive: card.querySelector('.rc-arrive')?.textContent || null,
      badge: card.querySelector('.rc-badge')?.textContent || null,
      btnIds: buttons.map((b) => b.outerHTML.length + ':' + (b.querySelector('.opt-label')?.textContent || '')),
      btnDataOpts: buttons.map((b) => b.getAttribute('data-opt')),
    };
  });

  const f1 = `${OUT}2026-09-04-eta-soft-${vp.name}-before.png`;
  await p.screenshot({ path: f1, fullPage: false });
  console.log(`[${vp.name}] saved ${f1}`, before.time, before.dist);

  // 3 successive ETA recomputes at increasing distance offsets.
  const offsets = [
    [-111.7555, 40.3655], // ~350m
    [-111.7485, 40.3685], // ~1.0 km
    [-111.7415, 40.3715], // ~1.7 km
  ];
  const ticks = [];
  let lastBtns = before.btnIds;
  for (let i = 0; i < offsets.length; i++) {
    const after = await p.evaluate(async (coords) => {
      await window.__gw.__gwForceLiveEta(coords);
      await new Promise((r) => setTimeout(r, 200));
      const card = document.querySelector('#route-card');
      const buttons = Array.from(card.querySelectorAll('.route-opt'));
      return {
        time: card.querySelector('.rc-time')?.textContent || null,
        dist: card.querySelector('.rc-dist')?.textContent || null,
        arrive: card.querySelector('.rc-arrive')?.textContent || null,
        badge: card.querySelector('.rc-badge')?.textContent || null,
        btnIds: buttons.map((b) => b.outerHTML.length + ':' + (b.querySelector('.opt-label')?.textContent || '')),
        btnDataOpts: buttons.map((b) => b.getAttribute('data-opt')),
        chosenIdx: buttons.findIndex((b) => b.classList.contains('chosen')),
      };
    }, offsets[i]);
    const fp = `${OUT}2026-09-04-eta-soft-${vp.name}-tick${i + 1}.png`;
    await p.screenshot({ path: fp, fullPage: false });
    const stable = JSON.stringify(after.btnIds) === JSON.stringify(lastBtns);
    ticks.push({ vp: vp.name, i: i + 1, ...after, btnStable: stable, prevTime: before.time });
    lastBtns = after.btnIds;
    console.log(`[${vp.name}] tick ${i + 1} time=${after.time} dist=${after.dist} btnStable=${stable} chosen=${after.chosenIdx}`);
  }

  // One more crop zoomed into the headline area
  const fzoom = `${OUT}2026-09-04-eta-soft-${vp.name}-zoom.png`;
  const cardBox = await p.evaluate(() => {
    const el = document.querySelector('#route-card');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (cardBox) {
    await p.screenshot({
      path: fzoom,
      clip: { x: Math.max(0, cardBox.x), y: Math.max(0, cardBox.y), width: Math.min(cardBox.w, 1200), height: Math.min(cardBox.h, 600) },
    });
  }

  summary.push({ vp: vp.name, before, ticks });
  await p.close();
}

await b.close();

writeFileSync('/tmp/eta-soft-shots.json', JSON.stringify(summary, null, 2));
console.log('\nDONE — wrote /tmp/eta-soft-shots.json');
