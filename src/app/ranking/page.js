"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { getLeague, useRanking, REWARD_TIERS } from "@/lib/ranking";
import { Avatar, LeagueChip } from "@/components/RankBits";
import { playCoinCollectSound } from "@/lib/sound";
import { CalendarIcon, ChartIcon, CrownIcon, FlagIcon, HomeCoinIcon, HomeGemIcon, StarIcon, TrophyGoldIcon } from "@/components/icons";

const TABS = [
  ["global", "Global"],
  ["weekly", "Weekly"],
  ["friends", "Friends"],
];
const LIST_LIMIT = 25;

function Podium({ top }) {
  if (top.length < 3) return null;
  const cols = [
    { e: top[1], h: 50, c: "#c9d4df", s: 40 },
    { e: top[0], h: 72, c: "#ffc21a", s: 50 },
    { e: top[2], h: 38, c: "#cd7f32", s: 40 },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 items-end gap-2">
      {cols.map(({ e, h, c, s }) => (
        <div key={e.id} className="flex min-w-0 flex-col items-center">
          {e.rank === 1 && <CrownIcon className="-mb-1 h-5 w-5 text-yellow-300" />}
          <Avatar name={e.name} you={e.you} size={s} avatar={e.avatar} />
          <div className="mt-1 w-full truncate text-center text-[10px] font-black">{e.name}</div>
          <div className="text-[10px] font-bold text-cyan-200">{e.value.toLocaleString()}</div>
          <div
            className="mt-1 flex w-full items-start justify-center rounded-t-xl border border-b-0 pt-1 text-sm font-black"
            style={{ height: h, color: c, borderColor: `${c}66`, background: `linear-gradient(180deg,${c}30,transparent)` }}
          >
            {e.rank}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ e }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2 ${
        e.you ? "border-yellow-300/50 bg-[#3a2a06]/60" : "border-white/5 bg-[#04182a]/80"
      }`}
    >
      <span className="w-6 text-center text-[11px] font-black text-white/50">{e.rank}</span>
      <Avatar name={e.name} you={e.you} avatar={e.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-black">
          {e.name}
          {e.you && <span className="ml-1 text-yellow-300">(You)</span>}
        </div>
        <LeagueChip score={e.score} />
      </div>
      <div className="text-right">
        <div className="text-[12px] font-black text-cyan-200">{e.value.toLocaleString()}</div>
        <div className="text-[10px] font-bold uppercase text-white/30">pts</div>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const { coins, diamonds, addRewards } = usePlayerStats();
  const { ready, data, boards, lastRank, setName, markClaimed } = useRanking();
  const [tab, setTab] = useState("global");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useBackgroundMusic("menu");

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(t);
  }, []);

  const board = boards ? boards[tab] : [];
  const me = board.find((e) => e.you);
  const globalRank = boards ? boards.global.find((e) => e.you).rank : null;
  const delta = lastRank && globalRank ? lastRank - globalRank : 0;
  const score = data ? data.score : 0;
  const league = getLeague(score);
  const above = me && me.rank > 1 ? board[me.rank - 2] : null;
  const gap = above ? above.value - me.value + 1 : 0;

  const msLeft = data ? Math.max(0, data.week.endMs - now) : 0;
  const d = Math.floor(msLeft / 86400000);
  const h = Math.floor((msLeft % 86400000) / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);

  const listed = board.slice(3, LIST_LIMIT);
  const meOutside = me && me.rank > LIST_LIMIT;

  const lastWeek = data ? data.lastWeek : null;
  const myWeeklyRank = boards ? boards.weekly.find((e) => e.you).rank : null;

  function claimLastWeek() {
    if (!lastWeek || lastWeek.claimed || !lastWeek.reward) return;
    addRewards({ coins: lastWeek.reward.coins, diamonds: lastWeek.reward.gems });
    markClaimed();
    playCoinCollectSound({ pitch: 0 });
  }

  // Dev only: pretend last week just ended so the "Last week" card + Claim can be tested.
  function simulateRollover() {
    try {
      window.localStorage.setItem("sortverse-ranking-week", JSON.stringify({ week: "2000-1-3", base: Math.max(0, score - 800) }));
    } catch {}
    window.dispatchEvent(new Event("sortverse-progress"));
  }

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
                <span className="text-xl leading-none">‹</span>
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

            <section className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-3">
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
                      <span className="text-[11px] font-black" style={{ color: league.color }}>
                        {league.name} League
                      </span>
                      {delta !== 0 && (
                        <span className={`text-[10px] font-black ${delta > 0 ? "text-emerald-300" : "text-red-400"}`}>
                          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">Global</div>
                    <div className="text-xl font-black text-yellow-300">#{globalRank ?? "–"}</div>
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
                    [ChartIcon, "This week", me && boards ? boards.weekly.find((e) => e.you).value : 0],
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

              {/* Last week's result + claim */}
              {lastWeek && lastWeek.reward && !lastWeek.claimed && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-yellow-300/30 bg-gradient-to-r from-[#3a2a06]/70 to-[#06243a]/70 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-200/80">
                      Last week: #{lastWeek.rank} · {lastWeek.reward.label}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <HomeCoinIcon className="h-3.5 w-3.5" /> +{lastWeek.reward.coins}
                      </span>
                      {lastWeek.reward.gems > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <HomeGemIcon className="h-3.5 w-3.5" /> +{lastWeek.reward.gems}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={claimLastWeek}
                    className="h-10 shrink-0 rounded-full border border-yellow-300/60 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] px-5 text-[11px] font-black text-[#241300] transition active:scale-[0.97]"
                  >
                    Claim
                  </button>
                </div>
              )}

              {/* Tabs + weekly reset */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex rounded-full border border-cyan-300/15 bg-[#04182a]/90 p-0.5">
                  {TABS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`rounded-full px-3 py-1.5 text-[10px] font-black transition ${
                        tab === key ? "bg-gradient-to-b from-[#ffd21a] to-[#ff8500] text-[#241300]" : "text-white/55"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {tab === "weekly" && ready && (
                  <div className="flex items-center gap-1 rounded-full border border-pink-300/25 bg-[#2a1024]/70 px-2 py-1.5 text-[10px] font-bold text-pink-100">
                    <CalendarIcon className="h-3.5 w-3.5" /> Resets {d}d {h}h {m}m
                  </div>
                )}
              </div>

              {tab === "weekly" && ready && (
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {REWARD_TIERS.map((t, i) => {
                    const active = myWeeklyRank && myWeeklyRank <= t.max && (i === 0 || myWeeklyRank > REWARD_TIERS[i - 1].max);
                    return (
                      <div
                        key={t.label}
                        className={`rounded-xl border py-1.5 text-center ${active ? "border-yellow-300/60 bg-[#3a2a06]/60" : "border-white/8 bg-[#04182a]/80"}`}
                      >
                        <div className="text-[10px] font-black">{t.label}</div>
                        <div className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-black text-yellow-200">
                          <HomeCoinIcon className="h-3.5 w-3.5" />
                          {t.coins}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[11px] font-black text-purple-200">
                          <HomeGemIcon className="h-3.5 w-3.5" />
                          {t.gems}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!ready ? (
                <p className="py-10 text-center text-[11px] text-white/40">Loading leaderboard…</p>
              ) : (
                <>
                  <Podium top={board.slice(0, 3)} />
                  <div className="mt-2 space-y-1.5 pb-2">
                    {listed.map((e) => (
                      <Row key={e.id} e={e} />
                    ))}
                    {meOutside && (
                      <>
                        <div className="py-0.5 text-center text-[10px] font-black tracking-[0.4em] text-white/30">•••</div>
                        <Row e={me} />
                      </>
                    )}
                  </div>
                  <p className="px-2 pb-1 text-center text-[10px] leading-relaxed text-white/30">
                    Rivals are simulated until an online leaderboard is connected. Your score is real: stars, cleared levels and daily streak.
                  </p>
                  {process.env.NODE_ENV !== "production" && (
                    <button
                      type="button"
                      onClick={simulateRollover}
                      className="mx-auto mb-2 block rounded-full border border-white/15 px-3 py-1 text-[10px] font-bold text-white/50"
                    >
                      Dev: simulate week rollover
                    </button>
                  )}
                </>
              )}
            </section>

            {/* Sticky "your rank" bar */}
            {me && (
              <div className="relative z-10 shrink-0 border-t border-yellow-300/25 bg-[#1a1404]/95 px-4 py-2 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <TrophyGoldIcon className="h-6 w-6" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black">
                      You are #{me.rank} <span className="text-white/40">of {board.length}</span>
                    </div>
                    <div className="truncate text-[10px] font-bold text-yellow-200/80">
                      {above ? `${gap.toLocaleString()} pts to pass ${above.name}` : "You're on top!"}
                    </div>
                  </div>
                  <div className="text-right text-[13px] font-black text-cyan-200">{me.value.toLocaleString()}</div>
                </div>
              </div>
            )}

            <BottomNav active="ranking" />
          </div>
        </div>
      </div>
    </main>
  );
}
