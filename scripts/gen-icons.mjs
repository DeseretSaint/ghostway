// Rasterize public/icon-base.svg into installable PNG icons via headless Chrome.
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SVG = join(__dirname, '..', 'public', 'icon-base.svg');
const OUT = join(__dirname, '..', 'public', 'icons');
const fs = await import('node:fs/promises');
await fs.mkdir(OUT, { recursive: true });

async function shot(size, file) {
  const b = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const p = await b.newPage();
  await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await p.goto('file://' + SVG);
  await p.screenshot({ path: join(OUT, file) });
  await b.close();
  console.log('wrote', file);
}

await shot(512, 'icon-512.png');
await shot(192, 'icon-192.png');
await shot(512, 'icon-maskable-512.png');
