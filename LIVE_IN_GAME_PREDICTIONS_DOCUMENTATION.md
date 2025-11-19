# Live In-Game Predictions System - Complete Documentation

## Overview

The Live In-Game Predictions system provides real-time win probability predictions for NHL games currently in progress. The system calculates comprehensive advanced metrics from play-by-play data and adjusts predictions dynamically as the game progresses.

## Architecture

### System Flow

```
1. Frontend (prediction_dashboard.html)
   ↓ (requests live games)
2. Flask API (prediction_dashboard.py)
   ↓ (calls)
3. LiveInGamePredictor (live_in_game_predictions.py)
   ↓ (fetches data)
4. NHL API Client (nhl_api_client.py)
   ↓ (calculates metrics)
5. PostGameReportGenerator (pdf_report_generator.py)
   ↓ (analyzes plays)
6. AdvancedMetricsAnalyzer (advanced_metrics_analyzer.py)
   ↓ (returns)
7. Live Prediction with all metrics
```

## Core Components

### 1. Live Game Detection

**File:** `live_in_game_predictions.py` - `get_live_games()`

**How it works:**
- Fetches today's schedule from NHL API
- Filters games where `gameState` is `'LIVE'` or `'CRIT'`
- Returns list of active games

**Code Location:** Lines 25-48

```python
def get_live_games(self):
    """Get all currently active NHL games"""
    today = datetime.now(self.ct_tz).strftime('%Y-%m-%d')
    schedule = self.api.get_game_schedule(today)
    
    live_games = []
    for game in games:
        game_state = game.get('gameState', '')
        if game_state in ['LIVE', 'CRIT']:
            live_games.append(game)
    
    return live_games
```

### 2. Live Game Data Collection

**File:** `live_in_game_predictions.py` - `get_live_game_data()`

**What it collects:**
- Basic game state (score, period, time remaining)
- Team IDs and abbreviations
- Basic stats (shots, hits, PIM, blocked shots, giveaways, takeaways)
- **Advanced metrics calculated from play-by-play:**
  - Expected Goals (xG)
  - High-Danger Chances (HDC)
  - Game Score (GS) by period
  - Zone metrics (NZT, NZTSA, OZS, NZS, DZS, FC, Rush)
  - Movement metrics (Lateral, Longitudinal)
  - Period stats (Corsi%, Faceoff%, Power Play%)
  - Clutch metrics (3rd period goals, one-goal game, first goal scorer)

**Code Location:** Lines 50-258

**Key Methods Used:**
- `PostGameReportGenerator._calculate_xg_from_plays()` - Calculates xG
- `PostGameReportGenerator._calculate_hdc_from_plays()` - Calculates HDC
- `PostGameReportGenerator._calculate_period_metrics()` - Calculates GS by period
- `PostGameReportGenerator._calculate_zone_metrics()` - Calculates zone metrics
- `AdvancedMetricsAnalyzer.calculate_pre_shot_movement_metrics()` - Movement metrics
- `PostGameReportGenerator._calculate_real_period_stats()` - Period stats

### 3. Live Prediction Calculation

**File:** `live_in_game_predictions.py` - `predict_live_game()`

**Prediction Formula:**

1. **Base Prediction** (from historical model)
   - Uses `ImprovedSelfLearningModelV2.ensemble_predict()`
   - Based on team historical performance

2. **Live Momentum Adjustments**
   - Score differential impact (scaled by period)
   - Shot differential impact (2% per shot)
   - Power play goal impact (5% per PP goal)
   - Faceoff dominance (3% max)

3. **Time Pressure**
   - Later periods = more certainty
   - Leading team gets additional boost in later periods

4. **Final Probabilities**
   - Normalized to sum to 1.0
   - Clamped between 0.01 and 0.99

**Code Location:** Lines 321-373

**Momentum Calculation:** Lines 260-319

### 4. Flask API Endpoints

**File:** `prediction_dashboard.py`

