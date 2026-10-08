"use client";

import { useEffect, useMemo, useState } from "react";
import { computeCityProgress } from "@/lib/cityProgress";

const LEVEL_COUNT = 12;
const MULT = { normal: 1, hard: 1.5, expert: 2 };
const K = { avatar: "sortverse-player-avatar", name: "sortverse-player-name" };
const WEEK_BASELINE_KEY = "sortverse-week-score-baseline";
const WEEK_KEY_STORAGE = "sortverse-week-key";
export const GAME_RECORDS_KEY = "sortverse-game-records";

export const LEAGUES = [
  { name: "Bronze", min: 0, color: "#cd7f32" },
  { name: "Silver", min: 1500, color: "#c9d4df" },
  { name: "Gold", min: 4000, color: "#ffc21a" },
  { name: "Platinum", min: 8000, color: "#5ad8ff" },
  { name: "Diamond", min: 13000, color: "#b48cff" },
  { name: "Champion", min: 18000, color: "#ff5a7a" },
];

export function getLeague(score) {
  let i = 0;
  LEAGUES.forEach((l, idx) => { if (score >= l.min) i = idx; });
  const cur = LEAGUES[i];
  const next = LEAGUES[i + 1] || null;
  const percent = next ? Math.max(0, Math.min(100, Math.round(((score - cur.min) / (next.min - cur.min)) * 100))) : 100;
  return { ...cur, next, percent };
}

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try { const v = window.localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
}


export function readGameRecords() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GAME_RECORDS_KEY);
    const value = raw ? JSON.parse(raw) : [];
    if (Array.isArray(value) && value.length) return value.filter(Boolean);

    // Backward compatibility: older builds stored completed levels only in
    // the stars map. Convert those real completed levels into lifetime
    // records so the Ranking page remains populated after an app update.
    const stars = read("sortverse-level-stars", {});
    const migrated = [];
    for (const difficulty of Object.keys(MULT)) {
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        const earnedStars = Math.max(0, Math.min(3, Number(stars[`${difficulty}-${level}`]) || 0));
        if (!earnedStars) continue;
        const multiplier = MULT[difficulty];
        migrated.push({
          id: `legacy-${difficulty}-${level}`,
          level, difficulty, stars: earnedStars, moves: null,
          score: Math.round((earnedStars * 100 + 50) * multiplier),
          completedAt: 0, legacy: true,
        });
      }
    }
    if (migrated.length) window.localStorage.setItem(GAME_RECORDS_KEY, JSON.stringify(migrated));
    return migrated;
  } catch { return []; }
}

function dateKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export function computePerformance(records = []) {
  const clean = [...records].filter((r) => Number.isFinite(Number(r?.score))).sort((a,b) => Number(a.completedAt || 0) - Number(b.completedAt || 0));
  const scores = clean.map((r) => Number(r.score) || 0);
  const gamesPlayed = clean.length;
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const averageScore = gamesPlayed ? Math.round(scores.reduce((a,b)=>a+b,0) / gamesPlayed) : 0;
  const uniqueDays = [...new Set(clean.filter((r) => Number(r?.completedAt) > 0).map((r) => dateKey(Number(r.completedAt))))];
  const daySet = new Set(uniqueDays);
  let bestStreak = 0;
  let run = 0;
  let previous = null;
  for (const key of uniqueDays) {
    const cur = new Date(`${key}T00:00:00`);
    if (previous && Math.round((cur - previous) / 86400000) === 1) run += 1; else run = 1;
    bestStreak = Math.max(bestStreak, run);
    previous = cur;
  }
  let currentStreak = 0;
  if (uniqueDays.length) {
    let cursor = new Date(); cursor.setHours(0,0,0,0);
    const today = dateKey(cursor.getTime());
    const yesterday = dateKey(cursor.getTime() - 86400000);
    let key = daySet.has(today) ? today : daySet.has(yesterday) ? yesterday : null;
    if (key) {
      while (daySet.has(key)) {
        currentStreak += 1;
        const d = new Date(`${key}T00:00:00`); d.setDate(d.getDate()-1); key = dateKey(d.getTime());
      }
    }
  }
  const difficultyOrder = { normal: 0, hard: 1, expert: 2 };
  // Ranking receipts are shown in true level progression order:
  // Normal 1-12, then Hard 1-12, then Expert 1-12.
  const topScores = [...clean].sort((a, b) => {
    const da = difficultyOrder[String(a?.difficulty || "normal").toLowerCase()] ?? 99;
    const db = difficultyOrder[String(b?.difficulty || "normal").toLowerCase()] ?? 99;
    if (da !== db) return da - db;
    const la = Number(a?.level) || 0;
    const lb = Number(b?.level) || 0;
    if (la !== lb) return la - lb;
    return Number(b?.completedAt || 0) - Number(a?.completedAt || 0);
  });
  return { gamesPlayed, bestScore, averageScore, bestStreak, currentStreak, topScores };
}

