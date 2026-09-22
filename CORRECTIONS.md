## Daily Challenge page (new)

- New route `/daily` — a full Daily Challenge hub: back header with
  coins/diamonds, a streak strip ("Day N of 7" + a live "next reward in
  Xh Ym" countdown to local midnight + a streak-flame badge once a streak
  is active), a 7-day Mon-Sun row (done = green check, today = gold ring,
  future = locked with a small coin/gem/gift preview), and a "Today's
  Puzzle" card with a mini tube preview, the level, reward chips, and a
  Play button.
- "Today's puzzle" is a real playable level: `level = 1 + (day-index % 12)`
  at `difficulty=normal`, so it always uses the existing 12 levels and is
  never lock-gated by the player's normal progress. Play links to
  `/gameplay?level=<n>&difficulty=normal` — GameplayScene itself is
  completely untouched.
- Completion is detected read-only, from the same `sortverse-level-rewards`
  localStorage entry the rest of the app already writes on level clear
  (`normal-<level>`) — no changes to gameplay/completion code were needed.
  A new `sortverse-daily-completed` map (date -> reward) is written only by
  this page, purely to drive the streak row and flame count.
- Home page's "Daily Challenge" button is no longer disabled; it now links
  to `/daily`.
- Added `GiftIcon`, `CheckCircleIcon`, `LockIcon` to icons.jsx, matching the
  existing icon style.
- Note: the puzzle preview thumbnail uses the game's own tube/colour system
  (not fruit-crate art like the reference) since fruit assets don't exist
  in this project — kept it in the app's own visual language instead.

## Critical bug fix + celebration/HUD pass

- **Found and fixed a serious bug**: the `completed` check had a leftover
  `return true;` before the real logic, so every level showed as instantly
  complete the moment it loaded — the puzzle was unplayable. Removed the
  dead line; levels now start unsolved as normal.
- Removed the small duplicate "Level X Complete!" header banner — only the
  big centered trophy modal (with petals + coin/diamond collect) shows now.
- Petal burst now gets a clear moment alone before coins/diamonds start
  collecting (coin chime at 650ms, diamond chime at 1050ms, was 420/780),
  and the +N float travels further (-46px vs -30px) so it reads as flying
  up into the total.
- The Ice/Triples/Chains/Bombs mechanics badge is no longer absolutely
  positioned at a fixed vh (which could land on top of the tubes on some
  screen heights) — it's now a normal flow element directly above the tube
  rows, so it always sits with a clean gap above them.

## Gameplay HUD spacing pass

- Mechanics badge row (Ice / Triples / Chains / Bombs) moved from `top-[8.5vh]`
  to `top-[13.5vh]` and given roomier padding — it no longer sits jammed
  against the "Sort the objects" subtitle.
- The "Level X Complete!" mid-round banner moved from `top-[9%]` to
  `top-[17%]` with slightly more internal padding — it no longer touches the
  top edge / overlaps the header and timer.
- Both were verified by temporarily forcing their trigger state on and
  screenshotting, then reverted before building.

# SortVerse correction pass

## Fixed

- Removed the remote Drei environment preset that blocked the first 3D render.
- Added an immediate lightweight tube preview while WebGL initializes.
- Added a locally bundled, optimized futuristic factory background.
- Added two detailed metallic 3D platforms so both tube rows match the demo composition.
- Made the Three.js canvas transparent so the environment remains visible.
- Updated the Levels screen to match the demo's dark factory styling and tube thumbnails.
- Added image-backed tube artwork to both unlocked and locked level cards.
- Connected Home, Levels, and Gameplay with prefetched Next.js links.
- Added a gameplay loading screen for immediate route feedback.
- Replaced starter metadata and removed the build-time Google font dependency.

## Audio pass

- Menu music: one continuous, seamlessly looping ambient theme that plays on the
  home page and the levels page and is not restarted when moving between them.
- Intro chime: the original ascending bell now plays exactly once, at the start
  of each level, instead of on the home page.
- Gameplay music: a separate, more driving loop that fades in just after the
  chime and runs for the whole level. It goes silent while the game is paused
  or the tab is hidden, and comes back on resume.
- All three are synthesized with the Web Audio API (no audio files), routed
  through a shared master bus, and unlocked on the first tap if the browser
  blocks autoplay.
- A sound on/off toggle sits in the home page header; the choice is remembered.

## Gameplay look pass

- New defocused factory backdrop (`public/gameplay-background.webp`) behind the
  board, plus a radial depth grade so the corners and the bottom fall away.
- Tubes rebuilt as thick glass barrels with a rounded floor, specular streaks,
  an anodised metal cap and a matching base — both tinted by the colour the
  tube holds.
- Shelves rebuilt as bevelled brushed-metal slabs with a machined top plate,
  a cyan edge strip and angled supports.
- Objects are now glossy clearcoat plastic: spheres, rounded cubes, and
  camera-facing extruded stars and triangles (shared geometry, built once).
- Lighting reworked: hemisphere fill, a warm key, a cool back rim and three
  practicals matching the factory strip lights.

## Verified routes

- `/`
- `/levels`
- `/gameplay`

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm run lint
npm run build
```

## Fix pass — gameplay reliability

- **Root cause of "no completion notification":** the win check compared
  `object.chainLayers === 0`, but ordinary objects never had that property
  set at all (`undefined`), and `undefined === 0` is `false`. So a level
  could never register as complete — on *any* level, not just ones with
  chain pieces. Fixed to `(object.chainLayers ?? 0) === 0`.
- **Root cause of unsolvable levels:** the chain/frozen/bomb/tripleBurst
  obstacle mechanics had solvability bugs — a 2-layer chain needed a
  3-of-a-kind match to happen twice, but only 3 spare copies of that color
  ever exist (the 4th is the locked chain piece itself), so a second match
  was never possible. Separately, `tripleBurst` and bomb detonation
  permanently deleted objects from tubes, leaving fewer than 4 copies of a
  color in play, which makes that color's tube — and the whole level —
  impossible to finish. Both mechanics are now switched off
  (`difficultyParams().mechanics`) until they can be redesigned
  non-destructively; puzzles are back to reliably solvable tube sorting
  with the working difficulty curve (colors / empty tubes / timer) intact.
- The Level Complete modal (stars, gold/diamonds earned, Next Level /
  Play Again) was already implemented correctly — it just never showed
  because `completed` could never become `true`. Both fixes above restore
  it.
- Player progress temporarily seeded to Level 5 (Normal) for this build so
  testing doesn't require replaying Levels 1-4 — see `APP_RESET_KEY` in
  `src/lib/playerStats.js`. Bump/reset that when going back to a clean
  Level 1 start.
