# SortVerse 3D: offline Android release guide

> **BLOCKED IN THE HANDOFF ENVIRONMENT**: npm registry DNS was unavailable. No `node_modules/next/dist/docs/`, Android Gradle project, completed `next build`, `out/`, emulator, phone, or signed AAB could be verified. The package.json plugin declarations are present, but `package-lock.json` still predates Capacitor and MUST be regenerated on a connected machine before `npm ci` works. Do not upload anything until the build and tests below pass.

## 0. Confirm publisher identity before building for release

- **APP_NAME:** `SortVerse 3D` (default).
- **APP_ID:** `com.yourname.sortverse` is **only a placeholder**. The package identifier is permanent on Google Play. Replace it with your confirmed reverse-domain identifier in `capacitor.config.json` **before** the first `npm run android:init` and first release build. It cannot be changed for an existing Play listing without publishing a new app.

## 1. Install and generate Android platform

Requirements: Node 22+; Android Studio and JDK supported by Capacitor 8; Android SDK Platform 36 and Build Tools; Gradle installed through the Android wrapper. Set `ANDROID_HOME` as required by Android Studio.

```sh
# Online machine: install packages and UPDATE package-lock.json once.
npm install
npm ci
npm run lint
npm run build
# Must produce: out/index.html, out/gameplay/index.html,
# out/levels/index.html, out/daily/index.html, out/city/index.html,
# out/ranking/index.html, out/profile/index.html, out/settings/index.html

# Confirm APP_ID first. Creates android/ with Capacitor's official template
# and applies SDK 36, portrait, launcher icons, dark splash, signing config.
npm run android:init
npm run build:android

# If the android project already exists:
npm run android:configure
npm run build:android
```

The project uses `output: "export"`, `trailingSlash: true`, and `images.unoptimized: true`, with Capacitor `webDir: "out"`. No remote server URL is configured. The bundled web assets are the sole content origin. Do not turn on a live reload `server.url` in a production release.

`src/app/gameplay/page.js` uses `useSearchParams` within React `Suspense` so query strings can work on the single exported `/gameplay/` page. Smoke-test `/gameplay/?level=1&difficulty=normal` and `/gameplay/?level=2&difficulty=hard`, and open Daily Challenge through the game so it carries its date parameter.

**Build diagnostic rule:** after every change run `npm run lint && npm run build`, then `npm run build:android`. Do not assume a successful `npx cap sync` means a valid Android binary.

## 2. SDK, screen, splash and insets

`npm run android:configure` is an idempotent, checked patch for files created by `npx cap add android`. It sets `compileSdkVersion` and `targetSdkVersion` to **36** in `android/variables.gradle`; adds `android:screenOrientation="portrait"` to MainActivity's manifest; enables native AndroidX `EdgeToEdge`; and copies mipmap and adaptive launcher icons from `native-assets/android/res/`. It installs a dark `#020b15` splash style. `capacitor.config.json` auto-hides the native splash after 400 ms, leaving existing `SplashLoader`, `LoadingView`, and `RouteLoading` as the in-app experience.

API 36 is the current required target for new Google Play Android phone apps as of 31 August 2026: https://support.google.com/googleplay/android-developer/answer/11926878 . Recheck when submitting.

`@capacitor-community/safe-area` handles older Android Chromium (before v140) edge-to-edge inset bugs. Capacitor 8 `SystemBars.insetsHandling` is set to `disable` per this plugin's integration guide; supported WebViews use `viewportFit: "cover"` and CSS `env(safe-area-inset-*)`. Verify notch, punch-hole, landscape restriction and gesture bar visually on actual devices. Previewing CSS on a desktop does not verify this.

## 3. Upload signing key (keep everything out of Git)

From the **android/** directory, generate your own private upload keystore. The example below creates a new key but **has not been run by this handoff**:

```sh
cd android
keytool -genkeypair -v -keystore sortverse-upload.jks \
  -alias sortverse-upload -keyalg RSA -keysize 4096 -validity 10000
```

Create `android/keystore.properties` yourself, replacing all values with secrets:

```properties
storeFile=sortverse-upload.jks
storePassword=YOUR_LOCAL_SECRET
keyAlias=sortverse-upload
keyPassword=YOUR_LOCAL_SECRET
```

Both `android/keystore.properties` and `*.jks` / `*.keystore` are gitignored. Do not commit, upload, publish screenshots of, or include them in diagnostic archives. **Back up the keystore and passwords in two independent secure places.** Google Play App Signing is recommended. Configure your upload certificate within Play Console as requested by Play.

## 4. Signed release AAB

```sh
# project root
npm run lint && npm run build
npm run build:android
cd android
./gradlew clean bundleRelease
# Windows: gradlew.bat clean bundleRelease
```

Output after a successful build: `android/app/build/outputs/bundle/release/app-release.aab`. The Gradle signing block refuses `bundleRelease` if `keystore.properties` is missing, avoiding an accidental unsigned "release". Verify actual signing with `jarsigner -verify` and inspect the bundle with Google's bundletool. Verify the final `applicationId`, versionCode, target SDK and no unwanted permissions in Android Studio and Play Console. Do **not** reuse the placeholder package ID for a production release.

If an Android or Gradle update replaces native template files, rerun `npm run android:configure` and review its diff. Do not blindly overwrite native changes. The script assumes the standard Capacitor 8 Groovy app Gradle file and Java MainActivity; if the upstream template changes, inspect and update the script instead of claiming success.

## 5. Physical-device release gates

- Install on a low-end Android phone and a modern Android 16 device. Check first-launch cold/warm start, offline airplane mode, app relaunch, runtime memory consumption, heat and frame time; avatar rendering uses Three.js but gameplay tubes are CSS/SVG.
- Verify all 36 level/difficulty combinations, first clear versus repeat coin/diamond payouts, star improvement, Undo/Hint costs, timer expiry and pause/exit.
- Verify Daily Challenge: a previously cleared Normal level does not automatically mark today complete; the daily route gives the independent daily reward once; day rollover and legacy log migration.
- Verify photo upload and selfie capture (permissions, cancel, crop, preserved source-photo full preview and auto-rotation); confirm photos never reach a network endpoint.
- Verify native Share shares the cached receipt image to other apps; verify saving and clipboard fallback on web.
- Verify back button/predictive-back, background/resume music, speech when offline/TTS voice absent, muted sound and vibration preferences.
- Verify the entire HUD, headers and BottomNav stay outside status/gesture bars and camera cutouts on different WebView versions; check font scaling.
- Test progress code validation, checksum failure, confirm-overwrite, uninstall/restore limitations; Android Preferences mirror survives app restart but **not necessarily uninstall**.
- Inspect network traffic in airplane mode (app must keep working), startup/logcat errors, package security and Play pre-launch report. Hardware/device Play Console testing is not covered by this handoff.

## 6. Play Console steps the publisher must perform

Create and verify a developer account; choose and confirm the permanent app ID; host the privacy-policy HTML from `docs/privacy-policy.html` at a **public HTTPS URL**; complete Store Listing, Data Safety, Target Audience and IARC questionnaires truthfully; upload this project’s 512x512 icon, 1024x500 feature graphic and your own phone screenshots; configure Google Play App Signing; upload the signed AAB to internal/closed testing.

For **personal developer accounts created after 13 November 2023**, Google currently requires at least **12 testers continuously opted in for 14 days** before applying for production access. This is conditional on the developer account type/creation date, not a universal requirement: https://support.google.com/googleplay/android-developer/answer/14151465 .
