// Offline-only, versioned additions. Legacy save keys and existing reward ledgers are untouched.

export const SKINS = Object.freeze([
  { id: "classic", name: "Classic Glass", description: "The familiar SortVerse tube", cost: 0, currency: "coins", colors: ["#a8d5ec", "#4c7593"] },
  { id: "crystal", name: "Frost Crystal", description: "Shimmering icy glass", cost: 100, currency: "coins", colors: ["#d7ffff", "#38cbef"] },
  { id: "neon", name: "Neon Circuit", description: "Electric blue outlines", cost: 180, currency: "coins", colors: ["#48fff0", "#1574ed"] },
  { id: "gold", name: "Royal Gold", description: "A gilded collector's tube", cost: 18, currency: "diamonds", colors: ["#fff3ad", "#d9901d"] },
  { id: "galaxy", name: "Galaxy", description: "Violet stars and cosmic glass", cost: 30, currency: "diamonds", colors: ["#c9adff", "#5425bc"] },
  { id: "aurora", name: "Aurora", description: "Earned by 7 daily puzzles in one month", cost: null, currency: "earned", colors: ["#70ffe6", "#f187ff"] },
]);

export const SPECIAL_MISSIONS = Object.freeze([
  { id: "no-hint", name: "No Hint Hero", description: "Finish without using a Hint or Rescue.", difficulty: "normal", level: 3, goal: "no-hint", coins: 175, diamonds: 2, symbol: "✦" },
  { id: "precision", name: "Precision Master", description: "Earn 3 stars with efficient moves.", difficulty: "normal", level: 4, goal: "three-stars", coins: 240, diamonds: 3, symbol: "★" },
  { id: "golden", name: "Golden Guardian", description: "Open the golden vault and finish sorting.", difficulty: "normal", level: 9, goal: "vault", coins: 350, diamonds: 4, symbol: "◆" },
  { id: "speed", name: "Factory Speedrun", description: "Win with at least 45 seconds remaining.", difficulty: "hard", level: 3, goal: "speed", coins: 500, diamonds: 5, symbol: "⏱" },
]);

export const TROPHIES = Object.freeze([
  { id: "starter", name: "First Victory", target: 1, kind: "clears", coins: 50, description: "Complete a level" },
  { id: "collector", name: "Star Collector", target: 20, kind: "stars", coins: 120, description: "Earn 20 campaign stars" },
  { id: "designer", name: "Tube Designer", target: 2, kind: "skins", coins: 120, description: "Own two tube styles" },
  { id: "daily", name: "Daily Explorer", target: 7, kind: "daily", coins: 200, description: "Complete 7 daily puzzles" },
  { id: "special", name: "Mission Specialist", target: 2, kind: "special", coins: 250, description: "Complete two special missions" },
  { id: "expert", name: "Expert Pathfinder", target: 3, kind: "expert", coins: 350, description: "Clear three Expert levels" },
]);

