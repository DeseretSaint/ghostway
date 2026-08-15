import { CONFIG } from './config.js';
import { $, el, debounce, fmtDistance, fmtDuration } from './utils.js';
import { searchPlaces } from './search.js';

// Builds the live search panel: typing shows suggestions; selecting fills an endpoint.

function activeInput() {
  return document.activeElement && document.activeElement.id === 'toInput' ? 'to' : 'from';
}

export function buildPanel(app) {
  const fromInput = $('#fromInput');
  const toInput = $('#toInput');
  const box = $('#suggestions');

  const pick = (place, which) => {
    box.hidden = true;
    box.innerHTML = '';
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

  const render = async (q, which) => {
    if (q.length < 2) {
      box.hidden = true;
      return;
    }
    const near = app.state.userLoc || null;
    const places = await searchPlaces(q, 6, near).catch(() => []);
    if (!places.length) {
      box.hidden = true;
      return;
    }
    box.innerHTML = '';
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

  fromInput.addEventListener('input', (e) => debFrom(e.target.value));
  toInput.addEventListener('input', (e) => debTo(e.target.value));

  // Enter commits the typed text and routes.
  const onEnter = (e) => {
    if (e.key !== 'Enter') return;
    box.hidden = true;
    clearTimeout(app._autoT);
    $('#goBtn').click();
  };
  fromInput.addEventListener('keydown', onEnter);
  toInput.addEventListener('keydown', onEnter);
  [fromInput, toInput].forEach((inp) =>
    inp.addEventListener('focus', () => (box.dataset.owner = inp.id))
  );
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search')) box.hidden = true;
  });

  // Clear buttons.
  document.querySelectorAll('.clear-btn').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.clear;
      $('#' + id).value = '';
      if (id === 'fromInput') app.state.from = null;
      else app.state.to = null;
    })
  );
}

// ---- Route card: engine options (Clearest/Balanced/Fastest) or legacy single ----
export function renderRouteCard(app, result) {
  const card = $('#route-card');
  // Collapse the search panel so the route summary + Start button are fully
  // visible without scrolling (Google Maps behavior).
  $('#search').hidden = true;
  $('#route-actions').hidden = true;
  $('#avoid-toggle').hidden = true;
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
}

function renderEngineCard(app, card, result) {
  const { options, chosen } = result;
  const sel = options[chosen];
  const fastest = options.find((o) => o.mode === 'off') || options[0];

  const optHtml = options
    .map((o, i) => {
      const cams =
        o.cameras === 0
          ? `<span class="opt-cams clear">0 cameras</span>`
          : `<span class="opt-cams">${o.cameras} camera${o.cameras === 1 ? '' : 's'}</span>`;
      const delay = o.delay && o.delay > 30 ? ` · <span class="opt-delay">+${Math.round(o.delay / 60)} min traffic</span>` : '';
      return `
        <button class="route-opt ${i === chosen ? 'chosen' : ''}" data-opt="${i}" type="button">
          <span class="opt-label">${modeEmoji(o.mode)} ${o.label}</span>
          <span class="opt-meta">${fmtDuration(o.duration)} · ${fmtDistance(o.distance)} · ${cams}${delay}</span>
        </button>`;
    })
    .join('');

  const detourVsFastest =
    sel.mode !== 'off' && fastest
      ? `<div class="rc-detour">+${fmtDistance(Math.max(0, sel.distance - fastest.distance))} · +${Math.max(
          0,
          Math.round((sel.duration - fastest.duration) / 60)
        )} min vs fastest</div>`
      : '';

  const steps = sel.instructions || [];
  const stepHtml = steps
    .slice(0, 12)
    .map(
      (s) =>
        `<li><span class="step-ic">${stepIcon(s.modifier)}</span><span>${s.instruction}${
          s.name ? ` <b>${s.name}</b>` : ''
        }</span><span class="step-dist">${fmtDistance(s.distance)}</span></li>`
    )
    .join('');

  card.innerHTML = `
    <button id="editRouteBtn" class="text-link rc-edit" type="button">✎ Edit route</button>
    <div class="rc-head">
      <div class="rc-time">${fmtDuration(sel.duration)}</div>
      <div class="rc-dist">${fmtDistance(sel.distance)}</div>
    </div>
    <div class="rc-badge">${
      sel.cameras === 0
        ? '🛡️ Fully clear of known cameras'
        : `🛡️ Passes <b>${sel.cameras}</b> camera${sel.cameras === 1 ? '' : 's'} on this route`
    }</div>
    ${detourVsFastest}
    <div class="route-options">${optHtml}</div>
    <button id="startNavBtn" class="primary-btn">▶ Start navigation</button>
    ${steps.length ? `<details class="steps-wrap"><summary>${steps.length} steps</summary><ol class="steps">${stepHtml}</ol></details>` : ''}
  `;
  card.hidden = false;

  const edit = $('#editRouteBtn');
  if (edit) edit.addEventListener('click', () => expandSearch(app));
  card.querySelectorAll('.route-opt').forEach((b) =>
    b.addEventListener('click', () => app.selectOption(Number(b.dataset.opt)))
  );
  const sn = $('#startNavBtn');
  if (sn) sn.addEventListener('click', () => app.startNav());
}

