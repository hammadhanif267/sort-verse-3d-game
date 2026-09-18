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
} from "@react-three/drei";

/* =========================================================
   SORTVERSE 3D
   STEP 3D — REAL DRAG & DROP
========================================================= */

const CAPACITY = 4;

const COLORS = {
  blue: "#197cff",
  red: "#ff3045",
  yellow: "#ffd229",
  green: "#18d85d",
  purple: "#963cff",
};

const TUBE_COLORS = {
  blue: "#1599ff",
  red: "#ff3150",
  yellow: "#ffc51b",
  green: "#19d45b",
  purple: "#914cff",
};

const INITIAL_TUBES = [
  {
    id: 0,
    color: "blue",
    objects: [
      { id: "b1", type: "sphere", color: "blue" },
      { id: "r1", type: "cube", color: "red" },
      { id: "b2", type: "sphere", color: "blue" },
    ],
  },
  {
    id: 1,
    color: "red",
    objects: [
      { id: "y1", type: "star", color: "yellow" },
      { id: "r2", type: "cube", color: "red" },
      { id: "g1", type: "triangle", color: "green" },
    ],
  },
  {
    id: 2,
    color: "yellow",
    objects: [
      { id: "g2", type: "triangle", color: "green" },
      { id: "y2", type: "star", color: "yellow" },
      { id: "r3", type: "cube", color: "red" },
    ],
  },
  {
    id: 3,
    color: "green",
    objects: [
      { id: "b3", type: "sphere", color: "blue" },
      { id: "g3", type: "triangle", color: "green" },
      { id: "y3", type: "star", color: "yellow" },
    ],
  },
  {
    id: 4,
    color: "purple",
    objects: [
      { id: "p1", type: "triangle", color: "purple" },
      { id: "p2", type: "triangle", color: "purple" },
    ],
  },
  {
    id: 5,
    color: "blue",
    objects: [
      { id: "r4", type: "cube", color: "red" },
      { id: "b4", type: "sphere", color: "blue" },
    ],
  },
  {
    id: 6,
    color: "yellow",
    objects: [
      { id: "g4", type: "triangle", color: "green" },
      { id: "y4", type: "star", color: "yellow" },
    ],
  },
  {
    id: 7,
    color: "green",
    objects: [
      { id: "p3", type: "triangle", color: "purple" },
      { id: "p4", type: "triangle", color: "purple" },
    ],
  },
];

