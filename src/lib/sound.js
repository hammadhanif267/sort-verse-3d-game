"use client";

/**
 * SortVerse audio engine.
 *
 * Everything is synthesized with the Web Audio API, so there are no external
 * audio files to download and nothing to block the first render.
 *
 * Three distinct pieces of audio:
 *
 *  1. `playIntroChime()`  – the original ascending bell arpeggio. It now fires
 *     ONCE at the start of gameplay (when a level begins), not on the home page.
 *  2. Menu music ("menu") – one calm, professional, seamlessly looping ambient
 *     track that keeps playing the whole time the player is on the home page,
 *     the levels page, or any other menu screen. Moving between those pages
 *     does NOT restart it.
 *  3. Gameplay music ("gameplay") – a different, more driving loop that runs
 *     continuously while a level is being played.
 *
 * Only one track is ever audible: switching crossfades between them.
 */

/* ------------------------------------------------------------------ */
/* Context, master bus, mute                                           */
/* ------------------------------------------------------------------ */

const MUTE_STORAGE_KEY = "sortverse-audio-muted";

let audioCtx = null;
let masterGain = null;
let impulseBuffer = null;
let noiseBuffer = null;

let muted = null; // lazily read from localStorage
const muteListeners = new Set();

function readMuted() {
  if (muted !== null) return muted;
  if (typeof window === "undefined") return false;
  try {
    muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    muted = false;
  }
  return muted;
}

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();

    // Master chain: gain -> limiter -> output. The limiter lets the music sit
    // much louder without the peaks distorting on phone speakers.
    masterGain = audioCtx.createGain();
    masterGain.gain.value = readMuted() ? 0 : 1;

    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 4;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.18;

    const output = audioCtx.createGain();
    output.gain.value = 1.35;

    masterGain.connect(limiter);
    limiter.connect(output);
    output.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function isMuted() {
  return readMuted();
}

export function setMuted(value) {
  const next = Boolean(value);
  if (readMuted() === next) return;
  muted = next;
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* storage unavailable — mute still applies for this session */
  }
  const ctx = getContext();
  if (ctx && masterGain) {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(next ? 0 : 1, now + 0.25);
  }
  muteListeners.forEach((fn) => fn());
}

export function toggleMuted() {
  setMuted(!readMuted());
}

export function subscribeMuted(listener) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/* Autoplay unlock                                                     */
/* ------------------------------------------------------------------ */

/**
 * Browsers block audio until the page has had a user gesture. Anything queued
 * through `whenReady` plays immediately if the context is already running, and
 * otherwise on the very first tap / click / keypress.
 */
let unlockBound = false;
let pendingCallbacks = [];

function flushPending() {
  const ctx = getContext();
  if (!ctx || ctx.state !== "running") return;
  const queued = pendingCallbacks;
  pendingCallbacks = [];
  queued.forEach((fn) => {
    try {
      fn();
    } catch {
      /* one broken callback must not stop the rest */
    }
  });
  if (pendingCallbacks.length === 0) unbindUnlock();
}

function onGesture() {
  const ctx = getContext();
  if (!ctx) return;
  ctx.resume().then(flushPending).catch(() => {});
}

function bindUnlock() {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
  window.addEventListener("touchstart", onGesture);
}

function unbindUnlock() {
  if (!unlockBound || typeof window === "undefined") return;
  unlockBound = false;
  window.removeEventListener("pointerdown", onGesture);
  window.removeEventListener("keydown", onGesture);
  window.removeEventListener("touchstart", onGesture);
}

function whenReady(fn) {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "running") {
    fn();
    return;
  }
  pendingCallbacks.push(fn);
  bindUnlock();
  ctx.resume().then(flushPending).catch(() => {});
}

/* ------------------------------------------------------------------ */
/* Shared buffers + voices                                             */
/* ------------------------------------------------------------------ */

function midi(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// A coarse-pointer device (phones/tablets) generally has a much weaker audio
// thread than a laptop. The gameplay loop below is intentionally dense (kick
// + snare + bass + pad + 16th-note arpeggio + hats, all continuously
// scheduled), which desktops handle fine but can overload a phone's audio
// thread — the audible result is exactly the crackle/stutter this is meant
// to prevent. On such devices we skip the two busiest, least essential
// layers (the arpeggio and the hats) and keep the core groove.
function isLowPowerAudioDevice() {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  } catch {
    return false;
  }
}

