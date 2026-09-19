"use client";

import { useEffect, useState } from "react";

const STORAGE_KEYS = {
  level: "sortverse-player-level",
  coins: "sortverse-player-coins",
  diamonds: "sortverse-player-diamonds",
};

const DEFAULT_STATS = { level: 0, coins: 0, diamonds: 0 };
const APP_RESET_KEY = "sortverse-clean-start-v4";

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
    // Every delivered build starts from a clean Level 1 state.
    // The versioned key makes this reset happen once for this build only;
    // progress earned after first launch is then persisted normally.
    if (!window.localStorage.getItem(APP_RESET_KEY)) {
      window.localStorage.removeItem("sortverse-difficulty-progress");
      window.localStorage.removeItem("sortverse-level-stars");
      window.localStorage.setItem(STORAGE_KEYS.level, "0");
      window.localStorage.setItem(STORAGE_KEYS.coins, "0");
      window.localStorage.setItem(STORAGE_KEYS.diamonds, "0");
      window.localStorage.setItem(APP_RESET_KEY, "1");
    }

    setStats({
      level: readNumber(STORAGE_KEYS.level, DEFAULT_STATS.level),
      coins: readNumber(STORAGE_KEYS.coins, DEFAULT_STATS.coins),
      diamonds: readNumber(STORAGE_KEYS.diamonds, DEFAULT_STATS.diamonds),
    });
  }, []);

  function persist(next) {
    setStats(next);
    window.localStorage.setItem(STORAGE_KEYS.level, String(next.level));
    window.localStorage.setItem(STORAGE_KEYS.coins, String(next.coins));
    window.localStorage.setItem(STORAGE_KEYS.diamonds, String(next.diamonds));
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
