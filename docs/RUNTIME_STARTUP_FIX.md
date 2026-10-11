# Gameplay startup fix (2026-10-11)

## Fixed

- `src/app/gameplay/page.js`: resolve the normalized `difficulty` route parameter before computing the special-mission ID or creating the unlock-store selector. Previously the component used `difficultyParam` / `difficulty` in their temporal dead zone and crashed immediately with `ReferenceError: Cannot access 'difficulty' before initialization`.
- Use normalized `difficulty` consistently for the special-mission lookup, so unsupported query values fall back to Normal.
- Memoize the unlock snapshot callback to avoid unnecessary external-store resubscriptions.
- Move the intro-chime side effect outside the `setPaused` updater so React's dev/Strict Mode cannot run it twice in an updater.
- Correct the Android-back exit confirmation to indicate that unfinished puzzles are saved.
- Add `npm run test:entry`, included in `npm run test:logic`, to catch similar initialization mistakes.

## Checks performed

- Passed: `npm run test:logic` (gameplay entry, offline rewards, backup, themes, all campaigns, board generation and special-mission logic).
- Passed: syntax parse of 49 JS/JSX modules with TypeScript's parser; no use-before-declaration diagnostics identified in the static JavaScript check.
- Passed: simulated render of the transpiled gameplay page for normal, hard, expert, locked, daily and special-mission routes.
- **Not run to completion:** `npm run lint` and `npm run build`. Packages could not be installed in the packaging environment; `eslint` and `next` are missing there. These must run on your Windows machine.
- **Not tested:** physical Android performance and end-to-end gameplay.

## Windows CMD

Put the downloaded complete ZIP inside your `sortverse-3d` directory. To test without overwriting your existing game:

```cmd
cd /d "C:\Users\HAMMAD_RANA\Desktop\NextJS Games\sortverse-3d"
if not exist "sortverse-runtime-fixed" mkdir "sortverse-runtime-fixed"
tar -xf "SortVerse3D_Runtime_Fixes_Complete.zip" -C "sortverse-runtime-fixed"
cd /d "sortverse-runtime-fixed\ok"
npm ci
npm run test:logic
npm run lint
npm run build
npm run dev
```

If an old dev process is running, stop it first with **Ctrl+C**. In the updated project directory, remove `.next` if present (`if exist .next rmdir /s /q .next`) before running `npm run dev`.
