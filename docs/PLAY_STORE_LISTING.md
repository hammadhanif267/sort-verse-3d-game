# SortVerse 3D | Google Play listing and declarations

## Store listing

**App name** (12/30 characters): SortVerse 3D

**Short description** (maximum 80 characters):

Sort colorful pieces, solve daily puzzles and build your own offline city.

**Full description:**

SortVerse 3D is a colorful, offline sorting puzzle game. Put matching pieces into the same tubes, solve each challenge and watch your futuristic floating city grow.

Discover 36 levels across Normal, Hard and Expert modes. Each new level introduces new patterns and mechanics such as locks, frozen pieces and timed bomb challenges. Different shapes help you tell colors apart. Use the Undo and Hint boosters when you need a hand.

Return for a Daily Challenge, earn coins and diamonds, track your personal records and unlock achievements. Choose a girl or boy avatar, or use your own photo to personalize your profile. View your progress and share a performance receipt when you want to.

All game progress stays on your device. No account, internet connection, multiplayer service, online ranking, advertisements or cloud saving is required. You can export a progress backup code in Settings and import it on another installation.

Features:
- Offline puzzle gameplay with 36 levels and three difficulties
- Daily Challenge and streak rewards
- Sorting mechanics, timed puzzles, hints and undo moves
- A city that grows with your progress
- Avatars, achievements, local performance records and shareable receipts
- Sound, music and vibration controls
- Manual backup and restore using a progress code

Play at your own pace and build your SortVerse.

## Art assets

- `store-assets/icon-512.png` : 512 × 512 32-bit RGBA PNG sourced from existing `public/icons/icon-512.png`.
- `store-assets/feature-graphic-1024x500.png` : 1024 × 500 24-bit RGB PNG cropped from the existing supplied banner image (`public/og-image.jpg` in the original archive; removed from the cleaned web project).

Before uploading, inspect the feature graphic at mobile thumbnail sizes, especially the text margins and subject crop. The store artwork is **not** an Android launcher screenshot.

**Screens to capture on a real phone (portrait):** Home with floating city, gameplay with matching colored tubes, harder timed mechanics, Daily Challenge, level grid, city stages, My Performance/records and share receipt, avatar preview/selfie chooser, achievements and Settings. Capture actual game content rather than constructing fake gameplay. Google Play requires at least two phone screenshots.

## Draft Data safety answers (verify final binary before publishing)

- Data collected by developer or its server: **No**, for the current local-only architecture. No analytics SDK, ads SDK, account API, backend, database or developer telemetry is included in the source reviewed here.
- Data shared automatically with outside parties by this app: **No**. When the player explicitly shares a receipt image using the Android share sheet, the chosen third-party app handles that file under its own terms.
- Personal information/photos: users may locally set a nickname, take a selfie, or import an existing photo. Photos and game progress remain on device in localStorage / Android Preferences unless the player explicitly exports a code or uses the share sheet.
- Data deletion: use Profile > Reset progress to clear local game records and Settings > Export code to make a manual backup. An uninstall may erase all local data. Confirm that imported photos and any Android Preferences mirrors are actually erased during reset on a physical device.
- Encryption in transit: not applicable to app-to-developer collection (there is no transmission). Play Console’s precise answer options can differ, so answer the questionnaire for the shipping binaries and SDKs.
- Privacy-policy page: `docs/privacy-policy.html` must be hosted publicly over HTTPS. Replace the publisher contact placeholder before submission.

## Draft IARC/content-rating answers (subject to the actual game)

- Category: Game, puzzle/casual.
- Ads: **No** (no third-party advertising SDK).
- Violence: no realistic violence, gore, injuries or weapon use shown. Bomb graphics act as a puzzle/timer mechanic, not violence against people. Verify gameplay captures and wording.
- Sexual content/nudity: none.
- Profanity, discriminatory language: none.
- Drugs, alcohol, tobacco, gambling or real-money wagering: none.
- In-app purchases: none in the current implementation. Coins are earned in-game, not bought using real money.
- User-to-user communications, live chats, user-generated public content: none. Native share uses user action and the OS share sheet.
- Location collection: none; device local date is used for Daily Challenge.
- Login or externally hosted content: none.

Do not set a guessed age-rating badge. The IARC questionnaire calculates regional ratings. After gameplay or monetization changes, redo the declarations.

## Target audience and policy choice

**Publisher decision required:** If the intended audience is only teens/adults, choose age groups starting at 13–15, but only if your actual presentation, marketing and audience genuinely support that selection. The playful art, avatars and kid-style voice might appeal to younger children. Choosing 13+ merely to escape Families compliance is not valid if you deliberately target children.

If you choose "all ages" or include under-13 groups, Google Play Families policies, suitability and SDK requirements apply, even without ads. The IARC content rating is not the same as the declared target audience. Privacy policies and data safety answers are required either way.

Official guidance: https://support.google.com/googleplay/android-developer/answer/9859655

## Unfinished publisher details

1. Confirm production app ID; `com.yourname.sortverse` is a placeholder.
2. Confirm app name `SortVerse 3D`.
3. Provide a support email and publicly host the privacy policy.
4. Test on device, finalize consent/permissions, age targeting, and any future monetization before answering Play Console.