#### `/api/games` (Lines 271-489)
- Returns all games for today
- Includes pre-game predictions
- Includes live predictions for active games
- Includes scores for finished games

#### `/api/game/<game_id>` (Lines 492-541)
- Returns specific game prediction
- Used for live updates

#### `/api/game/<game_id>/report` (Lines 603-1339)
- Returns comprehensive live game report
- Includes all advanced metrics
- Includes scoring summary with xG
- Includes period-by-period breakdowns
- Includes player stats

**Key Function:** `get_live_prediction()` (Lines 131-257)
- Calls `LiveInGamePredictor.get_live_game_data()`
- Calls `LiveInGamePredictor.predict_live_game()`
- Formats response with all metrics

### 5. Frontend Integration

**File:** `templates/prediction_dashboard.html`

**Live Game Display:**
- Auto-refreshes every 30 seconds
- Shows live badge for active games
- Displays current score and period
- Shows live win probabilities
- "View Report" button opens modal with comprehensive metrics

**Key JavaScript Functions:**
- `loadGames()` - Fetches games from `/api/games`
- `formatLiveReport()` - Formats comprehensive metrics for display
- `updateLiveGames()` - Auto-refreshes live games

**Live Report Modal Sections:**
1. **Advanced Metrics:** xG, HDC, GS, Corsi%
2. **Zone Metrics:** NZT, NZTSA, OZS, NZS, DZS, FC, Rush
3. **Movement Metrics:** Lateral, Longitudinal
4. **Period Stats:** By-period breakdowns
5. **Team Stats:** Faceoff%, Power Play%, Physical play stats
6. **Clutch Metrics:** 3rd period goals, one-goal game, first goal

## File Structure

### Core Files

1. **`live_in_game_predictions.py`** (501 lines)
   - Main live prediction class
   - Live game detection
   - Live data collection
   - Prediction calculation
   - Momentum calculation

2. **`prediction_dashboard.py`** (1,372 lines)
   - Flask application
   - API endpoints
   - Live prediction integration
   - Game report generation

3. **`templates/prediction_dashboard.html`** (~1,500 lines)
   - Frontend UI
   - Live game display
   - Live report modal
   - Auto-refresh logic

### Supporting Files

4. **`nhl_api_client.py`** (~170 lines)
   - NHL API wrapper
   - `get_game_schedule()` - Get schedule
   - `get_comprehensive_game_data()` - Get full game data
   - `get_game_boxscore()` - Get boxscore

5. **`pdf_report_generator.py`** (~3,700 lines)
   - Post-game report generation
   - Advanced metrics calculation
   - **Key methods used for live predictions:**
     - `_calculate_xg_from_plays()` - xG calculation
     - `_calculate_hdc_from_plays()` - HDC calculation
     - `_calculate_period_metrics()` - GS by period
     - `_calculate_zone_metrics()` - Zone metrics
     - `_calculate_real_period_stats()` - Period stats
     - `_calculate_goals_by_period()` - Goals by period
     - `_calculate_team_stats_from_play_by_play()` - Team stats

6. **`advanced_metrics_analyzer.py`**
   - Advanced metrics analysis
   - `calculate_pre_shot_movement_metrics()` - Movement metrics

7. **`improved_self_learning_model_v2.py`**
   - Historical prediction model
   - `ensemble_predict()` - Base prediction

## Advanced Metrics Explained

### Expected Goals (xG)
- Calculated from shot location, shot type, and context
- Uses `ImprovedXGModel` for calculation
- Accounts for rebounds, rushes, and shot quality

### High-Danger Chances (HDC)
- Shots from high-danger areas (slot, crease)
- Based on shot coordinates

### Game Score (GS)
- Composite metric combining xG, goals, assists, and other factors
- Calculated per period

### Zone Metrics
- **NZT (Neutral Zone Turnovers):** Turnovers in neutral zone
- **NZTSA (Neutral Zone Turnovers to Shots Against):** Shots allowed within 5 seconds of NZ turnover
- **OZS (Offensive Zone Shots):** Shots originating from offensive zone
- **NZS (Neutral Zone Shots):** Shots originating from neutral zone
- **DZS (Defensive Zone Shots):** Shots originating from defensive zone
- **FC (Forecheck Cycle SOG):** Shots from forecheck cycles
- **Rush:** Shots from rush plays

