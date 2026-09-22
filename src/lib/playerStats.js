"use client";

import { useEffect, useState } from "react";

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
    // Every player starts completely fresh: Level 1 unlocked (nothing
    // cleared yet), 0 coins, 0 diamonds, and an unclaimed daily reward —
    // exactly like a real game. This also runs once for anyone who already
    // has state from the earlier test build (seeded at Level 5), wiping it
    // back to a true fresh start.
    if (!window.localStorage.getItem(APP_RESET_KEY)) {
      window.localStorage.removeItem("sortverse-level-stars");
      window.localStorage.removeItem("sortverse-level-rewards");
      window.localStorage.removeItem("sortverse-difficulty-progress");
      window.localStorage.removeItem("sortverse-daily-completed");
      window.localStorage.removeItem("sortverse-daily-free-claim");
      window.localStorage.removeItem("sortverse-daily-streak-bonus");
      window.localStorage.setItem(STORAGE_KEYS.level, "0");
      window.localStorage.setItem(STORAGE_KEYS.coins, "0");
      window.localStorage.setItem(STORAGE_KEYS.diamonds, "0");
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
    persist({
      ...stats,
      coins: stats.coins + coins,
      diamonds: stats.diamonds + diamonds,
    });
  }

  function completeLevel({ coins = 0, diamonds = 0 } = {}) {
    persist({
      level: stats.level + 1,
      coins: stats.coins + coins,
      diamonds: stats.diamonds + diamonds,
    });
  }

  return { ...stats, addRewards, completeLevel };
}
