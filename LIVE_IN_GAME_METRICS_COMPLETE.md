# Complete List of Metrics Used in Live In-Game Predictions Site

## Overview
This document lists ALL metrics displayed in the live in-game predictions dashboard, including period-by-period breakdowns, shot locations, and comprehensive statistics.

---

## 1. Basic Game Information

### Game State
- `game_id` - Unique game identifier
- `away_team` - Away team abbreviation (e.g., "TOR")
- `home_team` - Home team abbreviation (e.g., "BOS")
- `away_score` - Current away team score
- `home_score` - Current home team score
- `current_period` - Current period number (1, 2, 3, OT, etc.)
- `period_type` - Period type ("REG", "OT", "SO")
- `time_remaining` - Time remaining in current period (format: "MM:SS")
- `game_state` - Game status ("LIVE", "CRIT", "FINAL", "PREVIEW")

---

## 2. Team Statistics (Basic Stats)

### Per Team (Away & Home)
- **Shots** (`shots`) - Total shots on goal
- **Hits** (`hits`) - Total hits
- **Faceoff %** (`faceoff_pct`) - Faceoff win percentage
  - `faceoff_wins` - Faceoff wins
  - `faceoff_total` - Total faceoffs taken
- **Power Play** (`power_play_pct`) - Power play conversion percentage
  - `power_play_goals` - Power play goals scored
  - `power_play_opportunities` - Power play opportunities
- **Blocked Shots** (`blocked_shots`) - Shots blocked
- **Giveaways** (`giveaways`) - Turnovers (giveaways)
- **Takeaways** (`takeaways`) - Takeaways
- **PIM** (`pim`) - Penalty minutes

---

## 3. Advanced Metrics

### Game-Level Totals
- **Expected Goals (xG)** (`away_xg`, `home_xg`) - Total expected goals
- **High-Danger Chances (HDC)** (`away_hdc`, `home_hdc`) - Shots from high-danger areas
- **Game Score (GS)** (`away_gs`, `home_gs`) - Composite performance score

### Period-by-Period Breakdowns
- **Game Score by Period** (`away_gs_by_period`, `home_gs_by_period`)
  - Period 1 Game Score
  - Period 2 Game Score
  - Period 3 Game Score
- **Expected Goals by Period** (`away_xg_by_period`, `home_xg_by_period`)
  - Period 1 xG
  - Period 2 xG
  - Period 3 xG

### Team Performance Percentages
- **Corsi %** (`away_corsi_pct`, `home_corsi_pct`) - Shot attempt percentage
- **Faceoff %** (`away_faceoff_pct`, `home_faceoff_pct`) - Faceoff win percentage
- **Power Play %** (`away_power_play_pct`, `home_power_play_pct`) - Power play conversion rate

---

## 4. Zone Metrics

### Neutral Zone Metrics
- **NZT (Neutral Zone Turnovers)** (`away_nzt`, `home_nzt`) - Turnovers in neutral zone
- **NZTSA (Neutral Zone Turnovers to Shots Against)** (`away_nztsa`, `home_nztsa`) - Shots allowed within 5 seconds of NZ turnover

### Shot Origination Zones
- **OZS (Offensive Zone Shots)** (`away_ozs`, `home_ozs`) - Shots originating from offensive zone
- **NZS (Neutral Zone Shots)** (`away_nzs`, `home_nzs`) - Shots originating from neutral zone
- **DZS (Defensive Zone Shots)** (`away_dzs`, `home_dzs`) - Shots originating from defensive zone

### Shot Type Classifications
- **FC (Forecheck/Cycle Shots)** (`away_fc`, `home_fc`) - Shots from forecheck cycles
- **Rush Shots** (`away_rush`, `home_rush`) - Shots from rush plays

---

## 5. Movement Metrics

### Pre-Shot Movement
- **Lateral Movement** (`away_lateral`, `home_lateral`) - Average east-west movement before shots (feet)
- **Longitudinal Movement** (`away_longitudinal`, `home_longitudinal`) - Average north-south movement before shots (feet)

---

## 6. Period Statistics

### Per-Period Breakdowns (Available in `period_stats`)
Each period includes:
- **Corsi %** - Shot attempt percentage for that period
- **Faceoff Wins** - Faceoff wins in period
- **Faceoff Total** - Total faceoffs in period
- **PP Goals** - Power play goals in period
- **PP Attempts** - Power play opportunities in period
- **Shots** - Shots on goal in period
- **Hits** - Hits in period
- **PIM** - Penalty minutes in period
- **Blocked Shots** - Blocked shots in period
- **Giveaways** - Giveaways in period
- **Takeaways** - Takeaways in period

