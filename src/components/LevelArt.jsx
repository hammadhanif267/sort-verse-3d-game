"use client";

/**
 * Crisp, vector level artwork.
 *
 * The original level thumbnails were AI-generated raster (.webp) images that were
 * inherently soft/low-detail — no amount of CSS or sharpening filters can turn a
 * blurry raster source into a sharp one. Vector art has no such limit: it renders
 * pixel-perfect at any size or pixel density, so it can never look "blurry".
 *
 * Each level gets a deterministic color palette (cycles through a curated set)
 * so the grid still feels varied, while every icon stays crisp.
 */

const PALETTES = [
  { glow: "#39c8ff", vials: ["#33c2ff", "#8b5cf6", "#ff5d7a"], liquid: ["#1ea0ff", "#7c3aed", "#ff3358"] },
  { glow: "#ffcf4d", vials: ["#ffd24d", "#ff9e42", "#33c2ff"], liquid: ["#ffb400", "#ff7a1a", "#1ea0ff"] },
  { glow: "#3df08a", vials: ["#3df08a", "#33c2ff", "#ff5d7a"], liquid: ["#12c76a", "#1ea0ff", "#ff3358"] },
  { glow: "#ff7ad9", vials: ["#ff7ad9", "#8b5cf6", "#ffd24d"], liquid: ["#ef4fbf", "#7c3aed", "#ffb400"] },
  { glow: "#ff8a5c", vials: ["#ff8a5c", "#3df08a", "#33c2ff"], liquid: ["#ff5a1f", "#12c76a", "#1ea0ff"] },
  { glow: "#9b8bff", vials: ["#9b8bff", "#ff5d7a", "#ffd24d"], liquid: ["#6f5cff", "#ff3358", "#ffb400"] },
];

function paletteFor(id) {
  return PALETTES[(id - 1) % PALETTES.length];
}

/** One vial. `bottom` is the fixed y all vials sit on; `height` grows upward from it. */
function Vial({ x, width, height, bottom, vialColor, liquidColor, seed = 0 }) {
  const top = bottom - height;
  const capW = width * 0.62;
  return (
    <g>
      <rect
        x={x}
        y={top}
        width={width}
        height={height}
        rx={width / 2.6}
        fill="rgba(255,255,255,0.08)"
        stroke={vialColor}
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <rect
        x={x + 1.4}
        y={top + height * 0.42}
        width={width - 2.8}
        height={height * 0.58 - 1.4}
        rx={(width - 2.8) / 2.8}
        fill={liquidColor}
        fillOpacity="0.9"
      />
      <rect x={x + (width - capW) / 2} y={top - 3} width={capW} height={5} rx={2} fill={vialColor} fillOpacity="0.8" />
      <rect x={x + width * 0.16} y={top + 3} width={width * 0.16} height={height * 0.5} rx={2} fill="#ffffff" fillOpacity="0.22" />
      <circle cx={x + width * 0.62 + (seed % 3)} cy={top + height * 0.68} r={width * 0.11} fill="#ffffff" fillOpacity="0.35" />
    </g>
  );
}

export default function LevelArt({ id, className = "" }) {
  const p = paletteFor(id);
  const heights = [14, 20, 16];
  const positions = [17, 42, 67];
  const vialBottom = 58;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`Level ${id} artwork`}
    >
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="24%" r="60%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.35" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`floor-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e2a3f" />
          <stop offset="100%" stopColor="#04121e" />
        </linearGradient>
      </defs>

      <rect width="100" height="100" fill="#051627" />
      <rect width="100" height="100" fill={`url(#glow-${id})`} />

      {/* floor platform, sits just under the vials */}
      <path d="M10 62 L50 52 L90 62 L50 72 Z" fill={`url(#floor-${id})`} stroke={p.glow} strokeOpacity="0.18" />

      {positions.map((x, i) => (
        <Vial
          key={i}
          x={x}
          width={16}
          height={heights[i]}
          bottom={vialBottom}
          vialColor={p.vials[i]}
          liquidColor={p.liquid[i]}
          seed={id + i}
        />
      ))}
    </svg>
  );
}
