"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronLeft, Pencil, ShieldCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { AVATAR_BGS, AVATAR_COLORS, AVATAR_SHAPES, Avatar, GameAvatarArt } from "@/components/RankBits";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { LEAGUES, getLeague, useRanking } from "@/lib/ranking";
import { playCoinCollectSound } from "@/lib/sound";
import { showCongrats } from "@/components/CongratsToast";
import { CrownIcon, FlagIcon, FlameIcon, HomeCoinIcon, HomeGemIcon, MedalIcon, StarIcon, TrophyGoldIcon } from "@/components/icons";

const CLAIM_KEY = "sortverse-achievements-claimed";

const DEFAULT_BUILDER = { shape: "sphere", color: "blue", bg: 0 };

const DIFFS = [
  ["normal", "Normal", "#4ee08a"],
  ["hard", "Hard", "#ffb020"],
  ["expert", "Expert", "#ff5a7a"],
];

export default function ProfilePage() {
  const { coins, diamonds, addRewards } = usePlayerStats();
  const [claimed, setClaimed] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    try {
      setClaimed(JSON.parse(window.localStorage.getItem(CLAIM_KEY) || "{}"));
    } catch {}
  }, []);
  const { ready, data, boards, setName, setAvatar } = useRanking();
  const fileRef = useRef(null);
  const [photoError, setPhotoError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  useBackgroundMusic("menu");

  const score = data ? data.score : 0;
  const name = data ? data.name : "You";
  const league = getLeague(score);
  const byDiff = data ? data.byDiff : { normal: 0, hard: 0, expert: 0 };
  const rank = boards ? boards.global.find((e) => e.you).rank : null;

  const cleared = data?.cleared ?? 0;
  const stars = data?.stars ?? 0;
  const badges = [
    { Icon: FlagIcon, title: "First Clear", hint: "Clear any level", done: cleared >= 1, coins: 50, gems: 0 },
    { Icon: StarIcon, title: "Star Collector", hint: "Earn 25 stars", done: stars >= 25, coins: 100, gems: 1 },
    { Icon: StarIcon, title: "Star Hoarder", hint: "Earn 75 stars", done: stars >= 75, coins: 250, gems: 3 },
    { Icon: MedalIcon, tone: "green", title: "Normal Master", hint: "Clear all Normal", done: byDiff.normal >= 12, coins: 150, gems: 2 },
    { Icon: MedalIcon, tone: "orange", title: "Hard Master", hint: "Clear all Hard", done: byDiff.hard >= 12, coins: 250, gems: 4 },
    { Icon: MedalIcon, tone: "red", title: "Expert Master", hint: "Clear all Expert", done: byDiff.expert >= 12, coins: 400, gems: 6 },
    { Icon: FlameIcon, title: "Committed", hint: "7 daily challenges", done: (data?.dailyDays ?? 0) >= 7, coins: 100, gems: 2 },
    { Icon: TrophyGoldIcon, title: "Gold League", hint: "Reach 4,000 pts", done: score >= 4000, coins: 200, gems: 3 },
    { Icon: CrownIcon, title: "Top 10", hint: "Global top 10", done: rank !== null && rank <= 10, coins: 300, gems: 5 },
  ];

  function claim(b) {
    if (!b.done || claimed[b.title]) return;
    const next = { ...claimed, [b.title]: true };
    try {
      window.localStorage.setItem(CLAIM_KEY, JSON.stringify(next));
    } catch {}
    setClaimed(next);
    addRewards({ coins: b.coins, diamonds: b.gems });
    playCoinCollectSound({ pitch: 0 });
    showCongrats({ kind: "reward", title: `${b.title} unlocked`, coins: b.coins, diamonds: b.gems });
  }

  function resetAll() {
    if (!confirmReset) return setConfirmReset(true);
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("sortverse-"))
      .forEach((k) => window.localStorage.removeItem(k));
    window.location.assign("/");
  }

  const unlocked = badges.filter((b) => b.done).length;

  const avatar = data ? data.avatar : null;
  const [builderDraft, setBuilderDraft] = useState(null);
  const d = builderDraft || avatar?.builder || DEFAULT_BUILDER;
  const pick = (patch) => setBuilderDraft({ ...d, ...patch });
  function applyAvatar() {
    setAvatar({ builder: d });
    setBuilderDraft(null);
  }

  // Crops the picked image to a centred square and shrinks it to 128px so it stays tiny in storage.
  function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError("Please choose an image file.");
    if (file.size > 8 * 1024 * 1024) return setPhotoError("Image is too large (max 8 MB).");
    const reader = new FileReader();
    reader.onerror = () => setPhotoError("Could not read this image.");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => setPhotoError("Could not read this image.");
      img.onload = () => {
        const size = 128;
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        canvas.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        setAvatar({ ...avatar, photo: canvas.toDataURL("image/jpeg", 0.82) });
        setPhotoError("");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function save() {
    setName(draft);
    setEditing(false);
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020d18]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('/gameplay-factory.webp')" }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,49,.5),rgba(2,13,24,.9))]" />

            <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-4">
              <Link href="/" className="flex items-center gap-2 text-white/80 transition hover:text-white">
                <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
                <span className="text-sm font-bold">Profile</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full border border-yellow-400/30 bg-[#06243a] px-2 py-1 text-[10px] font-bold">
                  <HomeCoinIcon className="h-4 w-4" />
                  <span>{coins}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-purple-400/25 bg-[#06243a] px-2 py-1 text-[10px] font-bold">
                  <HomeGemIcon className="h-4 w-4" />
                  <span>{diamonds}</span>
                </div>
              </div>
            </header>

            <section className="relative z-10 min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {/* Identity */}
              <div className="rounded-3xl border border-cyan-300/20 bg-[#06243a]/85 p-4 text-center shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="flex justify-center">
                  <button type="button" onClick={() => fileRef.current?.click()} className="relative" aria-label="Change profile photo">
                    <Avatar name={name} you size={72} avatar={avatar} />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0c3a58] text-white">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
                </div>
                {photoError && <div className="mt-1 text-[10px] font-bold text-red-300">{photoError}</div>}
                <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-bold">
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-cyan-200">
                    Upload photo
                  </button>
                  {avatar && (
                    <button type="button" onClick={() => setAvatar(null)} className="text-white/45">
                      Reset avatar
                    </button>
                  )}
                </div>
                {editing ? (
                  <input
                    autoFocus
                    value={draft}
                    maxLength={14}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={save}
                    onKeyDown={(e) => e.key === "Enter" && save()}
                    className="mt-2 w-40 rounded-lg border border-cyan-300/30 bg-[#031a2a] px-2 py-1 text-center text-sm font-black outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(name);
                      setEditing(true);
                    }}
                    className="mt-2 text-base font-black"
                  >
                    {name} <Pencil className="ml-1 inline h-3 w-3 text-white/45" />
                  </button>
                )}
                <div className="mt-0.5 text-[11px] font-black" style={{ color: league.color }}>
                  {league.name} League
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    ["Score", score.toLocaleString()],
                    ["Global", rank ? `#${rank}` : "–"],
                    ["Stars", data ? data.stars : 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-[#031a2a]/80 py-2">
                      <div className="text-sm font-black text-cyan-200">{value}</div>
                      <div className="text-[10px] font-bold uppercase text-white/35">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create avatar from the game's own objects */}
              <div className="rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 p-3.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Create Avatar</div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="shrink-0 overflow-hidden rounded-full ring-2 ring-yellow-300/60">
                    <GameAvatarArt {...d} size={76} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <div className="text-[10px] font-bold text-white/40">Object</div>
                      <div className="mt-1 flex gap-1.5">
                        {AVATAR_SHAPES.map((sh) => (
                          <button
                            key={sh}
                            type="button"
                            aria-label={sh}
                            onClick={() => pick({ shape: sh })}
                            className={`overflow-hidden rounded-xl border-2 ${d.shape === sh ? "border-yellow-300" : "border-white/10"}`}
                          >
                            <GameAvatarArt shape={sh} color={d.color} bg={d.bg} size={34} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white/40">Colour</div>
                      <div className="mt-1 flex gap-1.5">
                        {Object.keys(AVATAR_COLORS).map((k) => (
                          <button
                            key={k}
                            type="button"
                            aria-label={k}
                            onClick={() => pick({ color: k })}
                            className="h-6 w-6 rounded-full ring-2 transition active:scale-90"
                            style={{ background: `linear-gradient(145deg,${AVATAR_COLORS[k].light},${AVATAR_COLORS[k].base})`, "--tw-ring-color": d.color === k ? "#ffb020" : "rgba(255,255,255,0.15)" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white/40">Background</div>
                      <div className="mt-1 flex gap-1.5">
                        {AVATAR_BGS.map((pair, i) => (
                          <button
                            key={pair[0]}
                            type="button"
                            aria-label={`Background ${i + 1}`}
                            onClick={() => pick({ bg: i })}
                            className="h-6 w-6 rounded-full ring-2 transition active:scale-90"
                            style={{ background: `linear-gradient(145deg,${pair[0]},${pair[1]})`, "--tw-ring-color": d.bg === i ? "#ffb020" : "rgba(255,255,255,0.15)" }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applyAvatar}
                  className="mt-3 h-10 w-full rounded-full border border-yellow-300/60 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] text-[12px] font-black text-[#241300] transition active:scale-[0.98]"
                >
                  Use this avatar
                </button>
              </div>

              {/* Progress per difficulty */}
              <div className="rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 p-3.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Level Progress</div>
                <div className="mt-2 space-y-2">
                  {DIFFS.map(([key, label, color]) => (
                    <div key={key}>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>{label}</span>
                        <span className="text-white/50">{byDiff[key]}/12</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/40">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(byDiff[key] / 12) * 100}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex justify-between text-[10px] font-bold text-white/45">
                  <span>Daily challenges: {data ? data.dailyDays : 0}</span>
                  <span>Levels cleared: {data ? data.cleared : 0}</span>
                </div>
              </div>

              {/* Achievements */}
              <div className="rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Achievements</span>
                  <span className="text-[10px] font-bold text-yellow-200">
                    {unlocked}/{badges.length}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {badges.map((b) => {
                    const Icon = b.Icon;
                    return (
                      <div
                        key={b.title}
                        className={`relative overflow-hidden rounded-2xl border px-2 py-2.5 text-center transition ${b.done ? "border-yellow-300/35 bg-[linear-gradient(180deg,rgba(83,59,8,.72),rgba(25,25,24,.72))] shadow-[inset_0_1px_0_rgba(255,255,255,.05)]" : "border-white/8 bg-[#031a2a]/76"}`}
                      >
                        <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border ${b.done ? "border-yellow-200/35 bg-yellow-300/10 shadow-[0_0_18px_rgba(255,194,26,.10)]" : "border-white/8 bg-white/[.025]"}`}><Icon tone={b.tone} className={`h-7 w-7 ${b.done ? "" : "opacity-30 grayscale"}`} /></div>
                        <div className="mt-0.5 text-[10px] font-black leading-tight">{b.title}</div>
                        <div className="mt-0.5 text-[10px] leading-tight text-white/40">{b.hint}</div>
                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-black text-yellow-200">
                          <HomeCoinIcon className="h-3 w-3" />
                          {b.coins}
                          {b.gems > 0 && (
                            <>
                              <HomeGemIcon className="h-3 w-3" />
                              {b.gems}
                            </>
                          )}
                        </div>
                        {b.done &&
                          (claimed[b.title] ? (
                            <div className="mt-1 text-[10px] font-black text-emerald-300">Claimed</div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => claim(b)}
                              className="mt-1 h-6 w-full rounded-full bg-gradient-to-b from-[#ffd21a] to-[#ff8500] text-[10px] font-black text-[#241300]"
                            >
                              Claim
                            </button>
                          ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* League roadmap */}
              <div className="rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 p-3.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">League Roadmap</div>
                <div className="mt-2 space-y-1.5">
                  {LEAGUES.map((l) => {
                    const reached = score >= l.min;
                    const current = l.name === league.name;
                    return (
                      <div
                        key={l.name}
                        className={`flex items-center justify-between rounded-xl border px-3 py-1.5 text-[10px] font-black ${current ? "border-yellow-300/50 bg-[#3a2a06]/50" : "border-white/8"} ${reached ? "" : "opacity-45"}`}
                      >
                        <span style={{ color: l.color }}>{l.name}</span>
                        <span className="flex items-center gap-1 text-white/50">{reached ? (current ? <><ShieldCheck className="h-3 w-3 text-yellow-300" /> Current</> : <Check className="h-3.5 w-3.5 text-emerald-300" />) : `${l.min.toLocaleString()} pts`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={resetAll}
                onBlur={() => setConfirmReset(false)}
                className={`h-10 w-full rounded-full border text-[11px] font-black ${confirmReset ? "border-red-400/60 bg-red-500/20 text-red-200" : "border-white/10 text-white/45"}`}
              >
                {confirmReset ? "Tap again to erase ALL progress" : "Reset progress"}
              </button>

              <Link
                href="/ranking"
                prefetch
                className="flex h-11 w-full items-center justify-center rounded-full border border-emerald-300/60 bg-gradient-to-b from-[#4ee08a] to-[#0a9e52] text-sm font-black text-[#052014] transition hover:brightness-110 active:scale-[0.99]"
              >
                {ready ? "View Ranking" : "Loading…"}
              </Link>
            </section>

            <BottomNav active="profile" />
          </div>
        </div>
      </div>
    </main>
  );
}
