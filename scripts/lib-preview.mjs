// Shared preview-server bootstrap for the puppeteer suites.
// Spawns `vite preview` on :4173 and POLLS until it accepts connections.
// A fixed sleep is flaky: npx cold-start can exceed it → ERR_CONNECTION_REFUSED
// (the failure class interact-check had before round 22).
import { spawn } from 'node:child_process';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function startPreview({ port = 4173, tries = 40, interval = 500 } = {}) {
  // detached: true → the child gets its own process group, so kill() below can
  // kill the WHOLE tree (npx wrapper + the node/vite grandchild). Killing only
  // the npx wrapper leaks orphan vite servers that squat :4173 across runs.
  const srv = spawn('npx', ['vite', 'preview', '--port', String(port), '--host'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true,
  });
  let up = false;
  for (let i = 0; i < tries && !up; i++) {
    try {
      const res = await fetch(`http://localhost:${port}/`, { method: 'HEAD' });
      up = res.status < 500;
    } catch { await wait(interval); }
  }
  if (!up) {
    killTree(srv);
    throw new Error(`preview server never came up on :${port}`);
  }
  return { srv, url: `http://localhost:${port}/`, kill: () => killTree(srv) };
}

function killTree(srv) {
  try { process.kill(-srv.pid, 'SIGTERM'); } catch { /* already gone */ }
}
