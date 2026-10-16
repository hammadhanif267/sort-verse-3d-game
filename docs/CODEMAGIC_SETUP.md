# Codemagic setup: SortVerse 3D (Apple Silicon Mac mini M2)

This project is a Next.js 16 static export wrapped in Capacitor 8, **not** Flutter.
The root `codemagic.yaml` uses `instance_type: mac_mini_m2`. Codemagic builds the web content (`out/`) and generates the native wrappers during each build, because this ZIP does **not** contain `android/` or `ios/`.

## Before your first build

1. Extract the ZIP; the **repository root** is the directory containing `package.json`, `capacitor.config.json`, and `codemagic.yaml`. In the downloaded archive it is `ok/`. Make that directory the Git repository root, not its parent.
2. Push the extracted project to a private GitHub/GitLab/Bitbucket repository. Never add secrets, keystores, or passwords.
3. Add the repository in [Codemagic](https://codemagic.io), select the branch, and use **Check for configuration file**. It finds the root `codemagic.yaml`. All workflows run on **Mac mini M2** (Apple silicon).
4. First choose **SortVerse - Android test APK (Mac mini M2)**. No Android release keystore is needed. The downloaded APK is a *debug* app for testing, **not** a Play Store AAB.
5. Before any release build, change `capacitor.config.json` `appId` from `com.yourname.sortverse` to a **permanent** package/bundle ID you own. Google Play IDs cannot be changed after publication. Make the matching change in `codemagic.yaml`'s iOS `bundle_identifier` if building iOS.

## Android workflows

**android-debug-apk:** Executes `npm ci`, existing game tests, ESLint, `next build` (static `out/`), `npx cap add android`, `scripts/configure-android.mjs`, `npx cap sync android`, and Gradle `assembleDebug`. Artifact: `android/app/build/outputs/apk/debug/*.apk`.

**android-release-aab:** Requires the permanent app ID and a private Android release/upload keystore. Create the keystore locally; back it up in **two separate secure locations**. In Codemagic Team settings > codemagic.yaml settings > Code signing identities > Android keystores, upload it with the **exact reference** `sortverse_upload_key` (or update the YAML reference). Codemagic provides the secret variables `CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`. The build creates `android/keystore.properties` only inside CI, then generates a signed `*.aab` using Gradle `bundleRelease`. This secrets file is ignored by Git, never placed in artifacts, and is not printed.

Codemagic `BUILD_NUMBER` becomes Gradle `versionCode`. Before Play Console upload ensure it is **larger than every versionCode previously uploaded**, particularly if switching build workflows. No automatic store upload is configured: you download the AAB and upload it yourself.

## iOS workflows (Mac mini M2)

**ios-simulator:** Builds an **unsigned simulator-only** `.app`, zipped as `build/SortVerse3D-iOS-Simulator.zip`. This cannot be installed on a regular iPhone and is not an App Store IPA. The workflow installs matching `@capacitor/ios@8.5.3` during CI, generates `ios/` with `--packagemanager CocoaPods` (Capacitor 8 defaults to SPM otherwise), synchronizes assets and plugins, installs CocoaPods, and builds with `CODE_SIGNING_ALLOWED=NO`.

**ios-release-ipa:** This optional workflow creates a signed IPA after you configure Apple Developer Program membership, a valid bundle ID (change the YAML `ios_signing.bundle_identifier` as well), and matching App Store distribution certificate and provisioning profile under Codemagic Code signing identities. No Apple credentials are committed. This workflow is **not ready to run** with the example bundle ID. It uses `xcode-project use-profiles` and `xcode-project build-ipa`. If you only want Google Play, do not select this workflow.

The ZIP does not include `@capacitor/ios` in the tracked npm lockfile; only iOS workflows explicitly install it in CI. This preserves the existing application's pinned Android/web dependency setup. For reproducible iOS builds long-term, add the matching `@capacitor/ios` dependency with `npm install -D @capacitor/ios@8.5.3` on your PC and commit the resulting `package-lock.json`, then remove the CI extra-install steps.

## Important limitations and troubleshooting

- **No real APK/AAB/IPA has been generated here.** All four workflows require a successful Codemagic cloud run; we have not tested a Mac mini or Android/iPhone device.
- The included `android/` project is generated in Codemagic using the installed Capacitor 8 tooling. If the Android template changes, `scripts/configure-android.mjs` deliberately fails instead of silently ignoring the change.
- The Android project uses SDK 36 and portrait mode. The app is designed for fully offline play once installed, but **the build itself requires internet access** to download npm, Gradle, and CocoaPods dependencies.
- On an Android debug APK, Google Play signing is irrelevant. Do not use a debug APK for store upload.
- For iOS, iOS native plugin behavior and app icons/privacy declarations still need testing and platform-specific review.
- If `npm ci` fails, examine Codemagic logs and compare the committed lockfile with `package.json`. If `npm run lint` or `npm run build` fails, fix those errors; do not disable those checks to fake a successful build.
- If a Codemagic build fails in `EdgeToEdge` configuration or iOS CocoaPods, inspect the native Capacitor version and generated platform project before retrying.
- If an Android debug build requires a different Java version after a future Capacitor upgrade, change `environment.java` in `codemagic.yaml` deliberately.

## Reference docs

- Codemagic Ionic Capacitor: https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/
- Codemagic workflow configuration: https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/
- Codemagic Android signing: https://docs.codemagic.io/yaml-code-signing/signing-android/
- Codemagic iOS signing: https://docs.codemagic.io/yaml-code-signing/signing-ios/
- Existing Android release instructions: `docs/ANDROID_RELEASE.md`