---

## 7. Clutch Metrics

- **Third Period Goals** (`away_third_period_goals`, `home_third_period_goals`) - Goals scored in 3rd period
- **Scored First** (`away_scored_first`, `home_scored_first`) - Boolean indicating which team scored first
- **One-Goal Game** (`one_goal_game`) - Boolean indicating if game is within 1 goal

---

## 8. Scoring Summary

### Per Goal Information
For each goal in the game:
- **Period** - Period number when goal was scored
- **Time** - Time in period when goal was scored (format: "MM:SS")
- **Team** - Team abbreviation that scored
- **Scorer** - Player name who scored
- **Assists** - Assisting players (comma-separated, or "Unassisted")
- **xG** - Expected goal value for this specific shot
- **Shot Type** - Type of shot (Wrist, Slap, Snap, Backhand, etc.)
- **Shot Coordinates** (`x_coord`, `y_coord`) - X and Y coordinates on rink
  - X: -100 to 100 (negative = away end, positive = home end)
  - Y: -42.5 to 42.5 (negative = left side, positive = right side)
- **Longitudinal Movement** - North-south movement before shot (feet)
- **Lateral Movement** - East-west movement before shot (feet)
- **Team Color** - Team's primary color (for visualization)

---

## 9. Shot Chart Visualization

### Shot Chart Data
- **All Goals** - Plotted on rink diagram
- **X Coordinate** - Horizontal position (-100 to 100)
- **Y Coordinate** - Vertical position (-42.5 to 42.5)
- **Team Colors** - Visual distinction between teams
- **xG Labels** - Expected goal value displayed near each goal marker

### Coordinate System
- **Away Team Goals**: Always plotted on left side (negative X)
- **Home Team Goals**: Always plotted on right side (positive X)
- Coordinates are flipped automatically for consistent visualization

---

## 10. Goalie Statistics

### Per Goalie
- **Name** - Goalie name
- **Saves** - Total saves
- **Shots Against** - Total shots faced
- **Save %** - Save percentage (saves / shots against)
- **TOI** - Time on ice (format: "MM:SS")

---

## 11. Live Prediction Metrics

### Win Probability
- **Away Win Probability** (`away_prob`) - Percentage chance away team wins
- **Home Win Probability** (`home_prob`) - Percentage chance home team wins
- **Predicted Winner** - Team with higher probability
- **Confidence** - Prediction confidence level (0-100%)

### Momentum Factors
- **Score Impact** - Impact of current score differential
- **Time Pressure** - Impact of time remaining (later periods = more certain)
- **Shot Impact** - Impact of shot differential (2% per shot difference)
- **PP Impact** - Impact of power play goals (5% per PP goal)
- **Faceoff Impact** - Impact of faceoff dominance (up to 3%)
- **Total Momentum** - Combined momentum adjustment

---

## 12. Data Structure Summary

### API Response Structure (`/api/game/<game_id>/report`)

```json
{
  "game_id": "2024020157",
  "away_team": "TOR",
  "home_team": "BOS",
  "away_score": 2,
  "home_score": 1,
  "current_period": 2,
  "period_type": "REG",
  "time_remaining": "15:30",
  "game_state": "LIVE",
  
  "stats": {
    "away": {
      "shots": 15,
      "hits": 12,
      "pim": 4,
      "faceoff_wins": 18,
      "faceoff_total": 35,
      "faceoff_pct": 51.4,
      "power_play_goals": 1,
      "power_play_opportunities": 2,
      "power_play_pct": 50.0,
      "blocked_shots": 8,
      "giveaways": 5,
      "takeaways": 7
    },
    "home": { /* same structure */ }
  },
  
  "advanced_metrics": {
    "away_xg": 2.1,
    "home_xg": 1.8,
    "away_hdc": 5,
    "home_hdc": 3,
    "away_gs": 4.2,
    "home_gs": 3.5,
    "away_gs_by_period": [2.1, 2.1, 0.0],
    "home_gs_by_period": [1.8, 1.7, 0.0],
    "away_xg_by_period": [1.1, 1.0, 0.0],
    "home_xg_by_period": [0.9, 0.9, 0.0]
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
    "away_power_play_pct": 50.0,
    "home_power_play_pct": 0.0
  },
  
  "period_stats": {
    "away": {
      "corsi_pct": [45.0, 52.0, 0.0],
      "faceoff_wins": [6, 12, 0],
      "faceoff_total": [12, 23, 0],
      "pp_goals": [0, 1, 0],
      "pp_attempts": [1, 1, 0],
      "shots": [5, 10, 0],
      "hits": [4, 8, 0],
      "pim": [2, 2, 0],
      "blocked_shots": [3, 5, 0],
      "giveaways": [2, 3, 0],
      "takeaways": [2, 5, 0]
    },
    "home": { /* same structure */ }
  },
  
  "clutch_metrics": {
    "away_third_period_goals": 0,
    "home_third_period_goals": 0,
    "one_goal_game": true,
    "away_scored_first": true,
    "home_scored_first": false
  },
  
  "goalie_stats": {
    "away": [
      {
        "name": "Ilya Samsonov",
        "saves": 18,
        "shots_against": 20,
        "save_pct": 90.0,
        "toi": "35:30"
      }
    ],
    "home": [ /* same structure */ ]
  },
  
  "scoring_summary": [
    {
      "period": 1,
      "time": "12:34",
      "team": "TOR",
      "scorer": "Auston Matthews",
      "assists": "Mitch Marner, William Nylander",
      "xg": 0.234,
      "shot_type": "Wrist",
      "x_coord": -45.2,
      "y_coord": 12.3,
      "team_id": 10,
      "is_away": true,
      "team_color": "#003E7E",
      "longitudinal_movement": 8.5,
      "lateral_movement": 3.2
    }
    // ... more goals
  ]
}
```

