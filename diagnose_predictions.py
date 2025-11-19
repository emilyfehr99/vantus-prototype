#!/usr/bin/env python3
"""
Diagnostic script to investigate prediction accuracy issues
"""
import json
from improved_self_learning_model_v2 import ImprovedSelfLearningModelV2
from correlation_model import CorrelationModel
from prediction_interface import PredictionInterface
from datetime import datetime

def diagnose_prediction(away_team: str, home_team: str):
    """Diagnose a specific prediction to see what's happening"""
    print(f"\n{'='*60}")
    print(f"DIAGNOSING: {away_team} @ {home_team}")
    print(f"{'='*60}\n")
    
    model = ImprovedSelfLearningModelV2()
    corr = CorrelationModel()
    interface = PredictionInterface()
    
    # Get team performance data
    away_perf = model.get_team_performance(away_team, 'away')
    home_perf = model.get_team_performance(home_team, 'home')
    
    print("TEAM PERFORMANCE DATA:")
    print(f"  {away_team} (away):")
    print(f"    Games played: {away_perf.get('games_played', 0)}")
    print(f"    xG avg: {away_perf.get('xg_avg', 0.0):.2f}")
    print(f"    HDC avg: {away_perf.get('hdc_avg', 0.0):.2f}")
    print(f"    Shots avg: {away_perf.get('shots_avg', 0.0):.2f}")
    print(f"    GS avg: {away_perf.get('gs_avg', 0.0):.2f}")
    print(f"    Corsi %: {away_perf.get('corsi_avg', 50.0):.2f}")
    print(f"    Confidence: {away_perf.get('confidence', 0.0):.3f}")
    
    print(f"\n  {home_team} (home):")
    print(f"    Games played: {home_perf.get('games_played', 0)}")
    print(f"    xG avg: {home_perf.get('xg_avg', 0.0):.2f}")
    print(f"    HDC avg: {home_perf.get('hdc_avg', 0.0):.2f}")
    print(f"    Shots avg: {home_perf.get('shots_avg', 0.0):.2f}")
    print(f"    GS avg: {home_perf.get('gs_avg', 0.0):.2f}")
    print(f"    Corsi %: {home_perf.get('corsi_avg', 50.0):.2f}")
    print(f"    Confidence: {home_perf.get('confidence', 0.0):.3f}")
    
    # Get prediction breakdown
    today_str = datetime.now().strftime('%Y-%m-%d')
    prediction = interface.predict_game(away_team, home_team)
    
    print(f"\nPREDICTION BREAKDOWN:")
    print(f"  Final: {away_team} {prediction['away_prob']*100:.1f}% | {home_team} {prediction['home_prob']*100:.1f}%")
    print(f"  Raw blend: {prediction.get('raw_away_prob', 0.0)*100:.1f}% | {prediction.get('raw_home_prob', 0.0)*100:.1f}%")
    print(f"  Correlation model: {prediction.get('correlation_away_prob', 0.0)*100:.1f}% | {prediction.get('correlation_home_prob', 0.0)*100:.1f}%")
    print(f"  Ensemble model: {prediction.get('ensemble_away_prob', 0.0)*100:.1f}% | {prediction.get('ensemble_home_prob', 0.0)*100:.1f}%")
    print(f"  Calibration applied: {prediction.get('calibration_applied', False)}")
    print(f"  Context bucket: {prediction.get('context_bucket', 'unknown')}")
    
    # Check calibration points
    calibration_points = model.model_data.get('calibration_points', [])
    print(f"\nCALIBRATION POINTS: {len(calibration_points)} points")
    if calibration_points:
        print("  Sample points:")
        for i, (x, y) in enumerate(calibration_points[:5]):
            print(f"    {x:.3f} -> {y:.3f}")
        if len(calibration_points) > 5:
            print(f"    ... ({len(calibration_points) - 5} more)")
    
    # Check correlation model weights
    print(f"\nCORRELATION MODEL WEIGHTS:")
    for key, weight in sorted(corr.weights.items(), key=lambda x: abs(x[1]), reverse=True)[:10]:
        print(f"  {key}: {weight:.4f}")
    
    # Check if team stats exist
    print(f"\nTEAM STATS AVAILABILITY:")
    print(f"  {away_team} in team_stats: {away_team.upper() in model.team_stats}")
    print(f"  {home_team} in team_stats: {home_team.upper() in model.team_stats}")
    
    if away_team.upper() in model.team_stats:
        away_data = model.team_stats[away_team.upper()]
        print(f"  {away_team} has 'away' data: {'away' in away_data}")
        if 'away' in away_data:
            print(f"    Games: {len(away_data['away'].get('games', []))}")
    
    if home_team.upper() in model.team_stats:
        home_data = model.team_stats[home_team.upper()]
        print(f"  {home_team} has 'home' data: {'home' in home_data}")
        if 'home' in home_data:
            print(f"    Games: {len(home_data['home'].get('games', []))}")

