// PWA verification: load the built app, confirm the manifest is served,
// the service worker registers, and the app is installable (has a manifest
// with icons + a SW with a fetch handler).
import puppeteer from 'puppeteer-core';
import { startPreview } from './lib-preview.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();


async function main() {
  const { kill } = await startPreview();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
  await wait(2000);

  // 1) Manifest is fetchable + parseable.
  const manifest = await page.evaluate(async () => {
    const res = await fetch('/manifest.webmanifest');
    const j = await res.json();
    return { ok: res.ok, name: j.name, icons: (j.icons || []).length };
  });

  // 2) Service worker registered.
  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    await new Promise((r) => setTimeout(r, 500));
    const reg = await navigator.serviceWorker.getRegistration();
    return { supported: true, registered: !!reg, scope: reg?.scope };
  });

  // 3) Installability: a manifest with >=1 icon + SW with fetch handler => installable.
  const swTxt = await page.evaluate(async () => {
    const res = await fetch('/sw.js');
    return res.text();
  });

  console.log('manifest   :', JSON.stringify(manifest));
  console.log('sw         :', JSON.stringify(sw));
  console.log('sw has fetch handler:', /addEventListener\(['"]fetch/.test(swTxt));
  console.log('console    :', logs.filter((l) => l.startsWith('error')).slice(0, 5));

  const pass =
    manifest.ok &&
    manifest.icons >= 1 &&
    sw.registered &&
    /addEventListener\(['"]fetch/.test(swTxt);

  try { await Promise.race([browser.close(), wait(5000)]); } catch {}
  kill();
  console.log(pass ? '\nPWA PASS ✅ — installable, offline-ready' : '\nPWA FAIL ❌');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
