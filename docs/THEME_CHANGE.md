# Game themes

In the game, open **Profile → Settings → Game theme**. Choose **Midnight Blue**, **Emerald**, **Royal Purple**, or **Amber Sunset**. Midnight Blue restores the original look.

Themes change menu backgrounds, gameplay scenery tint, panels and navigation. Sorting-piece colours, puzzle mechanics, progress, screenshots and reward logic are not changed. The selected theme stays on this device in `sortverse-setting-theme`, is included in Export progress code, and is covered by the existing Capacitor Preferences mirror.

## Windows Command Prompt (CMD)

If you're updating an existing installation, save `SortVerse3D_Theme_Update_ONLY.zip` in the folder containing `package.json`, then execute:

```cmd
cd /d "C:\Users\HAMMAD_RANA\Desktop\NextJS Games\sortverse-3d"
tar -xf "SortVerse3D_Theme_Update_ONLY.zip" && npm run test:logic && npm run lint && npm run build && npm run dev
```

For a clean project from the complete ZIP, use `SortVerse3D_Complete_With_Themes.zip` instead, then run `npm install` before testing and building.

Note: static checks do not replace visual testing on a real phone. Verify theme persistence after reopening the app, and check that puzzle piece colours remain unchanged.
