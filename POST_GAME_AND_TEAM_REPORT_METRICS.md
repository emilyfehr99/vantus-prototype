# Complete List of Metrics in Post-Game Reports and Team Reports

## Overview
This document lists ALL metrics calculated and displayed in post-game reports (`pdf_report_generator.py`) and team reports (`team_report_generator.py`).

---

## 1. Period-by-Period Table Metrics (Post-Game Reports)

### Basic Stats (Per Period)
- **Period** - Period number (1, 2, 3, OT, SO)
- **GF** - Goals For (scored in period)
- **S** - Shots on Goal
- **CF%** - Corsi Percentage (shot attempts for / total shot attempts)
- **PP** - Power Play (goals/attempts format, e.g., "1/3")
- **PIM** - Penalty Minutes
- **Hits** - Total hits
- **FO%** - Faceoff Win Percentage
- **BLK** - Blocked Shots
- **GV** - Giveaways (turnovers)
- **TK** - Takeaways

### Advanced Metrics (Per Period)
- **GS** - Game Score (composite performance metric)
- **xG** - Expected Goals (calculated from shot location, type, context)
- **NZT** - Neutral Zone Turnovers
- **NZTSA** - Neutral Zone Turnovers to Shots Against (turnovers leading to opponent shots within 5 seconds)
- **OZS** - Offensive Zone Originating Shots
- **NZS** - Neutral Zone Originating Shots
- **DZS** - Defensive Zone Originating Shots
- **FC** - Forecheck/Cycle Shots on Goal
- **Rush** - Rush Shots on Goal

### Final Row Totals
- All metrics summed across all periods (regulation + OT, excluding SO)

---

## 2. Advanced Metrics Section (Post-Game Reports)

### Shot Quality Analysis
- **Expected Goals (xG)** - Total expected goals for the game
- **High Danger Shots** - Shots from high-danger areas (close to net, in front)
- **Total Shots** - All shot attempts (on goal, missed, blocked)
- **Shots on Goal** - Shots that reached the net
- **Shooting %** - Goals / Shots on Goal

### Pressure Analysis
- **Sustained Pressure Sequences** - Sequences of multiple shot attempts in offensive zone
- **Quick Strike Opportunities** - Rapid shot attempts after turnovers/faceoffs
- **Avg Shots per Sequence** - Average shots in sustained pressure sequences

### Defensive Analysis
- **Blocked Shots** - Shots blocked by defenders
- **Takeaways** - Successful defensive takeaways
- **Hits** - Physical hits delivered
- **Shot Attempts Against** - Opponent shot attempts (Corsi against)
- **High Danger Chances Against** - Opponent shots from high-danger areas

### Pre-Shot Movement Analysis
- **Royal Road Proxy** - Shots after cross-ice passes (lateral movement)
- **OZ Retrieval to Shot** - Shots after offensive zone puck retrievals
- **Lateral Movement (E-W)** - Average east-west movement before shots (classified: Stationary, Minor side-to-side, Cross-ice movement, Wide-lane movement, Full-width movement)
- **Longitudinal Movement (N-S)** - Average north-south movement before shots (classified: Stationary, Close-range setup, Mid-range buildup, Extended buildup, Long-range rush)

---

## 3. Win Probability Calculation Metrics

Used in `calculate_win_probability()` method with correlation-based weights:

- **Game Score Difference** (weight: 0.6504) - Strongest predictor
- **Power Play % Difference** (weight: 0.3933)
- **Corsi % Difference** (weight: -0.3598) - Negative: higher Corsi favors home
- **Hits Difference** (weight: -0.2434) - Negative: more hits favors home
- **High Danger Chances Difference** (weight: 0.0747)
- **Expected Goals Difference** (weight: -0.0545)
- **Penalty Minutes Difference** (weight: 0.0173)
- **Shots on Goal Difference** (weight: -0.0158)

---

## 4. Team Report Metrics (Aggregated Across Games)

