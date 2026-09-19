"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayerStats } from "@/lib/playerStats";
import Link from "next/link";
import { CoinIcon, GemIcon } from "@/components/icons";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  Float,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";

/* =========================================================
   SORTVERSE 3D
   STEP 3D — REAL DRAG & DROP
========================================================= */

const CAPACITY = 4;

// Object colours, matched to the reference artwork: saturated candy plastic
// with a bright specular, not neon.
const COLORS = {
  blue: "#1f6ff0",
  red: "#e01f36",
  yellow: "#f5c518",
  green: "#1fbd4a",
  purple: "#7b2fe0",
};

// The anodised metal cap and base of a tube pick up the colour of whatever it
// holds, a shade lighter than the objects themselves.
const TUBE_COLORS = {
  blue: "#2f86ff",
  red: "#f03048",
  yellow: "#ffd02b",
  green: "#2ad45c",
  purple: "#9448f5",
};

const TOTAL_TUBES = 8;
const PALETTE_ORDER = ["blue", "red", "yellow", "green", "purple"];
const SHAPE_BY_COLOR = {
  blue: "sphere",
  red: "cube",
  yellow: "star",
  green: "triangle",
  purple: "triangle",
};
const DIFFICULTY_TIER = { normal: 0, hard: 1, expert: 2 };

/* =========================================================
   DIFFICULTY SCALING
   - colorCount: how many colors are in play (more = harder)
   - emptyTubes: spare tubes to maneuver with (fewer = harder)
   - timeSeconds: time budget for the HUD countdown
   Normal stays gentle (caps at 4 colors), Hard and Expert push
   further so each tier reads as noticeably tougher than the last.
========================================================= */
export function difficultyParams(level, difficulty) {
  const tierIndex = DIFFICULTY_TIER[difficulty] ?? 0;
  const progression = Math.min(Math.floor((level - 1) / 4), 2); // levels 1-4 / 5-8 / 9-12
  const capByTier = [4, 5, 5];

  const colorCount = Math.min(
    Math.max(3 + tierIndex + progression, 3),
    capByTier[tierIndex],
  );

  const baseEmptyByTier = [3, 2, 1];
  const emptyTubes = Math.min(
    Math.max(baseEmptyByTier[tierIndex] - progression, 1),
    TOTAL_TUBES - colorCount,
  );

  // Professional-feel time budgets: Normal stays comfortable, Hard is
  // noticeably tighter, Expert is the real crunch — and each still eases
  // down a little across its own 12 levels.
  const baseSecondsByTier = [90, 75, 60];
  const decayPerLevelByTier = [2, 3, 4];
  const minSecondsByTier = [45, 35, 25];

  const timeSeconds = Math.max(
    minSecondsByTier[tierIndex],
    baseSecondsByTier[tierIndex] - (level - 1) * decayPerLevelByTier[tierIndex],
  );

  return { colorCount, emptyTubes, timeSeconds };
}

