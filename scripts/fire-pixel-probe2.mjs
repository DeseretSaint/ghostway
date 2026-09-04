// More precise pixel sampling: examine the very top 0-200px banner region in detail
import fs from 'node:fs';
import zlib from 'node:zlib';

function decodePNG(buf) {
  if (buf[0] !== 0x89) throw new Error('not PNG');
  let off = 8;
  let width=0, height=0, colorType=0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); off += 4;
    const type = buf.toString('ascii', off, off+4); off += 4;
    const data = buf.subarray(off, off+len); off += len;
    off += 4;
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 3);
  let p = 0, prev = Buffer.alloc(stride);
  for (let y=0; y<height; y++) {
    const filter = raw[p++];
    const row = Buffer.alloc(stride);
    for (let i=0; i<stride; i++) row[i] = raw[p++];
    const recon = Buffer.alloc(stride);
    for (let i=0; i<stride; i++) {
      const a = i >= channels ? recon[i-channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i-channels] : 0;
      let v;
      if (filter === 0) v = row[i];
      else if (filter === 1) v = row[i] + a;
      else if (filter === 2) v = row[i] + b;
      else if (filter === 3) v = row[i] + Math.floor((a + b) / 2);
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2*c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        v = row[i] + pr;
      } else throw new Error('filter ' + filter);
      recon[i] = v & 0xff;
    }
    prev = recon;
    for (let i=0; i<width; i++) {
      out[(y*width + i)*3] = recon[i*channels];
      out[(y*width + i)*3+1] = recon[i*channels+1];
      out[(y*width + i)*3+2] = recon[i*channels+2];
    }
  }
  return { width, height, data: out };
}
function lum(r,g,b) {
  const c = [r,g,b].map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2];
}
function ratio(r1,g1,b1, r2,g2,b2) {
  const L1 = lum(r1,g1,b1), L2 = lum(r2,g2,b2);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function rgbAt(img, x, y) {
  const i = (y*img.width + x)*3;
  return [img.data[i], img.data[i+1], img.data[i+2]];
}
function hex(rgb) { return '#' + rgb.map(v=>v.toString(16).padStart(2,'0')).join(''); }
function blockAvg(img, x0, y0, w, h) {
  let r=0,g=0,b=0,n=0;
  for (let y=y0; y<y0+h; y++) for (let x=x0; x<x0+w; x++) {
    const [rr,gg,bb] = rgbAt(img,x,y);
    r+=rr; g+=gg; b+=bb; n++;
  }
  return [(r/n)|0,(g/n)|0,(b/n)|0];
}

for (const f of process.argv.slice(2)) {
  const img = decodePNG(fs.readFileSync(f));
  console.log(`\n=== ${f.split('/').pop()} (${img.width}x${img.height}) ===`);
  // The banner is at the top — sample y=0..100 in 5 horizontal bands
  // Find the topmost "solid" banner band by looking at row variance
  const yBands = [0, 10, 30, 50, 70, 100, 130, 160, 200];
  for (const y of yBands) {
    if (y >= img.height) continue;
    // Sample 5 columns across width
    const cols = [img.width*0.05|0, img.width*0.25|0, img.width*0.5|0, img.width*0.75|0, img.width*0.95|0];
    const samples = cols.map(x => rgbAt(img, x, y));
    const hexes = samples.map(s => hex(s));
    console.log(`  y=${String(y).padStart(3)}  ${hexes.join('  ')}`);
  }
  // Specifically: banner should be a solid horizontal block at top.
  // Sample a 100x50 block at (W*0.3, 10) to get banner bg
  const bannerBg = blockAvg(img, img.width*0.3|0, 10, 100, 50);
  console.log(`  banner-bg-block(${img.width*0.3|0},10,100,50) = ${hex(bannerBg)} rgb(${bannerBg.join(',')})`);
  // Sample the chip text area: try multiple candidate x positions
  for (const xPct of [0.85, 0.80, 0.75, 0.70]) {
    const x = (img.width * xPct)|0;
    const block = blockAvg(img, x-15, 30, 30, 30);
    console.log(`  chip-zone-avg(x=${xPct},y=30) = ${hex(block)} rgb(${block.join(',')})`);
  }
}