### Game-Level Aggregations
- **Games Played** - Total games
- **Wins** - Total wins
- **Losses** - Total losses (regulation + OT + SO)
- **Home Wins** - Wins at home
- **Home Losses** - Losses at home
- **Away Wins** - Wins on road
- **Away Losses** - Losses on road
- **Win Percentage** - Wins / Games Played
- **Home Win %** - Home wins / Home games
- **Away Win %** - Away wins / Away games
- **Wins Above Expected** - Games won when win probability < 50%
- **Home Wins Above Expected**
- **Away Wins Above Expected**

### Period Goals
- **P1 Goals** - Goals scored in period 1
- **P2 Goals** - Goals scored in period 2
- **P3 Goals** - Goals scored in period 3

### Period-by-Period Metrics (Averaged)
For each period (P1, P2, P3), averages of:
- Shots
- Corsi %
- Power Play Goals
- Power Play Attempts
- PIM
- Hits
- Faceoff %
- Blocked Shots
- Giveaways
- Takeaways
- Game Score
- xG
- NZT (Neutral Zone Turnovers)
- NZTSA (Neutral Zone Turnovers to Shots Against)
- OZS (Offensive Zone Shots)
- NZS (Neutral Zone Shots)
- DZS (Defensive Zone Shots)
- FC (Forecheck/Cycle Shots)
- Rush (Rush Shots)

### Home/Away Splits
For both home and away games, averages of:
- **Goals For** - Average goals scored
- **Goals Against** - Average goals allowed
- **Shots For** - Average shots taken
- **Shots Against** - Average shots allowed
- **xG For** - Average expected goals for
- **xG Against** - Average expected goals against
- **HDC For** - Average high-danger chances for
- **HDC Against** - Average high-danger chances against
- **Corsi %** - Average Corsi percentage
- **PP %** - Average power play percentage
- **FO %** - Average faceoff win percentage
- **Lateral** - Average lateral (E-W) movement
- **Longitudinal** - Average longitudinal (N-S) movement
- **PIM** - Average penalty minutes
- **Hits** - Average hits
- **Blocks** - Average blocked shots
- **Giveaways** - Average giveaways
- **Takeaways** - Average takeaways
- **GS** - Average Game Score
- **NZT** - Average neutral zone turnovers
- **NZTSA** - Average neutral zone turnovers to shots against
- **OZS** - Average offensive zone shots
- **NZS** - Average neutral zone shots
- **DZS** - Average defensive zone shots
- **FC** - Average forecheck/cycle shots
- **Rush** - Average rush shots

### Clutch Metrics
- **Third Period Goals** - Total goals scored in third period
- **One-Goal Games** - Games decided by 1 goal
- **One-Goal Wins** - Wins in one-goal games
- **Comeback Wins** - Wins when trailing after 2 periods
- **Scored First Wins** - Games won when scoring first
- **Scored First Losses** - Games lost when scoring first
- **Opponent Scored First Wins** - Games won when opponent scored first
- **Opponent Scored First Losses** - Games lost when opponent scored first

### Streak Tracking
- **Current Streak** - Type ('win', 'loss', 'none') and count

### Player Stats (Aggregated)
- **Player Name**
- **Position**
- **Games** - Games played
- **Total GS** - Total Game Score accumulated
- **Total xG** - Total expected goals accumulated
- **GS + xG** - Combined Game Score and xG

---

## 5. Shot Location Visualization Metrics

### Shot Data Points
- **Shot Coordinates** (x, y) - Location on rink
- **Shot Type** - Wrist, snap, slap, tip-in, etc.
- **Event Type** - shot-on-goal, goal, missed-shot, blocked-shot
- **Team** - Away or Home
- **Period** - Period number
- **Time in Period** - Time stamp

### Visual Elements
- **Team Colors** - Each team's shots/goals displayed in team color
- **Goal Markers** - Larger markers for goals vs. shots
- **Rink Overlay** - NHL rink image with shot locations plotted

---

## 6. Player Performance Metrics (Top 5 Players)

