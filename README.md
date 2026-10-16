## New: 36-Level Campaign Overhaul

See [docs/GAMEPLAY_OVERHAUL.md](docs/GAMEPLAY_OVERHAUL.md) for the changed mission progression, mechanics, tests, and Windows CMD instructions.

# SortVerse 3D

An offline-first sorting puzzle with 36 levels (Normal, Hard, Expert), daily challenges, avatar customization, achievements, a city and local performance records. Built with Next.js App Router, React, Tailwind CSS and Three.js, packaged on Android with Capacitor.

```sh
npm install        # required first time: update the older lockfile for Capacitor
npm ci             # only AFTER npm install has updated package-lock.json
npm run dev
npm run test:logic  # dependency-free reward/backup checks
npm run lint
npm run build          # static assets in out/
npm run build:android  # once Android is installed and configured
```

No game server, account or database is required. Progress lives on-device; export a progress code from Settings before uninstalling or changing devices. The default Android application ID in `capacitor.config.json` is a **placeholder**: change and confirm it before creating any release build. See `docs/ANDROID_RELEASE.md`.

For **Windows CMD** extraction and setup, see [docs/WINDOWS_CMD_SETUP.md](docs/WINDOWS_CMD_SETUP.md).

## Offline visual themes

From **Profile → Settings → Game theme**, choose Midnight Blue (original), Emerald, Royal Purple, or Amber Sunset. The theme updates immediately across menus, gameplay background and neutral UI panels. Puzzle-piece colours and city progress are not altered. The choice is saved as `sortverse-setting-theme`, included in progress export/import and mirrored to Capacitor Preferences with the existing offline backup system.

## New offline features (October 2026)

- **Journey map** (`/journey`): 36 campaign missions in three pictured floating-city worlds. Existing level progress remains unchanged.
- **Tube Skins** (`/skins`): Six visual themes. Classic is free, Crystal and Neon use coins, Gold and Galaxy use diamonds, and Aurora is unlocked via seven completed daily puzzles in a month. Cosmetics never alter move rules.
- **Special Missions** (`/special`): Four optional replayable skill goals with one-time bonus rewards. They do not grant their bonus in Casual Mode.
- **Trophy Book** (`/trophies`): Six collectible achievement rewards with one-time local claims.
- **Pip**: A new original robot guide illustration shown briefly in early tutorials. Its appearance can be disabled in Settings.
- **Comfort & Accessibility**: Casual Mode (no timers), reduced animation, high contrast, larger text, and low graphics styling.
- **Daily collection**: The already-existing daily attendance streak is preserved. Seven completed daily puzzles within one calendar month unlock the Aurora cosmetic.
- **Victory polish**: Staggered stars and a next-mission preview. Hint feedback distinguishes a verified short solver route from a scored legal move.

All newly added storage keys begin with `sortverse-` and are included in progress exports and the existing native Preferences mirror. No backend, database, or new secrets are required.

### Verify on Windows Command Prompt

```cmd
npm ci && npm run test:logic && npm run lint && npm run build && npm run dev
```

`npm run build` exports the app into `out/`. Device performance, screenshot appearance, and all 36 obstacles remain to be tested manually. The original game layout and avatar system are unchanged. The gameplay illustrations are original SVG and existing city-stage art; the AI-generated concept storyboard supplied for review is **not** a set of ready-made interactive screens.


## Codemagic cloud builds (Mac mini M2)

The repository-root [`codemagic.yaml`](codemagic.yaml) defines Android debug APK, signed AAB, iOS simulator, and optional signed iOS IPA workflows. See [`docs/CODEMAGIC_SETUP.md`](docs/CODEMAGIC_SETUP.md) for setup, signing, and release requirements. The Android/iOS platform directories are generated during CI.
