import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATA_FILE = process.env.SORTVERSE_DATA_FILE || path.join(process.cwd(), ".sortverse-data", "players.json");
const LEVEL_COUNT = 12;
const MULT = { normal: 1, hard: 1.5, expert: 2 };

function cleanName(value) {
  return String(value || "Player").replace(/[^\p{L}\p{N}_ .-]/gu, "").trim().slice(0, 20) || "Player";
}
function safeAvatar(value) {
  if (!value || typeof value !== "object") return null;
  if (value.photo && String(value.photo).length > 200000) return null;
  return { photo: value.photo || null, builder: value.builder || null, hue: value.hue };
}
function hash(v) { return crypto.createHash("sha256").update(String(v)).digest("hex"); }
function weekKey(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
function scoreProgress(progress = {}) {
  const stars = progress.stars || {};
  const daily = progress.daily || {};
  let score = 0, cleared = 0, starTotal = 0;
  const byDiff = { normal: 0, hard: 0, expert: 0 };
  for (const d of Object.keys(MULT)) {
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const n = Math.max(0, Math.min(3, Number(stars[`${d}-${i}`]) || 0));
      if (n > 0) {
        score += (n * 100 + 50) * MULT[d];
        cleared += 1; starTotal += n; byDiff[d] += 1;
      }
    }
  }
  score += Math.min(Object.keys(daily).length, 3660) * 25;
  return { score: Math.round(score), cleared, stars: starTotal, byDiff, dailyDays: Object.keys(daily).length };
}
async function load() {
  try { return JSON.parse(await fs.readFile(DATA_FILE, "utf8")); }
  catch { return { players: {} }; }
}
async function save(db) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DATA_FILE);
}
function publicPlayer(p, key = "score") {
  return {
    id: p.id, name: p.name, avatar: p.avatar || null,
    score: p.score || 0, weekly: p.weekly || 0,
    cleared: p.cleared || 0, stars: p.stars || 0, byDiff: p.byDiff || {}, dailyDays: p.dailyDays || 0,
    level: p.level || 0, joinedAt: p.joinedAt, updatedAt: p.updatedAt,
    value: p[key] || 0,
  };
}
function ranked(players, key) {
  return players.sort((a,b)=>(b[key]||0)-(a[key]||0) || String(a.joinedAt).localeCompare(String(b.joinedAt)))
    .map((p,i)=>({ ...publicPlayer(p,key), rank:i+1 }));
}

export async function GET(request) {
  const db = await load();
  const url = new URL(request.url);
  const playerId = url.searchParams.get("playerId");
  const profileId = url.searchParams.get("profileId");
  if (profileId) {
    const p = db.players[profileId];
    return Response.json({ player: p ? publicPlayer(p) : null }, { headers: { "cache-control": "no-store" } });
  }
  const players = Object.values(db.players).filter((p) => Date.now() - new Date(p.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 120);
  const global = ranked([...players], "score");
  const weekly = ranked(players.filter((p)=>p.weekKey===weekKey()).map((p)=>({ ...p, weekly: Math.max(0,p.weekly||0) })), "weekly");
  const me = playerId ? db.players[playerId] : null;
  const friendIds = new Set(me?.friends || []);
  if (playerId) friendIds.add(playerId);
  const friends = ranked(players.filter((p)=>friendIds.has(p.id)), "score");
  return Response.json({ global, weekly, friends, serverTime: new Date().toISOString(), weekKey: weekKey() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request) {
  const body = await request.json().catch(()=>null);
  if (!body?.id || !body?.token) return Response.json({ error: "Invalid player identity" }, { status: 400 });
  const db = await load();
  const existing = db.players[body.id];
  const tokenHash = hash(body.token);
  if (existing && existing.tokenHash !== tokenHash) return Response.json({ error: "Player identity conflict" }, { status: 409 });
  const stat = scoreProgress(body.progress || {});
  const wk = weekKey();
  const prev = existing || {};
  const weeklyBase = prev.weekKey === wk ? Number(prev.weeklyBase ?? stat.score) : stat.score;
  const weekly = Math.max(0, stat.score - weeklyBase);
  const now = new Date().toISOString();
  db.players[body.id] = {
    ...prev,
    id: body.id,
    tokenHash,
    name: cleanName(body.name),
    avatar: safeAvatar(body.avatar),
    ...stat,
    level: Math.max(0, Number(body.progress?.level)||0),
    coins: Math.max(0, Number(body.progress?.coins)||0),
    diamonds: Math.max(0, Number(body.progress?.diamonds)||0),
    weekKey: wk,
    weeklyBase,
    weekly,
    joinedAt: prev.joinedAt || now,
    updatedAt: now,
    friends: Array.isArray(prev.friends) ? prev.friends : [],
  };
  await save(db);
  return Response.json({ player: publicPlayer(db.players[body.id]), serverTime: now });
}
