"use client";

import { useEffect, useState } from "react";

const LEVEL_COUNT = 12;
const DIFFICULTIES = ["normal", "hard", "expert"];

// How many stars it takes to grow the city by one level. Every level pays
// out 1-3 stars, so this is worth a little under 3 average levels per city
// level — enough that City Progress visibly moves after almost any level,
// without maxing out the city too quickly.
const STARS_PER_CITY_LEVEL = 9;
export const CITY_MAX_STARS = DIFFICULTIES.length * LEVEL_COUNT * 3;
export const CITY_MAX_LEVEL = 1 + Math.floor(CITY_MAX_STARS / STARS_PER_CITY_LEVEL);

function readStars() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-level-stars") || "{}");
  } catch {
    return {};
  }
}

/**
 * Turns the player's real star total (their actual, already-earned
 * progress — same numbers the Levels screen shows) into a city level and a
 * 0-100 progress-to-next-level percentage. Nothing here is a demo/static
 * value: it's a pure function of what the player has genuinely achieved.
 */
export function computeCityProgress(starsMap) {
  let totalStars = 0;
  DIFFICULTIES.forEach((difficulty) => {
    for (let id = 1; id <= LEVEL_COUNT; id++) {
      totalStars += Number(starsMap[`${difficulty}-${id}`]) || 0;
    }
  });

  const cappedStars = Math.min(totalStars, CITY_MAX_STARS);
  const cityLevel = Math.min(CITY_MAX_LEVEL, 1 + Math.floor(cappedStars / STARS_PER_CITY_LEVEL));
  const starsIntoLevel = cappedStars % STARS_PER_CITY_LEVEL;
  const isMaxLevel = cityLevel >= CITY_MAX_LEVEL;
  const percent = isMaxLevel ? 100 : Math.round((starsIntoLevel / STARS_PER_CITY_LEVEL) * 100);

  return {
    totalStars,
    maxStars: CITY_MAX_STARS,
    cityLevel,
    maxCityLevel: CITY_MAX_LEVEL,
    isMaxLevel,
    percent,
    starsIntoLevel,
    starsPerLevel: STARS_PER_CITY_LEVEL,
    starsToNextLevel: isMaxLevel ? 0 : STARS_PER_CITY_LEVEL - starsIntoLevel,
  };
}

/** Live city-progress hook — recomputes whenever gameplay reports new
 * progress (same "sortverse-progress" event the coin/diamond HUD uses) or
 * another tab changes storage, so this never shows stale numbers. */
export function useCityProgress() {
  const [progress, setProgress] = useState(() => computeCityProgress({}));

  useEffect(() => {
    const sync = () => setProgress(computeCityProgress(readStars()));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sortverse-progress", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sortverse-progress", sync);
    };
  }, []);

  return progress;
}