function hashSeed(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Small seeded RNG so the same level+difficulty always deals the same
// (but still shuffled) puzzle — fair to replay, different from every
// other level.
function mulberry32(seed) {
  let a = seed | 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePuzzle({ level, difficulty }) {
  const { colorCount, emptyTubes } = difficultyParams(level, difficulty);
  const nonEmptyCount = TOTAL_TUBES - emptyTubes;
  const rng = mulberry32(hashSeed(`${difficulty}:${level}`));
  const colors = PALETTE_ORDER.slice(0, colorCount);

  // Bag of objects: exactly CAPACITY copies of each color in play.
  const bag = [];
  colors.forEach((color) => {
    for (let i = 0; i < CAPACITY; i++) {
      bag.push({ id: `${color}-${i}-${level}-${difficulty}`, color, type: SHAPE_BY_COLOR[color] });
    }
  });

  // Seeded shuffle (Fisher–Yates)
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }

  // Deal into the filled tubes, respecting capacity.
  const slots = Array.from({ length: nonEmptyCount }, () => []);
  bag.forEach((object) => {
    const options = slots
      .map((slot, index) => index)
      .filter((index) => slots[index].length < CAPACITY);
    const pick = options[Math.floor(rng() * options.length)];
    slots[pick].push(object);
  });

  // Extremely unlikely, but guard against dealing an already-solved board.
  const alreadySolved = slots.every(
    (slot) =>
      slot.length === 0 ||
      (slot.length === CAPACITY && slot.every((o) => o.color === slot[0].color)),
  );
  if (alreadySolved) {
    outer: for (let a = 0; a < slots.length; a++) {
      for (let b = a + 1; b < slots.length; b++) {
        if (slots[a].length && slots[b].length) {
          const tmp = slots[a][0];
          slots[a][0] = slots[b][0];
          slots[b][0] = tmp;
          break outer;
        }
      }
    }
  }

  const filledTubes = slots.map((objects, index) => ({
    id: index,
    color: objects[0]?.color || colors[index % colors.length],
    objects,
  }));

  const emptyTubesList = Array.from({ length: emptyTubes }, (_, i) => ({
    id: nonEmptyCount + i,
    color: colors[i % colors.length],
    objects: [],
  }));

  const allTubes = [...filledTubes, ...emptyTubesList];

  // Seeded shuffle of tube order so empties aren't always at the end.
  for (let i = allTubes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [allTubes[i], allTubes[j]] = [allTubes[j], allTubes[i]];
  }

  return allTubes.map((tube, index) => ({ ...tube, id: index }));
}

export default function GameplayScene({
  level = 1,
  difficulty = "normal",
  onTimeChange,
  paused = false,
  onTogglePause,
}) {
  const { timeSeconds: initialTime } = difficultyParams(level, difficulty);

  const [tubes, setTubes] = useState(() => generatePuzzle({ level, difficulty }));
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Drag an object to sort it");
  const [sceneReady, setSceneReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [timeUp, setTimeUp] = useState(false);
  const { addRewards, completeLevel } = usePlayerStats();
  const rewardRecorded = useRef(false);

  const completed = useMemo(() => {
    return tubes.every((tube) => {
      if (tube.objects.length === 0) return true;

      return (
        tube.objects.length === CAPACITY &&
        tube.objects.every((object) => object.color === tube.objects[0].color)
      );
    });
  }, [tubes]);

  const earnedStars = moves <= 12 ? 3 : moves <= 18 ? 2 : 1;
  const coinReward = 100 * level;
  const diamondReward = earnedStars;

  // Real-time countdown — ticks every second, stops on win/loss, and is
  // reported up to the page header so the HUD timer is never a static value.
  useEffect(() => {
    onTimeChange?.(timeLeft);
  }, [timeLeft, onTimeChange]);

  useEffect(() => {
    if (completed || timeUp || paused) return undefined;

    if (timeLeft <= 0) {
      setTimeUp(true);
      return undefined;
    }

    const timeout = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timeout);
  }, [timeLeft, completed, timeUp, paused]);

  useEffect(() => {
    if (!completed || rewardRecorded.current) return;
    rewardRecorded.current = true;

    const progressKey = "sortverse-difficulty-progress";
    const starsKey = "sortverse-level-stars";
    const rewardsKey = "sortverse-level-rewards";
    let progress = { normal: 0, hard: 0, expert: 0 };
    let stars = {};
    let rewards = {};

    try {
      progress = { ...progress, ...(JSON.parse(window.localStorage.getItem(progressKey) || "{}")) };
      stars = JSON.parse(window.localStorage.getItem(starsKey) || "{}");
      rewards = JSON.parse(window.localStorage.getItem(rewardsKey) || "{}");
    } catch {}

    const entryId = `${difficulty}-${level}`;

    progress[difficulty] = Math.max(Number(progress[difficulty]) || 0, level);
    stars[entryId] = Math.max(Number(stars[entryId]) || 0, earnedStars);
    rewards[entryId] = {
      coins: Math.max(Number(rewards[entryId]?.coins) || 0, coinReward),
      diamonds: Math.max(Number(rewards[entryId]?.diamonds) || 0, diamondReward),
    };

    window.localStorage.setItem(progressKey, JSON.stringify(progress));
    window.localStorage.setItem(starsKey, JSON.stringify(stars));
    window.localStorage.setItem(rewardsKey, JSON.stringify(rewards));
    window.dispatchEvent(new Event("sortverse-progress"));

    if (difficulty === "normal") {
      completeLevel({ coins: coinReward, diamonds: diamondReward });
    } else {
      addRewards({ coins: coinReward, diamonds: diamondReward });
    }
  }, [completed, completeLevel, addRewards, difficulty, earnedStars, level, coinReward, diamondReward]);

  const handleObjectStart = useCallback((tubeId, objectIndex, object) => {
    if (paused) return;

    setDragging({
      tubeId,
      objectIndex,
      object,
    });

    setSelected({
      tubeId,
      objectIndex,
    });

    setMessage("Drop into a matching tube");
  }, [paused]);

  const handleObjectEnd = useCallback(
    (targetTubeId) => {
      if (!dragging) return;

      const sourceTubeId = dragging.tubeId;

      if (sourceTubeId === targetTubeId) {
        setDragging(null);
        setSelected(null);
        setMessage("Choose another tube");
        return;
      }

      setTubes((current) => {
        const next = current.map((tube) => ({
          ...tube,
          objects: [...tube.objects],
        }));

        const source = next.find((tube) => tube.id === sourceTubeId);
        const target = next.find((tube) => tube.id === targetTubeId);

        if (!source || !target) return current;

        const object = source.objects[source.objects.length - 1];

        if (!object) return current;

        const targetTop = target.objects[target.objects.length - 1];

        const validTarget =
          target.objects.length < CAPACITY &&
          (!targetTop || targetTop.color === object.color);

        if (!validTarget) {
          return current;
        }

        source.objects.pop();
        target.objects.push(object);

        return next;
      });

      setMoves((value) => value + 1);
      setDragging(null);
      setSelected(null);
      setMessage("Nice move!");
    },
    [dragging],
  );

  const handleInvalidDrop = useCallback(() => {
    if (!dragging) return;

    setDragging(null);
    setSelected(null);
    setMessage("That object cannot go there");
  }, [dragging]);

  const resetGame = useCallback(() => {
    setTubes(generatePuzzle({ level, difficulty }));
    setSelected(null);
    setDragging(null);
    setMoves(0);
    setMessage("Drag an object to sort it");
    rewardRecorded.current = false;
    setTimeLeft(initialTime);
    setTimeUp(false);
  }, [level, difficulty, initialTime]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      {!sceneReady && <FastTubePreview />}
      <Canvas
        className="relative z-10"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          requestAnimationFrame(() => setSceneReady(true));
        }}
        shadows
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 1.1, 11.5]}
          fov={52}
          near={0.1}
          far={100}
        />

        <fog attach="fog" args={["#02101d", 9, 26]} />

        {/* Soft fill so nothing goes pure black against the factory plate */}
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#bfe9ff", "#06243a", 1.1]} />

        {/* Key light, slightly to the right and above, like the reference */}
        <directionalLight
          position={[4.5, 8, 7]}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        {/* Cool rim from behind-left carves the glass edges out of the dark */}
        <directionalLight position={[-6, 3, -4]} intensity={1.5} color="#63d4ff" />

        {/* Practical lights that mimic the factory strip lighting */}
        <pointLight position={[0, 3.4, 4.5]} intensity={5.5} distance={16} color="#8fe4ff" />
        <pointLight position={[-5, 0.4, 2.5]} intensity={3} distance={12} color="#2f8dff" />
        <pointLight position={[5, -1.2, 2.5]} intensity={2.6} distance={12} color="#ffb347" />

        <PuzzlePlatform position={[0, -0.03, -0.08]} />
        <PuzzlePlatform position={[0, -2.83, -0.08]} />

        {/* =================================================
            INTERACTIVE TUBES
        ================================================= */}

        <InteractiveTube
          tube={tubes[0]}
          position={[-2.1, 1.35, 0]}
          selected={selected?.tubeId === 0}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[1]}
          position={[-0.7, 1.35, 0]}
          selected={selected?.tubeId === 1}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[2]}
          position={[0.7, 1.35, 0]}
          selected={selected?.tubeId === 2}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[3]}
          position={[2.1, 1.35, 0]}
          selected={selected?.tubeId === 3}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[4]}
          position={[-2.1, -1.45, 0]}
          selected={selected?.tubeId === 4}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[5]}
          position={[-0.7, -1.45, 0]}
          selected={selected?.tubeId === 5}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[6]}
          position={[0.7, -1.45, 0]}
          selected={selected?.tubeId === 6}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <InteractiveTube
          tube={tubes[7]}
          position={[2.1, -1.45, 0]}
          selected={selected?.tubeId === 7}
          dragging={dragging}
          onObjectStart={handleObjectStart}
          onTubeDrop={handleObjectEnd}
          onInvalidDrop={handleInvalidDrop}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* =================================================
          STATUS
      ================================================= */}

      <div className="pointer-events-none absolute bottom-[86px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-cyan-300/15 bg-[#031a2a]/80 px-3 py-1.5 text-[9px] font-semibold text-cyan-100/65 backdrop-blur">
        Moves: {moves} · {message}
      </div>

      {/* Drag & Drop hint — only shown before the player's first move */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-4 left-1/2 z-30 w-[78%] -translate-x-1/2 transition-all duration-500 ${
          moves === 0 && !completed && !timeUp && !paused
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-cyan-300/25 bg-[#06243a]/90 px-4 py-3 text-center shadow-[0_10px_35px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl font-light text-cyan-200/65">←</span>

            <div>
              <div className="text-sm font-black">Drag &amp; Drop</div>

              <div className="mt-0.5 text-[9px] font-medium text-white/60">
                to sort the objects
              </div>
            </div>

            <span className="text-2xl font-light text-cyan-200/65">→</span>
          </div>
        </div>
      </div>

      {completed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020b15]/70 px-6 backdrop-blur-sm">
          <div className="w-full rounded-3xl border border-cyan-300/30 bg-[#06243a]/95 p-6 text-center shadow-[0_0_50px_rgba(0,190,255,0.2)]">
            <div className="text-4xl">🏆</div>

            <h2 className="mt-3 text-2xl font-black">Level Complete!</h2>

            <p className="mt-1 text-xs text-white/60">
              Great job! All objects are sorted.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-[#041a2b]/75 px-3 py-2.5">
                <div className="text-[8px] uppercase tracking-[0.18em] text-white/40">Stars</div>
                <div className="mt-1 text-lg font-black text-yellow-300">{"★".repeat(earnedStars)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#041a2b]/75 px-3 py-2.5">
                <div className="text-[8px] uppercase tracking-[0.18em] text-white/40">Reward</div>
                <div className="mt-1 flex items-center justify-center gap-3 text-sm font-black">
                  <span className="inline-flex items-center gap-1.5 text-yellow-300"><span>+{100 * level}</span><CoinIcon className="h-4 w-4" /></span>
                  <span className="inline-flex items-center gap-1.5 text-violet-200"><span>+{earnedStars}</span><GemIcon className="h-4 w-4" /></span>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white/5 py-3">
              <div className="text-[9px] uppercase tracking-widest text-white/40">
                Moves
              </div>

              <div className="mt-1 text-xl font-black text-cyan-300">
                {moves}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {level < 12 ? (
                <Link
                  href={`/gameplay?level=${level + 1}&difficulty=${difficulty}`}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-b from-[#38cfff] to-[#0879cf] py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(0,190,255,.22)] transition active:scale-[0.98]"
                >
                  Next Level
                </Link>
              ) : (
                <Link
                  href="/levels"
                  className="flex items-center justify-center rounded-xl bg-gradient-to-b from-[#38cfff] to-[#0879cf] py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(0,190,255,.22)] transition active:scale-[0.98]"
                >
                  Levels
                </Link>
              )}
              <button
                onClick={resetGame}
                className="rounded-xl border border-cyan-300/25 bg-[#0a3048] py-3 text-sm font-black text-cyan-100 transition active:scale-[0.98]"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {timeUp && !completed && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020b15]/70 px-6 backdrop-blur-sm">
          <div className="w-full rounded-3xl border border-red-400/30 bg-[#3a0808]/95 p-6 text-center shadow-[0_0_50px_rgba(255,60,60,0.18)]">
            <div className="text-4xl">⏰</div>

            <h2 className="mt-3 text-2xl font-black">Time&apos;s Up!</h2>

            <p className="mt-1 text-xs text-white/60">
              You ran out of time — give this level another try.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={resetGame}
                className="rounded-xl bg-gradient-to-b from-[#ff5a5a] to-[#c81f1f] py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(255,60,60,.25)] transition active:scale-[0.98]"
              >
                Retry
              </button>

              <Link
                href="/levels"
                className="flex items-center justify-center rounded-xl border border-red-300/25 bg-[#210606] py-3 text-sm font-black text-red-100 transition active:scale-[0.98]"
              >
                Levels
              </Link>
            </div>
          </div>
        </div>
      )}

      {paused && !completed && !timeUp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020b15]/80 px-6 backdrop-blur-md">
          <div className="w-full rounded-3xl border border-cyan-300/30 bg-[#06243a]/95 p-6 text-center shadow-[0_0_50px_rgba(0,190,255,0.2)]">
            <div className="text-4xl">⏸️</div>

            <h2 className="mt-3 text-2xl font-black">Paused</h2>

            <p className="mt-1 text-xs text-white/60">
              The timer and the puzzle are on hold — resume whenever you're ready.
            </p>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={onTogglePause}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#38cfff] to-[#0879cf] py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(0,190,255,.22)] transition active:scale-[0.98]"
              >
                ▶ Resume
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    resetGame();
                    onTogglePause?.();
                  }}
                  className="rounded-xl border border-cyan-300/25 bg-[#0a3048] py-3 text-sm font-black text-cyan-100 transition active:scale-[0.98]"
                >
                  Restart
                </button>

                <Link
                  href="/"
                  className="flex items-center justify-center rounded-xl border border-cyan-300/25 bg-[#0a3048] py-3 text-sm font-black text-cyan-100 transition active:scale-[0.98]"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={resetGame}
        className="absolute bottom-[88px] right-3 z-30 rounded-full border border-white/10 bg-[#06243a]/80 px-2.5 py-1.5 text-[8px] font-bold text-white/45 backdrop-blur transition hover:text-white/80"
      >
        Reset
      </button>
    </div>
  );
}

