"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";
import { LeagueChip } from "@/components/RankBits";
import { PreviewableAvatar } from "@/components/AvatarPreview";
import { computeScore, getLeague } from "@/lib/ranking";

export default function PublicPlayerProfile() {
  const { playerId } = useParamsSafe();
  const [player, setPlayer] = useState(undefined);
  useEffect(() => {
    const load = () => {
      const id = "local-player";
      if (playerId && playerId !== id) { setPlayer(null); return; }
      const read = (key, fallback) => { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } };
      const stats = computeScore(read("sortverse-level-stars", {}), read("sortverse-daily-completed", {}));
      const name = read("sortverse-player-name", "Player");
      const avatar = read("sortverse-player-avatar", null);
      setPlayer({ ...stats, name, avatar });
    };
    load();
    window.addEventListener("sortverse-progress", load);
    window.addEventListener("sortverse-profile", load);
    return () => { window.removeEventListener("sortverse-progress", load); window.removeEventListener("sortverse-profile", load); };
  }, [playerId]);

  return <main className="min-h-[100dvh] bg-[#020912] px-4 py-5 text-white"><div className="mx-auto max-w-[430px]">
    <Link href="/ranking" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-white/70"><ChevronLeft className="h-5 w-5"/>Ranking</Link>
    {player === undefined ? <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/50">Loading profile…</div> : player === null ? <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">This profile is not available.</div> : <>
      <section className="rounded-3xl border border-cyan-300/20 bg-[#06243a]/90 p-5 text-center shadow-2xl">
        <div className="mx-auto w-fit"><PreviewableAvatar name={player.name} avatar={player.avatar} size={82}/></div>
        <h1 className="mt-3 text-xl font-black">{player.name}</h1><div className="mt-1 flex justify-center"><LeagueChip score={player.score}/></div>
        <div className="mt-5 grid grid-cols-3 gap-2"><Stat label="Score" value={player.score?.toLocaleString()}/><Stat label="Cleared" value={player.cleared}/><Stat label="Stars" value={player.stars}/></div>
      </section>
      <section className="mt-4 rounded-3xl border border-white/10 bg-[#04182a]/85 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-black"><Trophy className="h-4 w-4 text-yellow-300"/>Local progress</div><div className="space-y-3">{[["Normal","normal"],["Hard","hard"],["Expert","expert"]].map(([label,key])=><div key={key}><div className="flex justify-between text-xs font-bold"><span>{label}</span><span className="text-white/50">{player.byDiff?.[key]||0}/12</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-black/35"><div className="h-full rounded-full bg-cyan-400" style={{width:`${((player.byDiff?.[key]||0)/12)*100}%`}}/></div></div>)}</div><div className="mt-4 text-xs text-white/45">This profile is stored only on this device/browser.</div></section>
    </>}
  </div></main>;
}
function useParamsSafe(){
  if (typeof window === "undefined") return { playerId: null };
  const parts = window.location.pathname.split("/").filter(Boolean);
  return { playerId: decodeURIComponent(parts[parts.length-1] || "") };
}
function Stat({label,value}){return <div className="rounded-2xl border border-white/8 bg-black/20 px-2 py-3"><div className="text-lg font-black text-cyan-200">{value}</div><div className="text-[10px] font-bold uppercase tracking-wide text-white/40">{label}</div></div>}
