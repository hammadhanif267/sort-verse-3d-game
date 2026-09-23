"use client";

import { useEffect, useState } from "react";

const LEVEL_COUNT = 12;
const DIFFICULTIES = ["normal", "hard", "expert"];

// Stars required for each city-level jump:
// 1→2: 6, 2→3: 7, 3→4: 7, 4→5: 8, 5→6: 8, 6→7: 9,
// 7→8: 9, 8→9: 10, 9→10: 10, 10→11: 11, 11→12: 11, 12→13: 12.
const CITY_LEVEL_COSTS = [6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12];

// Cumulative stars needed to reach city levels 1..13.
const CITY_LEVEL_THRESHOLDS = [0];
for (const cost of CITY_LEVEL_COSTS) {
  CITY_LEVEL_THRESHOLDS.push(CITY_LEVEL_THRESHOLDS[CITY_LEVEL_THRESHOLDS.length - 1] + cost);
}

export const CITY_MAX_STARS = DIFFICULTIES.length * LEVEL_COUNT * 3;
export const CITY_MAX_LEVEL = 13;

function readStars() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-level-stars") || "{}");
  } catch {
    return {};
  }
}

/**
 * The six supplied city images are used progressively across the 13 city levels:
 * Stage 1 = city levels 1-2
 * Stage 2 = 3-4
 * Stage 3 = 5-6
 * Stage 4 = 7-8
 * Stage 5 = 9-10
 * Stage 6 = 11-13
 */
export function getCityStage(cityLevel) {
  if (cityLevel <= 2) return 1;
  if (cityLevel <= 4) return 2;
  if (cityLevel <= 6) return 3;
  if (cityLevel <= 8) return 4;
  if (cityLevel <= 10) return 5;
  return 6;
}

/**
 * Turns the player's real earned stars into city progress. The first city
 * level starts at zero stars, and each following jump uses the progressive
 * cost table above. Total possible stars remain 108 (36 levels × 3 stars).
 */
export function computeCityProgress(starsMap) {
  let totalStars = 0;
  DIFFICULTIES.forEach((difficulty) => {
    for (let id = 1; id <= LEVEL_COUNT; id++) {
      totalStars += Number(starsMap[`${difficulty}-${id}`]) || 0;
    }
  });

  const cappedStars = Math.min(totalStars, CITY_MAX_STARS);

  let cityLevel = 1;
  for (let level = 2; level <= CITY_MAX_LEVEL; level++) {
    if (cappedStars >= CITY_LEVEL_THRESHOLDS[level - 1]) {
      cityLevel = level;
    } else {
      break;
    }
  }

  const currentThreshold = CITY_LEVEL_THRESHOLDS[cityLevel - 1];
  const isMaxLevel = cityLevel >= CITY_MAX_LEVEL;
  const nextThreshold = isMaxLevel ? CITY_MAX_STARS : CITY_LEVEL_THRESHOLDS[cityLevel];
  const starsIntoLevel = cappedStars - currentThreshold;
  const starsForLevel = Math.max(1, nextThreshold - currentThreshold);
  const percent = isMaxLevel
    ? 100
    : Math.round((starsIntoLevel / starsForLevel) * 100);

  return {
    totalStars,
    maxStars: CITY_MAX_STARS,
    cityLevel,
    maxCityLevel: CITY_MAX_LEVEL,
    cityStage: getCityStage(cityLevel),
    isMaxLevel,
    percent,
    starsIntoLevel,
    starsPerLevel: starsForLevel,
    starsToNextLevel: isMaxLevel ? 0 : nextThreshold - cappedStars,
  };
}

/** Live city-progress hook — recomputes whenever gameplay reports new
 * progress or another tab changes storage, so this never shows stale numbers. */
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
