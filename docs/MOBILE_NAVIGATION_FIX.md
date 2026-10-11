# Mobile navigation reliability update

This is a complete source archive based on the supplied `ok(2).zip`, with targeted navigation changes only. The launch loader, avatars, Daily Challenge, city, profile, records, saved rewards, themes, and gameplay rules were not intentionally changed.

## What changed

- All internal link components across Home, Levels, gameplay, Daily Challenge, City, Ranking, Profile, Settings, and avatar fallback use `src/components/ReliableLink.jsx`.
- Standard Next.js transitions remain the first choice. If a tap starts navigation and the address has not changed after 2 seconds, a direct navigation to the canonical trailing-slash static-export URL is attempted. A second link tap cancels the earlier fallback, so stale taps cannot redirect the player to the wrong tab.
- Disabled automatic prefetching across menu links. The launch loader only prefetches large screens (and not when Save-Data is active) to reduce initial mobile WebView pressure. Its loading visuals and duration are unchanged.
- Raised bottom navigation above screen effects, enlarged tab and Home button touch targets, and increased the tappable area of screen back links.
- Android back on non-gameplay screens goes to Home instead of relying on WebView history, which could contain startup or non-game entries. Settings still returns to Profile; gameplay still pauses.
- `scripts/test-navigation.mjs` checks screen routes, direct navigation URLs, query strings, active tabs, and the shared link system. It is now included in `npm run test:logic`.

## Windows CMD installation (new folder, no overwrite)

Put `SortVerse3D_Mobile_Navigation_Fixed_Complete.zip` inside your existing SortVerse folder:

```cmd
cd /d "C:\Users\HAMMAD_RANA\Desktop\NextJS Games\sortverse-3d"
if not exist "sortverse-mobile-nav-fixed" mkdir "sortverse-mobile-nav-fixed"
tar -xf "SortVerse3D_Mobile_Navigation_Fixed_Complete.zip" -C "sortverse-mobile-nav-fixed"
cd /d "C:\Users\HAMMAD_RANA\Desktop\NextJS Games\sortverse-3d\sortverse-mobile-nav-fixed\ok"
npm install && npm run test:logic && npm run lint && npm run build && npm run dev
```

Visit `http://localhost:3000` when the local server starts. Stop on any error; do not assume `npm run build` passed merely because the logic checks did.

## Mobile verification required

1. Rapidly switch Home, Ranking, Profile, and Levels on a real phone; verify each link opens its intended page.
2. Open Daily Challenge and City from Home, then return using the back link.
3. Open Normal, Hard, and Expert levels, including transitions between levels, pause -> Home, and timed-out -> Levels.
4. Test portrait and a short-screen Android device; verify that every bottom tab responds to taps and remains clear of the gesture bar.
5. Test the built Capacitor app **offline**, including hardware back on each page. A reload fallback requires local static assets to be bundled correctly.
6. Check saved progress, daily gift claims, themes, avatar preview and ranking receipt actions did not regress.

## Verification performed in the editing environment

`npm run test:logic` passed, including navigation tests for all eight app routes and the existing game checks. Syntax parsing passed for 44 modules and 98 source imports. **Not verified**: actual mobile taps, browser/Android runtime, `npm run lint`, and `npm run build`. Dependencies are absent in this environment, and the offline npm install could not retrieve them. `AGENTS.md` and `node_modules/next/dist/docs/` are not present in the uploaded ZIP, so no claim of checking the installed Next.js documentation is made. No new Next.js API was introduced.
