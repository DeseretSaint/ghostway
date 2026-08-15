// Minimal static HTTPS server for Ghostway (local / private testing).
// Serves the built dist/ folder over HTTPS so the PWA can be installed and
// geolocation works. Bind to 0.0.0.0 so other devices on your Tailscale
// network can reach it.
import { createServer } from 'node:https';
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 4173;

const key = readFileSync(join(__dirname, '..', 'certs', 'key.pem'));
const cert = readFileSync(join(__dirname, '..', 'certs', 'cert.pem'));

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.pbf': 'application/octet-stream',
};

const server = createServer(
  {
    key,
    cert,
  },
  (req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url.endsWith('/')) url += 'index.html';
    const path = normalize(join(ROOT, url));
    if (!path.startsWith(ROOT) || !existsSync(path) || !statSync(path).isFile()) {
      // SPA fallback to index.html for unknown non-asset routes.
      const fallback = join(ROOT, 'index.html');
      if (existsSync(fallback)) {
        res.writeHead(200, { 'content-type': 'text/html' });
        createReadStream(fallback).pipe(res);
        return;
      }
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    createReadStream(path).pipe(res);
  }
);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ghostway served at https://0.0.0.0:${PORT} (${ROOT})`);
  console.log('For your phone: open https://<this-machine-tailscale-ip>:4173');
});
