#!/usr/bin/env python3
"""
Script to refit the correlation model with all available variables
This should be run periodically to ensure weights stay current
"""
import json
from correlation_model import CorrelationModel
from improved_self_learning_model_v2 import ImprovedSelfLearningModelV2
from pathlib import Path

def refit_correlation_model():
    """Refit correlation model weights from all completed games"""
    print("🔄 REFITTING CORRELATION MODEL")
    print("=" * 60)
    
    # Initialize models
    corr_model = CorrelationModel()
    learning_model = ImprovedSelfLearningModelV2()
    
    # Check current weights
    print("\n📊 CURRENT WEIGHTS:")
    for key in sorted(corr_model.feature_keys):
        weight = corr_model.weights.get(key, 0.0)
        print(f"  {key:25s}: {weight:8.4f}")
    print(f"  {'bias':25s}: {corr_model.bias:8.4f}")
    
    # Refit from history (pass learning_model to calculate missing metrics)
    print("\n🔄 Refitting weights from historical predictions...")
    print("   (Recalculating goalie_perf, recent_form, and venue_win_pct from historical data)")
    try:
        corr_model.refit_weights_from_history('win_probability_predictions_v2.json', learning_model=learning_model)
        
        # Show new weights
        print("\n✅ NEW WEIGHTS AFTER REFITTING:")
        for key in sorted(corr_model.feature_keys):
            old_weight = corr_model.weights.get(key, 0.0)
            print(f"  {key:25s}: {old_weight:8.4f}")
        print(f"  {'bias':25s}: {corr_model.bias:8.4f}")
        
        # Show weight changes
        print("\n📈 TOP WEIGHT CHANGES:")
        weight_changes = []
        for key in corr_model.feature_keys:
            weight = corr_model.weights.get(key, 0.0)
            weight_changes.append((key, weight, abs(weight)))
        
        # Sort by absolute weight (most important)
        weight_changes.sort(key=lambda x: x[2], reverse=True)
        for key, weight, abs_weight in weight_changes[:10]:
            print(f"  {key:25s}: {weight:8.4f} (importance: {abs_weight:.4f})")
        
        print("\n✅ Correlation model refitted successfully!")
        print(f"   Model saved to: {corr_model.model_path}")
        
        # Verify model file was saved
        if corr_model.model_path.exists():
            with open(corr_model.model_path, 'r') as f:
                saved_data = json.load(f)
            print(f"   ✅ Verified: {len(saved_data.get('weights', {}))} weights saved")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error refitting correlation model: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_model_coverage():
    """Check what variables are available in predictions vs what's in the model"""
    print("\n🔍 CHECKING VARIABLE COVERAGE")
    print("=" * 60)
    
    pred_file = Path('win_probability_predictions_v2.json')
    if not pred_file.exists():
        print("❌ Predictions file not found")
        return
    
    with open(pred_file, 'r') as f:
        data = json.load(f)
    
    completed = [p for p in data.get('predictions', []) if p.get('actual_winner')]
    print(f"📊 Found {len(completed)} completed games")
    
    if len(completed) == 0:
        print("⚠️  No completed games found")
        return
    
    # Check what metrics are available
    all_metrics = set()
    metrics_with_data = {}
    
    for pred in completed:
        metrics = pred.get('metrics_used', {})
        if not metrics:
            continue
        for key in metrics.keys():
            all_metrics.add(key)
            if key not in metrics_with_data:
                metrics_with_data[key] = 0
            if metrics[key] is not None:
                metrics_with_data[key] += 1
    
    print(f"\n📋 Available metrics in predictions: {len(all_metrics)}")
    print("\nMetrics with data coverage:")
    for key in sorted(all_metrics):
        coverage = metrics_with_data.get(key, 0)
        pct = (coverage / len(completed)) * 100
        print(f"  {key:30s}: {coverage:4d}/{len(completed)} ({pct:5.1f}%)")
    
    # Check correlation model features
    corr_model = CorrelationModel()
    print(f"\n📋 Features in correlation model: {len(corr_model.feature_keys)}")
    print("\nModel features:")
    for key in sorted(corr_model.feature_keys):
        in_data = key in all_metrics or any(k.startswith(key.replace('_diff', '')) for k in all_metrics)
        status = "✅" if in_data else "⚠️"
        print(f"  {status} {key:30s}")
    
    # Check for missing features
    missing_features = []
    for key in all_metrics:
        # Check if this metric or its difference is in the model
        if key.endswith('_diff'):
            if key not in corr_model.feature_keys:
                missing_features.append(key)
        elif f"{key}_diff" not in corr_model.feature_keys and key not in ['context_bucket', 'away_back_to_back', 'home_back_to_back']:
            # Check if it's a difference metric
            if 'away_' in key and 'home_' in key.replace('away_', ''):
                diff_key = key.replace('away_', '').replace('home_', '') + '_diff'
                if diff_key not in corr_model.feature_keys:
                    missing_features.append(key)
    
    if missing_features:
        print(f"\n⚠️  Metrics in data but not in model: {len(missing_features)}")
        for key in sorted(missing_features)[:10]:
            print(f"  - {key}")
    else:
        print("\n✅ All available metrics are included in the model!")

if __name__ == "__main__":
    # Check coverage first
    check_model_coverage()
    
    # Then refit
    print("\n" + "=" * 60)
    success = refit_correlation_model()
    
    if success:
        print("\n🎉 Refitting complete!")
        print("   The model will use these new weights for future predictions.")
    else:
        print("\n❌ Refitting failed. Check errors above.")

