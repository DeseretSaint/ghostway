// PWA lifecycle: registration, update-notification UX (Q230/Q100), and the
// buggy-SW escape hatch.
//
// Q230 recipe: detect via updatefound + statechange, show a dismissible
// bottom-anchored toast, skipWaiting + controllerchange reload BEFORE serving
// the new version, poll for updates every 30-60 min, and keep an unregister()
// escape hatch. (Q100: never silently swap a waiting SW under someone's work.)
//
// Note on "serve sw.js with no-cache headers" (Q230 rule 5): GitHub Pages
// controls response headers and won't let us set them — the 45-min update poll
// + visibilitychange check covers the staleness that header would prevent.

const POLL_MS = 45 * 60 * 1000; // Q230: 30-60 min

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  // Escape hatch (Q230 rule 6): ?sw-reset unregisters every worker, clears
  // caches, and reloads — recovery when a bad SW bricks the shell.
  if (new URLSearchParams(location.search).has('sw-reset')) {
    unregisterSW();
    return;
  }

  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  // Reload exactly once when a NEW worker takes control (after the user taps
  // Refresh). First installs also fire controllerchange via clients.claim() —
  // those must NOT reload.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    location.reload();
  });

  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      // A waiting worker from a previous session (toast dismissed earlier).
      if (reg.waiting && hadController) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          // 'installed' with an existing controller = an update is waiting.
          if (sw.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(sw);
        });
      });
      const poll = () => reg.update().catch(() => {});
      setInterval(poll, POLL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') poll();
      });
    })
    .catch((err) => console.warn('SW registration failed:', err));
}

// Dismissible, bottom-anchored update toast. Dismissing defers the update to
// the next launch (the waiting worker activates when this session ends).
function promptUpdate(waiting) {
  if (document.getElementById('swUpdateToast')) return;
  const toast = document.createElement('div');
  toast.id = 'swUpdateToast';
  toast.className = 'sw-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML =
    '<span class="sw-toast-msg">A new version of Ghostway is ready.</span>' +
    '<button id="swUpdateRefresh" class="primary-btn sw-toast-refresh">Refresh</button>' +
    '<button id="swUpdateDismiss" class="sw-toast-dismiss" aria-label="Dismiss update notice">×</button>';
  document.body.appendChild(toast);
  toast.querySelector('#swUpdateRefresh').addEventListener('click', () => {
    waiting.postMessage({ type: 'SKIP_WAITING' }); // controllerchange reloads
  });
  toast.querySelector('#swUpdateDismiss').addEventListener('click', () => toast.remove());
}

// Escape hatch implementation: drop every worker + cache, then reload clean.
export async function unregisterSW() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* best effort — reload regardless */
  }
  try {
    sessionStorage.setItem('gw-sw-reset', String(Date.now()));
  } catch { /* private mode */ }
  // Strip ?sw-reset before reloading, or the hatch loops forever on this URL.
  history.replaceState(null, '', location.pathname + location.hash);
  location.reload();
}