def check_model_accuracy():
    """Check overall model accuracy"""
    print(f"\n{'='*60}")
    print("MODEL ACCURACY ANALYSIS")
    print(f"{'='*60}\n")
    
    model = ImprovedSelfLearningModelV2()
    perf = model.get_model_performance()
    
    print(f"Total games: {perf.get('total_games', 0)}")
    print(f"Accuracy: {perf.get('accuracy', 0.0):.1%}")
    print(f"Recent accuracy: {perf.get('recent_accuracy', 0.0):.1%}")
    
    # Check for extreme predictions
    try:
        with open('win_probability_predictions_v2.json', 'r') as f:
            data = json.load(f)
        predictions = data.get('predictions', [])
        
        extreme_predictions = []
        for p in predictions:
            away_prob = p.get('predicted_away_win_prob', 0.5)
            home_prob = p.get('predicted_home_win_prob', 0.5)
            if isinstance(away_prob, (int, float)) and isinstance(home_prob, (int, float)):
                max_prob = max(away_prob, home_prob)
                if max_prob >= 0.95 or max_prob <= 0.05:
                    extreme_predictions.append({
                        'game': f"{p.get('away_team')} @ {p.get('home_team')}",
                        'away_prob': away_prob,
                        'home_prob': home_prob,
                        'date': p.get('date')
                    })
        
        print(f"\nExtreme predictions (>=95% or <=5%): {len(extreme_predictions)}")
        if extreme_predictions:
            print("  Recent examples:")
            for ep in extreme_predictions[-10:]:
                print(f"    {ep['game']}: {ep['away_prob']*100:.1f}% | {ep['home_prob']*100:.1f}% ({ep['date']})")
        
        # Check for 66.7% pattern
        pattern_667 = []
        for p in predictions:
            away_prob = p.get('predicted_away_win_prob', 0.5)
            home_prob = p.get('predicted_home_win_prob', 0.5)
            if isinstance(away_prob, (int, float)) and isinstance(home_prob, (int, float)):
                # Check if close to 66.7/33.3 or 33.3/66.7
                if (abs(away_prob - 0.667) < 0.01 and abs(home_prob - 0.333) < 0.01) or \
                   (abs(away_prob - 0.333) < 0.01 and abs(home_prob - 0.667) < 0.01):
                    pattern_667.append({
                        'game': f"{p.get('away_team')} @ {p.get('home_team')}",
                        'away_prob': away_prob,
                        'home_prob': home_prob,
                        'date': p.get('date')
                    })
        
        print(f"\n66.7%/33.3% pattern matches: {len(pattern_667)}")
        if pattern_667:
            print("  Recent examples:")
            for p in pattern_667[-10:]:
                print(f"    {p['game']}: {p['away_prob']*100:.1f}% | {p['home_prob']*100:.1f}% ({p['date']})")
                
    except Exception as e:
        print(f"Error analyzing predictions: {e}")

if __name__ == "__main__":
    # Check overall accuracy
    check_model_accuracy()
    
    # Diagnose specific games mentioned
    print("\n" + "="*60)
    print("DIAGNOSING SPECIFIC GAMES")
    print("="*60)
    
    # CAR vs MIN (user's concern)
    diagnose_prediction("CAR", "MIN")
    
    # Check a few other teams
    diagnose_prediction("STL", "TOR")
    diagnose_prediction("NJD", "TBL")

