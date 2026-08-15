import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const p = await b.newPage();
// iPhone-ish portrait.
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const reqs = [];
const failed = [];
p.on('requestfailed', (r) => failed.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));
p.on('response', (r) => {
  if (r.status() >= 400) reqs.push(r.status() + ' ' + r.url());
});
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await p.goto('https://deseretsaint.github.io/ghostway/', { waitUntil: 'networkidle2', timeout: 60000 });
await wait(5000);

const diag = await p.evaluate(() => {
  const map = document.querySelector('#map');
  const canvas = map?.querySelector('canvas');
  const r = map?.getBoundingClientRect();
  return {
    mapExists: !!map,
    mapW: r ? Math.round(r.width) : 0,
    mapH: r ? Math.round(r.height) : 0,
    canvasExists: !!canvas,
    canvasW: canvas ? canvas.width : 0,
    canvasH: canvas ? canvas.height : 0,
    mapStyle: map ? getComputedStyle(map).display : '',
    bodyH: document.body.scrollHeight,
  };
});
await p.screenshot({ path: 'mobile-shot.png' });
console.log('DIAG', JSON.stringify(diag, null, 1));
console.log('ERRORS', errs.slice(0, 6));
console.log('FAILED REQ', failed.slice(0, 8));
console.log('4xx', reqs.slice(0, 8));
await b.close();
