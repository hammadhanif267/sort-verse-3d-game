/**
 * Canonical URLs for the statically exported App Router pages.
 * Capacitor serves exported pages from /route/index.html, so the trailing
 * slash matters when a stalled soft navigation needs a hard-navigation backup.
 */
export function internalRouteUrl(href, currentUrl) {
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return null;
  const target = new URL(href, currentUrl);
  const current = new URL(currentUrl);
  if (target.origin !== current.origin) return null;
  if (!target.pathname.endsWith("/") && !/\.[^/]+$/.test(target.pathname)) {
    target.pathname += "/";
  }
  return target.href;
}

export function isSameDestination(firstUrl, secondUrl) {
  const first = new URL(firstUrl);
  const second = new URL(secondUrl);
  const normalize = (path) => path.replace(/\/+$/, "") || "/";
  return first.origin === second.origin &&
    normalize(first.pathname) === normalize(second.pathname) &&
    first.search === second.search && first.hash === second.hash;
}
