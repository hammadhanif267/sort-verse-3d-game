# Codemagic Android resource merge fix (October 2026)

## Cause

The `:app:mergeDebugResources` task failed because Android found two definitions
of `color/ic_launcher_background`:

- `android/app/src/main/res/values/sortverse_colors.xml` (old SortVerse icon overlay)
- `android/app/src/main/res/values/ic_launcher_background.xml` (Capacitor template)

The warnings about `flatDir` and the Gradle 9 deprecations are unrelated to
this failure.

## Resolution

`native-assets/android/res/values/sortverse_colors.xml` has been removed.
`scripts/configure-android.mjs` now edits the existing generated color to
`#020b15`, removes any leftover legacy `sortverse_colors.xml` file, and ensures
only one definition of `ic_launcher_background` remains. The existing launcher
artwork, adaptive icon foreground, and the game's visual assets are unchanged.

The debug and signed-release Codemagic workflows both run this script after
`npx cap add android`, so the fix applies to both.

## Verification

From the repository root:

```
npm run test:codemagic
npm run test:logic
npm run lint
npm run build
```

Then push the corrected source to GitHub and rerun the Android Debug APK
workflow. A Codemagic/Gradle build cannot be claimed successful until it runs
there. No signing material should be committed.
