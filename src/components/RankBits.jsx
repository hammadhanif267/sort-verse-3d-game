import { useId } from "react";
import { getLeague } from "@/lib/ranking";

/* Polished, game-native avatars. They are SVGs so they stay sharp at every size. */
export const AVATAR_COLORS = {
  blue: { base: "#2d7ff9", light: "#8bc0ff", dark: "#123f9b", skin: "#ffd0a6" },
  red: { base: "#e33b4b", light: "#ff8790", dark: "#8c1724", skin: "#ffd0a6" },
  yellow: { base: "#f1bd28", light: "#ffe88a", dark: "#9a6d05", skin: "#ffd0a6" },
  green: { base: "#25b96a", light: "#80e2a8", dark: "#12653a", skin: "#ffd0a6" },
  purple: { base: "#8754e8", light: "#c3a1ff", dark: "#47209a", skin: "#ffd0a6" },
  cyan: { base: "#21b9d4", light: "#8ceaf7", dark: "#12647a", skin: "#ffd0a6" },
};
export const AVATAR_SHAPES = ["hero", "robot", "ninja", "pilot", "fox", "wizard"];
export const AVATAR_STYLES = AVATAR_SHAPES;
export const AVATAR_FACES = ["happy", "cool", "excited", "focused"];
export const AVATAR_GENDERS = ["boy", "girl"];
export const AVATAR_HAIRS = ["short", "fade", "curly", "long", "bob", "ponytail"];
export const AVATAR_OUTFITS = ["hoodie", "jacket", "tee", "dress", "sport", "royal"];
export const AVATAR_ACCESSORIES = ["none", "glasses", "cap", "headphones", "bow", "earrings"];
export const AVATAR_SKINS = ["fair", "warm", "tan", "deep"];
export const AVATAR_BGS = [
  ["#1a5fa8", "#07172b"], ["#168064", "#061d18"], ["#6d3fc1", "#170a2d"],
  ["#c26a18", "#281004"], ["#28607a", "#07151e"], ["#9c315e", "#230817"],
];

const STYLE_LABELS = { hero: "Hero", robot: "Bot", ninja: "Ninja", pilot: "Pilot", fox: "Fox", wizard: "Wizard" };
export const AVATAR_SKIN_COLORS = { fair: "#ffe0c2", warm: "#f4c095", tan: "#c98257", deep: "#7a4935" };

const GIRL_NAME_SET = new Set([
  "ayesha", "aisha", "fatima", "zainab", "maryam", "mariam", "hira", "iqra", "sana", "alina",
  "anaya", "maham", "mahnoor", "mehwish", "laiba", "laiba", "nimra", "noor", "dua", "eman",
  "iman", "hafsa", "sidra", "sadia", "rabia", "rida", "arisha", "areeba", "kinza", "bisma",
  "maria", "hiba", "hiba", "javeria", "komal", "mishal", "minahil", "suba", "saba", "maria",
  "sarah", "sara", "zoya", "zoha", "maira", "maya", "alisha", "alisha", "anam", "amna",
  "kanwal", "sanam", "mahira", "mehak", "rimsha", "romaisa", "rabeeca", "ayra", "aiza", "eliza",
  "sophia", "olivia", "emma", "mia", "ava", "isabella", "ella", "grace", "chloe", "lily",
  "luna", "aria", "zoe", "sofia", "amelia", "harper", "evelyn", "camila", "layla", "nora",
]);

const BOY_NAME_SET = new Set([
  "hammad", "ahmad", "hamza", "ali", "usman", "umar", "owais", "bilal", "talha", "zain", "zaid",
  "abdullah", "ibrahim", "huzaifa", "rayyan", "ayaan", "ayan", "arham", "ahsan", "hassan", "hussain",
  "saad", "salman", "fahad", "farhan", "danish", "shahzaib", "shayan", "shehryar", "affan", "adnan",
  "imran", "arsalan", "faizan", "taha", "rehan", "moiz", "muneeb", "owais", "kamran", "usama",
  "muhammad", "mohammad", "alex", "liam", "noah", "oliver", "elijah", "james", "william", "benjamin",
  "lucas", "henry", "theodore", "jack", "charlie", "leo", "arthur", "mateo", "daniel", "michael",
]);

export function inferAvatarGender(name = "") {
  const parts = String(name).toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "boy";
  if (parts.some((part) => GIRL_NAME_SET.has(part))) return "girl";
  if (parts.some((part) => BOY_NAME_SET.has(part))) return "boy";
  const first = parts[0];
  if (/(a|ah|ahh|i|ia|iya|ya|na|ra|sha|een|een|ish|iya)$/.test(first) && first.length >= 4) return "girl";
  return "boy";
}

