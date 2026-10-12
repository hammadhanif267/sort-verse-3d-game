import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  syncPageHistory, trackForwardNavigation, getBackScreen, hasInternalBack,
  trackFallbackBack,
} from "../src/lib/pageHistory.js";

const storage = new Map();
const address = new URL("https://sortverse.example/");
globalThis.window = {
  location: address,
  sessionStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  },
};
function go(path) {
  const url = new URL(path, "https://sortverse.example");
  for (const field of ["pathname", "search", "hash"]) address[field] = url[field];
  syncPageHistory();
}

syncPageHistory();
assert.equal(getBackScreen("/profile"), "/profile/"); // direct entry fallback
assert.equal(hasInternalBack(), false);
trackForwardNavigation("/levels"); go("/levels/");
trackForwardNavigation("/journey"); go("/journey/");
assert.equal(getBackScreen("/levels"), "/levels/");
// A browser Back event should walk the original trail, not bounce to Journey.
go("/levels/");
assert.equal(getBackScreen("/"), "/");
trackForwardNavigation("/ranking"); go("/ranking/");
trackForwardNavigation("/skins"); go("/skins/");
assert.equal(getBackScreen("/profile"), "/ranking/");
trackFallbackBack("/ranking/"); go("/ranking/");
assert.equal(getBackScreen("/"), "/levels/");
// Last visited tab, not the hardcoded route. Query strings are preserved.
trackForwardNavigation("/gameplay?level=5&difficulty=normal");
go("/gameplay/?level=5&difficulty=normal");
assert.equal(getBackScreen("/"), "/ranking/");
trackForwardNavigation("https://evil.invalid/path");
assert.equal(getBackScreen("/"), "/ranking/");
// Back labels on every screen must use the shared controller.
const screens = ["daily", "levels", "city", "ranking", "profile", "settings"];
for (const screen of screens) {
  const source = readFileSync(new URL(`../src/app/${screen}/page.js`, import.meta.url), "utf8");
  assert.match(source, /<ScreenBackButton/);
}
const frame = readFileSync(new URL("../src/components/ExperienceFrame.jsx", import.meta.url), "utf8");
assert.match(frame, /<ScreenBackButton/);
const daily = readFileSync(new URL("../src/app/daily/page.js", import.meta.url), "utf8");
assert.match(daily, /flex-col items-stretch justify-start gap-3 overflow-y-auto/);
const dailySections = ["Streak summary strip", "Today's puzzle", "Free daily claim", "7-day streak row", "Monthly Puzzle Collection", "Streak explainer"];
const positions = dailySections.map((section) => daily.indexOf(section));
assert.ok(positions.every((pos) => pos >= 0));
assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
console.log("PASS: direct entry, multi-screen Back, nested pages, native fallback, query routes, and daily scroll layout");
