# Navigation reliability and last-15-second warning

Only navigation and the countdown warning were changed in this update.

## Navigation

- All internal screen links use `src/components/ReliableLink.jsx` rather than importing `next/link` directly. It still uses the Next.js router normally, but disables eager prefetch (less contention on low-end phones) and schedules a standard page navigation if the address has not changed after 1.8 seconds.
- A second tap replaces the previous pending fallback; browser modified-click and new-tab behavior remain unchanged.
- The bottom navigation and Home shortcuts have larger tap targets and foreground stacking so translucent art cannot cover them. Android hardware Back routes use the same fallback.
- All screens still live at their original URLs and keep the existing local saves; no backend is used.

## Alarm

- Timed missions ring a brief synthesized warning as they enter the last **15 seconds**, with reminders at 10, 5, 3, 2 and 1 seconds.
- Crossing a threshold because of an in-game time penalty still rings once. Ordinary seconds are silent to avoid constant noise.
- Alarms stop on pause, win, timeout and when the app is backgrounded. Casual/untimed levels never ring.
- The alarm uses the existing **Sound Effects** and global mute preferences, not the Music setting. It does not queue an alarm if the audio context is suspended.
- There are no new audio assets, permissions, native plugins, backend calls, or storage migrations.

## Verify on your Windows development machine

```cmd
npm ci
npm run test:logic
npm run lint
npm run build
npm run dev
```

Test Home → Levels → Ranking → Profile → Home in both desktop and Chrome's mobile viewport, rapidly switching buttons and allowing for slow transitions. Test all four extra pages (Journey, Missions, Skins, Trophies), Daily Challenge and City. Start a timed level and wait for the final 15 seconds; verify an audible alarm with Sound Effects on, silence with Sound Effects off and with the game paused, and no alarm in Casual Mode. Repeat on a physical Android device before shipping.

**Environment limit:** Without installed project dependencies, only source-level route checks and Node logic tests were executable here. A real browser/device navigation test and a compiled Next.js build remain your verification steps.
