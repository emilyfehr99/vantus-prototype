#!/usr/bin/env python3
"""
Backfill all games from the current season to get all 300+ games
"""
from improved_self_learning_model_v2 import ImprovedSelfLearningModelV2
from prediction_interface import PredictionInterface
from nhl_api_client import NHLAPIClient
from datetime import datetime, timedelta
import pytz

def backfill_all_season_games():
    """Backfill all games from season start to now"""
    print("🔄 BACKFILLING ALL SEASON GAMES")
    print("=" * 60)
    
    model = ImprovedSelfLearningModelV2()
    interface = PredictionInterface()
    api = NHLAPIClient()
    
    # Get current predictions
    current_preds = model.model_data.get('predictions', [])
    current_game_ids = {str(p.get('game_id')) for p in current_preds if p.get('game_id')}
    print(f"📊 Current model has {len(current_preds)} predictions")
    
    # Season start (October 1, 2025)
    central_tz = pytz.timezone('US/Central')
    season_start = datetime(2025, 10, 1, tzinfo=central_tz)
    today = datetime.now(central_tz)
    
    games_added = 0
    games_skipped = 0
    games_failed = 0
    
    # Iterate through each day from season start
    current_date = season_start
    while current_date <= today:
        date_str = current_date.strftime('%Y-%m-%d')
        
        try:
            schedule = api.get_game_schedule(date_str)
            if not schedule or 'gameWeek' not in schedule:
                current_date += timedelta(days=1)
                continue
            
            for day in schedule['gameWeek']:
                if day.get('date') != date_str or 'games' not in day:
                    continue
                
                for game in day['games']:
                    game_id = str(game.get('id'))
                    game_state = game.get('gameState', 'UNKNOWN')
                    
                    # Skip if already have this game
                    if game_id in current_game_ids:
                        games_skipped += 1
                        continue
                    
                    # Only process completed games
                    if game_state not in ['FINAL', 'OFF']:
                        continue
                    
                    try:
                        away_team = game.get('awayTeam', {}).get('abbrev', 'UNK')
                        home_team = game.get('homeTeam', {}).get('abbrev', 'UNK')
                        
                        # Get comprehensive game data
                        game_data = api.get_comprehensive_game_data(game_id)
                        if not game_data:
                            games_failed += 1
                            continue
                        
                        # Determine actual winner
                        away_goals = game_data['boxscore']['awayTeam'].get('score', 0)
                        home_goals = game_data['boxscore']['homeTeam'].get('score', 0)
                        
                        actual_winner = None
                        if away_goals > home_goals:
                            actual_winner = "away"
                        elif home_goals > away_goals:
                            actual_winner = "home"
                        
                        if not actual_winner:
                            continue
                        
                        # Use interface to add game (it handles all the metrics)
                        interface.learning_model = model
                        interface.corr_model = interface.corr_model  # Keep existing corr_model
                        
                        # Call the same logic as check_and_add_missing_games
                        away_shots = game_data['boxscore']['awayTeam'].get('sog', 0)
                        home_shots = game_data['boxscore']['homeTeam'].get('sog', 0)
                        
                        try:
                            away_rest = model._calculate_rest_days_advantage(away_team, 'away', date_str)
                            home_rest = model._calculate_rest_days_advantage(home_team, 'home', date_str)
                        except Exception:
                            away_rest = home_rest = 0.0
                        
                        context_bucket = model.determine_context_bucket(away_rest, home_rest)
                        away_b2b = away_rest <= -0.5
                        home_b2b = home_rest <= -0.5
                        
                        # Get model prediction
                        try:
                            model_prediction = model.ensemble_predict(away_team, home_team)
                            raw_away_prob = model_prediction.get('away_prob', 0.5)
                            raw_home_prob = model_prediction.get('home_prob', 0.5)
                            predicted_away_prob = model.apply_calibration(raw_away_prob, context_bucket)
                            predicted_home_prob = 1.0 - predicted_away_prob
                            prediction_confidence = max(predicted_away_prob, predicted_home_prob)
                            ensemble_away_prob = raw_away_prob
                            ensemble_home_prob = raw_home_prob
                        except Exception:
                            # Fallback
                            total_shots = away_shots + home_shots
                            if total_shots > 0:
                                raw_away_prob = away_shots / total_shots
                                raw_home_prob = home_shots / total_shots
                            else:
                                raw_away_prob = 0.5
                                raw_home_prob = 0.5
                            predicted_away_prob = model.apply_calibration(raw_away_prob, context_bucket)
                            predicted_home_prob = 1.0 - predicted_away_prob
                            prediction_confidence = max(predicted_away_prob, predicted_home_prob)
                            ensemble_away_prob = raw_away_prob
                            ensemble_home_prob = raw_home_prob
                        
                        # Create metrics
                        metrics_used = {
                            "away_xg": 0.0, "home_xg": 0.0,
                            "away_hdc": 0, "home_hdc": 0,
                            "away_shots": away_shots,
                            "home_shots": home_shots,
                            "away_gs": 0.0, "home_gs": 0.0,
                            "away_corsi_pct": 50.0, "home_corsi_pct": 50.0,
                            "away_power_play_pct": 0.0, "home_power_play_pct": 0.0,
                            "away_faceoff_pct": 50.0, "home_faceoff_pct": 50.0,
                            "away_hits": 0, "home_hits": 0,
                            "away_blocked_shots": 0, "home_blocked_shots": 0,
                            "away_giveaways": 0, "home_giveaways": 0,
                            "away_takeaways": 0, "home_takeaways": 0,
                            "away_penalty_minutes": 0, "home_penalty_minutes": 0,
                            "away_rest": away_rest,
                            "home_rest": home_rest,
                            "context_bucket": context_bucket,
                            "away_back_to_back": away_b2b,
                            "home_back_to_back": home_b2b
                        }
                        
                        # Get correlation prediction
                        correlation_away_prob = None
                        correlation_home_prob = None
                        try:
                            corr_prediction = interface.corr_model.predict_from_metrics(metrics_used)
                            correlation_away_prob = corr_prediction.get('away_prob')
                            correlation_home_prob = corr_prediction.get('home_prob')
                        except Exception:
                            pass
                        
                        corr_disagreement = 0.0
                        if correlation_away_prob is not None and correlation_home_prob is not None:
                            corr_disagreement = abs(float(correlation_away_prob) - float(correlation_home_prob))
                        
                        metrics_used["corr_disagreement"] = corr_disagreement
                        
                        flip_rate = 0.0
                        try:
                            flip_rate = model._estimate_monte_carlo_signal(
                                {
                                    "metrics_used": metrics_used,
                                    "predicted_winner": "away" if raw_away_prob >= raw_home_prob else "home",
                                    "raw_away_prob": raw_away_prob,
                                    "raw_home_prob": raw_home_prob
                                },
                                iterations=40
                            )
                        except Exception:
                            flip_rate = 0.0
                        
                        metrics_used["monte_carlo_flip_rate"] = flip_rate
                        upset_probability = model.predict_upset_probability(
                            [prediction_confidence, abs(raw_away_prob - raw_home_prob), corr_disagreement, flip_rate]
                        )
                        
                        # Add to model
                        model.add_prediction(
                            game_id=game_id,
                            date=date_str,
                            away_team=away_team,
                            home_team=home_team,
                            predicted_away_prob=predicted_away_prob,
                            predicted_home_prob=predicted_home_prob,
                            metrics_used=metrics_used,
                            actual_winner=actual_winner,
                            actual_away_score=away_goals,
                            actual_home_score=home_goals,
                            prediction_confidence=prediction_confidence,
                            raw_away_prob=raw_away_prob,
                            raw_home_prob=raw_home_prob,
                            calibrated_away_prob=predicted_away_prob,
                            calibrated_home_prob=predicted_home_prob,
                            correlation_away_prob=correlation_away_prob,
                            correlation_home_prob=correlation_home_prob,
                            ensemble_away_prob=ensemble_away_prob,
                            ensemble_home_prob=ensemble_home_prob
                        )
                        
                        current_game_ids.add(game_id)
                        games_added += 1
                        
                        if games_added % 25 == 0:
                            print(f"  ✅ Added {games_added} games...")
                        
                    except Exception as e:
                        games_failed += 1
                        if games_failed <= 5:  # Only print first few errors
                            print(f"  ⚠️  Error processing game {game_id}: {e}")
                        continue
        
        except Exception as e:
            print(f"  ⚠️  Error processing date {date_str}: {e}")
        
        current_date += timedelta(days=1)
    
    print(f"\n✅ Backfill complete!")
    print(f"   Added: {games_added} games")
    print(f"   Skipped: {games_skipped} games (already in model)")
    print(f"   Failed: {games_failed} games")
    
    # Recalculate performance
    print(f"\n🔄 Recalculating model performance...")
    model.recalculate_performance_from_scratch()
    perf = model.get_model_performance()
    print(f"   Total games: {perf.get('total_games', 0)}")
    print(f"   Accuracy: {perf.get('accuracy', 0.0):.1%}")
    
    return games_added

if __name__ == "__main__":
    backfill_all_season_games()

