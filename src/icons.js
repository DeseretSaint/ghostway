// Ghostway inline SVG icon set — self-contained, no CDN, no external fonts.
// 24x24 viewBox, stroke-based (currentColor), 2px stroke, round caps.
// Usage: import { icon } from './icons.js'; el.innerHTML = icon('menu');
// All icons inherit `color` from CSS; size via width/height or font-size on wrapper.

const P = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  locate: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7.5"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/>',
  cameraOff: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/><path d="M3 3l18 18"/>',
  edit: '<path d="M4 20l4.5-.9L19.6 8a2.1 2.1 0 0 0-3-3L5.5 16.1 4 20z"/><path d="M13.5 6.5l3 3"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2.2 5-4.8 2 2.2-5z" fill="currentColor" stroke="none"/>',
  volume: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.8a7.6 7.6 0 0 1 0 10.4"/>',
  volumeOff: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  densityFull: '<path d="M4 6h16M4 10.5h16M4 15h10"/>',
  densityCompact: '<path d="M4 8h16M4 14h16"/>',
  swap: '<path d="M8 4v13M8 4L5 7M8 4l3 3M16 20V7M16 20l-3-3M16 20l3-3"/>',
  shield: '<path d="M12 3l7 2.8v5.4c0 4.6-3 7.9-7 9.8-4-1.9-7-5.2-7-9.8V5.8z"/>',
  shieldCheck: '<path d="M12 3l7 2.8v5.4c0 4.6-3 7.9-7 9.8-4-1.9-7-5.2-7-9.8V5.8z"/><path d="M9 12l2.2 2.2L15.5 9.7"/>',
  rocket: '<path d="M12 15c-2 0-3-1-3-3 0-3.5 1.5-7 3-9 1.5 2 3 5.5 3 9 0 2-1 3-3 3z"/><path d="M9 13l-2.5 2.5M15 13l2.5 2.5M12 15v4"/>',
  glasses: '<circle cx="7.5" cy="13" r="3.5"/><circle cx="16.5" cy="13" r="3.5"/><path d="M11 13h2M4 13l-1-4M20 13l1-4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  // Turn arrows (nav steps + banner)
  left: '<path d="M14 20v-8a3 3 0 0 0-3-3H5"/><path d="M8 5.5L4.5 9 8 12.5"/>',
  right: '<path d="M10 20v-8a3 3 0 0 1 3-3h6"/><path d="M16 5.5L19.5 9 16 12.5"/>',
  slightLeft: '<path d="M13 20v-6a3 3 0 0 0-.9-2.1L6.5 6.5"/><path d="M6 11l.3-4.7L11 6.6"/>',
  slightRight: '<path d="M11 20v-6a3 3 0 0 1 .9-2.1l5.6-5.4"/><path d="M18 11l-.3-4.7L13 6.6"/>',
  straight: '<path d="M12 20V5"/><path d="M8 8.5L12 4.5l4 4"/>',
  sharpLeft: '<path d="M16 20v-9a4 4 0 0 0-4-4H7"/><path d="M10 3.5L6.5 7 10 10.5"/>',
  sharpRight: '<path d="M8 20v-9a4 4 0 0 1 4-4h5"/><path d="M14 3.5L17.5 7 14 10.5"/>',
  uturn: '<path d="M17 20V9a5 5 0 0 0-10 0v2"/><path d="M4 8.5L7 11.5l3-3"/>',
  depart: '<circle cx="12" cy="17" r="2.5"/><path d="M12 14.5V4"/><path d="M8.5 7.5L12 4l3.5 3.5"/>',
  arrive: '<circle cx="12" cy="6" r="2.5"/><path d="M12 8.5V15"/><path d="M7 20l5-5 5 5"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 3.5L17 11H5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15.5 15.5L20 20"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/>',
  github: '<path d="M12 3a9 9 0 0 0-2.85 17.54c.45.08.62-.2.62-.43v-1.7c-2.5.54-3.03-1.06-3.03-1.06-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.38.93 1.38.93.8 1.38 2.11.98 2.63.75.08-.58.31-.98.57-1.2-2-.23-4.1-1-4.1-4.45 0-.98.35-1.79.93-2.42-.1-.23-.4-1.15.08-2.4 0 0 .76-.24 2.48.92a8.6 8.6 0 0 1 4.52 0c1.72-1.16 2.47-.92 2.47-.92.49 1.25.18 2.17.09 2.4.58.63.92 1.44.92 2.42 0 3.47-2.1 4.22-4.11 4.44.32.28.61.83.61 1.67v2.48c0 .24.16.52.62.43A9 9 0 0 0 12 3z" fill="currentColor" stroke="none"/>',
  heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  layers: '<path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
  warning: '<path d="M12 4L2.8 19.5h18.4z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  road: '<path d="M4 19 8 5"/><path d="M20 19 16 5"/><path d="M12 8v2"/><path d="M12 13v2"/><path d="M12 18v1"/>',
  leaf: '<path d="M5 19c0-8 6-13 14-13 0 8-6 14-14 14z"/><path d="M5 19c4-4 7-7 11-9"/>',
};

export function icon(name, { size = 20, cls = '' } = {}) {
  const body = P[name] || P.info;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

// Map Valhalla/OSRM maneuver modifiers to icon names.
export const STEP_ICON = {
  left: 'left', right: 'right', slight_left: 'slightLeft', slight_right: 'slightRight',
  straight: 'straight', sharp_left: 'sharpLeft', sharp_right: 'sharpRight',
  'u-turn': 'uturn', depart: 'depart', arrive: 'arrive',
};

export function stepIconSvg(modifier, size = 18) {
  return icon(STEP_ICON[modifier] || 'straight', { size });
}