function getImpulse(ctx) {
  if (impulseBuffer) return impulseBuffer;
  const seconds = 2.6;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8);
    }
  }
  impulseBuffer = buffer;
  return buffer;
}

function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function envelope(ctx, dest, { time, attack, duration, gain }) {
  const node = ctx.createGain();
  node.gain.setValueAtTime(0.0001, time);
  node.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), time + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  node.connect(dest);
  return node;
}

/** Warm, slowly opening chord pad — the backbone of both loops. */
function playPad(ctx, dest, { notes, time, duration, gain = 0.12 }) {
  const amp = envelope(ctx, dest, { time, attack: duration * 0.3, duration, gain });
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(620, time);
  filter.frequency.linearRampToValueAtTime(1600, time + duration * 0.45);
  filter.frequency.linearRampToValueAtTime(560, time + duration);
  filter.connect(amp);

  notes.forEach((note) => {
    [-7, 7].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = midi(note);
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + duration + 0.12);
    });
  });
}

/** Short melodic pluck / bell note. */
function playPluck(ctx, dest, { note, time, duration = 0.5, gain = 0.16, type = "triangle" }) {
  const amp = envelope(ctx, dest, { time, attack: 0.012, duration, gain });
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = midi(note);
  osc.connect(amp);
  osc.start(time);
  osc.stop(time + duration + 0.06);
}

/** Rounded bass note with a soft sub. */
function playBass(ctx, dest, { note, time, duration = 0.4, gain = 0.24 }) {
  const amp = envelope(ctx, dest, { time, attack: 0.02, duration, gain });
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = midi(note);
  osc.connect(amp);
  osc.start(time);
  osc.stop(time + duration + 0.06);

  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.0001, time);
  bodyGain.gain.exponentialRampToValueAtTime(gain * 0.3, time + 0.02);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.8);
  body.type = "triangle";
  body.frequency.value = midi(note + 12);
  body.connect(bodyGain);
  bodyGain.connect(dest);
  body.start(time);
  body.stop(time + duration + 0.06);
}

/** Tiny filtered noise tick used as a hi-hat in the gameplay loop. */
function playTick(ctx, dest, { time, gain = 0.08, duration = 0.045 }) {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 7200;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(highpass);
  highpass.connect(amp);
  amp.connect(dest);
  source.start(time);
  source.stop(time + duration + 0.02);
}

/** Deep kick drum — the pulse under the gameplay loop. */
function playKick(ctx, dest, { time, gain = 0.55 }) {
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(44, time + 0.12);
  osc.connect(amp);
  amp.connect(dest);
  osc.start(time);
  osc.stop(time + 0.34);
}

/** Noise-based snare/clap for the backbeat. */
function playSnare(ctx, dest, { time, gain = 0.22 }) {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1900;
  band.Q.value = 0.8;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);
  source.connect(band);
  band.connect(amp);
  amp.connect(dest);
  source.start(time);
  source.stop(time + 0.2);
}

/** Bright sawtooth lead — carries the melody in both themes. */
function playLead(ctx, dest, { note, time, duration = 0.5, gain = 0.2 }) {
  const amp = envelope(ctx, dest, { time, attack: 0.03, duration, gain });
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2600, time);
  filter.frequency.exponentialRampToValueAtTime(1200, time + duration);
  filter.Q.value = 1.1;
  filter.connect(amp);

  [-9, 9].forEach((detune) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = midi(note);
    osc.detune.value = detune;
    osc.connect(filter);
    osc.start(time);
    osc.stop(time + duration + 0.08);
  });
}

/* ------------------------------------------------------------------ */
/* Intro chime (plays once, at the start of gameplay)                  */
/* ------------------------------------------------------------------ */

