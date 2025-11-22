# Live Metrics and Period Table System Documentation

## Overview

This document explains how the live metrics and period performance table work in the NHL Analytics site. This system displays real-time game statistics calculated from play-by-play data and updates dynamically as the game progresses.

## Architecture

### Data Flow

```
NHL API → Backend (api_server.py) → Frontend (GameDetails.jsx) → PeriodStatsTable.jsx
```

1. **NHL API**: Provides raw game data (boxscore, play-by-play, game center)
2. **Backend (`api_server.py`)**: Processes play-by-play data to calculate metrics
3. **Frontend (`GameDetails.jsx`)**: Fetches and displays live game data
4. **PeriodStatsTable Component**: Renders the period-by-period statistics table

## Key Components

### 1. Backend: `live_in_game_predictions.py`

**Purpose**: Calculates live metrics from play-by-play data

**Key Functions**:
- `get_live_game_data(game_id)`: Fetches and processes game data
- `_calculate_real_period_stats()`: Calculates period-by-period statistics
- `_calculate_goals_by_period()`: Determines goals scored in each period

**Current Period Detection**:
```python
# Dynamically determines current period from play-by-play data
play_by_play = game_data.get('playByPlay', {}) or game_data.get('play_by_play', {})
plays = play_by_play.get('plays', []) if play_by_play else []
if plays:
    last_play = plays[-1]
    last_play_period = last_play.get('periodDescriptor', {}).get('number', current_period)
    if last_play_period and last_play_period > 0:
        current_period = last_play_period
```

**Why This Matters**: The boxscore may lag behind play-by-play data. By checking the most recent play, we ensure the active period is always shown, even if it just started.

### 2. Backend: `api_server.py` - `/api/live-game/<game_id>`

**Purpose**: Formats live metrics for frontend consumption

**Key Logic**:
1. Gets live metrics from `live_in_game_predictions.py`
2. Formats period stats into array structure for frontend
3. Determines which periods to include based on `current_period` and `game_state`

**Period Filtering Logic**:
```python
# For completed games, always show all 3 periods
if game_state in ['FINAL', 'OFF']:
    current_period = 3  # Force show all periods

# For live games, dynamically get current period from play-by-play
if game_state not in ['FINAL', 'OFF']:
    # Get most recent play's period from play-by-play
    last_play = plays[-1]
    current_period = last_play.get('periodDescriptor', {}).get('number', current_period)

# Build period stats array - only include periods <= current_period
for period_num in range(1, 4):  # Periods 1, 2, 3
    if game_state not in ['FINAL', 'OFF'] and period_num > current_period:
        continue  # Skip future periods for live games
    # Include this period in the array
```

**OT/SO Period Detection**:
- Checks for OT/SO goals: `away_ot_goals > 0 or home_ot_goals > 0`
- Checks if `current_period >= 4` (indicates OT is active/completed)
- Uses `PostGameReportGenerator._check_for_ot_period()` for additional validation

### 3. Frontend: `GameDetails.jsx`

**Purpose**: Main component for displaying game details

**Key Responsibilities**:
- Fetches live game data from backend API
- Passes `periodStats` and `currentPeriod` to `PeriodStatsTable`
- Displays live metrics (xG, Corsi, Pressure, etc.)

**Data Fetching**:
```javascript
const fetchLiveGameData = async () => {
    const data = await backendApi.getLiveGame(gameId);
    setLiveData(data);
    setPeriodStats(data?.period_stats || []);
    setCurrentPeriod(data?.live_metrics?.current_period || data?.current_period || 1);
};
```

**Live Metrics Display**:
- Shows metrics from `liveData.live_metrics` or `liveData.advanced_metrics`
- Falls back to pre-game season averages if live data unavailable
- Updates automatically as game progresses

### 4. Frontend: `PeriodStatsTable.jsx`

**Purpose**: Renders period-by-period statistics table

**Key Features**:
- Filters periods based on `currentPeriod` prop
- Always shows OT/SO periods if they exist
- Calculates totals from filtered periods
- Highlights winning team for each metric