export function GameAvatarArt({
  shape = "hero",
  style,
  color = "blue",
  bg = 0,
  face = "happy",
  size = 36,
  gender = "boy",
  hair = "short",
  outfit = "hoodie",
  accessory = "none",
  skinTone = "fair",
  skin,
}) {
  const uid = useId().replace(/:/g, "");
  const c = AVATAR_COLORS[color] || AVATAR_COLORS.blue;
  const skinKey = skinTone || skin || "fair";
  const skinColor = AVATAR_SKIN_COLORS[skinKey] || AVATAR_SKIN_COLORS.fair;
  const hairColors = gender === "girl"
    ? { short: "#4a2a1d", dark: "#21130e", light: "#7a4a2e" }
    : { short: "#2b211d", dark: "#17120f", light: "#51372a" };
  const hairColor = hairColors.short;
  const [b1, b2] = AVATAR_BGS[bg] || AVATAR_BGS[0];
  const avatarStyle = style || (AVATAR_SHAPES.includes(shape) ? shape : "hero");
  const bodyGrad = `body-${uid}`;
  const skinGrad = `skin-${uid}`;
  const hairGrad = `hair-${uid}`;
  const bgGrad = `bg-${uid}`;
  const shadow = `shadow-${uid}`;
  const eye = "#172231";
  const lip = gender === "girl" ? "#a94c68" : "#7f3e3e";
  const isGirl = gender === "girl";

  const mouth = face === "excited"
    ? <ellipse cx="110" cy="106" rx="7" ry="5" fill={eye} />
    : face === "cool"
      ? <path d="M98 106h24" stroke={eye} strokeWidth="4" strokeLinecap="round" />
      : <path d={face === "focused" ? "M101 108q9 3 18 0" : "M99 105q11 12 22 0"} fill="none" stroke={lip} strokeWidth="3.5" strokeLinecap="round" />;

  return (
    <svg viewBox="0 0 220 320" width={size} height={Math.round(size * 320 / 220)} aria-hidden="true" className="block">
      <defs>
        <radialGradient id={bgGrad} cx="50%" cy="18%" r="95%">
          <stop offset="0" stopColor={b1} />
          <stop offset="1" stopColor={b2} />
        </radialGradient>
        <linearGradient id={bodyGrad} x1="18%" y1="0" x2="82%" y2="100%">
          <stop offset="0" stopColor={c.light} />
          <stop offset=".5" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <linearGradient id={skinGrad} x1="25%" y1="0" x2="75%" y2="100%">
          <stop offset="0" stopColor="#fff1df" />
          <stop offset=".45" stopColor={skinColor} />
          <stop offset="1" stopColor="#c77f63" />
        </linearGradient>
        <linearGradient id={hairGrad} x1="20%" y1="0" x2="80%" y2="100%">
          <stop offset="0" stopColor={hairColors.light} />
          <stop offset=".45" stopColor={hairColor} />
          <stop offset="1" stopColor={hairColors.dark} />
        </linearGradient>
        <filter id={shadow} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#000" floodOpacity=".34" />
        </filter>
      </defs>

      <rect x="5" y="5" width="210" height="310" rx="30" fill={`url(#${bgGrad})`} />
      <circle cx="48" cy="56" r="30" fill="#fff" opacity=".06" />
      <circle cx="177" cy="83" r="42" fill="#fff" opacity=".035" />
      <ellipse cx="110" cy="294" rx="65" ry="12" fill="#000" opacity=".3" />

      <g filter={`url(#${shadow})`}>
        {/* shoes */}
        <path d="M73 281c-5 7-7 13-4 17 8 4 27 3 31-2 1-5-5-11-12-15z" fill="#f7f8fb" />
        <path d="M118 281c-2 6-1 12 3 16 8 4 28 3 30-2 0-5-5-10-13-15z" fill="#f7f8fb" />
        <path d="M69 296h31M122 296h28" stroke="#b8c0ca" strokeWidth="3" strokeLinecap="round" />
        <path d="M75 286l12-2 7 11H75zM121 285l12-1 10 11h-21z" fill="#202833" />

        {/* legs */}
        <path d="M76 213c1 20 1 44-2 70l27 1c5-25 6-47 6-69z" fill="url(#skinGrad)" opacity={outfit === "dress" ? .9 : 0} />
        <path d="M113 214c0 21 0 45 3 69l27 1c-3-25-4-47-3-70z" fill="url(#skinGrad)" opacity={outfit === "dress" ? .9 : 0} />
        {outfit === "dress" ? (
          <path d="M68 178h84l-8 72c-11 8-56 8-68 0z" fill={`url(#${bodyGrad})`} />
        ) : (
          <>
            <path d="M78 210l27 1-4 72H72z" fill="#e9edf3" />
            <path d="M113 211l28-1 5 72h-29z" fill="#e9edf3" />
            <path d="M80 214h25" stroke="#fff" strokeOpacity=".5" strokeWidth="3" />
            <path d="M114 214h25" stroke="#fff" strokeOpacity=".5" strokeWidth="3" />
          </>
        )}

        {/* arms */}
        <path d={isGirl ? "M68 164c-10 11-14 27-18 42 0 7 10 10 15 3 6-13 12-28 18-38z" : "M69 163c-11 12-16 28-19 44 1 7 11 9 16 2 6-13 12-27 17-38z"} fill={`url(#${skinGrad})`} />
        <path d="M152 163c11 12 16 28 19 43 0 7-10 10-15 3-6-13-12-27-17-38z" fill={`url(#${skinGrad})`} />

        {/* torso / clothing */}
        {outfit === "dress" ? (
          <path d="M79 154c8-7 16-10 31-10s23 3 31 10l8 27-8 55H79l-8-55z" fill={`url(#${bodyGrad})`} />
        ) : outfit === "royal" ? (
          <path d="M78 154c8-8 18-11 32-11s24 3 32 11l11 72H67z" fill={`url(#${bodyGrad})`} />
        ) : (
          <path d="M80 153c8-7 18-10 30-10s22 3 30 10l10 65H70z" fill={`url(#${bodyGrad})`} />
        )}
        <path d="M84 155h52" stroke="#fff" strokeOpacity=".28" strokeWidth="4" strokeLinecap="round" />
        {outfit === "hoodie" && <><path d="M91 151q19 18 38 0" fill="none" stroke="#fff" strokeOpacity=".24" strokeWidth="3" /><path d="M104 155v25M116 155v25" stroke="#fff" strokeOpacity=".18" strokeWidth="2" /></>}
        {outfit === "jacket" && <path d="M110 145v76M84 181h52" stroke="#fff" strokeOpacity=".25" strokeWidth="3" />}
        {outfit === "tee" && <path d="M89 160h42" stroke="#fff" strokeOpacity=".2" strokeWidth="2" />}
        {outfit === "sport" && <><path d="M71 177h78" stroke="#fff" strokeOpacity=".32" strokeWidth="7" /><path d="M109 143v79" stroke="#fff" strokeOpacity=".2" strokeWidth="3" /></>}
        {outfit === "royal" && <path d="M96 151h28l-14 18z" fill="#ffd21a" opacity=".9" />}

        {/* neck */}
        <path d="M99 137v20q11 8 22 0v-20z" fill={`url(#${skinGrad})`} />

        {/* head */}
        <path d="M72 78c0-28 17-47 38-47s38 19 38 47v35c0 29-17 47-38 47s-38-18-38-47z" fill={`url(#${skinGrad})`} />
        <ellipse cx="91" cy="95" rx="6" ry="3" fill="#d58e79" opacity=".35" />
        <ellipse cx="129" cy="95" rx="6" ry="3" fill="#d58e79" opacity=".35" />

        {/* hair */}
        {hair === "long" && isGirl ? (
          <path d="M68 104c-7-40 10-72 42-72 35 0 49 30 40 72l-7 60-20-6v-56c0-25-5-37-13-37s-14 12-14 37v61l-22 2z" fill={`url(#${hairGrad})`} />
        ) : hair === "bob" && isGirl ? (
          <path d="M69 102c-5-39 11-70 41-70 32 0 47 27 41 70l-8 42h-18v-38c0-24-5-37-15-37s-15 13-15 37v38H76z" fill={`url(#${hairGrad})`} />
        ) : hair === "ponytail" && isGirl ? (
          <><path d="M72 103c-5-42 10-71 38-71 31 0 47 28 41 70l-9 36h-18v-40c0-23-5-35-14-35s-14 12-14 35v40H76z" fill={`url(#${hairGrad})`} /><path d="M148 63c28 4 29 28 12 40l-15-10z" fill={`url(#${hairGrad})`} /></>
        ) : hair === "curly" ? (
          <path d="M72 87c-8-30 10-57 39-57 31 0 48 27 38 58l-8-9-9 7-10-9-11 9-10-8-11 8z" fill={`url(#${hairGrad})`} />
        ) : hair === "fade" ? (
          <path d="M76 82c0-28 14-47 35-47 22 0 34 19 34 47-10-10-22-15-34-15s-24 5-35 15z" fill={`url(#${hairGrad})`} />
        ) : (
          <path d="M74 82c0-29 15-48 37-48 23 0 36 19 36 48-11-10-23-15-36-15s-26 5-37 15z" fill={`url(#${hairGrad})`} />
        )}
        <path d="M83 62q26-18 54 0" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="4" strokeLinecap="round" />

        {/* face */}
        {face === "cool" ? (
          <><rect x="80" y="89" width="25" height="13" rx="5" fill="#172231" opacity=".9" /><rect x="115" y="89" width="25" height="13" rx="5" fill="#172231" opacity=".9" /><path d="M105 94h10" stroke="#172231" strokeWidth="3" /></>
        ) : (
          <><ellipse cx="91" cy="95" rx="4" ry="5" fill={eye} /><ellipse cx="129" cy="95" rx="4" ry="5" fill={eye} /><circle cx="92" cy="93" r="1.4" fill="#fff" /><circle cx="130" cy="93" r="1.4" fill="#fff" /></>
        )}
        {face === "focused" && <path d="M83 84l15 3M122 87l15-3" stroke={eye} strokeWidth="3" strokeLinecap="round" />}
        {mouth}

        {/* accessories */}
        {accessory === "glasses" && <><rect x="77" y="87" width="29" height="17" rx="7" fill="none" stroke="#172231" strokeWidth="3" /><rect x="114" y="87" width="29" height="17" rx="7" fill="none" stroke="#172231" strokeWidth="3" /><path d="M106 92h8" stroke="#172231" strokeWidth="3" /></>}
        {accessory === "cap" && <><path d="M70 76c12-20 38-27 61-15 8 4 13 9 17 16-25-3-51-3-78 5z" fill={c.dark} /><path d="M137 75c15-1 24 2 29 7-13 4-23 2-29-2z" fill={c.base} /></>}
        {accessory === "headphones" && <><path d="M69 101a41 41 0 0 1 82 0" fill="none" stroke="#252d3b" strokeWidth="7" /><rect x="64" y="96" width="12" height="25" rx="6" fill="#252d3b" /><rect x="144" y="96" width="12" height="25" rx="6" fill="#252d3b" /></>}
        {accessory === "bow" && isGirl && <><path d="M79 60l-24-15 7 28z" fill={c.light}/><path d="M141 60l24-15-7 28z" fill={c.light}/><circle cx="110" cy="62" r="7" fill={c.base}/></>}
        {accessory === "earrings" && isGirl && <><circle cx="72" cy="119" r="4" fill="#ffd21a"/><circle cx="148" cy="119" r="4" fill="#ffd21a"/></>}

        {/* small signature highlight */}
        <ellipse cx="88" cy="69" rx="15" ry="6" fill="#fff" opacity=".13" transform="rotate(-25 88 69)" />
      </g>

      {avatarStyle === "ninja" && <path d="M65 111h90v22H65z" fill="#111b29" opacity=".9" />}
      {avatarStyle === "pilot" && <path d="M70 112h80v17H70z" fill="#9bdcff" opacity=".55" />}
      {avatarStyle === "robot" && <path d="M70 111h80v25H70z" fill={c.dark} opacity=".65" />}
      {avatarStyle === "wizard" && <path d="M66 56l44-44 44 44z" fill={c.dark} opacity=".9" />}
    </svg>
  );
}

export function Avatar({ name, you, size = 36, avatar }) {
  const ring = { "--tw-ring-color": you ? "#ffb020" : "rgba(255,255,255,0.15)" };
  if (avatar?.photo) return <img src={avatar.photo} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover ring-2" style={{ width:size, height:size, ...ring }} />;
  if (avatar?.builder) return <div className="shrink-0 overflow-hidden rounded-full ring-2" style={{ width:size, height:size, ...ring }}><GameAvatarArt {...avatar.builder} size={size} /></div>;
  const hue = avatar?.hue ?? [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return <div className="flex shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ring-2" style={{ width:size,height:size,background:`linear-gradient(145deg,hsl(${hue} 70% 50%),hsl(${(hue+40)%360} 70% 30%))`,...ring }}>{name.slice(0,2).toUpperCase()}</div>;
}

export function LeagueChip({ score }) {
  const l = getLeague(score);
  return <span className="inline-block rounded-full border px-1.5 py-[1px] text-[10px] font-black uppercase tracking-wide" style={{ color:l.color,borderColor:`${l.color}55`,background:`${l.color}14` }}>{l.name}</span>;
}

export { STYLE_LABELS };