export function playIntroChime() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;

    const bus = ctx.createGain();
    bus.gain.value = 1.45;
    bus.connect(masterGain);

    const send = ctx.createGain();
    send.gain.value = 0.35;
    const reverb = ctx.createConvolver();
    reverb.buffer = getImpulse(ctx);
    bus.connect(send);
    send.connect(reverb);
    reverb.connect(masterGain);

    const now = ctx.currentTime + 0.03;

    // Rising sweep into a big major stab — a proper "level start" fanfare.
    const sweep = ctx.createOscillator();
    const sweepAmp = ctx.createGain();
    sweep.type = "sawtooth";
    sweep.frequency.setValueAtTime(midi(45), now);
    sweep.frequency.exponentialRampToValueAtTime(midi(76), now + 0.36);
    const sweepFilter = ctx.createBiquadFilter();
    sweepFilter.type = "lowpass";
    sweepFilter.frequency.setValueAtTime(600, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(5200, now + 0.36);
    sweepAmp.gain.setValueAtTime(0.0001, now);
    sweepAmp.gain.exponentialRampToValueAtTime(0.32, now + 0.3);
    sweepAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
    sweep.connect(sweepFilter);
    sweepFilter.connect(sweepAmp);
    sweepAmp.connect(bus);
    sweep.start(now);
    sweep.stop(now + 0.5);

    // The hit
    const hit = now + 0.36;
    playKick(ctx, bus, { time: hit, gain: 0.85 });
    playPad(ctx, bus, { notes: [50, 57, 62, 66, 69], time: hit, duration: 1.5, gain: 0.16 });
    [62, 66, 69, 74].forEach((note, index) => {
      playLead(ctx, bus, { note, time: hit + index * 0.055, duration: 1.1, gain: 0.26 });
    });

    // Bell tail
    [81, 86].forEach((note, index) => {
      playPluck(ctx, bus, {
        note,
        time: hit + 0.34 + index * 0.13,
        duration: 1.5,
        gain: 0.3,
        type: "sine",
      });
    });

    window.setTimeout(() => {
      try {
        bus.disconnect();
        send.disconnect();
        reverb.disconnect();
      } catch {
        /* already gone */
      }
    }, 5000);
  });
}

/* ------------------------------------------------------------------ */
/* Loud gameplay feedback sounds                                      */
/* ------------------------------------------------------------------ */

function playToneBurst(ctx, dest, { notes, start, duration = 0.16, gain = 0.32, type = "triangle" }) {
  notes.forEach((note, index) => {
    const time = start + index * Math.min(0.075, duration * 0.45);
    const amp = envelope(ctx, dest, {
      time,
      attack: 0.008,
      duration: duration + index * 0.04,
      gain,
    });
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = midi(note);
    osc.connect(amp);
    osc.start(time);
    osc.stop(time + duration + 0.08);
  });
}

export function playDragDropSound() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [76, 84], start: now, duration: 0.13, gain: 0.22, type: "sine" });
    playTick(ctx, bus, { time: now, gain: 0.08, duration: 0.06 });
    window.setTimeout(() => bus.disconnect(), 700);
  });
}

export function playWrongMoveSound() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [63, 58], start: now, duration: 0.2, gain: 0.34, type: "square" });
    window.setTimeout(() => bus.disconnect(), 800);
  });
}

export function playChainBreakSound() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [88, 96], start: now, duration: 0.11, gain: 0.2, type: "triangle" });
    playTick(ctx, bus, { time: now + 0.015, gain: 0.18, duration: 0.08 });
    window.setTimeout(() => bus.disconnect(), 500);
  });
}

export function playPopBurstSound() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [79, 86, 93], start: now, duration: 0.18, gain: 0.25, type: "sine" });
    playTick(ctx, bus, { time: now, gain: 0.22, duration: 0.12 });
    window.setTimeout(() => bus.disconnect(), 650);
  });
}

export function playBombExplosionSound() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playKick(ctx, bus, { time: now, gain: 0.75 });
    playTick(ctx, bus, { time: now, gain: 0.28, duration: 0.18 });
    playToneBurst(ctx, bus, { notes: [48, 40], start: now + 0.02, duration: 0.32, gain: 0.3, type: "sawtooth" });
    window.setTimeout(() => bus.disconnect(), 900);
  });
}

export function playTubeCompleteSound() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [72, 79, 84, 88], start: now, duration: 0.26, gain: 0.38, type: "sine" });
    window.setTimeout(() => bus.disconnect(), 1200);
  });
}

/**
 * The little "cha-ching" that plays as a reward (coins or diamonds) flies up
 * into its total on the level-complete screen. `pitch` shifts the whole
 * run up for the second/third call so coins and diamonds sound distinct
 * when they land close together.
 */
