// Community camera reports — stored locally (privacy-first), optionally
// published to OpenStreetMap as an anonymous note (key-free, CORS-open) so
// they can flow into the DeFlock map. Reports also feed Ghostway's own
// routing cost model immediately, before any external review.

import { CONFIG } from './config.js';

const KEY = 'gw-reports';

export function loadReports() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addReport(report) {
  const list = loadReports();
  const rec = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    ...report, // { lon, lat, kind, brand, note, publishedNoteId? }
  };
  list.push(rec);
  save(list);
  return rec;
}

export function removeReport(id) {
  save(loadReports().filter((r) => r.id !== id));
}

export function markPublished(id, osmNoteId) {
  const list = loadReports();
  const r = list.find((x) => x.id === id);
  if (r) {
    r.publishedNoteId = osmNoteId;
    r.publishedAt = new Date().toISOString();
    save(list);
  }
}

// Publish a report to OpenStreetMap as an ANONYMOUS note (no account, no key).
// The note asks mappers to add the camera to OSM, which is how it reaches the
// DeFlock map. Returns the OSM note id.
export async function publishReportToOsm(report, notesUrl) {
  const kindLabel = {
    alpr: 'ALPR / license plate reader',
    fixed: 'Fixed surveillance camera',
    redlight: 'Red-light camera',
    speed: 'Speed camera',
    other: 'Surveillance camera',
  }[report.kind] || 'Surveillance camera';
  const brand = report.brand ? ` Brand: ${report.brand}.` : '';
  const note = report.note ? ` Details from reporter: ${report.note}.` : '';
  const text =
    `[Ghostway report] Possible ${kindLabel} at this location.${brand}${note} ` +
    'If verified, please map it as man_made=surveillance (+ surveillance:type if known) ' +
    'so the DeFlock privacy map (deflock.org) can include it.';

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const url =
      (notesUrl || CONFIG.osmNotesUrl) +
      `?lat=${report.lat}&lon=${report.lon}&text=${encodeURIComponent(text)}`;
    const res = await fetch(url, { method: 'POST', signal: ctrl.signal });
    if (!res.ok) throw new Error(`OSM notes ${res.status}`);
    const j = await res.json();
    const props = j && j.features && j.features[0] ? j.features[0].properties : {};
    return props.id || null;
  } finally {
    clearTimeout(t);
  }
}
