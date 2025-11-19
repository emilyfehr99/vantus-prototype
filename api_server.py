from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Base directory for data files
DATA_DIR = os.path.dirname(os.path.abspath(__file__))

from live_in_game_predictions import LiveInGamePredictor

# Initialize predictor
live_predictor = LiveInGamePredictor()

def load_json(filename):
    """Load JSON file from data directory"""
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route('/api/team-stats', methods=['GET'])
def get_team_stats():
    """Get current season team stats with advanced metrics"""
    data = load_json('season_2025_2026_team_stats.json')
    
    # Handle both structures: direct team dict or wrapped in 'teams' key
    if 'teams' in data:
        return jsonify(data['teams'])
    return jsonify(data)

@app.route('/api/team-stats/<team_abbrev>', methods=['GET'])
def get_team_stats_by_abbrev(team_abbrev):
    """Get stats for specific team"""
    data = load_json('season_2025_2026_team_stats.json')
    
    # Handle both structures
    teams = data.get('teams', data)
    team_data = teams.get(team_abbrev.upper(), {})
    return jsonify(team_data)

@app.route('/api/team-metrics', methods=['GET'])
def get_team_metrics():
    """Get aggregated team metrics for all teams (for Metrics page)"""
    data = load_json('season_2025_2026_team_stats.json')
    
    # Handle both structures
    teams = data.get('teams', data)
    
    # Helper function to calculate average from list
    def avg(lst):
        if not lst or len(lst) == 0:
            return 0
        # Filter out non-numeric values
        numeric_values = [x for x in lst if isinstance(x, (int, float))]
        if len(numeric_values) == 0:
            return 0
        return sum(numeric_values) / len(numeric_values)
    
    # Transform to format expected by Metrics page
    # Calculate averages from home/away stats (which are lists)
    metrics = {}
    for team_abbrev, team_data in teams.items():
        # Structure is: teams.EDM.home and teams.EDM.away
        # Each metric is a list of values (one per game)
        home_stats = team_data.get('home', {})
        away_stats = team_data.get('away', {})
        
        # Calculate averages from lists
        home_gs = avg(home_stats.get('gs', []))
        away_gs = avg(away_stats.get('gs', []))
        
        home_nzt = avg(home_stats.get('nzt', []))
        away_nzt = avg(away_stats.get('nzt', []))
        
        home_ozs = avg(home_stats.get('ozs', []))
        away_ozs = avg(away_stats.get('ozs', []))
        
        home_nzs = avg(home_stats.get('nzs', []))
        away_nzs = avg(away_stats.get('nzs', []))
        
        home_dzs = avg(home_stats.get('period_dzs', []))  # Using period_dzs
        away_dzs = avg(away_stats.get('period_dzs', []))
        
        home_fc = avg(home_stats.get('fc', []))
        away_fc = avg(away_stats.get('fc', []))
        
        home_rush = avg(home_stats.get('rush', []))
        away_rush = avg(away_stats.get('rush', []))
        
        # Additional metrics
        home_lateral = avg(home_stats.get('lateral', []))
        away_lateral = avg(away_stats.get('lateral', []))
        
        home_longitudinal = avg(home_stats.get('longitudinal', []))
        away_longitudinal = avg(away_stats.get('longitudinal', []))
        
        home_nztsa = avg(home_stats.get('nztsa', []))
        away_nztsa = avg(away_stats.get('nztsa', []))
        
        home_xg = avg(home_stats.get('xg', []))
        away_xg = avg(away_stats.get('xg', []))
        
        home_hdc = avg(home_stats.get('hdc', []))
        away_hdc = avg(away_stats.get('hdc', []))
        
        home_corsi = avg(home_stats.get('corsi_pct', []))
        away_corsi = avg(away_stats.get('corsi_pct', []))
        
        home_shots = avg(home_stats.get('shots', []))
        away_shots = avg(away_stats.get('shots', []))
        
        home_goals = avg(home_stats.get('goals', []))
        away_goals = avg(away_stats.get('goals', []))
        
        home_hits = avg(home_stats.get('hits', []))
        away_hits = avg(away_stats.get('hits', []))
        
        home_blocks = avg(home_stats.get('blocked_shots', []))
        away_blocks = avg(away_stats.get('blocked_shots', []))
        
        home_giveaways = avg(home_stats.get('giveaways', []))
        away_giveaways = avg(away_stats.get('giveaways', []))
        
        home_takeaways = avg(home_stats.get('takeaways', []))
        away_takeaways = avg(away_stats.get('takeaways', []))
        
        home_pim = avg(home_stats.get('penalty_minutes', []))
        away_pim = avg(away_stats.get('penalty_minutes', []))
        
        home_pp_pct = avg(home_stats.get('power_play_pct', []))
        away_pp_pct = avg(away_stats.get('power_play_pct', []))
        
        home_pk_pct = avg(home_stats.get('penalty_kill_pct', []))
        away_pk_pct = avg(away_stats.get('penalty_kill_pct', []))
        
        home_fo_pct = avg(home_stats.get('faceoff_pct', []))
        away_fo_pct = avg(away_stats.get('faceoff_pct', []))
        
        # Average home and away stats
        metrics[team_abbrev] = {
            # Core advanced metrics
            'gs': round((home_gs + away_gs) / 2, 1),
            'nzts': round((home_nzt + away_nzt) / 2),  # nzt = neutral zone turnovers
            'nztsa': round((home_nztsa + away_nztsa) / 2, 1),  # neutral zone turnovers to shots against
            'ozs': round((home_ozs + away_ozs) / 2),
            'nzs': round((home_nzs + away_nzs) / 2),
            'dzs': round((home_dzs + away_dzs) / 2),
            'fc': round((home_fc + away_fc) / 2),
            'rush': round((home_rush + away_rush) / 2),
            
            # Movement metrics
            'lateral': round((home_lateral + away_lateral) / 2, 1),
            'longitudinal': round((home_longitudinal + away_longitudinal) / 2, 1),
            
            # Shooting metrics
            'xg': round((home_xg + away_xg) / 2, 2),
            'hdc': round((home_hdc + away_hdc) / 2, 1),
            'shots': round((home_shots + away_shots) / 2, 1),
            'goals': round((home_goals + away_goals) / 2, 2),
            
            # Possession metrics
            'corsi_pct': round((home_corsi + away_corsi) / 2, 1),
            
            # Physical metrics
            'hits': round((home_hits + away_hits) / 2, 1),
            'blocks': round((home_blocks + away_blocks) / 2, 1),
            'giveaways': round((home_giveaways + away_giveaways) / 2, 1),
            'takeaways': round((home_takeaways + away_takeaways) / 2, 1),
            'pim': round((home_pim + away_pim) / 2, 1),
            
            # Special teams
            'pp_pct': round((home_pp_pct + away_pp_pct) / 2, 1),
            'pk_pct': round((home_pk_pct + away_pk_pct) / 2, 1),
            'fo_pct': round((home_fo_pct + away_fo_pct) / 2, 1),
            
            # Meta
            'gamesProcessed': len(home_stats.get('games', [])) + len(away_stats.get('games', []))
        }
    
    return jsonify(metrics)

