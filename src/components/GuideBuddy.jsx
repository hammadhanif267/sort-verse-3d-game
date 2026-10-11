"use client";
import Image from "next/image";
export default function GuideBuddy({ message, compact = false, onDismiss }) {
  return <div className={`flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-[#082941]/90 text-cyan-50 ${compact ? "px-2 py-1" : "px-3 py-2"}`} role="note">
    <Image src="/illustrations/guide-bot.svg" alt="SortVerse guide robot" width={compact ? 35 : 52} height={compact ? 35 : 52} className="shrink-0" unoptimized />
    <p className="min-w-0 flex-1 text-[11px] leading-4"><strong className="mr-1 text-cyan-200">Pip:</strong>{message}</p>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Hide guide" className="min-h-9 min-w-9 rounded-lg border border-white/20 text-sm">×</button>}
  </div>;
}
