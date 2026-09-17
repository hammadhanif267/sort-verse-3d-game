"use client";

import Link from "next/link";
import { GridIcon, HomeIcon, TrophyIcon, UserIcon } from "@/components/icons";

const TABS = [
  { key: "home", label: "Home", href: "/", icon: HomeIcon },
  { key: "levels", label: "Levels", href: "/levels", icon: GridIcon },
  { key: "ranking", label: "Ranking", href: null, icon: TrophyIcon },
  { key: "profile", label: "Profile", href: null, icon: UserIcon },
];

/**
 * Shared bottom navigation bar.
 * Pass `active` ("home" | "levels" | "ranking" | "profile") so every
 * page highlights the correct tab with the same professional icon set.
 */
export default function BottomNav({ active }) {
  return (
    <nav className="shrink-0 border-t border-cyan-300/10 bg-[#031421]/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="grid grid-cols-4">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          const Icon = tab.icon;
          const className = `flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[9px] font-semibold transition ${
            isActive
              ? "text-[#ffb020]"
              : tab.href
                ? "text-white/45 hover:text-white/70"
                : "cursor-not-allowed text-white/25"
          }`;
          const content = (
            <>
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              <span>{tab.label}</span>
            </>
          );

          if (tab.href) {
            return (
              <Link key={tab.key} href={tab.href} prefetch className={className}>
                {content}
              </Link>
            );
          }

          return (
            <button key={tab.key} type="button" disabled aria-disabled="true" className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