export default function GameplayScene({ level = 1, difficulty = "normal" }) {
  const [tubes, setTubes] = useState(INITIAL_TUBES);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Drag an object to sort it");
  const [sceneReady, setSceneReady] = useState(false);
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

  useEffect(() => {
    if (!completed || rewardRecorded.current) return;
    rewardRecorded.current = true;

    const progressKey = "sortverse-difficulty-progress";
    const starsKey = "sortverse-level-stars";
    let progress = { normal: 0, hard: 0, expert: 0 };
    let stars = {};

    try {
      progress = { ...progress, ...(JSON.parse(window.localStorage.getItem(progressKey) || "{}")) };
      stars = JSON.parse(window.localStorage.getItem(starsKey) || "{}");
    } catch {}

    progress[difficulty] = Math.max(Number(progress[difficulty]) || 0, level);
    stars[`${difficulty}-${level}`] = Math.max(Number(stars[`${difficulty}-${level}`]) || 0, earnedStars);

    window.localStorage.setItem(progressKey, JSON.stringify(progress));
    window.localStorage.setItem(starsKey, JSON.stringify(stars));
    window.dispatchEvent(new Event("sortverse-progress"));

    const coinReward = 100 * level;
    const diamondReward = earnedStars;
    if (difficulty === "normal") {
      completeLevel({ coins: coinReward, diamonds: diamondReward });
    } else {
      addRewards({ coins: coinReward, diamonds: diamondReward });
    }
  }, [completed, completeLevel, difficulty, earnedStars, level]);

  const handleObjectStart = useCallback((tubeId, objectIndex, object) => {
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
  }, []);

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
    setTubes(INITIAL_TUBES);
    setSelected(null);
    setDragging(null);
    setMoves(0);
    setMessage("Drag an object to sort it");
    rewardRecorded.current = false;
  }, []);

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

        <fog attach="fog" args={["#020b15", 8, 22]} />

        <ambientLight intensity={1.7} />

        <directionalLight
          position={[4, 8, 7]}
          intensity={3.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <pointLight
          position={[0, 4, 3]}
          intensity={7}
          distance={14}
          color="#22cfff"
        />

        <pointLight
          position={[-5, 0, 0]}
          intensity={3.5}
          distance={11}
          color="#187cff"
        />

        <pointLight
          position={[5, -1, 1]}
          intensity={3}
          distance={10}
          color="#00aaff"
        />

        <PuzzlePlatform position={[0, 0.03, -0.08]} />
        <PuzzlePlatform position={[0, -2.77, -0.08]} />

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

function PuzzlePlatform({ position }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6.7, 0.28, 1.45]} />
        <meshStandardMaterial color="#263e51" metalness={0.88} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.25, 0.1, 1.22]} />
        <meshStandardMaterial color="#7997aa" metalness={0.92} roughness={0.18} />
      </mesh>
      <mesh position={[0, -0.18, 0.73]}>
        <boxGeometry args={[5.95, 0.08, 0.045]} />
        <meshStandardMaterial color="#20bfff" emissive="#0b8fd1" emissiveIntensity={1.15} />
      </mesh>
      <mesh position={[-3.12, -0.1, 0.02]} rotation={[0, 0, -0.24]}>
        <boxGeometry args={[0.16, 0.45, 1.35]} />
        <meshStandardMaterial color="#162a3a" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[3.12, -0.1, 0.02]} rotation={[0, 0, 0.24]}>
        <boxGeometry args={[0.16, 0.45, 1.35]} />
        <meshStandardMaterial color="#162a3a" metalness={0.85} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* =========================================================
   INTERACTIVE TUBE
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
    TUBE_COLORS[tube.objects[0]?.color] || TUBE_COLORS[tube.color] || "#1599ff";

  return (
    <group position={position}>
      {/* Invisible drop area */}
      <mesh
        position={[0, 0, 0]}
        onPointerUp={(event) => {
          event.stopPropagation();
          onTubeDrop(tube.id);
        }}
        onPointerMissed={() => {
          if (dragging) onInvalidDrop();
        }}
      >
        <cylinderGeometry args={[0.58, 0.58, 2.5, 24]} />

        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Glass */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 2.25, 40, 1, true]} />

        <meshPhysicalMaterial
          color="#9de6ff"
          transparent
          opacity={0.17}
          roughness={0.08}
          metalness={0.08}
          transmission={0.35}
          thickness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Top ring */}
      <mesh position={[0, 1.18, 0]}>
        <torusGeometry args={[0.4, 0.055, 14, 40]} />

        <meshStandardMaterial
          color={tubeColor}
          emissive={tubeColor}
          emissiveIntensity={selected ? 2 : 1.25}
          metalness={0.7}
          roughness={0.18}
        />
      </mesh>

      {/* Bottom ring */}
      <mesh position={[0, -1.08, 0]}>
        <torusGeometry args={[0.4, 0.05, 14, 40]} />

        <meshStandardMaterial
          color={tubeColor}
          emissive={tubeColor}
          emissiveIntensity={0.8}
          metalness={0.65}
          roughness={0.22}
        />
      </mesh>

      {/* Base */}
      <mesh position={[0, -1.16, 0]} castShadow>
        <cylinderGeometry args={[0.49, 0.56, 0.18, 40]} />

        <meshStandardMaterial
          color="#142b3c"
          metalness={0.9}
          roughness={0.23}
        />
      </mesh>

      {/* Objects */}
      {tube.objects.map((object, index) => (
        <DraggableObject
          key={object.id}
          object={object}
          position={[
            0,
            -0.66 + index * 0.52,
            index === topObjectIndex ? 0.05 : 0,
          ]}
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
            <sphereGeometry args={[0.245, 28, 28]} />

            <meshStandardMaterial
              color={COLORS[object.color]}
              emissive={COLORS[object.color]}
              emissiveIntensity={0.35}
              metalness={0.2}
              roughness={0.24}
            />
          </mesh>
        )}

        {object.type === "cube" && (
          <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.36, 0.36, 0.36]} />

            <meshStandardMaterial
              color={COLORS[object.color]}
              emissive={COLORS[object.color]}
              emissiveIntensity={0.32}
              metalness={0.18}
              roughness={0.25}
            />
          </mesh>
        )}

        {object.type === "triangle" && (
          <mesh castShadow>
            <coneGeometry args={[0.29, 0.46, 3]} />

            <meshStandardMaterial
              color={COLORS[object.color]}
              emissive={COLORS[object.color]}
              emissiveIntensity={0.32}
              metalness={0.18}
              roughness={0.24}
            />
          </mesh>
        )}

        {object.type === "star" && <StarShape color={COLORS[object.color]} />}
      </group>
    </Float>
  );
}

/* =========================================================
   STAR
========================================================= */

function StarShape({ color }) {
  const shape = new THREE.Shape();

  const outer = 0.3;
  const inner = 0.135;

  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();

  return (
    <mesh castShadow>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: 0.15,
            bevelEnabled: true,
            bevelSegments: 3,
            bevelSize: 0.025,
            bevelThickness: 0.025,
          },
        ]}
      />

      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.42}
        metalness={0.35}
        roughness={0.2}
      />
    </mesh>
  );
}

