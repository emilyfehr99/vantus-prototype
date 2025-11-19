# Team Data and Edge Data Files Reference

## 📊 Data Files (JSON) - Exact Paths

### Team Statistics Files
- **`/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`** - Current season team statistics (venue-specific, game-by-game)
- **`/Users/emilyfehr8/CascadeProjects/season_2024_2025_team_stats.json`** - Previous season team statistics
- **`/Users/emilyfehr8/CascadeProjects/season_2023_2024_team_stats.json`** - Historical season team statistics
- **`/Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json`** - Aggregated historical seasons data

### Edge Data Files
- **`/Users/emilyfehr8/CascadeProjects/nhl_edge_data.json`** - Current NHL Edge data (skating speeds, distances, bursts)
- **`/Users/emilyfehr8/CascadeProjects/nhl_edge_data_20251018_224423.json`** - Timestamped backup of Edge data

### Prediction/Model Data Files
- **`/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json`** - Main prediction model data (predictions, team stats, model weights)
- **`/Users/emilyfehr8/CascadeProjects/win_probability_predictions.json`** - Legacy prediction model data

### Other Related Data Files
- **`/Users/emilyfehr8/CascadeProjects/team_performance_stats.json`** - Legacy team performance stats
- **`/Users/emilyfehr8/CascadeProjects/team_performance_stats_v2.json`** - Updated team performance stats
- **`/Users/emilyfehr8/CascadeProjects/processed_games.json`** - Processed game data
- **`/Users/emilyfehr8/CascadeProjects/game_state_data.json`** - Game state tracking data

---

## 🐍 Python Files - Core Model & Data Management - Exact Paths

### Main Model Files
- **`/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py`**
  - Loads/saves: `/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json`, `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`, `/Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json`
  - Manages team stats, predictions, model weights
  - Primary self-learning prediction model

- **`/Users/emilyfehr8/CascadeProjects/prediction_interface.py`**
  - Uses: `/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py`
  - Loads/saves: `/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json`, `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
  - Daily prediction workflow, Discord notifications
  - Adds completed games to team stats

- **`/Users/emilyfehr8/CascadeProjects/playoff_prediction_model.py`**
  - Loads: `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
  - Uses team stats for playoff probability calculations
  - Calculates comprehensive team strength from all metrics

### Edge Data Files
- **`/Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py`**
  - Scrapes NHL Edge data from Puckalytics
  - Saves to: `/Users/emilyfehr8/CascadeProjects/nhl_edge_data.json`
  - Calculates team-level Edge statistics
  - Used in daily GitHub Actions workflow

- **`/Users/emilyfehr8/CascadeProjects/nhl_edge_data_scraper.py`**
  - One-time Edge data scraper
  - Saves timestamped files: `/Users/emilyfehr8/CascadeProjects/nhl_edge_data_YYYYMMDD_HHMMSS.json`
  - Calculates team Edge stats and integrates with prediction model

### Team Stats Collection & Backfill
- **`/Users/emilyfehr8/CascadeProjects/backfill_2025_2026_season.py`**
  - Backfills season data
  - Saves to: `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`

- **`/Users/emilyfehr8/CascadeProjects/collect_historical_seasons.py`**
  - Collects historical season data
  - Saves to: `/Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json`