function FastTubePreview() {
  const tubes = [
    ["#169dff", "●"],
    ["#ff344b", "◆"],
    ["#ffc72b", "★"],
    ["#1edc5d", "▲"],
  ];

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-3 pb-24 transition-opacity">
      {tubes.map(([color, shape]) => (
        <div key={color} className="relative h-40 w-[52px] rounded-b-2xl border-x-2 border-b-2 border-cyan-100/50 bg-gradient-to-r from-white/20 via-white/5 to-white/15 shadow-[inset_0_0_14px_rgba(130,225,255,.2)]">
          <span className="absolute -left-1 -right-1 -top-1 h-3 rounded-full border border-white/60 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color }} />
          {[0, 1, 2].map((item) => (
            <span key={item} className="absolute left-1/2 -translate-x-1/2 text-2xl font-black drop-shadow-[0_0_7px_currentColor]" style={{ bottom: `${18 + item * 38}px`, color }}>{shape}</span>
          ))}
          <span className="absolute -bottom-1 -left-1 -right-1 h-3 rounded-full border border-white/50" style={{ backgroundColor: color }} />
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   SHELF
   Brushed-metal slab the tubes stand on: a bevelled body, a
   lighter machined top plate, a cyan edge strip and angled
   supports — the same silhouette as the reference artwork.
========================================================= */

function PuzzlePlatform({ position }) {
  return (
    <group position={position}>
      {/* Main body */}
      <RoundedBox args={[6.8, 0.36, 1.5]} radius={0.09} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#2a4964" metalness={0.9} roughness={0.34} />
      </RoundedBox>

      {/* Machined top plate the tubes actually sit on */}
      <RoundedBox
        args={[6.45, 0.12, 1.26]}
        radius={0.04}
        smoothness={4}
        position={[0, 0.22, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#8aa8bd" metalness={0.95} roughness={0.22} />
      </RoundedBox>

      {/* Darker recessed front face */}
      <mesh position={[0, -0.05, 0.74]}>
        <boxGeometry args={[6.4, 0.2, 0.03]} />
        <meshStandardMaterial color="#14283a" metalness={0.8} roughness={0.45} />
      </mesh>

      {/* Cyan edge strip */}
      <mesh position={[0, -0.16, 0.755]}>
        <boxGeometry args={[6.0, 0.06, 0.03]} />
        <meshStandardMaterial color="#35c8ff" emissive="#0f9ede" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      {/* Angled side supports */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 3.2, -0.14, 0]} rotation={[0, 0, side * 0.22]} castShadow>
          <boxGeometry args={[0.2, 0.52, 1.38]} />
          <meshStandardMaterial color="#16293a" metalness={0.86} roughness={0.32} />
        </mesh>
      ))}

      {/* Warm under-glow, like light bouncing off the factory floor */}
      <mesh position={[0, -0.24, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.2, 0.9]} />
        <meshBasicMaterial color="#0a2a44" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* =========================================================
   INTERACTIVE TUBE
   Thick borosilicate-looking glass with a metal cap and base
   in the colour of its contents.
========================================================= */

function InteractiveTube({
  tube,
  position,
  selected,
  dragging,
  onObjectStart,
  onTubeDrop,
  onInvalidDrop,
}) {
  const topObjectIndex = tube.objects.length - 1;

  const tubeColor =
    TUBE_COLORS[tube.objects[0]?.color] || TUBE_COLORS[tube.color] || "#2f86ff";

  return (
    <group position={position}>
      {/* Invisible drop area — larger than the glass so drops feel forgiving */}
      <mesh
        onPointerUp={(event) => {
          event.stopPropagation();
          onTubeDrop(tube.id);
        }}
        onPointerMissed={() => {
          if (dragging) onInvalidDrop();
        }}
      >
        <cylinderGeometry args={[0.6, 0.6, 2.6, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Glass barrel */}
      <mesh position={[0, 0.05, 0]} renderOrder={2}>
        <cylinderGeometry args={[0.42, 0.42, 2.2, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#cdefff"
          transparent
          opacity={0.22}
          roughness={0.04}
          metalness={0}
          transmission={0.6}
          thickness={0.4}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Rounded glass floor */}
      <mesh position={[0, -1.02, 0]} scale={[1, 0.45, 1]} renderOrder={2}>
        <sphereGeometry args={[0.42, 32, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#cdefff"
          transparent
          opacity={0.24}
          roughness={0.05}
          transmission={0.55}
          thickness={0.4}
          ior={1.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Specular streaks down the glass — what sells it as real glass */}
      <mesh position={[-0.2, 0.1, 0.4]} rotation={[0, 0.35, 0]} renderOrder={3}>
        <planeGeometry args={[0.07, 1.85]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[0.26, 0.05, 0.36]} rotation={[0, -0.45, 0]} renderOrder={3}>
        <planeGeometry args={[0.035, 1.6]} />
        <meshBasicMaterial color="#d9f4ff" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Metal cap */}
      <group position={[0, 1.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.47, 0.47, 0.2, 48]} />
          <meshStandardMaterial
            color={tubeColor}
            metalness={0.85}
            roughness={0.24}
            emissive={tubeColor}
            emissiveIntensity={selected ? 0.75 : 0.28}
          />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.43, 0.47, 0.06, 48]} />
          <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.15} opacity={0.75} transparent />
        </mesh>
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.035, 12, 48]} />
          <meshStandardMaterial
            color={tubeColor}
            emissive={tubeColor}
            emissiveIntensity={selected ? 2.2 : 1.1}
            metalness={0.7}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Metal base */}
      <group position={[0, -1.15, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.47, 0.52, 0.22, 48]} />
          <meshStandardMaterial
            color={tubeColor}
            metalness={0.82}
            roughness={0.28}
            emissive={tubeColor}
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.032, 12, 48]} />
          <meshStandardMaterial
            color={tubeColor}
            emissive={tubeColor}
            emissiveIntensity={0.85}
            metalness={0.7}
            roughness={0.22}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.5, 0.42, 0.08, 48]} />
          <meshStandardMaterial color="#15293a" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Contents */}
      {tube.objects.map((object, index) => (
        <DraggableObject
          key={object.id}
          object={object}
          position={[0, -0.62 + index * 0.5, index === topObjectIndex ? 0.04 : 0]}
          tubeId={tube.id}
          objectIndex={index}
          draggable={index === topObjectIndex}
          onStart={onObjectStart}
        />
      ))}
    </group>
  );
}

