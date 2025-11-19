# NHL Prediction Model Variables

## Model Architecture

The prediction model uses a **70/30 blend**:
- **70% Correlation Model** (primary) - Uses logistic regression with learned weights
- **30% Ensemble Model** (secondary) - Combines traditional metrics, recent form, and momentum

## Variables Used in Predictions

### 1. Core Team Performance Metrics

These are calculated as **venue-specific averages** (home vs away):

#### Offensive Metrics
- **xG (Expected Goals)** - Average expected goals per game
- **HDC (High-Danger Chances)** - Average high-danger scoring chances per game
- **Shots** - Average shots on goal per game
- **GS (Game Score)** - Composite offensive performance metric

#### Possession & Control Metrics
- **Corsi %** - Shot attempt percentage (CF% = Corsi For / Total Corsi)
- **Faceoff %** - Faceoff win percentage
- **Power Play %** - Power play conversion percentage

#### Defensive Metrics
- **Blocked Shots** - Average blocked shots per game
- **Hits** - Average hits per game
- **Takeaways** - Average takeaways per game
- **Giveaways** - Average giveaways per game
- **Penalty Minutes** - Average penalty minutes per game

### 2. Situational Factors

#### Rest Days
- **Away Rest** - Days of rest for away team (negative = back-to-back)
- **Home Rest** - Days of rest for home team (negative = back-to-back)
- **Context Bucket** - Categorizes rest situations (e.g., "both_rested", "away_b2b", etc.)
- **Back-to-Back Flags** - Boolean indicators for B2B games

#### Goalie Performance
- **Away Goalie Performance** - GSAx (Goals Saved Above Expected) for predicted/confirmed starter
- **Home Goalie Performance** - GSAx for predicted/confirmed starter
- **Goalie Matchup Quality** - Normalized comparison (-1 to +1) of goalie advantage

#### Strength of Schedule
- **Away SOS** - Strength of schedule for away team
- **Home SOS** - Strength of schedule for home team

#### Venue Performance
- **Away Venue Win %** - Team's win percentage when playing away
- **Home Venue Win %** - Team's win percentage when playing at home
- **Venue Win % Difference** - Difference between away team's away win% and home team's home win%

### 3. Recent Form & Momentum

- **Recent Form** - Weighted average of recent performance (last 5-10 games)
- **Recent Form Difference** - Difference between away and home team's recent form
- **Momentum** - Streak-based momentum indicator

### 4. Matchup-Specific Factors

- **Special Teams Matchup** - Normalized comparison (-1 to +1) of power play vs penalty kill advantage
- **Head-to-Head** - Historical head-to-head performance (if available)

### 5. Correlation Model Features (Differences)

The correlation model uses **differences** between away and home team metrics:

1. **gs_diff** - Game Score difference (weight: 0.4614) ⭐ **Most Important**
2. **power_play_diff** - Power play % difference (weight: 0.3213) ⭐ **2nd Most Important**
3. **blocked_shots_diff** - Blocked shots difference (weight: -0.2931)
4. **corsi_diff** - Corsi % difference (weight: -0.2659)
5. **hits_diff** - Hits difference (weight: -0.1374)
6. **rest_diff** - Rest days difference (weight: 0.1023)
7. **hdc_diff** - High-danger chances difference (weight: 0.0759)
8. **shots_diff** - Shots difference (weight: -0.0744)
9. **giveaways_diff** - Giveaways difference (weight: -0.0427)
10. **sos_diff** - Strength of schedule difference (weight: -0.0390)
11. **takeaways_diff** - Takeaways difference (weight: 0.0334)
12. **xg_diff** - Expected goals difference (weight: -0.0274)
13. **pim_diff** - Penalty minutes difference (weight: 0.0160)
14. **faceoff_diff** - Faceoff % difference (weight: -0.0118)
15. **goalie_matchup_quality** - Goalie matchup advantage (learned from data)
16. **special_teams_matchup** - Special teams matchup advantage (learned from data)

### 6. Additional Factors (Not in Correlation Model but Used in Ensemble)

- **Venue Win % Difference** - Weighted at 0.5x
- **Recent Form Difference** - Weighted at 0.2x
- **Goalie Matchup Quality** - Weighted at 0.2x
- **Special Teams Matchup** - Weighted at 0.1x

### 7. Calibration & Context

- **Calibration Points** - Learned calibration curve from historical predictions
- **Context-Aware Calibration** - Different calibration curves for different rest situations
- **Upset Probability** - Calculated from confidence, margin, correlation disagreement, and Monte Carlo flip rate

## Model Output

Final predictions are:
- **Calibrated** using learned calibration curves
- **Bounded** between 5% and 95% to prevent extreme predictions
- **Blended** 70% correlation model + 30% ensemble model
- **Displayed as percentages** (0-100%)

## Data Sources

- **Team Stats**: `season_2025_2026_team_stats.json` - Venue-specific game-by-game stats
- **Historical Stats**: `historical_seasons_team_stats.json` - Previous seasons for context
- **Predictions**: `win_probability_predictions_v2.json` - Historical predictions for learning
- **Correlation Weights**: `correlation_model_weights.json` - Learned feature weights
- **NHL API**: Standings fallback when team stats unavailable

## Model Updates

- **Daily Learning**: Model updates weights after each completed game
- **Weekly Re-fitting**: Correlation model weights are re-fitted from all completed games
- **Calibration Updates**: Calibration curves updated with minimum 60 games

