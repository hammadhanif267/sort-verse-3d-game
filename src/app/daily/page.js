"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { playCoinCollectSound } from "@/lib/sound";
import { CelebrationPetals, FlyingRewards } from "@/components/RewardCelebration";
import {
  CalendarIcon,
  CheckCircleIcon,
  GiftIcon,
  HomeCoinIcon,
  HomeGemIcon,
  LockIcon,
} from "@/components/icons";

const LEVEL_COUNT = 12;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Which reward icon each of the 7 streak days previews — day 7 is always the
// big bonus. Doesn't affect real rewards, purely what the row shows.
const DAY_REWARD_KIND = ["coin", "coin", "gem", "coin", "gem", "coin", "gift"];

/* ------------------------------------------------------------------ */
/* Date helpers — everything keyed off the player's local calendar day */
/* ------------------------------------------------------------------ */

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// A stable, ever-increasing day number for a given local date — used to pick
// which level today's challenge is, and to tell days apart cheaply.
function dayIndexFromDate(d) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

// Monday-start week containing `d`.
function startOfWeek(d) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isoDay = (copy.getDay() + 6) % 7; // 0 = Monday
  copy.setDate(copy.getDate() - isoDay);
  return copy;
}

function getDailyLog() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-daily-completed") || "{}");
  } catch {
    return {};
  }
}

function getLevelRewards() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-level-rewards") || "{}");
  } catch {
    return {};
  }
}

// Same progress the Levels screen reads — used so today's featured level is
// never ahead of what the player has actually unlocked in Normal mode.
function getNormalProgress() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = JSON.parse(window.localStorage.getItem("sortverse-difficulty-progress") || "{}");
    return Number(raw.normal) || 0;
  } catch {
    return 0;
  }
}

// Today's featured level, but never further ahead than the very next level
// the player can already open from the Levels screen (their Normal progress
// + 1) — so the daily puzzle is always a level completable through normal
// play too, exactly like the reward it hands out.
function pickTodayLevel(date, normalProgress) {
  const reachable = Math.min(LEVEL_COUNT, Math.max(1, normalProgress + 1));
  return 1 + (dayIndexFromDate(date) % reachable);
}

function getFreeClaimLog() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("sortverse-daily-free-claim") || "{}");
  } catch {
    return {};
  }
}

const FREE_CLAIM_COINS = 50;
const FREE_CLAIM_DIAMONDS = 1;

/* ------------------------------------------------------------------ */

