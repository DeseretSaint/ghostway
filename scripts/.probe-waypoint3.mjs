// slot-C probe: localize waypoint drag no-commit after round-82 occlusion fix
// Boot pattern copied verbatim from waypoint-check.mjs (the known-good harness).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const pv = await startPreview();
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.message)));
await p.evaluateOnNewDocument(() => { localStorage.setItem('gw-onboarded', '1'); });
await p.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 60000 });
await p.waitForFunction('window.__gw !== undefined', { timeout: 45000 });

async function pick(inputSel, query) {
  await p.type(inputSel, query);
  try {
    await p.waitForFunction(
      () =>
        !document.querySelector('#suggestions .sugg-loading') &&
        !!document.querySelector('#suggestions .sugg:not(.sugg-recent)'),
      { timeout: 12000 }
    );
    await p.click('#suggestions .sugg:not(.sugg-recent)');
  } catch { await p.focus(inputSel); await p.keyboard.press('Enter'); }
  await wait(500);
}
await pick('#toInput', 'Costco Lehi');
await pick('#fromInput', 'Pleasant Grove Utah');
await p.waitForFunction('window.__ghostwayDebug?.routed === true', { timeout: 40000 });
await wait(1200);

const info = await p.evaluate(() => {
  const m = window.__gw.map.map;
  const src = m.getSource('waypoint');
  const feats = src && src._data ? src._data.features : [];
  const c = feats[0] && feats[0].geometry.coordinates;
  const px = c ? m.project(c) : null;
  const panel = document.querySelector('#panel');
  const pr = panel ? panel.getBoundingClientRect() : null;
  const hit = px ? document.elementFromPoint(px.x, px.y) : null;
  const layers = px ? m.queryRenderedFeatures([px.x, px.y]).map((f) => f.layer && f.layer.id) : [];
  return {
    count: feats.length, coords: c, pos: px && { x: px.x, y: px.y },
    panelTop: pr && pr.top, panelH: pr && pr.height,
    hitTag: hit && hit.tagName, hitId: hit && hit.id,
    hitCls: hit && (typeof hit.className === 'string' ? hit.className : hit.className.baseVal),
    layersAtPoint: layers,
  };
});
console.log('PRE-DRAG', JSON.stringify(info));

if (info.pos) {
  await p.mouse.move(info.pos.x, info.pos.y);
  await wait(200);
  await p.mouse.down();
  await p.mouse.move(info.pos.x + 50, info.pos.y, { steps: 5 });
  await p.mouse.move(info.pos.x + 110, info.pos.y, { steps: 5 });
  await wait(200);
  const mid = await p.evaluate(() => ({ dragging: window.__gw.map.map._wpDragging ?? null }));
  console.log('MID-DRAG', JSON.stringify(mid));
  await p.mouse.up();
  await wait(2500);
  const post = await p.evaluate(() => ({
    viaRoute: window.__ghostwayDebug?.viaRoute ?? null,
    viaSource: window.__ghostwayDebug?.viaSource ?? null,
    wp: window.__gw.state.waypoint,
  }));
  console.log('POST-DRAG', JSON.stringify(post));
}
console.log('ERRS', JSON.stringify(errs.slice(0, 3)));
pv.kill();
try { await Promise.race([b.close(), wait(4000)]); } catch {}
process.exit(0);
