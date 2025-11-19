# Live In-Game Predictions - Complete File List

## Core Files (Required)

### 1. Live Prediction Engine
- **`live_in_game_predictions.py`** (501 lines)
  - Main live prediction class `LiveInGamePredictor`
  - Live game detection
  - Live data collection
  - Prediction calculation
  - Momentum calculation
  - **Key Classes:** `LiveInGamePredictor`
  - **Key Methods:**
    - `get_live_games()` - Detect active games
    - `get_live_game_data()` - Collect live game data
    - `predict_live_game()` - Calculate live prediction
    - `calculate_live_momentum()` - Calculate momentum factors
    - `format_live_prediction()` - Format for display
    - `run_live_predictions()` - Continuous updates

### 2. Flask Web Application
- **`prediction_dashboard.py`** (1,372 lines)
  - Flask application server
  - API endpoints for live predictions
  - Game report generation
  - **Key Functions:**
    - `get_live_prediction()` - Get live prediction for game
    - `get_pregame_prediction()` - Get pre-game prediction
  - **Key Routes:**
    - `/` - Main dashboard page
    - `/api/games` - Get all games with predictions
    - `/api/game/<game_id>` - Get specific game prediction
    - `/api/game/<game_id>/report` - Get comprehensive live report
    - `/health` - Health check endpoint

### 3. Frontend Template
- **`templates/prediction_dashboard.html`** (~1,500 lines)
  - HTML/CSS/JavaScript for dashboard
  - Live game display
  - Live report modal
  - Auto-refresh functionality
  - **Key JavaScript Functions:**
    - `loadGames()` - Load games from API
    - `formatLiveReport()` - Format metrics for display
    - `updateLiveGames()` - Auto-refresh live games
    - `showLiveReport()` - Display comprehensive report modal

## Supporting Files (Required)

### 4. NHL API Client
- **`nhl_api_client.py`** (~170 lines)
  - NHL API wrapper
  - **Key Class:** `NHLAPIClient`
  - **Key Methods:**
    - `get_game_schedule(date)` - Get schedule for date
    - `get_comprehensive_game_data(game_id)` - Get full game data (boxscore + play-by-play)
    - `get_game_boxscore(game_id)` - Get boxscore only
    - `get_game_center(game_id)` - Get game center data

### 5. Post-Game Report Generator (Metrics Calculation)
- **`pdf_report_generator.py`** (~3,700 lines)
  - Advanced metrics calculation
  - **Key Class:** `PostGameReportGenerator`
  - **Key Methods Used by Live Predictions:**
    - `_calculate_xg_from_plays()` - Calculate Expected Goals
    - `_calculate_hdc_from_plays()` - Calculate High-Danger Chances
    - `_calculate_period_metrics()` - Calculate Game Score by period
    - `_calculate_zone_metrics()` - Calculate zone metrics (NZT, NZTSA, OZS, etc.)
    - `_calculate_real_period_stats()` - Calculate period stats (Corsi%, Faceoff%, etc.)
    - `_calculate_goals_by_period()` - Calculate goals by period
    - `_calculate_team_stats_from_play_by_play()` - Calculate team stats from PBP
    - `_calculate_shot_xg()` - Calculate xG for individual shot
    - `_determine_zone()` - Determine zone from coordinates
    - `_is_rush_shot()` - Identify rush shots
    - `_is_shot_after_turnover()` - Link shots to turnovers

### 6. Advanced Metrics Analyzer
- **`advanced_metrics_analyzer.py`**
  - Movement metrics calculation
  - **Key Class:** `AdvancedMetricsAnalyzer`
  - **Key Methods:**
    - `calculate_pre_shot_movement_metrics()` - Calculate lateral/longitudinal movement

### 7. Prediction Model
- **`improved_self_learning_model_v2.py`**
  - Historical prediction model
  - **Key Class:** `ImprovedSelfLearningModelV2`
  - **Key Methods:**
    - `ensemble_predict()` - Get base prediction from historical data

