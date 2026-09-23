"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { useCityProgress } from "@/lib/cityProgress";
import { CityIcon } from "@/components/icons";
import { CelebrationPetals } from "@/components/RewardCelebration";
import { playLevelCompleteVoice } from "@/lib/sound";

const SEEN_LEVEL_KEY = "sortverse-city-seen-level";

/** Small twinkling lights scattered over the skyline — more of them, and a
 * touch brighter, the further the city has grown. Purely decorative, so a
 * fixed seeded layout (not re-randomised every render) keeps it calm
 * instead of flickering into new positions on every re-render. */
function CitySparkles({ cityLevel }) {
  const count = Math.min(18, 4 + cityLevel * 2);
  const sparkles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: 8 + ((i * 37) % 84),
        top: 10 + ((i * 53) % 62),
        size: 2 + (i % 3),
        delay: (i * 220) % 2600,
        duration: 1800 + (i % 5) * 260,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparkles.slice(0, count).map((s) => (
        <span
          key={s.id}
          className="city-sparkle"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}ms`,
            animationDuration: `${s.duration}ms`,
            "--sparkle-peak": cityLevel >= 8 ? 1 : cityLevel >= 4 ? 0.85 : 0.6,
          }}
        />
      ))}
    </div>
  );
}

export default function CityPage() {
  const { coins, diamonds } = usePlayerStats();
  useBackgroundMusic("menu");

  const {
    cityLevel,
    cityStage,
    maxCityLevel,
    isMaxLevel,
    percent,
    starsIntoLevel,
    starsPerLevel,
    totalStars,
    maxStars,
  } = useCityProgress();

  // City artwork changes at the six supplied stage milestones. The incoming
  // image fades in over the previous one so the city visibly grows instead
  // of snapping to a different picture.
  const [shownStage, setShownStage] = useState(cityStage);
  const [incomingStage, setIncomingStage] = useState(null);
  const [showIncoming, setShowIncoming] = useState(false);

  useEffect(() => {
    if (cityStage === shownStage) return undefined;

    setIncomingStage(cityStage);
    setShowIncoming(false);
    const frame = window.requestAnimationFrame(() => setShowIncoming(true));
    const timer = window.setTimeout(() => {
      setShownStage(cityStage);
      setIncomingStage(null);
      setShowIncoming(false);
    }, 760);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [cityStage, shownStage]);

  // Celebrate the moment the city actually levels up — compared against the
  // last level this browser saw (persisted), so it fires whether that
  // growth happened just now while this page was open, or happened earlier
  // from playing on the Levels screen and only shows up next time this page
  // is opened. Never fires for a brand-new player's very first look.
  const [celebrateLevelUp, setCelebrateLevelUp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let seen = null;
    try {
      seen = Number(window.localStorage.getItem(SEEN_LEVEL_KEY));
    } catch {}
    const hasPriorRecord = Number.isFinite(seen) && seen > 0;

    if (hasPriorRecord && seen < cityLevel) {
      setCelebrateLevelUp(true);
      playLevelCompleteVoice("Your city grew!");
      window.setTimeout(() => setCelebrateLevelUp(false), 1600);
    }

    if (!hasPriorRecord || seen !== cityLevel) {
      try {
        window.localStorage.setItem(SEEN_LEVEL_KEY, String(cityLevel));
      } catch {}
    }
  }, [cityLevel]);

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,rgba(120,0,220,0.14),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/5 blur-[100px]" />

        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020d18]">
            {/* Header */}
            <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-4">
              <Link href="/" className="flex items-center gap-2 text-white/80 transition hover:text-white">
                <span className="text-xl leading-none">‹</span>
                <span className="text-sm font-bold">Your City</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full border border-yellow-400/30 bg-[#06243a] px-2 py-1 text-[9px] font-bold">
                  <span
                    className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff7bd] via-[#ffd43b] to-[#d58a00] ring-1 ring-yellow-200/60"
                    aria-hidden="true"
                  >
                    <span className="text-[7px] font-black leading-none text-[#704000]">$</span>
                  </span>
                  <span>{coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-[#06243a] px-2 py-1 text-[9px] font-bold">
                  <span className="flex h-4 w-4 items-center justify-center rounded-md bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-500">
                    <Gem className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
                  </span>
                  <span>{diamonds}</span>
                </div>
              </div>
            </header>

            <section className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
              {/* City image */}
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#020912] shadow-[0_10px_28px_rgba(0,0,0,0.4)]">
                <Image
                  src={`/images/city-stages/city-stage-${shownStage}.webp`}
                  alt={`Your floating city — Stage ${shownStage}`}
                  fill
                  priority
                  sizes="430px"
                  className={`object-cover object-center transition-opacity duration-700 ${incomingStage ? "" : ""}`}
                  style={{ opacity: incomingStage ? 0 : 1 }}
                />
                {incomingStage && (
                  <Image
                    src={`/images/city-stages/city-stage-${incomingStage}.webp`}
                    alt={`Your floating city — Stage ${incomingStage}`}
                    fill
                    sizes="430px"
                    className="object-cover object-center transition-opacity duration-700"
                    style={{ opacity: showIncoming ? 1 : 0 }}
                  />
                )}
                <CitySparkles cityLevel={cityLevel} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020912]/70 via-transparent to-[#020912]/10" />

                <div className="absolute left-1/2 top-2.5 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-purple-300/40 bg-[#1a0a2a]/85 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-purple-100 backdrop-blur">
                  <CityIcon className="h-3.5 w-3.5" />
                  {isMaxLevel ? "Max City" : "Growing"}
                </div>

                {celebrateLevelUp && (
                  <>
                    <CelebrationPetals />
                    <div className="absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 text-center">
                      <span className="reward-pop inline-block rounded-full border border-yellow-300/60 bg-[#1a0a2a]/90 px-4 py-1.5 text-xs font-black text-yellow-200 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur">
                        ✨ City leveled up!
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Level badge, overlapping the image bottom edge like the reference */}
              <div className="relative z-10 -mt-5 flex justify-center">
                <div className="rounded-full border border-purple-300/50 bg-gradient-to-b from-[#a53cf0] to-[#6a0cc9] px-5 py-1.5 text-sm font-black shadow-[0_6px_18px_rgba(150,0,255,0.35)]">
                  Level {cityLevel}
                </div>
              </div>

              {/* City progress */}
              <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-[#06243a]/85 p-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
                    City Progress
                  </span>
                  <span className="text-[10px] font-bold text-white/60">{percent}%</span>
                </div>

                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#03121f] ring-1 ring-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#3fe0ff] to-[#7c3aed] shadow-[0_0_10px_rgba(120,80,255,0.5)] transition-[width] duration-700 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="mt-2 text-center text-[9px] font-semibold text-white/45">
                  {isMaxLevel
                    ? `Your city is fully grown — ${totalStars} stars earned!`
                    : `${starsIntoLevel}/${starsPerLevel} ★ toward Level ${cityLevel + 1}`}
                </p>
              </div>

              {/* Explainer */}
              <p className="mt-3 px-1 text-center text-[9px] leading-relaxed text-white/35">
                Every star you earn clearing a level grows your city. Chase 3-star
                clears in Levels to build it up fastest — {totalStars} of {maxStars} ★ collected so far.
              </p>

              <Link
                href="/levels"
                prefetch
                className="mt-3.5 flex h-11 w-full shrink-0 items-center justify-center rounded-full border border-emerald-300/60 bg-gradient-to-b from-[#4ee08a] to-[#0a9e52] text-sm font-black text-[#052014] shadow-[0_4px_16px_rgba(20,200,120,0.22)] transition duration-200 hover:brightness-110 active:scale-[0.99]"
              >
                Earn More Stars
              </Link>
            </section>

            <BottomNav />
          </div>
        </div>
      </div>
    </main>
  );
}
