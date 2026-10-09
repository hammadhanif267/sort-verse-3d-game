"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronLeft, Pencil, ShieldCheck, Video, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { AVATAR_PRESETS, AvatarShowcase, inferAvatarGender } from "@/components/RankBits";
import AvatarPreview from "@/components/AvatarPreview";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { LEAGUES, getLeague, useRanking } from "@/lib/ranking";
import { playCoinCollectSound } from "@/lib/sound";
import { isNative, pickNativePhoto } from "@/lib/native";
import { showCongrats } from "@/components/CongratsToast";
import { FlagIcon, FlameIcon, HomeCoinIcon, HomeGemIcon, MedalIcon, StarIcon, TrophyGoldIcon } from "@/components/icons";

const CLAIM_KEY = "sortverse-achievements-claimed";
const AVATAR_RESET_KEY = "sortverse-avatar-reset-manual";

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
    // Read the device-only achievement ledger after hydration.
    const frame = window.requestAnimationFrame(() => {
      try { setClaimed(JSON.parse(window.localStorage.getItem(CLAIM_KEY) || "{}")); }
      catch { setClaimed({}); }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const { ready, data, setName, setAvatar } = useRanking();
  const fileRef = useRef(null);
  const [photoError, setPhotoError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
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
    const video = videoRef.current;
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (video) video.srcObject = null;
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
    window.location.replace("/");
  }

  const unlocked = badges.filter((b) => b.done).length;

  const avatar = data ? data.avatar : null;
  const autoGender = inferAvatarGender(name);

  function selectPreset(gender) {
    window.localStorage.removeItem(AVATAR_RESET_KEY);
    // Fixed 3D avatar: no outfit / colour customisation any more.
    setAvatar({ preset: gender, builder: { gender } });
    setAvatarPickerOpen(false);
  }

  function resetAvatar() {
    window.localStorage.setItem(AVATAR_RESET_KEY, "1");
    setAvatar(null);
  }

  // Crops the picked image to a centred square and shrinks it to 128px so it stays tiny in storage.
  async function chooseNativePhoto(source) {
    try {
      const dataUrl = await pickNativePhoto(source);
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], source === "selfie" ? "selfie.jpg" : "avatar.jpg", { type: blob.type || "image/jpeg" });
      onPick({ target: { files: [file], value: "" } }, source);
      setAvatarPickerOpen(false);
    } catch (error) {
      if (/cancel/i.test(error?.message || "")) return;
      setPhotoError(error?.message || "Could not open the device camera or photo picker.");
    }
  }

  function selectProfilePhoto() {
    if (isNative()) chooseNativePhoto("upload");
    else fileRef.current?.click();
  }

  function openCamera() {
    if (isNative()) { chooseNativePhoto("selfie"); return; }
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
    // Bigger, uncropped copy for the full-size preview.
    const big = document.createElement("canvas");
    big.width = side > 720 ? 720 : side;
    big.height = big.width;
    const bctx = big.getContext("2d");
    bctx.translate(big.width, 0);
    bctx.scale(-1, 1);
    bctx.drawImage(video, sx, sy, side, side, 0, 0, big.width, big.height);
    const sourcePhoto = big.toDataURL("image/jpeg", 0.88);
    setAvatar({ preset: null, builder: { gender: autoGender }, photo, sourcePhoto, photoRatio: 1, source: "selfie" });
    setPhotoError("");
    setCameraOpen(false);
  }

  function onPick(e, sourceType = "upload") {
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
        // Keep the whole original picture (not cropped) for the full preview, just scaled down.
        const maxSide = 1100;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const full = document.createElement("canvas");
        full.width = Math.round(img.width * scale);
        full.height = Math.round(img.height * scale);
        full.getContext("2d").drawImage(img, 0, 0, full.width, full.height);
        setAvatar({ preset: null, builder: sourceType === "selfie" ? { gender: autoGender } : null, photo: canvas.toDataURL("image/jpeg", 0.82), sourcePhoto: full.toDataURL("image/jpeg", 0.85), photoRatio: full.width / full.height, source: sourceType });
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

            <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
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
                  <div className="relative">
                    <button type="button" onClick={() => (avatar?.preset || avatar?.photo || avatar?.sourcePhoto ? setAvatarViewerOpen(true) : setAvatarPickerOpen(true))} className="block" aria-label="Open profile avatar">
                      <div className="h-36">
                        <AvatarShowcase name={name} avatar={avatar} fitHeight className="h-full" />
                      </div>
                    </button>
                    {/* Camera icon: pick a photo from the device */}
                    <button type="button" onClick={selectProfilePhoto} className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0c3a58] text-white active:scale-90" aria-label="Upload profile photo">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
                </div>
                {photoError && <div className="mt-1 text-[10px] font-bold text-red-300">{photoError}</div>}
                <div className="mt-1.5 flex items-center justify-center gap-3 text-[10px] font-bold">
                  <button type="button" onClick={() => setAvatarPickerOpen(true)} className="text-cyan-200">
                    Change avatar
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

              {/* Avatar selection */}
              <div className="rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200/70">Profile Avatar</div>
                    <div className="mt-0.5 text-[10px] text-white/35">Choose a 3D boy or girl avatar, upload a photo, or use a selfie.</div>
                  </div>
                  <button type="button" onClick={() => setAvatarPickerOpen(true)} className="shrink-0 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1.5 text-[10px] font-black text-yellow-100">Change</button>
                </div>

                <button type="button" onClick={() => setAvatarPickerOpen(true)} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-2.5 text-left active:scale-[.99]">
                  <div className="h-28 shrink-0">
                    <AvatarShowcase name={name} avatar={avatar} fitHeight className="h-full border-yellow-300/30" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white">{avatar?.preset || avatar?.photo ? (avatar?.preset ? `${name} Avatar` : `${name} Profile`) : "Choose your avatar"}</div>
                    <div className="mt-1 text-[10px] font-bold text-white/40">Tap to switch avatar, upload a photo or take a selfie.</div>
                  </div>
                </button>

                {avatar && <button type="button" onClick={resetAvatar} className="mt-2 w-full text-[10px] font-black text-white/40">Reset avatar</button>}
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

              <Link href="/settings" className="mb-2 flex h-10 w-full items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 text-xs font-bold text-cyan-100">Settings and progress backup</Link>
              <Link
                href="/ranking"
                prefetch
                className="flex h-11 w-full items-center justify-center rounded-full border border-emerald-300/60 bg-gradient-to-b from-[#4ee08a] to-[#0a9e52] text-sm font-black text-[#052014] transition hover:brightness-110 active:scale-[0.99]"
              >
                {ready ? "View Ranking" : "Loading…"}
              </Link>
            </section>

            {avatarPickerOpen && (
              <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-sm">
                <div className="max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-[28px] border border-cyan-300/20 bg-[#041522] shadow-[0_20px_80px_rgba(0,0,0,.6)]">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#041522]/95 px-4 py-3 backdrop-blur">
                    <div><div className="text-sm font-black">Choose Profile Avatar</div><div className="text-[10px] text-white/40">Girl, boy, upload, or selfie.</div></div>
                    <button type="button" onClick={() => setAvatarPickerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70" aria-label="Close avatar picker"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[["girl","Girl Avatar"],["boy","Boy Avatar"]].map(([g,label]) => (
                        <button key={g} type="button" onClick={() => selectPreset(g)} className={`overflow-hidden rounded-2xl border-2 bg-[#071b2c] ${avatar?.preset===g?"border-yellow-300":"border-white/10"}`}>
                          <div className="h-52 w-full bg-black/20">{/* Preset artwork and uploaded data URLs bypass Next image processing. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={AVATAR_PRESETS[g]} alt={label} className="h-full w-full object-contain" /></div>
                          <div className="px-2 py-2 text-left"><div className="text-xs font-black">{label}</div><div className="text-[9px] font-bold text-white/40">Tap to use</div></div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" onClick={selectProfilePhoto} className="flex h-10 items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 text-[10px] font-black text-cyan-100"><Camera className="h-3.5 w-3.5" /> Upload Profile</button>
                      <button type="button" onClick={() => { setAvatarPickerOpen(false); openCamera(); }} className="flex h-10 items-center justify-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 text-[10px] font-black text-yellow-100"><Video className="h-3.5 w-3.5" /> Take Selfie</button>
                    </div>
                    {photoError && <div className="mt-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-200">{photoError}</div>}
                  </div>
                </div>
              </div>
            )}

            <AvatarPreview open={avatarViewerOpen} onClose={() => setAvatarViewerOpen(false)} name={name} avatar={avatar} />

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
