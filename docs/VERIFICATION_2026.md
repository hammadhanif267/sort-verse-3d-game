# Verification of the October 2026 gameplay UX update

## Checked in this environment

- `npm run test:logic`: **passed**, including reward replay/migration, backup, theme persistence, campaign data, move rules, every generated color board, and new once-only skin, special, monthly and trophy claims.
- JavaScript/JSX parsing: **49 source files passed**.
- Local import and route audit: **105 local imports resolved; all 12 route pages exist**.
- Original game files including avatars, camera, intro loader, ranking, icons and profiles remain present.
- `package-lock.json` root package requirements match the current `package.json`.

## Not verified

- `npm ci --offline`: failed with **ENOTCACHED** while downloading an unavailable npm dependency.
- `npm run lint`: failed because `eslint` is not installed (exit 127).
- `npm run build`: failed because `next` is not installed (exit 127).
- `next/dist/docs` not available here. Existing Next APIs were reused; no undocumented new Next runtime API was introduced.
- Not tested in a graphical browser or on Android hardware.
- The generated puzzle tests only establish solvability of the **color-only boards**. Obstacles and boosters still require playtesting through all 36 levels.

## Playtest focus

1. Fresh install and new player Home; navigation to Journey, Skins, Special, Trophy Book, and back buttons.
2. Gameplay: regular / casual, a special win, special failed condition, replay, reset, profile re-entry.
3. Purchase skin with coins and with gems; switch styles; confirm saved equipment after reopening.
4. Complete seven separate Daily Puzzles within one month; claim Aurora once; verify free gifts do not advance the 7-puzzle total.
5. Claim a trophy twice; second attempt must never grant coins.
6. New visual layout on narrow and short phones, especially Home extras and gameplay tutorial overlays.
7. Settings toggles: high contrast, large text, reduced motion, low graphics, guide robot and audio.
8. Existing camera/selfie, avatar crop, Native Back, receipt sharing, safe-area insets, and Android WebView performance.

Production and release builds must not be shipped until npm lint and build pass on the intended machine and these workflows pass device testing.
