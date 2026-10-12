"use client";

import Link from "next/link";
import { scheduleNavigationFallback } from "@/lib/navigationFallback";

/**
 * All in-game screen links use the normal Next.js transition first, keeping
 * sound and UI state alive. If that transition stalls (notably in WebView),
 * a normal document navigation takes over. Disabling automatic prefetch avoids
 * unnecessary competing route loads on smaller Android devices.
 */
export default function ReliableLink({ href, onClick, target, download, children, ...props }) {
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || download != null || (target && target !== "_self")) return;
    scheduleNavigationFallback(href);
  };

  // Ignore caller prefetch preferences: eager loading is intentionally disabled.
  const { prefetch: ignoredPrefetch, ...anchorProps } = props;
  void ignoredPrefetch;
  return (
    <Link {...anchorProps} href={href} prefetch={false} target={target} download={download} onClick={handleClick}>
      {children}
    </Link>
  );
}