## Optional/Supporting Files

### 8. Correlation Model
- **`correlation_model.py`**
  - Used for pre-game predictions (optional for live)

### 9. Lineup Service
- **`lineup_service.py`**
  - Used for pre-game predictions (optional for live)

### 10. Run Predictions for Date
- **`run_predictions_for_date.py`**
  - Used for pre-game predictions (optional for live)
  - **Key Function:** `predict_game_for_date()`

### 11. Playoff Prediction Model
- **`playoff_prediction_model.py`**
  - Used for playoff probabilities (separate from live predictions)

## Configuration Files

### 12. Requirements
- **`requirements.txt`** (if exists)
  - Python package dependencies

### 13. Environment Configuration
- **`.env`** (if exists)
  - Environment variables
  - API keys (if any)

## Data Files (Generated)

### 14. Team Statistics
- **`season_2025_2026_team_stats.json`**
  - Historical team statistics
  - Used by prediction model
  - Not directly used by live predictions (live uses real-time data)

### 15. Predictions Cache
- **`win_probability_predictions_v2.json`**
  - Pre-game predictions cache
  - Used for pre-game predictions display
  - Not used for live predictions (live calculates on-demand)

### 16. Edge Data
- **`nhl_edge_data.json`**
  - Historical edge data
  - Used by prediction model
  - Not directly used by live predictions

## Documentation Files

### 17. This Documentation
- **`LIVE_IN_GAME_PREDICTIONS_DOCUMENTATION.md`**
  - Complete system documentation

### 18. File List
- **`LIVE_IN_GAME_FILES_LIST.md`** (this file)
  - Complete file list

## File Dependencies Graph

```
prediction_dashboard.py
├── live_in_game_predictions.py
│   ├── nhl_api_client.py
│   ├── improved_self_learning_model_v2.py
│   ├── pdf_report_generator.py
│   │   └── advanced_metrics_analyzer.py
│   └── advanced_metrics_analyzer.py
├── improved_self_learning_model_v2.py
├── correlation_model.py (optional)
├── lineup_service.py (optional)
├── run_predictions_for_date.py (optional)
└── playoff_prediction_model.py (separate)

templates/prediction_dashboard.html
└── (calls API endpoints in prediction_dashboard.py)
```

## File Size Summary

| File | Lines | Purpose |
|------|-------|---------|
| `live_in_game_predictions.py` | 501 | Core live prediction engine |
| `prediction_dashboard.py` | 1,372 | Flask API server |
| `templates/prediction_dashboard.html` | ~1,500 | Frontend UI |
| `pdf_report_generator.py` | ~3,700 | Metrics calculation |
| `nhl_api_client.py` | ~170 | API wrapper |
| `advanced_metrics_analyzer.py` | Varies | Movement metrics |
| `improved_self_learning_model_v2.py` | Varies | Prediction model |

## Critical Files for Live Predictions

**Minimum Required Files:**
1. `live_in_game_predictions.py` - Core engine
2. `prediction_dashboard.py` - API server
3. `templates/prediction_dashboard.html` - Frontend
4. `nhl_api_client.py` - API access
5. `pdf_report_generator.py` - Metrics calculation
6. `advanced_metrics_analyzer.py` - Movement metrics
7. `improved_self_learning_model_v2.py` - Base predictions

**Optional but Recommended:**
8. `correlation_model.py` - Enhanced pre-game predictions
9. `lineup_service.py` - Lineup-based predictions
10. `run_predictions_for_date.py` - Pre-game prediction helper

## Notes

- All files are in the root directory unless specified (e.g., `templates/`)
- The system is designed to work with minimal dependencies
- Heavy components are lazy-loaded for performance
- Live predictions are calculated on-demand (no caching currently)
- All metrics are calculated from real-time play-by-play data

