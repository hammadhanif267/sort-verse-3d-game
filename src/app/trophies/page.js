"use client";
import { useEffect, useState } from "react";
import { Award, CheckCircle, Coins } from "lucide-react";
import ExperienceFrame from "@/components/ExperienceFrame";
import { TROPHIES, trophyProgress, readRecord, claimTrophy } from "@/lib/playerExperience";
export default function TrophiesPage() {
  const [progress, setProgress] = useState({});
  const [claimed, setClaimed] = useState({});
  function refresh() { setProgress(trophyProgress()); setClaimed(readRecord("trophy-claims-v1")); }
  useEffect(() => {
    const id = requestAnimationFrame(refresh);
    window.addEventListener("sortverse-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => { cancelAnimationFrame(id); window.removeEventListener("sortverse-progress", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  return <ExperienceFrame title="Trophy Book" subtitle="Real milestones from your offline progress. Claim each coin prize once." back="/profile">
    <div className="space-y-3 pb-6">{TROPHIES.map(trophy => {
      const amount = Math.min(trophy.target, Number(progress[trophy.kind]) || 0);
      const done = Boolean(claimed[trophy.id]);
      return <article key={trophy.id} className="flex gap-3 rounded-2xl border border-yellow-300/20 bg-[#0c2941] p-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${done ? "border-yellow-300/70 bg-yellow-500/20" : "border-white/10 bg-white/5"}`}><Award size={30} className={done ? "text-yellow-200" : "text-slate-400"}/></div>
        <div className="flex-1 min-w-0"><h2 className="text-sm font-black">{trophy.name}</h2><p className="mt-1 text-[11px] leading-4 text-white/65">{trophy.description}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-yellow-300" style={{width:`${Math.min(100,Math.round(amount / trophy.target * 100))}%`}}/></div><div className="mt-1 flex items-center justify-between text-[11px] text-white/60"><span>{amount} / {trophy.target}</span><span className="flex items-center gap-1 text-yellow-200"><Coins size={13}/> +{trophy.coins}</span></div>
          {done ? <p className="mt-2 flex items-center gap-1 text-xs text-emerald-300"><CheckCircle size={14}/> Collected</p> : amount >= trophy.target ? <button type="button" className="mt-2 min-h-10 w-full rounded-xl bg-yellow-400 text-xs font-black text-black" onClick={() => {claimTrophy(trophy.id);refresh();}}>Claim Prize</button> : null}
        </div>
      </article>;
    })}</div>
  </ExperienceFrame>;
}
