# Sortverse Offline Ranking

The ranking system intentionally uses no database, backend leaderboard, MongoDB, Firebase, Supabase, or remote player sync.

All ranking values are calculated from the current player's actual local gameplay progress stored by the browser. Global, Weekly, and Friends tabs therefore never contain fake players or invented scores. Without a shared online service, other devices cannot appear in the ranking.

Weekly score is calculated from the player's real score earned during the current local week. The current week baseline is stored locally and resets automatically when the week changes.