- **`/Users/emilyfehr8/CascadeProjects/recalculate_advanced_metrics.py`**
  - Recalculates advanced metrics for games
  - Updates: `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
  - Uses: `/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py` for zone metrics calculation

- **`/Users/emilyfehr8/CascadeProjects/backfill_all_season_games.py`**
  - Backfills all games in season
  - Updates team stats files

- **`/Users/emilyfehr8/CascadeProjects/backfill_special_teams.py`**
  - Backfills special teams metrics
  - Updates: `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`

### Report Generation (Metrics Calculation)
- **`/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py`**
  - Contains `_calculate_zone_metrics()` method
  - Calculates NZT, NZTSA, OZS, NZS, DZS, FC, Rush metrics
  - Used by other files to extract metrics from game data

- **`/Users/emilyfehr8/CascadeProjects/team_report_generator.py`**
  - Aggregates team statistics across games
  - Uses `_calculate_zone_metrics()` from `pdf_report_generator.py`
  - Generates comprehensive team reports

### GitHub Actions & Automation
- **`/Users/emilyfehr8/CascadeProjects/.github/workflows/daily-nhl-predictions.yml`**
  - Runs `/Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py` to scrape Edge data
  - Runs `/Users/emilyfehr8/CascadeProjects/prediction_interface.py` for daily predictions
  - Commits: `/Users/emilyfehr8/CascadeProjects/nhl_edge_data.json`, `/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json`, `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`

- **`/Users/emilyfehr8/CascadeProjects/github_actions_runner.py`**
  - Loads/saves: `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
  - Processes games and updates team stats

### Dashboard & API
- **`/Users/emilyfehr8/CascadeProjects/prediction_dashboard.py`**
  - Flask app for Render dashboard
  - Loads: `/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json` for pre-game predictions
  - Uses `/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py` for live game metrics

- **`/Users/emilyfehr8/CascadeProjects/live_in_game_predictions.py`**
  - Real-time game prediction
  - Uses `/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py` for zone metrics
  - Calculates live metrics from game data

### Testing & Analysis
- **`/Users/emilyfehr8/CascadeProjects/test_improvement_features.py`**
  - Tests Edge data integration
  - Loads: `/Users/emilyfehr8/CascadeProjects/nhl_edge_data.json`
  - Tests prediction accuracy with/without Edge data

- **`/Users/emilyfehr8/CascadeProjects/comprehensive_model_training.py`**
  - Loads: `/Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json`, `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
  - Trains models using team stats

- **`/Users/emilyfehr8/CascadeProjects/enhanced_training_with_advanced_metrics.py`**
  - Loads: `/Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json`
  - Trains models with advanced metrics

- **`/Users/emilyfehr8/CascadeProjects/selective_improvement_training.py`**
  - Loads: `/Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json`, `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
  - Selective model training

### Legacy/Alternative Models
- **`/Users/emilyfehr8/CascadeProjects/improved_self_learning_model.py`**
  - Legacy model (v1)
  - Loads/saves: `/Users/emilyfehr8/CascadeProjects/win_probability_predictions.json`, `/Users/emilyfehr8/CascadeProjects/team_performance_stats.json`
  - Includes Edge data integration

- **`/Users/emilyfehr8/CascadeProjects/advanced_metrics_model.py`**
  - Loads/saves: `/Users/emilyfehr8/CascadeProjects/advanced_predictions.json`
  - Uses advanced metrics for predictions

- **`/Users/emilyfehr8/CascadeProjects/correlation_model.py`**
  - Uses team stats for correlation-based predictions
  - Loads: `/Users/emilyfehr8/CascadeProjects/correlation_model_weights.json`

---

## 📁 File Structure Summary - Exact Paths

