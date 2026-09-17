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