---

## 13. Calculation Methods

### Metrics Calculated From Play-by-Play Data

1. **xG (Expected Goals)**
   - Calculated using `PostGameReportGenerator._calculate_xg_from_plays()`
   - Factors: shot location, shot type, rebound status, rush status
   - Uses `ImprovedXGModel` for probability calculation

2. **HDC (High-Danger Chances)**
   - Calculated using `PostGameReportGenerator._calculate_hdc_from_plays()`
   - Shots from slot area (high-danger zone)

3. **Game Score (GS)**
   - Calculated using `PostGameReportGenerator._calculate_period_metrics()`
   - Composite metric: goals, assists, xG, shots, etc.

4. **Zone Metrics**
   - Calculated using `PostGameReportGenerator._calculate_zone_metrics()`
   - Analyzes play-by-play to determine zone of origin
   - Tracks turnovers and their outcomes

5. **Movement Metrics**
   - Calculated using `AdvancedMetricsAnalyzer.calculate_pre_shot_movement_metrics()`
   - Tracks coordinate changes before shots

6. **Period Stats**
   - Calculated using `PostGameReportGenerator._calculate_real_period_stats()`
   - Aggregates all stats by period

---

## 14. Display Sections in UI

### Main Dashboard
1. **Game Cards** - Basic game info, scores, live status
2. **Pre-Game Predictions** - Win probabilities before game starts
3. **Live Predictions** - Updated probabilities during game

### Live Report Modal (Click "View Report")
1. **Game Status** - Score, period, time remaining
2. **Team Statistics** - Basic stats table
3. **Advanced Metrics** - xG, HDC, GS with period breakdowns
4. **Zone Metrics** - Zone-specific shot and turnover metrics
5. **Movement Metrics** - Pre-shot movement averages
6. **Clutch Metrics** - Third period goals, first goal, one-goal game
7. **Goalie Statistics** - Goalie performance table
8. **Scoring Summary** - Detailed goal information table
9. **Shot Chart** - Visual rink diagram with goal locations

---

## 15. Update Frequency

- **Frontend Refresh**: Every 30 seconds for live games
- **Metrics Calculation**: Real-time on each API request
- **Data Source**: NHL API play-by-play data (updated continuously during game)

---

## 16. Key Files

### Backend Calculation
- `prediction_dashboard.py` - API endpoint `/api/game/<game_id>/report` (lines 603-1339)
- `pdf_report_generator.py` - All metric calculation methods
- `advanced_metrics_analyzer.py` - Movement metrics calculation

### Frontend Display
- `templates/prediction_dashboard.html` - UI and `formatLiveReport()` function (lines 870-1390)

---

## Summary

**Total Metrics Categories**: 11
**Total Individual Metrics**: 50+ per team
**Period Breakdowns**: Available for GS, xG, and all period stats
**Shot Locations**: X/Y coordinates for all goals with visualization
**Update Frequency**: Real-time (calculated on-demand from play-by-play data)

All metrics are calculated from NHL API play-by-play data in real-time, ensuring accuracy and up-to-date information throughout the game.

