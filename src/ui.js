import { CONFIG } from './config.js';
import { $, el, debounce, escHtml, fmtDistance, fmtDuration, fmtArrive } from './utils.js';
import { searchPlaces } from './search.js';
import { icon, stepIconSvg } from './icons.js';

// Builds the live search panel: typing shows suggestions; selecting fills an endpoint.

function activeInput() {
  return document.activeElement && document.activeElement.id === 'toInput' ? 'to' : 'from';
}

export function buildPanel(app) {
  const fromInput = $('#fromInput');
  const toInput = $('#toInput');
  const box = $('#suggestions');

  // ---- Recent places (Maps-parity quick pick, localStorage-backed) ----
  const RECENT_KEY = 'gw-recent';
  const loadRecents = () => {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      return Array.isArray(list)
        ? list.filter((r) => r && r.name && Array.isArray(r.coords) && r.coords.length === 2)
        : [];
    } catch {
      return [];
    }
  };
  const saveRecent = (place) => {
    const list = loadRecents().filter(
      (r) =>
        !(r.name === place.name && r.coords[0] === place.coords[0] && r.coords[1] === place.coords[1])
    );
    list.unshift({ name: place.name, subtitle: place.subtitle || '', coords: place.coords });
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    } catch {}
  };
  const showRecents = (which) => {
    const list = loadRecents();
    box.innerHTML = '';
    if (!list.length) {
      box.hidden = true;
      return;
    }
    box.appendChild(
      el('div', { class: 'sugg-head' }, [el('span', { class: 'sugg-ic', html: icon('clock', { size: 13 }) }), 'Recent'])
    );
    list.forEach((r) => {
      const row = el('button', { class: 'sugg sugg-recent', type: 'button' }, [
        el('span', { class: 'sugg-ic', html: icon('clock', { size: 16 }) }),
        el('span', { class: 'sugg-txt' }, [
          el('span', { class: 'sugg-name', text: r.name }),
          r.subtitle ? el('span', { class: 'sugg-sub', text: r.subtitle }) : null,
        ]),
      ]);
      row.addEventListener('click', () =>
        pick({ name: r.name, subtitle: r.subtitle, coords: r.coords }, which)
      );
      box.appendChild(row);
    });
    box.hidden = false;
  };

  const pick = (place, which) => {
    box.hidden = true;
    box.innerHTML = '';
    saveRecent(place);
    const label = place.name + (place.subtitle ? '' : '');
    if (which === 'to') {
      app.state.to = { coords: place.coords, label: place.name + (place.subtitle ? ` (${place.subtitle})` : '') };
      toInput.value = app.state.to.label;
    } else {
      app.state.from = { coords: place.coords, label: place.name + (place.subtitle ? ` (${place.subtitle})` : '') };
      fromInput.value = app.state.from.label;
    }
    $('#route-actions').hidden = false;
    $('#avoid-toggle').hidden = false;
    if (app.state.from && app.state.to) app._auto();
  };

  app._auto = () => {
    // small debounce to avoid double fire
    clearTimeout(app._autoT);
    app._autoT = setTimeout(() => $('#goBtn').click(), 250);
  };

  // Monotonic request token: photon responses can arrive out of order when the
  // user keeps typing (slow first reply overtakes a fast second one). Only the
  // newest request may write the panel — stale replies are dropped.
  let reqSeq = 0;
  const render = async (q, which) => {
    if (q.length < 2) {
      box.hidden = true;
      return;
    }
    const near = app.state.userLoc || (app.map ? app.map.getCenter() : null);
    const mySeq = ++reqSeq;
    // Maps-parity immediate feedback: show a non-interactive "Searching…" row
    // while the geocoder is in flight instead of a dead gap after the debounce.
    box.innerHTML = '';
    box.appendChild(
      el('div', { class: 'sugg-loading', role: 'status' }, [
        el('span', { class: 'sugg-name', text: 'Searching…' }),
      ])
    );
    box.hidden = false;
    let searchErr = null;
    const places = await searchPlaces(q, 6, near).catch((e) => { searchErr = e; return []; });
    if (mySeq !== reqSeq) return; // a newer query is in flight — drop stale reply
    box.innerHTML = '';
    if (searchErr) {
      // F3: Network error — distinguish from empty results. Show recovery
      // with a retry path (don't lie "No results" when it's actually offline).
      box.hidden = true;
      showStatusWithRetry(
        'Search needs a connection — try again when online.',
        'warn',
        () => { clearStatus(); render(q, which); }
      );
      return;
    }
    if (!places.length) {
      // Maps-parity empty state: tell the user the query matched nothing
      // instead of silently vanishing the panel.
      const empty = el('div', { class: 'sugg-empty', role: 'status' }, [
        el('span', { class: 'sugg-name', text: 'No results' }),
        el('span', { class: 'sugg-sub', text: `Nothing matches “${q}”. Try a different name or address.` }),
      ]);
      box.appendChild(empty);
      box.hidden = false;
      return;
    }
    places.forEach((p) => {
      const row = el('button', { class: 'sugg', type: 'button' }, [
        el('span', { class: 'sugg-name', text: p.name }),
        p.subtitle ? el('span', { class: 'sugg-sub', text: p.subtitle }) : null,
      ]);
      row.addEventListener('click', () => pick(p, which));
      box.appendChild(row);
    });
    box.hidden = false;
  };

  const debFrom = debounce((q) => render(q, 'from'), 280);
  const debTo = debounce((q) => render(q, 'to'), 280);

  // Clear buttons only appear when the field has a value.
  const syncClear = (inp) => {
    const btn = document.querySelector(`.clear-btn[data-clear="${inp.id}"]`);
    if (btn) btn.hidden = !inp.value;
  };
  fromInput.addEventListener('input', (e) => {
    debFrom(e.target.value);
    syncClear(e.target);
  });
  toInput.addEventListener('input', (e) => {
    debTo(e.target.value);
    syncClear(e.target);
  });
  syncClear(fromInput);
  syncClear(toInput);

  // Enter commits the typed text and routes.
  const onEnter = (e) => {
    if (e.key !== 'Enter') return;
    box.hidden = true;
    clearTimeout(app._autoT);
    $('#goBtn').click();
  };
  fromInput.addEventListener('keydown', onEnter);
  toInput.addEventListener('keydown', onEnter);

  // Maps-parity keyboard navigation through suggestions: ArrowDown/ArrowUp
  // move focus between the field and the result rows. Rows are buttons, so
  // Enter selects natively; Escape closes via the document handler below.
  const moveFocus = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (box.hidden) return;
    const rows = [...box.querySelectorAll('.sugg')];
    if (!rows.length) return; // loading/empty state — arrows stay textual
    e.preventDefault();
    const idx = rows.indexOf(document.activeElement);
    const next =
      e.key === 'ArrowDown'
        ? (idx + 1) % rows.length // from the field (idx -1) → first row
        : idx <= 0
          ? rows.length - 1 // from the field or first row → last row (wrap)
          : idx - 1;
    rows[next].focus();
    rows[next].scrollIntoView({ block: 'nearest' });
  };
  fromInput.addEventListener('keydown', moveFocus);
  toInput.addEventListener('keydown', moveFocus);
  box.addEventListener('keydown', moveFocus);

  [fromInput, toInput].forEach((inp) =>
    inp.addEventListener('focus', () => {
      box.dataset.owner = inp.id;
      // Maps-parity: focusing an empty field surfaces recent destinations
      // instead of a dead panel (typing replaces them with live results).
      if (!inp.value.trim()) showRecents(inp.id === 'toInput' ? 'to' : 'from');
    })
  );
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search')) box.hidden = true;
  });

  // Keyboard accessibility: Escape dismisses the topmost overlay. main.js owns
  // the open/close helpers, so click the canonical close buttons rather than
  // duplicating that logic (keeps the scrim/animation handling in one place).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    const steps = $('#stepsSheet');
    if (steps && !steps.hidden) { $('#stepsClose').click(); return; }
    const modal = $('#modal');
    if (modal && !modal.hidden) { $('#modalClose').click(); return; }
    const drawer = $('#drawer');
    if (drawer && !drawer.hidden) { $('#closeDrawer').click(); return; }
    const ob = $('#onboarding');
    if (ob && !ob.hidden) { $('#obSkip').click(); return; }
    if (!box.hidden) box.hidden = true;
  });

  // Clear buttons.
  document.querySelectorAll('.clear-btn').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.clear;
      const inp = $('#' + id);
      inp.value = '';
      b.hidden = true;
      if (id === 'fromInput') app.state.from = null;
      else app.state.to = null;
    })
  );

  // Camera legend toggle (on-map, explains the camera dots).
  const legendBtn = $('#legendBtn');
  const legendPanel = $('#legendPanel');
  if (legendBtn && legendPanel) {
    legendBtn.addEventListener('click', () => {
      const open = legendPanel.hidden;
      legendPanel.hidden = !open;
      legendBtn.setAttribute('aria-expanded', String(open));
    });
  }

  // F4: Empty route card invitation — when no route is selected, show a calm
  // prompt instead of a hidden card (activation research: guided first action).
  renderEmptyRouteCard();
}

