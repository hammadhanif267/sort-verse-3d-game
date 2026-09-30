"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const LEVEL_COUNT = 12;
const MULT = { normal: 1, hard: 1.5, expert: 2 };
const LAUNCH_DAY = Math.floor(Date.UTC(2026, 8, 1) / 86400000);
const K = { avatar: "sortverse-player-avatar", prev: "sortverse-ranking-prev", name: "sortverse-player-name", week: "sortverse-ranking-week", last: "sortverse-ranking-last" };

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
  LEAGUES.forEach((l, idx) => {
    if (score >= l.min) i = idx;
  });
  const cur = LEAGUES[i];
  const next = LEAGUES[i + 1] || null;
  const percent = next ? Math.round(((score - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { ...cur, next, percent };
}

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

/** Score = stars (100 each) + 50 per cleared level, x1 / x1.5 / x2 by difficulty, + 25 per daily-challenge day. */
export function computeScore(stars, daily) {
  let score = 0;
  let cleared = 0;
  let starTotal = 0;
  const byDiff = { normal: 0, hard: 0, expert: 0 };
  for (const d of Object.keys(MULT)) {
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const n = Number(stars[`${d}-${i}`]) || 0;
      if (n > 0) {
        score += (n * 100 + 50) * MULT[d];
        cleared += 1;
        byDiff[d] += 1;
        starTotal += n;
      }
    }
  }
  score += Math.min(Object.keys(daily).length, 60) * 25;
  return { score: Math.round(score), cleared, stars: starTotal, byDiff, dailyDays: Object.keys(daily).length };
}

export function weekInfo(d = new Date()) {
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { key: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`, endMs: end.getTime(), dow };
}

/** Remembers the score at the start of each week so the Weekly board only counts this week's points.
 *  Called from usePlayerStats (every page) so it snapshots before the week's first level is played. */
export function touchWeekBaseline() {
  if (typeof window === "undefined") return 0;
  const { score } = computeScore(read("sortverse-level-stars", {}), read("sortverse-daily-completed", {}));
  const w = weekInfo();
  const rec = read(K.week, null);
  if (rec && rec.week === w.key) return rec.base;
  try {
    if (rec) {
      window.localStorage.setItem(K.prev, JSON.stringify({ week: rec.week, pts: Math.max(0, score - rec.base), claimed: false }));
    }
    window.localStorage.setItem(K.week, JSON.stringify({ week: w.key, base: score }));
  } catch {}
  return score;
}

/* ---- Simulated rivals: there is no server yet, so these are deterministic bots. ---- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const P = ["Nova", "Pixel", "Turbo", "Zen", "Blaze", "Echo", "Orbit", "Volt", "Jinx", "Onyx"];
const S = ["Pilot", "Wizard", "Ninja", "Sorter", "King"];

/* Weekly balance: a 3-star Normal clear is worth 350 pts, so the best bot finishes a week near
   1,900 pts (about 5-6 levels for #1). Skewed (^2.2) so Top 3 is roughly half of that and the
   median bot (Top 25 territory) sits near 450 pts, about 1-2 levels. It grows with the day of week. */
function makeBots(w) {
  const days = Math.max(0, Math.floor(Date.now() / 86400000) - LAUNCH_DAY);
  const frac = (w.dow + 1) / 7;
  let h = 0;
  for (const c of w.key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: 50 }, (_, i) => {
    const r = rng(i * 7919 + 13);
    const base = 300 + Math.pow(r(), 1.8) * 15500;
    const rate = 6 + r() * 34;
    const wr = rng(h + i * 131);
    return {
      id: `bot-${i}`,
      name: P[i % 10] + S[Math.floor(i / 10)],
      score: Math.min(23000, Math.round(base + rate * days)),
      weekly: Math.round((60 + Math.pow(wr(), 2.2) * 1850) * frac),
      friend: i % 5 === 0,
    };
  });
}

export const REWARD_TIERS = [
  { max: 1, label: "#1", coins: 500, gems: 10 },
  { max: 3, label: "Top 3", coins: 300, gems: 6 },
  { max: 10, label: "Top 10", coins: 150, gems: 3 },
  { max: 25, label: "Top 25", coins: 75, gems: 1 },
];

/** Reward for a weekly rank; anyone who scored at least once still gets a small participation prize. */
export function rewardFor(rank, pts) {
  const t = REWARD_TIERS.find((x) => rank <= x.max);
  if (t) return { coins: t.coins, gems: t.gems, label: t.label };
  return pts > 0 ? { coins: 25, gems: 0, label: "Participant" } : null;
}

/** Final result of the previous week (rank among the same rivals), or null. */
export function getLastWeek() {
  const rec = read(K.prev, null);
  if (!rec) return null;
  const rank = 1 + makeBots({ key: rec.week, dow: 6 }).filter((b) => b.weekly > rec.pts).length;
  return { ...rec, rank, reward: rewardFor(rank, rec.pts) };
}

function rankBoard(list, key) {
  return [...list]
    .sort((a, b) => b[key] - a[key] || (a.you ? 1 : 0) - (b.you ? 1 : 0))
    .map((e, i) => ({ ...e, value: e[key], rank: i + 1 }));
}

export function useRanking() {
  const [data, setData] = useState(null);
  const [lastRank, setLastRank] = useState(null);
  const saved = useRef(false);

  useEffect(() => {
    const sync = () => {
      const s = computeScore(read("sortverse-level-stars", {}), read("sortverse-daily-completed", {}));
      setData({ ...s, name: read(K.name, "You"), avatar: read(K.avatar, null), base: touchWeekBaseline(), week: weekInfo(), lastWeek: getLastWeek() });
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sortverse-progress", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sortverse-progress", sync);
    };
  }, []);

  const boards = useMemo(() => {
    if (!data) return null;
    const me = { id: "you", name: data.name, score: data.score, weekly: Math.max(0, data.score - data.base), you: true, friend: true, avatar: data.avatar };
    const all = [...makeBots(data.week), me];
    return {
      global: rankBoard(all, "score"),
      weekly: rankBoard(all, "weekly"),
      friends: rankBoard(all.filter((e) => e.friend), "score"),
    };
  }, [data]);

  // Rank change since the previous visit.
  useEffect(() => {
    if (!boards || saved.current) return;
    saved.current = true;
    const now = boards.global.find((e) => e.you).rank;
    setLastRank(read(K.last, null));
    try {
      window.localStorage.setItem(K.last, JSON.stringify(now));
    } catch {}
  }, [boards]);

  function setName(raw) {
    const name = raw.trim().slice(0, 14) || "You";
    try {
      window.localStorage.setItem(K.name, JSON.stringify(name));
    } catch {}
    window.dispatchEvent(new Event("sortverse-profile"));
    setData((d) => (d ? { ...d, name } : d));
  }

  /** avatar = { photo: dataURL | null, hue: 0-359 | undefined } - saved on this device. */
  function setAvatar(next) {
    const avatar = next && (next.photo || next.builder || next.hue !== undefined) ? { photo: next.photo || null, builder: next.builder || null, hue: next.hue } : null;
    try {
      if (avatar) window.localStorage.setItem(K.avatar, JSON.stringify(avatar));
      else window.localStorage.removeItem(K.avatar);
    } catch {}
    window.dispatchEvent(new Event("sortverse-profile"));
    setData((d) => (d ? { ...d, avatar } : d));
  }

  function markClaimed() {
    try {
      window.localStorage.setItem(K.prev, JSON.stringify({ ...read(K.prev, {}), claimed: true }));
    } catch {}
    setData((d) => (d && d.lastWeek ? { ...d, lastWeek: { ...d.lastWeek, claimed: true } } : d));
  }

  return { ready: Boolean(data), data, boards, lastRank, setName, setAvatar, markClaimed };
}

/** Lightweight name + avatar for any page (Home header etc.). Updates instantly when the profile is edited. */
export function usePlayerProfile() {
  const [profile, setProfile] = useState({ name: "You", avatar: null });
  useEffect(() => {
    const sync = () => setProfile({ name: read(K.name, "You"), avatar: read(K.avatar, null) });
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sortverse-profile", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sortverse-profile", sync);
    };
  }, []);
  return profile;
}
