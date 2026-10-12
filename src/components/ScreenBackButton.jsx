"use client";

import { useRouter } from "next/navigation";
import { pushWithFallback, scheduleNavigationFallback } from "@/lib/navigationFallback";
import { getBackScreen, hasInternalBack, trackFallbackBack } from "@/lib/pageHistory";

/** Use real in-app history when available, and only use fallback on direct entry. */
export function goToPreviousScreen(router, fallback = "/") {
  const previous = getBackScreen(fallback);
  if (hasInternalBack() && window.history.length > 1) {
    scheduleNavigationFallback(previous);
    window.history.back();
  } else {
    trackFallbackBack(previous);
    pushWithFallback(router, previous);
  }
}

export default function ScreenBackButton({ fallback = "/", className = "", children, ...props }) {
  const router = useRouter();
  return (
    <button type="button" {...props} onClick={() => goToPreviousScreen(router, fallback)} className={className}>
      {children}
    </button>
  );
}
