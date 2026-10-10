// Node-only test for theme persistence, validation and cross-tab updates.
import assert from "node:assert/strict";
import { THEMES, DEFAULT_THEME, THEME_KEY, applySavedTheme, getTheme, setTheme, subscribeToTheme } from "../src/lib/theme.js";

const saved = new Map();
const mockWindow = new EventTarget();
mockWindow.localStorage = {
  getItem: (key) => saved.has(key) ? saved.get(key) : null,
  setItem: (key, value) => saved.set(key, String(value)),
  removeItem: (key) => saved.delete(key),
};
globalThis.window = mockWindow;
globalThis.document = { documentElement: { dataset: {} } };

assert.equal(getTheme(), DEFAULT_THEME);
applySavedTheme();
assert.equal(document.documentElement.dataset.sortverseTheme, "neon");
let updates = 0;
const unsubscribe = subscribeToTheme(() => updates++);
for (const { id } of THEMES) {
  setTheme(id);
  assert.equal(getTheme(), id);
  assert.equal(saved.get(THEME_KEY), id);
  assert.equal(document.documentElement.dataset.sortverseTheme, id);
}
assert.equal(updates, THEMES.length);
setTheme("invalid-theme");
assert.equal(getTheme(), DEFAULT_THEME);
assert.equal(document.documentElement.dataset.sortverseTheme, DEFAULT_THEME);
saved.set(THEME_KEY, "forest");
const externalEvent = new Event("storage");
Object.defineProperty(externalEvent, "key", { value: THEME_KEY });
window.dispatchEvent(externalEvent);
assert.equal(document.documentElement.dataset.sortverseTheme, "forest");
assert.equal(getTheme(), "forest");
assert.equal(updates, THEMES.length + 2);
unsubscribe();
setTheme("royal");
assert.equal(updates, THEMES.length + 2);
console.log("PASS: 4 themes, persistent selection, invalid fallback and cross-tab refresh");
