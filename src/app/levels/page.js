"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const levels = [
  { id: 1, stars: 3, color: "blue" },
  { id: 2, stars: 2, color: "blue" },
  { id: 3, stars: 2, color: "blue" },
  { id: 4, stars: 2, color: "blue" },
  { id: 5, stars: 3, color: "cyan", selected: true },
  { id: 6, locked: true },
  { id: 7, stars: 1, color: "blue" },
  { id: 8, locked: true },
  { id: 9, locked: true },
  { id: 10, locked: true },
  { id: 11, locked: true },
  { id: 12, locked: true },
];

export default function LevelsPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      {/* Desktop background */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-[25%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />

        {/* Phone */}
        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020d18]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/gameplay-factory.webp')" }} />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,31,49,.48),rgba(2,13,24,.88))]" />
            {/* Header */}
            <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-white/80 transition hover:text-white"
              >
                <span className="text-xl leading-none">‹</span>

                <span className="text-sm font-bold">Level Selection</span>
              </Link>

              {/* Currency */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/35 bg-[#06243a] px-2.5 py-1.5 text-[10px] font-bold">
                  <span className="text-yellow-300">●</span>
                  <span>1250</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-[#06243a] px-2.5 py-1.5 text-[10px] font-bold">
                  <span>💎</span>
                  <span>32</span>
                </div>
              </div>
            </header>

            {/* Difficulty */}
            <section className="relative z-10 shrink-0 px-4 pt-3">
              <div className="grid grid-cols-3 overflow-hidden rounded-full border border-cyan-400/20 bg-[#041a2b] p-1">
                <button className="rounded-full bg-gradient-to-b from-[#38cfff] to-[#0879cf] py-2 text-[10px] font-black shadow-[0_0_15px_rgba(0,180,255,0.25)]">
                  Normal
                </button>

                <button className="flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-white/55">
                  <span className="text-[9px]">🔒</span>
                  Hard
                </button>

                <button className="flex items-center justify-center gap-1 py-2 text-[10px] font-medium text-white/55">
                  <span className="text-[9px]">🔒</span>
                  Expert
                </button>
              </div>
            </section>

            {/* Level grid */}
            <section className="relative z-10 min-h-0 flex-1 overflow-hidden px-4 py-3">
              <div className="grid h-full min-h-0 grid-cols-3 grid-rows-4 gap-3">
                {levels.map((level) => (
                  <LevelCard key={level.id} level={level} />
                ))}
              </div>
            </section>

            {/* Bottom navigation */}
            <BottomNav active="levels" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Level Card ---------------- */

function LevelCard({ level }) {
  if (level.locked) {
    return (
      <div className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-300/15 bg-[#062238]/75 opacity-60">
        <div className="absolute inset-1 rounded-lg bg-cover bg-center grayscale" style={{ backgroundImage: "linear-gradient(rgba(2,15,28,.55),rgba(2,15,28,.9)),url('/gameplay-factory.webp')" }} />
        <div className="absolute bottom-[34%] left-[16%] right-[16%] flex h-[40%] items-end justify-center gap-1 opacity-50">
          {["#8039bc", "#b06e24", "#236d95"].map((color) => <span key={color} className="relative h-full w-1/5 rounded-b border-x border-b border-cyan-100/30 bg-white/10"><i className="absolute -left-0.5 -right-0.5 -top-0.5 h-1 rounded-full" style={{ backgroundColor: color }} /></span>)}
        </div>

        <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/45 text-sm shadow-lg">
          🔒
        </div>

        <span className="relative z-10 mt-2 text-xs font-bold text-white/55">
          {level.id}
        </span>
      </div>
    );
  }

  return (
    <Link
      href="/gameplay"
      prefetch
      aria-label={`Play level ${level.id}`}
      className={`group relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border transition active:scale-[0.97] ${
        level.selected
          ? "border-cyan-300 bg-[#073553] shadow-[0_0_22px_rgba(0,190,255,0.42),inset_0_0_18px_rgba(0,180,255,0.12)]"
          : "border-cyan-300/20 bg-[#062238] shadow-[inset_0_0_12px_rgba(0,160,230,0.04)] hover:border-cyan-300/45 hover:bg-[#07304b]"
      }`}
    >
      {/* Selected glow */}
      {level.selected && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(30,210,255,0.18),transparent_60%)]" />
      )}

      {/* Mini level artwork */}
      <div className="relative mb-1 flex h-[58%] w-[82%] items-end justify-center gap-1.5 overflow-hidden rounded-lg border border-cyan-300/20 bg-cover bg-center pb-2 shadow-[inset_0_0_16px_rgba(0,0,0,.75)]" style={{ backgroundImage: "linear-gradient(rgba(2,16,29,.42),rgba(2,16,29,.78)),url('/gameplay-factory.webp')" }}>
        <span className="absolute inset-x-1 bottom-0 h-[38%] rounded-t-md bg-gradient-to-b from-slate-400/65 via-slate-700/85 to-slate-900" />
        {["#8f42ff", "#20bfff", "#ff8f23"].map((color, index) => (
          <span key={color} className="relative z-10 h-[72%] w-[21%] rounded-b-md border-x border-b border-cyan-100/55 bg-gradient-to-r from-white/25 via-transparent to-white/15 shadow-[0_0_8px_rgba(32,200,255,.2)]">
            <i className="absolute -left-0.5 -right-0.5 -top-1 h-1.5 rounded-full border border-white/45" style={{ backgroundColor: color }} />
            <i className="absolute bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-sm shadow-[0_0_7px_currentColor]" style={{ backgroundColor: color, color }} />
            <i className="absolute bottom-4 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full shadow-[0_0_7px_currentColor]" style={{ backgroundColor: index === 1 ? "#ffcf2d" : color, color }} />
          </span>
        ))}
        <span className="absolute inset-x-2 bottom-1 z-20 h-1.5 rounded-full bg-gradient-to-b from-slate-300 to-slate-700" />
      </div>

      {/* Level */}
      <span className="relative text-sm font-black">{level.id}</span>

      {/* Stars */}
      <div className="relative mt-1 flex gap-0.5 text-[11px]">
        {[1, 2, 3].map((star) => (
          <span
            key={star}
            className={
              star <= level.stars
                ? "text-yellow-300 drop-shadow-[0_0_4px_rgba(255,210,40,0.5)]"
                : "text-white/25"
            }
          >
            ★
          </span>
        ))}
      </div>
    </Link>
  );
}