@app.route('/api/edge-data', methods=['GET'])
def get_edge_data():
    """Get NHL Edge data (skating speeds, distances, bursts)"""
    data = load_json('nhl_edge_data.json')
    return jsonify(data)

@app.route('/api/edge-data/<team_abbrev>', methods=['GET'])
def get_edge_data_by_team(team_abbrev):
    """Get Edge data for specific team"""
    data = load_json('nhl_edge_data.json')
    team_data = data.get(team_abbrev.upper(), {})
    return jsonify(team_data)

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    """Get all win probability predictions"""
    data = load_json('win_probability_predictions_v2.json')
    return jsonify(data)

@app.route('/api/predictions/today', methods=['GET'])
def get_today_predictions():
    """Get today's game predictions"""
    data = load_json('win_probability_predictions_v2.json')
    
    # Filter for today's games
    today = datetime.now().strftime('%Y-%m-%d')
    
    # The structure might be: { "predictions": [...], "team_stats": {...}, ... }
    # Or it might be a flat list of predictions
    if isinstance(data, dict) and 'predictions' in data:
        predictions = data['predictions']
    elif isinstance(data, list):
        predictions = data
    else:
        predictions = []
    
    # Filter predictions for today
    today_games = [p for p in predictions if p.get('date') == today]
    
    return jsonify(today_games)

