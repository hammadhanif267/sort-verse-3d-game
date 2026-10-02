# SortVerse real-data / realtime build

This build removes simulated leaderboard rivals. Ranking data now comes from the included server API (`/api/players`) and contains only players that have actually opened/played/synced the game.

## Included behavior
- Unique persistent player identity per browser/device.
- Server-backed player records with protected identity token hash.
- Server-side score calculation from earned stars and daily completions.
- Global leaderboard from actual synced players.
- Weekly leaderboard from actual points earned after that player's weekly baseline.
- Friends leaderboard contains only real friend IDs stored on player records; no fabricated friends are generated.
- Public leaderboard profile route: `/profile/[playerId]`.
- Leaderboards refresh every 5 seconds and public profiles every 10 seconds.
- Progress/profile changes trigger immediate sync attempts.
- No bot usernames or simulated ranking scores.
- Shared upward-moving Congratulations toast for level completion, daily claims, streak bonuses, achievement claims, weekly reward claims, and city level-up.

## Persistence
By default the included Node API stores player data in `.sortverse-data/players.json` under the project directory. For a single persistent Node server, set `SORTVERSE_DATA_FILE` to a path on a persistent volume.

For multi-instance commercial deployment, replace the file-store functions in `src/app/api/players/route.js` with Postgres/Supabase/another transactional database. The client data contract can remain the same.

## Security boundary
Scores are recalculated on the server from submitted star/daily progress instead of trusting a submitted numeric score. A commercial anti-cheat system should additionally issue server-authorized level sessions and validate completion events before accepting progress; no browser-only puzzle can make client input fully tamper-proof by itself.

## Daily streak tick fix
- Calendar day is now marked complete when either the daily puzzle is completed or that day's free daily gift is claimed.
- Existing free-claim history restores ticks for previously claimed days.
- Claiming today updates the tick immediately without falsely marking the puzzle itself as completed.
