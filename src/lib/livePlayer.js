"use client";

const ID_KEY = "sortverse-live-player-id";
const TOKEN_KEY = "sortverse-live-player-token";

function makeId(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

export function getLiveIdentity() {
  if (typeof window === "undefined") return null;
  let id = window.localStorage.getItem(ID_KEY);
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!id) {
    id = makeId("player");
    window.localStorage.setItem(ID_KEY, id);
  }
  if (!token) {
    token = makeId("token");
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return { id, token };
}

function json(key, fallback) {
  try { return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

export function getLocalProgressSnapshot() {
  return {
    stars: json("sortverse-level-stars", {}),
    daily: json("sortverse-daily-completed", {}),
    rewards: json("sortverse-level-rewards", {}),
    achievements: json("sortverse-achievements-claimed", {}),
    level: Number(window.localStorage.getItem("sortverse-player-level")) || 0,
    coins: Number(window.localStorage.getItem("sortverse-player-coins")) || 0,
    diamonds: Number(window.localStorage.getItem("sortverse-player-diamonds")) || 0,
  };
}

export async function syncLivePlayer({ name, avatar } = {}) {
  const identity = getLiveIdentity();
  if (!identity) return null;
  const res = await fetch("/api/players", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...identity,
      name: name || "Player",
      avatar: avatar || null,
      progress: getLocalProgressSnapshot(),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not sync player");
  return res.json();
}

export async function getLiveBoards() {
  const identity = getLiveIdentity();
  const q = identity ? `?playerId=${encodeURIComponent(identity.id)}` : "";
  const res = await fetch(`/api/players${q}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load live leaderboard");
  return res.json();
}
