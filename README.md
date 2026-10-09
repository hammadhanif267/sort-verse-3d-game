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
