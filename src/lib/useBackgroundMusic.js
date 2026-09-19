"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  isMuted,
  releaseMusic,
  requestMusic,
  setMusicPaused,
  subscribeMuted,
  toggleMuted,
} from "@/lib/sound";

/**
 * Keeps one continuous background loop running for as long as the screen is
 * mounted.
 *
 *   useBackgroundMusic("menu")                    // home, levels, any menu page
 *   useBackgroundMusic("gameplay", { delay: 1300, paused })
 *
 * Because the audio engine is a module-level singleton, moving between two
 * screens that both ask for "menu" keeps the same loop playing seamlessly.
 */
export default function useBackgroundMusic(trackId, options = {}) {
  const { delay = 0, paused = false } = options;

  useEffect(() => {
    if (!trackId) return undefined;

    let timer = null;
    if (delay > 0) {
      timer = window.setTimeout(() => requestMusic(trackId), delay);
    } else {
      requestMusic(trackId);
    }

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      releaseMusic(trackId);
    };
  }, [trackId, delay]);

  useEffect(() => {
    setMusicPaused(paused);
    return () => setMusicPaused(false);
  }, [paused]);
}

/** `[muted, toggle]` for a sound on/off control. The choice is remembered. */
export function useSoundMuted() {
  const muted = useSyncExternalStore(
    subscribeMuted,
    () => isMuted(),
    () => false,
  );

  return [muted, toggleMuted];
}
