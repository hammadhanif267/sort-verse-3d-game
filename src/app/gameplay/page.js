"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GameplayScene, { difficultyParams } from "../../components/game/GameplayScene";
import { playIntroChime } from "@/lib/sound";
import useBackgroundMusic from "@/lib/useBackgroundMusic";

// How long the intro chime is given before the gameplay loop fades in.
const GAMEPLAY_MUSIC_DELAY_MS = 1400;

function formatTime(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined) return "--:--";
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60).toString().padStart(2, "0");
  const seconds = (clamped % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function GameplayContent() {
  const searchParams = useSearchParams();
  const levelParam = Number(searchParams.get("level"));
  const level = Number.isFinite(levelParam) && levelParam > 0 ? levelParam : 1;
  const difficultyParam = searchParams.get("difficulty");
  const difficulty = ["normal", "hard", "expert"].includes(difficultyParam) ? difficultyParam : "normal";

  // Real-time countdown, reported up from GameplayScene every second —
  // seeded here so the header never flashes a stale value on level change.
  const [timeLeft, setTimeLeft] = useState(() => difficultyParams(level, difficulty).timeSeconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setTimeLeft(difficultyParams(level, difficulty).timeSeconds);
    setPaused(false);
  }, [level, difficulty]);

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
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      {/* Desktop background */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[110px]" />

        {/* Phone */}
        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_50px_rgba(0,180,255,0.16)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020b15]">
            {/* Defocused factory interior behind the board */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-center"
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
            <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
              {/* Pause / Resume */}
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "Resume" : "Pause"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/30 bg-[#06243a]/90 text-lg font-black text-white shadow-[0_0_18px_rgba(0,190,255,0.15)] backdrop-blur-md"
              >
                {paused ? "▶" : "❚❚"}
              </button>

              {/* Level */}
              <div className="text-center drop-shadow-lg">
                <div className="text-xl font-black tracking-tight">Level {level}</div>

                <div className="mt-0.5 text-[10px] font-medium text-cyan-100/75">
                  Sort the objects
                </div>
              </div>

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold shadow-[0_0_18px_rgba(0,190,255,0.14)] backdrop-blur-md ${
                  timeLeft <= 15
                    ? "border-red-400/40 bg-[#3a0808]/90 text-red-200"
                    : "border-cyan-300/30 bg-[#06243a]/90"
                }`}
              >
                <span className={timeLeft <= 15 ? "text-red-300" : "text-cyan-300"}>◷</span>
                <span>{formatTime(timeLeft)}</span>
              </div>
            </header>

            {/* 3D Game */}
            <section className="relative z-10 min-h-0 flex-1">
              <GameplayScene
                key={`${difficulty}-${level}`}
                level={level}
                difficulty={difficulty}
                onTimeChange={setTimeLeft}
                paused={paused}
                onTogglePause={() => setPaused((value) => !value)}
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
