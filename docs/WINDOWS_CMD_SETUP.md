# SortVerse 3D: Complete ZIP installation (Windows Command Prompt)

This ZIP contains the **entire updated game source** with the React Compiler lint fixes, Capacitor configuration, artwork, Play Store materials and offline tests. It is not a compiled Android app. It does not contain node_modules, android/, out/, keystores, or passwords. These are created locally.

## 1. Extract to a new directory (do not overwrite the original)

Download `SortVerse3D_Complete_Fixed.zip` into your Downloads directory. Open **Command Prompt (cmd.exe)** and paste:

```cmd
cd /d "%USERPROFILE%\Desktop\NextJS Games"
mkdir "sortverse-3d-complete"
tar -xf "%USERPROFILE%\Downloads\SortVerse3D_Complete_Fixed.zip" -C "sortverse-3d-complete"
cd /d "%USERPROFILE%\Desktop\NextJS Games\sortverse-3d-complete"
```

If your browser saved the ZIP somewhere else, replace the Downloads path with the exact ZIP path.

## 2. Install, test, and run

```cmd
npm install
npm run test:logic
npm run lint
npm run build
npm run dev
```

Open http://localhost:3000 after `npm run dev` starts. Press Ctrl+C in CMD to stop the server.

**Important:** Start with `npm install` rather than `npm ci`. The bundled `package-lock.json` comes from before the new Capacitor packages were added. `npm install` reconciles it with `package.json`. Keep the newly generated lockfile thereafter. `npm run build` should create `out/` if the static export succeeds.

## 3. Android (only after a successful lint and build)

The Android package ID in `capacitor.config.json` is **com.yourname.sortverse**, a placeholder. Decide your permanent app ID and edit that file before creating the Android project.

```cmd
npm run android:init
npm run build:android
```

You need Android Studio, the appropriate Android SDK, and JDK. If you later set up signing and have a real keystore, the release build command from the project root is:

```cmd
cd android
gradlew.bat bundleRelease
```

Do **not** execute a release build with the placeholder app ID. Do not share a keystore, signing passwords or `android/keystore.properties`. See `docs/ANDROID_RELEASE.md` for required signing, device testing and Play Console steps.

## Verification limits

This package merges the earlier full SortVerse preparation ZIP and the subsequent ESLint source patch. Native Android files have not been generated, and lint/build remain **unverified** in the packaging environment because the required npm dependencies could not be installed there. Run the commands on your own machine and inspect their actual exit status. Existing personal avatar data and game saves are not included in the ZIP and should not be expected to transfer automatically.
