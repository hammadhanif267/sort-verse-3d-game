"use client";

import { useMemo } from "react";
import { scatter } from "@/lib/visualRandom";

// Same palette as the in-game celebration, so this reads as "this game"
// wherever it's used.
const PETAL_COLORS = ["#f0c018", "#2f86ff", "#e01f36", "#22a72f", "#7b2fd6", "#ffffff"];

/**
 * A one-shot burst of petals that float up from the middle of its parent
 * and fade out. Uses the `.celebration-petal` / `petal-rise` keyframes
 * already defined in globals.css for the level-complete trophy screen.
 * The parent must be `position: relative` (or absolute-positioned) with
 * `overflow-hidden` for the burst to stay contained.
 */
export function CelebrationPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
        left: 50 + (scatter(i, 1) - 0.5) * 78,
        rise: 180 + scatter(i, 2) * 140,
        drift: (scatter(i, 3) - 0.5) * 110,
        rotate: (scatter(i, 4) - 0.5) * 420,
        size: 7 + scatter(i, 5) * 7,
        delay: scatter(i, 6) * 260,
        duration: 900 + scatter(i, 7) * 450,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-[65] overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="celebration-petal absolute"
          style={{
            left: `${p.left}%`,
            bottom: "38%",
            width: p.size,
            height: p.size * 1.3,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            "--petal-rise": `-${p.rise}px`,
            "--petal-drift": `${p.drift}px`,
            "--petal-rotate": `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Small icons that fly out, spinning, and collect back toward the top —
 * the "coins/gems flying into your total" flourish. Uses the
 * `.reward-particle` / `reward-particle-fly` keyframes from globals.css.
 * The parent must be `position: relative` for the particles to anchor
 * to the right spot.
 */
export function FlyingRewards({ active, Icon, count = 6 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (scatter(i, 8) - 0.5) * 90,
        y: 26 + scatter(i, 9) * 26,
        rotate: (scatter(i, 10) - 0.5) * 360,
        delay: scatter(i, 11) * 140,
        duration: 520 + scatter(i, 12) * 200,
      })),
    [count],
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {particles.map((p) => (
        <span
          key={p.id}
          className="reward-particle absolute left-1/2 top-1/2"
          style={{
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            "--fx": `${p.x}px`,
            "--fy": `${p.y}px`,
            "--frot": `${p.rotate}deg`,
          }}
        >
          <Icon className="h-4 w-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]" />
        </span>
      ))}
    </div>
  );
}
