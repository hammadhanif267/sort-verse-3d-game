"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, LockKeyhole, Sparkles } from "lucide-react";
import ExperienceFrame from "@/components/ExperienceFrame";
import { SPECIAL_MISSIONS, readRecord } from "@/lib/playerExperience";
import { canEnterDifficulty } from "@/lib/levelMissions";
export default function SpecialPage() {
  const [progress, setProgress] = useState({ normal: 0, hard: 0, expert: 0 });
  const [claimed, setClaimed] = useState({});
  useEffect(() => {
    const sync = () => { setProgress({normal:0,hard:0,expert:0,...readRecord("difficulty-progress")}); setClaimed(readRecord("special-claimed-v1")); };
    const id = requestAnimationFrame(sync);
    window.addEventListener("sortverse-progress", sync);
    return () => { cancelAnimationFrame(id); window.removeEventListener("sortverse-progress", sync); };
  }, []);
  return <ExperienceFrame title="Special Missions" subtitle="Optional skill challenges. Each prize can be earned once; Casual Mode does not qualify." back="/journey">
    <div className="space-y-3 pb-8">{SPECIAL_MISSIONS.map(mission => {
      const unlocked = canEnterDifficulty(mission.difficulty, progress) && (Number(progress[mission.difficulty]) || 0) >= mission.level - 1;
      const done = Boolean(claimed[mission.id]);
      return <article key={mission.id} className="rounded-2xl border border-violet-300/25 bg-[#10243f] p-4">
        <div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300/15 text-2xl text-amber-200">{mission.symbol}</span><div className="min-w-0"><h2 className="text-base font-black">{mission.name}</h2><p className="mt-1 text-xs leading-5 text-white/65">{mission.description}</p><p className="mt-2 text-[11px] text-violet-200">{mission.difficulty.toUpperCase()} Level {mission.level} · {mission.coins} coins + {mission.diamonds} diamonds</p></div></div>
        {done ? <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-300"><CheckCircle size={17}/> Reward earned</p> : unlocked ? <Link className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#c174ff] to-[#723ad3] text-sm font-black" href={`/gameplay?level=${mission.level}&difficulty=${mission.difficulty}&special=${mission.id}`}><Sparkles size={16}/> Start Challenge</Link> : <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-white/45"><LockKeyhole size={14}/> Unlock this campaign level first</p>}
      </article>;
    })}</div>
  </ExperienceFrame>;
}
