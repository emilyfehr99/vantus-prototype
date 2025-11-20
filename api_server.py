from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Base directory for data files
DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# Initialize predictor
try:
    from live_in_game_predictions import LiveInGamePredictor
    live_predictor = LiveInGamePredictor()
except ImportError:
    print("Warning: LiveInGamePredictor not found, using mock")
    class MockPredictor:
        def get_live_game_data(self, game_id): return {}
        def predict_live_game(self, metrics): return {}
    live_predictor = MockPredictor()

# Cache for team metrics to avoid recalculating on every request
_team_metrics_cache = None
_team_metrics_cache_time = None
_team_metrics_file_mtime = None
CACHE_DURATION = timedelta(hours=1)  # Cache for 1 hour

def load_json(filename):
    """Load JSON file from current directory"""
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {filename} not found, returning empty dict")
        return {}
    except json.JSONDecodeError as e:
        print(f"Error decoding {filename}: {e}")
        return {}

def get_file_mtime(filename):
    """Get file modification time"""
    try:
        return os.path.getmtime(filename)
    except:
        return None

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

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
    """Get aggregated team metrics for all teams (for Metrics page)
    Uses caching to avoid recalculating on every request.
    Cache is invalidated when the source file is modified or after 1 hour.
    """
    global _team_metrics_cache, _team_metrics_cache_time, _team_metrics_file_mtime
    
    filename = 'season_2025_2026_team_stats.json'
    current_mtime = get_file_mtime(filename)
    current_time = datetime.now()
    
    # Check if cache is valid
    cache_valid = (
        _team_metrics_cache is not None and
        _team_metrics_cache_time is not None and
        _team_metrics_file_mtime is not None and
        current_mtime == _team_metrics_file_mtime and
        (current_time - _team_metrics_cache_time) < CACHE_DURATION
    )
    
    if cache_valid:
        print(f"Returning cached team metrics (age: {(current_time - _team_metrics_cache_time).seconds}s)")
        return jsonify(_team_metrics_cache)
    
    print("Calculating fresh team metrics...")
    data = load_json(filename)
    
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
    
    # Cache the results
    _team_metrics_cache = metrics
    _team_metrics_cache_time = current_time
    _team_metrics_file_mtime = current_mtime
    
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
    """Get today's game predictions generated dynamically"""
    # Get today's schedule
    today = datetime.now().strftime('%Y-%m-%d')
    try:
        import requests
        url = f"https://api-web.nhle.com/v1/schedule/{today}"
        response = requests.get(url, timeout=5)
        if response.status_code != 200:
            return jsonify([])
            
        schedule_data = response.json()
        if not schedule_data.get('gameWeek') or not schedule_data['gameWeek'][0].get('games'):
            return jsonify([])
            
        games = schedule_data['gameWeek'][0]['games']
        
        # Get team metrics for calculation
        metrics_response = get_team_metrics()
        team_metrics = json.loads(metrics_response.get_data(as_text=True))
        
        predictions = []
        
        for game in games:
            away_team = game['awayTeam']['abbrev']
            home_team = game['homeTeam']['abbrev']
            
            # Get metrics for both teams
            away_stats = team_metrics.get(away_team, {})
            home_stats = team_metrics.get(home_team, {})
            
            # Calculate win probability based on weighted factors
            # 1. Points Percentage (30%)
            # 2. Recent Form (L10) (20%) - approximated from standings if available, else 0.5
            # 3. Expected Goals (xG) (25%)
            # 4. Corsi (CF%) (15%)
            # 5. Home Ice Advantage (10%)
            
            # Default values if metrics missing
            away_score = 50
            home_score = 50 + 5 # Base home ice advantage
            
            if away_stats and home_stats:
                # xG factor
                if away_stats.get('xg') and home_stats.get('xg'):
                    xg_diff = away_stats['xg'] - home_stats['xg']
                    away_score += xg_diff * 10
                    home_score -= xg_diff * 10
                
                # Corsi factor
                if away_stats.get('corsi_pct') and home_stats.get('corsi_pct'):
                    cf_diff = away_stats['corsi_pct'] - home_stats['corsi_pct']
                    away_score += cf_diff * 0.5
                    home_score -= cf_diff * 0.5
                    
                # Special teams
                if away_stats.get('pp_pct') and home_stats.get('pk_pct'):
                    special_diff = (away_stats['pp_pct'] + away_stats['pk_pct']) - (home_stats['pp_pct'] + home_stats['pk_pct'])
                    away_score += special_diff * 0.2
                    home_score -= special_diff * 0.2
            
            # Normalize to 0-100
            total = away_score + home_score
            away_prob = round((away_score / total) * 100, 1)
            home_prob = round((home_score / total) * 100, 1)
            
            # Ensure reasonable bounds (e.g. no team > 85% or < 15%)
            away_prob = max(15, min(85, away_prob))
            home_prob = 100 - away_prob
            
            predictions.append({
                "game_id": game['id'],
                "date": today,
                "away_team": away_team,
                "home_team": home_team,
                "predicted_winner": away_team if away_prob > home_prob else home_team,
                "predicted_away_win_prob": away_prob / 100, # Frontend expects decimal 0-1
                "predicted_home_win_prob": home_prob / 100,
                "confidence": abs(away_prob - home_prob) / 100,
                "model_version": "v2.1-dynamic"
            })
            
        return jsonify(predictions)
        
    except Exception as e:
        print(f"Error generating predictions: {e}")
        return jsonify([])

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

@app.route('/api/team-roster/<team_abbrev>', methods=['GET'])
def get_team_roster(team_abbrev):
    """Proxy endpoint for NHL team roster to avoid CORS issues"""
    try:
        import requests
        # Use the NHL API to get the roster
        url = f"https://api-web.nhle.com/v1/roster/{team_abbrev}/20252026"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({'error': 'Failed to fetch roster'}), response.status_code
    except Exception as e:
        print(f"Error fetching roster for {team_abbrev}: {e}")
        return jsonify({'error': str(e)}), 500

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
    port = int(os.environ.get('PORT', 5002))
    print(f"Starting server on http://localhost:{port}")
    print()
    
    app.run(debug=False, host='0.0.0.0', port=port)