export function playCoinCollectSound({ pitch = 0 } = {}) {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.02;
    playToneBurst(ctx, bus, {
      notes: [74 + pitch, 78 + pitch, 81 + pitch, 86 + pitch, 90 + pitch],
      start: now,
      duration: 0.15,
      gain: 0.36,
      type: "sine",
    });
    window.setTimeout(() => bus.disconnect(), 900);
  });
}

/**
 * Shared speech-synthesis gate.
 *
 * On mobile browsers, calling `speechSynthesis.cancel()` and immediately
 * starting a new utterance — which every voice callout used to do,
 * independently, on top of whatever the previous callout had just
 * queued — is exactly what produces choppy/garbled "phas-phas" playback:
 * mobile TTS engines are much slower to tear down and restart than desktop,
 * so back-to-back calls (e.g. a drag sound's chime plus a "Yay!" callout
 * plus a tube-complete callout, all within a few hundred ms) pile up and
 * fight over the same engine. This gate makes speech calls cooperative:
 * a new line is skipped (not queued, not force-cancelled) while a very
 * recent one is still likely speaking, so at most one line plays at a time
 * and nothing gets cut into stuttering fragments.
 */
let lastSpeechAt = 0;
const SPEECH_MIN_GAP_MS = 650;

function speakLine(text, { rate = 1.15, pitch = 1.85, namePattern = /child|kid|junior|samantha|zira|google|female/i } = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
  const now = Date.now();
  if (now - lastSpeechAt < SPEECH_MIN_GAP_MS) return; // a line is still likely playing — skip rather than cut it off
  lastSpeechAt = now;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferred =
      voices.find((voice) => /en[-_]US/i.test(voice.lang) && namePattern.test(voice.name)) ||
      voices.find((voice) => /en[-_]US/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    // No cancel() here — letting the previous line finish naturally (or be
    // skipped by the gate above) is what avoids the stutter.
    window.speechSynthesis.speak(utterance);
  } catch {
    // The Web Audio chime below still plays if speech synthesis is unavailable.
  }
}

// Child-like positive callout used for gameplay events. Browsers do not
// expose a guaranteed child voice, so we prefer youthful/female English
// voices and use a higher pitch/rate to keep the delivery playful.
export function playKidVoice(text = "Yay!") {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    speakLine(text, { rate: 1.22, pitch: 1.85 });
    const bus = ctx.createGain();
    bus.gain.value = 1.15;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [84, 91], start: now, duration: 0.16, gain: 0.24, type: "triangle" });
    window.setTimeout(() => bus.disconnect(), 700);
  });
}

// Candy-crush-style positive callout. SpeechSynthesis is used when the
// browser has a suitable English voice; the bright chime remains the fallback.
export function playGoodVoice() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    speakLine("Good!", { rate: 1.18, pitch: 1.82, namePattern: /zira|samantha|google|female/i });
    const bus = ctx.createGain();
    bus.gain.value = 1.15;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [79, 84, 91], start: now, duration: 0.22, gain: 0.32, type: "triangle" });
    window.setTimeout(() => bus.disconnect(), 900);
  });
}


export function playLevelCompleteVoice(text = "Level complete! Great job!") {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;
    speakLine(text, { rate: 1.08, pitch: 1.9, namePattern: /zira|samantha|google|female/i });
    const bus = ctx.createGain();
    bus.gain.value = 1.5;
    bus.connect(masterGain);
    const now = ctx.currentTime + 0.032;
    playToneBurst(ctx, bus, { notes: [72, 79, 84, 88, 96], start: now, duration: 0.34, gain: 0.4, type: "triangle" });
    window.setTimeout(() => bus.disconnect(), 1400);
  });
}

/* ------------------------------------------------------------------ */
/* Loop definitions                                                    */
/* ------------------------------------------------------------------ */

/**
 * Menu theme — bright and confident, in D major (D - Bm - G - A) at 92 BPM.
 * A sustained pad, a walking bass and a clear lead melody, so the home screen
 * has something to actually listen to rather than a background hum.
 */
const MENU_CHORDS = [
  { bass: 50, pad: [57, 62, 66, 69], lead: [81, 78, 74, 78] },
  { bass: 47, pad: [54, 59, 62, 66], lead: [78, 74, 71, 74] },
  { bass: 43, pad: [55, 59, 62, 67], lead: [79, 76, 74, 71] },
  { bass: 45, pad: [57, 61, 64, 69], lead: [76, 73, 69, 73] },
];

