#!/usr/bin/env python3
from __future__ import annotations
"""
Correlation-weighted model with online updates.
Trains weights from historical completed predictions and predicts pre-game using
team averages and situational features (rest, goalie_perf, SOS).
"""
import json
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

CORR_MODEL_FILE = Path('correlation_model_weights.json')


def sigmoid(x: float) -> float:
    """Sigmoid function with bounds to prevent extreme predictions"""
    try:
        # Clip input to prevent extreme outputs
        x_clipped = max(-5.0, min(5.0, x))  # Prevents outputs outside ~0.007 to ~0.993
        result = 1.0 / (1.0 + math.exp(-x_clipped))
        # Apply additional bounds to prevent 0% or 100% predictions
        return max(0.05, min(0.95, result))  # Keep between 5% and 95%
    except OverflowError:
        return 0.05 if x < 0 else 0.95


class CorrelationModel:
    def __init__(self, model_path: Path = CORR_MODEL_FILE):
        self.model_path = model_path
        self.weights: Dict[str, float] = {}
        self.bias: float = 0.0
        self.feature_keys: List[str] = [
            'gs_diff','power_play_diff','blocked_shots_diff','corsi_diff','hits_diff',
            'rest_diff','hdc_diff','shots_diff','giveaways_diff','sos_diff',
            'takeaways_diff','xg_diff','pim_diff','faceoff_diff',
            'goalie_matchup_quality','special_teams_matchup',
            'goalie_perf_diff','recent_form_diff','venue_win_pct_diff'  # Additional variables
        ]
        self._load()

    def _load(self) -> None:
        if self.model_path.exists():
            try:
                obj = json.load(open(self.model_path, 'r'))
                self.weights = obj.get('weights', {})
                self.bias = float(obj.get('bias', 0.0))
                return
            except Exception:
                pass
        # Defaults from last correlation ranking as priors
        self.weights = {
            'gs_diff': 0.4614,
            'power_play_diff': 0.3213,
            'blocked_shots_diff': -0.2931,
            'corsi_diff': -0.2659,
            'hits_diff': -0.1374,
            'rest_diff': 0.1023,
            'hdc_diff': 0.0759,
            'shots_diff': -0.0744,
            'giveaways_diff': -0.0427,
            'sos_diff': -0.0390,
            'takeaways_diff': 0.0334,
            'xg_diff': -0.0274,
            'pim_diff': 0.0160,
            'faceoff_diff': -0.0118,
            'goalie_matchup_quality': 0.0,  # Will be learned from data
            'special_teams_matchup': 0.0,  # Will be learned from data
            'goalie_perf_diff': 0.0,  # Will be learned from data
            'recent_form_diff': 0.0,  # Will be learned from data
            'venue_win_pct_diff': 0.0,  # Will be learned from data
        }
        self.bias = 0.0

    def _save(self) -> None:
        try:
            json.dump({'weights': self.weights, 'bias': self.bias}, open(self.model_path, 'w'), indent=2)
        except Exception:
            pass

    def _feature_row_from_metrics(self, metrics: Dict) -> Dict[str, float]:
        feat = {
            'gs_diff': float(metrics.get('away_gs', 0.0)) - float(metrics.get('home_gs', 0.0)),
            'power_play_diff': float(metrics.get('away_power_play_pct', 0.0)) - float(metrics.get('home_power_play_pct', 0.0)),
            'blocked_shots_diff': float(metrics.get('away_blocked_shots', 0.0)) - float(metrics.get('home_blocked_shots', 0.0)),
            'corsi_diff': float(metrics.get('away_corsi_pct', 50.0)) - float(metrics.get('home_corsi_pct', 50.0)),
            'hits_diff': float(metrics.get('away_hits', 0.0)) - float(metrics.get('home_hits', 0.0)),
            'rest_diff': float(metrics.get('away_rest', 0.0)) - float(metrics.get('home_rest', 0.0)),
            'hdc_diff': float(metrics.get('away_hdc', 0.0)) - float(metrics.get('home_hdc', 0.0)),
            'shots_diff': float(metrics.get('away_shots', 0.0)) - float(metrics.get('home_shots', 0.0)),
            'giveaways_diff': float(metrics.get('away_giveaways', 0.0)) - float(metrics.get('home_giveaways', 0.0)),
            'sos_diff': float(metrics.get('away_sos', 0.0)) - float(metrics.get('home_sos', 0.0)),
            'takeaways_diff': float(metrics.get('away_takeaways', 0.0)) - float(metrics.get('home_takeaways', 0.0)),
            'xg_diff': float(metrics.get('away_xg', 0.0)) - float(metrics.get('home_xg', 0.0)),
            'pim_diff': float(metrics.get('away_penalty_minutes', 0.0)) - float(metrics.get('home_penalty_minutes', 0.0)),
            'faceoff_diff': float(metrics.get('away_faceoff_pct', 50.0)) - float(metrics.get('home_faceoff_pct', 50.0)),
        }
        # Add goalie and recent form if available (always include in feature_keys)
        if 'away_goalie_perf' in metrics and 'home_goalie_perf' in metrics:
            feat['goalie_perf_diff'] = float(metrics.get('away_goalie_perf', 0.0)) - float(metrics.get('home_goalie_perf', 0.0))
        else:
            feat['goalie_perf_diff'] = 0.0
        
        if 'recent_form_diff' in metrics:
            feat['recent_form_diff'] = float(metrics.get('recent_form_diff', 0.0))
        else:
            feat['recent_form_diff'] = 0.0
        
        # Add venue win percentage difference (replaces generic home ice advantage)
        if 'away_venue_win_pct' in metrics and 'home_venue_win_pct' in metrics:
            feat['venue_win_pct_diff'] = float(metrics.get('away_venue_win_pct', 0.5)) - float(metrics.get('home_venue_win_pct', 0.5))
        else:
            feat['venue_win_pct_diff'] = 0.0
        
        # Add goalie matchup quality and special teams matchup
        if 'goalie_matchup_quality' in metrics:
            feat['goalie_matchup_quality'] = float(metrics.get('goalie_matchup_quality', 0.0))
        else:
            feat['goalie_matchup_quality'] = 0.0
        
        if 'special_teams_matchup' in metrics:
            feat['special_teams_matchup'] = float(metrics.get('special_teams_matchup', 0.0))
        else:
            feat['special_teams_matchup'] = 0.0
        
        return feat

    def _score(self, feats: Dict[str, float]) -> float:
        s = self.bias
        for k, w in self.weights.items():
            v = feats.get(k, 0.0)
            # Simple scale for percentage-like features to similar magnitude
            if k in ('power_play_diff','corsi_diff','faceoff_diff'):
                v = v / 10.0
            # Reduce GS weight (was over-weighted in misses)
            if k == 'gs_diff':
                v = v * 0.5  # Reduce GS influence by 50%
            s += w * v
        # Note: venue_win_pct_diff, recent_form_diff, goalie_matchup_quality, 
        # special_teams_matchup, and goalie_perf_diff are now included in feature_keys
        # and handled by the weight loop above. Weights are learned from data during refitting.
        return s

    def predict_from_metrics(self, metrics: Dict) -> Dict[str, float]:
        feats = self._feature_row_from_metrics(metrics)
        s = self._score(feats)
        p_away = sigmoid(s)
        p_home = 1.0 - p_away
        return {'away_prob': p_away, 'home_prob': p_home}

    def online_update(self, metrics: Dict, actual_label: str, lr: float = 0.01) -> None:
        """One-step logistic regression update from a single game.
        actual_label: 'away' or 'home'.
        """
        y = 1.0 if actual_label == 'away' else 0.0
        feats = self._feature_row_from_metrics(metrics)
        s = self._score(feats)
        p = sigmoid(s)
        # Gradient descent update
        err = (p - y)
        for k in self.feature_keys:
            g = feats.get(k, 0.0)
            if k in ('power_play_diff','corsi_diff','faceoff_diff'):
                g = g / 10.0
            self.weights[k] = self.weights.get(k, 0.0) - lr * err * g
        self.bias = self.bias - lr * err
        self._save()
    
    def refit_weights_from_history(self, predictions_file: str = 'win_probability_predictions_v2.json', 
                                   learning_model=None) -> None:
        """Periodically re-fit weights using logistic regression on all completed games.
        This should be called weekly/monthly to ensure weights stay current.
        
        Args:
            predictions_file: Path to predictions JSON file (fallback if learning_model not provided)
            learning_model: Optional ImprovedSelfLearningModelV2 instance - if provided, uses its internal data
        """
        import json
        from pathlib import Path
        
        # Prefer learning_model's internal data if available (has all games)
        if learning_model and hasattr(learning_model, 'model_data'):
            completed = [p for p in learning_model.model_data.get('predictions', []) if p.get('actual_winner')]
            print(f"📊 Using {len(completed)} completed games from learning_model internal data")
        else:
            # Fallback to file
            pred_file = Path(predictions_file)
            if not pred_file.exists():
                print(f"⚠️  Predictions file not found: {predictions_file}")
                return
            
            with open(pred_file, 'r') as f:
                data = json.load(f)
            
            completed = [p for p in data.get('predictions', []) if p.get('actual_winner')]
            print(f"📊 Using {len(completed)} completed games from file: {predictions_file}")
        
        if len(completed) < 5:  # Minimum samples for refitting (lowered to allow learning with limited data)
            print(f"⚠️  Only {len(completed)} completed games found, need at least 5 for refitting")
            return
        
        # Build feature matrix and labels
        X = []
        y = []
        for pred in completed:
            metrics = pred.get('metrics_used', {}).copy() if pred.get('metrics_used') else {}
            if not metrics:
                continue
            
            # Calculate missing metrics from historical data if learning_model provided
            if learning_model:
                away_team = pred.get('away_team', '')
                home_team = pred.get('home_team', '')
                game_date = pred.get('date', '')
                
                # Calculate goalie performance if missing (always recalculate from historical data)
                try:
                    away_goalie_perf = learning_model._goalie_performance_for_game(away_team, 'away', game_date)
                    home_goalie_perf = learning_model._goalie_performance_for_game(home_team, 'home', game_date)
                    metrics['away_goalie_perf'] = away_goalie_perf
                    metrics['home_goalie_perf'] = home_goalie_perf
                except Exception:
                    metrics['away_goalie_perf'] = metrics.get('away_goalie_perf', 0.0)
                    metrics['home_goalie_perf'] = metrics.get('home_goalie_perf', 0.0)
                
                # Calculate recent form if missing (always recalculate from historical data)
                try:
                    away_perf = learning_model.get_team_performance(away_team, 'away')
                    home_perf = learning_model.get_team_performance(home_team, 'home')
                    away_recent_form = away_perf.get('recent_form', 0.5)
                    home_recent_form = home_perf.get('recent_form', 0.5)
                    metrics['recent_form_diff'] = away_recent_form - home_recent_form
                except Exception:
                    metrics['recent_form_diff'] = metrics.get('recent_form_diff', 0.0)
                
                # Calculate venue win percentages if missing (always recalculate from historical data)
                try:
                    away_venue_win_pct = learning_model._calculate_venue_win_percentage(away_team, 'away')
                    home_venue_win_pct = learning_model._calculate_venue_win_percentage(home_team, 'home')
                    metrics['away_venue_win_pct'] = away_venue_win_pct
                    metrics['home_venue_win_pct'] = home_venue_win_pct
                except Exception:
                    metrics['away_venue_win_pct'] = metrics.get('away_venue_win_pct', 0.5)
                    metrics['home_venue_win_pct'] = metrics.get('home_venue_win_pct', 0.5)
            
            feats = self._feature_row_from_metrics(metrics)
            X.append([feats.get(k, 0.0) for k in self.feature_keys])
            # Normalize label
            actual = pred.get('actual_winner')
            away = (pred.get('away_team') or '').upper()
            home = (pred.get('home_team') or '').upper()
            if actual in ('away', away):
                y.append(1.0)
            elif actual in ('home', home):
                y.append(0.0)
            else:
                continue
        
        if len(X) < 5:
            print(f"⚠️  Only {len(X)} valid samples after feature extraction, need at least 5")
            return
        
        # Debug: Show feature statistics
        if len(X) > 0:
            X_arr_debug = np.array(X)
            print(f"\n📊 Feature statistics for {len(X)} games:")
            for i, key in enumerate(self.feature_keys):
                values = X_arr_debug[:, i]
                non_zero = np.count_nonzero(values)
                std_val = np.std(values)
                print(f"  {key:25s}: mean={np.mean(values):7.3f}, std={std_val:7.3f}, non-zero={non_zero}/{len(X)}")
        
        # Simple batch gradient descent (logistic regression)
        # Initialize from current weights
        weights_vec = np.array([self.weights.get(k, 0.0) for k in self.feature_keys])
        bias_val = self.bias
        X_arr = np.array(X)
        y_arr = np.array(y)
        
        # Scale percentage features
        for i, k in enumerate(self.feature_keys):
            if k in ('power_play_diff','corsi_diff','faceoff_diff'):
                X_arr[:, i] = X_arr[:, i] / 10.0
            if k == 'gs_diff':
                X_arr[:, i] = X_arr[:, i] * 0.5  # Apply GS reduction
        
        # Gradient descent
        lr = 0.01
        epochs = 100
        for epoch in range(epochs):
            scores = X_arr @ weights_vec + bias_val
            probs = 1.0 / (1.0 + np.exp(-np.clip(scores, -500, 500)))
            err = probs - y_arr
            grad_weights = X_arr.T @ err / len(X_arr)
            grad_bias = np.mean(err)
            weights_vec -= lr * grad_weights
            bias_val -= lr * grad_bias
        
        # Update weights
        for i, k in enumerate(self.feature_keys):
            self.weights[k] = float(weights_vec[i])
        self.bias = float(bias_val)
        self._save()
        print(f"✅ Re-fitted correlation weights from {len(X)} completed games")


