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
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

export function CalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="1" fill="currentColor" stroke="none" />
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
