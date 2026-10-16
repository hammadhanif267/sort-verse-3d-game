# Codemagic: missing native icon assets

## Symptom

`npm run test:codemagic` fails with `ENOENT` for
`native-assets/ios/AppIcon.appiconset/Contents.json` during the "Run game and native-asset tests" step.

## Cause

The previous "complete" package accidentally omitted the generated Android and iOS icon resource directories. The test script correctly requires the iOS app icon catalog, even when invoked by the Android workflow. The gameplay logic itself passes.

## Fix

This package restores:

- `native-assets/ios/AppIcon.appiconset/Contents.json` and its 18 PNG icon sizes.
- `native-assets/android/res/mipmap-*/` including adaptive/round launcher icon assets.

It intentionally **does not** restore `native-assets/android/res/values/sortverse_colors.xml` because that file would duplicate the Capacitor `ic_launcher_background` resource and break Gradle.

The artwork is unchanged and comes from `native-assets/app-icon-source-1024.png`.

## Windows CMD (from the Git repository root)

If you use the *patch ZIP*, extract it into the repository root, not into an extra `ok/` directory. Then run:

```cmd
npm run test:codemagic
npm run test:logic
git add -f native-assets/ios/AppIcon.appiconset native-assets/android/res
git add scripts/test-codemagic-lint-and-icons.mjs docs/CODEMAGIC_MISSING_ICON_ASSETS_FIX.md
git status --short
git commit -m "Restore native icons for Codemagic"
git push origin master
```

Run a new **Android test APK** workflow in Codemagic after the GitHub push. Check the *commit hash* for that build; old builds will still contain missing assets. If the project uses a different branch, push that branch instead.

## Verification limits

`npm run test:codemagic` tests the asset catalog, Android resource copying and no-duplicate-color configuration. It is not a native APK build. Android Gradle compilation and iOS Xcode compilation must still run on Codemagic.
