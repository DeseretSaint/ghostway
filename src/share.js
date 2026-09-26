// Share routes: URL-as-state (Q119 deep links) + QR code (Q121 recipe).
// The QR encoder is a lazy chunk — the main bundle stays inside its gz budget
// and the encoder only ships to users who actually open the share sheet.

const MODES = ['strict', 'moderate', 'off'];

// Share URL for the current route state: ?from=lon,lat&to=lon,lat&mode=…
export function getShareUrl({ from, to, mode }) {
  const p = new URLSearchParams();
  if (from && from.coords) p.set('from', `${from.coords[0]},${from.coords[1]}`);
  if (to && to.coords) p.set('to', `${to.coords[0]},${to.coords[1]}`);
  p.set('mode', MODES.includes(mode) ? mode : 'strict');
  return `${location.origin}${location.pathname}?${p.toString()}`;
}

// Boot-time deep-link parse. Returns { from, to, mode } or null. Coordinates
// are strictly validated (numbers, in range) — everything else is ignored.
export function applyShareParams() {
  const p = new URLSearchParams(location.search);
  const parse = (s) => {
    if (!s) return null;
    const [lon, lat] = s.split(',').map(Number);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return null;
    return [lon, lat];
  };
  const fromC = parse(p.get('from'));
  const toC = parse(p.get('to'));
  if (!fromC && !toC) return null;
  const label = (c) => `Shared point (${c[1].toFixed(4)}, ${c[0].toFixed(4)})`;
  return {
    from: fromC ? { coords: fromC, label: label(fromC) } : null,
    to: toC ? { coords: toC, label: label(toC) } : null,
    mode: MODES.includes(p.get('mode')) ? p.get('mode') : null,
  };
}

// Render the route link as a QR onto a canvas. Q121 recipe: dark-on-light
// (ISO PCS 0.6 reflectance floor — NOT a WCAG ratio), 4-module quiet zone,
// ECC-H (tolerates screen glare/scanning damage in the field).
export async function renderShareQr(canvas, text) {
  const mod = await import('qrcode-generator');
  const qrcode = mod.default || mod;
  const qr = qrcode(0, 'H'); // type 0 = smallest fit
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const quiet = 4;
  const scale = 6;
  const size = (n + quiet * 2) * scale;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f6f7';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#0d0d0d';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
  }
}
