/* ---------------- Bottom Nav Icons ---------------- */

export function HomeIcon({ className, strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function GridIcon({ className, strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function TrophyIcon({ className, strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a2 2 0 0 0 0 4h1" />
      <path d="M17 6h3a2 2 0 0 1 0 4h-1" />
    </svg>
  );
}

export function UserIcon({ className, strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

/* ---------------- Home Menu Icons ---------------- */

export function LevelsIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bfe4ff" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="8" height="8" rx="2" fill="url(#gridGrad)" />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="url(#gridGrad)" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="url(#gridGrad)" />
      <rect x="13" y="13" width="8" height="8" rx="2" fill="url(#gridGrad)" />
    </svg>
  );
}

export function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="calGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c7e6ff" />
        </linearGradient>
      </defs>
      <rect x="4" y="5" width="16" height="15" rx="2.5" fill="url(#calGrad)" />
      <rect x="4" y="5" width="16" height="4" rx="2" fill="#eaf6ff" />
      <rect x="7.5" y="2.2" width="2" height="4.2" rx="1" fill="#ffffff" />
      <rect x="14.5" y="2.2" width="2" height="4.2" rx="1" fill="#ffffff" />
      <path
        d="M8 12.8l2.2 2.1 4.3-4.4"
        stroke="#2a6fb0"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CityIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="2" y="14" width="5" height="8" rx="1" />
      <rect x="9" y="8" width="6" height="14" rx="1" />
      <rect x="17" y="12" width="5" height="10" rx="1" />
      <path d="M12 3.5 15 8H9l3-4.5Z" />
    </svg>
  );
}

/* Glossy gold "Build Your City" icon — coin-stack towers (matches the demo's artwork) */
export function CityGoldIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="cityGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffe58a" />
          <stop offset="50%" stopColor="#ffb92e" />
          <stop offset="100%" stopColor="#e07800" />
        </linearGradient>
      </defs>

      {/* Left stack */}
      <rect x="3" y="13" width="5" height="7" fill="url(#cityGold)" stroke="#a35a00" strokeWidth="0.4" />
      <ellipse cx="5.5" cy="20" rx="2.5" ry="1.1" fill="#c97600" />
      <ellipse cx="5.5" cy="13" rx="2.5" ry="1.3" fill="#ffedb0" stroke="#a35a00" strokeWidth="0.4" />

      {/* Right stack */}
      <rect x="16" y="11" width="5" height="9" fill="url(#cityGold)" stroke="#a35a00" strokeWidth="0.4" />
      <ellipse cx="18.5" cy="20" rx="2.5" ry="1.1" fill="#c97600" />
      <ellipse cx="18.5" cy="11" rx="2.5" ry="1.3" fill="#ffedb0" stroke="#a35a00" strokeWidth="0.4" />

      {/* Center (tallest) stack */}
      <rect x="9.3" y="6" width="5.4" height="14" fill="url(#cityGold)" stroke="#a35a00" strokeWidth="0.4" />
      <ellipse cx="12" cy="20" rx="2.7" ry="1.2" fill="#c97600" />
      <rect x="11.4" y="7" width="1.2" height="12" fill="#ffffff" opacity="0.35" />
      <ellipse cx="12" cy="6" rx="2.7" ry="1.4" fill="#fff3c4" stroke="#a35a00" strokeWidth="0.4" />
    </svg>
  );
}


/* Compact currency icons matching the Home header artwork exactly. */
export function HomeCoinIcon({ className }) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fff7bd] via-[#ffd43b] to-[#d58a00] shadow-[0_0_10px_rgba(255,190,0,0.42)] ring-1 ring-yellow-200/60 ${className || "h-5 w-5"}`}
      aria-hidden="true"
    >
      <span className="absolute inset-[2px] rounded-full border-[1.5px] border-[#a76500]/70" />
      <span className="absolute inset-[4px] rounded-full border border-[#fff0a0]/70" />
      <span className="absolute left-[4px] top-[3px] h-[4px] w-[2px] rotate-[35deg] rounded-full bg-white/75" />
      <span className="relative z-10 -translate-y-[0.5px] text-[9px] font-black leading-none text-[#704000] drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">$</span>
    </span>
  );
}

export function HomeGemIcon({ className }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(0,210,255,0.3)] ${className || "h-5 w-5"}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[70%] w-[70%] text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5 5 6.5l7 15 7-15-7-4Z" fill="currentColor" opacity="0.95" />
        <path d="M5 6.5h14M12 2.5v19" stroke="#dffcff" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

/* Glossy gold coin icon (matches the demo's currency icon) */
export function CoinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <defs>
        <radialGradient id="coinFace" cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ffc23c" />
          <stop offset="100%" stopColor="#e2810a" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#8a4b00" />
      <circle cx="12" cy="12" r="9.3" fill="url(#coinFace)" />
      <ellipse cx="9.2" cy="8.3" rx="2.5" ry="1.6" fill="#fff6c9" opacity="0.55" />
    </svg>
  );
}

/* Glossy purple gem icon (matches the demo's diamond currency icon) */
export function GemIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id="gemGloss" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#f6c8ff" />
          <stop offset="45%" stopColor="#bb3dff" />
          <stop offset="100%" stopColor="#7a12d6" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.2c-2.3 0-4.8 1.9-6.4 3.7C4.7 6.9 4 7.9 4 8.6c0 1 .5 2.4 1.5 4.1C7.2 16 10 19.7 12 22.2c2-2.5 4.8-6.2 6.5-9.5 1-1.7 1.5-3.1 1.5-4.1 0-.7-.7-1.7-1.6-2.7C16.8 4.1 14.3 2.2 12 2.2Z"
        fill="url(#gemGloss)"
        stroke="#5c0da3"
        strokeWidth="0.4"
      />
      <path
        d="M12 2.2c-2.3 0-4.8 1.9-6.4 3.7L12 8.6l6.4-2.7C16.8 4.1 14.3 2.2 12 2.2Z"
        fill="#ffffff"
        opacity="0.4"
      />
    </svg>
  );
}
