"use client";
import { useEffect, useState } from "react";
import Link from "@/components/ReliableLink";
import Image from "next/image";
import { LockKeyhole, Sparkles, Star } from "lucide-react";
import ExperienceFrame from "@/components/ExperienceFrame";
import { canEnterDifficulty, getMission } from "@/lib/levelMissions";
import { readRecord } from "@/lib/playerExperience";

const CHAPTERS = [
  { tier: "normal", label: "Sky Gardens", story: "Discover the basics and relight the sky.", image: "/images/city-stages/city-stage-1.webp", color: "#30cdec" },
  { tier: "hard", label: "Crystal Factory", story: "Untangle obstacles and power your city.", image: "/images/city-stages/city-stage-3.webp", color: "#ffca65" },
  { tier: "expert", label: "Mystic Peaks", story: "Master the last puzzles to restore the grand beacon.", image: "/images/city-stages/city-stage-6.webp", color: "#db94ff" },
];
export default function JourneyPage() {
  const [progress, setProgress] = useState({ normal: 0, hard: 0, expert: 0 });
  const [stars, setStars] = useState({});
  useEffect(() => {
    const sync = () => { setProgress({normal: 0, hard: 0, expert: 0, ...readRecord("difficulty-progress")}); setStars(readRecord("level-stars")); };
    const raf = requestAnimationFrame(sync);
    window.addEventListener("sortverse-progress", sync);
    window.addEventListener("storage", sync);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("sortverse-progress", sync); window.removeEventListener("storage", sync); };
  }, []);
  return <ExperienceFrame title="Your Journey" subtitle="Three worlds, 36 missions and a city waiting to come alive." back="/levels">
    <div className="space-y-5 pb-5">
      {CHAPTERS.map(({ tier, label, story, image, color }, chapterIndex) => {
        const open = canEnterDifficulty(tier, progress);
        return <article key={tier} className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#09253e]">
          <div className="relative h-36 overflow-hidden">
            <Image src={image} alt={`${label} floating city area`} fill sizes="430px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#091a30] via-[#091a30]/15 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <div className="text-[11px] font-black uppercase tracking-widest" style={{color}}>World {chapterIndex + 1} / 3</div>
              <h2 className="text-xl font-black">{label}</h2><p className="text-[11px] text-white/80">{story}</p>
            </div>
          </div>
          {open ? <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4 py-5">
            {Array.from({length:12}, (_,i) => {
              const level = i + 1;
              const unlocked = level <= (Number(progress[tier]) || 0) + 1;
              const score = Number(stars[`${tier}-${level}`]) || 0;
              const mission = getMission(tier, level);
              const shell = <><span className="text-lg font-black">{level}</span><span className="mt-0.5 flex gap-0.5">{[0,1,2].map(s=><Star key={s} size={10} className={s < score ? "fill-amber-300 text-amber-300" : "text-white/30"}/>)}</span></>;
              return <div key={level} className="min-w-0 text-center">
                {unlocked ? <Link href={`/gameplay?level=${level}&difficulty=${tier}`} aria-label={`${tier} level ${level}, ${mission.title}`} className={`mx-auto flex min-h-14 w-16 flex-col items-center justify-center rounded-2xl border text-white shadow-lg ${score ? "border-yellow-300/70 bg-[#286174]" : "border-cyan-300/50 bg-[#12517b]"}`}>{shell}</Link> : <div aria-label={`Level ${level} locked`} className="mx-auto flex min-h-14 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#051625] text-white/35"><LockKeyhole size={18}/></div>}
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-3 text-white/70">{mission.title}</p>
              </div>;
            })}
          </div> : <div className="flex items-center justify-center gap-2 px-4 py-7 text-sm font-bold text-white/60"><LockKeyhole size={15}/> {tier === "hard" ? "Clear Normal 4 to unlock" : "Clear Hard 6 to unlock"}</div>}
        </article>;
      })}
      <Link href="/special" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-violet-300/40 bg-violet-700/25 text-sm font-bold text-violet-100"><Sparkles size={18}/> Optional Special Missions</Link>
    </div>
  </ExperienceFrame>;
}
