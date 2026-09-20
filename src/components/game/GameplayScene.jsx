"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayerStats } from "@/lib/playerStats";
import Link from "next/link";
import { HomeCoinIcon, HomeGemIcon } from "@/components/icons";
import { playDragDropSound, playGoodVoice, playTubeCompleteSound, playWrongMoveSound, playIntroChime, playChainBreakSound, playPopBurstSound, playBombExplosionSound, playKidVoice } from "@/lib/sound";

/* =========================================================
   SORTVERSE
   Board rendered as layered CSS + SVG (glass tubes, moulded
   plastic pieces, brushed-metal shelves) instead of WebGL —
   this is the exact look from the reference art and renders
   reliably on every device.
========================================================= */

const CAPACITY = 4;

// Moulded-plastic object colours, matched to the reference artwork.
const COLORS = {
  blue: { base: "#1d6fe0", light: "#5aa0ff", dark: "#0d47a8" },
  red: { base: "#d6202f", light: "#ff5f66", dark: "#8f0f1c" },
  yellow: { base: "#f0c018", light: "#ffe273", dark: "#a87a00" },
  green: { base: "#22a72f", light: "#6fe07a", dark: "#0f6b18" },
  purple: { base: "#7b2fd6", light: "#b57bff", dark: "#4a1690" },
};