- **Player Name** - Full name with jersey number
- **Team** - Team abbreviation
- **Position** - Player position
- **Goals** - Goals scored
- **Assists** - Assists
- **Points** - Goals + Assists
- **Plus/Minus** - Plus-minus rating
- **PIM** - Penalty minutes
- **SOG** - Shots on goal
- **Hits** - Hits delivered
- **Blocked Shots** - Shots blocked
- **Game Score (GS)** - Composite performance metric

---

## 7. Calculation Methods

### Game Score (GS) Formula
```
GS = 0.75×G + 0.7×A1 + 0.55×A2 + 0.075×SOG + 0.05×BLK + 0.15×PD - 0.15×PT
```
Where:
- G = Goals
- A1 = Primary assists
- A2 = Secondary assists
- SOG = Shots on goal
- BLK = Blocked shots
- PD = Penalties drawn
- PT = Penalties taken

### xG (Expected Goals) Calculation
- Uses `ImprovedXGModel` with factors:
  - Shot location (distance from goal)
  - Shot type (wrist, snap, slap, tip-in, etc.)
  - Shot angle
  - Rebound status
  - Rush status
  - Strength state (5v5, 5v4, etc.)
  - Previous events context

### Zone Determination
- **Offensive Zone**: X > 25 (blue line to goal line)
- **Neutral Zone**: -25 <= X <= 25 (between blue lines)
- **Defensive Zone**: X < -25 (blue line to goal line)

### Rush Shot Detection
- Shot in offensive zone within 5 seconds of N/D zone event (faceoff, turnover, blocked shot, hit)

### NZTSA Calculation
- Neutral zone turnover followed by opponent shot within 5 seconds and 50 coordinate units

### Corsi Calculation
- Corsi For: Shots on goal + Missed shots + Blocked shots (for team)
- Corsi Against: Shots on goal + Missed shots + Blocked shots (against team)
- Corsi % = (Corsi For / (Corsi For + Corsi Against)) × 100

---

## 8. Data Sources

### NHL API Data
- **Play-by-Play Data** - All events with coordinates, timestamps, team IDs
- **Boxscore Data** - Team totals, player stats, game state
- **Period Descriptors** - Period number, type (REG, OT, SO)

### Calculated Metrics
- All advanced metrics calculated from play-by-play data
- Period-by-period aggregations from play-by-play events
- Zone metrics from coordinate analysis
- Movement metrics from coordinate tracking

---

## 9. Report Sections

### Post-Game Report Structure
1. **Header** - Game info, teams, score, date
2. **Period-by-Period Table** - All metrics by period
3. **Advanced Metrics Table** - Shot quality, pressure, defense, movement
4. **Shot Location Plot** - Visual shot/goal locations on rink
5. **Top 5 Players** - Ranked by Game Score

### Team Report Structure
1. **Header** - Team name, logo, season info
2. **Team Summary** - Record, win percentages
3. **Home vs Away Comparison** - Split statistics
4. **Period-by-Period Averages** - Average metrics by period
5. **Clutch Performance** - Clutch metrics summary
6. **Player Leaders** - Top players by GS + xG

---

## 10. Metric Abbreviations Reference

- **GS** - Game Score
- **xG** - Expected Goals
- **HDC** - High-Danger Chances
- **CF%** - Corsi For Percentage
- **PP%** - Power Play Percentage
- **FO%** - Faceoff Win Percentage
- **NZT** - Neutral Zone Turnovers
- **NZTSA** - Neutral Zone Turnovers to Shots Against
- **OZS** - Offensive Zone Shots
- **NZS** - Neutral Zone Shots
- **DZS** - Defensive Zone Shots
- **FC** - Forecheck/Cycle Shots
- **PIM** - Penalty Minutes
- **BLK** - Blocked Shots
- **GV** - Giveaways
- **TK** - Takeaways
- **SOG** - Shots on Goal

---

## Notes

- All metrics are calculated from play-by-play data when available
- Period metrics exclude overtime/shootout unless specifically noted
- Team reports aggregate metrics across all games in the season
- Win probability uses correlation-based weights from analysis of 189 games
- Shot locations are normalized so away team always appears on left, home on right