const MENU_TRACK = {
  bpm: 92,
  stepsPerBeat: 2,
  totalSteps: 32, // 4 bars of 8 eighth-notes
  volume: 1.0,
  reverb: 0.3,
  fadeIn: 1.1,
  playStep(ctx, dest, step, time) {
    const chord = MENU_CHORDS[Math.floor(step / 8) % MENU_CHORDS.length];
    const inBar = step % 8;

    if (inBar === 0) {
      playPad(ctx, dest, { notes: chord.pad, time, duration: 2.7, gain: 0.1 });
    }

    // Walking bass on the beat
    if (inBar % 2 === 0) {
      playBass(ctx, dest, {
        note: inBar === 4 ? chord.bass + 7 : chord.bass,
        time,
        duration: 0.5,
        gain: 0.26,
      });
    }

    // Lead melody
    if (inBar === 0 || inBar === 3 || inBar === 5 || inBar === 6) {
      const index = inBar === 0 ? 0 : inBar === 3 ? 1 : inBar === 5 ? 2 : 3;
      playLead(ctx, dest, {
        note: chord.lead[index],
        time,
        duration: inBar === 6 ? 0.95 : 0.55,
        gain: 0.19,
      });
    }

    // Light shaker on the offbeats
    if (inBar % 2 === 1) {
      playTick(ctx, dest, { time, gain: inBar === 3 ? 0.07 : 0.045 });
    }
  },
};

/**
 * Gameplay theme — driving E minor (Em - C - G - D) at 124 BPM with a kick on
 * every beat, a backbeat snare, a bouncing bass and a sixteenth-note arpeggio.
 * Clearly a different piece of music from the menu theme, and noticeably
 * more energetic.
 */
const GAME_CHORDS = [
  { bass: 40, pad: [55, 59, 64], arp: [64, 67, 71, 76, 71, 67, 71, 67] },
  { bass: 36, pad: [52, 55, 60], arp: [60, 64, 67, 72, 67, 64, 67, 64] },
  { bass: 43, pad: [55, 59, 62], arp: [62, 67, 71, 74, 71, 67, 71, 67] },
  { bass: 38, pad: [54, 57, 62], arp: [62, 66, 69, 74, 69, 66, 69, 66] },
];

const GAME_TRACK = {
  bpm: 124,
  stepsPerBeat: 4,
  totalSteps: 64, // 4 bars of 16 sixteenth-notes
  volume: 0.92,
  reverb: 0.16,
  fadeIn: 0.9,
  playStep(ctx, dest, step, time) {
    const chord = GAME_CHORDS[Math.floor(step / 16) % GAME_CHORDS.length];
    const inBar = step % 16;

    if (inBar === 0) {
      playPad(ctx, dest, { notes: chord.pad, time, duration: 1.9, gain: 0.07 });
    }

    // Four-on-the-floor kick with a pickup before the bar turns over
    if (inBar % 4 === 0 || inBar === 14) {
      playKick(ctx, dest, { time, gain: inBar === 14 ? 0.35 : 0.6 });
    }

    // Backbeat
    if (inBar === 4 || inBar === 12) {
      playSnare(ctx, dest, { time, gain: 0.24 });
    }

    // Bouncing bass
    if (inBar % 4 === 0 || inBar === 6 || inBar === 11) {
      playBass(ctx, dest, {
        note: inBar === 11 ? chord.bass + 12 : chord.bass,
        time,
        duration: 0.26,
        gain: 0.3,
      });
    }

    // Sixteenth arpeggio — skipped on phones (see isLowPowerAudioDevice).
    if (inBar % 2 === 0 && !isLowPowerAudioDevice()) {
      playPluck(ctx, dest, {
        note: chord.arp[(inBar / 2) % chord.arp.length],
        time,
        duration: 0.26,
        gain: 0.16,
        type: "square",
      });
    }

    // Lead accents at the top of each bar
    if (inBar === 0 || inBar === 8) {
      playLead(ctx, dest, {
        note: chord.arp[0] + 12,
        time,
        duration: 0.5,
        gain: 0.14,
      });
    }

    // Hats — skipped on phones (see isLowPowerAudioDevice).
    if (inBar % 4 === 2 && !isLowPowerAudioDevice()) {
      playTick(ctx, dest, { time, gain: 0.075 });
    }
  },
};

