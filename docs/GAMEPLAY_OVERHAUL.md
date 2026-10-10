# SortVerse 3D: 36-Level Campaign Redesign

## Shipped in this source archive

- 36 named mission definitions, twelve each in Normal, Hard and Expert (`src/lib/levelMissions.js`). Mission descriptions, colors, spare tubes, timing, and feature mixes are wired to gameplay and level select.
- Normal stages 1–3 have no countdown. Later stages have increased time budgets. Hard unlocks after Normal 4, Expert after Hard 6.
- Tutorial tube labels and an opening-move suggestion on Normal 1–2, plus a visible mission description on the board.
- Ice, chain layers, triple-match bonuses, bombs with 10-second penalties, hidden-color reveals, golden completion vaults, key-locked spare tubes, and a collectible rainbow **hint** booster. Rainbow is not a color-changing wildcard, to preserve four pieces per color.
- Two completed tubes charge a free rainbow hint; scoring rewards bonuses and chapter finishes on first clear only, with the existing save/reward ledger kept intact.
- Star thresholds use a solved color-layout baseline with additional grace moves for blockers. It is not an obstacle-aware optimal-move proof, but the previous impossible twelve-move target has been removed.
- Color-layout generation uses a bounded solver plus a reverse-scrambled guaranteed color solution fallback. The one-use Rescue control clears ice/chains/gates for three penalty moves if blockers become a trap.
- Existing city progression continues to read earned stars; a derived 0–12 city-beacon counter marks each chapter ending (level 3/6/9/12 per difficulty).
- All previous `sortverse-*` storage keys, daily reward ledger, ranking records, avatar previews, settings, theme presets, Capacitor configuration and icons are retained.

## Validation performed here

- `npm run test:logic`: passes, including rewards/backup, themes, campaign definitions, move rules, and all 36 generated starting boards.
- All 42 JS/JSX modules under src parsed using the TypeScript parser. 87 relative/alias imports checked, none missing.
- **Not verified**: `npm run lint` and `npm run build` because this environment lacks installed Next and ESLint binaries (`next: not found`, `eslint: not found`); npm installation could not complete here. Not verified: browser performance, completed solutions through every special-obstacle board, or physical Android testing.
- `node_modules/`, `.next/`, `out/`, keystores and signing secrets are deliberately omitted from the ZIP.

## Windows CMD, fresh sibling folder

Put the ZIP in the folder below and use CMD:

```cmd
cd /d "C:\Users\HAMMAD_RANA\Desktop\NextJS Games\sortverse-3d"
mkdir sortverse-gameplay-overhaul
tar -xf "SortVerse3D_36_Level_Overhaul.zip" -C "sortverse-gameplay-overhaul"
cd sortverse-gameplay-overhaul
npm install
npm run test:logic
npm run lint
npm run build
npm run dev
```

The project is extracted alongside the old one. Run **`npm install` first** to reconcile the existing Capacitor dependencies with the lockfile; do not use `npm ci` before this step. Complete Android packaging only after lint, build, and phone playtesting pass. Always keep an offline backup of your existing progress before switching browser origins.

## Playtest priorities

1. Play Normal 1–4 on a phone. Verify the first tutorial, star targets, and that Hard unlocks after Normal 4.
2. Complete Normal 5 (ice), Normal 12 (chapter boss), Hard 6 (key gate), Hard 9 (bombs), Expert 4 (mystery), Expert 6 (double chain), Expert 11 (combined mechanics).
3. Confirm rescue and Undo restore blockers, vaults, bonuses, time, and boosters consistently.
4. Verify daily gift red-dot behaviour, one daily claim, existing player saves and achievement/City progress.
5. Test small screens, landscape/portrait orientation, low-end Android performance, camera/share/back button, and full offline startup.

This source package is a campaign update for playtesting, **not** a completed signed Android release or evidence of Play Store readiness.
