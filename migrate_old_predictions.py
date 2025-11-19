#!/usr/bin/env python3
"""
Migrate games from old predictions file to new format
This will add all historical games to the model
"""
import json
from improved_self_learning_model_v2 import ImprovedSelfLearningModelV2
from prediction_interface import PredictionInterface

def migrate_old_predictions():
    """Migrate games from win_probability_predictions.json to win_probability_predictions_v2.json"""
    print("🔄 MIGRATING OLD PREDICTIONS")
    print("=" * 60)
    
    # Load old file
    try:
        with open('win_probability_predictions.json', 'r') as f:
            old_data = json.load(f)
        old_preds = old_data.get('predictions', [])
        old_completed = [p for p in old_preds if p.get('actual_winner')]
        print(f"📊 Found {len(old_completed)} completed games in old file")
    except Exception as e:
        print(f"❌ Error loading old file: {e}")
        return
    
    # Initialize model
    model = ImprovedSelfLearningModelV2()
    interface = PredictionInterface()
    
    # Get current predictions
    current_preds = model.model_data.get('predictions', [])
    current_game_ids = {p.get('game_id') for p in current_preds if p.get('game_id')}
    print(f"📊 Current model has {len(current_preds)} predictions")
    print(f"📊 Current model has {len(current_game_ids)} unique game IDs")
    
    # Migrate games
    migrated = 0
    skipped = 0
    
    for old_pred in old_completed:
        game_id = str(old_pred.get('game_id', ''))
        
        # Skip if already in model
        if game_id in current_game_ids:
            skipped += 1
            continue
        
        try:
            away_team = old_pred.get('away_team', '')
            home_team = old_pred.get('home_team', '')
            date = old_pred.get('date', '')
            actual_winner = old_pred.get('actual_winner', '')
            
            # Normalize actual_winner to 'away' or 'home'
            if actual_winner == away_team:
                actual_winner_side = 'away'
            elif actual_winner == home_team:
                actual_winner_side = 'home'
            elif actual_winner in ('away', 'home'):
                actual_winner_side = actual_winner
            else:
                skipped += 1
                continue
            
            # Get scores
            actual_away_score = old_pred.get('actual_away_score') or old_pred.get('away_score')
            actual_home_score = old_pred.get('actual_home_score') or old_pred.get('home_score')
            
            # Get probabilities
            predicted_away_prob = old_pred.get('predicted_away_win_prob', 0.5)
            predicted_home_prob = old_pred.get('predicted_home_win_prob', 0.5)
            
            # Convert to decimal if percentage
            if predicted_away_prob > 1.0:
                predicted_away_prob = predicted_away_prob / 100.0
            if predicted_home_prob > 1.0:
                predicted_home_prob = predicted_home_prob / 100.0
            
            # Recalculate metrics from historical data
            try:
                away_rest = model._calculate_rest_days_advantage(away_team, 'away', date)
                home_rest = model._calculate_rest_days_advantage(home_team, 'home', date)
            except Exception:
                away_rest = home_rest = 0.0
            
            try:
                away_goalie_perf = model._goalie_performance_for_game(away_team, 'away', date)
                home_goalie_perf = model._goalie_performance_for_game(home_team, 'home', date)
            except Exception:
                away_goalie_perf = home_goalie_perf = 0.0
            
            try:
                away_sos = model._calculate_sos(away_team, 'away')
                home_sos = model._calculate_sos(home_team, 'home')
            except Exception:
                away_sos = home_sos = 0.5
            
            try:
                away_venue_win_pct = model._calculate_venue_win_percentage(away_team, 'away')
                home_venue_win_pct = model._calculate_venue_win_percentage(home_team, 'home')
            except Exception:
                away_venue_win_pct = home_venue_win_pct = 0.5
            
            away_perf = model.get_team_performance(away_team, 'away')
            home_perf = model.get_team_performance(home_team, 'home')
            away_recent_form = away_perf.get('recent_form', 0.5)
            home_recent_form = home_perf.get('recent_form', 0.5)
            
            context_bucket = model.determine_context_bucket(away_rest, home_rest)
            away_b2b = away_rest <= -0.5
            home_b2b = home_rest <= -0.5
            
            metrics_used = {
                "away_rest": away_rest,
                "home_rest": home_rest,
                "away_goalie_perf": away_goalie_perf,
                "home_goalie_perf": home_goalie_perf,
                "away_sos": away_sos,
                "home_sos": home_sos,
                "away_venue_win_pct": away_venue_win_pct,
                "home_venue_win_pct": home_venue_win_pct,
                "recent_form_diff": away_recent_form - home_recent_form,
                "context_bucket": context_bucket,
                "away_back_to_back": away_b2b,
                "home_back_to_back": home_b2b,
            }
            
            # Add prediction to model
            model.add_prediction(
                game_id=game_id,
                date=date,
                away_team=away_team,
                home_team=home_team,
                predicted_away_prob=predicted_away_prob,
                predicted_home_prob=predicted_home_prob,
                metrics_used=metrics_used,
                actual_winner=actual_winner_side,
                actual_away_score=actual_away_score,
                actual_home_score=actual_home_score,
                raw_away_prob=predicted_away_prob,
                raw_home_prob=predicted_home_prob,
                calibrated_away_prob=predicted_away_prob,
                calibrated_home_prob=predicted_home_prob
            )
            
            migrated += 1
            if migrated % 10 == 0:
                print(f"  ✅ Migrated {migrated} games...")
                
        except Exception as e:
            print(f"  ⚠️  Error migrating game {game_id}: {e}")
            skipped += 1
            continue
    
    print(f"\n✅ Migration complete!")
    print(f"   Migrated: {migrated} games")
    print(f"   Skipped: {skipped} games (already in model or errors)")
    
    # Recalculate performance
    print(f"\n🔄 Recalculating model performance...")
    model.recalculate_performance_from_scratch()
    perf = model.get_model_performance()
    print(f"   Total games: {perf.get('total_games', 0)}")
    print(f"   Accuracy: {perf.get('accuracy', 0.0):.1%}")
    
    return migrated

if __name__ == "__main__":
    migrate_old_predictions()

