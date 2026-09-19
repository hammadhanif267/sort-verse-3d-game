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
