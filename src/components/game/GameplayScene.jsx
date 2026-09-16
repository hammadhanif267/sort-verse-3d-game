"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Float,
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";

/* =========================================================
   GAMEPLAY SCENE
   SortVerse 3D - Step 3A
========================================================= */

export default function GameplayScene() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#020b15]">
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
        }}
        shadows
      >
        <PerspectiveCamera makeDefault position={[0, 2.8, 9.5]} fov={42} />

        <color attach="background" args={["#020b15"]} />

        <fog attach="fog" args={["#020b15", 7, 18]} />

        {/* Lighting */}
        <ambientLight intensity={1.5} />

        <directionalLight
          position={[4, 7, 5]}
          intensity={3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <pointLight
          position={[0, 4, 2]}
          intensity={8}
          distance={12}
          color="#28cfff"
        />

        <pointLight
          position={[-5, 1, -2]}
          intensity={4}
          distance={10}
          color="#247cff"
        />

        {/* Background environment */}
        <Environment preset="city" />

        {/* Game platform */}
        <GamePlatform />

        {/* Backdrop */}
        <GameBackdrop />

        {/* Top row */}
        <SortingTube
          position={[-2.55, 1.45, 0]}
          color="#1599ff"
          objects={[
            { type: "sphere", color: "#197cff" },
            { type: "sphere", color: "#197cff" },
            { type: "sphere", color: "#197cff" },
          ]}
        />

        <SortingTube
          position={[-0.85, 1.45, 0]}
          color="#ff3150"
          objects={[
            { type: "cube", color: "#ff3045" },
            { type: "cube", color: "#ff3045" },
            { type: "cube", color: "#ff3045" },
          ]}
        />

        <SortingTube
          position={[0.85, 1.45, 0]}
          color="#ffc51b"
          objects={[
            { type: "star", color: "#ffd229" },
            { type: "star", color: "#ffd229" },
            { type: "star", color: "#ffd229" },
          ]}
        />

        <SortingTube
          position={[2.55, 1.45, 0]}
          color="#19d45b"
          objects={[
            { type: "triangle", color: "#18d85d" },
            { type: "triangle", color: "#18d85d" },
            { type: "triangle", color: "#18d85d" },
          ]}
        />

        {/* Bottom row */}
        <SortingTube
          position={[-2.55, -1.55, 0]}
          color="#914cff"
          objects={[
            { type: "triangle", color: "#963cff" },
            { type: "triangle", color: "#963cff" },
            { type: "triangle", color: "#963cff" },
          ]}
        />

        <SortingTube
          position={[-0.85, -1.55, 0]}
          color="#16d85b"
          objects={[
            { type: "sphere", color: "#17d45b" },
            { type: "sphere", color: "#17d45b" },
            { type: "sphere", color: "#17d45b" },
          ]}
        />

        <SortingTube
          position={[0.85, -1.55, 0]}
          color="#168cff"
          objects={[
            { type: "cube", color: "#197cff" },
            { type: "cube", color: "#197cff" },
            { type: "cube", color: "#197cff" },
          ]}
        />

        <SortingTube
          position={[2.55, -1.55, 0]}
          color="#ff3150"
          objects={[
            { type: "star", color: "#ff3045" },
            { type: "star", color: "#ff3045" },
            { type: "star", color: "#ff3045" },
          ]}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={false}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Gameplay HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-[#06243a]/90 text-lg shadow-[0_0_18px_rgba(0,190,255,0.15)]">
          ❚❚
        </div>

        <div className="text-center">
          <div className="text-lg font-black tracking-tight">Level 5</div>
          <div className="text-[10px] font-medium text-cyan-100/70">
            Sort the objects
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-[#06243a]/90 px-3 py-2 text-xs font-bold shadow-[0_0_18px_rgba(0,190,255,0.12)]">
          <span className="text-cyan-300">◷</span>
          <span>02:35</span>
        </div>
      </div>

      {/* Bottom instruction */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 w-[78%] -translate-x-1/2 rounded-2xl border border-cyan-300/25 bg-[#06243a]/85 px-4 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="flex items-center justify-center gap-5">
          <span className="text-xl text-cyan-200/70">←</span>

          <div>
            <div className="text-xs font-black">Drag &amp; Drop</div>
            <div className="mt-0.5 text-[9px] text-white/60">
              to sort the objects
            </div>
          </div>

          <span className="text-xl text-cyan-200/70">→</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SORTING TUBE
========================================================= */

function SortingTube({ position, color, objects }) {
  return (
    <group position={position}>
      {/* Tube glass */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.48, 2.35, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#8edfff"
          transparent
          opacity={0.18}
          roughness={0.08}
          metalness={0.1}
          transmission={0.35}
          thickness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Tube outline */}
      <mesh position={[0, 1.23, 0]}>
        <torusGeometry args={[0.48, 0.065, 16, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          metalness={0.65}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, -1.12, 0]}>
        <torusGeometry args={[0.48, 0.055, 16, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>

      {/* Tube base */}
      <mesh position={[0, -1.18, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.68, 0.18, 48]} />
        <meshStandardMaterial
          color="#152b3b"
          metalness={0.85}
          roughness={0.24}
        />
      </mesh>

      {/* Objects */}
      {objects.map((object, index) => (
        <SortObject
          key={`${object.type}-${index}`}
          type={object.type}
          color={object.color}
          position={[0, -0.72 + index * 0.56, 0]}
        />
      ))}
    </group>
  );
}

/* =========================================================
   SORTABLE OBJECT
========================================================= */

function SortObject({ type, color, position }) {
  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.05}>
      <group position={position}>
        {type === "sphere" && (
          <mesh castShadow>
            <sphereGeometry args={[0.29, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              metalness={0.18}
              roughness={0.25}
            />
          </mesh>
        )}

        {type === "cube" && (
          <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.42, 0.42, 0.42]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              metalness={0.15}
              roughness={0.28}
            />
          </mesh>
        )}

        {type === "triangle" && (
          <mesh rotation={[0, 0, 0]} castShadow>
            <coneGeometry args={[0.34, 0.55, 3]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              metalness={0.15}
              roughness={0.25}
            />
          </mesh>
        )}

        {type === "star" && <StarShape color={color} />}
      </group>
    </Float>
  );
}

/* =========================================================
   STAR
========================================================= */

function StarShape({ color }) {
  const shape = new THREE.Shape();

  const outer = 0.36;
  const inner = 0.16;

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
    <mesh rotation={[0, 0, 0]} castShadow>
      <extrudeGeometry
        args={[
          shape,
          {
            depth: 0.18,
            bevelEnabled: true,
            bevelSegments: 3,
            bevelSize: 0.035,
            bevelThickness: 0.035,
          },
        ]}
      />

      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        metalness={0.35}
        roughness={0.2}
      />
    </mesh>
  );
}

/* =========================================================
   PLATFORM
========================================================= */

function GamePlatform() {
  return (
    <group position={[0, -3.05, 0]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[7.7, 0.45, 3.7]} />
        <meshStandardMaterial
          color="#142b3c"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[7.35, 0.06, 3.35]} />
        <meshStandardMaterial
          color="#0b4d69"
          emissive="#07506d"
          emissiveIntensity={0.45}
          metalness={0.7}
          roughness={0.28}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   BACKDROP
========================================================= */

function GameBackdrop() {
  return (
    <group position={[0, 0, -3.8]}>
      <mesh position={[0, 1.2, 0]}>
        <planeGeometry args={[14, 11]} />
        <meshStandardMaterial
          color="#061525"
          metalness={0.25}
          roughness={0.65}
        />
      </mesh>

      {/* Vertical futuristic lights */}
      <mesh position={[-4.2, 1.4, 0.1]}>
        <boxGeometry args={[0.05, 6, 0.05]} />
        <meshStandardMaterial
          color="#17bfff"
          emissive="#17bfff"
          emissiveIntensity={2}
        />
      </mesh>

      <mesh position={[4.2, 1.4, 0.1]}>
        <boxGeometry args={[0.05, 6, 0.05]} />
        <meshStandardMaterial
          color="#17bfff"
          emissive="#17bfff"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}
