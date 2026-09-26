// Q90 feedback channel (adapted): no server-side form exists, so feedback is a
// prefilled GitHub issue (no key, no account in the APP). Asserts the drawer
// item opens the sheet and the issue link is correctly shaped with the
// prefilled body (which must carry no user data).
import { startPreview } from './lib-preview.mjs';
import puppeteer from 'puppeteer-core';

const WATCHDOG = setTimeout(() => { console.error('watchdog exit'); process.exit(2); }, 150000);
const { url, kill } = await startPreview();
let browser;
try {
  browser = await puppeteer.launch({ executablePath: process.env.GW_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('#splash.leaving, #topbar', { timeout: 15000 });
  await page.evaluate(() => localStorage.setItem('gw-onboarded', '1'));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => (document.getElementById('status')?.textContent || '').includes('Tap the locate button'), { timeout: 15000 });

  await page.click('#menuBtn');
  await page.waitForSelector('[data-action="feedback"]', { visible: true, timeout: 5000 });
  await new Promise(r => setTimeout(r, 300)); // drawer slide-in settles
  await page.click('[data-action="feedback"]');
  await page.waitForSelector('#feedbackIssue', { visible: true, timeout: 5000 });
  const sheet = await page.evaluate(() => {
    const a = document.getElementById('feedbackIssue');
    return {
      href: a.getAttribute('href'),
      target: a.target,
      rel: a.getAttribute('rel') || '',
      browse: [...document.querySelectorAll('.modal-card a')].some(x => /\/issues$/.test(new URL(x.href).pathname)),
      hasForm: !!document.querySelector('.modal-card form'),
    };
  });

  const u = new URL(sheet.href);
  const body = u.searchParams.get('body') || '';
  const checks = {
    issueNewPath: u.origin === 'https://github.com' && /\/DeseretSaint\/ghostway\/issues\/new$/.test(u.pathname),
    bodyPrefilled: /Describe the bug or feature request/.test(body),
    bodyNoUserData: !/@|from=|to=/.test(body), // template only — no route/user data
    opensNewTab: sheet.target === '_blank' && /noopener/.test(sheet.rel || ''),
    browseLink: sheet.browse,
    noFormPosts: !sheet.hasForm, // Q90 honeypot N/A until a form endpoint exists
    zeroPageErrors: errors.length === 0,
  };
  console.log(JSON.stringify({ href: sheet.href.slice(0, 80), bodyLen: body.length, checks }, null, 2));
  const fail = Object.entries(checks).filter(([, v]) => !v);
  if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
  console.log('FEEDBACK CHANNEL PASS ✅');
} finally {
  clearTimeout(WATCHDOG);
  if (browser) await browser.close();
  await kill();
}
