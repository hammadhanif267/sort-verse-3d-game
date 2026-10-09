"use client";

import { useEffect, useState } from "react";
import LoadingView from "@/components/LoadingView";

/**
 * Short loader for in-game route changes (e.g. opening a level). It climbs
 * quickly towards ~92% and waits there until Next swaps the real screen in,
 * which unmounts it.
 */
export default function RouteLoading({ label = "Loading level" }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 650);
      setProgress(92 * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <LoadingView progress={progress} label={label} />;
}
