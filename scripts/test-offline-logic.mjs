import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Load only pure local game modules; no Next/Capacitor packages are required.
const load = async (filename, transform = (source) => source) => {
  const source = transform(readFileSync(new URL(`../src/lib/${filename}`, import.meta.url), 'utf8'));
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);
};

const { calculateLevelAward } = await load('rewards.js');
const first = calculateLevelAward({}, {}, 'normal-1', 2, 100);
assert.deepEqual({ coins: first.coins, diamonds: first.diamonds }, { coins: 100, diamonds: 2 });
const replay = calculateLevelAward({ 'normal-1': 2 }, { 'normal-1': first.total }, 'normal-1', 2, 999);
assert.deepEqual({ coins: replay.coins, diamonds: replay.diamonds }, { coins: 0, diamonds: 0 });
const improvement = calculateLevelAward({ 'normal-1': 2 }, { 'normal-1': first.total }, 'normal-1', 3, 100);
assert.deepEqual({ coins: improvement.coins, diamonds: improvement.diamonds }, { coins: 0, diamonds: 1 });
const legacy = calculateLevelAward({ 'normal-1': 3 }, {}, 'normal-1', 3, 300);
assert.deepEqual({ coins: legacy.coins, diamonds: legacy.diamonds }, { coins: 0, diamonds: 0 });

class FakeStorage {
  #map = new Map();
  get length() { return this.#map.size; }
  key(i) { return Array.from(this.#map.keys())[i] ?? null; }
  getItem(k) { return this.#map.get(k) ?? null; }
  setItem(k,v) { this.#map.set(String(k), String(v)); Object.defineProperty(this, String(k), { configurable: true, enumerable: true, writable: true, value: String(v) }); }
  removeItem(k) { this.#map.delete(String(k)); delete this[k]; }
  clear() { for (const k of this.#map.keys()) delete this[k]; this.#map.clear(); }
}
// FakeStorage's class private fields are not enumerable.
globalThis.window = { localStorage: new FakeStorage(), dispatchEvent() {} };
globalThis.Event = class Event {};
const { collectProgress, exportCode, parseCode, overwriteProgress } = await load('backup.js', (source) => source.replace('import { isNative } from "@/lib/native";', 'const isNative = () => false;'));
window.localStorage.setItem('sortverse-player-coins', '250');
window.localStorage.setItem('sortverse-avatar-photo', 'data:image/jpeg;base64,xyz');
window.localStorage.setItem('unrelated-key', 'not backed up');
assert.equal(Object.keys(collectProgress()).length, 2);
const code = await exportCode();
assert.ok(code.startsWith('SV1.'));
const restored = await parseCode(code);
assert.equal(restored['sortverse-avatar-photo'], 'data:image/jpeg;base64,xyz');
await assert.rejects(() => parseCode(`${code.slice(0,-1)}${code.at(-1)==='A'?'B':'A'}`), /checksum mismatch/);
window.localStorage.setItem('sortverse-player-coins', '900');
overwriteProgress(restored);
assert.equal(window.localStorage.getItem('sortverse-player-coins'), '250');
assert.equal(window.localStorage.getItem('unrelated-key'), 'not backed up');
console.log('PASS: first clear, replay, star improvement, legacy reward migration');
console.log('PASS: versioned backup, photo data, SHA-256 tamper rejection, overwrite recovery');
