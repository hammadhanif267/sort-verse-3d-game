# Vercel / Next.js 16 favicon repair

## Reported error

The Vercel build stopped with `./src/app/favicon.ico - Format error decoding Ico: The PNG is not in RGBA format!`.

## Cause and correction

The previous ICO contained six embedded **RGB** PNG images (PNG color type 2), even though its ICO directory declared 32-bit images. The Turbopack ICO decoder requires the embedded PNG images to have an alpha channel. The corrected `src/app/favicon.ico` is generated from the same SortVerse launcher artwork in **RGBA** (PNG color type 6) for 16, 32, 48, 64, 128 and 256 pixel sizes. The artwork itself has not changed.

Run `node scripts/test-vercel-favicon.mjs` to check every embedded icon before deploying.

## Deployment

1. Replace `src/app/favicon.ico` in the GitHub repository root. This can be done by extracting the small favicon patch ZIP into the project root, or by using the complete updated project.
2. From Windows CMD inside the project folder run `node scripts/test-vercel-favicon.mjs` (available in the full project ZIP), `npm run lint` and `npm run build`.
3. Commit and push to the Vercel-connected `master` branch. Only files on GitHub are built by Vercel, not changes made only on your local machine.
4. Trigger a new Vercel deployment and inspect its log.

This fix addresses the reported ICO error. The remainder of the Vercel build and any other possible errors must still be verified by an actual deployment.
