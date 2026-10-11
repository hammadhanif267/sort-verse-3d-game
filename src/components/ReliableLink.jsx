"use client";

import NextLink from "next/link";
import { internalRouteUrl, isSameDestination } from "@/lib/navigation.mjs";

const NAVIGATION_TIMEOUT_MS = 2000;
// One watchdog for all navigation targets: a second tap cancels the first.
let pendingFallback = null;

/**
 * Retains Next's in-app navigation. If the mobile WebView never leaves the
 * original URL, retry with the static-export URL instead of a dead tap.
 */
export default function ReliableLink({ href, onClick, ...props }) {
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;

    const startingUrl = window.location.href;
    const destination = internalRouteUrl(href, startingUrl);
    if (!destination) return;

    window.clearTimeout(pendingFallback);
    if (isSameDestination(startingUrl, destination)) return;

    pendingFallback = window.setTimeout(() => {
      // A successful route change (or a different navigation) needs no retry.
      if (!isSameDestination(startingUrl, window.location.href)) return;
      // Use a canonical absolute URL for /route/index.html static exports.
      window.location.assign(destination);
    }, NAVIGATION_TIMEOUT_MS);
  };

  // Simultaneous prefetches of every bottom tab are expensive on small phones.
  return <NextLink {...props} href={href} prefetch={false} onClick={handleClick} />;
}
