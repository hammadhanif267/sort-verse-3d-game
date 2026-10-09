"use client";

/**
 * Pure presentation of the SortVerse loading screen.
 *   progress  0-100   (drives the bar, the % and the tubes filling up)
 *   fading    true    (fades the whole screen out once loading is done)
 *   label             (small caption under the logo)
 */

const TUBES = [
  { id: "gold", grad: "linear-gradient(180deg,#ffe066,#ff9a00)", glow: "rgba(255,190,0,.55)" },
  { id: "cyan", grad: "linear-gradient(180deg,#8bf3ff,#0aa6d6)", glow: "rgba(34,211,238,.55)" },
  { id: "magenta", grad: "linear-gradient(180deg,#f08bff,#a21cd1)", glow: "rgba(200,70,255,.5)" },
];
const BLOCKS_PER_TUBE = 4;

const STAGES = [
  [0, "Preparing tubes"],
  [35, "Loading your city"],
  [70, "Polishing the game"],
  [96, "Ready!"],
];

function stageLabel(progress) {
  let text = STAGES[0][1];
  for (const [from, label] of STAGES) if (progress >= from) text = label;
  return text;
}

export default function LoadingView({ progress = 0, fading = false, label }) {
  const value = Math.max(0, Math.min(100, Math.round(progress)));
  const total = TUBES.length * BLOCKS_PER_TUBE;

  return (
    <div
      className={`sv-splash fixed inset-0 z-[200] bg-[#020912] text-white transition-opacity duration-300 ease-out ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
      role="progressbar"
      aria-label="Loading SortVerse 3D"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,rgba(0,150,220,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">
        <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-[#020b15] sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_50px_rgba(0,180,255,0.16)]">
          {/* soft glows */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-[-10%] h-72 w-72 rounded-full bg-cyan-500/20 blur-[90px]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-[8%] h-72 w-72 rounded-full bg-purple-600/20 blur-[90px]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[.07]"
            style={{ backgroundImage: "linear-gradient(rgba(120,220,255,.9) 1px,transparent 1px),linear-gradient(90deg,rgba(120,220,255,.9) 1px,transparent 1px)", backgroundSize: "36px 36px", maskImage: "radial-gradient(circle at 50% 45%,#000 0%,transparent 70%)", WebkitMaskImage: "radial-gradient(circle at 50% 45%,#000 0%,transparent 70%)" }}
          />

          <div className="relative z-10 flex h-full flex-col items-center px-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
            {/* Logo */}
            <div className="sv-load-logo text-center">
              <h1 className="text-[40px] font-black leading-none tracking-[-1.5px] text-[#d9f5ff] drop-shadow-[0_0_14px_rgba(92,220,255,0.6)]">SORTVERSE</h1>
              <div className="mt-1.5 flex items-center justify-center gap-3">
                <span className="h-[2px] w-11 bg-gradient-to-r from-transparent to-cyan-400" />
                <span className="text-[26px] font-black italic text-[#ffc400] drop-shadow-[0_0_8px_rgba(255,190,0,0.4)]">3D</span>
                <span className="h-[2px] w-11 bg-gradient-to-l from-transparent to-cyan-400" />
              </div>
              <p className="mt-2 text-[9px] font-bold tracking-[0.18em] text-cyan-200/65">SORT · ORGANIZE · BUILD YOUR CITY</p>
            </div>

            {/* Tubes fill up with the progress */}
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="flex items-end gap-4">
                {TUBES.map((tube, t) => (
                  <div
                    key={tube.id}
                    className="sv-load-tube relative flex h-[188px] w-[58px] flex-col-reverse gap-[5px] overflow-hidden rounded-[29px] border-2 border-cyan-100/55 bg-[#06223a]/80 p-[4px] shadow-[inset_0_0_14px_rgba(0,0,0,.45),0_0_22px_rgba(0,190,255,.14)]"
                    style={{ animationDelay: `${t * 90}ms` }}
                  >
                    {Array.from({ length: BLOCKS_PER_TUBE }).map((_, b) => {
                      const index = b * TUBES.length + t; // fill row by row so the three tubes rise together
                      const on = value >= Math.round(((index + 1) / total) * 96);
                      return (
                        <div
                          key={b}
                          className="h-[39px] w-full shrink-0 rounded-[13px] border border-white/35 transition-all duration-200 ease-out"
                          style={{
                            background: tube.grad,
                            boxShadow: on ? `0 0 12px ${tube.glow}, inset 0 2px 0 rgba(255,255,255,.45)` : "none",
                            opacity: on ? 1 : 0,
                            transform: on ? "scale(1)" : "scale(.55)",
                          }}
                        />
                      );
                    })}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-y-2 left-[7px] w-[6px] rounded-full bg-white/20" />
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="w-full">
              <div className="flex items-end justify-between">
                <div className="text-[11px] font-bold tracking-wide text-cyan-100/75">{label || stageLabel(value)}<span className="sv-load-dots" aria-hidden="true" /></div>
                <div className="text-2xl font-black tabular-nums leading-none text-[#ffc400] drop-shadow-[0_0_8px_rgba(255,190,0,0.35)]">
                  {value}
                  <span className="ml-0.5 text-sm text-[#ffc400]/80">%</span>
                </div>
              </div>
              <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full border border-cyan-300/25 bg-[#031a2a] p-[2px] shadow-[inset_0_1px_4px_rgba(0,0,0,.6)]">
                <div
                  className="sv-load-bar relative h-full rounded-full bg-gradient-to-r from-[#22d3ee] via-[#6aa8ff] to-[#ffc400]"
                  style={{ width: `${value}%`, boxShadow: "0 0 14px rgba(34,211,238,.55)" }}
                />
              </div>
              <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-white/30">Tap · Sort · Win</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
