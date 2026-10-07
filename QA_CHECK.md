# Sortverse QA / Fixes in this build

## Verified / fixed
- Offline ranking no longer pretends the local player is global rank #1.
- `Top 10 — Global top 10` achievement is locked in offline mode instead of becoming claimable after a reset or daily reward.
- Ranking reward calculation rejects missing/invalid ranks.
- Completing a level now advances the player level to the completed level, rather than incrementing again when replaying an older level.
- Level progression is based on the highest contiguous cleared level, so directly opening a later gameplay URL cannot unlock later levels without clearing the earlier levels.
- Existing real local gameplay records remain the source for Top Scores / Stats; no fake players or fake scores were added.
- Existing reset behavior clears `sortverse-*` game data, including achievement claims and profile avatar/name.
- Profile already had a functional in-game avatar creator; it is now a more explicit cartoon avatar builder with shape, colour, face expression, and background choices.
- Avatar SVG gradient IDs are now unique per avatar instance, preventing one ranking/profile avatar from accidentally reusing another avatar's gradient.
- Gameplay reset, drag/drop, chain, frozen, bomb, triple, reward, and completion code was inspected; only one `resetGame` declaration exists.
- Puzzle generator was exercised for Normal/Hard/Expert levels 1-12 with the available local JS puzzle logic; object counts stayed correct and special-piece counts matched the intended difficulty rules.

## Build note
The container could not complete `npm ci` because a dependency tarball was not available in the local npm cache and the package registry request timed out. Therefore a full `next build` could not be executed in this environment. Static import checks and puzzle-generation checks were run instead.
