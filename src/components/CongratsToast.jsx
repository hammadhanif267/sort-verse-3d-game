"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Gift, Trophy } from "lucide-react";
import { HomeCoinIcon, HomeGemIcon } from "@/components/icons";

export function showCongrats(detail = {}) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sortverse-congrats", { detail }));
}

export default function CongratsToast() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onCongrats = (event) => {
      const id = `${Date.now()}-${Math.random()}`;
      setItems((old) => [...old.slice(-2), { id, ...event.detail }]);
      window.setTimeout(() => setItems((old) => old.filter((x) => x.id !== id)), 2500);
    };
    window.addEventListener("sortverse-congrats", onCongrats);
    return () => window.removeEventListener("sortverse-congrats", onCongrats);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[15%] z-[999] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((item) => {
        const Icon = item.kind === "level" ? Trophy : item.kind === "reward" ? Gift : CheckCircle2;
        return (
          <div key={item.id} className="sv-congrats-rise flex min-w-[250px] max-w-[360px] items-center gap-3 rounded-2xl border border-yellow-200/45 bg-[linear-gradient(135deg,rgba(38,25,3,.97),rgba(8,28,42,.97))] px-4 py-3 text-white shadow-[0_16px_50px_rgba(0,0,0,.5),0_0_30px_rgba(255,190,30,.16)] backdrop-blur-xl">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-300/40 bg-yellow-300/10 text-yellow-200"><Icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[.16em] text-yellow-200/80">Congratulations</div>
              <div className="truncate text-sm font-black">{item.title || "Reward claimed"}</div>
              {(item.coins || item.diamonds) && <div className="mt-0.5 flex items-center gap-3 text-[11px] font-bold text-white/70">
                {item.coins ? <span className="flex items-center gap-1"><HomeCoinIcon className="h-3.5 w-3.5" /> +{item.coins}</span> : null}
                {item.diamonds ? <span className="flex items-center gap-1"><HomeGemIcon className="h-3.5 w-3.5" /> +{item.diamonds}</span> : null}
              </div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
