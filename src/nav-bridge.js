// Phone→car bridge (Android Auto v2). The native WebView shell exposes
// window.AABridge.navState(json) (MainActivity.addJavascriptInterface); on the
// plain web that object doesn't exist and every push is a silent no-op.
//
// Throttle contract: tick updates (same active state) go out at most once a
// second — the render loop runs far hotter and the car redraws on state, not
// on frame rate. Transitions (startNav / stopNav) ALWAYS flush: the car must
// never miss the switch between turn panel and home screen.
let lastPushAt = 0;
let lastActive = null;

export function pushNavState(state) {
  const bridge = window.AABridge;
  if (!bridge || typeof bridge.navState !== 'function') return;
  const now = Date.now();
  const transition = state.active !== lastActive;
  if (!transition && state.active && now - lastPushAt < 900) return;
  lastActive = state.active;
  lastPushAt = now;
  try {
    bridge.navState(JSON.stringify(state));
  } catch {
    /* bridge torn down mid-push (WebView gone) — nothing to mirror */
  }
}