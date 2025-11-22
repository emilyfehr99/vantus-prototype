#!/usr/bin/env python3
"""
True Live In-Game NHL Predictions
Uses real-time game data, scores, and metrics to make predictions that change as the game progresses
"""

import json
import requests
import time
from datetime import datetime, timedelta
import pytz
from pathlib import Path
from improved_self_learning_model_v2 import ImprovedSelfLearningModelV2
from nhl_api_client import NHLAPIClient
from pdf_report_generator import PostGameReportGenerator
from advanced_metrics_analyzer import AdvancedMetricsAnalyzer

class LiveInGamePredictor:
    def __init__(self):
        self.api = NHLAPIClient()
        self.model = ImprovedSelfLearningModelV2()
        self.report_generator = PostGameReportGenerator()
        self.ct_tz = pytz.timezone('US/Central')
        
    def get_live_games(self):
        """Get all currently active NHL games"""
        try:
            today = datetime.now(self.ct_tz).strftime('%Y-%m-%d')
            schedule = self.api.get_game_schedule(today)
            
            if not schedule or 'gameWeek' not in schedule:
                return []
                
            games = []
            for day in schedule['gameWeek']:
                if 'games' in day:
                    games.extend(day['games'])
            
            live_games = []
            for game in games:
                game_state = game.get('gameState', '')
                if game_state in ['LIVE', 'CRIT']:
                    live_games.append(game)
                    
            return live_games
        except Exception as e:
            print(f"❌ Error getting live games: {e}")
            return []
    
    def get_live_game_data(self, game_id):
        """Get comprehensive live game data including ALL metrics from post-game reports"""
        try:
            game_data = self.api.get_comprehensive_game_data(game_id)
            
            # DEBUG: Mock Data for BOS vs ANA (2025020318) - REMOVED
            # if str(game_id) == '2025020318': ...


            if not game_data:
                return None
                
            # Extract live game state - try multiple paths
            boxscore = game_data.get('game_center', {}).get('boxscore', {}) or game_data.get('boxscore', {})
            teams = boxscore.get('teams', {})
            
            # Try alternative structure
            if not teams:
                away_team = boxscore.get('awayTeam', {})
                home_team = boxscore.get('homeTeam', {})
            else:
                away_team = teams.get('away', {})
                home_team = teams.get('home', {})
            
            # Get team IDs and abbreviations
            away_team_id = away_team.get('team', {}).get('id') or away_team.get('id')
            home_team_id = home_team.get('team', {}).get('id') or home_team.get('id')
            away_abbrev = away_team.get('team', {}).get('abbreviation', '') or away_team.get('abbrev', '') or away_team.get('abbreviation', '')
            home_abbrev = home_team.get('team', {}).get('abbreviation', '') or home_team.get('abbrev', '') or home_team.get('abbreviation', '')
            
            # Get current score
            away_score = (
                away_team.get('teamStats', {}).get('teamSkaterStats', {}).get('goals', 0) or
                away_team.get('score', 0) or
                away_team.get('goals', 0) or
                0
            )
            home_score = (
                home_team.get('teamStats', {}).get('teamSkaterStats', {}).get('goals', 0) or
                home_team.get('score', 0) or
                home_team.get('goals', 0) or
                0
            )
            
            # Get period and time info
            period_info = boxscore.get('periodInfo', {}) or boxscore.get('periodDescriptor', {})
            current_period = period_info.get('currentPeriod', 1) or period_info.get('number', 1)
            time_remaining = period_info.get('timeRemaining', '20:00') or boxscore.get('clock', {}).get('timeRemaining', '20:00')
            
            # Get basic live game metrics from boxscore
            away_stats = away_team.get('teamStats', {}).get('teamSkaterStats', {}) or {}
            home_stats = home_team.get('teamStats', {}).get('teamSkaterStats', {}) or {}
            
            # Try multiple paths for shots - NHL API structure can vary
            away_shots = (away_stats.get('shots') or 
                         away_stats.get('shotsOnGoal') or 
                         away_stats.get('sog') or 
                         away_team.get('shotsOnGoal') or 
                         away_team.get('sog') or 0)
            home_shots = (home_stats.get('shots') or 
                         home_stats.get('shotsOnGoal') or 
                         home_stats.get('sog') or 
                         home_team.get('shotsOnGoal') or 
                         home_team.get('sog') or 0)
            
            # If shots are 0, count from play-by-play data
            if away_shots == 0 or home_shots == 0:
                play_by_play = game_data.get('playByPlay', {}) or game_data.get('play_by_play', {})
                plays = play_by_play.get('plays', []) if play_by_play else []
                away_shots_count = 0
                home_shots_count = 0
                for play in plays:
                    event_type = play.get('typeDescKey', '') or play.get('typeDesc', '')
                    if event_type == 'shot-on-goal':
                        details = play.get('details', {})
                        event_team_id = details.get('eventOwnerTeamId')
                        if event_team_id == away_team_id:
                            away_shots_count += 1
                        elif event_team_id == home_team_id:
                            home_shots_count += 1
                if away_shots == 0:
                    away_shots = away_shots_count
                if home_shots == 0:
                    home_shots = home_shots_count
            
            # Initialize comprehensive metrics dict
            live_metrics = {
                'away_team': away_abbrev,
                'home_team': home_abbrev,
                'away_team_id': away_team_id,
                'home_team_id': home_team_id,
                'away_score': away_score,
                'home_score': home_score,
                'current_period': current_period,
                'time_remaining': time_remaining,
                'game_id': game_id,
                # Basic stats - get shots from boxscore teamStats
                'away_shots': away_shots,
                'home_shots': home_shots,
                'away_hits': away_stats.get('hits', 0),
                'home_hits': home_stats.get('hits', 0),
                'away_pim': away_stats.get('pim', 0) or away_stats.get('penaltyMinutes', 0),
                'home_pim': home_stats.get('pim', 0) or home_stats.get('penaltyMinutes', 0),
                'away_blocked_shots': away_stats.get('blocked', 0) or away_stats.get('blockedShots', 0),
                'home_blocked_shots': home_stats.get('blocked', 0) or home_stats.get('blockedShots', 0),
                'away_giveaways': away_stats.get('giveaways', 0),
                'home_giveaways': home_stats.get('giveaways', 0),
                'away_takeaways': away_stats.get('takeaways', 0),
                'home_takeaways': home_stats.get('takeaways', 0),
                'away_faceoff_wins': away_stats.get('faceOffWins', 0) or away_stats.get('faceoffWins', 0),
                'home_faceoff_wins': home_stats.get('faceOffWins', 0) or home_stats.get('faceoffWins', 0),
                'away_power_play_goals': away_stats.get('powerPlayGoals', 0),
                'home_power_play_goals': home_stats.get('powerPlayGoals', 0),
                'away_power_play_opportunities': away_stats.get('powerPlayOpportunities', 0),
                'home_power_play_opportunities': home_stats.get('powerPlayOpportunities', 0),
            }

            # Extract Scoring Summary
            scoring_summary = []
            try:
                # Get roster from play_by_play (rosterSpots) like PDF generator
                play_by_play = game_data.get('play_by_play', {})
                player_names = {}
                
                if 'rosterSpots' in play_by_play:
                    for player in play_by_play['rosterSpots']:
                        player_id = player.get('playerId')
                        first_name = player.get('firstName', {}).get('default', '')
                        last_name = player.get('lastName', {}).get('default', '')
                        player_names[player_id] = f"{first_name} {last_name}".strip()
                
                plays = play_by_play.get('plays', []) or []
                for play in plays:
                    if play.get('typeDescKey') == 'goal':
                        details = play.get('details', {})
                        period_desc = play.get('periodDescriptor', {})
                        time_in_period = play.get('timeInPeriod', '00:00')
                        
                        # Determine scoring team
                        scoring_team_id = details.get('eventOwnerTeamId')
                        scoring_team = away_team['abbrev'] if scoring_team_id == away_team['id'] else home_team['abbrev']
                        
                        # Get scorer ID and name
                        scorer_id = details.get('scoringPlayerId')
                        scorer_name = player_names.get(scorer_id, f"Player {scorer_id}")
                        
                        # Get assists
                        assists = []
                        for i in range(1, 3):  # assist1PlayerId, assist2PlayerId
                            assist_id = details.get(f'assist{i}PlayerId')
                            if assist_id:
                                assists.append(player_names.get(assist_id, f"Player {assist_id}"))
                        
                        scoring_summary.append({
                            'period': period_desc.get('number', 0),
                            'time': time_in_period,
                            'team': scoring_team,
                            'scorer': scorer_name,
                            'assists': assists,
                            'away_score': details.get('awayScore', 0),
                            'home_score': details.get('homeScore', 0)
                        })
            except Exception as e:
                print(f"Error extracting scoring summary: {e}")
            
            live_metrics['scoring_summary'] = scoring_summary

            # Extract goals by period for period-by-period display
            goals_by_period = {'away': [0, 0, 0], 'home': [0, 0, 0]}
            try:
                for goal in scoring_summary:
                    period_idx = goal['period'] - 1  # Convert to 0-indexed
                    if 0 <= period_idx < 3:  # Only regular periods
                        if goal['team'] == away_team['abbrev']:
                            goals_by_period['away'][period_idx] += 1
                        else:
                            goals_by_period['home'][period_idx] += 1
            except Exception as e:
                print(f"Error calculating goals by period: {e}")
            
            live_metrics['goals_by_period'] = goals_by_period

            # Extract Shot Data for Charts
            shots_data = []
            try:
                plays = game_data.get('play_by_play', {}).get('plays', []) or []
                for play in plays:
                    event_type = play.get('typeDescKey')
                    if event_type in ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot']:
                        details = play.get('details', {})
                        x = details.get('xCoord')
                        y = details.get('yCoord')
                        
                        if x is not None and y is not None:
                            # Map team_id to team abbreviation
                            team_id = details.get('eventOwnerTeamId')
                            team_abbrev = away_team['abbrev'] if team_id == away_team['id'] else home_team['abbrev']
                            
                            # Determine shot type (GOAL vs SHOT)
                            event_shot_type = 'GOAL' if event_type == 'goal' else 'SHOT'
                            
                            # Get actual shot type (wrist, slap, snap, etc.)
                            actual_shot_type = details.get('shotType', 'wrist')
                            
                            # Get shooter name
                            shooter_id = details.get('shootingPlayerId') or details.get('scoringPlayerId')
                            shooter_name = player_names.get(shooter_id, 'Unknown')
                            
                            # Calculate xG using the report generator's method
                            xg_value = 0.0
                            try:
                                xg_value = self.report_generator._calculate_improved_xg(x, y, actual_shot_type)
                            except:
                                # Fallback simple xG based on distance
                                distance = ((x ** 2) + (y ** 2)) ** 0.5
                                xg_value = max(0.01, 0.15 - (distance * 0.001))
                            
                            shots_data.append({
                                'x': x,
                                'y': y,
                                'type': event_shot_type,
                                'team': team_abbrev,
                                'period': play.get('periodDescriptor', {}).get('number', 0),
                                'time': play.get('timeInPeriod', '00:00'),
                                'player_id': shooter_id,
                                'shooter': shooter_name,
                                'shotType': actual_shot_type,
                                'xg': round(xg_value, 3)
                            })
            except Exception as e:
                print(f"Error extracting shot data: {e}")
            
            live_metrics['shots_data'] = shots_data

            # Extract Goalie Stats from boxscore like PDF generator
            goalie_stats = {'away': {}, 'home': {}}
            try:
                boxscore = game_data.get('boxscore', {})
                
                # Get away goalie
                away_goalies = boxscore.get('playerByGameStats', {}).get('awayTeam', {}).get('goalies', [])
                if away_goalies:
                    # Get the goalie who played (most saves)
                    away_goalie = max(away_goalies, key=lambda g: g.get('saves', 0))
                    goalie_stats['away'] = {
                        'name': f"{away_goalie.get('name', {}).get('default', 'Unknown')}",
                        'saves': away_goalie.get('saves', 0),
                        'shotsAgainst': away_goalie.get('shotsAgainst', 0),
                        'savePctg': away_goalie.get('savePctg', 0.0)
                    }
                
                # Get home goalie  
                home_goalies = boxscore.get('playerByGameStats', {}).get('homeTeam', {}).get('goalies', [])
                if home_goalies:
                    # Get the goalie who played (most saves)
                    home_goalie = max(home_goalies, key=lambda g: g.get('saves', 0))
                    goalie_stats['home'] = {
                        'name': f"{home_goalie.get('name', {}).get('default', 'Unknown')}",
                        'saves': home_goalie.get('saves', 0),
                        'shotsAgainst': home_goalie.get('shotsAgainst', 0),
                        'savePctg': home_goalie.get('savePctg', 0.0)
                    }
            except Exception as e:
                print(f"Error extracting goalie stats: {e}")
            
            live_metrics['goalie_stats'] = goalie_stats
            
            # Calculate advanced metrics from play-by-play if available
            if game_data.get('play_by_play') and away_team_id and home_team_id:
                try:
                    # Calculate xG and HDC
                    away_xg, home_xg = self.report_generator._calculate_xg_from_plays(game_data)
                    away_hdc, home_hdc = self.report_generator._calculate_hdc_from_plays(game_data)
                    
                    live_metrics['away_xg'] = away_xg
                    live_metrics['home_xg'] = home_xg
                    live_metrics['away_hdc'] = away_hdc
                    live_metrics['home_hdc'] = home_hdc
                    
                    # Calculate Game Score by period
                    away_gs_periods, away_xg_periods = self.report_generator._calculate_period_metrics(game_data, away_team_id, 'away')
                    home_gs_periods, home_xg_periods = self.report_generator._calculate_period_metrics(game_data, home_team_id, 'home')
                    
                    live_metrics['away_gs'] = sum(away_gs_periods) if away_gs_periods else 0.0
                    live_metrics['home_gs'] = sum(home_gs_periods) if home_gs_periods else 0.0
                    live_metrics['away_gs_by_period'] = away_gs_periods
                    live_metrics['home_gs_by_period'] = home_gs_periods
                    live_metrics['away_xg_by_period'] = away_xg_periods
                    live_metrics['home_xg_by_period'] = home_xg_periods
                    
                    # Calculate zone metrics
                    away_zone_metrics = self.report_generator._calculate_zone_metrics(game_data, away_team_id, 'away')
                    home_zone_metrics = self.report_generator._calculate_zone_metrics(game_data, home_team_id, 'home')
                    
                    # Store both totals and per-period arrays
                    live_metrics['away_zone_metrics'] = away_zone_metrics  # Keep full structure for per-period access
                    live_metrics['home_zone_metrics'] = home_zone_metrics  # Keep full structure for per-period access
                    
                    live_metrics['away_nzt'] = sum(away_zone_metrics.get('nz_turnovers', [0, 0, 0]))
                    live_metrics['away_nztsa'] = sum(away_zone_metrics.get('nz_turnovers_to_shots', [0, 0, 0]))
                    live_metrics['away_ozs'] = sum(away_zone_metrics.get('oz_originating_shots', [0, 0, 0]))
                    live_metrics['away_nzs'] = sum(away_zone_metrics.get('nz_originating_shots', [0, 0, 0]))
                    live_metrics['away_dzs'] = sum(away_zone_metrics.get('dz_originating_shots', [0, 0, 0]))
                    live_metrics['away_fc'] = sum(away_zone_metrics.get('fc_cycle_sog', [0, 0, 0]))
                    live_metrics['away_rush'] = sum(away_zone_metrics.get('rush_sog', [0, 0, 0]))
                    
                    live_metrics['home_nzt'] = sum(home_zone_metrics.get('nz_turnovers', [0, 0, 0]))
                    live_metrics['home_nztsa'] = sum(home_zone_metrics.get('nz_turnovers_to_shots', [0, 0, 0]))
                    live_metrics['home_ozs'] = sum(home_zone_metrics.get('oz_originating_shots', [0, 0, 0]))
                    live_metrics['home_nzs'] = sum(home_zone_metrics.get('nz_originating_shots', [0, 0, 0]))
                    live_metrics['home_dzs'] = sum(home_zone_metrics.get('dz_originating_shots', [0, 0, 0]))
                    live_metrics['home_fc'] = sum(home_zone_metrics.get('fc_cycle_sog', [0, 0, 0]))
                    live_metrics['home_rush'] = sum(home_zone_metrics.get('rush_sog', [0, 0, 0]))
                    
                    # Calculate movement metrics
                    analyzer = AdvancedMetricsAnalyzer(game_data.get('play_by_play', {}))
                    away_movement = analyzer.calculate_pre_shot_movement_metrics(away_team_id)
                    home_movement = analyzer.calculate_pre_shot_movement_metrics(home_team_id)
                    
                    live_metrics['away_lateral'] = away_movement['lateral_movement'].get('avg_delta_y', 0.0)
                    live_metrics['away_longitudinal'] = away_movement['longitudinal_movement'].get('avg_delta_x', 0.0)
                    live_metrics['home_lateral'] = home_movement['lateral_movement'].get('avg_delta_y', 0.0)
                    live_metrics['home_longitudinal'] = home_movement['longitudinal_movement'].get('avg_delta_x', 0.0)
                    
                    # Calculate period stats
                    away_period_stats = self.report_generator._calculate_real_period_stats(game_data, away_team_id, 'away')
                    home_period_stats = self.report_generator._calculate_real_period_stats(game_data, home_team_id, 'home')
                    
                    live_metrics['away_period_stats'] = away_period_stats
                    live_metrics['home_period_stats'] = home_period_stats
                    
                    # Calculate Corsi percentage
                    away_corsi_pct = sum(away_period_stats.get('corsi_pct', [50.0])) / max(1, len(away_period_stats.get('corsi_pct', [50.0])))
                    home_corsi_pct = sum(home_period_stats.get('corsi_pct', [50.0])) / max(1, len(home_period_stats.get('corsi_pct', [50.0])))
                    live_metrics['away_corsi_pct'] = away_corsi_pct
                    live_metrics['home_corsi_pct'] = home_corsi_pct
                    
                    # Calculate faceoff percentage
                    away_fo_wins = sum(away_period_stats.get('faceoff_wins', [0]))
                    away_fo_total = sum(away_period_stats.get('faceoff_total', [0]))
                    home_fo_wins = sum(home_period_stats.get('faceoff_wins', [0]))
                    home_fo_total = sum(home_period_stats.get('faceoff_total', [0]))
                    
                    live_metrics['away_faceoff_total'] = away_fo_total
                    live_metrics['home_faceoff_total'] = home_fo_total
                    live_metrics['away_faceoff_pct'] = (away_fo_wins / away_fo_total * 100) if away_fo_total > 0 else 50.0
                    live_metrics['home_faceoff_pct'] = (home_fo_wins / home_fo_total * 100) if home_fo_total > 0 else 50.0
                    
                    # Power play percentage
                    away_pp_goals = sum(away_period_stats.get('pp_goals', [0]))
                    away_pp_attempts = sum(away_period_stats.get('pp_attempts', [0]))
                    home_pp_goals = sum(home_period_stats.get('pp_goals', [0]))
                    home_pp_attempts = sum(home_period_stats.get('pp_attempts', [0]))
                    
                    live_metrics['away_power_play_pct'] = (away_pp_goals / away_pp_attempts * 100) if away_pp_attempts > 0 else 0.0
                    live_metrics['home_power_play_pct'] = (home_pp_goals / home_pp_attempts * 100) if home_pp_attempts > 0 else 0.0
                    
                    # Calculate clutch metrics
                    away_period_goals, _, _ = self.report_generator._calculate_goals_by_period(game_data, away_team_id)
                    home_period_goals, _, _ = self.report_generator._calculate_goals_by_period(game_data, home_team_id)
                    
                    live_metrics['away_third_period_goals'] = away_period_goals[2] if len(away_period_goals) > 2 else 0
                    live_metrics['home_third_period_goals'] = home_period_goals[2] if len(home_period_goals) > 2 else 0
                    
                    goal_diff = abs(away_score - home_score)
                    live_metrics['one_goal_game'] = (goal_diff == 1)
                    
                    # Who scored first
                    first_goal_scorer = None
                    pbp = game_data.get('play_by_play', {})
                    plays = pbp.get('plays', []) or pbp.get('events', []) or []
                    for play in plays:
                        if play.get('typeDescKey') == 'goal':
                            details = play.get('details', {})
                            first_goal_scorer = details.get('eventOwnerTeamId')
                            break
                    
                    live_metrics['away_scored_first'] = (first_goal_scorer == away_team_id)
                    live_metrics['home_scored_first'] = (first_goal_scorer == home_team_id)
                    
                    # Create period_breakdown structure for frontend
                    period_breakdown = []
                    num_periods = max(len(away_period_goals), len(home_period_goals), len(away_xg_periods), len(home_xg_periods))
                    
                    for i in range(num_periods):
                        period_breakdown.append({
                            'period': i + 1,
                            'away_goals': away_period_goals[i] if i < len(away_period_goals) else 0,
                            'home_goals': home_period_goals[i] if i < len(home_period_goals) else 0,
                            'away_xg': round(away_xg_periods[i], 2) if i < len(away_xg_periods) else 0.0,
                            'home_xg': round(home_xg_periods[i], 2) if i < len(home_xg_periods) else 0.0,
                            'away_gs': round(away_gs_periods[i], 2) if i < len(away_gs_periods) else 0.0,
                            'home_gs': round(home_gs_periods[i], 2) if i < len(home_gs_periods) else 0.0
                        })
                    
                    live_metrics['period_breakdown'] = period_breakdown
                    
                except Exception as e:
                    print(f"⚠️  Error calculating advanced metrics: {e}")
                    import traceback
                    traceback.print_exc()
                    # Set defaults for advanced metrics
                    for key in ['away_xg', 'home_xg', 'away_hdc', 'home_hdc', 'away_gs', 'home_gs',
                               'away_nzt', 'away_nztsa', 'away_ozs', 'away_nzs', 'away_dzs', 'away_fc', 'away_rush',
                               'home_nzt', 'home_nztsa', 'home_ozs', 'home_nzs', 'home_dzs', 'home_fc', 'home_rush',
                               'away_lateral', 'away_longitudinal', 'home_lateral', 'home_longitudinal',
                               'away_corsi_pct', 'home_corsi_pct', 'away_faceoff_pct', 'home_faceoff_pct',
                               'away_power_play_pct', 'home_power_play_pct']:
                        if key not in live_metrics:
                            live_metrics[key] = 0.0 if 'pct' in key or 'lateral' in key or 'longitudinal' in key else 0
            
            # Construct nested objects for frontend compatibility
            live_metrics['stats'] = {
                'away': {
                    'shots': live_metrics.get('away_shots', 0),
                    'hits': live_metrics.get('away_hits', 0),
                    'pim': live_metrics.get('away_pim', 0),
                    'blocked_shots': live_metrics.get('away_blocked_shots', 0),
                    'giveaways': live_metrics.get('away_giveaways', 0),
                    'takeaways': live_metrics.get('away_takeaways', 0),
                    'faceoff_pct': live_metrics.get('away_faceoff_pct', 0),
                    'power_play_pct': live_metrics.get('away_power_play_pct', 0),
                    'power_play_goals': live_metrics.get('away_power_play_goals', 0),
                    'power_play_opportunities': live_metrics.get('away_power_play_opportunities', 0)
                },
                'home': {
                    'shots': live_metrics.get('home_shots', 0),
                    'hits': live_metrics.get('home_hits', 0),
                    'pim': live_metrics.get('home_pim', 0),
                    'blocked_shots': live_metrics.get('home_blocked_shots', 0),
                    'giveaways': live_metrics.get('home_giveaways', 0),
                    'takeaways': live_metrics.get('home_takeaways', 0),
                    'faceoff_pct': live_metrics.get('home_faceoff_pct', 0),
                    'power_play_pct': live_metrics.get('home_power_play_pct', 0),
                    'power_play_goals': live_metrics.get('home_power_play_goals', 0),
                    'power_play_opportunities': live_metrics.get('home_power_play_opportunities', 0)
                }
            }

            live_metrics['advanced_metrics'] = {
                'away_xg': live_metrics.get('away_xg', 0), 'home_xg': live_metrics.get('home_xg', 0),
                'away_hdc': live_metrics.get('away_hdc', 0), 'home_hdc': live_metrics.get('home_hdc', 0),
                'away_gs': live_metrics.get('away_gs', 0), 'home_gs': live_metrics.get('home_gs', 0),
                'away_corsi_pct': live_metrics.get('away_corsi_pct', 0), 'home_corsi_pct': live_metrics.get('home_corsi_pct', 0),
                'away_ozs_pct': live_metrics.get('away_ozs', 0), 'home_ozs_pct': live_metrics.get('home_ozs', 0), # Using raw counts as pct placeholder if needed, or calculate pct
                'away_nzs_pct': live_metrics.get('away_nzs', 0), 'home_nzs_pct': live_metrics.get('home_nzs', 0)
            }

            # Don't set period_stats here - it will be formatted in api_server.py for frontend
            # live_metrics['period_stats'] = {
            #     'away': live_metrics.get('away_period_stats', {}),
            #     'home': live_metrics.get('home_period_stats', {})
            # }

            live_metrics['zone_metrics'] = {
                'away_nzt': live_metrics.get('away_nzt', 0), 'home_nzt': live_metrics.get('home_nzt', 0),
                'away_nztsa': live_metrics.get('away_nztsa', 0), 'home_nztsa': live_metrics.get('home_nztsa', 0),
                'away_ozs': live_metrics.get('away_ozs', 0), 'home_ozs': live_metrics.get('home_ozs', 0),
                'away_nzs': live_metrics.get('away_nzs', 0), 'home_nzs': live_metrics.get('home_nzs', 0),
                'away_dzs': live_metrics.get('away_dzs', 0), 'home_dzs': live_metrics.get('home_dzs', 0),
                'away_fc': live_metrics.get('away_fc', 0), 'home_fc': live_metrics.get('home_fc', 0),
                'away_rush': live_metrics.get('away_rush', 0), 'home_rush': live_metrics.get('home_rush', 0)
            }

            live_metrics['movement_metrics'] = {
                'away_lateral': live_metrics.get('away_lateral', 0), 'home_lateral': live_metrics.get('home_lateral', 0),
                'away_longitudinal': live_metrics.get('away_longitudinal', 0), 'home_longitudinal': live_metrics.get('home_longitudinal', 0)
            }
            
            return live_metrics
        except Exception as e:
            print(f"❌ Error getting live game data for {game_id}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def calculate_live_momentum(self, live_metrics):
        """Calculate momentum factors based on live game data"""
        try:
            away_score = live_metrics['away_score']
            home_score = live_metrics['home_score']
            current_period = live_metrics['current_period']
            time_remaining = live_metrics['time_remaining']
            
            # Score differential impact (stronger in later periods)
            score_diff = away_score - home_score
            period_multiplier = 0.1 + (current_period - 1) * 0.05  # More impact in later periods
            score_impact = score_diff * period_multiplier
            
            # Time pressure (less time = more impact)
            try:
                time_parts = time_remaining.split(':')
                minutes = int(time_parts[0])
                seconds = int(time_parts[1])
                total_seconds = minutes * 60 + seconds
                time_pressure = max(0, (1200 - total_seconds) / 1200)  # 0-1 scale
            except:
                time_pressure = 0.5  # Default if time parsing fails
            
            # Shot differential impact
            away_shots = live_metrics['away_shots']
            home_shots = live_metrics['home_shots']
            shot_diff = (away_shots - home_shots) * 0.02  # 2% per shot difference
            
            # Power play impact
            away_pp_goals = live_metrics['away_power_play_goals']
            home_pp_goals = live_metrics['home_power_play_goals']
            pp_impact = (away_pp_goals - home_pp_goals) * 0.05  # 5% per PP goal
            
            # Faceoff dominance
            away_faceoffs = live_metrics['away_faceoff_wins']
            home_faceoffs = live_metrics['home_faceoff_wins']
            total_faceoffs = away_faceoffs + home_faceoffs
            if total_faceoffs > 0:
                faceoff_impact = ((away_faceoffs - home_faceoffs) / total_faceoffs) * 0.03
            else:
                faceoff_impact = 0
            
            return {
                'score_impact': score_impact,
                'time_pressure': time_pressure,
                'shot_impact': shot_diff,
                'pp_impact': pp_impact,
                'faceoff_impact': faceoff_impact,
                'total_momentum': score_impact + shot_diff + pp_impact + faceoff_impact
            }
        except Exception as e:
            print(f"❌ Error calculating momentum: {e}")
            return {
                'score_impact': 0,
                'time_pressure': 0.5,
                'shot_impact': 0,
                'pp_impact': 0,
                'faceoff_impact': 0,
                'total_momentum': 0
            }
    
    def predict_live_game(self, live_metrics):
        """Make live in-game prediction using real-time data"""
        try:
            away_team = live_metrics['away_team']
            home_team = live_metrics['home_team']
            
            # Get base prediction from historical data
            base_prediction = self.model.ensemble_predict(away_team, home_team)
            away_prob = base_prediction['away_prob']
            home_prob = base_prediction['home_prob']
            
            # Calculate live momentum factors
            momentum = self.calculate_live_momentum(live_metrics)
            
            # Apply live adjustments
            away_prob += momentum['total_momentum']
            home_prob -= momentum['total_momentum']
            
            # Apply time pressure (later periods = more certain)
            time_pressure = momentum['time_pressure']
            if live_metrics['away_score'] > live_metrics['home_score']:
                away_prob += time_pressure * 0.1
                home_prob -= time_pressure * 0.1
            elif live_metrics['home_score'] > live_metrics['away_score']:
                home_prob += time_pressure * 0.1
                away_prob -= time_pressure * 0.1
            
            # Normalize probabilities
            total = away_prob + home_prob
            away_prob = max(0.01, min(0.99, away_prob / total))
            home_prob = max(0.01, min(0.99, home_prob / total))
            
            # Calculate confidence based on game state
            confidence = 0.5 + (live_metrics['current_period'] - 1) * 0.1
            confidence = min(0.95, confidence)
            
            # Merge live_metrics into the result so they are at the top level
            result = {
                'away_team': away_team,
                'home_team': home_team,
                'away_score': live_metrics['away_score'],
                'home_score': live_metrics['home_score'],
                'current_period': live_metrics['current_period'],
                'time_remaining': live_metrics['time_remaining'],
                'away_prob': away_prob,
                'home_prob': home_prob,
                'confidence': confidence,
                'momentum': momentum,
            }
            
            # Add all live metrics to the result
            result.update(live_metrics)
            
            return result
            
        except Exception as e:
            print(f"❌ Error making live prediction: {e}")
            return None
    
    def format_live_prediction(self, prediction):
        """Format live in-game prediction for display"""
        if not prediction:
            return "❌ Could not generate live prediction"
            
        away_team = prediction['away_team']
        home_team = prediction['home_team']
        away_score = prediction['away_score']
        home_score = prediction['home_score']
        current_period = prediction['current_period']
        time_remaining = prediction['time_remaining']
        away_prob = prediction['away_prob']
        home_prob = prediction['home_prob']
        confidence = prediction['confidence']
        momentum = prediction['momentum']
        
        # Determine favorite
        if away_prob > home_prob:
            favorite = f"{away_team} (+{(away_prob - home_prob) * 100:.1f}%)"
        else:
            favorite = f"{home_team} (+{(home_prob - away_prob) * 100:.1f}%)"
        
        return f"""
🏒 LIVE IN-GAME PREDICTION
{'=' * 50}
📊 {away_team} @ {home_team}
🎯 LIVE SCORE: {away_team} {away_score} - {home_score} {home_team}
⏰ Period {current_period} - {time_remaining} remaining

🎯 LIVE PREDICTION:
   {away_team}: {away_prob * 100:.1f}%
   {home_team}: {home_prob * 100:.1f}%
   ⭐ Favorite: {favorite}

📈 LIVE MOMENTUM:
   Score Impact: {momentum['score_impact'] * 100:+.1f}%
   Shot Impact: {momentum['shot_impact'] * 100:+.1f}%
   PP Impact: {momentum['pp_impact'] * 100:+.1f}%
   Faceoff Impact: {momentum['faceoff_impact'] * 100:+.1f}%

📊 LIVE METRICS:
   Shots: {away_team} {prediction['live_metrics']['away_shots']} - {prediction['live_metrics']['home_shots']} {home_team}
   Hits: {away_team} {prediction['live_metrics']['away_hits']} - {prediction['live_metrics']['home_hits']} {home_team}
   PIM: {away_team} {prediction['live_metrics']['away_pim']} - {prediction['live_metrics']['home_pim']} {home_team}

📈 Confidence: {confidence * 100:.1f}%
🔄 Updated: {datetime.now(self.ct_tz).strftime('%H:%M:%S CT')}
"""
    
    def run_live_predictions(self, update_interval=30):
        """Run live in-game predictions with automatic updates"""
        print("🏒 LIVE IN-GAME NHL PREDICTIONS")
        print("=" * 60)
        print(f"🔄 Update interval: {update_interval} seconds")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            while True:
                live_games = self.get_live_games()
                
                if not live_games:
                    print(f"⏰ {datetime.now(self.ct_tz).strftime('%H:%M:%S CT')} - No live games")
                else:
                    print(f"⏰ {datetime.now(self.ct_tz).strftime('%H:%M:%S CT')} - {len(live_games)} live games")
                    print()
                    
                    for game in live_games:
                        game_id = game.get('id')
                        live_metrics = self.get_live_game_data(game_id)
                        
                        if live_metrics:
                            prediction = self.predict_live_game(live_metrics)
                            if prediction:
                                print(self.format_live_prediction(prediction))
                                print()
                
                print(f"⏳ Waiting {update_interval} seconds for next update...")
                time.sleep(update_interval)
                print()
                
        except KeyboardInterrupt:
            print("\n🛑 Live predictions stopped")
        except Exception as e:
            print(f"\n❌ Error in live predictions: {e}")

def main():
    predictor = LiveInGamePredictor()
    
    print("🏒 LIVE IN-GAME NHL PREDICTIONS")
    print("=" * 60)
    print("1. Get current live games")
    print("2. Run continuous live predictions")
    print("3. Exit")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    if choice == "1":
        live_games = predictor.get_live_games()
        if live_games:
            print(f"\n📊 Found {len(live_games)} live games:")
            for game in live_games:
                game_id = game.get('id')
                live_metrics = predictor.get_live_game_data(game_id)
                if live_metrics:
                    prediction = predictor.predict_live_game(live_metrics)
                    if prediction:
                        print(predictor.format_live_prediction(prediction))
        else:
            print("\n⏰ No live games currently")
            
    elif choice == "2":
        interval = input("Update interval in seconds (default 30): ").strip()
        try:
            interval = int(interval) if interval else 30
        except ValueError:
            interval = 30
        predictor.run_live_predictions(interval)
        
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