export function computeScore(stars, daily) {
  let score = 0, cleared = 0, starTotal = 0;
  const byDiff = { normal: 0, hard: 0, expert: 0 };
  for (const d of Object.keys(MULT)) {
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const n = Math.max(0, Math.min(3, Number(stars[`${d}-${i}`]) || 0));
      if (n > 0) {
        score += (n * 100 + 50) * MULT[d];
        cleared += 1; byDiff[d] += 1; starTotal += n;
      }
    }
  }
  score += Math.min(Object.keys(daily || {}).length, 3660) * 25;
  return { score: Math.round(score), cleared, stars: starTotal, byDiff, dailyDays: Object.keys(daily || {}).length };
}

export function weekInfo(d = new Date()) {
  const dow = (d.getDay() + 6) % 7;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { key: `${start.getFullYear()}-${start.getMonth()+1}-${start.getDate()}`, endMs: end.getTime(), dow };
}

function computeWeeklyRealScore(records, daily) {
  const now = new Date();
  const info = weekInfo(now);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - info.dow);
  const startMs = start.getTime();
  const levelPoints = (records || []).reduce((sum, r) => sum + (Number(r?.completedAt) >= startMs ? Number(r?.score) || 0 : 0), 0);
  const dailyPoints = Object.keys(daily || {}).filter((key) => {
    const d = new Date(`${key}T00:00:00`);
    return Number.isFinite(d.getTime()) && d.getTime() >= startMs && d.getTime() < info.endMs;
  }).length * 25;
  return levelPoints + dailyPoints;
}

export const REWARD_TIERS = [
  { max: 1, label: "#1", coins: 500, gems: 10 },
  { max: 3, label: "Top 3", coins: 300, gems: 6 },
  { max: 10, label: "Top 10", coins: 150, gems: 3 },
  { max: 25, label: "Top 25", coins: 75, gems: 1 },
];

export function rewardFor(rank, pts) {
  if (!Number.isFinite(Number(rank)) || Number(rank) < 1) return null;
  const t = REWARD_TIERS.find((x) => rank <= x.max);
  if (t) return { coins: t.coins, gems: t.gems, label: t.label };
  return pts > 0 ? { coins: 25, gems: 0, label: "Participant" } : null;
}

export function touchWeekBaseline() {
  if (typeof window === "undefined") return null;
  const score = computeScore(
    read("sortverse-level-stars", {}),
    read("sortverse-daily-completed", {})
  ).score;
  return ensureWeekBaseline(score);
}

function ensureWeekBaseline(score) {
  const info = weekInfo();
  const savedKey = window.localStorage.getItem(WEEK_KEY_STORAGE);
  let baseline = Number(window.localStorage.getItem(WEEK_BASELINE_KEY));
  if (savedKey !== info.key || !Number.isFinite(baseline)) {
    baseline = score;
    window.localStorage.setItem(WEEK_KEY_STORAGE, info.key);
    window.localStorage.setItem(WEEK_BASELINE_KEY, String(score));
  }
  return { ...info, baseline, weekly: Math.max(0, score - baseline) };
}

