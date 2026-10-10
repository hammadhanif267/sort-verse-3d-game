// Pure move rules shared by gameplay and the hint engine. Game state is immutable.
export const TUBE_CAPACITY = 4;
export const TRIPLE_BONUS_COINS = 15;

export function isSorted(tubes) {
  return tubes.every(({ objects }) => objects.length === 0 || (
    objects.length === TUBE_CAPACITY && objects.every((o) => o.color === objects[0].color &&
      !(o.chainLayers > 0) && !o.frozen && o.bombTurns == null)
  ));
}

export function legalMoves(tubes) {
  const options = [];
  for (let from = 0; from < tubes.length; from++) {
    const source = tubes[from].objects;
    const top = source.at(-1);
    if (!top || top.frozen || top.chainLayers > 0) continue;
    // Moving a completed tube is never needed to solve a color sort.
    if (source.length === TUBE_CAPACITY && source.every((o) => o.color === top.color && !o.frozen && !o.chainLayers && o.bombTurns == null)) continue;
    for (let to = 0; to < tubes.length; to++) {
      if (from === to) continue;
      const target = tubes[to].objects;
      if (tubes[to].sealed || target.length === TUBE_CAPACITY || (target.length && target.at(-1).color !== top.color)) continue;
      options.push({ from, to, color: top.color });
    }
  }
  return options;
}

export function applySortMove(tubes, from, to, { tripleBurst = false, targetColor = null, vaultOpened = false } = {}) {
  const moving = tubes[from]?.objects.at(-1);
  const dest = tubes[to]?.objects;
  if (!moving || from === to || moving.frozen || moving.chainLayers > 0 || tubes[to]?.sealed || !dest || dest.length >= TUBE_CAPACITY || (dest.length && dest.at(-1).color !== moving.color)) return null;
  const next = tubes.map((tube) => ({ ...tube, objects: tube.objects.map((o) => ({ ...o })) }));
  const moved = next[from].objects.pop();
  const rainbowCollected = Boolean(moved.rainbow);
  if (rainbowCollected) moved.rainbow = false;
  next[to].objects.push(moved);
  const target = next[to].objects;
  const triple = target.length >= 3 && target.slice(-3).every((o) => o.color === moved.color);
  const completedTube = target.length === TUBE_CAPACITY && target.every((o) => o.color === moved.color);
  const unlockedChainIds = [], meltedIceIds = [];
  if (triple) {
    for (const tube of next) for (const piece of tube.objects) {
      if (piece.color !== moved.color) continue;
      if (piece.chainLayers > 0) { piece.chainLayers--; unlockedChainIds.push(piece.id); }
      if (piece.frozen) { piece.frozen = false; meltedIceIds.push(piece.id); }
    }
  }
  let gateUnlocked = false;
  if (triple && targetColor && moved.color === targetColor) {
    for (const tube of next) {
      if (tube.sealed) { tube.sealed = false; gateUnlocked = true; }
    }
  }
  let bombPenaltySeconds = 0;
  for (const tube of next) for (const piece of tube.objects) {
    if (piece.bombTurns == null) continue;
    piece.bombTurns--;
    if (piece.bombTurns <= 0) {
      piece.bombTurns = null; // No piece deletion, puzzle stays possible.
      bombPenaltySeconds += 10; // Bombs have an actual cost, not a free reward.
    }
  }
  const mysteryRevealed = [];
  for (const tube of next) for (const piece of tube.objects) {
    if (piece.mystery) { mysteryRevealed.push(piece.id); piece.mystery = false; }
  }
  // If the layout is fully sorted, all remaining bomb fuses are safely disarmed.
  // Otherwise players could have a perfect board but no permitted moves to win.
  const colorsComplete = next.every(({ objects }) => !objects.length || (
    objects.length === TUBE_CAPACITY && objects.every((o) => o.color === objects[0].color && !o.chainLayers && !o.frozen)
  ));
  if (colorsComplete) for (const tube of next) for (const piece of tube.objects) piece.bombTurns = null;
  const vaultUnlocked = Boolean(targetColor && !vaultOpened && completedTube && moved.color === targetColor);
  const tripleBonus = Boolean(tripleBurst && triple && !unlockedChainIds.length && !meltedIceIds.length);
  const bonusCoins = (tripleBonus ? TRIPLE_BONUS_COINS : 0) + (vaultUnlocked ? 45 : 0);
  return { tubes: next, completedTube, triple, unlockedChainIds, meltedIceIds, mysteryRevealed,
    bombPenaltySeconds, gateUnlocked, vaultUnlocked, tripleBonus, rainbowCollected, bonusCoins };
}

function shape(tubes) {
  return tubes.map(({ objects, sealed }) => `${sealed ? 'L' : ''}${objects.map((o) => `${o.color[0]}${o.frozen ? 'F' : ''}${o.chainLayers || ''}${o.bombTurns == null ? '' : 'B'}`).join('.')}`).sort().join('|');
}
function quality(move, tubes) {
  const source = tubes[move.from].objects;
  const dest = tubes[move.to].objects;
  const tail = dest.filter((o) => o.color === move.color).length;
  const top = source.at(-1);
  const hidden = source.length > 1 && source.at(-2).color !== top.color;
  return (dest.length === 3 ? 130 : dest.length === 2 ? 90 : dest.length ? 55 : 0) +
    (hidden ? 20 : 0) - (dest.length === 0 ? 30 : 0) + tail * 5;
}

export function findBestHint(tubes) {
  // Prefer moves on a short verified route. Bounded to keep offline phones fast.
  // Unlike a first-legal-move hint, this searches legal moves and recognizes
  // locked pieces, ice and triple unlocks. It has a scored fallback.
  const moves = legalMoves(tubes).sort((a, b) => quality(b, tubes) - quality(a, tubes));
  if (!moves.length) return null;
  const options = { tripleBurst: false };
  const visited = new Set([shape(tubes)]);
  const queue = [{ board: tubes, first: null, depth: 0 }];
  const LIMIT = 900;
  for (let head = 0; head < queue.length && head < LIMIT; head++) {
    const current = queue[head];
    if (current.depth > 8) break;
    const candidates = legalMoves(current.board).sort((a,b) => quality(b,current.board)-quality(a,current.board));
    for (const candidate of candidates) {
      const result = applySortMove(current.board, candidate.from, candidate.to, options);
      if (!result) continue;
      const first = current.first || candidate;
      if (isSorted(result.tubes)) return first;
      const key = shape(result.tubes);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push({ board: result.tubes, first, depth: current.depth + 1 });
      if (queue.length > 2600) break;
    }
  }
  return moves[0];
}
