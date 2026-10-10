"use client";

import { useEffect, useState } from "react";
import { initializeMirror } from "@/lib/backup";
import { applySavedTheme } from "@/lib/theme";

export default function OfflineBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    initializeMirror().finally(() => {
      // Native Preferences must restore before the theme is read.
      if (active) { applySavedTheme(); setReady(true); }
    });
    return () => { active = false; };
  }, []);
  // Hold the first client render until native preferences have been restored.
  return ready ? children : <div className="min-h-dvh bg-[#020b15]" aria-label="Loading local progress" />;
}
