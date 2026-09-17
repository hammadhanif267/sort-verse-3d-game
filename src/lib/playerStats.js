"use client";

import { useEffect, useState } from "react";

const STORAGE_KEYS = {
  level: "sortverse-player-level",
  coins: "sortverse-player-coins",
  diamonds: "sortverse-player-diamonds",
};

const DEFAULT_STATS = { level: 1, coins: 0, diamonds: 0 };

function readNumber(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Player progress (level, coins, diamonds) persisted in localStorage.
 * New players always start at Level 1 with 0 coins / 0 diamonds.
 * Gameplay screens can later call `addRewards` or `completeLevel`
 * so the HUD keeps growing with real progress instead of demo numbers.
 */
export function usePlayerStats() {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
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
