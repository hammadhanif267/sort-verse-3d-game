import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { scheduleNavigationFallback, pushWithFallback } from "../src/lib/navigationFallback.js";
import { shouldPlayDangerAlarm } from "../src/lib/dangerAlarm.js";

// All actual screen routes exist and every next/link is routed through the
// safety wrapper. This intentionally does not assert that a browser was run.
const root = new URL("../src", import.meta.url).pathname;
const app = join(root, "app");
for (const route of ["", "levels", "ranking", "profile", "daily", "city", "settings", "gameplay", "journey", "skins", "special", "trophies"]) {
  const file = join(app, route, "page.js");
  assert.doesNotThrow(() => readFileSync(file), `Missing page: ${route || "home"}`);
}
const sources = [];
function walk(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) sources.push(path);
  }
}
walk(root);
for (const file of sources) {
  if (file.endsWith("ReliableLink.jsx")) continue;
  const src = readFileSync(file, "utf8");
  assert.ok(!src.includes('from "next/link"'), `Bypassed navigation fallback: ${relative(root, file)}`);
}
const links = readFileSync(join(root, "components", "ReliableLink.jsx"), "utf8");
assert.match(links, /scheduleNavigationFallback\(href\)/);
assert.match(links, /prefetch=\{false\}/);

// A real click gets client navigation first, then a full-page fallback only
// when no URL change is observed. Subsequent navigation invalidates old timers.
let seq = 0;
let url = "http://localhost:3000/";
const tasks = new Map();
const assigned = [];
globalThis.window = {
  location: { get href() { return url; }, assign(next) { assigned.push(next); url = next; } },
  setTimeout(fn) { const id = ++seq; tasks.set(id, fn); return id; },
  clearTimeout(id) { tasks.delete(id); },
};
function flush() { const queue = [...tasks.values()]; tasks.clear(); queue.forEach((fn) => fn()); }
scheduleNavigationFallback("/ranking");
assert.equal(tasks.size, 1);
url = "http://localhost:3000/ranking/";
flush();
assert.equal(assigned.length, 0, "Successful transition must never hard-reload");
url = "http://localhost:3000/";
scheduleNavigationFallback("/levels");
flush();
assert.equal(assigned.at(-1), "http://localhost:3000/levels/", "Stalled transition must recover");
url = "http://localhost:3000/";
scheduleNavigationFallback("/ranking");
scheduleNavigationFallback("/profile");
flush();
assert.equal(assigned.at(-1), "http://localhost:3000/profile/", "Later tap overrides earlier fallback");
url = "http://localhost:3000/";
pushWithFallback({ push(path) { url = `http://localhost:3000${path}`; } }, "/daily");
flush();
assert.equal(assigned.at(-1), "http://localhost:3000/profile/", "Native back without stall must not reload");
delete globalThis.window;

const alarm = (previous, current, extra = {}) => shouldPlayDangerAlarm({ previous, current, ...extra });
assert.equal(alarm(16, 15), true, "Enter danger zone");
assert.equal(alarm(18, 12), true, "Jump into danger zone");
assert.equal(alarm(11, 10), true, "Ten-second reminder");
assert.equal(alarm(8, 7), false, "No unnecessary per-second alarm");
assert.equal(alarm(6, 4), true, "Do not miss crossed five-second milestone");
assert.equal(alarm(3, 2), true, "Critical seconds");
assert.equal(alarm(2, 1), true, "Final second");
assert.equal(alarm(15, 15), false, "Do not ring just for re-render");
assert.equal(alarm(3, 0), false, "Do not ring after timeout");
for (const mode of ["paused", "completed", "timeUp", "unlimited"]) {
  assert.equal(alarm(16, 15, { [mode]: true }), false, `Do not ring when ${mode}`);
}
for (const t of [null, undefined, 70, -1]) assert.equal(alarm(16, t), false, "Casual or invalid timer does not ring");
const sound = readFileSync(join(root, "lib", "sound.js"), "utf8");
assert.match(sound, /export function playDangerAlarm/);
assert.match(sound, /if \(!effectsOn\(\) \|\| documentHidden/);
assert.match(sound, /ctx\.state !== "running"/, "No delayed queued warning sound");
console.log("PASS: 12 routes, navigation fallback/repeated taps, alarm thresholds, mute and lifecycle checks");
