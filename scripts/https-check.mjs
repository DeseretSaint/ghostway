import { spawn } from 'node:child_process';
import https from 'node:https';
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Watchdog: browser.close() can hang forever under swiftshader/headless Chrome.
// If anything wedges, force-exit with a distinct code instead of hanging CI/cron.
setTimeout(() => { console.error('WATCHDOG: 150s timeout — force exit'); process.exit(2); }, 150000).unref();

// Wait for :4173 to be FREE first — if a previous suite's preview was just
// killed, the socket can still be bound and serve-https crashes EADDRINUSE
// (silently, with stdio ignore). Connection-refused = free.
const portFree = () => new Promise((res) => {
  const req = https.get('https://localhost:4173/', { rejectUnauthorized: false }, (r) => { r.resume(); res(false); });
  req.on('error', (e) => res(e.code === 'ECONNREFUSED' || e.code === 'ECONNRESET'));
  req.setTimeout(1500, () => { req.destroy(); res(false); });
});
for (let i = 0; i < 20; i++) { if (await portFree()) break; await wait(500); }

// PORT is pinned: serve-https.mjs honors process.env.PORT, and cron shells can
// export PORT for unrelated services (observed PORT=3999 → EADDRINUSE crash).
const srv = spawn('node', ['scripts/serve-https.mjs'], { cwd: process.cwd(), stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, PORT: '4173' } });
let srvErr = '';
srv.stderr.on('data', (d) => { srvErr += String(d); });
// Poll until the HTTPS server accepts connections (fixed 2.5s sleep was the same
// flaky class round 22/23 removed: cold-start can exceed it → ERR_CONNECTION_REFUSED).
const probe = () => new Promise((res) => {
  const req = https.get('https://localhost:4173/', { rejectUnauthorized: false }, (r) => { r.resume(); res(true); });
  req.on('error', () => res(false));
  req.setTimeout(1500, () => { req.destroy(); res(false); });
});
let up = false;
for (let i = 0; i < 40 && !up; i++) { up = await probe(); if (!up) await wait(500); }
if (!up) { srv.kill('SIGTERM'); console.error('https server never came up on :4173', srvErr.slice(0, 300)); process.exit(1); }
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'] });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('https://localhost:4173/', { waitUntil: 'networkidle2', timeout: 45000 });
// Wait for the app to boot, then POLL for the SW registration instead of a
// fixed sleep: registerSW() fires at the end of wireApp() (after the camera
// fallback fetch), which can exceed a short fixed wait under headless Chrome.
await p.waitForFunction('window.__gw !== undefined', { timeout: 30000 });
const r = await p.evaluate(async () => {
  const waitMs = (ms) => new Promise((res) => setTimeout(res, ms));
  let reg = null;
  for (let i = 0; i < 30 && !reg; i++) { reg = await navigator.serviceWorker.getRegistration(); if (!reg) await waitMs(500); }
  const m = await (await fetch('/manifest.webmanifest')).json();
  return { sw: !!reg, scope: reg?.scope, manifestIcons: (m.icons || []).length, name: m.name };
});
console.log('over HTTPS ->', JSON.stringify(r), 'pageerrors:', errs.slice(0, 3));
const pass = r.sw && r.manifestIcons >= 1;
try { await Promise.race([b.close(), wait(5000)]); } catch {}
srv.kill('SIGTERM');
console.log(pass ? 'HTTPS PWA PASS ✅' : 'HTTPS PWA FAIL ❌');
process.exit(pass ? 0 : 1);