export default function DailyChallengePage() {
  const { coins, diamonds, addRewards } = usePlayerStats();
  useBackgroundMusic("menu");

  const [now, setNow] = useState(() => new Date());
  const [dailyLog, setDailyLog] = useState({});
  const [normalProgress, setNormalProgress] = useState(0);
  const [freeClaimLog, setFreeClaimLog] = useState({});

  // Keep the countdown ticking and pick up progress made in gameplay.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 1000);

    const sync = () => {
      // Browsers throttle setInterval in background tabs, so the moment the
      // tab is looked at again, snap the clock to the real time right away
      // instead of waiting for the next throttled tick.
      tick();

      // Today's specific challenge is just "today's featured level" under
      // sortverse-level-rewards — if that entry exists, today is done. This
      // reads the same progress the rest of the app already writes, so
      // nothing about gameplay itself needs to change for this to work.
      const today = new Date();
      const key = dateKey(today);
      const progress = getNormalProgress();
      const level = pickTodayLevel(today, progress);
      const entryId = `normal-${level}`;
      const levelRewards = getLevelRewards();
      const log = getDailyLog();

      if (levelRewards[entryId] && !log[key]) {
        log[key] = {
          level,
          coins: Number(levelRewards[entryId].coins) || 0,
          diamonds: Number(levelRewards[entryId].diamonds) || 0,
        };
        try {
          window.localStorage.setItem("sortverse-daily-completed", JSON.stringify(log));
        } catch {}
      }

      setNormalProgress(progress);
      setDailyLog(log);
      setFreeClaimLog(getFreeClaimLog());
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("sortverse-progress", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", sync);
      window.removeEventListener("sortverse-progress", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const todayKey = dateKey(now);
  const todayLevel = pickTodayLevel(now, normalProgress);
  const todayEntry = dailyLog[todayKey];
  const isTodayDone = Boolean(todayEntry);

  const weekStart = useMemo(() => startOfWeek(now), [now]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const cycleDay = ((now.getDay() + 6) % 7) + 1; // 1 = Monday ... 7 = Sunday

  // Current streak: consecutive completed days counting back from today.
  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date(now);
    // If today isn't done yet, start counting from yesterday so an
    // in-progress day doesn't reset the streak display to zero.
    if (!isTodayDone) cursor.setDate(cursor.getDate() - 1);
    while (dailyLog[dateKey(cursor)]) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [dailyLog, now, isTodayDone]);

  // Time left until the next local midnight, for "next reward" countdown.
  const msUntilMidnight = useMemo(() => {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return Math.max(0, midnight.getTime() - now.getTime());
  }, [now]);
  const hoursLeft = Math.floor(msUntilMidnight / 3_600_000);
  const minutesLeft = Math.floor((msUntilMidnight % 3_600_000) / 60_000);
  const secondsLeft = Math.floor((msUntilMidnight % 60_000) / 1_000);

  // The 7-day row promises a bonus gift on day 7 — actually grant it, once
  // per completed cycle, instead of only showing the icon. Guarded by its
  // own localStorage flag so refreshing the page can't pay it out twice.
  useEffect(() => {
    if (!isTodayDone || streak === 0 || streak % 7 !== 0) return;

    const claimKey = "sortverse-daily-streak-bonus";
    let claimed = {};
    try {
      claimed = JSON.parse(window.localStorage.getItem(claimKey) || "{}");
    } catch {}

    if (claimed[todayKey]) return;

    claimed[todayKey] = true;
    try {
      window.localStorage.setItem(claimKey, JSON.stringify(claimed));
    } catch {}

    addRewards({ coins: 200, diamonds: 5 });
  }, [isTodayDone, streak, todayKey, addRewards]);

  // Preview shown before the puzzle is played — same base formula
  // GameplayScene actually pays out (100 coins per level, 1+ diamonds for
  // clearing it), so the number here matches what the player really earns
  // instead of a separate, made-up "daily bonus" figure.
  const previewCoins = 100 * todayLevel;
  const previewDiamonds = 1;

  const isFreeClaimed = Boolean(freeClaimLog[todayKey]);
  const [claimCelebrate, setClaimCelebrate] = useState(false);
  const [claimCoinFly, setClaimCoinFly] = useState(false);
  const [claimGemFly, setClaimGemFly] = useState(false);

  function handleClaimFree() {
    if (isFreeClaimed) return;
    const log = { ...getFreeClaimLog(), [todayKey]: true };
    try {
      window.localStorage.setItem("sortverse-daily-free-claim", JSON.stringify(log));
    } catch {}
    setFreeClaimLog(log);
    addRewards({ coins: FREE_CLAIM_COINS, diamonds: FREE_CLAIM_DIAMONDS });

    // Same trophy-screen flourish as finishing a level: petals burst, then
    // the coin and gem icons fly up in turn with a collect chime each.
    setClaimCelebrate(true);
    window.setTimeout(() => {
      playCoinCollectSound({ pitch: 0 });
      setClaimCoinFly(true);
    }, 120);
    window.setTimeout(() => {
      playCoinCollectSound({ pitch: 6 });
      setClaimGemFly(true);
    }, 420);
    window.setTimeout(() => {
      setClaimCelebrate(false);
      setClaimCoinFly(false);
      setClaimGemFly(false);
    }, 1500);
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        <div className="pointer-events-none absolute left-1/2 top-[20%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/5 blur-[110px]" />

        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020d18]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: "url('/gameplay-factory.webp')" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,49,.5),rgba(2,13,24,.9))]"
            />

            {/* Header */}
            <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-4">
              <Link href="/" className="flex items-center gap-2 text-white/80 transition hover:text-white">
                <span className="text-xl leading-none">‹</span>
                <span className="text-sm font-bold">Daily Challenge</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full border border-yellow-400/30 bg-[#06243a] px-2 py-1 text-[9px] font-bold">
                  <HomeCoinIcon className="h-4 w-4" />
                  <span>{coins}</span>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-purple-400/25 bg-[#06243a] px-2 py-1 text-[9px] font-bold">
                  <HomeGemIcon className="h-4 w-4" />
                  <span>{diamonds}</span>
                </div>
              </div>
            </header>

            <section className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-4 py-4">
              {/* Streak summary strip */}
              <div className="flex items-center justify-between rounded-2xl border border-cyan-300/15 bg-[#04182a]/85 px-3.5 py-2.5 shadow-[0_6px_18px_rgba(0,0,0,0.3)] backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0c3a58]/70 ring-1 ring-cyan-300/20">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-200/60">
                      Streak
                    </div>
                    <div className="text-sm font-black leading-tight">
                      Day {cycleDay} <span className="text-white/40">of 7</span>
                    </div>
                    {streak > 0 && (
                      <div className="mt-0.5 text-[8px] font-bold text-orange-300">
                        🔥 {streak}-day streak
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-pink-300/25 bg-[#2a1024]/70 px-2.5 py-1.5">
                  <GiftIcon className="h-4 w-4" />
                  <span className="text-[9px] font-bold text-pink-100">
                    Next reward in {hoursLeft}h {String(minutesLeft).padStart(2, "0")}m{" "}
                    {String(secondsLeft).padStart(2, "0")}s
                  </span>
                </div>
              </div>

              {/* 7-day streak row */}
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {weekDays.map((d, i) => {
                  const key = dateKey(d);
                  const isToday = key === todayKey;
                  const isPast = d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const done = Boolean(dailyLog[key]);
                  const kind = DAY_REWARD_KIND[i];

                  return (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <span className="text-[7px] font-bold uppercase tracking-wide text-white/35">
                        {DAY_LABELS[i]}
                      </span>

                      <div
                        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
                          isToday
                            ? "border-yellow-300/80 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] shadow-[0_0_14px_rgba(255,180,0,0.4)]"
                            : done
                              ? "border-emerald-400/40 bg-[#0c3a2a]"
                              : isPast
                                ? "border-white/10 bg-[#08131e] opacity-50"
                                : "border-white/10 bg-[#08131e]"
                        }`}
                      >
                        {done ? (
                          <CheckCircleIcon className="h-6 w-6" />
                        ) : isToday ? (
                          <span className="text-[13px] font-black text-[#241300]">{d.getDate()}</span>
                        ) : isPast ? (
                          <span className="text-[10px] font-bold text-white/30">{d.getDate()}</span>
                        ) : (
                          <LockIcon className="h-3.5 w-3.5 text-white/25" strokeWidth={2.2} />
                        )}
                      </div>

                      {!isToday && !done && !isPast && (
                        <span className="flex h-[9px] w-[9px] items-center justify-center leading-none">
                          {kind === "gift" ? (
                            <GiftIcon className="h-[9px] w-[9px]" />
                          ) : kind === "gem" ? (
                            <HomeGemIcon className="h-[9px] w-[9px]" />
                          ) : (
                            <HomeCoinIcon className="h-[9px] w-[9px]" />
                          )}
                        </span>
                      )}
                      {!isToday && !done && isPast && <span className="h-[9px]" />}
                      {(isToday || done) && <span className="h-[9px]" />}
                    </div>
                  );
                })}
              </div>

              {/* Today's puzzle */}
              <div className="mt-4 rounded-3xl border border-cyan-300/20 bg-[#06243a]/85 p-4 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
                    Today&apos;s Puzzle
                  </span>
                  {isTodayDone && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300">
                      <CheckCircleIcon className="h-3.5 w-3.5" /> Claimed
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <PuzzlePreview />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white">Level {todayLevel}</div>
                    <div className="mt-0.5 text-[10px] text-white/55">Sort every tube by colour</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-yellow-400/25 bg-[#08243a] px-2.5 py-1 text-[10px] font-bold text-yellow-200">
                    <HomeCoinIcon className="h-3.5 w-3.5" /> +{isTodayDone ? todayEntry.coins : previewCoins}
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-purple-400/25 bg-[#08243a] px-2.5 py-1 text-[10px] font-bold text-purple-200">
                    <HomeGemIcon className="h-3.5 w-3.5" /> +{isTodayDone ? todayEntry.diamonds : previewDiamonds}
                  </div>
                </div>

                <Link
                  href={`/gameplay?level=${todayLevel}&difficulty=normal`}
                  prefetch
                  className="mt-3.5 flex h-11 w-full items-center justify-center rounded-full border border-emerald-300/60 bg-gradient-to-b from-[#4ee08a] to-[#0a9e52] text-sm font-black text-[#052014] shadow-[0_4px_16px_rgba(20,200,120,0.22)] transition duration-200 hover:brightness-110 active:scale-[0.99]"
                >
                  {isTodayDone ? "Play Again" : "Play"}
                </Link>
              </div>

              {/* Free daily claim */}
              <div className="relative mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-yellow-300/25 bg-gradient-to-r from-[#3a2a06]/70 to-[#06243a]/70 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.3)] backdrop-blur">
                {claimCelebrate && <CelebrationPetals />}
                <FlyingRewards active={claimCoinFly} Icon={HomeCoinIcon} count={6} />
                <FlyingRewards active={claimGemFly} Icon={HomeGemIcon} count={4} />
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3a2a06]/80 text-lg ring-1 ring-yellow-300/30">
                    🎁
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black uppercase tracking-[0.16em] text-yellow-200/80">
                      Free Daily Gift
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <HomeCoinIcon className="h-3.5 w-3.5" /> +{FREE_CLAIM_COINS}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HomeGemIcon className="h-3.5 w-3.5" /> +{FREE_CLAIM_DIAMONDS}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClaimFree}
                  disabled={isFreeClaimed}
                  className={
                    isFreeClaimed
                      ? "flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-[#0c3a2a] px-4 text-[10px] font-black text-emerald-300"
                      : "flex h-10 shrink-0 items-center rounded-full border border-yellow-300/60 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] px-5 text-[11px] font-black text-[#241300] shadow-[0_4px_14px_rgba(255,180,0,0.3)] transition duration-200 hover:brightness-110 active:scale-[0.97]"
                  }
                >
                  {isFreeClaimed ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4" /> Claimed
                    </>
                  ) : (
                    "Claim"
                  )}
                </button>
              </div>

              {/* Streak explainer */}
              <p className="mt-3 px-1 text-center text-[9px] leading-relaxed text-white/35">
                Complete every day&apos;s puzzle to keep your streak alive. Miss a day and the
                streak resets — Day 7 pays out a bonus gift.
              </p>
            </section>

            <BottomNav />
          </div>
        </div>
      </div>
    </main>
  );
}

/* A small, self-contained preview of the tube-sorting board — built from the
   game's own colours rather than a generic icon, so it reads as "this game"
   at a glance. */
function PuzzlePreview() {
  const cols = ["#1d6fe0", "#d6202f", "#f0c018", "#22a72f"];
  return (
    <div className="flex h-14 w-16 shrink-0 items-end justify-center gap-1 rounded-2xl border border-white/10 bg-[#031a2a] p-1.5">
      {cols.map((c, i) => (
        <div
          key={c}
          className="flex w-2.5 flex-col-reverse gap-[2px] rounded-full border border-white/15 bg-white/5 p-[2px]"
          style={{ height: i % 2 === 0 ? "100%" : "78%" }}
        >
          <span className="aspect-square w-full rounded-full" style={{ background: c }} />
          <span className="aspect-square w-full rounded-full" style={{ background: c, opacity: i === 2 ? 0.35 : 0.9 }} />
        </div>
      ))}
    </div>
  );
}