/* =========================================================
   OBJECT GEOMETRY
   Flat-facing extruded shapes so a star reads as a star from
   the fixed camera, exactly like the reference board.
========================================================= */

const EXTRUDE = {
  depth: 0.16,
  bevelEnabled: true,
  bevelSegments: 4,
  bevelSize: 0.045,
  bevelThickness: 0.04,
  curveSegments: 12,
};

function buildStarGeometry() {
  const shape = new THREE.Shape();
  const outer = 0.3;
  const inner = 0.14;

  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, EXTRUDE).center();
}

function buildTriangleGeometry() {
  const shape = new THREE.Shape();
  const radius = 0.32;

  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, EXTRUDE).center();
}

// Built once and shared by every object on the board.
const STAR_GEOMETRY = buildStarGeometry();
const TRIANGLE_GEOMETRY = buildTriangleGeometry();

/* =========================================================
   DRAGGABLE OBJECT
========================================================= */

function DraggableObject({
  object,
  position,
  tubeId,
  objectIndex,
  draggable,
  onStart,
}) {
  const [hovered, setHovered] = useState(false);

  const handlePointerDown = (event) => {
    if (!draggable) return;
    event.stopPropagation();
    onStart(tubeId, objectIndex, object);
  };

  const scale = hovered && draggable ? 1.12 : 1;
  const color = COLORS[object.color];

  // Glossy injection-moulded plastic: strong clearcoat highlight, just a
  // touch of self-illumination so the colours stay vivid in the dark scene.
  const material = (
    <meshPhysicalMaterial
      color={color}
      emissive={color}
      emissiveIntensity={0.14}
      metalness={0.12}
      roughness={0.3}
      clearcoat={1}
      clearcoatRoughness={0.12}
      sheen={0.4}
      sheenColor="#ffffff"
    />
  );

  return (
    <Float
      speed={draggable ? 1.2 : 0.6}
      rotationIntensity={draggable ? 0.08 : 0.02}
      floatIntensity={0.025}
    >
      <group
        position={position}
        scale={scale}
        onPointerDown={handlePointerDown}
        onPointerEnter={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = draggable ? "grab" : "default";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        {object.type === "sphere" && (
          <mesh castShadow>
            <sphereGeometry args={[0.25, 32, 32]} />
            {material}
          </mesh>
        )}

        {object.type === "cube" && (
          <RoundedBox args={[0.4, 0.4, 0.38]} radius={0.08} smoothness={4} castShadow>
            {material}
          </RoundedBox>
        )}

        {object.type === "triangle" && (
          <mesh geometry={TRIANGLE_GEOMETRY} castShadow>
            {material}
          </mesh>
        )}

        {object.type === "star" && (
          <mesh geometry={STAR_GEOMETRY} castShadow>
            {material}
          </mesh>
        )}
      </group>
    </Float>
  );
}
