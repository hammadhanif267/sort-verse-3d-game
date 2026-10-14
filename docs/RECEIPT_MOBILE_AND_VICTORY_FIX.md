# Ranking receipts and victory header: focused mobile fix

## What changed

- Ranking receipt modals (Overall Performance and Individual Level Performance): the bottom navigation is hidden while a receipt is open, the overlay is above screen controls, the modal fits the available device height with safe-area padding, the details scroll independently, and the Save Receipt / Share Receipt buttons remain in an always-visible footer.
- Gameplay results (all modes): hide both mission title and objective when the Level Complete overlay is shown; preserve the level number, timer, rewards, and results actions. The instructions return on replay/new level.
- No changes to reward accounting, mission definitions, avatars, theme settings, or data storage.

## Verification

- `npm run test:logic`: passed.
- `node scripts/test-receipt-mobile-and-victory.mjs`: passed.
- TypeScript syntax parsing of 65 source/test JS/JSX/MJS files: passed.
- 132 local source imports resolved.
- `npm run lint` and `npm run build`: unavailable here (`eslint` and `next` are not installed). Run them after `npm ci` on a machine with npm access.
- Physical phone or Chrome Device Toolbar screenshots: not tested here.

## Testing notes

Check Ranking -> View All Records and Ranking -> individual level View on a 375x667 screen and an even shorter viewport. Scroll receipt details and verify Save and Share remain visible. Check a Normal, Hard and Expert win: the mission name/objective should be absent behind the results overlay and reappear when starting or replaying a level.
