# SortVerse 3D · Offline engagement update

New routes: `/journey`, `/skins`, `/special`, `/trophies`. Gameplay uses the existing eight-tube system with cosmetic-only glass rendering; all puzzle pieces retain unique shapes and normal win criteria.

### Gameplay and scoring
- Star par now starts from the verified plain-color solution instead of an inflated color-count floor. Extra grace moves remain for ice/chains/bombs. Par is not a full proof of obstacle solvability.
- Hint searches up to its existing bounded budget. The message says **Solver route** only when the search actually finds a solution; otherwise it says **Suggested move**.
- Victory screen reveals stars in order and previews the next mission. The animations honor reduced-motion preferences.
- Optional special goals: `no-hint` (Normal 3), `precision` (Normal 4), `golden` (Normal 9), `speed` (Hard 3). Each first successful result is saved in `sortverse-special-claimed-v1` and credits its reward via the standard completion wallet once.

### Cosmetics and collectibles
- Tube shop saves `sortverse-owned-skins-v1` and `sortverse-tube-skin-v1`, using the existing wallet keys. No currency exchange or online purchase is involved.
- `sortverse-monthly-aurora-v1`: month-keyed, one-time cosmetic unlock for seven distinct completed Daily Puzzles in the same local month. Free gifts do not count.
- Trophy Book uses `sortverse-trophy-claims-v1` to guard coin rewards. It reads real level stars, special completions, skin ownership and daily completion records.

### Comfort and devices
- Casual Mode only disables the countdown. It does not modify stored campaign level IDs or original mission definitions. Challenge payouts are ineligible in Casual Mode.
- `sv-large`, `sv-contrast`, `sv-reduced`, `sv-low` root classes control optional presentation.
- Pip is an original vector robot (`public/illustrations/guide-bot.svg`), not an externally sourced copyrighted mascot.
- Existing Android Capacitor project generation and signing instructions remain unchanged; native app has **not** been built or exercised on hardware here.

### Regression checklist
1. Home and new routes; Android physical Back and pause.
2. Fresh Level 1, midgame ice Normal 5, hard special, Expert 12.
3. Replay rewards; special prize exactly once; trophy claim exactly once; shop purchase exactly once.
4. Free daily gift vs daily puzzle vs monthly cosmetic; local calendar rollover.
5. Export/import and restored cosmetic and achievement keys.
6. Profile preset/photo/selfie and all four previous themes.
7. Small-screen toolbar, reduced motion and low graphics on a low-end phone.

Full lint/build and visual testing must run on a machine with installed packages before release.
