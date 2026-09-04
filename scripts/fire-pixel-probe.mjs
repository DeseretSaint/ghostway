// Minimal PNG decoder to read pixel RGB values from saved nav-banner screenshots
// Verifies: (1) light vs dark theme actually rendered, (2) banner bg color, (3) chip text contrast.
import fs from 'node:fs';
import zlib from 'node:zlib';

function decodePNG(buf) {
  if (buf[0] !== 0x89 || buf[1] !== 0x50) throw new Error('not PNG');
  let off = 8;
  let width=0, height=0, bitDepth=0, colorType=0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); off += 4;
    const type = buf.toString('ascii', off, off+4); off += 4;
    const data = buf.subarray(off, off+len); off += len;
    off += 4; // crc
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
  }
  if (colorType !== 2 && colorType !== 6) throw new Error('unsupported color type ' + colorType);
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 3);
  let p = 0, prev = Buffer.alloc(stride);
  for (let y=0; y<height; y++) {
    const filter = raw[p++];
    const row = Buffer.alloc(stride);
    for (let i=0; i<stride; i++) row[i] = raw[p++];
    // Apply filter
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

// WCAG contrast
function lum(r,g,b) {
  const c = [r,g,b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
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

// Find dominant banner bg color (sample strip top 100px)
function bannerBg(img) {
  // Sample center column from y=5 to y=100, average
  let r=0,g=0,b=0,n=0;
  for (let y=5; y<100; y++) {
    for (let x=Math.floor(img.width*0.3); x<Math.floor(img.width*0.6); x++) {
      const [rr,gg,bb] = rgbAt(img,x,y);
      r+=rr; g+=gg; b+=bb; n++;
    }
  }
  return [r/n|0, g/n|0, b/n|0];
}

// Find chip bg + text (sample top-right region where chip sits)
function chipSamples(img) {
  // Chip area roughly at 80-95% of width, y=20-80
  // Get darkest and lightest pixel in that region
  let darkest = [255,255,255, 0,0]; // r,g,b, x, y
  let lightest = [0,0,0, 0,0];
  for (let y=20; y<90; y++) {
    for (let x=Math.floor(img.width*0.75); x<Math.floor(img.width*0.95); x++) {
      const [r,g,b] = rgbAt(img,x,y);
      const L = lum(r,g,b);
      if (L < lum(darkest[0],darkest[1],darkest[2])) darkest = [r,g,b,x,y];
      if (L > lum(lightest[0],lightest[1],lightest[2])) lightest = [r,g,b,x,y];
    }
  }
  return { darkest, lightest };
}

for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f);
  const img = decodePNG(buf);
  const bg = bannerBg(img);
  const { darkest, lightest } = chipSamples(img);
  const darkIsText = lum(lightest[0],lightest[1],lightest[2]) > lum(darkest[0],darkest[1],darkest[2]);
  const text = darkIsText ? lightest : darkest;
  const chipBg = darkIsText ? darkest : lightest;
  // Sample chip area avg for chip bg candidate
  const ratioVal = ratio(text[0],text[1],text[2], chipBg[0],chipBg[1],chipBg[2]);
  const bgHex = '#' + bg.map(v=>v.toString(16).padStart(2,'0')).join('');
  const textHex = '#' + text.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
  const chipHex = '#' + chipBg.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');
  console.log(`\n=== ${f.split('/').pop()} (${img.width}x${img.height}) ===`);
  console.log(`  banner-bg avg  rgb(${bg.join(',')})  ${bgHex}`);
  console.log(`  chip text      rgb(${text.slice(0,3).join(',')})  ${textHex}  (at ${text[3]},${text[4]})`);
  console.log(`  chip bg        rgb(${chipBg.slice(0,3).join(',')})  ${chipHex}  (at ${chipBg[3]},${chipBg[4]})`);
  console.log(`  chip contrast  ${ratioVal.toFixed(2)}:1  ${ratioVal>=7?'AAA':ratioVal>=4.5?'AA':'FAIL'}`);
  // Body bg (mid-screen)
  const body = rgbAt(img, img.width/2|0, img.height/2|0);
  const bodyHex = '#' + body.map(v=>v.toString(16).padStart(2,'0')).join('');
  console.log(`  body mid       rgb(${body.join(',')})  ${bodyHex}  (sampled at center)`);
}
