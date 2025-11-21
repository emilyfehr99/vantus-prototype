# MoneyPuck Data Integration Notes

## Current Implementation

**How MoneyPuck data is fetched:**
- MoneyPuck data is fetched **on-demand** when API endpoints are called
- There is **NO scheduled scraping at 5am** - the data is fetched directly from MoneyPuck's CSV files when needed
- MoneyPuck updates their CSV files daily, so we get fresh data each time we fetch
- The backend caches the data for 1 hour to avoid excessive API calls

**Current endpoints that use MoneyPuck:**
- `/api/team-data` - Fetches from `teams.csv` (but not all fields are included)
- `/api/player-stats` - Fetches from `skaters.csv`
- `/api/lines/<team>` - Fetches from `lines.csv`

**Issue:**
- The `/api/team-metrics` endpoint currently uses a local JSON file (`season_2025_2026_team_stats.json`) instead of MoneyPuck's `teams.csv`
- Not all available fields from MoneyPuck's `teams.csv` are being used

## Available MoneyPuck Fields (from teams.csv)

The MoneyPuck teams.csv includes ALL of these fields (for both "For" and "Against"):
- xGoals, xRebounds, xFreeze, xPlayStopped, xPlayContinuedInZone, xPlayContinuedOutsideZone
- flurryAdjustedxGoals, scoreVenueAdjustedxGoals, flurryScoreVenueAdjustedxGoals
- shotsOnGoal, missedShots, blockedShotAttempts, shotAttempts, unblockedShotAttempts
- goals, rebounds, reboundGoals, freeze, playStopped, playContinuedInZone, playContinuedOutsideZone
- savedShotsOnGoal, savedUnblockedShotAttempts
- lowDangerShots, mediumDangerShots, highDangerShots
- lowDangerxGoals, mediumDangerxGoals, highDangerxGoals
- lowDangerGoals, mediumDangerGoals, highDangerGoals
- xGoalsFromxReboundsOfShots, xGoalsFromActualReboundsOfShots, reboundxGoals
- totalShotCredit, scoreAdjustedTotalShotCredit, scoreFlurryAdjustedTotalShotCredit
- penalties, penaltyMinutes, faceOffsWon
- hits, takeaways, giveaways, dZoneGiveaways
- And percentage metrics: xGoalsPercentage, corsiPercentage, fenwickPercentage

## Recommended Changes

1. Update `/api/team-metrics` to fetch directly from MoneyPuck's `teams.csv`
2. Include ALL available fields from the CSV
3. Keep backward compatibility by including legacy field names (xg, hdc, hdca, etc.)
4. The data will automatically be fresh since MoneyPuck updates daily

## Benefits

- Always up-to-date data (MoneyPuck updates daily)
- Access to all advanced metrics MoneyPuck provides
- No need for manual scraping or scheduled jobs
- Simpler architecture (fetch on-demand)

