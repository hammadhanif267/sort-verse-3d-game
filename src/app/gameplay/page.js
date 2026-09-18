"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameplayScene from "../../components/game/GameplayScene";

function GameplayContent() {
  const searchParams = useSearchParams();
  const levelParam = Number(searchParams.get("level"));
  const level = Number.isFinite(levelParam) && levelParam > 0 ? levelParam : 1;
  const difficultyParam = searchParams.get("difficulty");
  const difficulty = ["normal", "hard", "expert"].includes(difficultyParam) ? difficultyParam : "normal";

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      {/* Desktop background */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[110px]" />

        {/* Phone */}
        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_50px_rgba(0,180,255,0.16)]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020b15]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80"
              style={{ backgroundImage: "url('/gameplay-factory.webp')" }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(1,11,22,.25)_0%,rgba(2,11,21,.08)_42%,rgba(2,11,21,.55)_100%)]" />
            {/* Top HUD */}
            <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
              {/* Pause */}
              <Link
                href="/"
                aria-label="Pause and return"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/30 bg-[#06243a]/90 text-lg font-black text-white shadow-[0_0_18px_rgba(0,190,255,0.15)] backdrop-blur-md"
              >
                ❚❚
              </Link>

              {/* Level */}
              <div className="text-center drop-shadow-lg">
                <div className="text-xl font-black tracking-tight">Level {level}</div>

                <div className="mt-0.5 text-[10px] font-medium text-cyan-100/75">
                  Sort the objects
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-[#06243a]/90 px-3 py-2 text-xs font-bold shadow-[0_0_18px_rgba(0,190,255,0.14)] backdrop-blur-md">
                <span className="text-cyan-300">◷</span>
                <span>02:35</span>
              </div>
            </header>

            {/* 3D Game */}
            <section className="relative z-10 min-h-0 flex-1">
              <GameplayScene key={`${difficulty}-${level}`} level={level} difficulty={difficulty} />
            </section>

            {/* Bottom instruction */}
            <div className="absolute bottom-4 left-1/2 z-30 w-[78%] -translate-x-1/2">
              <div className="rounded-2xl border border-cyan-300/25 bg-[#06243a]/90 px-4 py-3 text-center shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-2xl font-light text-cyan-200/65">
                    ←
                  </span>

                  <div>
                    <div className="text-sm font-black">Drag &amp; Drop</div>

                    <div className="mt-0.5 text-[9px] font-medium text-white/60">
                      to sort the objects
                    </div>
                  </div>

                  <span className="text-2xl font-light text-cyan-200/65">
                    →
                  </span>
                </div>
              </div>
            </div>
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
