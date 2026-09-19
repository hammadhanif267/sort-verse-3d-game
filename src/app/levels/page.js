"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import LevelArt from "@/components/LevelArt";
import { CoinIcon, GemIcon } from "@/components/icons";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";

const LEVEL_COUNT = 12;
const DIFFICULTIES = ["normal", "hard", "expert"];

function getProgress() {
  if (typeof window === "undefined") {
    return { normal: 0, hard: 0, expert: 0 };
  }

  try {
    const raw = window.localStorage.getItem("sortverse-difficulty-progress");
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      normal: Number(parsed.normal) || 0,
      hard: Number(parsed.hard) || 0,
      expert: Number(parsed.expert) || 0,
    };
  } catch {
    return { normal: 0, hard: 0, expert: 0 };
  }
}

function getStars() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-level-stars") || "{}");
  } catch {
    return {};
  }
}

function getRewards() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-level-rewards") || "{}");
  } catch {
    return {};
  }
}

export default function LevelsPage() {
  const [difficulty, setDifficulty] = useState("normal");
  const [progress, setProgress] = useState({ normal: 0, hard: 0, expert: 0 });
  const [stars, setStars] = useState({});
  const [rewards, setRewards] = useState({});
  const { coins, diamonds } = usePlayerStats();

  // Same menu theme as the home page — it simply keeps playing across the
  // route change instead of restarting.
  useBackgroundMusic("menu");

  useEffect(() => {
    const sync = () => {
      setProgress(getProgress());
      setStars(getStars());
      setRewards(getRewards());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sortverse-progress", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("sortverse-progress", sync);
    };
  }, []);

  const difficultyUnlocked = (key) => {
    if (key === "normal") return true;
    if (key === "hard") return progress.normal >= LEVEL_COUNT;
    return progress.hard >= LEVEL_COUNT;
  };

  const completed = progress[difficulty] || 0;

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-[25%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />

        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020d18]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/gameplay-factory.webp')" }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,49,.48),rgba(2,13,24,.88))]" />

            <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-4">
              <Link href="/" className="flex items-center gap-2 text-white/80 transition hover:text-white">
                <span className="text-xl leading-none">‹</span>
                <span className="text-sm font-bold">Level Selection</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full border border-yellow-400/30 bg-[#06243a] px-2 py-1 text-[9px] font-bold">
                  <CoinIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{coins}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-purple-400/25 bg-[#06243a] px-2 py-1 text-[9px] font-bold">
                  <GemIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{diamonds}</span>
                </div>
              </div>
            </header>

            <section className="relative z-10 shrink-0 px-4 pt-3">
              <div className="grid grid-cols-3 overflow-hidden rounded-full border border-cyan-400/20 bg-[#041a2b] p-1">
                {DIFFICULTIES.map((key) => {
                  const unlocked = difficultyUnlocked(key);
                  const active = difficulty === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => unlocked && setDifficulty(key)}
                      className={active ? "rounded-full bg-gradient-to-b from-[#38cfff] to-[#0879cf] py-2 text-[10px] font-black shadow-[0_0_15px_rgba(0,180,255,0.25)]" : "flex items-center justify-center gap-1 rounded-full py-2 text-[10px] font-medium text-white/55 disabled:cursor-not-allowed disabled:opacity-45"}
                    >
                      {!unlocked && <span className="text-[9px]">🔒</span>}
                      {key[0].toUpperCase() + key.slice(1)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="relative z-10 min-h-0 flex-1 overflow-hidden px-4 py-3">
              <div className="grid h-full min-h-0 grid-cols-3 grid-rows-4 gap-x-3 gap-y-1.5">
                {Array.from({ length: LEVEL_COUNT }, (_, index) => {
                  const id = index + 1;
                  const isCompleted = id <= completed;
                  const isOpen = id === completed + 1;
                  const unlocked = difficultyUnlocked(difficulty) && (isCompleted || isOpen);
                  const levelStars = Number(stars[`${difficulty}-${id}`]) || 0;
                  const levelReward = rewards[`${difficulty}-${id}`];
                  return (
                    <LevelCard
                      key={`${difficulty}-${id}`}
                      id={id}
                      stars={levelStars}
                      reward={levelReward}
                      completed={isCompleted}
                      open={unlocked}
                      difficulty={difficulty}
                    />
                  );
                })}
              </div>
            </section>

            <BottomNav active="levels" />
          </div>
        </div>
      </div>
    </main>
  );
}

const numberOutline = {
  WebkitTextStroke: "1.4px rgba(3,14,26,0.9)",
  textShadow: "0 2px 4px rgba(0,0,0,0.55)",
};

function LevelCard({ id, stars, reward, completed, open, difficulty }) {
  if (!open) {
    return (
      <div className="flex min-h-0 flex-col items-center gap-1">
        <div
          aria-label={`Level ${id} locked`}
          className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[11px] border border-cyan-300/15 bg-[#04101c] shadow-[inset_0_0_16px_rgba(0,0,0,.5)]"
        >
          <LevelArt id={id} className="absolute inset-0 h-full w-full brightness-[0.55] saturate-[0.7]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,10,20,.15)_0%,rgba(2,10,20,.45)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-[#04101c]/70 p-1.5 text-[13px] leading-none shadow-[0_2px_8px_rgba(0,0,0,0.5)]">🔒</span>
          </div>
        </div>
        <span className="text-[11px] font-black text-white/50">{id}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col items-center gap-1">
      <Link
        href={`/gameplay?level=${id}&difficulty=${difficulty}`}
        prefetch
        aria-label={`Play ${difficulty} level ${id}`}
        className={`group relative min-h-0 w-full flex-1 overflow-hidden rounded-[11px] border bg-[#04101c] transition active:scale-[0.97] ${
          completed
            ? "border-cyan-300/25 shadow-[inset_0_0_16px_rgba(0,160,230,0.05)]"
            : "border-cyan-300 shadow-[0_0_22px_rgba(0,190,255,0.42),inset_0_0_18px_rgba(0,180,255,0.14)]"
        }`}
      >
        <LevelArt id={id} className="absolute inset-0 h-full w-full" />
        {!completed && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(30,210,255,0.16),transparent_58%)]" />}
        <div className="absolute inset-x-0 bottom-0 flex h-[46%] flex-col items-center justify-end gap-0.5 bg-[linear-gradient(180deg,transparent_0%,rgba(2,12,22,.5)_30%,rgba(2,12,22,.82)_100%)] pb-1">
          <span className="text-2xl font-black leading-none text-white" style={numberOutline}>{id}</span>
          {completed && (
            <div className="flex gap-0.5 text-[11px] leading-none">
              {[1, 2, 3].map((star) => (
                <span key={star} className={star <= stars ? "text-yellow-300 drop-shadow-[0_0_4px_rgba(255,210,40,0.55)]" : "text-white/25"}>★</span>
              ))}
            </div>
          )}
          {completed && reward && (
            <div className="flex items-center gap-1 text-[7px] font-black leading-none">
              <span className="inline-flex items-center gap-[1px] text-yellow-200">
                <CoinIcon className="h-2 w-2" />
                {reward.coins}
              </span>
              <span className="inline-flex items-center gap-[1px] text-violet-200">
                <GemIcon className="h-2 w-2" />
                {reward.diamonds}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