### Movement Metrics
- **Lateral:** Average east-west movement before shots
- **Longitudinal:** Average north-south movement before shots

### Period Stats
- **Corsi%:** Shot attempt percentage
- **Faceoff%:** Faceoff win percentage
- **Power Play%:** Power play conversion rate

### Clutch Metrics
- **3rd Period Goals:** Goals scored in 3rd period
- **One-Goal Game:** Whether game is within 1 goal
- **First Goal:** Which team scored first

## Data Flow Example

### Step-by-Step: Getting Live Prediction

1. **User opens dashboard**
   - Frontend calls `/api/games`
   - Flask route calls `api.get_game_schedule(today)`

2. **Live game detected**
   - Game state is `'LIVE'` or `'CRIT'`
   - Frontend shows live badge

3. **User clicks "View Report"**
   - Frontend calls `/api/game/<game_id>/report`
   - Flask route calls `get_live_prediction(game_id)`

4. **Live data fetched**
   - `LiveInGamePredictor.get_live_game_data(game_id)` called
   - Fetches comprehensive game data via `NHLAPIClient.get_comprehensive_game_data()`
   - Extracts boxscore and play-by-play data

5. **Metrics calculated**
   - xG: `PostGameReportGenerator._calculate_xg_from_plays()`
   - HDC: `PostGameReportGenerator._calculate_hdc_from_plays()`
   - GS: `PostGameReportGenerator._calculate_period_metrics()`
   - Zone: `PostGameReportGenerator._calculate_zone_metrics()`
   - Movement: `AdvancedMetricsAnalyzer.calculate_pre_shot_movement_metrics()`
   - Period stats: `PostGameReportGenerator._calculate_real_period_stats()`

6. **Prediction made**
   - Base prediction from `ImprovedSelfLearningModelV2.ensemble_predict()`
   - Momentum calculated from live metrics
   - Probabilities adjusted and normalized

7. **Response formatted**
   - All metrics packaged into JSON response
   - Frontend displays in modal

## API Response Structure

### `/api/game/<game_id>` Response

```json
{
  "away_team": "TOR",
  "home_team": "BOS",
  "away_score": 2,
  "home_score": 1,
  "current_period": 2,
  "time_remaining": "15:30",
  "away_prob": 45.2,
  "home_prob": 54.8,
  "predicted_winner": "BOS",
  "confidence": 65.0,
  "momentum": {
    "score_impact": 0.05,
    "time_pressure": 0.3,
    "shot_impact": 0.02,
    "pp_impact": 0.0,
    "faceoff_impact": 0.01,
    "total_momentum": 0.08
  },
  "advanced_metrics": {
    "away_xg": 1.8,
    "home_xg": 2.1,
    "away_hdc": 3,
    "home_hdc": 5,
    "away_gs": 4.2,
    "home_gs": 5.1,
    "away_gs_by_period": [2.1, 2.1, 0.0],
    "home_gs_by_period": [2.5, 2.6, 0.0]
  },
  "zone_metrics": {
    "away_nzt": 4,
    "away_nztsa": 2,
    "away_ozs": 8,
    "away_nzs": 5,
    "away_dzs": 2,
    "away_fc": 3,
    "away_rush": 4,
    "home_nzt": 3,
    "home_nztsa": 1,
    "home_ozs": 10,
    "home_nzs": 4,
    "home_dzs": 1,
    "home_fc": 5,
    "home_rush": 3
  },
  "movement_metrics": {
    "away_lateral": 12.5,
    "away_longitudinal": 8.3,
    "home_lateral": 15.2,
    "home_longitudinal": 9.1
  },
  "team_stats": {
    "away_corsi_pct": 48.5,
    "home_corsi_pct": 51.5,
    "away_faceoff_pct": 52.3,
    "home_faceoff_pct": 47.7,
    "away_power_play_pct": 0.0,
    "home_power_play_pct": 100.0
  },
  "clutch_metrics": {
    "away_third_period_goals": 0,
    "home_third_period_goals": 0,
    "one_goal_game": true,
    "away_scored_first": true,
    "home_scored_first": false
  }
}
```

