"use client";
import Link from "@/components/ReliableLink";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import useBackgroundMusic from "@/lib/useBackgroundMusic";
export default function ExperienceFrame({ title, subtitle, back = "/", children }) {
  useBackgroundMusic("menu");
  return <main className="sv-screen h-dvh w-full overflow-hidden bg-[#020912] text-white">
    <div className="sv-stage flex h-full justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(15,145,205,.17),transparent_55%)]">
      <div className="sv-frame sv-phone flex h-full w-full max-w-[430px] min-h-0 flex-col overflow-hidden bg-[#031424] sm:rounded-3xl sm:border sm:border-cyan-500/30">
        <header className="relative z-10 shrink-0 border-b border-cyan-300/15 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
          <Link href={back} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-cyan-200"><ChevronLeft size={18}/>Back</Link>
          <h1 className="text-[24px] font-black leading-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-[12px] leading-5 text-white/65">{subtitle}</p>}
        </header>
        <section className="game-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</section>
        <BottomNav />
      </div>
    </div>
  </main>;
}