const prefix = "sortverse-";
function storage() { return typeof window === "undefined" ? null : window.localStorage; }
export function readRecord(key, fallback = {}) {
  try {
    const raw = storage()?.getItem(prefix + key);
    if (!raw) return fallback;
    const result = JSON.parse(raw);
    return result && typeof result === "object" && !Array.isArray(result) ? result : fallback;
  } catch { return fallback; }
}
export function readValue(key, fallback = "") {
  try { return storage()?.getItem(prefix + key) ?? fallback; } catch { return fallback; }
}
export function announceProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("sortverse-progress"));
}
export function saveRecord(key, value) {
  storage()?.setItem(prefix + key, JSON.stringify(value));
  announceProgress();
}
export function ownedSkins() {
  const saved = readRecord("owned-skins-v1");
  return ["classic", ...SKINS.filter((skin) => saved[skin.id] === true).map((skin) => skin.id)];
}
export function selectedSkin() {
  const id = readValue("tube-skin-v1", "classic");
  return ownedSkins().includes(id) ? id : "classic";
}
export function equipSkin(id) {
  if (!ownedSkins().includes(id)) return false;
  storage()?.setItem("sortverse-tube-skin-v1", id);
  announceProgress();
  return true;
}
export function spendForSkin(id) {
  const item = SKINS.find((skin) => skin.id === id);
  if (!item || item.currency === "earned" || ownedSkins().includes(id)) return { ok: false, reason: "Already owned or unavailable" };
  const key = `sortverse-player-${item.currency}`;
  const balance = Number(storage()?.getItem(key));
  if (!Number.isFinite(balance) || balance < item.cost) return { ok: false, reason: `Need ${item.cost} ${item.currency}` };
  const saved = readRecord("owned-skins-v1");
  // Wallet writes only occur after checking ownership and balance again.
  storage()?.setItem(key, String(balance - item.cost));
  saveRecord("owned-skins-v1", { ...saved, [id]: true });
  equipSkin(id);
  return { ok: true };
}
export function todayLocalKey(day = new Date()) {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}
export function monthLocalKey(day = new Date()) { return todayLocalKey(day).slice(0, 7); }
export function monthlyDailyCount(month = monthLocalKey()) {
  return Object.keys(readRecord("daily-completed")).filter((day) => day.startsWith(`${month}-`)).length;
}
export function claimMonthlyAurora(month = monthLocalKey()) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return false;
  const claims = readRecord("monthly-aurora-v1");
  if (claims[month] || monthlyDailyCount(month) < 7) return false;
  // Claim a cosmetic only, never currency. Past months cannot generate endless payouts.
  saveRecord("monthly-aurora-v1", { ...claims, [month]: true });
  saveRecord("owned-skins-v1", { ...readRecord("owned-skins-v1"), aurora: true });
  return true;
}
export function specialResult(id, { difficulty, level, hintsUsed, rescuesUsed, stars, vaultOpened, timeLeft, casual } = {}) {
  const mission = SPECIAL_MISSIONS.find((entry) => entry.id === id);
  if (!mission || mission.difficulty !== difficulty || mission.level !== level || casual) return false;
  if (mission.goal === "no-hint") return hintsUsed === 0 && rescuesUsed === 0;
  if (mission.goal === "three-stars") return stars === 3;
  if (mission.goal === "vault") return vaultOpened === true;
  if (mission.goal === "speed") return Number.isFinite(timeLeft) && timeLeft >= 45;
  return false;
}
export function claimSpecial(id, state) {
  const mission = SPECIAL_MISSIONS.find((entry) => entry.id === id);
  if (!mission || !specialResult(id, state)) return null;
  const claimed = readRecord("special-claimed-v1");
  if (claimed[id]) return null;
  // Return the once-only prize to the caller, which credits it together
  // with the normal completion award. Do not credit the wallet twice.
  saveRecord("special-claimed-v1", { ...claimed, [id]: todayLocalKey() });
  return { coins: mission.coins, diamonds: mission.diamonds };
}

export function trophyProgress() {
  const stars = readRecord("level-stars");
  const clearing = Object.entries(stars).filter(([key, amount]) => /^(normal|hard|expert)-(?:[1-9]|1[0-2])$/.test(key) && Number(amount) > 0);
  return {
    clears: clearing.length,
    stars: clearing.reduce((total, [, value]) => total + Math.min(3, Math.max(0, Number(value) || 0)), 0),
    skins: ownedSkins().length,
    daily: Object.keys(readRecord("daily-completed")).length,
    special: Object.keys(readRecord("special-claimed-v1")).length,
    expert: clearing.filter(([key]) => key.startsWith("expert-")).length,
  };
}
export function claimTrophy(id) {
  const item = TROPHIES.find((entry) => entry.id === id);
  if (!item || (trophyProgress()[item.kind] || 0) < item.target) return false;
  const claimed = readRecord("trophy-claims-v1");
  if (claimed[id]) return false;
  const current = Math.max(0, Number(storage()?.getItem("sortverse-player-coins")) || 0);
  storage()?.setItem("sortverse-trophy-claims-v1", JSON.stringify({ ...claimed, [id]: true }));
  storage()?.setItem("sortverse-player-coins", String(current + item.coins));
  announceProgress();
  return true;
}
