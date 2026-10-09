# SortVerse 3D: React Compiler / ESLint follow-up

These changes respond to the lint results pasted on October 9, 2026. Apply it over **your existing installed project**, not over a fresh `npm ci` checkout. The patch deliberately does **not** overwrite `package.json`, `package-lock.json`, `node_modules`, icons, or your saved progress.

## Changes

- City screen: schedule stage transitions and level-up animations after commit; cancel pending animation frames/timeouts.
- Gameplay route: key the complete session by difficulty, level and daily date so pause and the timer reset together, without setting state synchronously in an effect. Use App Router navigation on Android back.
- Profile/Settings: hydrate locally stored values after the static initial render; keep the hard reload after full progress overwrite/reset to clear in-memory state. Preserve selfie/picture, preset avatar and full-source previews.
- Avatar preview: reset its auto-spin asynchronously and clean up the smile timer; replay remains user-triggered.
- Native back navigation: use the App Router for internal routes.
- Celebrations: use pure deterministic `scatter()` positions instead of calling `Math.random()` during React render / `useMemo`.
- Gameplay: use render-safe React state for Undo history, a proper ref for the mechanic-flash timeout, and time-expiry updates inside the timer callback. Reward effect dependencies are complete.
- Ranking: remove an unnecessary tick counter whose dependency caused an ESLint warning.
- Leave `<img>` on selected avatar preview paths intentionally: local/data-URL source images are not run through Next image optimization; per-line comments suppress the specific warning.

## Apply on Windows

From PowerShell opened in the `sortverse-3d` project directory, place the patch ZIP there and run:

```powershell
Expand-Archive -Path .\SortVerse3D_Lint_Fixes.zip -DestinationPath . -Force
npm run lint
npm run build
```

If both pass:

```powershell
npm run build:android
```

The TTS plugin was already confirmed installed at `8.0.2` in the pasted log; do not remove it. Keep your *locally regenerated* `package-lock.json`.

## Verification and limitations

The updated JS/JSX parses and all relative / alias imports resolve in the source tree; the reward/backup tests and deterministic scatter test pass. In this workspace `npm ci --offline` cannot retrieve a required Capacitor dependency, and `eslint` and `next` executables are missing. Therefore **neither a clean lint run nor a successful Next/Android build has been verified here**. The build log in the pasted text stops at `npm run build`, without its output. If Next reports more errors on your machine, its full build output is needed to diagnose those separately.

No device/camera/share/Three.js performance tests were run.

This file records the original *patch-only* handoff. For the full ZIP on Windows CMD, follow [WINDOWS_CMD_SETUP.md](WINDOWS_CMD_SETUP.md) instead of the PowerShell patch instructions above.
