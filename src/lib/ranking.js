"use client";

import { useEffect, useMemo, useState } from "react";
import { getLiveBoards, getLiveIdentity, syncLivePlayer } from "@/lib/livePlayer";

const LEVEL_COUNT = 12;
const MULT = { normal: 1, hard: 1.5, expert: 2 };
const K = { avatar: "sortverse-player-avatar", name: "sortverse-player-name" };

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

export function touchWeekBaseline() { return 0; }

export const REWARD_TIERS = [
  { max: 1, label: "#1", coins: 500, gems: 10 },
  { max: 3, label: "Top 3", coins: 300, gems: 6 },
  { max: 10, label: "Top 10", coins: 150, gems: 3 },
  { max: 25, label: "Top 25", coins: 75, gems: 1 },
];
export function rewardFor(rank, pts) {
  const t = REWARD_TIERS.find((x) => rank <= x.max);
  if (t) return { coins: t.coins, gems: t.gems, label: t.label };
  return pts > 0 ? { coins: 25, gems: 0, label: "Participant" } : null;
}

function markYou(list, id) { return (list || []).map((e) => ({ ...e, you: e.id === id })); }

export function useRanking() {
  const [remote, setRemote] = useState(null);
  const [profile, setProfile] = useState(() => ({ name: "Player", avatar: null }));
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setProfile({ name: read(K.name, "Player"), avatar: read(K.avatar, null) });
  }, []);

  useEffect(() => {
    let alive = true;
    let timer;
    const refresh = async () => {
      try {
        const local = { name: read(K.name, "Player"), avatar: read(K.avatar, null) };
        await syncLivePlayer(local);
        const b = await getLiveBoards();
        if (alive) { setRemote(b); setOnline(true); }
      } catch {
        if (alive) setOnline(false);
      }
    };
    refresh();
    timer = window.setInterval(refresh, 5000);
    const onProgress = () => refresh();
    window.addEventListener("sortverse-progress", onProgress);
    window.addEventListener("sortverse-profile", onProgress);
    window.addEventListener("focus", onProgress);
    return () => {
      alive = false; window.clearInterval(timer);
      window.removeEventListener("sortverse-progress", onProgress);
      window.removeEventListener("sortverse-profile", onProgress);
      window.removeEventListener("focus", onProgress);
    };
  }, []);

  const identity = typeof window !== "undefined" ? getLiveIdentity() : null;
  const localStats = computeScore(read("sortverse-level-stars", {}), read("sortverse-daily-completed", {}));
  const data = useMemo(() => ({ ...localStats, name: profile.name, avatar: profile.avatar, week: weekInfo(), lastWeek: null, online }), [localStats.score, localStats.cleared, localStats.stars, localStats.dailyDays, profile, online]);
  const boards = useMemo(() => {
    if (!remote) return null;
    const id = identity?.id;
    return { global: markYou(remote.global, id), weekly: markYou(remote.weekly, id), friends: markYou(remote.friends, id) };
  }, [remote, identity?.id]);

  function setName(raw) {
    const name = raw.trim().slice(0, 20) || "Player";
    window.localStorage.setItem(K.name, JSON.stringify(name));
    setProfile((p) => ({ ...p, name }));
    window.dispatchEvent(new Event("sortverse-profile"));
  }
  function setAvatar(next) {
    const avatar = next && (next.photo || next.builder || next.hue !== undefined) ? { photo: next.photo || null, builder: next.builder || null, hue: next.hue } : null;
    if (avatar) window.localStorage.setItem(K.avatar, JSON.stringify(avatar)); else window.localStorage.removeItem(K.avatar);
    setProfile((p) => ({ ...p, avatar }));
    window.dispatchEvent(new Event("sortverse-profile"));
  }

  return { ready: Boolean(remote), data, boards, lastRank: null, setName, setAvatar, markClaimed: () => {}, online };
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
