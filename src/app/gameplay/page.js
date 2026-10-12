"use client";

import { Suspense, useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "@/components/ReliableLink";
import { useRouter, useSearchParams } from "next/navigation";
import GameplayScene, { difficultyParams } from "../../components/game/GameplayScene";
import { TimerIcon } from "@/components/icons";
import { Pause, Play } from "lucide-react";
import { playIntroChime } from "@/lib/sound";
import { pushWithFallback } from "@/lib/navigationFallback";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { canEnterDifficulty, getMission } from "@/lib/levelMissions";
import { SPECIAL_MISSIONS } from "@/lib/playerExperience";

function subscribeComfort(notify) {
  window.addEventListener("storage", notify);
  window.addEventListener("sortverse-progress", notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener("sortverse-progress", notify); };
}
function readCasual() { return typeof window !== "undefined" && window.localStorage.getItem("sortverse-setting-casual") === "1"; }

// How long the intro chime is given before the gameplay loop fades in.
const GAMEPLAY_MUSIC_DELAY_MS = 1400;

function formatTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return "--:--";
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60).toString().padStart(2, "0");
  const seconds = (clamped % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function canOpenLevel(level, difficulty) {
  if (typeof window === "undefined") return true;
  try {
    const progress = JSON.parse(window.localStorage.getItem("sortverse-difficulty-progress") || "{}");
    return canEnterDifficulty(difficulty, progress) && level <= (Number(progress[difficulty]) || 0) + 1;
  } catch { return difficulty === "normal" && level === 1; }
}

function GameplayContent() {
  const searchParams = useSearchParams();
  const levelParam = Number(searchParams.get("level"));
  const level = Number.isFinite(levelParam) && levelParam > 0 ? Math.min(12, Math.floor(levelParam)) : 1;
  // Resolve route parameters before any hook reads them. Keeping both the
  // special-mission check and the unlock snapshot below these declarations
  // prevents temporal-dead-zone crashes when navigating into gameplay.
  const difficultyParam = searchParams.get("difficulty");
  const difficulty = ["normal", "hard", "expert"].includes(difficultyParam) ? difficultyParam : "normal";
  const dailyDate = searchParams.get("daily");
  const specialParam = searchParams.get("special");
  const specialId = SPECIAL_MISSIONS.some((m) => m.id === specialParam && m.difficulty === difficulty && m.level === level) ? specialParam : null;
  const readUnlocked = useCallback(() => canOpenLevel(level, difficulty), [level, difficulty]);
  const casual = useSyncExternalStore(subscribeComfort, readCasual, () => false);
  const unlocked = useSyncExternalStore(subscribeComfort, readUnlocked, () => true);

  if (!unlocked) return <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#020b15] px-6 text-center text-white"><h1 className="text-2xl font-black">Level locked</h1><p className="text-sm text-white/70">Clear earlier levels to unlock this challenge.</p><Link href="/levels" className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#031320]">Level Selection</Link></main>;
  // Keyed sessions reset the HUD, puzzle, and pause state together whenever
  // the level, difficulty, or daily challenge changes.
  return <GameplaySession key={`${difficulty}-${level}-${dailyDate || "regular"}-${specialId || "campaign"}-${casual}`} level={level} difficulty={difficulty} dailyDate={dailyDate} specialId={specialId} casual={casual} />;
}

function GameplaySession({ level, difficulty, dailyDate, specialId, casual }) {
  const router = useRouter();
  const mission = getMission(difficulty, level);
  const [timeLeft, setTimeLeft] = useState(() => casual ? null : difficultyParams(level, difficulty).timeSeconds);
  const [paused, setPaused] = useState(false);
  const [levelCompleted, setLevelCompleted] = useState(false);

  const togglePause = () => {
    // State updaters must be pure: playing the chime inside an updater can
    // double-trigger in React Strict Mode (and with React Compiler).
    if (paused) playIntroChime();
    setPaused((value) => !value);
  };

  useEffect(() => {
    const onBack = () => {
      if (!paused) setPaused(true);
      else if (window.confirm("Exit to Home? Your unfinished puzzle is saved automatically.")) pushWithFallback(router, "/");
    };
    window.addEventListener("sortverse-native-back", onBack);
    return () => window.removeEventListener("sortverse-native-back", onBack);
  }, [paused, router]);

  // The original chime now belongs here: it plays exactly once as a level
  // starts, and then the separate gameplay loop takes over underneath it.
  useEffect(() => {
    playIntroChime();
  }, [level, difficulty]);

  // Continuous in-game music — a different track from the menu theme — that
  // runs for as long as the level is being played and goes quiet while paused.
  useBackgroundMusic("gameplay", {
    delay: GAMEPLAY_MUSIC_DELAY_MS,
    paused,
  });

  return (
    <main className="sv-screen h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      {/* Desktop background */}
      <div className="sv-stage relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[110px]" />

        {/* Phone */}
        <div className="sv-frame relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_50px_rgba(0,180,255,0.16)]">
          <div className="sv-phone relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020b15]">
            {/* Defocused factory interior behind the board */}
            <div
              aria-hidden="true"
              className="sv-theme-art pointer-events-none absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/gameplay-background.webp')" }}
            />

            {/* Depth grade: darkens the corners and the very bottom so the
                tubes and the HUD stay the brightest things on screen. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(10,60,105,0.22)_0%,rgba(2,11,21,0.35)_55%,rgba(1,8,16,0.78)_100%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(1,10,20,.55)_0%,rgba(2,11,21,.05)_30%,rgba(2,11,21,.10)_62%,rgba(1,8,16,.72)_100%)]"
            />
            {/* Top HUD */}
            <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">
              {/* Pause / Resume */}
              <button
                type="button"
                onClick={togglePause}
                aria-label={paused ? "Resume" : "Pause"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/30 sv-theme-chip bg-[#06243a]/90 text-lg font-black text-white shadow-[0_0_18px_rgba(0,190,255,0.15)] backdrop-blur-md"
              >
                {paused ? <Play className="h-5 w-5 fill-current" strokeWidth={2.4} /> : <Pause className="h-5 w-5 fill-current" strokeWidth={2.4} />}
              </button>

              {/* Level */}
              <div className="mx-2 flex min-w-0 max-w-[220px] flex-1 flex-col items-center gap-1 text-center drop-shadow-lg">
                <h1 className="text-xl font-black leading-7 tracking-tight">Level {level}</h1>
                <h2 className="mt-0.5 text-[14px] font-extrabold leading-5 text-cyan-100">{mission.title}</h2>
                {!levelCompleted && (
                  <p className="mt-1.5 max-w-[210px] text-[12px] font-medium leading-[1.45] text-white/80">
                    {mission.objective}
                  </p>
                )}
              </div>

              {/* Timer */}
              <div
                className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-bold shadow-[0_0_18px_rgba(0,190,255,0.14)] backdrop-blur-md ${
                  timeLeft != null && timeLeft <= 15
                    ? "border-red-400/40 bg-[#3a0808]/90 text-red-200"
                    : "border-cyan-300/30 sv-theme-chip bg-[#06243a]/90"
                }`}
              >
                <TimerIcon
                  strokeWidth={2.4}
                  className={`h-3.5 w-3.5 shrink-0 ${timeLeft <= 15 ? "text-red-300" : "text-cyan-300"}`}
                />
                <span>{timeLeft == null ? "Relax" : formatTime(timeLeft)}</span>
              </div>
            </header>

            {/* 3D Game */}
            <section className="relative z-10 min-h-0 flex-1">
              <GameplayScene
                key={`${difficulty}-${level}-${dailyDate || "regular"}`}
                level={level}
                difficulty={difficulty}
                dailyDate={dailyDate}
                specialId={specialId}
                casual={casual}
                onTimeChange={setTimeLeft}
                onCompletionChange={setLevelCompleted}
                paused={paused}
                onTogglePause={togglePause}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GameplayPage() {
  return (
    <Suspense fallback={null}>
      <GameplayContent />
    </Suspense>
  );
}