// F4: Calm empty-state in the route-card slot — tells the user what to do
// first. Hidden automatically when a route is rendered (renderRouteCard unsets hidden).
function renderEmptyRouteCard() {
  const card = $('#route-card');
  if (!card) return;
  // Only render if the card is currently empty (no route rendered yet).
  if (card.children.length > 0) return;
  card.innerHTML = `
    <div class="rc-empty" role="status">
      <div class="rc-empty-icon">${icon('search', { size: 20 })}</div>
      <div class="rc-empty-title">Where to?</div>
      <div class="rc-empty-sub">Search a destination above to see your options.</div>
      <div class="rc-empty-note">Routes avoid ALPR cameras by default.</div>
    </div>
  `;
  card.hidden = false;
}

// ---- Route card: engine options (Clearest/Balanced/Fastest) or legacy single ----
export function renderRouteCard(app, result) {
  const card = $('#route-card');
  // Collapse the search panel so the route summary + Start button are fully
  // visible without scrolling (Google Maps behavior).
  $('#search').hidden = true;
  $('#route-actions').hidden = true;
  $('#avoid-toggle').hidden = true;
  // Expand the panel so the route card (headline + badge + options + Start)
  // fits without vertical scrolling — zero-scroll on nav/route card.
  $('#panel').classList.add('panel--expanded');
  if (result.engine) {
    renderEngineCard(app, card, result);
    return;
  }
  renderLegacyCard(app, card, result);
}