@app.route('/api/predictions/game/<game_id>', methods=['GET'])
def get_game_prediction(game_id):
    """Get prediction for specific game"""
    data = load_json('win_probability_predictions_v2.json')
    
    # Find prediction for this game
    if isinstance(data, dict) and 'predictions' in data:
        predictions = data['predictions']
    elif isinstance(data, list):
        predictions = data
    else:
        return jsonify({}), 404
    
    for prediction in predictions:
        if str(prediction.get('game_id')) == str(game_id):
            return jsonify(prediction)
    
    return jsonify({}), 404

@app.route('/api/historical-stats', methods=['GET'])
def get_historical_stats():
    """Get historical season stats"""
    data = load_json('historical_seasons_team_stats.json')
    return jsonify(data)

@app.route('/api/historical-stats/<season>', methods=['GET'])
def get_historical_stats_by_season(season):
    """Get stats for specific season (e.g., '2024-2025')"""
    # Try to load the specific season file
    filename = f'season_{season.replace("-", "_")}_team_stats.json'
    data = load_json(filename)
    
    if not data:
        # Fallback to historical stats
        historical = load_json('historical_seasons_team_stats.json')
        data = historical.get(season, {})
    
    return jsonify(data)

@app.route('/api/notify/discord', methods=['POST'])
def send_discord_notification():
    """Trigger Discord notification with today's predictions"""
    try:
        import subprocess
        
        # Run the discord_notifier.py script
        result = subprocess.run(
            ['python3', os.path.join(DATA_DIR, 'discord_notifier.py')],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return jsonify({
                "success": True,
                "message": "Discord notification sent successfully",
                "output": result.stdout
            })
        else:
            return jsonify({
                "success": False,
                "message": "Failed to send Discord notification",
                "error": result.stderr
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error triggering Discord notification",
            "error": str(e)
        }), 500

@app.route('/api/live-game/<game_id>', methods=['GET'])
def get_live_game_data(game_id):
    """Get live game data and predictions"""
    try:
        # Get live metrics
        live_metrics = live_predictor.get_live_game_data(game_id)
        
        if not live_metrics:
            return jsonify({"error": "Game not found or not live"}), 404
            
        # Generate prediction
        prediction = live_predictor.predict_live_game(live_metrics)
        
        if not prediction:
            return jsonify({"error": "Could not generate prediction"}), 500
            
        return jsonify(prediction)
    except Exception as e:
        print(f"Error in live-game endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🏒 NHL Analytics API Server")
    print("=" * 50)
    print(f"Data directory: {DATA_DIR}")
    print(f"Available endpoints:")
    print(f"  GET /api/health")
    print(f"  GET /api/team-stats")
    print(f"  GET /api/team-stats/<team_abbrev>")
    print(f"  GET /api/team-metrics")
    print(f"  GET /api/edge-data")
    print(f"  GET /api/edge-data/<team_abbrev>")
    print(f"  GET /api/predictions")
    print(f"  GET /api/predictions/today")
    print(f"  GET /api/predictions/game/<game_id>")
    print(f"  GET /api/historical-stats")
    print(f"  GET /api/historical-stats/<season>")
    print(f"  POST /api/notify/discord")
    print("=" * 50)
    print(f"Starting server on http://localhost:5002")
    print()
    
    app.run(debug=True, port=5002, host='0.0.0.0')
