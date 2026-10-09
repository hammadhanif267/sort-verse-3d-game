"use client";

import { useEffect, useState } from "react";
import { touchWeekBaseline } from "@/lib/ranking";

const STORAGE_KEYS = {
  level: "sortverse-player-level",
  coins: "sortverse-player-coins",
  diamonds: "sortverse-player-diamonds",
};

const DEFAULT_STATS = { level: 0, coins: 0, diamonds: 0 };
// Bumping this forces a fresh start for every player on next load — used
// once here to undo an earlier test build that seeded everyone straight to
// Level 5 with 400 coins. Real players should always begin at Level 1 with
// nothing banked yet, exactly like a real game.
const APP_RESET_KEY = "sortverse-fresh-start-v1";

function readNumber(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Player progress (level, coins, diamonds) persisted in localStorage.
 * New players always start at Level 0 (no level cleared yet) with 0 coins / 0 diamonds.
 * The level only goes up once a level is actually completed (`completeLevel`).
 * Gameplay screens can later call `addRewards` or `completeLevel`
 * so the HUD keeps growing with real progress instead of demo numbers.
 */
export function usePlayerStats() {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    // Preserve legacy saves. Older builds reset balances when a marker was
    // missing; doing so after a native restore would silently destroy progress.
    if (!window.localStorage.getItem(APP_RESET_KEY)) {
      window.localStorage.setItem(APP_RESET_KEY, "1");
    }

    // Re-read from localStorage into this component's own state. Called on
    // mount, and again whenever a reward is granted anywhere — gameplay
    // dispatches "sortverse-progress" on every level/daily-challenge
    // completion, and "storage" fires for changes made in another tab.
    // Without this, a page whose instance Next.js keeps alive in its
    // client-side route cache (Home, Levels, Daily) would only ever show
    // the coins/diamonds it had at first mount, even after new rewards
    // were written to localStorage by a level played afterwards.
    const sync = () => {
      setStats({
        level: readNumber(STORAGE_KEYS.level, DEFAULT_STATS.level),
        coins: readNumber(STORAGE_KEYS.coins, DEFAULT_STATS.coins),
        diamonds: readNumber(STORAGE_KEYS.diamonds, DEFAULT_STATS.diamonds),
      });
    };

    // Snapshot the score at the start of each week for the Weekly ranking board.
    touchWeekBaseline();

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sortverse-progress", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sortverse-progress", sync);
    };
  }, []);

  function persist(next) {
    setStats(next);
    window.localStorage.setItem(STORAGE_KEYS.level, String(next.level));
    window.localStorage.setItem(STORAGE_KEYS.coins, String(next.coins));
    window.localStorage.setItem(STORAGE_KEYS.diamonds, String(next.diamonds));
    // Let any other mounted page (Home, Levels, Daily) know its HUD numbers
    // are stale, whatever call site triggered this — level completion, the
    // daily-streak bonus, anything added later.
    window.dispatchEvent(new Event("sortverse-progress"));
  }

  function addRewards({ coins = 0, diamonds = 0 } = {}) {
    // Read at mutation time: boosters, free claims, and win rewards can
    // happen before React has committed the previous stats render.
    persist({
      level: readNumber(STORAGE_KEYS.level, 0),
      coins: Math.max(0, readNumber(STORAGE_KEYS.coins, 0) + coins),
      diamonds: Math.max(0, readNumber(STORAGE_KEYS.diamonds, 0) + diamonds),
    });
  }

  function completeLevel({ level = null, coins = 0, diamonds = 0 } = {}) {
    const nextLevel = Number.isFinite(Number(level))
      ? Math.max(readNumber(STORAGE_KEYS.level, 0), Number(level))
      : readNumber(STORAGE_KEYS.level, 0) + 1;
    persist({
      level: nextLevel,
      coins: Math.max(0, readNumber(STORAGE_KEYS.coins, 0) + coins),
      diamonds: Math.max(0, readNumber(STORAGE_KEYS.diamonds, 0) + diamonds),
    });
  }

  return { ...stats, addRewards, completeLevel };
}
