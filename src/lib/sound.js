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
    masterGain = audioCtx.createGain();
    masterGain.gain.value = readMuted() ? 0 : 1;
    masterGain.connect(audioCtx.destination);
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
function playPad(ctx, dest, { notes, time, duration, gain = 0.05 }) {
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
function playPluck(ctx, dest, { note, time, duration = 0.5, gain = 0.07, type = "triangle" }) {
  const amp = envelope(ctx, dest, { time, attack: 0.012, duration, gain });
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = midi(note);
  osc.connect(amp);
  osc.start(time);
  osc.stop(time + duration + 0.06);
}

/** Rounded bass note with a soft sub. */
function playBass(ctx, dest, { note, time, duration = 0.4, gain = 0.1 }) {
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
function playTick(ctx, dest, { time, gain = 0.03, duration = 0.045 }) {
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

/* ------------------------------------------------------------------ */
/* Intro chime (plays once, at the start of gameplay)                  */
/* ------------------------------------------------------------------ */

export function playIntroChime() {
  whenReady(() => {
    const ctx = getContext();
    if (!ctx) return;

    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(masterGain);

    const send = ctx.createGain();
    send.gain.value = 0.3;
    const reverb = ctx.createConvolver();
    reverb.buffer = getImpulse(ctx);
    bus.connect(send);
    send.connect(reverb);
    reverb.connect(masterGain);

    const now = ctx.currentTime + 0.03;
    const notes = [72, 76, 79, 84]; // C5 - E5 - G5 - C6
    const step = 0.11;

    notes.forEach((note, index) => {
      const isLast = index === notes.length - 1;
      playPluck(ctx, bus, {
        note,
        time: now + index * step,
        duration: isLast ? 0.9 : 0.35,
        gain: isLast ? 0.2 : 0.15,
        type: "sine",
      });
    });

    // Warm low pad under the final note for a cinematic finish.
    playPad(ctx, bus, {
      notes: [48, 55, 64],
      time: now + (notes.length - 1) * step,
      duration: 1.3,
      gain: 0.05,
    });

    // Release the temporary bus once the tail has died away.
    window.setTimeout(() => {
      try {
        bus.disconnect();
        send.disconnect();
        reverb.disconnect();
      } catch {
        /* already gone */
      }
    }, 4000);
  });
}

/* ------------------------------------------------------------------ */
/* Loop definitions                                                    */
/* ------------------------------------------------------------------ */

/**
 * Calm, airy menu theme (C - Am - F - G, 78 BPM, ~12s seamless loop).
 * Deliberately gentle so it can run for a long time without tiring the player.
 */
const MENU_CHORDS = [
  { bass: 48, pad: [48, 55, 64, 71], lead: [72, 76, 79] },
  { bass: 45, pad: [45, 52, 60, 67], lead: [69, 72, 76] },
  { bass: 41, pad: [41, 48, 57, 64], lead: [65, 69, 72] },
  { bass: 43, pad: [43, 50, 59, 62], lead: [67, 71, 74] },
];

const MENU_TRACK = {
  bpm: 78,
  stepsPerBeat: 2,
  totalSteps: 32, // 4 bars of 8 eighth-notes
  volume: 0.5,
  reverb: 0.34,
  fadeIn: 1.6,
  playStep(ctx, dest, step, time) {
    const chord = MENU_CHORDS[Math.floor(step / 8) % MENU_CHORDS.length];
    const inBar = step % 8;

    if (inBar === 0) {
      playPad(ctx, dest, { notes: chord.pad, time, duration: 3.2, gain: 0.05 });
      playBass(ctx, dest, { note: chord.bass, time, duration: 2.1, gain: 0.085 });
    }

    if (inBar === 2 || inBar === 5 || inBar === 7) {
      const index = inBar === 2 ? 0 : inBar === 5 ? 1 : 2;
      playPluck(ctx, dest, {
        note: chord.lead[index],
        time,
        duration: 1.2,
        gain: 0.05,
        type: "sine",
      });
    }
  },
};

/**
 * Driving gameplay theme (Am - F - C - G, 112 BPM, ~8.5s seamless loop).
 * Same harmonic family as the menu so the switch feels intentional, but with
 * a pulse and a 16th-note arpeggio that keep the sorting action moving.
 */
const GAME_CHORDS = [
  { bass: 45, pad: [57, 60, 64], arp: [69, 72, 76, 81, 76, 72, 76, 72] },
  { bass: 41, pad: [53, 57, 60], arp: [65, 69, 72, 77, 72, 69, 72, 69] },
  { bass: 48, pad: [55, 60, 64], arp: [67, 72, 76, 79, 76, 72, 76, 72] },
  { bass: 43, pad: [55, 59, 62], arp: [67, 71, 74, 79, 74, 71, 74, 71] },
];

const GAME_TRACK = {
  bpm: 112,
  stepsPerBeat: 4,
  totalSteps: 64, // 4 bars of 16 sixteenth-notes
  volume: 0.45,
  reverb: 0.2,
  fadeIn: 1.2,
  playStep(ctx, dest, step, time) {
    const chord = GAME_CHORDS[Math.floor(step / 16) % GAME_CHORDS.length];
    const inBar = step % 16;

    if (inBar === 0) {
      playPad(ctx, dest, { notes: chord.pad, time, duration: 2.2, gain: 0.03 });
    }

    if (inBar === 0 || inBar === 6 || inBar === 8 || inBar === 14) {
      playBass(ctx, dest, { note: chord.bass, time, duration: 0.32, gain: 0.1 });
    }

    if (inBar % 2 === 0) {
      playPluck(ctx, dest, {
        note: chord.arp[(inBar / 2) % chord.arp.length],
        time,
        duration: 0.3,
        gain: 0.055,
        type: "triangle",
      });
    }

    if (inBar % 4 === 2) {
      playTick(ctx, dest, { time, gain: 0.025 });
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
