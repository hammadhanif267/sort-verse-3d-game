// Curated offline campaign. No save keys or level indices have changed.
export const LEVEL_COUNT = 12;
export const CAMPAIGN_UNLOCKS = Object.freeze({ hard: { difficulty: 'normal', level: 4 }, expert: { difficulty: 'hard', level: 6 } });

const campaigns = {
  normal: [
    ['First Spark', 'Learn to move a piece into a matching tube.', 2, 3, null, []],
    ['Perfect Match', 'Complete your first glowing tube.', 2, 3, null, []],
    ['Triple Celebration', 'Build your first matching triple.', 3, 3, null, ['tripleBurst']],
    ['Star Collector', 'Sort accurately to earn all three stars.', 3, 3, 180, ['tripleBurst']],
    ['Ice Breaker', 'Build a matching triple to thaw the ice.', 3, 3, 180, ['frozen']],
    ['Melt the Ice', 'Free a frozen piece to finish the sort.', 3, 3, 175, ['frozen', 'tripleBurst']],
    ['Combo Party', 'Fill tubes in succession to charge a booster.', 4, 2, 175, ['tripleBurst']],
    ['Frost Festival', 'Break the ice and keep sorting.', 4, 2, 175, ['frozen', 'tripleBurst']],
    ['Golden Goal', 'Complete the highlighted color for a golden bonus.', 4, 2, 180, ['golden']],
    ['Treasure Tube', 'Complete the golden color and open its prize.', 4, 2, 185, ['golden', 'frozen']],
    ['Master Mixer', 'Combine your ice and combo skills.', 4, 2, 195, ['frozen', 'tripleBurst', 'rainbow']],
    ['First Boss', 'Complete the chapter to light up your city.', 4, 2, 210, ['frozen', 'chains', 'tripleBurst']],
  ],
  hard: [
    ['Frozen Surprise', 'Thaw a frozen piece with a matching triple.', 4, 2, 200, ['frozen']],
    ['Unlock It', 'Break the chain by forming a triple.', 4, 2, 205, ['chains']],
    ['Combo Builder', 'Build a chain of completed tubes.', 4, 2, 205, ['tripleBurst']],
    ['Frozen Duo', 'Release the ice to restore the colors.', 4, 2, 215, ['frozen', 'tripleBurst']],
    ['Golden Piece', 'Finish the golden target tube.', 4, 2, 220, ['golden', 'frozen']],
    ['Key & Gate', 'Collect the key by completing the target color.', 4, 2, 220, ['key', 'tripleBurst']],
    ['Chain Reaction', 'Break chains and collect combo bonuses.', 5, 2, 230, ['chains', 'tripleBurst']],
    ['Rescue Mission', 'Free the ice and chained pieces.', 5, 2, 230, ['chains', 'frozen']],
    ['First Bomb', 'Handle a ticking piece without losing your sort.', 5, 2, 235, ['bombs']],
    ['Bomb Defuser', 'Finish before the countdown pressure builds.', 5, 2, 235, ['bombs', 'frozen']],
    ['Combo Rush', 'Charge a rainbow hint with completed tubes.', 5, 2, 240, ['tripleBurst', 'golden', 'rainbow']],
    ['Factory Boss', 'Free chains, ice and a ticking piece.', 5, 2, 255, ['chains', 'frozen', 'bombs']],
  ],
  expert: [
    ['Chain Master', 'Overcome chains and ice together.', 5, 2, 255, ['chains', 'frozen']],
    ['Bomb Rush', 'Think ahead with the countdown ticking.', 5, 2, 250, ['bombs']],
    ['Key Hunt', 'Find the key to the city vault.', 5, 2, 260, ['key', 'chains']],
    ['Mystery Sort', 'Reveal hidden colors by making progress.', 5, 2, 265, ['mystery']],
    ['Bomb & Ice', 'Break the freeze while handling bombs.', 5, 2, 270, ['bombs', 'frozen']],
    ['Double Lock', 'Break a reinforced chain.', 5, 2, 275, ['chains', 'doubleChain']],
    ['Frozen Fortress', 'Overcome two frozen pieces.', 5, 2, 280, ['frozen', 'doubleIce']],
    ['Precision Sort', 'Finish with an efficient move count.', 5, 2, 280, ['chains', 'tripleBurst', 'rainbow']],
    ['Mystery & Chains', 'Reveal mystery pieces and break the chains.', 5, 2, 285, ['mystery', 'chains']],
    ['Countdown Challenge', 'Earn extra seconds through tube completions.', 5, 2, 285, ['bombs', 'timeBonus']],
    ['Ultimate Puzzle', 'Combine the mechanics you have learned.', 5, 2, 300, ['mystery', 'frozen', 'bombs']],
    ['SortVerse Champion', 'Restore the grand city beacon.', 5, 2, 315, ['chains', 'frozen', 'bombs', 'golden', 'tripleBurst']],
  ],
};

export function getMission(difficulty = 'normal', level = 1) {
  const tier = Object.hasOwn(campaigns, difficulty) ? difficulty : 'normal';
  const index = Number.isInteger(Number(level)) ? Math.max(0, Math.min(11, Number(level) - 1)) : 0;
  const [title, objective, colorCount, emptyTubes, timeSeconds, featureList] = campaigns[tier][index];
  const features = [...featureList];
  return {
    id: index + 1, difficulty: tier, title, objective, colorCount, emptyTubes, timeSeconds,
    features, tutorial: tier === 'normal' && index < 6,
    chapterFinale: (index + 1) % 3 === 0,
    cityBeacon: index === 11,
    baseCoins: (index + 1) * 100,
  };
}

export function canEnterDifficulty(difficulty, progress) {
  if (difficulty === 'normal') return true;
  const requirement = CAMPAIGN_UNLOCKS[difficulty];
  return Boolean(requirement && (Number(progress?.[requirement.difficulty]) || 0) >= requirement.level);
}

export function getStarRating(moves, par) {
  // Par is a verified solution length for the actual color layout when available.
  // Additional mechanics only increase the real work needed, so add grace moves.
  const target = Math.max(1, Math.floor(Number(par) || 1));
  if (moves <= target + 5) return 3;
  if (moves <= Math.ceil(target * 1.5) + 6) return 2;
  return 1;
}
