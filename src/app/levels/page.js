"use client";

import Link from "next/link";

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
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_15%,rgba(0,147,205,0.2),transparent_34%),linear-gradient(180deg,#042b42_0%,#031b2a_48%,#020d18_100%)]">
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-cyan-300/10 px-4 pb-3 pt-4">
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
            <section className="shrink-0 px-4 pt-3">
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
            <section className="min-h-0 flex-1 overflow-hidden px-4 py-3">
              <div className="grid h-full min-h-0 grid-cols-3 grid-rows-4 gap-3">
                {levels.map((level) => (
                  <LevelCard key={level.id} level={level} />
                ))}
              </div>
            </section>

            {/* Bottom navigation */}
            <nav className="shrink-0 border-t border-cyan-300/10 bg-[#031421]/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
              <div className="grid grid-cols-4">
                <Link
                  href="/"
                  className="flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[8px] font-semibold text-white/40"
                >
                  <span className="text-base leading-none">⌂</span>
                  <span>Home</span>
                </Link>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-cyan-400/10 py-1 text-[8px] font-semibold text-cyan-300">
                  <span className="text-base leading-none">▦</span>
                  <span>Levels</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[8px] font-semibold text-white/40">
                  <span className="text-base leading-none">♛</span>
                  <span>Ranking</span>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[8px] font-semibold text-white/40">
                  <span className="text-base leading-none">●</span>
                  <span>Profile</span>
                </div>
              </div>
            </nav>
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
      <div className="relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-300/15 bg-[#062238]/70 opacity-55">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/[0.03] to-transparent" />

        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/15 text-sm">
          🔒
        </div>

        <span className="relative mt-2 text-xs font-bold text-white/45">
          {level.id}
        </span>
      </div>
    );
  }

  return (
    <button
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
      <div className="relative mb-1 flex h-[55%] w-[68%] items-end justify-center gap-1">
        <div className="h-[55%] w-[24%] rounded-t bg-[#23617e] shadow-[0_0_8px_rgba(0,190,255,0.15)]" />

        <div className="h-[82%] w-[27%] rounded-t bg-gradient-to-b from-[#238fb3] to-[#104764] shadow-[0_0_9px_rgba(0,200,255,0.18)]">
          <div className="mt-2 space-y-1 px-1">
            <div className="h-0.5 rounded-full bg-cyan-200/50" />
            <div className="h-0.5 rounded-full bg-cyan-200/30" />
          </div>
        </div>

        <div className="h-[65%] w-[24%] rounded-t bg-[#1a536f]" />
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
    </button>
  );
}