// Cap/base collar colour, a shade brighter than the objects.
const TUBE_COLORS = {
  blue: { base: "#2f86ff", light: "#8ec6ff", dark: "#0f4fb0" },
  red: { base: "#ef2f40", light: "#ff8f96", dark: "#920f1c" },
  yellow: { base: "#ffce29", light: "#fff0ae", dark: "#a87a00" },
  green: { base: "#2fca3f", light: "#9af0a4", dark: "#0f7a1c" },
  purple: { base: "#8f42ea", light: "#cfa8ff", dark: "#4a1690" },
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
  const progression = Math.min(Math.floor((level - 1) / 4), 2);

  // Colors still rise with level, but each difficulty now adds its own
  // obstacle mechanics so Hard/Expert are not just faster versions of Normal.
  const normalColors = [3, 4, 5][progression];
  const colorCount = Math.min(
    tierIndex === 0 ? normalColors : tierIndex === 1 ? Math.min(4 + progression, 5) : 5,
    5,
  );

  const baseEmptyByTier = [3, 2, 1];
  const emptyTubes = Math.min(
    Math.max(baseEmptyByTier[tierIndex] - progression, 1),
    TOTAL_TUBES - colorCount,
  );

  const baseSecondsByTier = [90, 75, 60];
  const decayPerLevelByTier = [2, 3, 4];
  const minSecondsByTier = [45, 35, 25];
  const timeSeconds = Math.max(
    minSecondsByTier[tierIndex],
    baseSecondsByTier[tierIndex] - (level - 1) * decayPerLevelByTier[tierIndex],
  );

  const mechanics = {
    chains: difficulty === "normal" ? level >= 4 : true,
    chainLayers: difficulty === "normal" ? (level >= 7 ? 2 : 1) : difficulty === "hard" ? (level >= 6 ? 2 : 1) : 2,
    bombs: difficulty === "normal" ? level >= 10 : difficulty === "hard" ? level >= 4 : level >= 2,
    frozen: difficulty === "normal" ? false : difficulty === "hard" ? level >= 7 : level >= 4,
    tripleBurst: difficulty === "normal" ? level >= 8 : difficulty === "hard" ? level >= 5 : level >= 3,
  };

  return { colorCount, emptyTubes, timeSeconds, mechanics };
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
  const { colorCount, emptyTubes, mechanics } = difficultyParams(level, difficulty);
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

  // Add special pieces with solvability guarantees. Every chain color keeps
  // at least three completely free copies elsewhere, so a locked piece can
  // always be released by a real 3-of-a-kind match. Chain/frozen pieces are
  // never stacked on the same colour, and bomb pieces avoid reserved colors.
  const candidates = [];
  slots.forEach((slot, slotIndex) => {
    slot.forEach((object, objectIndex) => {
      if (objectIndex < CAPACITY - 1) candidates.push({ slotIndex, objectIndex, object });
    });
  });
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const reservedColors = new Set();
  const usedObjects = new Set();
  const chooseSpecial = (count, predicate) => {
    const chosen = [];
    for (const candidate of candidates) {
      if (chosen.length >= count) break;
      if (usedObjects.has(candidate.object.id)) continue;
      if (!predicate(candidate.object)) continue;
      chosen.push(candidate);
      usedObjects.add(candidate.object.id);
    }
    return chosen;
  };

  if (mechanics.chains) {
    // One chained object per colour is intentional. A colour has exactly four
    // objects, so putting two chained objects on the same colour would leave
    // too few free copies to ever form the first match. For a 2-layer chain,
    // the SAME object simply needs two successful 3-of-a-kind matches.
    const chainCount = Math.min(1, colors.length);
    const chainPicks = chooseSpecial(chainCount, (object) => !reservedColors.has(object.color));
    chainPicks.forEach(({ object }) => {
      object.chainLayers = mechanics.chainLayers;
      reservedColors.add(object.color);
    });

    // Make every chain colour demonstrably solvable. Pull the four copies of
    // that colour out, then put the chained copy plus the three free copies
    // on top of four different tubes. No copy is buried behind another ball.
    chainPicks.forEach(({ object: chainObject }) => {
      const chainColor = chainObject.color;
      const chainObjects = [];
      slots.forEach((slot) => {
        for (let i = slot.length - 1; i >= 0; i -= 1) {
          if (slot[i].color === chainColor) chainObjects.push(slot.splice(i, 1)[0]);
        }
      });

      const freeObjects = chainObjects.filter((item) => item.id !== chainObject.id && !item.chainLayers && !item.frozen);
      const ordered = [chainObject, ...freeObjects.slice(0, 3)];
      const targets = slots
        .map((slot, index) => ({ index, room: CAPACITY - slot.length }))
        .filter((entry) => entry.room > 0)
        .sort((a, b) => b.room - a.room)
        .slice(0, ordered.length);

      ordered.forEach((item, index) => {
        const target = targets[index];
        if (target) slots[target.index].push(item);
      });

      // In the unlikely event a reserved copy could not be placed by the
      // safety pass, put it back into the first tube with room rather than
      // dropping an object from the puzzle.
      const placedIds = new Set(ordered.slice(0, targets.length).map((item) => item.id));
      chainObjects.forEach((item) => {
        if (placedIds.has(item.id)) return;
        const fallback = slots.find((slot) => slot.length < CAPACITY);
        if (fallback) fallback.push(item);
      });
    });
  }

  if (mechanics.frozen) {
    const frozenCount = difficulty === "expert" ? 2 : 1;
    const frozenPicks = chooseSpecial(frozenCount, (object) => !reservedColors.has(object.color));
    frozenPicks.forEach(({ object }) => {
      object.frozen = true;
      reservedColors.add(object.color);
    });
  }

  if (mechanics.bombs) {
    const bombCount = difficulty === "expert" ? 2 : 1;
    const bombPicks = chooseSpecial(bombCount, (object) => !reservedColors.has(object.color));
    bombPicks.forEach(({ object }) => {
      object.bombTurns = difficulty === "expert" ? 5 : 6;
    });
  }

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
  const { timeSeconds: initialTime, mechanics } = difficultyParams(level, difficulty);

  const [tubes, setTubes] = useState(() => generatePuzzle({ level, difficulty }));
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragPoint, setDragPoint] = useState(null);
  const [shakingTubeId, setShakingTubeId] = useState(null);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Drag an object to sort it");
  const [mechanicFlash, setMechanicFlash] = useState(null);
  const [pieceEffects, setPieceEffects] = useState({});
  const [tubeBursts, setTubeBursts] = useState({});
  const [completionNotice, setCompletionNotice] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [timeUp, setTimeUp] = useState(false);
  const { addRewards, completeLevel } = usePlayerStats();
  const rewardRecorded = useRef(false);
  const completedRef = useRef(false);

  const completed = useMemo(() => {
    return tubes.every((tube) => {
      if (tube.objects.length === 0) return true;

      return (
        tube.objects.length === CAPACITY &&
        tube.objects.every((object) => object.color === tube.objects[0].color) &&
        tube.objects.every((object) => object.chainLayers === 0 && !object.frozen && object.bombTurns == null)
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
    completedRef.current = true;
    setCompletionNotice(true);
    playKidVoice(`Level complete! You got ${coinReward} gold and ${diamondReward} diamonds!`);
    window.setTimeout(() => playKidVoice("Amazing! Great job!"), 850);

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

  const flashMechanic = useCallback((text) => {
    setMechanicFlash(text);
    window.clearTimeout(flashMechanic.timeout);
    flashMechanic.timeout = window.setTimeout(() => setMechanicFlash(null), 1100);
  }, []);

  const triggerPieceEffects = useCallback((ids, type) => {
    if (!ids?.length) return;
    setPieceEffects((current) => {
      const next = { ...current };
      ids.forEach((id) => { next[id] = type; });
      return next;
    });
    window.setTimeout(() => {
      setPieceEffects((current) => {
        const next = { ...current };
        ids.forEach((id) => {
          if (next[id] === type) delete next[id];
        });
        return next;
      });
    }, type === "bomb" ? 720 : 560);
  }, []);

  const triggerTubeBurst = useCallback((tubeIds, type = "explosion") => {
    if (!tubeIds?.length) return;
    setTubeBursts((current) => {
      const next = { ...current };
      tubeIds.forEach((id) => { next[id] = type; });
      return next;
    });
    window.setTimeout(() => {
      setTubeBursts((current) => {
        const next = { ...current };
        tubeIds.forEach((id) => {
          if (next[id] === type) delete next[id];
        });
        return next;
      });
    }, type === "explosion" ? 780 : 620);
  }, []);

  const triggerWrongMove = useCallback((tubeId) => {
    setShakingTubeId(tubeId);
    window.setTimeout(() => setShakingTubeId((current) => current === tubeId ? null : current), 420);
    playWrongMoveSound();
    setMessage("Wrong move!");
  }, []);

  const handleObjectStart = useCallback(
    (tubeId, objectIndex, object) => {
      if (paused) return;
      if (object.chainLayers > 0) {
        flashMechanic(`🔗 Locked! Put 3 free ${object.color} pieces together to break the chain`);
        triggerWrongMove(tubeId);
        return;
      }
      if (object.frozen) {
        flashMechanic(`❄️ Frozen! Put 3 free ${object.color} pieces together to melt the ice`);
        triggerWrongMove(tubeId);
        return;
      }
      setDragging({ tubeId, objectIndex, object });
      setSelected({ tubeId, objectIndex });
      setMessage("Drop into a matching tube");
    },
    [paused, flashMechanic, triggerWrongMove],
  );

  const handleObjectEnd = useCallback(
    (targetTubeId) => {
      if (!dragging) return;

      const sourceTubeId = dragging.tubeId;

      if (sourceTubeId === targetTubeId) {
        triggerWrongMove(targetTubeId);
        setDragging(null);
        setSelected(null);
        return;
      }

      const sourceNow = tubes.find((tube) => tube.id === sourceTubeId);
      const targetNow = tubes.find((tube) => tube.id === targetTubeId);
      const object = sourceNow?.objects[sourceNow.objects.length - 1];
      const targetTop = targetNow?.objects[targetNow.objects.length - 1];

      const validTarget = Boolean(
        object &&
        targetNow &&
        targetNow.objects.length < CAPACITY &&
        (!targetTop || targetTop.color === object.color),
      );

      if (!validTarget) {
        triggerWrongMove(targetTubeId);
        setDragging(null);
        setSelected(null);
        return;
      }

      const willCompleteTube =
        targetNow.objects.length + 1 === CAPACITY &&
        targetNow.objects.every((item) => item.color === object.color);
      const willTriple =
        mechanics.tripleBurst &&
        targetNow.objects.length + 1 >= 3 &&
        [...targetNow.objects, object].slice(-3).every((item) => item.color === object.color);

      const sameColorLockedIds = tubes.flatMap((tube) =>
        tube.objects.filter((item) => item.color === object.color && item.chainLayers > 0).map((item) => item.id),
      );
      const sameColorFrozenIds = tubes.flatMap((tube) =>
        tube.objects.filter((item) => item.color === object.color && item.frozen).map((item) => item.id),
      );
      const tripleTail = willTriple ? [...targetNow.objects, object].slice(-3) : [];
      const willBurstTriple = willTriple && targetNow.objects.length + 1 < CAPACITY && tripleTail.every((item) => item.chainLayers === 0 && !item.frozen);
      const bombDetonationTubeIds = tubes
        .filter((tube) => tube.objects.some((item) => item.bombTurns != null && item.bombTurns <= 1))
        .map((tube) => tube.id);

      setTubes((current) => {
        const next = current.map((tube) => ({
          ...tube,
          objects: tube.objects.map((item) => ({ ...item })),
        }));
        const source = next.find((tube) => tube.id === sourceTubeId);
        const target = next.find((tube) => tube.id === targetTubeId);
        if (!source || !target) return current;

        const moving = source.objects.pop();
        if (!moving) return current;
        target.objects.push(moving);

        // A matching triple breaks one chain layer and thaws frozen pieces
        // of the same colour. A second triple can burst three free pieces,
        // giving the game a Candy-Crush-style payoff without changing the
        // core tube-sorting rules.
        if (target.objects.length >= 3 && target.objects.slice(-3).every((item) => item.color === object.color)) {
          let brokeChain = false;
          let thawedIce = false;
          next.forEach((tube) => {
            tube.objects.forEach((item) => {
              if (item.color !== object.color) return;
              if (item.chainLayers > 0) {
                item.chainLayers -= 1;
                brokeChain = true;
              }
              if (item.frozen) {
                item.frozen = false;
                thawedIce = true;
              }
            });
          });
          if (brokeChain) flashMechanic(`🔗 Chain layer broken — ${object.color} unlocked!`);
          if (thawedIce) flashMechanic(`❄️ Ice melted — ${object.color} freed!`);

          if (mechanics.tripleBurst && !brokeChain && !thawedIce) {
            const freeTripleIndex = target.objects.findIndex((item, index, arr) =>
              index >= arr.length - 3 && item.chainLayers === 0 && !item.frozen,
            );
            const tail = target.objects.slice(-3);
            if (tail.length === 3 && tail.every((item) => item.color === object.color && item.chainLayers === 0 && !item.frozen)) {
              target.objects.splice(target.objects.length - 3, 3);
              flashMechanic(`✨ Triple clear! ${object.color} pieces popped`);
            } else if (freeTripleIndex >= 0) {
              flashMechanic(`✨ ${object.color} triple ready!`);
            }
          }
        }

        // Bomb fuse: every successful move advances all active bombs. A
        // detonating bomb clears the rest of its tube, then disappears.
        let detonated = false;
        next.forEach((tube) => {
          tube.objects.forEach((item) => {
            if (item.bombTurns == null) return;
            item.bombTurns -= 1;
          });
        });
        next.forEach((tube) => {
          const bombIndex = tube.objects.findIndex((item) => item.bombTurns != null && item.bombTurns <= 0);
          if (bombIndex >= 0) {
            tube.objects = tube.objects.slice(0, bombIndex + 1).filter((item) => item.bombTurns == null);
            detonated = true;
          }
        });
        if (detonated) flashMechanic("💥 BOOM! Bomb cleared its tube!");

        return next;
      });

      if (sameColorLockedIds.length && willTriple) {
        triggerPieceEffects(sameColorLockedIds, "chain-break");
        playChainBreakSound();
        playKidVoice("Yay! Chain broken!");
      }
      if (sameColorFrozenIds.length && willTriple) { triggerPieceEffects(sameColorFrozenIds, "ice-melt"); playKidVoice("Wow! Ice melted!"); }
      if (willBurstTriple) {
        triggerTubeBurst([targetTubeId], "triple");
        playPopBurstSound();
        playKidVoice("Pop! Awesome!");
      }
      if (bombDetonationTubeIds.length) {
        triggerTubeBurst(bombDetonationTubeIds, "explosion");
        playBombExplosionSound();
        playKidVoice("Boom!");
      }

      playDragDropSound();
      if (willCompleteTube) {
        playTubeCompleteSound();
        playGoodVoice();
        window.setTimeout(() => playKidVoice("Wow! Tube complete!"), 120);
      }

      setMoves((value) => value + 1);
      setDragging(null);
      setSelected(null);
      setMessage(willCompleteTube ? "Good! Tube complete!" : willTriple ? (sameColorLockedIds.length ? "Chain broken!" : "Triple!") : "Nice move!");
    },
    [dragging, tubes, triggerWrongMove, mechanics, flashMechanic, triggerPieceEffects, triggerTubeBurst],
  );

  const handleInvalidDrop = useCallback(() => {
    if (!dragging) return;
    playWrongMoveSound();
    setDragging(null);
    setSelected(null);
    setMessage("Wrong move!");
  }, [dragging]);

  const resetGame = useCallback(() => {
    playIntroChime();
    setTubes(generatePuzzle({ level, difficulty }));
    setSelected(null);
    setDragging(null);
    setDragPoint(null);
    setShakingTubeId(null);
    setPieceEffects({});
    setTubeBursts({});
    setMoves(0);
    setMessage("Drag an object to sort it");
    setCompletionNotice(false);
    rewardRecorded.current = false;
    completedRef.current = false;
    setTimeLeft(initialTime);
    setTimeUp(false);
  }, [level, difficulty, initialTime]);

  // Drag follows the pointer; drop target is whichever tube the pointer is
  // over when released (checked via elementFromPoint, since the dragged
  // piece itself is what's under the cursor).
  const boardRef = useRef(null);

  useEffect(() => {
    if (!dragging) return undefined;

    const move = (event) => {
      const point = "touches" in event ? event.touches[0] : event;
      if (!point) return;
      setDragPoint({ x: point.clientX, y: point.clientY });
    };

    const release = (event) => {
      const point = "changedTouches" in event ? event.changedTouches[0] : event;
      const x = point?.clientX;
      const y = point?.clientY;

      let landedTubeId = null;
      if (x != null && y != null) {
        const prevPointerEvents = dragLayerRef.current?.style.pointerEvents;
        if (dragLayerRef.current) dragLayerRef.current.style.pointerEvents = "none";
        const el = document.elementFromPoint(x, y);
        if (dragLayerRef.current) dragLayerRef.current.style.pointerEvents = prevPointerEvents ?? "";
        const tubeEl = el?.closest("[data-tube-id]");
        if (tubeEl) landedTubeId = Number(tubeEl.dataset.tubeId);
      }

      if (landedTubeId !== null) {
        handleObjectEnd(landedTubeId);
      } else {
        handleInvalidDrop();
      }
      setDragPoint(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", release);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", release);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", release);
    };
  }, [dragging, handleObjectEnd, handleInvalidDrop]);

  const dragLayerRef = useRef(null);

  return (
    <div ref={boardRef} className="relative h-full w-full touch-none select-none overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute left-1/2 top-[8.5vh] z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-[#041827]/70 px-2.5 py-1 text-[7px] font-bold text-white/55 backdrop-blur">
        {mechanics.chains && <span>🔗 Chains</span>}
        {mechanics.frozen && <span>❄️ Ice</span>}
        {mechanics.bombs && <span>💣 Bombs</span>}
        {mechanics.tripleBurst && <span>✨ Triples</span>}
      </div>

      <div className="absolute inset-x-0 top-[8vh] bottom-[16vh] flex flex-col items-center justify-center gap-[2.6vh] px-3">
        <div className="flex w-full flex-col items-center">
          <TubeRow
            tubes={tubes.slice(0, 4)}
            selected={selected}
            dragging={dragging}
            onObjectStart={handleObjectStart}
            shakingTubeId={shakingTubeId}
            mechanics={mechanics}
            pieceEffects={pieceEffects}
            tubeBursts={tubeBursts}
          />
          <Shelf />
        </div>
        <div className="flex w-full flex-col items-center">
          <TubeRow
            tubes={tubes.slice(4, 8)}
            selected={selected}
            dragging={dragging}
            onObjectStart={handleObjectStart}
            shakingTubeId={shakingTubeId}
            mechanics={mechanics}
            pieceEffects={pieceEffects}
            tubeBursts={tubeBursts}
          />
          <Shelf />
        </div>
      </div>

      {/* Ghost of the dragged piece, following the pointer */}
      <div ref={dragLayerRef} className="pointer-events-none absolute inset-0 z-40">
        {dragging && dragPoint && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
            style={{ left: dragPoint.x, top: dragPoint.y, width: 52, height: 52 }}
          >
            <div className="relative h-full w-full">
              <ObjectShape type={dragging.object.type} colors={COLORS[dragging.object.color]} size={52} />
              {dragging.object.chainLayers > 0 && <ChainVisual layers={dragging.object.chainLayers} />}
              {dragging.object.frozen && <IceVisual />}
              {dragging.object.bombTurns != null && <BombVisual turns={dragging.object.bombTurns} />}
            </div>
          </div>
        )}
      </div>

      {mechanicFlash && (
        <div className="pointer-events-none absolute top-[13%] left-1/2 z-40 -translate-x-1/2 rounded-full border border-yellow-300/30 bg-[#061b2b]/95 px-4 py-2 text-[10px] font-black text-yellow-100 shadow-[0_0_22px_rgba(255,210,70,.22)] backdrop-blur-md">
          {mechanicFlash}
        </div>
      )}

      {/* =================================================
          STATUS
      ================================================= */}

      <div className={`pointer-events-none absolute bottom-[86px] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[9px] font-semibold backdrop-blur ${message.toLowerCase().includes("wrong") ? "border-red-400/30 bg-red-950/80 text-red-300" : message.toLowerCase().includes("good") ? "border-emerald-300/25 bg-emerald-950/70 text-emerald-200" : "border-cyan-300/15 bg-[#031a2a]/80 text-cyan-100/65"}`}>
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

      {completionNotice && (
        <div className="pointer-events-none absolute left-1/2 top-[9%] z-[60] w-[92%] -translate-x-1/2">
          <div className="level-complete-banner rounded-2xl border border-yellow-200/40 bg-gradient-to-b from-[#173f58] to-[#08243a] px-4 py-3 text-center shadow-[0_0_30px_rgba(255,210,70,.28)]">
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-yellow-200">Level {level} Complete!</div>
            <div className="mt-1 flex items-center justify-center gap-4 text-sm font-black">
              <span className="inline-flex items-center gap-1.5 text-yellow-200">+{coinReward}<HomeCoinIcon className="h-5 w-5" /></span>
              <span className="inline-flex items-center gap-1.5 text-cyan-100">+{diamondReward}<HomeGemIcon className="h-5 w-5" /></span>
            </div>
          </div>
        </div>
      )}

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
                  <span className="inline-flex items-center gap-1.5 text-yellow-300"><span>+{100 * level}</span><HomeCoinIcon className="h-4 w-4" /></span>
                  <span className="inline-flex items-center gap-1.5 text-violet-200"><span>+{earnedStars}</span><HomeGemIcon className="h-4 w-4" /></span>
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
        className="absolute bottom-[88px] right-3 z-30 rounded-full border border-cyan-300/25 bg-[#06243a]/90 px-3 py-1.5 text-[8px] font-black text-cyan-100/80 shadow-[0_0_10px_rgba(0,190,255,0.10)] backdrop-blur transition hover:border-cyan-200/70 hover:bg-[#0b3b59] hover:text-white hover:shadow-[0_0_16px_rgba(0,190,255,0.28)] active:scale-95"
      >
        Reset
      </button>
    </div>
  );
}

/* =========================================================
   TUBE ROW
========================================================= */

function TubeRow({ tubes, selected, dragging, onObjectStart, shakingTubeId, mechanics, pieceEffects, tubeBursts }) {
  return (
    <div className="relative z-10 flex w-full items-end justify-center gap-[3.2vw]">
      {tubes.map((tube) => (
        <Tube
          key={tube.id}
          tube={tube}
          selected={selected?.tubeId === tube.id}
          dragging={dragging}
          onObjectStart={onObjectStart}
          shaking={shakingTubeId === tube.id}
          mechanics={mechanics}
          pieceEffects={pieceEffects}
          tubeBurst={tubeBursts?.[tube.id]}
        />
      ))}
    </div>
  );
}

/* =========================================================
   SHELF
   Brushed grey-blue metal slab the tubes stand on, with a
   machined top plate and angled end caps.
========================================================= */

function Shelf() {
  return (
    <div className="relative -mt-[2.2vh] w-[92%] shrink-0" style={{ height: "3.6vh", minHeight: 22, maxHeight: 34 }}>
      <div
        className="absolute inset-0 rounded-[22%] shadow-[0_8px_16px_rgba(0,0,0,0.45)]"
        style={{
          background: "linear-gradient(180deg, #7c93a7 0%, #5c7387 42%, #384b5c 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          className="absolute inset-x-[3%] top-[16%] rounded-full"
          style={{ height: "22%", background: "rgba(255,255,255,0.28)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-[22%]"
          style={{ height: "40%", background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.35))" }}
        />
      </div>
      {/* end caps */}
      <div className="absolute -left-[3%] top-[10%] h-[80%] w-[6%] rounded-[30%]" style={{ background: "linear-gradient(180deg,#8fa5b8,#465a6c)" }} />
      <div className="absolute -right-[3%] top-[10%] h-[80%] w-[6%] rounded-[30%]" style={{ background: "linear-gradient(180deg,#8fa5b8,#465a6c)" }} />
    </div>
  );
}

/* =========================================================
   TUBE
   A glass cylinder standing on a two-tier metal shelf, with a
   coloured collar on top and a matching base — same silhouette
   as the reference artwork.
========================================================= */

function Tube({ tube, selected, dragging, onObjectStart, shaking, mechanics, pieceEffects, tubeBurst }) {
  const topObjectIndex = tube.objects.length - 1;
  const topObject = tube.objects[topObjectIndex];
  const tubeColor = TUBE_COLORS[tube.objects[0]?.color] || TUBE_COLORS[tube.color] || TUBE_COLORS.blue;

  const startFromTube = (event) => {
    if (!topObject || dragging || event.button === 2) return;
    event.preventDefault();
    event.stopPropagation();
    onObjectStart(tube.id, topObjectIndex, topObject);
  };

  return (
    <div
      className="flex flex-col items-center"
      style={{
        width: "min(20vw, 92px)",
        animation: shaking ? "tube-shake 420ms ease-in-out" : undefined,
      }}
    >
      <div
        data-tube-id={tube.id}
        onPointerDown={startFromTube}
        onContextMenu={(event) => event.preventDefault()}
        className="relative flex w-full flex-col items-center justify-end"
        style={{
          aspectRatio: "84 / 224",
          filter: selected ? "drop-shadow(0 0 10px rgba(120,220,255,0.55))" : "none",
          cursor: topObject ? (topObject.chainLayers > 0 || topObject.frozen ? "not-allowed" : "grab") : "default",
          touchAction: "none",
        }}
      >
        {tubeBurst && <TubeBurst type={tubeBurst} />}

        {/* Glass barrel */}
        <div
          className="absolute inset-x-0 bottom-0 top-[9%] overflow-hidden rounded-b-[38%] rounded-t-md"
          style={{
            background: "linear-gradient(100deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 16%, rgba(180,215,235,0.10) 46%, rgba(255,255,255,0.05) 62%, rgba(255,255,255,0.22) 100%)",
            border: "1px solid rgba(255,255,255,0.38)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), inset -6px 0 14px rgba(0,0,0,0.14), 0 6px 14px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          <div className="absolute inset-y-0 left-[14%] w-[13%] rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.05))" }} />
          <div className="absolute inset-y-0 left-[68%] w-[7%] rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0))" }} />

          {/* Four-slot layout: every object is sized to fit four pieces clearly. */}
          <div className="absolute inset-x-[8%] bottom-[3%] flex h-[88%] flex-col-reverse items-center justify-end gap-[1%] px-[8%] pointer-events-none">
            {tube.objects.map((object, index) => (
              <div
                key={object.id}
                className="relative w-[72%] shrink-0"
                style={{
                  aspectRatio: "1 / 1",
                  opacity: dragging?.tubeId === tube.id && dragging.objectIndex === index ? 0 : 1,
                }}
              >
                <div className={`relative h-full w-full ${pieceEffects?.[object.id] ? `piece-fx-${pieceEffects[object.id]}` : ""}`}>
                  <ObjectShape type={object.type} colors={COLORS[object.color]} responsive />
                  {object.chainLayers > 0 && <ChainVisual layers={object.chainLayers} />}
                  {object.frozen && <IceVisual />}
                  {object.bombTurns != null && <BombVisual turns={object.bombTurns} />}
                  {pieceEffects?.[object.id] === "chain-break" && <FxBurst symbol="🔗" />}
                  {pieceEffects?.[object.id] === "ice-melt" && <FxBurst symbol="❄" />}
                  {pieceEffects?.[object.id] === "bomb" && <FxBurst symbol="💥" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Four subtle capacity slots make the 4-piece capacity visually obvious. */}
        <div className="pointer-events-none absolute inset-x-[12%] bottom-[8%] top-[15%] flex flex-col-reverse justify-start gap-[1%] opacity-[0.10]">
          {[0, 1, 2, 3].map((slot) => (
            <div key={slot} className="w-[72%] self-center rounded-full border border-white/70" style={{ aspectRatio: "1 / 1" }} />
          ))}
        </div>

        {/* Top collar */}
        <div
          className="pointer-events-none absolute inset-x-[-4%] top-0 rounded-[40%] shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
          style={{
            height: "13%",
            background: `linear-gradient(180deg, ${tubeColor.light} 0%, ${tubeColor.base} 45%, ${tubeColor.dark} 100%)`,
            border: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          <div className="absolute inset-x-[10%] top-[14%] rounded-full" style={{ height: "30%", background: "rgba(255,255,255,0.55)", filter: "blur(1px)" }} />
        </div>

        {/* Bottom base */}
        <div
          className="pointer-events-none absolute inset-x-[-6%] bottom-[-4%] rounded-[45%] shadow-[0_5px_10px_rgba(0,0,0,0.4)]"
          style={{
            height: "12%",
            background: `linear-gradient(180deg, ${tubeColor.light} 0%, ${tubeColor.base} 40%, ${tubeColor.dark} 100%)`,
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   OBJECT SHAPES
   Moulded-plastic look: a base fill, a darker lower shade for
   volume, and a bright highlight — no glow, just lit plastic.
========================================================= */

function ChainVisual({ layers = 1 }) {
  return (
    <div className="pointer-events-none absolute inset-[5%] z-10">
      {Array.from({ length: layers }).map((_, index) => (
        <div key={index} className="chain-ring absolute inset-[8%] rounded-[42%] border-[3px] border-[#c9d4df] shadow-[0_0_5px_rgba(255,255,255,.55),inset_0_0_4px_rgba(0,0,0,.8)]" style={{ transform: `rotate(${index * 18 - 9}deg)`, opacity: 0.94 - index * 0.12 }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center text-[11px] drop-shadow-[0_2px_3px_rgba(0,0,0,.9)]">🔗</div>
    </div>
  );
}

function IceVisual() {
  return (
    <div className="pointer-events-none absolute inset-[2%] z-10 rounded-[40%] border-2 border-cyan-100/70 bg-cyan-100/10 shadow-[inset_0_0_10px_rgba(160,240,255,.35),0_0_8px_rgba(100,220,255,.28)]">
      <div className="absolute inset-0 flex items-center justify-center text-[13px] opacity-90">❄️</div>
    </div>
  );
}

function BombVisual({ turns }) {
  return (
    <div className="pointer-events-none absolute inset-[3%] z-10">
      <div className="bomb-pulse absolute right-[4%] top-[2%] flex h-[31%] w-[31%] items-center justify-center rounded-full border border-red-200/70 bg-red-950/90 text-[8px] font-black text-white shadow-[0_0_9px_rgba(255,50,50,.7)]">{turns}</div>
      <div className="bomb-fuse absolute right-[20%] top-[-5%] h-[18%] w-[10%] rotate-[28deg] rounded-full bg-yellow-200 shadow-[0_0_8px_rgba(255,200,60,.9)]" />
      <div className="absolute bottom-[1%] left-[5%] rounded-full bg-black/55 px-1.5 py-0.5 text-[8px]">💣</div>
    </div>
  );
}

function FxBurst({ symbol }) {
  return (
    <div className="pointer-events-none absolute inset-[-22%] z-30 flex items-center justify-center">
      <span className="fx-burst text-[18px]">{symbol}</span>
      <i className="fx-spark fx-spark-a" /><i className="fx-spark fx-spark-b" /><i className="fx-spark fx-spark-c" /><i className="fx-spark fx-spark-d" />
    </div>
  );
}

function TubeBurst({ type }) {
  return (
    <div className={`pointer-events-none absolute inset-[-12%] z-20 flex items-center justify-center tube-burst-${type}`}>
      <div className="burst-ring absolute h-[45%] w-[45%] rounded-full border-4 border-yellow-200/80" />
      <div className="burst-ring burst-ring-2 absolute h-[30%] w-[30%] rounded-full border-2 border-white/80" />
      <div className="absolute text-[28px] drop-shadow-[0_0_8px_rgba(255,190,50,.9)]">{type === "explosion" ? "💥" : "✨"}</div>
      <i className="burst-star star-1">✦</i><i className="burst-star star-2">✦</i><i className="burst-star star-3">✦</i><i className="burst-star star-4">✦</i>
    </div>
  );
}

function SpecialBadge({ label }) {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-10 flex min-h-4 min-w-4 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full border border-white/30 bg-[#061522]/90 px-1 text-[7px] font-black text-white shadow-[0_2px_7px_rgba(0,0,0,.55)]">
      {label}
    </div>
  );
}

function ObjectShape({ type, colors, size, responsive }) {
  const style = responsive
    ? { width: "100%", aspectRatio: "1 / 1" }
    : { width: size, height: size };

  const gradId = `${type}-${colors.base.replace("#", "")}`;

  if (type === "sphere") {
    return (
      <svg viewBox="0 0 100 100" style={style}>
        <defs>
          <radialGradient id={`sph-${gradId}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="55%" stopColor={colors.base} />
            <stop offset="100%" stopColor={colors.dark} />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="44" fill={`url(#sph-${gradId})`} />
        <ellipse cx="37" cy="30" rx="14" ry="9" fill="#ffffff" opacity="0.55" />
      </svg>
    );
  }

  if (type === "cube") {
    return (
      <svg viewBox="0 0 100 100" style={style}>
        <defs>
          <linearGradient id={`cube-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="55%" stopColor={colors.base} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="80" height="80" rx="16" fill={`url(#cube-${gradId})`} />
        <rect x="18" y="16" width="34" height="16" rx="8" fill="#ffffff" opacity="0.4" />
      </svg>
    );
  }

  if (type === "triangle") {
    return (
      <svg viewBox="0 0 100 100" style={style}>
        <defs>
          <linearGradient id={`tri-${gradId}`} x1="0%" y1="0%" x2="20%" y2="100%">
            <stop offset="0%" stopColor={colors.light} />
            <stop offset="50%" stopColor={colors.base} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
        </defs>
        <polygon points="50,8 92,90 8,90" rx="10" fill={`url(#tri-${gradId})`} strokeLinejoin="round" />
        <polygon points="50,8 92,90 8,90" fill="none" stroke={colors.dark} strokeOpacity="0.25" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="50,20 68,54 32,54" fill="#ffffff" opacity="0.32" />
      </svg>
    );
  }

  // star
  const outerR = 46;
  const innerR = 20;
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    return `${50 + Math.cos(angle) * r},${50 + Math.sin(angle) * r}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" style={style}>
      <defs>
        <linearGradient id={`star-${gradId}`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="50%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.dark} />
        </linearGradient>
      </defs>
      <polygon points={points} fill={`url(#star-${gradId})`} strokeLinejoin="round" />
      <polygon points={points} fill="none" stroke={colors.dark} strokeOpacity="0.25" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="41" cy="34" rx="10" ry="6" fill="#ffffff" opacity="0.4" />
    </svg>
  );
}