**Period Filtering**:
```javascript
const filteredPeriodStats = periodStats.filter(period => {
    const periodNum = period.period;
    // Always show OT and SO if they exist
    if (periodNum === 'OT' || periodNum === 'SO') {
        return true;
    }
    // For numeric periods, only show if <= currentPeriod
    const periodInt = parseInt(periodNum);
    if (!isNaN(periodInt)) {
        return currentPeriod ? periodInt <= currentPeriod : true;
    }
    return true;
});
```

**Metrics Displayed**:
- Goals For/Against (GF/GA)
- Shots (S)
- Corsi % (CF%)
- Expected Goals (xGF/xGA)
- Hits, PIM, Blocked Shots
- Giveaways/Takeaways
- Zone Metrics (OZS, DZS, NZS)
- Rush Attempts, Forecheck Cycles (FC)

## Live Metrics Calculation

### Source: Play-by-Play Data

All live metrics are calculated from play-by-play data, not boxscore totals. This ensures:
- Real-time accuracy
- Period-by-period breakdowns
- Advanced metrics (xG, zone metrics, movement metrics)

### Key Metrics

1. **Expected Goals (xG)**: Calculated using `ImprovedXGModel` based on shot location, type, and context
2. **Corsi %**: Shot attempts for / (shot attempts for + shot attempts against)
3. **Zone Metrics**: 
   - OZS: Offensive Zone Shots
   - DZS: Defensive Zone Shots
   - NZS: Neutral Zone Shots
4. **Movement Metrics**:
   - Rush: Shots following a faceoff or turnover
   - FC: Forecheck Cycle shots (sustained pressure)
5. **Physical Stats**: Hits, PIM, Blocked Shots, Giveaways, Takeaways (from boxscore player stats)

## Period Table Behavior

### Live Games

- Shows periods 1 through `current_period` (inclusive)
- `current_period` is dynamically determined from play-by-play data
- New periods appear automatically when they start
- Example: If period 2 just started, both periods 1 and 2 are shown

### Completed Games

- Always shows all 3 periods (1, 2, 3)
- Shows OT period if game went to overtime
- Shows SO period if game went to shootout
- `game_state` must be 'FINAL' or 'OFF' for this behavior

### OT/SO Periods

- OT periods are added when:
  - `away_ot_goals > 0 or home_ot_goals > 0`, OR
  - `current_period >= 4`, OR
  - `_check_for_ot_period()` returns True
- SO periods are added when:
  - `away_so_goals > 0 or home_so_goals > 0`

## Data Structure

### Backend Response Format

```json
{
  "live_metrics": {
    "current_period": 2,
    "game_state": "LIVE",
    "away_period_stats": {
      "shots": [10, 8, 0],
      "corsi_pct": [55.2, 48.1, 0],
      "hits": [12, 8, 0],
      "fo_pct": [52.0, 48.0, null],
      "pim": [4, 2, 0],
      "bs": [5, 3, 0],
      "gv": [3, 2, 0],
      "tk": [4, 3, 0]
    },
    "home_period_stats": { ... },
    "away_period_goals": [1, 0, 0],
    "home_period_goals": [0, 1, 0],
    "away_ot_goals": 0,
    "home_ot_goals": 0,
    "away_so_goals": 0,
    "home_so_goals": 0,
    "away_xg_by_period": [1.2, 0.8, 0.0],
    "home_xg_by_period": [0.9, 1.1, 0.0],
    "away_zone_metrics": {
      "oz_originating_shots": [6, 4, 0],
      "dz_originating_shots": [2, 1, 0],
      "nz_originating_shots": [2, 3, 0],
      "rush_sog": [1, 1, 0],
      "fc_cycle_sog": [8, 6, 0]
    },
    "home_zone_metrics": { ... }
  },
  "period_stats": [
    {
      "period": "1",
      "away_stats": {
        "goals": 1,
        "ga": 0,
        "shots": 10,
        "corsi": 55.2,
        "xg": 1.2,
        "xga": 0.9,
        "hits": 12,
        "faceoff_pct": 52.0,
        "pim": 4,
        "blocked_shots": 5,
        "giveaways": 3,
        "takeaways": 4,
        "nzt": 2,
        "nztsa": 1,
        "ozs": 6,
        "dzs": 2,
        "nzs": 2,
        "rush": 1,
        "fc": 8
      },
      "home_stats": { ... }
    },
    {
      "period": "2",
      "away_stats": { ... },
      "home_stats": { ... }
    }
  ]
}
```

## Troubleshooting