function localEntry(stats, profile, value, id = "local-player") {
  // Offline mode has only one real player on this device. Never label that
  // player as a fake global #1; a global rank requires shared online data.
  return {
    id, name: profile.name, avatar: profile.avatar, score: stats.score, weekly: value,
    cleared: stats.cleared, stars: stats.stars, byDiff: stats.byDiff, dailyDays: stats.dailyDays,
    value, rank: null, you: true,
  };
}

export function useRanking() {
  const [profile, setProfile] = useState({ name: "Player", avatar: null });
  const [stats, setStats] = useState({ score: 0, cleared: 0, stars: 0, byDiff: { normal: 0, hard: 0, expert: 0 }, dailyDays: 0, city: computeCityProgress({}) });
  const [week, setWeek] = useState(null);
  const [tick, setTick] = useState(0);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const sync = () => {
      const starsMap = read("sortverse-level-stars", {});
      const nextStats = computeScore(starsMap, read("sortverse-daily-completed", {}));
      const nextCity = computeCityProgress(starsMap);
      setStats({ ...nextStats, city: nextCity });
      setProfile({ name: read(K.name, "Player"), avatar: read(K.avatar, null) });
      const nextRecords = readGameRecords();
      const nextDaily = read("sortverse-daily-completed", {});
      setWeek({ ...weekInfo(), baseline: Math.max(0, nextStats.score - computeWeeklyRealScore(nextRecords, nextDaily)), weekly: computeWeeklyRealScore(nextRecords, nextDaily) });
      setRecords(nextRecords);
      setTick((v) => v + 1);
    };
    sync();
    const timer = window.setInterval(sync, 1000);
    window.addEventListener("sortverse-progress", sync);
    window.addEventListener("sortverse-profile", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("sortverse-progress", sync);
      window.removeEventListener("sortverse-profile", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const data = useMemo(() => ({
    ...stats, name: profile.name, avatar: profile.avatar, week: week || weekInfo(), lastWeek: null, online: false, performance: computePerformance(records),
  }), [stats, profile, week, records, tick]);

  const boards = useMemo(() => {
    if (!week) return null;
    const global = [localEntry(stats, profile, stats.score)];
    const weekly = [localEntry(stats, profile, week.weekly)];
    const friends = [localEntry(stats, profile, stats.score)];
    return { global, weekly, friends };
  }, [stats, profile, week]);

  function setName(raw) {
    const name = raw.trim().slice(0, 20) || "Player";
    window.localStorage.setItem(K.name, JSON.stringify(name));
    setProfile((p) => ({ ...p, name }));
    window.dispatchEvent(new Event("sortverse-profile"));
  }

  function setAvatar(next) {
    const avatar = next && (next.photo || next.sourcePhoto || next.preset || next.builder || next.hue !== undefined)
      ? { photo: next.photo || null, sourcePhoto: next.sourcePhoto || null, source: next.source || null, photoRatio: next.photoRatio || null, preset: next.preset || null, builder: next.builder || null, hue: next.hue }
      : null;
    if (avatar) window.localStorage.setItem(K.avatar, JSON.stringify(avatar)); else window.localStorage.removeItem(K.avatar);
    setProfile((p) => ({ ...p, avatar }));
    window.dispatchEvent(new Event("sortverse-profile"));
  }

  return { ready: Boolean(week && boards), data, boards, lastRank: null, setName, setAvatar, markClaimed: () => {}, online: false };
}

export function usePlayerProfile() {
  const [profile, setProfile] = useState({ name: "Player", avatar: null });
  useEffect(() => {
    const sync = () => setProfile({ name: read(K.name, "Player"), avatar: read(K.avatar, null) });
    sync();
    window.addEventListener("sortverse-profile", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("sortverse-profile", sync); window.removeEventListener("storage", sync); };
  }, []);
  return profile;
}
