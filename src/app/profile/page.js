"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronLeft, Pencil, ShieldCheck, Video, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { AVATAR_BGS, AVATAR_COLORS, AVATAR_FACES, AVATAR_SHAPES, AVATAR_GENDERS, AVATAR_HAIRS, AVATAR_OUTFITS, AVATAR_ACCESSORIES, AVATAR_SKINS, Avatar, GameAvatarArt, STYLE_LABELS, inferAvatarGender } from "@/components/RankBits";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { LEAGUES, getLeague, useRanking } from "@/lib/ranking";
import { playCoinCollectSound } from "@/lib/sound";
import { showCongrats } from "@/components/CongratsToast";
import { CrownIcon, FlagIcon, FlameIcon, HomeCoinIcon, HomeGemIcon, MedalIcon, StarIcon, TrophyGoldIcon } from "@/components/icons";

const CLAIM_KEY = "sortverse-achievements-claimed";
const AVATAR_RESET_KEY = "sortverse-avatar-reset-manual";

const EMPTY_BUILDER = { shape: null, color: null, bg: null, face: null, gender: null, hair: null, outfit: null, accessory: null, skin: null };

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
  const { ready, data, setName, setAvatar } = useRanking();
  const fileRef = useRef(null);
  const [photoError, setPhotoError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  useBackgroundMusic("menu");

  useEffect(() => {
    if (!cameraOpen) return undefined;
    let cancelled = false;
    async function startCamera() {
      setCameraError("");
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not supported by this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        setCameraError(err?.name === "NotAllowedError" ? "Camera permission was denied. Please allow camera access and try again." : (err?.message || "Could not start the camera."));
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraOpen]);

  const score = data ? data.score : 0;
  const name = data ? data.name : "You";
  const league = getLeague(score);
  const byDiff = data ? data.byDiff : { normal: 0, hard: 0, expert: 0 };

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
    { Icon: CrownIcon, title: "Top 10", hint: "Online global top 10", done: false, coins: 300, gems: 5 },
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
    // A full reset really means a clean local player: identity, avatar,
    // gameplay progress, rewards, achievements and performance history all
    // start over. Keep a small flag only so the avatar studio does not
    // auto-create a character again immediately after the reset.
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("sortverse-"))
      .forEach((k) => window.localStorage.removeItem(k));
    window.localStorage.setItem(AVATAR_RESET_KEY, "1");
    window.dispatchEvent(new Event("sortverse-progress"));
    window.dispatchEvent(new Event("sortverse-profile"));
    window.location.assign("/");
  }

  const unlocked = badges.filter((b) => b.done).length;

  const avatar = data ? data.avatar : null;
  const autoGender = inferAvatarGender(name);
  const [builderDraft, setBuilderDraft] = useState(null);
  const baseBuilder = avatar?.builder || EMPTY_BUILDER;
  const d = builderDraft || baseBuilder;
  const pick = (patch) => setBuilderDraft({ ...d, ...patch });

  useEffect(() => {
    if (!data || !avatar?.builder || avatar?.photo) return;
    if (window.localStorage.getItem(AVATAR_RESET_KEY) === "1") return;
    const nextGender = inferAvatarGender(name);
    if (avatar.builder.gender && avatar.builder.gender !== nextGender) {
      setAvatar({ builder: { ...avatar.builder, gender: nextGender } });
    }
  }, [name]);
  function resetAvatar() {
    window.localStorage.setItem(AVATAR_RESET_KEY, "1");
    setAvatar(null);
    setBuilderDraft({ ...EMPTY_BUILDER });
  }

  function applyAvatar() {
    window.localStorage.removeItem(AVATAR_RESET_KEY);
    if (!d.gender) return;
    setAvatar({
      builder: {
        shape: d.shape || "hero",
        color: d.color || "blue",
        bg: d.bg ?? 0,
        face: d.face || "happy",
        gender: d.gender,
        hair: d.hair || "short",
        outfit: d.outfit || "hoodie",
        accessory: d.accessory || "none",
        skin: d.skin || "fair",
      },
    });
    setBuilderDraft(null);
  }

  // Crops the picked image to a centred square and shrinks it to 128px so it stays tiny in storage.
  function openCamera() {
    setPhotoError("");
    setCameraError("");
    setCameraOpen(true);
  }

  function closeCamera() {
    setCameraOpen(false);
  }

  function captureSelfie() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setCameraError("Camera is still starting. Please try again in a moment.");
      return;
    }
    const size = 320;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    ctx.save();
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
    ctx.restore();
    const photo = canvas.toDataURL("image/jpeg", 0.86);
    const selfieBuilder = { ...d, gender: autoGender };
    setAvatar({ builder: selfieBuilder, sourcePhoto: photo, source: "selfie" });
    setBuilderDraft(selfieBuilder);
    setPhotoError("");
    setCameraOpen(false);
  }

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
                  <button type="button" onClick={openCamera} className="inline-flex items-center gap-1 text-yellow-200">
                    <Camera className="h-3 w-3" /> Selfie Avatar
                  </button>
                  {avatar && (
                    <button type="button" onClick={resetAvatar} className="text-white/45">
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
                    ["Levels", data ? data.cleared : 0],
                    ["Stars", data ? data.stars : 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-[#031a2a]/80 py-2">
                      <div className="text-sm font-black text-cyan-200">{value}</div>
                      <div className="text-[10px] font-bold uppercase text-white/35">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create a polished in-game avatar */}
              <div className="rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 p-3.5">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Avatar Studio</div>
                <div className="mt-0.5 text-[10px] text-white/35">Create your character, dress them, and make the look yours</div>
                <div className="mt-2.5 flex items-start gap-3">
                  <div className="shrink-0 overflow-hidden rounded-[22px] border border-yellow-300/35 bg-black/20 p-1 shadow-[0_12px_35px_rgba(0,0,0,.25)]">
                    <GameAvatarArt {...d} size={118} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <div className="text-[10px] font-bold text-white/40">Style</div>
                      <div className="mt-1 flex gap-1.5">
                        {AVATAR_SHAPES.map((sh) => (
                          <button
                            key={sh}
                            type="button"
                            aria-label={STYLE_LABELS[sh] || sh}
                            onClick={() => pick({ shape: sh })}
                            className={`overflow-hidden rounded-xl border-2 ${d.shape === sh ? "border-yellow-300" : "border-white/10"}`}
                          >
                            <GameAvatarArt shape={sh} color={d.color} bg={d.bg} face={d.face} size={34} />
                            <span className="block px-1 pb-1 text-[7px] font-black uppercase text-white/50">{STYLE_LABELS[sh]}</span>
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
                      <div className="text-[10px] font-bold text-white/40">Expression</div>
                      <div className="mt-1 flex gap-1.5">
                        {AVATAR_FACES.map((face) => (
                          <button
                            key={face}
                            type="button"
                            aria-label={`${face} face`}
                            onClick={() => pick({ face })}
                            className={`h-7 min-w-7 rounded-full border px-1.5 text-[9px] font-black transition ${d.face === face ? "border-yellow-300 bg-yellow-300/15 text-yellow-100" : "border-white/10 bg-white/[.03] text-white/55"}`}
                          >
                            {face === "happy" ? "Smile" : face === "cool" ? "Cool" : face === "excited" ? "Joy" : "Focus"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white/40">Theme</div>
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
                <div className="mt-3 rounded-2xl border border-white/8 bg-black/15 p-2.5">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-yellow-200/80">Character & Wardrobe</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] font-bold text-white/40">Character</div>
                      <div className="mt-1 grid grid-cols-2 gap-1">
                        {AVATAR_GENDERS.map((g) => <button key={g} type="button" onClick={() => pick({ gender: g })} className={`h-7 rounded-lg border text-[9px] font-black ${d.gender === g ? "border-yellow-300 bg-yellow-300/15 text-yellow-100" : "border-white/10 text-white/55"}`}>{g === "girl" ? "Girl" : "Boy"}</button>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-white/40">Hair</div>
                      <select value={d.hair || ""} onChange={(e) => pick({ hair: e.target.value || null })} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-[#071b2c] px-2 text-[9px] font-black text-white/75">
                        <option value="" disabled>Select hair</option>
                        {AVATAR_HAIRS.map((h) => <option key={h} value={h}>{h[0].toUpperCase()+h.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-white/40">Outfit</div>
                      <select value={d.outfit || ""} onChange={(e) => pick({ outfit: e.target.value || null })} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-[#071b2c] px-2 text-[9px] font-black text-white/75">
                        {AVATAR_OUTFITS.map((o) => <option key={o} value={o}>{o === "tee" ? "T-Shirt" : o[0].toUpperCase()+o.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-white/40">Accessory</div>
                      <select value={d.accessory || ""} onChange={(e) => pick({ accessory: e.target.value || null })} className="mt-1 h-7 w-full rounded-lg border border-white/10 bg-[#071b2c] px-2 text-[9px] font-black text-white/75">
                        <option value="" disabled>Select accessory</option>
                        {AVATAR_ACCESSORIES.map((a) => <option key={a} value={a}>{a === "none" ? "None" : a[0].toUpperCase()+a.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-[9px] font-bold text-white/40">Skin Tone</div>
                    <div className="mt-1 flex gap-1.5">
                      {AVATAR_SKINS.map((sk) => <button key={sk} type="button" onClick={() => pick({ skin: sk })} aria-label={sk} className="h-6 w-6 rounded-full border-2" style={{ background: sk === "fair" ? "#ffe0c2" : sk === "warm" ? "#f4c095" : sk === "tan" ? "#c98257" : "#7a4935", borderColor: d.skin === sk ? "#ffd21a" : "rgba(255,255,255,.15)" }} />)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyAvatar}
                  disabled={!d.gender}
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

            {cameraOpen && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                <div className="w-full max-w-[410px] overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#041522] shadow-[0_20px_80px_rgba(0,0,0,.6)]">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <div>
                      <div className="text-sm font-black">Create Selfie Avatar</div>
                      <div className="text-[10px] text-white/40">Center your face for the best game portrait.</div>
                    </div>
                    <button type="button" onClick={closeCamera} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 hover:bg-white/10" aria-label="Close camera">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="relative aspect-square overflow-hidden rounded-3xl border border-cyan-300/20 bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                      <div className="pointer-events-none absolute inset-8 rounded-full border-2 border-yellow-300/70 shadow-[0_0_35px_rgba(255,210,26,.18)]" />
                    </div>
                    {cameraError && <div className="mt-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-200">{cameraError}</div>}
                    <button type="button" onClick={captureSelfie} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#ffd21a] to-[#ff8500] text-sm font-black text-[#241300] active:scale-[.98]">
                      <Video className="h-4 w-4" /> Take Selfie
                    </button>
                  </div>
                </div>
              </div>
            )}

            <BottomNav active="profile" />
          </div>
        </div>
      </div>
    </main>
  );
}
