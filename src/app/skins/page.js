"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Gem, Coins } from "lucide-react";
import ExperienceFrame from "@/components/ExperienceFrame";
import { SKINS, ownedSkins, selectedSkin, spendForSkin, equipSkin } from "@/lib/playerExperience";
import { usePlayerStats } from "@/lib/playerStats";
export default function SkinsPage() {
  const [owned, setOwned] = useState(["classic"]);
  const [active, setActive] = useState("classic");
  const [status, setStatus] = useState("");
  const { coins, diamonds } = usePlayerStats();
  useEffect(() => {
    const sync = () => { setOwned(ownedSkins()); setActive(selectedSkin()); };
    const id = requestAnimationFrame(sync);
    window.addEventListener("sortverse-progress", sync);
    return () => { cancelAnimationFrame(id); window.removeEventListener("sortverse-progress", sync); };
  }, []);
  function choose(id) {
    if (owned.includes(id)) { equipSkin(id); setActive(id); setStatus("Skin equipped. Your tubes change in gameplay."); return; }
    const item = SKINS.find(s => s.id === id);
    if (item?.currency === "earned") { setStatus("Complete 7 Daily Puzzles during the same month to unlock Aurora."); return; }
    const result = spendForSkin(id);
    if (result.ok) { setOwned(ownedSkins()); setActive(id); setStatus(`${item.name} unlocked and equipped!`); }
    else setStatus(result.reason);
  }
  return <ExperienceFrame title="Tube Skins" subtitle="Change your tubes, not your puzzle rules. Everything is stored offline." back="/profile">
    <div className="mb-4 flex justify-end gap-3 text-xs font-bold"><span className="inline-flex items-center gap-1 text-yellow-200"><Coins size={16}/>{coins}</span><span className="inline-flex items-center gap-1 text-cyan-200"><Gem size={16}/>{diamonds}</span></div>
    {status && <p role="status" className="mb-4 rounded-xl border border-cyan-400/30 p-3 text-xs text-cyan-100">{status}</p>}
    <div className="grid grid-cols-2 gap-3 pb-6">{SKINS.map(skin => {
      const isOwned = owned.includes(skin.id);
      const isActive = active === skin.id;
      return <button type="button" key={skin.id} onClick={() => choose(skin.id)} aria-pressed={isActive} className={`min-h-44 rounded-2xl border p-3 text-left ${isActive ? "border-cyan-200 bg-[#175176]" : "border-white/15 bg-[#08243b]"}`}>
        <div className="relative mx-auto mb-3 h-20 w-14 rounded-b-[35%] rounded-t-xl border-[3px] shadow-[inset_8px_0_16px_rgba(255,255,255,.3),0_8px_16px_rgba(0,0,0,.35)]" style={{background:`linear-gradient(110deg,${skin.colors[0]}55,${skin.colors[1]}90)`,borderColor:skin.colors[0]}}><div className="absolute inset-x-1 top-2 h-11 rounded-b-lg bg-white/10"/><span className="absolute inset-x-[-4px] -top-1 h-3 rounded-full" style={{backgroundColor:skin.colors[1]}} /></div>
        <div className="text-sm font-black">{skin.name}</div>
        <p className="mt-1 min-h-9 text-[11px] leading-4 text-white/65">{skin.description}</p>
        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-yellow-200">{isActive ? <><CheckCircle size={14}/> Equipped</> : isOwned ? "Tap to equip" : skin.currency === "earned" ? "Earn through Daily" : `${skin.cost} ${skin.currency}`}</p>
      </button>;
    })}</div>
  </ExperienceFrame>;
}
