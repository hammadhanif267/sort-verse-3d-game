import { getLeague } from "@/lib/ranking";

/* Avatars are built from the game's own objects and colours (see GameplayScene palette). */
export const AVATAR_COLORS = {
  blue: { base: "#1d6fe0", light: "#5aa0ff", dark: "#0d47a8" },
  red: { base: "#d6202f", light: "#ff5f66", dark: "#8f0f1c" },
  yellow: { base: "#f0c018", light: "#ffe273", dark: "#a87a00" },
  green: { base: "#22a72f", light: "#6fe07a", dark: "#0f6b18" },
  purple: { base: "#7b2fd6", light: "#b57bff", dark: "#4a1690" },
};
export const AVATAR_SHAPES = ["sphere", "cube", "star", "triangle"];
export const AVATAR_BGS = [
  ["#0b4a6b", "#031a2a"],
  ["#1a5a4a", "#04211c"],
  ["#4a2a7a", "#150826"],
  ["#7a3a1a", "#26100a"],
  ["#2a3f5a", "#0a1220"],
  ["#6a1f3a", "#210812"],
];

export function GameAvatarArt({ shape = "sphere", color = "blue", bg = 0, size = 36 }) {
  const c = AVATAR_COLORS[color] || AVATAR_COLORS.blue;
  const [b1, b2] = AVATAR_BGS[bg] || AVATAR_BGS[0];
  const g = `ga-${color}`;
  const gb = `gb-${bg}`;
  const fill = { fill: `url(#${g})`, stroke: c.dark, strokeWidth: 1.5, strokeLinejoin: "round" };
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="block">
      <defs>
        <radialGradient id={gb} cx=".5" cy=".3" r=".9">
          <stop offset="0" stopColor={b1} />
          <stop offset="1" stopColor={b2} />
        </radialGradient>
        <linearGradient id={g} x1=".2" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset=".5" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#${gb})`} />
      {shape === "cube" && <rect x="15" y="15" width="34" height="34" rx="9" {...fill} />}
      {shape === "star" && <path d="M32 10l6.6 13.4 14.8 2.2-10.7 10.4 2.5 14.7L32 43.8l-13.2 6.9 2.5-14.7L10.6 25.6l14.8-2.2z" {...fill} />}
      {shape === "triangle" && <path d="M32 15L51 48H13z" {...fill} strokeWidth={4} />}
      {shape !== "cube" && shape !== "star" && shape !== "triangle" && <circle cx="32" cy="32" r="19" {...fill} />}
      <ellipse cx="25" cy="24" rx="6" ry="3.5" fill="#fff" opacity=".45" transform="rotate(-30 25 24)" />
    </svg>
  );
}

/** avatar = { photo?: dataURL, builder?: {shape,color,bg}, hue?: number }. Photo wins, then game-made, then initials. */
export function Avatar({ name, you, size = 36, avatar }) {
  const ring = { "--tw-ring-color": you ? "#ffb020" : "rgba(255,255,255,0.15)" };
  if (avatar?.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.photo}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-2"
        style={{ width: size, height: size, ...ring }}
      />
    );
  }
  if (avatar?.builder) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full ring-2" style={{ width: size, height: size, ...ring }}>
        <GameAvatarArt {...avatar.builder} size={size} />
      </div>
    );
  }
  const hue = avatar?.hue ?? [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ring-2"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg,hsl(${hue} 70% 50%),hsl(${(hue + 40) % 360} 70% 30%))`,
        ...ring,
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function LeagueChip({ score }) {
  const l = getLeague(score);
  return (
    <span
      className="inline-block rounded-full border px-1.5 py-[1px] text-[10px] font-black uppercase tracking-wide"
      style={{ color: l.color, borderColor: `${l.color}55`, background: `${l.color}14` }}
    >
      {l.name}
    </span>
  );
}