export function expandSearch(app) {
  $('#search').hidden = false;
  $('#route-actions').hidden = false;
  $('#avoid-toggle').hidden = false;
  // Restore the panel to its normal max-height when the search form is shown.
  $('#panel').classList.remove('panel--expanded');
}

function renderEngineCard(app, card, result) {
  const { options, chosen } = result;
  const sel = options[chosen];
  const fastest = options.find((o) => o.mode === 'off') || options[0];

  // Always render three primary slots — Fastest / Balanced / Clearest. The
  // avoid-highways option is fully retired (addendum 3): the engine decides
  // highway tradeoffs via the generalized cost model, and the "Most natural"
  // pill surfaces the win. Three primary options are geometry-deduped by the
  // engine, and a 0-camera Fastest already shows the "Camera-free route"
  // badge, so the "Clearest == Fastest" collapse needs no extra code here.
  const optBtn = (o, idx) => {
    const cams =
      o.cameras === 0
        ? `<span class="opt-cams clear">0 cameras</span>`
        : `<span class="opt-cams">${o.cameras} camera${o.cameras === 1 ? '' : 's'}</span>`;
    const clearBadge =
      o.cameras === 0
        ? `<span class="opt-clear-badge">${icon('shieldCheck', { size: 14 })} Camera-free route</span>`
        : '';
    const delay = o.delay && o.delay > 30 ? ` · <span class="opt-delay">+${Math.round(o.delay / 60)} min traffic</span>` : '';
    // Keaton 2026-08-27 (item 10): drop the detour-complaint warnings
    // ("best effort — camera-walled", "best effort — clear route too long",
    // "costs extra time") — the map shows routes side by side and per-option
    // time/distance is visible, so the warnings are noise. KEEP the honest
    // gate-snap "clear to within ~N m" line: that is a real safety fact about
    // the final approach, not a detour complaint.
    const bestEffort =
      o.strictFallback && o.clearToM
        ? ` · <span class="opt-warn">${icon('warning', { size: 13 })} clear to within ~${fmtDistance(o.clearToM)}</span>`
        : '';
    const dKm = o.distance - fastest.distance;
    // Distance tradeoff vs fastest: shown as a compact suffix in the meta line
    // (Keaton feedback: the big standalone "↓ shorter / ↑ longer than fastest"
    // tradeoff span spilled the card and duplicated what the map comparison
    // already shows — keep the info, kill the noise).
    const tradeoff =
      fastest && o !== fastest && Math.abs(dKm) >= 100
        ? ` · <span class="opt-tradeoff ${dKm < 0 ? 'shorter' : 'longer'}">${dKm < 0 ? '↓' : '↑'} ${fmtDistance(Math.abs(dKm))}</span>`
        : '';
    const natural =
      fastest && o !== fastest && o.distance < fastest.distance &&
      (o.highwayKm || 0) <= (fastest.highwayKm || 0) + 0.5
        ? `<span class="opt-natural" title="Shorter and uses no more freeway than the fastest route -- the way a local would drive">${icon('leaf', { size: 13 })} Most natural</span>`
        : '';
    const hw = o.highwayKm && o.highwayKm >= 0.5 ? ` · ${o.highwayKm.toFixed(1)} km hwy` : '';
    return `
        <button class="route-opt ${idx === chosen ? 'chosen' : ''}" data-opt="${idx}" type="button" aria-pressed="${idx === chosen}">
          <span class="opt-label">${modeEmoji(o.mode)} ${o.label}</span>
          ${clearBadge}
          <span class="opt-meta">${fmtDuration(o.duration)} · ${fmtDistance(o.distance)} · ${cams}${hw}${delay}${bestEffort}</span>
          ${tradeoff}
          ${natural}
        </button>`;
  };

  const optHtml = options.map((o) => optBtn(o, options.indexOf(o))).join('');

  const steps = sel.instructions || [];
  const stepHtml = steps
    .slice(0, 12)
    .map(
      (s) =>
        `<li><span class="step-ic">${stepIcon(s.modifier)}</span><span>${escHtml(s.instruction)}${
          s.name ? ` <b>${escHtml(s.name)}</b>` : ''
        }</span><span class="step-dist">${fmtDistance(s.distance)}</span></li>`
    )
    .join('');

  card.innerHTML = `
    <button id="editRouteBtn" class="text-link rc-edit" type="button">${icon('edit', { size: 14 })} Edit route</button>
    <div class="rc-head" aria-live="polite" aria-atomic="true">
      <div class="rc-time">${fmtDuration(sel.duration)}</div>
      <div class="rc-arrive">Arrive ${fmtArrive(sel.duration)}</div>
      <div class="rc-dist">${fmtDistance(sel.distance)}</div>
    </div>
    <div class="rc-badge">${
      sel.cameras === 0
        ? `${icon('shield', { size: 15 })} Fully clear of known cameras`
        : `${icon('shield', { size: 15 })} Passes <b>${sel.cameras}</b> camera${sel.cameras === 1 ? '' : 's'} on this route`
    }</div>
    <div class="route-options">${optHtml}</div>
    <button id="startNavBtn" class="primary-btn">${icon('play', { size: 16 })} Start navigation</button>
    <button id="densityBtn" class="text-link rc-density" type="button" aria-pressed="${!!app.state.compactBanner}" title="Toggle the active-nav banner density (compact = fewer glance elements)">${icon(app.state.compactBanner ? 'densityFull' : 'densityCompact', { size: 14 })} ${app.state.compactBanner ? 'Compact banner' : 'Full banner'}</button>
  `;
  card.hidden = false;

  const edit = $('#editRouteBtn');
  if (edit) edit.addEventListener('click', () => expandSearch(app));
  card.querySelectorAll('.route-opt').forEach((b) =>
    b.addEventListener('click', () => app.selectOption(Number(b.dataset.opt)))
  );
  const sn = $('#startNavBtn');
  if (sn) sn.addEventListener('click', () => app.startNav());
  // C12 #126: density lives in the planning panel (where the user is
  // stationary), not the active-nav banner (where the user is driving).
  const density = $('#densityBtn');
  if (density) {
    density.addEventListener('click', () => {
      app.state.compactBanner = !app.state.compactBanner;
      localStorage.setItem('gw-compact', app.state.compactBanner ? '1' : '0');
      density.setAttribute('aria-pressed', app.state.compactBanner ? 'true' : 'false');
      density.innerHTML = `${icon(app.state.compactBanner ? 'densityFull' : 'densityCompact', { size: 14 })} ${app.state.compactBanner ? 'Compact banner' : 'Full banner'}`;
    });
  }
}