### Period Table Not Showing Active Period

**Symptoms**: Period table only shows completed periods, not the active period

**Causes**:
1. `current_period` not being updated from play-by-play data
2. Backend filtering out active period
3. Frontend not receiving updated `currentPeriod` prop

**Solutions**:
1. Check backend logs for `current_period` value
2. Verify play-by-play data is being processed
3. Ensure `PeriodStatsTable` receives `currentPeriod` prop
4. Check that period filtering logic includes `<= current_period` (not just `<`)

### Live Metrics Showing Zeros

**Symptoms**: All live metrics show 0 or are missing

**Causes**:
1. Play-by-play data not available
2. Metrics calculation failing
3. Data not being copied to `live_metrics` in response

**Solutions**:
1. Check backend logs for play-by-play processing
2. Verify `_calculate_real_period_stats()` is being called
3. Ensure physical stats are extracted from boxscore `playerByGameStats`
4. Check that `live_metrics` structure is properly populated

### OT/SO Periods Not Showing

**Symptoms**: Overtime or shootout periods not appearing in table

**Causes**:
1. OT/SO goals not being calculated
2. `has_ot` or `has_so` flags not set
3. Period stats not being calculated for OT/SO

**Solutions**:
1. Verify `_calculate_goals_by_period()` returns OT/SO goals
2. Check that `has_ot` and `has_so` are correctly determined
3. Ensure `_calculate_ot_so_stats()` is being called
4. Verify OT/SO periods are added to `period_stats_array`

## History and Reversion

### Key Changes Made

1. **Dynamic Period Detection** (2025-01-XX):
   - Changed from boxscore-only period detection to play-by-play based
   - Ensures active period is always shown, even if just started

2. **Period Filtering Logic** (2025-01-XX):
   - Updated to show periods `<= current_period` (not just `<`)
   - Added special handling for completed games (always show all 3 periods)

3. **OT/SO Period Support** (2025-01-XX):
   - Added detection for OT/SO periods
   - Added calculation of OT/SO period stats
   - Added OT/SO periods to period stats array

4. **Live Metrics Structure** (2025-01-XX):
   - Standardized `live_metrics` structure in backend response
   - Added fallback chains in frontend for data access
   - Ensured physical stats are extracted from boxscore

### Reverting Changes

If you need to revert to a previous version:

1. **Period Detection**: Remove play-by-play check, use only boxscore:
   ```python
   # Remove this block:
   if game_state not in ['FINAL', 'OFF']:
       play_by_play = game_data.get('playByPlay', {})
       # ... play-by-play period detection ...
   
   # Keep only:
   current_period = period_info.get('currentPeriod', 1)
   ```

2. **Period Filtering**: Change back to strict `<` comparison:
   ```python
   # Change from:
   if period_num > current_period:
   
   # Back to:
   if period_num >= current_period:
   ```

3. **OT/SO Periods**: Remove OT/SO detection and calculation blocks

## Files Modified

- `live_in_game_predictions.py`: Period detection, metrics calculation
- `api_server.py`: Period filtering, OT/SO detection, response formatting
- `GameDetails.jsx`: Data fetching, prop passing
- `PeriodStatsTable.jsx`: Period filtering, table rendering

## Testing

### Test Cases

1. **Live Game - Period 1 Active**:
   - Should show only period 1
   - `current_period` should be 1
   - Metrics should update in real-time

2. **Live Game - Period 2 Just Started**:
   - Should show periods 1 and 2
   - `current_period` should be 2
   - Period 2 should have data (may be zeros if just started)

3. **Completed Game**:
   - Should show all 3 periods
   - `current_period` should be 3
   - All periods should have data

4. **Overtime Game**:
   - Should show periods 1, 2, 3, and OT
   - OT period should have stats
   - `has_ot` should be True

5. **Shootout Game**:
   - Should show periods 1, 2, 3, OT (if applicable), and SO
   - SO period should show shootout goals
   - `has_so` should be True

## Future Improvements

1. **Real-time Updates**: WebSocket support for instant updates
2. **Period Transitions**: Visual indicators when periods change
3. **Historical Comparison**: Compare current period to team averages
4. **Advanced Filtering**: Filter by situation (5v5, PP, PK)
5. **Export Functionality**: Export period stats to CSV/PDF