function modeEmoji(mode) {
  return { strict: '🕶', moderate: '🛡', off: '🚀' }[mode] || '🛡';
}

function renderLegacyCard(app, card, result) {
  const shown = result.avoid && result.applied ? result.clear : result.baseline;
  const baseline = result.baseline;

  const detour = result.applied ? shown.distance - baseline.distance : 0;
  const extraMin = result.applied
    ? Math.max(0, Math.round((shown.duration - baseline.duration) / 60))
    : 0;

  let headline;
  if (result.routerDown) {
    headline = `⚠️ Avoidance offline — routing server down. Showing a normal route; cameras still shown on the map.`;
  } else if (result.avoid && result.applied) {
    headline = `🛡️ Routed clear of <b>${result.avoidedCount}</b> camera${result.avoidedCount === 1 ? '' : 's'}`;
  } else if (result.avoid && result.avoidedCount === 0) {
    headline = `✅ No known cameras along the way`;
  } else if (result.avoid && !result.applied) {
    headline = `⚠️ No clear detour — showing fastest (${result.avoidedCount} camera${result.avoidedCount === 1 ? '' : 's'} nearby)`;
  } else {
    headline = `🚀 Fastest route (avoidance off)`;
  }

  const steps = result.steps || [];
  const stepHtml = steps
    .slice(0, 12)
    .map(
      (s) =>
        `<li><span class="step-ic">${stepIcon(s.modifier)}</span><span>${s.instruction}${
          s.name ? ` <b>${s.name}</b>` : ''
        }</span><span class="step-dist">${fmtDistance(s.distance)}</span></li>`
    )
    .join('');

  card.innerHTML = `
    <button id="editRouteBtn" class="text-link rc-edit" type="button">✎ Edit route</button>
    <div class="rc-head">
      <div class="rc-time">${fmtDuration(shown.duration)}</div>
      <div class="rc-dist">${fmtDistance(shown.distance)}</div>
    </div>
    <div class="rc-badge">${headline}</div>
    ${result.applied ? `<div class="rc-detour">+${fmtDistance(detour)} · +${extraMin} min vs fastest</div>` : ''}
    <button id="startNavBtn" class="primary-btn">▶ Start navigation</button>
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
  return (
    {
      left: '↰',
      right: '↱',
      slight_left: '↰',
      slight_right: '↱',
      straight: '↑',
      sharp_left: '⤺',
      sharp_right: '⤻',
      'u-turn': '⮌',
      depart: '◎',
      arrive: '⊗',
    }[mod] || '↑'
  );
}

export function showStatus(msg, kind = 'info') {
  const s = $('#status');
  s.textContent = msg;
  s.className = 'status ' + kind;
  s.hidden = false;
}

export function clearStatus() {
  const s = $('#status');
  s.hidden = true;
  s.textContent = '';
}
