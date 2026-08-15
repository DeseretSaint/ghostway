// Register the service worker (PWA).
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('./sw.js')
    .catch((err) => console.warn('SW registration failed:', err));
}
