"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, ChevronLeft, Download, Flame, Gamepad2, Pencil, Share2, UserRound, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { usePlayerStats } from "@/lib/playerStats";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import { getLeague, useRanking } from "@/lib/ranking";
import { Avatar } from "@/components/RankBits";
import { PreviewableAvatar } from "@/components/AvatarPreview";
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
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [shareMessage, setShareMessage] = useState("");
  const avatarReceiptRef = useRef(null);
  useBackgroundMusic("menu");

  const score = data ? data.score : 0;
  const league = getLeague(score);

  function saveName() {
    setName(draft);
    setEditing(false);
  }

  function formatPerformanceDate(value) {
    if (!value) return "Recorded";
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function openPerformance(record) {
    setShareMessage("");
    setSelectedPerformance(record);
  }

  function receiptDetails(record) {
    const isOverall = Boolean(record?.isOverall);
    const overall = data?.performance || {};
    const scoreValue = Number(isOverall ? data?.score || 0 : record.score || 0);
    const starsValue = Number(record.stars || 0);
    const movesValue = record.moves != null ? Number(record.moves) : null;
    const difficulty = String(record.difficulty || "normal").toUpperCase();
    return {
      player: data?.name || "Player",
      isOverall,
      level: isOverall ? (data?.city?.cityLevel || 1) : record.level,
      difficulty: isOverall ? "ALL MODES" : difficulty,
      score: scoreValue,
      stars: isOverall ? Number(data?.stars || 0) : starsValue,
      moves: isOverall ? null : movesValue,
      completed: isOverall ? "Current overall performance" : formatPerformanceDate(record.completedAt),
      stage: isOverall ? Number(data?.city?.cityStage || 1) : Number(record.stage || (Number(record.level || 1) <= 2 ? 1 : Number(record.level || 1) <= 4 ? 2 : Number(record.level || 1) <= 6 ? 3 : Number(record.level || 1) <= 8 ? 4 : Number(record.level || 1) <= 10 ? 5 : 6)),
      cityLevel: isOverall ? Number(data?.city?.cityLevel || 1) : Number(record.cityLevel || record.level || 1),
      league: isOverall ? league.name : (record.league || league.name),
      nextLeague: isOverall ? league.next?.name || null : null,
      gamesPlayed: isOverall ? Number(overall.gamesPlayed || 0) : null,
      bestScore: isOverall ? Number(overall.bestScore || 0) : null,
      averageScore: isOverall ? Number(overall.averageScore || 0) : null,
      currentStreak: isOverall ? Number(overall.currentStreak || 0) : null,
      bestStreak: isOverall ? Number(overall.bestStreak || 0) : null,
      normal: isOverall ? Number(data?.byDiff?.normal || 0) : null,
      hard: isOverall ? Number(data?.byDiff?.hard || 0) : null,
      expert: isOverall ? Number(data?.byDiff?.expert || 0) : null,
    };
  }

  function receiptText(record) {
    const d = receiptDetails(record);
    return [
      `SORTVERSE 3D — ${d.isOverall ? "OVERALL PERFORMANCE" : "PERFORMANCE RECEIPT"}`,
      `Player: ${d.player}`,
      d.isOverall ? `Status: ${d.player} is at Stage ${d.stage} · City Level ${d.cityLevel}` : `Result: Level ${d.level} completed`,
      `League: ${d.league}`,
      `Difficulty: ${d.difficulty}`,
      `Score: ${d.score.toLocaleString()} pts`,
      `Stars: ${d.stars} / 3`,
      `City Stage: ${d.stage} · City Level ${d.cityLevel}`,
      d.moves != null ? `Moves: ${d.moves}` : null,
      d.isOverall ? `Games played: ${d.gamesPlayed}` : null,
      d.isOverall ? `Best score: ${d.bestScore} pts` : null,
      d.isOverall ? `Average score: ${d.averageScore} pts` : null,
      d.isOverall ? `Streak: ${d.currentStreak} current · ${d.bestStreak} best` : null,
      d.isOverall ? `Modes cleared: Normal ${d.normal} · Hard ${d.hard} · Expert ${d.expert}` : null,
      `Completed: ${d.completed}`,
      d.isOverall ? "Performance: Overall gameplay progress" : "Performance: Successful level completion",
    ].filter(Boolean).join("\n");
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  async function buildReceiptImage(record) {
    const d = receiptDetails(record);
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1400;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#061b2b");
    bg.addColorStop(1, "#020912");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    roundedRect(ctx, 70, 55, 760, 1290, 42);
    ctx.fillStyle = "#08263b";
    ctx.fill();
    ctx.strokeStyle = "#2b7895";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 42px Arial";
    ctx.fillText("SORTVERSE 3D", 450, 125);
    ctx.fillStyle = "#8fb4c6";
    ctx.font = "700 20px Arial";
    ctx.fillText(d.isOverall ? "OVERALL PERFORMANCE" : "PERFORMANCE RECEIPT", 450, 160);

    roundedRect(ctx, 115, 195, 670, 108, 24);
    ctx.fillStyle = "#031a2a";
    ctx.fill();

    // Player avatar/profile: use the actual photo when available, otherwise
    // use the sharp SVG avatar currently shown in the receipt.
    const avatarSource = avatarReceiptRef.current?.querySelector("img")?.src || null;
    const avatarSvg = avatarReceiptRef.current?.querySelector("svg") || null;
    const avatarSvgData = avatarSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(avatarSvg))}` : null;
    const avatarImage = avatarSource || avatarSvgData;
    if (avatarImage) {
      try {
        const img = await new Promise((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = avatarImage;
        });
        ctx.save();
        ctx.beginPath(); ctx.arc(168, 249, 42, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, 126, 207, 84, 84);
        ctx.restore();
        ctx.strokeStyle = "#43c8ee"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(168, 249, 43, 0, Math.PI * 2); ctx.stroke();
      } catch {}
    } else {
      ctx.fillStyle = "#123f9b";
      ctx.beginPath(); ctx.arc(168, 249, 42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.font = "900 25px Arial"; ctx.textAlign = "center";
      ctx.fillText(d.player.slice(0, 2).toUpperCase(), 168, 258);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "#69dcff";
    ctx.font = "900 28px Arial";
    ctx.fillText(d.player, 235, 242);
    ctx.fillStyle = "#a8c1ce";
    ctx.font = "700 20px Arial";
    ctx.fillText(d.isOverall ? `Stage ${d.stage} • City Level ${d.cityLevel}` : `Level ${d.level} • ${d.difficulty}`, 235, 278);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe06a";
    ctx.font = "900 72px Arial";
    ctx.fillText(d.score.toLocaleString(), 450, 410);
    ctx.fillStyle = "#8fb4c6";
    ctx.font = "700 19px Arial";
    ctx.fillText("POINTS", 450, 445);

    const rows = d.isOverall ? [
      ["Current League", `${d.league}${d.nextLeague ? ` • Next: ${d.nextLeague}` : ""}`],
      ["Current Stage", `Stage ${d.stage} • City Level ${d.cityLevel}`],
      ["Stars", `${d.stars} total`],
      ["Games Played", String(d.gamesPlayed)],
      ["Best Score", `${d.bestScore.toLocaleString()} pts`],
      ["Average Score", `${d.averageScore.toLocaleString()} pts`],
      ["Streak", `${d.currentStreak} current • ${d.bestStreak} best`],
      ["Normal / Hard / Expert", `${d.normal} / ${d.hard} / ${d.expert}`],
      ["Performance", "Overall gameplay progress"],
    ] : [
      ["Result", `Level ${d.level} completed`],
      ["League", d.league],
      ["Difficulty", d.difficulty],
      ["Stars", `${d.stars} / 3`],
      ["City Stage", `Stage ${d.stage} • City Level ${d.cityLevel}`],
      ["Moves", d.moves != null ? String(d.moves) : "Not recorded"],
      ["Completed", d.completed],
      ["Performance", "Successful level completion"],
    ];
    let y = 520;
    for (const [label, value] of rows) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#7598aa";
      ctx.font = "700 20px Arial";
      ctx.fillText(label, 145, y);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 21px Arial";
      ctx.fillText(String(value), 755, y);
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(145, y + 18); ctx.lineTo(755, y + 18); ctx.stroke();
      y += 78;
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#69dcff";
    ctx.font = "800 19px Arial";
    ctx.fillText("Keep playing. Keep sorting.", 450, 1245);
    ctx.fillStyle = "#7897a6";
    ctx.font = "600 17px Arial";
    ctx.fillText("Real gameplay performance • Sortverse 3D", 450, 1280);

    return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create image")), "image/png"));
  }

  async function savePerformanceReceipt(record) {
    try {
      const blob = await buildReceiptImage(record);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.isOverall ? "sortverse-overall-performance.png" : `sortverse-performance-level-${record.level}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setShareMessage("Receipt image saved as PNG.");
    } catch {
      setShareMessage("Could not save the receipt image.");
    }
  }

  async function sharePerformanceReceipt(record) {
    try {
      const blob = await buildReceiptImage(record);
      const file = new File([blob], record.isOverall ? "sortverse-overall-performance.png" : `sortverse-performance-level-${record.level}.png`, { type: "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: record.isOverall ? "Sortverse 3D Overall Performance" : "Sortverse 3D Performance", text: record.isOverall ? `${data?.name || "Player"} is at Stage ${data?.city?.cityStage || 1} · City Level ${data?.city?.cityLevel || 1} in the ${league.name} League.` : `My Sortverse 3D performance — Level ${record.level}, ${Number(record.score || 0).toLocaleString()} points`, files: [file] });
        setShareMessage("Receipt image shared.");
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(receiptText(record));
        setShareMessage("Image sharing is not supported here; receipt details copied.");
      } else {
        setShareMessage("Image sharing is not supported in this browser.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setShareMessage("Could not share the receipt image.");
    }
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
                  <PreviewableAvatar name={data ? data.name : "You"} you size={46} avatar={data ? data.avatar : null} />
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

              {/* Personal performance */}
              <section className="mt-3 rounded-2xl border border-cyan-300/15 bg-[#04182a]/75 p-3">
                <div className="mb-2">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-white/55">My Performance</div>
                  <div className="mt-0.5 text-[10px] text-white/35">Your best runs, streaks and progress</div>
                </div>

                <button
                  type="button"
                  onClick={() => openPerformance({ id: "overall-performance", isOverall: true })}
                  className="mb-2.5 w-full rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 px-3 py-2.5 text-left transition hover:border-cyan-300/35 hover:bg-cyan-400/10"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={data?.name || "Player"} you size={34} avatar={data?.avatar || null} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate rounded-md bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-black text-cyan-100 ring-1 ring-cyan-300/20">{data?.name || "Player"}</span>
                        <span className="text-[9px] font-black" style={{ color: league.color }}>{league.name} League</span>
                      </div>
                      <div className="mt-1 text-[9px] font-bold text-white/55">{data?.name || "Player"} is at Stage {data?.city?.cityStage || 1} · City Level {data?.city?.cityLevel || 1} · Overall Performance</div>
                    </div>
                    <span className="shrink-0 text-[9px] font-black text-cyan-200">View</span>
                  </div>
                </button>

                <div className="flex rounded-xl border border-white/8 bg-[#031a2a]/80 p-0.5">
                  {TABS.map(([key, label]) => {
                    const Icon = key === "scores" ? TrophyGoldIcon : key === "streak" ? Flame : BarChart3;
                    return (
                      <button key={key} type="button" onClick={() => setPerformanceTab(key)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-black transition ${performanceTab === key ? "bg-white/10 text-white" : "text-white/45"}`}>
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </button>
                    );
                  })}
                </div>

                {performanceTab === "scores" && (
                  <div className="mt-2 space-y-1.5">
                    {data?.performance?.topScores?.length ? data.performance.topScores.map((r, index) => (
                      <button key={r.id || `${r.completedAt}-${index}`} type="button" onClick={() => openPerformance(r)} className="group w-full rounded-xl border border-white/8 bg-[#031a2a]/80 px-3 py-2.5 text-left transition hover:border-cyan-300/30 hover:bg-[#06243a] active:scale-[0.99]">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 w-6 text-center text-[10px] font-black text-yellow-300">#{index + 1}</span>
                          <Avatar name={data?.name || "Player"} you size={30} avatar={data?.avatar || null} />
                          <Gamepad2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate rounded-md bg-cyan-300/10 px-1.5 py-0.5 text-[11px] font-black text-cyan-100 ring-1 ring-cyan-300/20">{data?.name || "Player"}</span>
                              <span className="text-[9px] font-black text-white/45">Level {r.level}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] font-bold text-white/55">
                              <span>{String(r.difficulty || "normal").toUpperCase()}</span>
                              <span>Stage {r.stage || (Number(r.level || 1) <= 2 ? 1 : Number(r.level || 1) <= 4 ? 2 : Number(r.level || 1) <= 6 ? 3 : Number(r.level || 1) <= 8 ? 4 : Number(r.level || 1) <= 10 ? 5 : 6)} · City Lv {r.cityLevel || r.level}</span>
                              <span>{r.league || league.name} League</span>
                              <span>{r.stars} / 3 stars</span>
                              <span>{r.moves != null ? `${r.moves} moves` : "moves not recorded"}</span>
                            </div>
                            <div className="mt-0.5 text-[8px] font-semibold text-white/30">Completed {r.completedAt ? new Date(r.completedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Recorded"}</div>
                          </div>
                          <div className="shrink-0 text-right text-[12px] font-black text-yellow-200">{Number(r.score).toLocaleString()}<div className="text-[8px] uppercase text-white/30">points</div></div>
                        </div>
                      </button>
                    )) : (
                      <div className="rounded-xl border border-white/8 px-3 py-4 text-center text-[10px] text-white/35">Complete a level to create your first real score record.</div>
                    )}
                  </div>
                )}

                {performanceTab === "streak" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-orange-300/15 bg-orange-400/5 p-3"><Flame className="h-5 w-5 text-orange-300" /><div className="mt-1 text-2xl font-black">{data?.performance?.currentStreak ?? 0}</div><div className="text-[9px] font-bold uppercase text-white/35">Current streak</div></div>
                    <div className="rounded-xl border border-yellow-300/15 bg-yellow-400/5 p-3"><TrophyGoldIcon className="h-5 w-5" /><div className="mt-1 text-2xl font-black">{data?.performance?.bestStreak ?? 0}</div><div className="text-[9px] font-bold uppercase text-white/35">Best streak</div></div>
                  </div>
                )}

                {performanceTab === "stats" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      [Gamepad2, "Games played", data?.performance?.gamesPlayed ?? 0],
                      [TrophyGoldIcon, "Best score", data?.performance?.bestScore ?? 0],
                      [BarChart3, "Average score", data?.performance?.averageScore ?? 0],
                      [Flame, "Best streak", data?.performance?.bestStreak ?? 0],
                    ].map(([Icon, label, value]) => (
                      <div key={label} className="rounded-xl border border-white/8 bg-[#031a2a]/80 p-2.5"><Icon className="h-4 w-4 text-cyan-300" /><div className="mt-1 text-xl font-black">{Number(value).toLocaleString()}</div><div className="text-[9px] font-bold uppercase text-white/35">{label}</div></div>
                    ))}
                  </div>
                )}
              </section>
            </section>

            {selectedPerformance && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-3 pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-4">
                <div className="w-full max-w-[390px] max-h-[calc(100dvh-24px)] overflow-y-auto overscroll-contain rounded-[26px] border border-cyan-300/25 bg-[#061b2b] shadow-[0_20px_70px_rgba(0,0,0,.65)] sm:max-h-[calc(100dvh-32px)]">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#061b2b]/95 px-4 py-3 backdrop-blur-md">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">{selectedPerformance.isOverall ? "Overall Performance" : "Performance Receipt"}</div>
                      <div className="mt-0.5 text-[10px] text-white/40">{selectedPerformance.isOverall ? "Your complete gameplay progress" : "Your real gameplay result"}</div>
                    </div>
                    <button type="button" onClick={() => { setSelectedPerformance(null); setShareMessage(""); }} className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Close performance view" title="Back to Ranking"><X className="h-5 w-5" /></button>
                  </div>

                  <div className="p-4">
                    <div className="rounded-2xl border border-cyan-300/15 bg-[#08263b] p-4">
                      <div className="text-center text-lg font-black tracking-wide">SORTVERSE 3D</div>
                      <div className="mt-0.5 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">{selectedPerformance.isOverall ? "Overall Performance Receipt" : "Performance Receipt"}</div>
                      <div className="my-4 h-px bg-white/10" />

                      <div className="flex items-center gap-2">
                        <div ref={avatarReceiptRef}><Avatar name={data?.name || "Player"} you size={40} avatar={data?.avatar || null} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[12px] font-black"><UserRound className="h-3.5 w-3.5 text-cyan-300" /> {data?.name || "Player"}</div>
                          <div className="mt-0.5 text-[9px] text-white/40">{selectedPerformance.isOverall ? `Stage ${receiptDetails(selectedPerformance).stage} · City Level ${receiptDetails(selectedPerformance).cityLevel}` : `Level ${selectedPerformance.level} · ${String(selectedPerformance.difficulty || "normal").toUpperCase()}`}</div>
                        </div>
                      </div>

                      <div className="my-4 text-center">
                        <div className="text-3xl font-black text-yellow-300">{Number(selectedPerformance.score || 0).toLocaleString()}</div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Points</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">League</div><div className="mt-1 text-sm font-black" style={{ color: receiptDetails(selectedPerformance).league === league.name ? league.color : undefined }}>{receiptDetails(selectedPerformance).league} League</div></div>
                        <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">{selectedPerformance.isOverall ? "Current Status" : "Difficulty"}</div><div className="mt-1 text-sm font-black">{selectedPerformance.isOverall ? `${receiptDetails(selectedPerformance).player} is at Stage ${receiptDetails(selectedPerformance).stage}` : String(selectedPerformance.difficulty || "normal").toUpperCase()}</div></div>
                        <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">City Progress</div><div className="mt-1 text-sm font-black text-cyan-200">Stage {receiptDetails(selectedPerformance).stage} · City Level {receiptDetails(selectedPerformance).cityLevel}</div></div>
                        <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">Stars</div><div className="mt-1 text-sm font-black">⭐ {receiptDetails(selectedPerformance).stars}{selectedPerformance.isOverall ? " total" : " / 3"}</div></div>
                        {selectedPerformance.isOverall ? (
                          <>
                            <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">Games Played</div><div className="mt-1 text-sm font-black">{receiptDetails(selectedPerformance).gamesPlayed}</div></div>
                            <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">Best Score</div><div className="mt-1 text-sm font-black">{receiptDetails(selectedPerformance).bestScore.toLocaleString()}</div></div>
                            <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">Average</div><div className="mt-1 text-sm font-black">{receiptDetails(selectedPerformance).averageScore.toLocaleString()}</div></div>
                            <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">Streak</div><div className="mt-1 text-sm font-black">{receiptDetails(selectedPerformance).currentStreak} / {receiptDetails(selectedPerformance).bestStreak}</div></div>
                          </>
                        ) : (
                          <div className="rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="text-[9px] uppercase text-white/35">Moves</div><div className="mt-1 text-sm font-black">{selectedPerformance.moves ?? "Not recorded"}</div></div>
                        )}
                        <div className="col-span-2 rounded-xl border border-white/8 bg-[#031a2a]/70 p-2.5"><div className="flex items-center gap-1.5 text-[9px] uppercase text-white/35"><CalendarDays className="h-3 w-3" /> {selectedPerformance.isOverall ? "Modes" : "Completed"}</div><div className="mt-1 text-[11px] font-bold">{selectedPerformance.isOverall ? `Normal ${receiptDetails(selectedPerformance).normal} · Hard ${receiptDetails(selectedPerformance).hard} · Expert ${receiptDetails(selectedPerformance).expert}` : formatPerformanceDate(selectedPerformance.completedAt)}</div></div>
                        <div className="col-span-2 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-2.5"><div className="text-[9px] uppercase text-cyan-200/45">Performance summary</div><div className="mt-1 text-[10px] font-bold leading-relaxed text-white/70">{selectedPerformance.isOverall ? `${receiptDetails(selectedPerformance).player} is at Stage ${receiptDetails(selectedPerformance).stage} · City Level ${receiptDetails(selectedPerformance).cityLevel}, in the ${receiptDetails(selectedPerformance).league} League, with ${receiptDetails(selectedPerformance).gamesPlayed} gameplay performances, ${receiptDetails(selectedPerformance).stars} total stars, a best score of ${receiptDetails(selectedPerformance).bestScore.toLocaleString()} points, and a ${receiptDetails(selectedPerformance).currentStreak}-day current streak.` : `${receiptDetails(selectedPerformance).player} completed Level ${selectedPerformance.level} in Stage ${receiptDetails(selectedPerformance).stage} (${String(selectedPerformance.difficulty || "normal").toUpperCase()}) with ${selectedPerformance.stars ?? 0} stars, ${selectedPerformance.moves ?? "unrecorded"} moves, and a score of ${Number(selectedPerformance.score || 0).toLocaleString()} points.`}</div></div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => savePerformanceReceipt(selectedPerformance)} className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2.5 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-400/15"><Download className="h-4 w-4" /> {selectedPerformance.isOverall ? "Save Overall Receipt" : "Save Image"}</button>
                      <button type="button" onClick={() => sharePerformanceReceipt(selectedPerformance)} className="flex items-center justify-center gap-2 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2.5 text-[10px] font-black text-yellow-100 transition hover:bg-yellow-400/15"><Share2 className="h-4 w-4" /> {selectedPerformance.isOverall ? "Share Overall Receipt" : "Share"}</button>
                    </div>
                    {shareMessage && <div className="mt-2 text-center text-[9px] font-bold text-white/45">{shareMessage}</div>}
                  </div>
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
