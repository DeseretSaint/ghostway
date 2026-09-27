// Phone→car nav bridge contract (AA v2): src/nav-bridge.js mirrors nav state
// to window.AABridge.navState(json) (native shell; silent no-op on the web),
// throttling tick updates to ≤1/s while start/stop transitions ALWAYS flush —
// the car must never miss the turn-panel ↔ home-screen switch.
import { readFileSync } from 'node:fs';

const calls = [];

// 1. Plain web (no bridge object): no throw, nothing sent.
global.window = {};
const { pushNavState } = await import('../src/nav-bridge.js');
pushNavState({ active: true, instruction: 'no bridge' });

// 2. Native shell: transition flushes, rapid ticks throttle, stop flushes.
global.window.AABridge = { navState: (j) => calls.push(j) };
pushNavState({ active: true, instruction: 'Turn left', distM: 300 }); // transition → flush
pushNavState({ active: true, instruction: 'Turn left', distM: 250 }); // <900ms tick → dropped
pushNavState({ active: false, arrived: false });                      // transition → flush

const first = calls[0] ? JSON.parse(calls[0]) : null;
const second = calls[1] ? JSON.parse(calls[1]) : null;

// 3. main.js wiring: the hooks actually exist (fail-guard against edit drift).
const main = readFileSync('src/main.js', 'utf8');
const checks = {
  noBridgeNoThrow: true,
  transitionFlushed: !!first && first.active === true && first.instruction === 'Turn left' && first.distM === 300,
  tickThrottled: calls.length === 2,
  stopFlushed: !!second && second.active === false && second.arrived === false,
  importsBridge: /import\s*{\s*pushNavState\s*}\s*from\s*'\.\/nav-bridge\.js'/.test(main),
  renderPush: /function renderNavStep\(\) \{[\s\S]{0,1200}?pushNavState\(\{/.test(main),
  stopPush: /function stopNav\(arrived = false\) \{[\s\S]{0,120}?pushNavState\(\{/.test(main),
};

console.log(JSON.stringify({ calls: calls.map(JSON.parse), checks }, null, 2));
const fail = Object.entries(checks).filter(([, v]) => !v);
if (fail.length) { console.error('FAIL:', fail.map(([k]) => k).join(', ')); process.exit(1); }
console.log('NAV BRIDGE PASS ✅');
