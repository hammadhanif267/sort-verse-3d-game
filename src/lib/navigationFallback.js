/**
 * A single watchdog shared by every in-app screen link.
 * The router keeps transitions instant in normal operation. A stalled route
 * receives a standard navigation instead of leaving a dead button.
 * No persistent state or network service is required.
 */
let pendingTimer = null;

export function scheduleNavigationFallback(href, delayMs = 1800) {
  if (typeof window === "undefined" || typeof href !== "string" || !href.startsWith("/")) return;
  if (pendingTimer !== null) window.clearTimeout(pendingTimer);
  pendingTimer = null;
  const before = new URL(window.location.href);
  const target = new URL(href, before.origin);
  // Static export writes /ranking/index.html, /levels/index.html, etc. A
  // trailing slash works on both Next dev and Capacitor's offline asset server.
  if (target.pathname !== "/" && !target.pathname.endsWith("/") && !target.pathname.split("/").at(-1).includes(".")) {
    target.pathname += "/";
  }
  // Do not navigate on a click to the current screen or an external address.
  if (before.origin !== target.origin || before.pathname === target.pathname && before.search === target.search && before.hash === target.hash) return;

  pendingTimer = window.setTimeout(() => {
    pendingTimer = null;
    const now = new URL(window.location.href);
    // A newer screen navigation has already succeeded or taken over.
    if (now.pathname !== before.pathname || now.search !== before.search || now.hash !== before.hash) return;
    window.location.assign(target.href);
  }, delayMs);
}

/** For imperative routes such as the Android hardware Back button. */
export function pushWithFallback(router, href) {
  scheduleNavigationFallback(href);
  router.push(href);
}
