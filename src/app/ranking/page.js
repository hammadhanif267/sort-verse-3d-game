"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronLeft, Flame, Gamepad2, Pencil } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { getLeague, useRanking } from "@/lib/ranking";
import { Avatar } from "@/components/RankBits";
import { ChartIcon, FlagIcon, HomeCoinIcon, HomeGemIcon, StarIcon, TrophyGoldIcon } from "@/components/icons";

const TABS = [
  ["scores", "Top Scores"],
  ["streak", "Streak"],
  ["stats", "Stats"],
];

export default function RankingPage() {
  const { coins, diamonds } = usePlayerStats();
  const { ready, data, setName } = useRanking();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [performanceTab, setPerformanceTab] = useState("scores");
  useBackgroundMusic("menu");

  const score = data ? data.score : 0;
  const league = getLeague(score);

  function saveName() {
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
                <span className="text-sm font-bold">Ranking</span>
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

            <section className="game-scroll relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {/* Player / league card */}
              <div className="rounded-3xl border border-cyan-300/20 bg-[#06243a]/85 p-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <Avatar name={data ? data.name : "You"} you size={46} avatar={data ? data.avatar : null} />
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <input
                        autoFocus
                        value={draft}
                        maxLength={14}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={saveName}
                        onKeyDown={(e) => e.key === "Enter" && saveName()}
                        className="w-full rounded-lg border border-cyan-300/30 bg-[#031a2a] px-2 py-1 text-sm font-black outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(data ? data.name : "");
                          setEditing(true);
                        }}
                        className="flex items-center gap-1.5 text-left text-sm font-black"
                      >
                        <span className="truncate">{data ? data.name : "You"}</span>
                        <Pencil className="h-3 w-3 text-white/45" />
                      </button>
                    )}
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[11px] font-black" style={{ color: league.color }}>{league.name} League</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">Best Score</div>
                    <div className="text-xl font-black text-yellow-300">{score.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${league.percent}%`, background: league.color }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] font-bold text-white/45">
                  <span>{score.toLocaleString()} pts</span>
                  <span>{league.next ? `${(league.next.min - score).toLocaleString()} to ${league.next.name}` : "Max league reached"}</span>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {[
                    [StarIcon, "Stars", data ? data.stars : 0],
                    [FlagIcon, "Cleared", data ? data.cleared : 0],
                    [ChartIcon, "This week", data?.week?.weekly ?? 0],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-[#031a2a]/80 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[13px] font-black">
                        <Icon className="h-4 w-4" />
                        {value}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-white/35">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal performance: same real-data concept as a professional
                  game profile, while keeping Sortverse's existing visual language. */}
              {ready && data?.performance && (
                <section className="mt-3 rounded-2xl border border-cyan-300/15 bg-[#04182a]/75 p-3">
                  <div className="mb-2">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">My Performance</div>
                    <div className="mt-0.5 text-[10px] text-white/35">Your best runs, streaks and progress</div>
                  </div>
                  {performanceTab === "scores" && (
                    <div className="mt-2 space-y-1.5">
                      {data.performance.topScores.length ? data.performance.topScores.map((r, index) => (
                        <div key={r.id || `${r.completedAt}-${index}`} className="flex items-center gap-2 rounded-xl border border-white/8 bg-[#031a2a]/80 px-2.5 py-2">
                          <span className="w-5 text-center text-[10px] font-black text-yellow-300">#{index + 1}</span>
                          <Gamepad2 className="h-4 w-4 text-cyan-300" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-black">Level {r.level} · {String(r.difficulty || "normal").toUpperCase()}</div>
                            <div className="text-[9px] text-white/40">{r.stars} stars · {r.moves} moves · {new Date(r.completedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-right text-[11px] font-black text-cyan-200">{Number(r.score).toLocaleString()}<div className="text-[8px] uppercase text-white/30">pts</div></div>
                        </div>
                      )) : <div className="rounded-xl border border-white/8 px-3 py-4 text-center text-[10px] text-white/35">Complete a level to create your first real score record.</div>}
                    </div>
                  )}

                  {performanceTab === "streak" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-orange-300/15 bg-orange-400/5 p-3"><Flame className="h-5 w-5 text-orange-300" /><div className="mt-1 text-2xl font-black">{data.performance.currentStreak}</div><div className="text-[9px] font-bold uppercase text-white/35">Current streak</div></div>
                      <div className="rounded-xl border border-yellow-300/15 bg-yellow-400/5 p-3"><TrophyGoldIcon className="h-5 w-5" /><div className="mt-1 text-2xl font-black">{data.performance.bestStreak}</div><div className="text-[9px] font-bold uppercase text-white/35">Best streak</div></div>
                    </div>
                  )}

                  {performanceTab === "stats" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        [Gamepad2, "Games played", data.performance.gamesPlayed],
                        [TrophyGoldIcon, "Best score", data.performance.bestScore],
                        [BarChart3, "Average score", data.performance.averageScore],
                        [Flame, "Best streak", data.performance.bestStreak],
                      ].map(([Icon, label, value]) => (
                        <div key={label} className="rounded-xl border border-white/8 bg-[#031a2a]/80 p-2.5"><Icon className="h-4 w-4 text-cyan-300" /><div className="mt-1 text-xl font-black">{Number(value).toLocaleString()}</div><div className="text-[9px] font-bold uppercase text-white/35">{label}</div></div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <div className="mt-3 rounded-2xl border border-cyan-300/15 bg-[#04182a]/75 p-3">
                <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">My Records</div>
                <div className="mt-0.5 text-[10px] text-white/35">Your strongest completed runs, streaks and progress.</div>
                <div className="mt-2 flex rounded-xl border border-white/8 bg-[#031a2a]/80 p-0.5">
                  {TABS.map(([key, label]) => {
                    const Icon = key === "scores" ? TrophyGoldIcon : key === "streak" ? Flame : BarChart3;
                    return (
                      <button key={key} type="button" onClick={() => setPerformanceTab(key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-black transition ${performanceTab === key ? "bg-white/10 text-white" : "text-white/45"}`}>
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <BottomNav active="ranking" />
          </div>
        </div>
      </div>
    </main>
  );
}
