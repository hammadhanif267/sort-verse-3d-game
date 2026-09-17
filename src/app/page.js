"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayerStats } from "@/lib/playerStats";
import BottomNav from "@/components/BottomNav";
import { CalendarIcon, CityIcon, LevelsIcon } from "@/components/icons";
import { Gem } from "lucide-react";

export default function HomePage() {
  const { level, coins, diamonds } = usePlayerStats();

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      {/* Desktop background */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,rgba(0,128,190,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-[20%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />

        {/* Phone */}
        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">
          {/* Phone inner background */}
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#020d18]">
            {/* Full-page city background image */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/home-city-background.webp"
                alt="Sortverse floating city"
                fill
                priority
                sizes="430px"
                className="object-cover object-center"
              />

              {/* Legibility overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#020912]/88 via-[#03111e]/25 to-[#020912]/90" />
            </div>

            {/* Foreground content */}
            <div className="relative z-10 flex h-full min-h-0 flex-col">
              {/* Top HUD */}
              <header className="flex shrink-0 items-center justify-between px-4 pt-4">
                {/* Player */}
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/60 bg-[#07344b] text-lg shadow-[0_0_15px_rgba(0,200,255,0.12)]">
                    <span className="text-base">👤</span>
                  </div>

                  <div className="leading-tight">
                    <div className="text-[9px] font-medium text-cyan-100/55">
                      Player
                    </div>

                    <div className="text-sm font-bold text-white">
                      Level {level}
                    </div>
                  </div>
                </div>

                {/* Currency */}
                <div className="flex items-center gap-2">
                  {/* Premium Gold Coins */}
                  <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-[#06243a]/95 px-3 py-1.5 text-xs font-bold shadow-[0_0_12px_rgba(255,190,0,0.08)]">
                    <PremiumCoinIcon />

                    <span className="text-yellow-50">
                      {coins.toLocaleString()}
                    </span>
                  </div>

                  {/* Diamonds */}
                  <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#06243a]/95 px-3 py-1.5 text-xs font-bold shadow-[0_0_12px_rgba(0,210,255,0.08)]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(0,210,255,0.3)]">
                      <Gem
                        className="h-3.5 w-3.5 text-white"
                        strokeWidth={2.5}
                      />
                    </span>

                    <span className="text-cyan-50">{diamonds}</span>
                  </div>
                </div>
              </header>

              {/* Logo area */}
              <section className="shrink-0 px-5 pt-4 text-center">
                <h1 className="text-[38px] font-black leading-none tracking-[-1.5px] text-[#d9f5ff] drop-shadow-[0_0_12px_rgba(92,220,255,0.55)]">
                  SORTVERSE
                </h1>

                <div className="mt-1.5 flex items-center justify-center gap-3">
                  <span className="h-[2px] w-11 bg-gradient-to-r from-transparent to-cyan-400" />

                  <span className="text-[24px] font-black italic text-[#ffc400] drop-shadow-[0_0_8px_rgba(255,190,0,0.35)]">
                    3D
                  </span>

                  <span className="h-[2px] w-11 bg-gradient-to-l from-transparent to-cyan-400" />
                </div>

                <p className="mt-1.5 text-[9px] font-bold tracking-[0.18em] text-cyan-200/65">
                  SORT · ORGANIZE · BUILD YOUR CITY
                </p>
              </section>

              {/* Spacer */}
              <div className="min-h-0 flex-1" />

              {/* Main menu */}
              <section className="shrink-0 space-y-2 px-4 pb-2">
                {/* Play */}
                <Link
                  href="/gameplay"
                  prefetch
                  className="flex h-[50px] w-full items-center justify-center rounded-xl border border-yellow-300/70 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] shadow-[0_4px_14px_rgba(255,160,0,0.18)] transition hover:brightness-110 active:scale-[0.99]"
                >
                  <span className="text-base font-black tracking-wide text-[#181000]">
                    Play
                  </span>
                </Link>

                {/* Level Selection */}
                <MenuButton
                  icon={LevelsIcon}
                  title="Level Selection"
                  href="/levels"
                  blue
                />

                {/* Daily Challenge */}
                <MenuButton
                  icon={CalendarIcon}
                  title="Daily Challenge"
                  notification="1"
                  disabled
                  blue
                />

                {/* Build Your City */}
                <MenuButton
                  icon={CityIcon}
                  title="Build Your City"
                  disabled
                  purple
                />
              </section>

              {/* Bottom navigation */}
              <BottomNav active="home" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Premium Gold Coin Icon ---------------- */

function PremiumCoinIcon() {
  return (
    <span
      className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff7bd] via-[#ffd43b] to-[#d58a00] shadow-[0_0_10px_rgba(255,190,0,0.42)] ring-1 ring-yellow-200/60"
      aria-hidden="true"
    >
      {/* Outer coin rim */}
      <span className="absolute inset-[2px] rounded-full border-[1.5px] border-[#a76500]/70" />

      {/* Inner embossed rim */}
      <span className="absolute inset-[4px] rounded-full border border-[#fff0a0]/70" />

      {/* Coin shine */}
      <span className="absolute left-[4px] top-[3px] h-[4px] w-[2px] rotate-[35deg] rounded-full bg-white/75" />

      {/* Currency mark */}
      <span className="relative z-10 -translate-y-[0.5px] text-[9px] font-black leading-none text-[#704000] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">
        $
      </span>
    </span>
  );
}

/* ---------------- Menu Button ---------------- */

function MenuButton({
  icon: Icon,
  title,
  blue = false,
  purple = false,
  notification,
  href,
  disabled = false,
}) {
  const className = `flex h-[47px] w-full items-center rounded-xl border px-3 text-left transition active:scale-[0.99] ${
    disabled ? "cursor-not-allowed opacity-65" : ""
  } ${
    purple
      ? "border-purple-300/60 bg-gradient-to-r from-[#8b22e8] to-[#c000d9] shadow-[0_4px_16px_rgba(190,0,255,0.16)]"
      : blue
        ? "border-cyan-400/20 bg-[#062438] shadow-[inset_0_0_15px_rgba(0,150,220,0.05)] hover:bg-[#073149]"
        : "border-white/10 bg-white/5"
  }`;

  const content = (
    <>
      <span
        className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          purple
            ? "bg-white/15 text-yellow-300"
            : "bg-cyan-500/10 text-cyan-300"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <span
        className={`min-w-0 flex-1 text-xs font-bold ${
          purple ? "text-white" : "text-white/90"
        }`}
      >
        {title}
      </span>

      {notification && (
        <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">
          {notification}
        </span>
      )}

      <span className={`text-lg ${purple ? "text-white" : "text-cyan-300"}`}>
        ›
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      className={className}
    >
      {content}
    </button>
  );
}
