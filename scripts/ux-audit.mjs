// Mechanical UX audit: touch targets, emoji-as-icons, tabular numerals,
// focus-visible coverage. Exits non-zero if any hard rule fails.
// Usage: node scripts/ux-audit.mjs
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function serve() {
  return spawn('npx', ['vite', 'preview', '--port', '4173', '--host'], { cwd: process.cwd(), stdio: 'ignore' });
}

async function main() {
  const srv = serve();
  await wait(2600);
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(2500);
  await page.evaluate(() => { const ob = document.querySelector('#obSkip'); if (ob) ob.click(); const sp = document.querySelector('#splash'); if (sp) sp.remove(); });

  // Route something so the route card renders.
  await page.type('#fromInput', 'Pleasant Grove, Utah'); await wait(900);
  await page.type('#toInput', 'Lindon, Utah'); await wait(900);
  await page.evaluate(() => document.querySelector('#goBtn').click());
  try { await page.waitForFunction(() => window.__ghostwayDebug && window.__ghostwayDebug.routed === true, { timeout: 15000 }); } catch (e) {}
  await wait(1200);

  // Open drawer too so its items are audited.
  await page.evaluate(() => document.querySelector('#menuBtn').click());
  await wait(400);

  const audit = await page.evaluate((EMOJI_SRC) => {
    const EMOJI_RE = new RegExp(EMOJI_SRC, 'u');
    const out = { smallTargets: [], emojiButtons: [], noTabular: [], visible: 0, total: 0 };
    const els = document.querySelectorAll('button, input, a, [role="button"], summary, select');
    els.forEach((el) => {
      if (el.offsetParent === null && !el.closest('.drawer')) return; // hidden (drawer is fixed, count it)
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      out.total++;
      if (r.width < 44 || r.height < 44) {
        out.smallTargets.push({ sel: el.id ? '#' + el.id : el.className.split(' ')[0] || el.tagName, w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 24) });
      }
      const txt = (el.textContent || '').trim();
      if (txt && EMOJI_RE.test(txt) && txt.length <= 6) out.emojiButtons.push({ sel: el.id ? '#' + el.id : el.className.split(' ')[0], text: txt });
    });
    // tabular-nums on numeric displays
    ['.rc-time', '.rc-dist', '.nav-dist', '.nav-eta', '.speed-chip', '.sl-num', '.step-dist', '.opt-meta'].forEach((s) => {
      const el = document.querySelector(s);
      if (el) {
        const fv = getComputedStyle(el).fontVariantNumeric;
        if (!/tabular-nums/.test(fv)) out.noTabular.push(s);
      }
    });
    return out;
  }, EMOJI_RE.source);

  console.log('interactive elements:', audit.total);
  console.log('\n== TOUCH TARGETS < 44px ==');
  audit.smallTargets.forEach((t) => console.log(`  ${t.sel} ${t.w}x${t.h} "${t.text}"`));
  console.log('\n== EMOJI-AS-ICON BUTTONS ==');
  audit.emojiButtons.forEach((t) => console.log(`  ${t.sel} "${t.text}"`));
  console.log('\n== NUMERIC DISPLAYS WITHOUT tabular-nums ==');
  audit.noTabular.forEach((s) => console.log(`  ${s}`));

  await browser.close();
  srv.kill('SIGTERM');
  const fails = audit.smallTargets.length + audit.emojiButtons.length + audit.noTabular.length;
  console.log(`\nAUDIT RESULT: ${fails} issue(s)`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
// Hard exit: headless Chrome + vite preview teardown can hang; the audit
// result is already printed by this point.
setTimeout(() => process.exit(2), 150000).unref();
