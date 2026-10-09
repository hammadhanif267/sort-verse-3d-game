"use client";

import { isNative } from "@/lib/native";

const MIRROR_KEY = "sortverse-progress-mirror-v1";
const PREFIX = "sortverse-";

export function collectProgress() {
  const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(PREFIX)).sort();
  return Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)]));
}

function validProgress(data) {
  return data && typeof data === "object" && !Array.isArray(data) &&
    Object.keys(data).length <= 500 && Object.entries(data).every(([key, value]) =>
      key.startsWith(PREFIX) && key.length <= 160 && typeof value === "string" && value.length <= 8_000_000);
}

function bytesToBase64(bytes) {
  let str = "";
  for (let i = 0; i < bytes.length; i += 8192) str += String.fromCharCode(...bytes.slice(i, i + 8192));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64ToBytes(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid backup encoding");
  const raw = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
async function checksum(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error("Secure checksum unavailable");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToBase64(new Uint8Array(digest));
}

export async function exportCode() {
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, data: collectProgress() }));
  return `SV1.${bytesToBase64(bytes)}.${await checksum(bytes)}`;
}

export async function parseCode(code) {
  const parts = String(code).trim().split(".");
  if (parts.length !== 3 || parts[0] !== "SV1") throw new Error("Unsupported backup version");
  if (parts[1].length > 14_000_000) throw new Error("Backup code is too large");
  const bytes = base64ToBytes(parts[1]);
  if ((await checksum(bytes)) !== parts[2]) throw new Error("Backup checksum mismatch. Nothing imported.");
  let payload;
  try { payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error("Corrupted backup data"); }
  if (payload?.version !== 1 || !validProgress(payload.data)) throw new Error("Invalid backup contents");
  return payload.data;
}

export function overwriteProgress(data) {
  if (!validProgress(data)) throw new Error("Invalid progress data");
  Object.keys(window.localStorage).filter((key) => key.startsWith(PREFIX)).forEach((key) => window.localStorage.removeItem(key));
  Object.entries(data).forEach(([key, value]) => window.localStorage.setItem(key, value));
  window.dispatchEvent(new Event("sortverse-progress"));
  window.dispatchEvent(new Event("sortverse-profile"));
  window.dispatchEvent(new Event("sortverse-backup-changed"));
}

let mirrorQueue = Promise.resolve();
export function queueMirror() {
  if (!isNative()) return;
  // Serialize writes; a slow old snapshot must never clobber a newer one.
  mirrorQueue = mirrorQueue.catch(() => {}).then(async () => {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: MIRROR_KEY, value: JSON.stringify(collectProgress()) });
  }).catch((error) => console.warn("Progress mirror failed", error));
}

export async function initializeMirror() {
  if (!isNative()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    if (!Object.keys(collectProgress()).length) {
      const { value } = await Preferences.get({ key: MIRROR_KEY });
      if (value) {
        const data = JSON.parse(value);
        if (validProgress(data)) overwriteProgress(data);
      }
    }
    // Hook mutations so all existing modules use a single write-through mirror
    // without changing their localStorage key shapes or event semantics.
    const storage = window.localStorage;
    const proto = Object.getPrototypeOf(storage);
    if (!proto.__sortverseMirrored) {
      const set = proto.setItem;
      const remove = proto.removeItem;
      const clear = proto.clear;
      proto.setItem = function (key, value) {
        set.call(this, key, value);
        if (String(key).startsWith(PREFIX)) queueMirror();
      };
      proto.removeItem = function (key) {
        remove.call(this, key);
        if (String(key).startsWith(PREFIX)) queueMirror();
      };
      proto.clear = function () { clear.call(this); queueMirror(); };
      Object.defineProperty(proto, "__sortverseMirrored", { value: true, configurable: true });
    }
    queueMirror();
  } catch (error) {
    console.warn("Native progress restore unavailable", error);
  }
}
