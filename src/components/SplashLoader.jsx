"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingView from "@/components/LoadingView";
import { AVATAR_PRESETS } from "@/components/RankBits";

/**
 * Launch loader, shown once each time the game is opened.
 *
 * It really preloads the pictures the first screens need, so by the time it
 * reaches 100% the home screen, the level screen and the avatar appear
 * instantly. It is built to be quick: a short minimum so the bar can run
 * smoothly, and a hard cap so a slow connection never traps the player.
 */

const MIN_MS = 900; // shortest time the screen stays up (cached loads finish here)
const MAX_MS = 2500; // hard cap, even if something is still loading
const HOLD_MS = 140; // pause on 100% before fading
const FADE_MS = 300;
const REDUCED_MIN_MS = 350;

const BASE_IMAGES = ["/images/home-city-background.webp", "/gameplay-background.webp", "/gameplay-factory.webp"];

function savedAvatarImage() {
  try {
    const avatar = JSON.parse(window.localStorage.getItem("sortverse-player-avatar") || "null");
    if (avatar?.preset && AVATAR_PRESETS[avatar.preset]) return AVATAR_PRESETS[avatar.preset];
  } catch {}
  return null;
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done; // a missing picture must never block the game
    img.src = src;
    if (img.complete) done();
  });
}

export default function SplashLoader() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);
  const real = useRef(0); // 0..1 fraction of assets that are ready

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const minMs = reduced ? REDUCED_MIN_MS : MIN_MS;

    // ---- real work -------------------------------------------------------
    const images = [...BASE_IMAGES];
    const avatar = savedAvatarImage();
    if (avatar) images.push(avatar);
    const tasks = images.map(preloadImage);
    if (document.fonts?.ready) tasks.push(document.fonts.ready.catch(() => {}));
    let finished = 0;
    tasks.forEach((task) => task.then(() => { finished += 1; real.current = finished / tasks.length; }));

    // warm up the screens the player is most likely to open next
    try {
      router.prefetch("/gameplay");
      router.prefetch("/levels");
    } catch {}

    // ---- smooth progress -------------------------------------------------
    const start = performance.now();
    let shown = 0;
    let raf = 0;
    let timers = [];
    let closing = false;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / minMs);
      const paced = 100 * (1 - Math.pow(1 - t, 2)); // eases out, never linear/boring
      const target = elapsed >= MAX_MS ? 100 : Math.min(real.current * 100, paced);
      shown = Math.min(100, shown + Math.max((target - shown) * 0.22, target > shown ? 0.6 : 0));
      if (shown > 99.4 && target >= 100) shown = 100;
      setProgress(shown);

      if (shown >= 100 && !closing) {
        closing = true;
        timers.push(setTimeout(() => setFading(true), HOLD_MS));
        timers.push(setTimeout(() => setGone(true), HOLD_MS + FADE_MS + 40));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <>
      <noscript>
        <style>{".sv-splash{display:none!important}"}</style>
      </noscript>
      <LoadingView progress={progress} fading={fading} />
    </>
  );
}