```
/Users/emilyfehr8/CascadeProjects/
├── Data Files (JSON)
│   ├── /Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json          # Current season stats
│   ├── /Users/emilyfehr8/CascadeProjects/season_2024_2025_team_stats.json          # Previous season
│   ├── /Users/emilyfehr8/CascadeProjects/season_2023_2024_team_stats.json          # Historical season
│   ├── /Users/emilyfehr8/CascadeProjects/historical_seasons_team_stats.json        # Aggregated historical
│   ├── /Users/emilyfehr8/CascadeProjects/nhl_edge_data.json                        # Current Edge data
│   ├── /Users/emilyfehr8/CascadeProjects/nhl_edge_data_20251018_224423.json        # Edge data backup
│   ├── /Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json       # Main model data
│   └── /Users/emilyfehr8/CascadeProjects/win_probability_predictions.json          # Legacy model data
│
├── Core Model Files
│   ├── /Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py         # Main prediction model
│   ├── /Users/emilyfehr8/CascadeProjects/prediction_interface.py                   # Daily workflow
│   └── /Users/emilyfehr8/CascadeProjects/playoff_prediction_model.py               # Playoff probabilities
│
├── Edge Data Files
│   ├── /Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py                # Daily Edge scraper
│   └── /Users/emilyfehr8/CascadeProjects/nhl_edge_data_scraper.py                  # One-time Edge scraper
│
├── Team Stats Collection
│   ├── /Users/emilyfehr8/CascadeProjects/backfill_2025_2026_season.py              # Season backfill
│   ├── /Users/emilyfehr8/CascadeProjects/collect_historical_seasons.py             # Historical collection
│   ├── /Users/emilyfehr8/CascadeProjects/recalculate_advanced_metrics.py           # Metrics recalculation
│   └── /Users/emilyfehr8/CascadeProjects/backfill_all_season_games.py              # Game backfill
│
├── Report Generation
│   ├── /Users/emilyfehr8/CascadeProjects/pdf_report_generator.py                   # Zone metrics calculation
│   └── /Users/emilyfehr8/CascadeProjects/team_report_generator.py                  # Team report generation
│
├── Dashboard & API
│   ├── /Users/emilyfehr8/CascadeProjects/prediction_dashboard.py                  # Flask dashboard
│   └── /Users/emilyfehr8/CascadeProjects/live_in_game_predictions.py              # Live predictions
│
└── GitHub Actions
    └── /Users/emilyfehr8/CascadeProjects/.github/workflows/daily-nhl-predictions.yml  # Daily automation
```

---

## 🔄 Data Flow

### Daily Workflow
1. **GitHub Actions** runs `/Users/emilyfehr8/CascadeProjects/.github/workflows/daily-nhl-predictions.yml`
2. **Edge Data**: `/Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py` → `/Users/emilyfehr8/CascadeProjects/nhl_edge_data.json`
3. **Predictions**: `/Users/emilyfehr8/CascadeProjects/prediction_interface.py` → loads `/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json` → saves updated predictions
4. **Team Stats**: `/Users/emilyfehr8/CascadeProjects/prediction_interface.py` → loads `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json` → adds completed games → saves
5. **Commit**: All updated JSON files committed to repo

### Metrics Calculation Flow
1. **Game Data** → `/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py._calculate_zone_metrics()`
2. **Zone Metrics** (NZT, NZTSA, OZS, NZS, DZS, FC, Rush) calculated
3. **Team Stats Updated** → `/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py.update_team_stats()`
4. **Saved** → `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`

### Prediction Flow
1. **Load Team Stats** → `/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json`
2. **Load Edge Data** → `/Users/emilyfehr8/CascadeProjects/nhl_edge_data.json` (optional)
3. **Calculate Prediction** → `/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py.predict_game()`
4. **Save Prediction** → `/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json`

---

## 📝 Key Methods & Functions

### Zone Metrics Calculation
- **`/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py._calculate_zone_metrics()`** - Main zone metrics calculator
- **`/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py._determine_zone()`** - Determines zone from coordinates
- **`/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py._is_rush_shot()`** - Identifies rush shots
- **`/Users/emilyfehr8/CascadeProjects/pdf_report_generator.py._is_shot_after_turnover()`** - Links shots to turnovers

### Team Stats Management
- **`/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py.load_team_stats()`** - Loads team stats
- **`/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py.save_team_stats()`** - Saves team stats
- **`/Users/emilyfehr8/CascadeProjects/improved_self_learning_model_v2.py.update_team_stats()`** - Updates from game data

### Edge Data
- **`/Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py.scrape_daily_edge_data()`** - Scrapes Edge data
- **`/Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py.calculate_team_edge_stats()`** - Calculates team Edge stats
- **`/Users/emilyfehr8/CascadeProjects/daily_edge_data_scraper.py.get_team_edge_advantage()`** - Gets Edge advantage between teams