const TRACKS = { menu: MENU_TRACK, gameplay: GAME_TRACK };

/* ------------------------------------------------------------------ */
/* Loop scheduler                                                      */
/* ------------------------------------------------------------------ */

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.22;

function createTrack(ctx, definition) {
  const output = ctx.createGain();
  output.gain.value = 0.0001;
  output.connect(masterGain);

  const bus = ctx.createGain();
  bus.connect(output);

  const send = ctx.createGain();
  send.gain.value = definition.reverb;
  const reverb = ctx.createConvolver();
  reverb.buffer = getImpulse(ctx);
  bus.connect(send);
  send.connect(reverb);
  reverb.connect(output);

  const stepDuration = 60 / definition.bpm / definition.stepsPerBeat;
  let step = 0;
  let nextTime = 0;
  let timer = null;

  const tick = () => {
    while (nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      definition.playStep(ctx, bus, step, nextTime);
      step = (step + 1) % definition.totalSteps;
      nextTime += stepDuration;
    }
  };

  return {
    gain: output,
    start() {
      step = 0;
      nextTime = ctx.currentTime + 0.1;
      tick();
      timer = window.setInterval(tick, LOOKAHEAD_MS);
    },
    stopScheduler() {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    },
    dispose() {
      this.stopScheduler();
      try {
        bus.disconnect();
        send.disconnect();
        reverb.disconnect();
        output.disconnect();
      } catch {
        /* already gone */
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Music manager                                                       */
/* ------------------------------------------------------------------ */

let current = null; // { id, track }
let desiredId = null;
let releaseTimer = null;
let gameplayPaused = false;
let documentHidden = false;
let visibilityBound = false;

function wantedTrackId() {
  if (gameplayPaused || documentHidden) return null;
  return desiredId;
}

function fadeOutCurrent(seconds = 0.7) {
  if (!current) return;
  const ctx = getContext();
  const entry = current;
  current = null;
  if (!ctx) {
    entry.dispose?.();
    return;
  }
  const now = ctx.currentTime;
  const gain = entry.track.gain.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(Math.max(gain.value, 0.0001), now);
  gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  entry.track.stopScheduler();
  window.setTimeout(() => entry.track.dispose(), (seconds + 0.8) * 1000);
}

function applyMusic() {
  const wanted = wantedTrackId();

  if (current && current.id !== wanted) {
    fadeOutCurrent(wanted ? 0.6 : 0.9);
  }

  if (!wanted || current) return;

  whenReady(() => {
    // Things may have changed while waiting for the first user gesture.
    if (wantedTrackId() !== wanted || current) return;
    const ctx = getContext();
    if (!ctx) return;

    const definition = TRACKS[wanted];
    const track = createTrack(ctx, definition);
    current = { id: wanted, track };
    track.start();

    const now = ctx.currentTime;
    const gain = track.gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0.0001, now);
    gain.exponentialRampToValueAtTime(definition.volume, now + definition.fadeIn);
  });
}

function bindVisibility() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    documentHidden = document.visibilityState === "hidden";
    applyMusic();
  });
}

/**
 * Ask for a background track. Requesting the track that is already playing is
 * a no-op, so navigating between menu screens never restarts the music.
 */
export function requestMusic(id) {
  if (!TRACKS[id]) return;
  if (releaseTimer !== null) {
    window.clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  bindVisibility();
  desiredId = id;
  applyMusic();
}

/**
 * Release a track when a screen unmounts. The stop is deferred slightly so a
 * route change (old page unmounts, new page mounts) does not cut the audio.
 */
export function releaseMusic(id) {
  if (releaseTimer !== null) window.clearTimeout(releaseTimer);
  releaseTimer = window.setTimeout(() => {
    releaseTimer = null;
    if (desiredId === id) {
      desiredId = null;
      applyMusic();
    }
  }, 300);
}

/** Silences the loop while the game is paused, then brings it back. */
export function setMusicPaused(value) {
  const next = Boolean(value);
  if (gameplayPaused === next) return;
  gameplayPaused = next;
  applyMusic();
}
