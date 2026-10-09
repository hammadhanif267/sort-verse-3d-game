// Pure, backward-compatible accounting. Persisted `sortverse-level-rewards`
// keeps the Daily UI's historic {coins, diamonds} totals intact.
export function calculateLevelAward(stars, rewards, entryId, earnedStars, coinReward) {
  const previousStars = Math.max(0, Number(stars?.[entryId]) || 0);
  const prior = rewards?.[entryId];
  // Old versions sometimes had stars without a rewards entry. Such saves
  // count as already paid, not as fresh levels to harvest on upgrade.
  const paidCoins = prior ? Math.max(0, Number(prior.coins) || 0) : previousStars > 0 ? coinReward : 0;
  const paidGems = prior ? Math.max(0, Number(prior.diamonds) || 0) : previousStars;
  // A replay at the same/worse star rating must not farm bonusCoins.
  const improves = previousStars === 0 || earnedStars > previousStars;
  const newCoins = improves ? Math.max(paidCoins, coinReward) : paidCoins;
  const newGems = improves ? Math.max(paidGems, earnedStars) : paidGems;
  return {
    coins: Math.max(0, newCoins - paidCoins),
    diamonds: Math.max(0, newGems - paidGems),
    total: { coins: newCoins, diamonds: newGems },
    bestStars: Math.max(previousStars, earnedStars),
  };
}
