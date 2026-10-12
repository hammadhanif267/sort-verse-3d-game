/**
 * This session-only navigation trail is deliberately separate from saved game
 * progress. It tracks in-app screen transitions even when Capacitor performs
 * a full-page fallback, so Back can return to the actual previous screen.
 */
const HISTORY_KEY = "sortverse-page-history-v1";
const MAX_ENTRIES = 32;

function safePage(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.length > 1024) return null;
  try {
    const url = new URL(value, "https://sortverse.invalid");
    if (url.origin !== "https://sortverse.invalid") return null;
    const path = url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/, "")}/`;
    return `${path}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function currentScreen() {
  if (typeof window === "undefined") return "/";
  return safePage(`${window.location.pathname}${window.location.search}${window.location.hash}`) || "/";
}

function readTrail() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.sessionStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.map(safePage).filter(Boolean).slice(-MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function saveTrail(entries) {
  try { window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES))); } catch { /* Private mode: fall back gracefully */ }
}

/** Called on app start and browser/Android history traversal. */
export function syncPageHistory() {
  if (typeof window === "undefined") return;
  const current = currentScreen();
  const trail = readTrail();
  if (trail.at(-1) === current) return;
  // When the browser goes Back, remove the pages visited after the target.
  const previousIndex = trail.lastIndexOf(current);
  if (previousIndex !== -1) saveTrail(trail.slice(0, previousIndex + 1));
  else saveTrail([...trail, current]);
}

/** Called for forward navigation by any in-app navigation link. */
export function trackForwardNavigation(href) {
  if (typeof window === "undefined") return;
  const destination = safePage(href);
  if (!destination) return;
  syncPageHistory();
  const current = currentScreen();
  if (destination === current) return;
  saveTrail([...readTrail(), destination]);
}

/** Return the last actual screen, or a route-specific safe fallback. */
export function getBackScreen(fallback = "/") {
  const safeFallback = safePage(fallback) || "/";
  if (typeof window === "undefined") return safeFallback;
  const trail = readTrail();
  const current = currentScreen();
  if (trail.at(-1) === current && trail.length > 1) return trail.at(-2);
  return safeFallback;
}

export function hasInternalBack() {
  const trail = readTrail();
  return trail.length > 1 && trail.at(-1) === currentScreen();
}

/** Pop trail when explicit fallback navigation replaces a missing browser entry. */
export function trackFallbackBack(destination) {
  if (typeof window === "undefined") return;
  const target = safePage(destination);
  if (!target) return;
  const trail = readTrail();
  const lastIndex = trail.lastIndexOf(target);
  saveTrail(lastIndex >= 0 ? trail.slice(0, lastIndex + 1) : [target]);
}