function modeEmoji(mode) {
  return { strict: icon('glasses', { size: 15 }), moderate: icon('shield', { size: 15 }), off: icon('rocket', { size: 15 }) }[mode] || icon('shield', { size: 15 });
}

function renderLegacyCard(app, card, result) {
  const shown = result.avoid && result.applied ? result.clear : result.baseline;
  const baseline = result.baseline;

  let headline;
  if (result.routerDown) {
    headline = `${icon('warning', { size: 15 })} Avoidance offline — routing server down. Showing a normal route; cameras still shown on the map.`;
  } else if (result.avoid && result.applied) {
    headline = `${icon('shield', { size: 15 })} Routed clear of <b>${result.avoidedCount}</b> camera${result.avoidedCount === 1 ? '' : 's'}`;
  } else if (result.avoid && result.avoidedCount === 0) {
    headline = `${icon('check', { size: 15 })} No known cameras along the way`;
  } else if (result.avoid && !result.applied) {
    headline = `${icon('warning', { size: 15 })} No clear detour — showing fastest (${result.avoidedCount} camera${result.avoidedCount === 1 ? '' : 's'} nearby)`;
  } else {
    headline = `${icon('rocket', { size: 15 })} Fastest route (avoidance off)`;
  }

  const steps = result.steps || [];
  const stepHtml = steps
    .slice(0, 12)
    .map(
      (s) =>
        `<li><span class="step-ic">${stepIcon(s.modifier)}</span><span>${escHtml(s.instruction)}${
          s.name ? ` <b>${escHtml(s.name)}</b>` : ''
        }</span><span class="step-dist">${fmtDistance(s.distance)}</span></li>`
    )
    .join('');

  card.innerHTML = `
    <button id="editRouteBtn" class="text-link rc-edit" type="button">${icon('edit', { size: 14 })} Edit route</button>
    <div class="rc-head">
      <div class="rc-time">${fmtDuration(shown.duration)}</div>
      <div class="rc-arrive">Arrive ${fmtArrive(shown.duration)}</div>
      <div class="rc-dist">${fmtDistance(shown.distance)}</div>
    </div>
    <div class="rc-badge">${headline}</div>
    <button id="startNavBtn" class="primary-btn">${icon('play', { size: 16 })} Start navigation</button>
    ${steps.length ? `<details class="steps-wrap"><summary>${steps.length} steps</summary><ol class="steps">${stepHtml}</ol></details>` : '<p class="muted small">Turn-by-turn directions unavailable right now.</p>'}
    ${result.applied ? `<button id="showFastest" class="text-link">Show fastest route instead</button>` : ''}
  `;
  card.hidden = false;

  const edit = $('#editRouteBtn');
  if (edit) edit.addEventListener('click', () => expandSearch(app));

  const sf = $('#showFastest');
  if (sf)
    sf.addEventListener('click', () => {
      app.state.avoid = false;
      app.map.setRoute([
        { type: 'Feature', properties: { color: '#5b6b80' }, geometry: { type: 'LineString', coordinates: baseline.coords } },
      ]);
      renderLegacyCard(app, card, { ...result, avoid: false, applied: false });
    });
  const sn = $('#startNavBtn');
  if (sn) sn.addEventListener('click', () => app.startNav());
}

function stepIcon(mod) {
  return stepIconSvg(mod, 18);
}

export function showStatus(msg, kind = 'info') {
  const s = $('#status');
  s.className = 'status ' + kind;
  s.hidden = false;
  // Set text AFTER unhiding so screen readers announce it (role="status").
  s.textContent = msg;
}

export function clearStatus() {
  const s = $('#status');
  s.hidden = true;
  s.textContent = '';
  s.innerHTML = '';
}

// F3: Show a status message with a Retry button so the user always has a
// clear next step (NN/g error recovery: never leave the user stranded).
export function showStatusWithRetry(msg, kind, onRetry) {
  const s = $('#status');
  s.className = 'status ' + kind;
  s.hidden = false;
  s.innerHTML = '';
  const text = document.createElement('span');
  text.textContent = msg;
  s.appendChild(text);
  if (onRetry) {
    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'status-retry';
    retryBtn.textContent = 'Retry';
    retryBtn.addEventListener('click', () => {
      clearStatus();
      onRetry();
    });
    s.appendChild(retryBtn);
  }
}
