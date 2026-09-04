// Detailed grid scan of the banner region to find actual banner boundaries and chip contrast
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

for (const f of process.argv.slice(2)) {
  const img = decodePNG(fs.readFileSync(f));
  console.log(`\n=== ${f.split('/').pop()} (${img.width}x${img.height}) ===`);
  
  // Find banner top: scan y from 0 down, find where color changes from map to banner
  // Map color is ~#dbe9cc (light green) or #0c1f28 (dark teal)
  // Banner in light mode: #e0f2f1 to #f8f9fa gradient
  // Banner in dark mode: #0e2a33 to #0b0f17 gradient
  
  // Scan a vertical line at x=10% to find banner top
  const x10 = (img.width * 0.1)|0;
  let bannerTop = -1;
  for (let y=0; y<200; y++) {
    const [r,g,b] = rgbAt(img, x10, y);
    const L = lum(r,g,b);
    // Banner bg is either very dark (night, L<0.1) or very light (day, L>0.85)
    // Map is medium (L~0.6-0.8)
    if (L > 0.85 || L < 0.15) {
      bannerTop = y;
      break;
    }
  }
  console.log(`  banner-top at x=10%: y=${bannerTop}`);
  
  // Scan horizontal line at bannerTop+30 to find banner left/right edges
  if (bannerTop >= 0) {
    const yMid = bannerTop + 30;
    let leftEdge = -1, rightEdge = -1;
    for (let x=0; x<img.width; x++) {
      const [r,g,b] = rgbAt(img, x, yMid);
      const L = lum(r,g,b);
      if (L > 0.85 || L < 0.15) {
        if (leftEdge < 0) leftEdge = x;
        rightEdge = x;
      }
    }
    console.log(`  banner horizontal span at y=${yMid}: x=${leftEdge} to x=${rightEdge} (width=${rightEdge-leftEdge})`);
    
    // Sample banner bg color at center
    const bannerCenterX = (leftEdge + rightEdge) / 2 | 0;
    const bannerBg = rgbAt(img, bannerCenterX, yMid);
    console.log(`  banner-bg at center: ${hex(bannerBg)} rgb(${bannerBg.join(',')})`);
    
    // Find chip: scan rightmost 20% of banner for high-contrast element
    const chipSearchLeft = (leftEdge + (rightEdge-leftEdge)*0.6)|0;
    const chipSearchRight = rightEdge;
    // Find the chip by looking for a small high-contrast region
    // Chip is typically a pill with dark bg and light text, or light bg and dark text
    let bestChipBg = null, bestChipText = null, bestChipContrast = 0;
    
    // Sample a grid in the chip search area
    for (let y=bannerTop+10; y<bannerTop+80; y++) {
      for (let x=chipSearchLeft; x<chipSearchRight; x += 5) {
        const [r,g,b] = rgbAt(img, x, y);
        const L = lum(r,g,b);
        // Look for a pixel that's very different from banner bg
        const bgL = lum(bannerBg[0],bannerBg[1],bannerBg[2]);
        if (Math.abs(L - bgL) > 0.3) {
          // This might be the chip - sample a small block around it
          let sr=0,sg=0,sb=0,sn=0;
          for (let dy=-10; dy<=10; dy++) {
            for (let dx=-15; dx<=15; dx++) {
              const nx=x+dx, ny=y+dy;
              if (nx>=0 && nx<img.width && ny>=0 && ny<img.height) {
                const [rr,gg,bb] = rgbAt(img, nx, ny);
                sr+=rr; sg+=gg; sb+=bb; sn++;
              }
            }
          }
          const avg = [(sr/sn)|0,(sg/sn)|0,(sb/sn)|0];
          const avgL = lum(avg[0],avg[1],avg[2]);
          const contrast = ratio(avg[0],avg[1],avg[2], bannerBg[0],bannerBg[1],bannerBg[2]);
          if (contrast > bestChipContrast && sn > 100) {
            bestChipContrast = contrast;
            bestChipBg = avg;
            // Find the most contrasting pixel in the block for text color
            let maxDiff = 0;
            for (let dy=-10; dy<=10; dy++) {
              for (let dx=-15; dx<=15; dx++) {
                const nx=x+dx, ny=y+dy;
                if (nx>=0 && nx<img.width && ny>=0 && ny<img.height) {
                  const [rr,gg,bb] = rgbAt(img, nx, ny);
                  const d = ratio(rr,gg,bb, avg[0],avg[1],avg[2]);
                  if (d > maxDiff) { maxDiff = d; bestChipText = [rr,gg,bb]; }
                }
              }
            }
          }
        }
      }
    }
    
    if (bestChipBg) {
      console.log(`  chip-bg (best): ${hex(bestChipBg)} rgb(${bestChipBg.join(',')})`);
      console.log(`  chip-text: ${hex(bestChipText)} rgb(${bestChipText.join(',')})`);
      console.log(`  chip contrast vs bg: ${ratio(bestChipText[0],bestChipText[1],bestChipText[2], bestChipBg[0],bestChipBg[1],bestChipBg[2]).toFixed(2)}:1`);
      console.log(`  chip contrast vs banner: ${bestChipContrast.toFixed(2)}:1`);
    } else {
      console.log(`  no chip found in search area`);
    }
    
    // Also sample the distance text area (left side of banner)
    const distX = (leftEdge + (rightEdge-leftEdge)*0.15)|0;
    const distY = bannerTop + 35;
    const distBg = rgbAt(img, distX, distY);
    console.log(`  dist-text area at (${distX},${distY}): ${hex(distBg)} rgb(${distBg.join(',')})`);
  }
}