## Update Frequency

- **Frontend auto-refresh:** Every 30 seconds
- **Live games:** Polled continuously while active
- **Metrics:** Recalculated on each request (real-time from play-by-play)

## Error Handling

- **Missing play-by-play data:** Falls back to boxscore stats only
- **API failures:** Returns error response, frontend shows error message
- **Calculation errors:** Sets default values (0.0 for metrics, 50% for probabilities)
- **Missing team data:** Uses team IDs/abbreviations from game data

## Performance Considerations

- **Lazy loading:** Heavy components (models, analyzers) loaded only when needed
- **Caching:** None currently (all calculations done on-demand)
- **API rate limiting:** NHL API is public, no rate limits enforced
- **Calculation time:** ~1-2 seconds per live game (depends on play-by-play size)

## Dependencies

### Python Packages
- `flask` - Web framework
- `requests` - HTTP client
- `pytz` - Timezone handling
- `pandas` - Data manipulation (for some metrics)
- `numpy` - Numerical calculations

### Internal Dependencies
- `improved_self_learning_model_v2.py` - Base predictions
- `pdf_report_generator.py` - Metrics calculation
- `advanced_metrics_analyzer.py` - Movement metrics
- `nhl_api_client.py` - API wrapper

## Testing

### Manual Testing
1. Run `python live_in_game_predictions.py`
2. Select option 1 to get current live games
3. Or select option 2 for continuous updates

### API Testing
1. Start Flask app: `python prediction_dashboard.py`
2. Visit `http://localhost:8080`
3. Check `/api/games` endpoint
4. Check `/api/game/<game_id>` for specific game
5. Check `/api/game/<game_id>/report` for comprehensive report

## Future Enhancements

- **WebSocket support:** Real-time push updates instead of polling
- **Caching:** Cache calculated metrics for faster response
- **Historical tracking:** Track prediction accuracy over time
- **Visualizations:** Charts showing probability changes over time
- **Player-level metrics:** Individual player contributions to predictions

## Troubleshooting

### Common Issues

1. **No live games showing**
   - Check NHL API is accessible
   - Verify game state is 'LIVE' or 'CRIT'
   - Check timezone settings (uses Central Time)

2. **Missing advanced metrics**
   - Play-by-play data may not be available yet
   - Check NHL API response structure
   - Verify team IDs are correct

3. **Predictions not updating**
   - Check auto-refresh is enabled (30s interval)
   - Verify Flask app is running
   - Check browser console for errors

4. **Slow performance**
   - Large play-by-play files take longer to process
   - Consider caching calculated metrics
   - Optimize metric calculation methods

## Key Code Locations

### Live Game Detection
- `live_in_game_predictions.py:25-48` - `get_live_games()`

### Data Collection
- `live_in_game_predictions.py:50-258` - `get_live_game_data()`

### Prediction Calculation
- `live_in_game_predictions.py:321-373` - `predict_live_game()`
- `live_in_game_predictions.py:260-319` - `calculate_live_momentum()`

### API Endpoints
- `prediction_dashboard.py:131-257` - `get_live_prediction()`
- `prediction_dashboard.py:271-489` - `/api/games`
- `prediction_dashboard.py:603-1339` - `/api/game/<game_id>/report`

### Frontend
- `templates/prediction_dashboard.html` - Live game display and modal

### Metrics Calculation
- `pdf_report_generator.py` - All advanced metrics methods
- `advanced_metrics_analyzer.py` - Movement metrics

## Contact & Support

For issues or questions about the live in-game predictions system, refer to the main project documentation or check the code comments in the relevant files.

