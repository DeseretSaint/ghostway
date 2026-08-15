// Voice guidance — Web Speech API (speechSynthesis). Free, offline, no key.
// All speech is generated locally; nothing is sent anywhere.

let enabled = localStorage.getItem('gw-voice') !== '0';
let queue = [];
let speaking = false;

export function voiceEnabled() {
  return enabled && typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function setVoiceEnabled(v) {
  enabled = !!v;
  localStorage.setItem('gw-voice', v ? '1' : '0');
  if (!enabled) cancel();
}

export function toggleVoice() {
  setVoiceEnabled(!enabled);
  return enabled;
}

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return (
    voices.find((v) => v.lang.startsWith('en') && /female|samantha|zira|google us/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

export function speak(text, { interrupt = false } = {}) {
  if (!voiceEnabled() || !text) return;
  try {
    if (interrupt) {
      window.speechSynthesis.cancel();
      queue = [];
      speaking = false;
    }
    if (queue.length > 2) return; // don't stack stale prompts
    queue.push(text);
    pump();
  } catch {}
}

function pump() {
  if (speaking || !queue.length) return;
  const text = queue.shift();
  speaking = true;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02;
  u.pitch = 1;
  const v = pickVoice();
  if (v) u.voice = v;
  u.onend = () => {
    speaking = false;
    pump();
  };
  u.onerror = () => {
    speaking = false;
    pump();
  };
  window.speechSynthesis.speak(u);
}

export function cancel() {
  try {
    window.speechSynthesis?.cancel();
  } catch {}
  queue = [];
  speaking = false;
}

// Compose a natural callout for an upcoming maneuver.
export function phraseManeuver(distanceM, instruction, roadName) {
  const d = Math.round(distanceM);
  const where = roadName ? ` onto ${roadName}` : '';
  if (d <= 60) return `${instruction} now${where}.`;
  if (d < 1000) return `In ${Math.round(d / 50) * 50} meters, ${lower(instruction)}${where}.`;
  return `In ${(d / 1000).toFixed(1)} kilometers, ${lower(instruction)}${where}.`;
}

export function phraseArrival() {
  return 'You have arrived at your destination.';
}

function lower(s) {
  return (s || '').replace(/^./, (c) => c.toLowerCase());
}
