"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayerStats } from "@/lib/playerStats";
import { usePlayerProfile } from "@/lib/ranking";
import { PreviewableAvatar } from "@/components/AvatarPreview";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
import BottomNav from "@/components/BottomNav";
import { CalendarIcon, CityGoldIcon, HomeCoinIcon, HomeGemIcon, LevelsIcon } from "@/components/icons";
import { ChevronRight } from "lucide-react";

export default function HomePage() {
  const { level, coins, diamonds } = usePlayerStats();
  const profile = usePlayerProfile();

  // One continuous, professional menu theme. It keeps playing the whole time
  // the player is on a menu screen and is not restarted when moving between
  // the home page and the other menu pages.
  useBackgroundMusic("menu");

  // Play button always resumes progress instead of always restarting from
  // Level 1: a brand-new player (level 0) starts at Level 1, and a returning
  // player is sent straight to the next level after the last one they cleared.
  const nextLevel = level + 1;
  const isReturningPlayer = level > 0;
  const playLabel = isReturningPlayer ? "Continue" : "Play";

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
                {/* Player: tap the picture for a full preview, tap the name to open the profile */}
                <div className="flex items-center gap-2.5">
                  <PreviewableAvatar name={profile.name} you size={40} avatar={profile.avatar} fallbackHref="/profile" />

                  <Link href="/profile" prefetch className="leading-tight">
                    <div className="max-w-[110px] truncate text-[11px] font-bold text-cyan-100/70">
                      {profile.name === "You" ? "Player" : profile.name}
                    </div>

                    <div className="text-sm font-bold text-white">
                      Level {level}
                    </div>
                  </Link>
                </div>

                {/* Currency */}
                <div className="flex items-center gap-2">
                  {/* Premium Gold Coins */}
                  <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-[#06243a]/95 px-3 py-1.5 text-xs font-bold shadow-[0_0_12px_rgba(255,190,0,0.08)]">
<HomeCoinIcon className="h-5 w-5" />

                    <span className="text-yellow-50">
                      {coins.toLocaleString()}
                    </span>
                  </div>

                  {/* Diamonds */}
                  <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-[#06243a]/95 px-3 py-1.5 text-xs font-bold shadow-[0_0_12px_rgba(0,210,255,0.08)]">
<HomeGemIcon className="h-5 w-5" />

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
              <section className="shrink-0 space-y-2 px-7 pb-2">
                {/* Play / Continue — always resumes from the next uncleared level */}
                <Link
                  href={`/gameplay?level=${nextLevel}`}
                  prefetch
                  className="group mx-auto flex h-[44px] w-[94%] items-center justify-center rounded-full border border-yellow-300/70 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] shadow-[0_4px_14px_rgba(255,160,0,0.18)] transition duration-200 hover:border-yellow-200 hover:bg-gradient-to-b hover:from-[#ffe45a] hover:to-[#ffb300] hover:shadow-[0_0_18px_rgba(255,195,0,0.35)] hover:brightness-110 active:scale-[0.99]"
                >
                  <span className="text-base font-black tracking-wide text-[#181000] transition-colors duration-200 group-hover:text-[#5c3900]">
                    {playLabel}
                  </span>

                  {isReturningPlayer && (
                    <span className="ml-2 text-[11px] font-bold text-[#5c3900]/80 transition-colors duration-200 group-hover:text-[#5c3900]">
                      · Level {nextLevel}
                    </span>
                  )}
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
                  href="/daily"
                  blue
                />

                {/* Build Your City */}
                <MenuButton title="Build Your City" href="/city" purple />
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
  const className = `group mx-auto flex h-[42px] w-[94%] items-center rounded-full border px-3 text-left transition duration-200 active:scale-[0.99] ${
    disabled ? "cursor-not-allowed opacity-65" : ""
  } ${
    purple
      ? "border-purple-300/60 bg-gradient-to-r from-[#8b22e8] to-[#c000d9] shadow-[0_4px_16px_rgba(190,0,255,0.16)] hover:border-yellow-300/70 hover:bg-gradient-to-r hover:from-[#a53cf0] hover:to-[#d20ce5] hover:shadow-[0_0_18px_rgba(255,195,0,0.25)]"
      : blue
        ? "border-cyan-400/20 bg-[#062438] shadow-[inset_0_0_15px_rgba(0,150,220,0.05)] hover:border-yellow-300/50 hover:bg-gradient-to-r hover:from-[#17445a] hover:to-[#493e18] hover:shadow-[0_0_16px_rgba(255,195,0,0.22)]"
        : "border-white/10 bg-white/5 hover:border-yellow-300/50 hover:bg-yellow-400/10 hover:shadow-[0_0_16px_rgba(255,195,0,0.22)]"
  }`;

  const content = (
    <>
      <span
        className={`mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          purple ? "" : "bg-[#0c3a58]/70 ring-1 ring-cyan-300/15"
        }`}
      >
        {purple ? (
          <CityGoldIcon className="h-7 w-7 drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </span>

      <span
        className={`min-w-0 flex-1 text-xs font-bold transition-colors duration-200 ${
          purple
            ? "text-white group-hover:text-yellow-100"
            : "text-white/90 group-hover:text-yellow-300"
        }`}
      >
        {title}
      </span>

      {notification && (
        <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">
          {notification}
        </span>
      )}

      <ChevronRight className={`h-4 w-4 transition-colors duration-200 ${purple ? "text-white group-hover:text-yellow-300" : "text-cyan-300 group-hover:text-yellow-300"}`} strokeWidth={2.4} />
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
