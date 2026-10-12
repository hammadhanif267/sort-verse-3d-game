# Daily Challenge layout and Back navigation fix

This release changes only screen layout and Back navigation. The reward ledger,
missions, achievements, sound/alarm, skins, avatars and other gameplay systems are
unchanged.

## Daily Challenge
- Removed vertical centering from the scroll viewport, which could clip the first
  card above the header on small phones.
- Reordered sections to show the streak summary, Today's Puzzle and Free Daily
  Gift first, followed by weekly progress and Monthly Puzzle Collection.
- The content scrolls within the available space between the fixed header and
  bottom navigation. Bottom padding keeps the final explanatory text visible.
- Weekly day labels are slightly larger.

## Screen Back
- All top Back buttons use the prior in-app screen instead of hardcoded links.
- History is session-only (`sessionStorage`), not game progress. It works on
  desktop, mobile browsers and Capacitor, including full-navigation fallbacks.
- A direct deep link with no in-app history uses a sensible fallback (Home,
  Profile, Levels, or Journey, depending on the screen).
- Gameplay's existing Android Back pause/exit behavior is preserved.

## Verification
Passed: `npm run test:logic`, `node scripts/test-page-history.mjs`, parsing of
64 source/test JS modules, and local import resolution.

Unverified: Next lint/build and real browser/Android layout. This environment
could not install missing dependencies (`npm ci --offline` reported ENOTCACHED).

## Windows CMD
From the extracted `ok` folder:

```cmd
npm ci
npm run test:logic
npm run lint
npm run build
npm run dev
```

Test: Home -> Levels -> Journey -> Back (Levels), City -> Tube Skins -> Back
(City), and Profile -> Tube Skins -> Back (Profile). Visit Daily Challenge on a
small phone and scroll top to bottom, ensuring both the streak card and gift card
are fully reachable.
