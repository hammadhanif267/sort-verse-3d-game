"use client";

export default function HomePage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#020912] text-white">
      {/* Desktop background */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_25%,rgba(0,128,190,0.16),transparent_38%),linear-gradient(180deg,#02111c_0%,#030919_100%)]">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-[20%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[100px]" />

        {/* Phone */}
        <div className="relative h-full w-full max-w-[430px] overflow-hidden sm:h-[calc(100dvh-28px)] sm:max-h-[900px] sm:rounded-[34px] sm:border sm:border-cyan-400/30 sm:shadow-[0_0_45px_rgba(0,180,255,0.14)]">

          {/* Phone inner background */}
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_22%,rgba(0,147,205,0.24),transparent_32%),linear-gradient(180deg,#042b42_0%,#031b2a_45%,#020d18_100%)]">

            {/* Top HUD */}
            <header className="flex shrink-0 items-center justify-between px-4 pt-4">

              {/* Player */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/60 bg-[#07344b] text-lg shadow-[0_0_15px_rgba(0,200,255,0.12)]">
                  👤
                </div>

                <div className="leading-tight">
                  <div className="text-[9px] font-medium text-cyan-100/55">
                    Player
                  </div>
                  <div className="text-sm font-bold text-white">
                    Level 5
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/40 bg-[#06243a] px-3 py-1.5 text-xs font-bold">
                  <span className="text-[11px]">▣</span>
                  <span>1,250</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-[#06243a] px-3 py-1.5 text-xs font-bold">
                  <span className="text-sm">💎</span>
                  <span>32</span>
                </div>
              </div>
            </header>

            {/* Logo area */}
            <section className="shrink-0 px-5 pt-4 text-center">

              <h1 className="text-[38px] font-black leading-none tracking-[-1.5px] text-[#d9f5ff] drop-shadow-[0_0_12px_rgba(92,220,255,0.55)]">
                SORTVERSE
              </h1>

              <div className="mt-1.5 flex items-center justify-center gap-3">
                <span className="h-[2px] w-11 bg-gradient-to-r from-transparent to-cyan-400" />

                <span className="text-[24px] font-black italic text-[#ffc400] drop-shadow-[0_0_8px_rgba(255,190,0,0.35)]">
                  3D
                </span>

                <span className="h-[2px] w-11 bg-gradient-to-l from-transparent to-cyan-400" />
              </div>

              <p className="mt-1.5 text-[9px] font-bold tracking-[0.18em] text-cyan-200/65">
                SORT · ORGANIZE · BUILD YOUR CITY
              </p>
            </section>

            {/* City / Hero */}
            <section className="relative min-h-0 flex-1 overflow-hidden">

              {/* Stars */}
              <span className="absolute left-[21%] top-[32%] h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_#38dfff]" />
              <span className="absolute right-[22%] top-[39%] h-1.5 w-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_#6bbdff]" />
              <span className="absolute left-[31%] top-[44%] h-1 w-1 rounded-full bg-purple-300 shadow-[0_0_8px_#d69cff]" />

              {/* Orbit */}
              <div className="absolute left-1/2 top-[48%] h-[105px] w-[230px] -translate-x-1/2 rounded-[50%] border border-cyan-400/10" />

              {/* City */}
              <div className="absolute bottom-[7%] left-1/2 flex h-[45%] w-[72%] -translate-x-1/2 items-end justify-center gap-1.5">

                {/* Left building */}
                <Building height="42%" width="14%" />

                {/* Building */}
                <Building height="62%" width="15%" />

                {/* Building */}
                <Building height="50%" width="15%" />

                {/* Center tower */}
                <div className="relative h-[78%] w-[17%] rounded-t-md border border-cyan-400/25 bg-gradient-to-b from-[#12607a] to-[#073047] shadow-[0_0_16px_rgba(0,210,255,0.12)]">
                  <div className="absolute -top-5 left-1/2 h-5 w-1 -translate-x-1/2 bg-cyan-300 shadow-[0_0_12px_#26dfff]" />

                  <Windows count={4} />
                </div>

                {/* Building */}
                <Building height="55%" width="15%" />

                {/* Building */}
                <Building height="48%" width="14%" />

              </div>

              {/* Ground */}
              <div className="absolute bottom-[5%] left-1/2 h-5 w-[74%] -translate-x-1/2 rounded-[50%] border border-cyan-400/25 bg-[#06283b] shadow-[0_0_18px_rgba(0,200,255,0.12)]" />
            </section>

            {/* Main menu */}
            <section className="shrink-0 space-y-2 px-4 pb-2">

              {/* Play */}
              <button className="flex h-[58px] w-full items-center rounded-xl border border-yellow-300/80 bg-gradient-to-b from-[#ffd21a] to-[#ff8500] px-4 text-left shadow-[0_5px_20px_rgba(255,160,0,0.2)] transition hover:brightness-110 active:scale-[0.99]">

                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-500/80 text-black">
                  ▶
                </span>

                <span className="leading-tight">
                  <span className="block text-sm font-black text-[#181000]">
                    Play
                  </span>
                  <span className="block text-[8px] font-medium text-[#4e3100]">
                    Continue from Level 5
                  </span>
                </span>
              </button>

              {/* Level Selection */}
              <MenuButton
                icon="▦"
                title="Level Selection"
                blue
              />

              {/* Daily Challenge */}
              <MenuButton
                icon="🎁"
                title="Daily Challenge"
                notification="1"
                blue
              />

              {/* Build Your City */}
              <MenuButton
                icon="♜"
                title="Build Your City"
                purple
              />
            </section>

            {/* Bottom navigation */}
            <nav className="shrink-0 border-t border-cyan-300/10 bg-[#031421]/95 px-4 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur">

              <div className="grid grid-cols-4">

                <BottomItem icon="⌂" label="Home" active />

                <BottomItem icon="▦" label="Levels" />

                <BottomItem icon="♛" label="City" />

                <BottomItem icon="●" label="Profile" />

              </div>
            </nav>

          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Building ---------------- */

function Building({ height, width }) {
  return (
    <div
      className="relative rounded-t-md border border-cyan-400/20 bg-gradient-to-b from-[#10536d] to-[#062a40] shadow-[0_0_10px_rgba(0,180,255,0.08)]"
      style={{
        height,
        width,
      }}
    >
      <Windows count={3} />
    </div>
  );
}

/* ---------------- Windows ---------------- */

function Windows({ count = 3 }) {
  return (
    <div className="flex h-full flex-col items-center justify-evenly py-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-1 w-[45%] rounded-full bg-cyan-300/60 shadow-[0_0_5px_rgba(0,220,255,0.5)]"
        />
      ))}
    </div>
  );
}

/* ---------------- Menu Button ---------------- */

function MenuButton({
  icon,
  title,
  blue = false,
  purple = false,
  notification,
}) {
  return (
    <button
      className={`flex h-[47px] w-full items-center rounded-xl border px-3 text-left transition active:scale-[0.99] ${
        purple
          ? "border-purple-300/60 bg-gradient-to-r from-[#8b22e8] to-[#c000d9] shadow-[0_4px_16px_rgba(190,0,255,0.16)]"
          : blue
            ? "border-cyan-400/20 bg-[#062438] shadow-[inset_0_0_15px_rgba(0,150,220,0.05)] hover:bg-[#073149]"
            : "border-white/10 bg-white/5"
      }`}
    >
      <span
        className={`mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
          purple
            ? "bg-white/15"
            : "bg-cyan-500/10 text-cyan-300"
        }`}
      >
        {icon}
      </span>

      <span
        className={`min-w-0 flex-1 text-xs font-bold ${
          purple ? "text-white" : "text-white/90"
        }`}
      >
        {title}
      </span>

      {notification && (
        <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black">
          {notification}
        </span>
      )}

      <span
        className={`text-lg ${
          purple ? "text-white" : "text-cyan-300"
        }`}
      >
        ›
      </span>
    </button>
  );
}

/* ---------------- Bottom Item ---------------- */

function BottomItem({ icon, label, active = false }) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-1 text-[8px] font-semibold ${
        active
          ? "bg-cyan-400/10 text-cyan-300"
          : "text-white/40"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );
}