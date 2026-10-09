# SortVerse 3D — implementation and validation status

## What is present

1. Static-export Next config, SEO/unused-file cleanup, favicon/assets/loading preserved.
2. First-clear reward ledger with legacy stars, independent Daily payouts, five distinct shapes, Undo/Hint, honest local ranking labels, Settings, SHA-256 progress backup and native Preferences mirror.
3. Capacitor app configuration and plugin dependencies, native icon/splash assets and a script to configure a generated Capacitor Android project. No native Android project was generated here.
4. Source integrations for native share, photo picker and camera, speech, back button, lifecycle audio, haptics and safe-area handling with web fallbacks.
5. Google Play listing draft, privacy HTML, release/signing guide, 512px store icon and 1024x500px feature graphic.

## Checks performed

- Parsed 41 JavaScript/JSX/MJS files with the TypeScript syntax parser, and resolved their local imports: 0 errors.
- `npm run test:logic`: PASS (first/replay/improvement/legacy reward, backup hash validation and restore).
- Android post-generation configuration script: PASS against **artificial stub template only**, on both first and repeat runs. **No Gradle compilation was performed.**
- Existing icon and new 512×512 + 1024×500 assets: dimensions/decoding inspected.
- `npm ci` attempted but network DNS prevented package download. As a result `node_modules/next/dist/docs/` was unavailable, and no Next documentation could be inspected locally.
- `npm run lint` and `npm run build` attempted after each phase (including final phase): BLOCKED; exit 127 because `eslint` / `next` are not installed. Zero successful lint/build runs. No `out/` exists.
- `npx cap init`, `npx cap add android`, `npx cap sync android` and `./gradlew bundleRelease`: NOT run successfully; packages/native platform unavailable.
- Device checks, Android 16 predictive back behavior, camera, share sheet, WebView safe areas, actual Three.js performance and Play Console: NOT TESTED.

## Mandatory next actions

1. Confirm permanent production `appId`, replace `com.yourname.sortverse` in `capacitor.config.json`; confirm name and publisher contact.
2. On a machine with registry access, run `npm install` to resolve Capacitor deps and update `package-lock.json`, then `npm ci`, `npm run lint`, `npm run test:logic`, `npm run build`. Inspect all `out/` routes and gameplay queries.
3. Run `npm run android:init` (creates real Android platform from Capacitor), review `scripts/configure-android.mjs` results, and `npm run build:android`. Fix any real SDK/Gradle/template issues revealed.
4. Create private Android signing key and `android/keystore.properties` yourself. Back up both in two places. Run `./gradlew bundleRelease` and independently verify signatures and manifest.
5. Install/test the resulting app on physical phones, then complete Play Console registration, declarations, closed testing as applicable, and AAB upload.

See `docs/ANDROID_RELEASE.md` for commands and checks, and `docs/PLAY_STORE_LISTING.md` for store declarations.
