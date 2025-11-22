from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime, timedelta
import requests
import csv
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Base directory for data files
DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# Add project root and reports dir to sys.path
project_root = os.path.abspath(os.path.dirname(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

reports_dir = os.path.join(project_root, 'automated-post-game-reports')
if os.path.exists(reports_dir) and reports_dir not in sys.path:
    sys.path.insert(0, reports_dir)

# Initialize predictor
try:
    from live_in_game_predictions import LiveInGamePredictor
    live_predictor = LiveInGamePredictor()
except ImportError as e:
    print(f"Warning: LiveInGamePredictor not found ({e}), using mock")
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
    Fetches directly from MoneyPuck teams.csv (updated daily by MoneyPuck).
    Uses caching to avoid fetching on every request.
    Cache is invalidated after 1 hour.
    """
    global _team_metrics_cache, _team_metrics_cache_time
    
    current_time = datetime.now()
    
    # Check if cache is valid
    cache_valid = (
        _team_metrics_cache is not None and
        _team_metrics_cache_time is not None and
        (current_time - _team_metrics_cache_time) < CACHE_DURATION
    )
    
    if cache_valid:
        print(f"Returning cached team metrics (age: {(current_time - _team_metrics_cache_time).seconds}s)")
        return jsonify(_team_metrics_cache)
    
    print("Fetching fresh team metrics from MoneyPuck...")
    
    # Fetch from MoneyPuck teams.csv (situation='all' for overall team stats)
    # MoneyPuck updates this data daily, so we fetch it on-demand
    season = request.args.get('season', '2025')
    game_type = request.args.get('type', 'regular')
    situation = request.args.get('situation', 'all')  # Use 'all' for overall team metrics
    
    url = f"https://moneypuck.com/moneypuck/playerData/seasonSummary/{season}/{game_type}/teams.csv"
    
    try:
        response = requests.get(url, timeout=15)
        
        if response.status_code != 200:
            raise Exception(f"MoneyPuck API returned status {response.status_code}")
        
        # Parse MoneyPuck CSV data - include ALL fields
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        metrics = {}
        
        # Helper functions
        def safe_float(val, default=0.0):
            try:
                return float(val) if val else default
            except:
                return default
        
        def safe_int(val, default=0):
            try:
                return int(float(val)) if val else default
            except:
                return default
        
        # Process all rows and include ALL fields from MoneyPuck teams.csv
        for row in csv_reader:
            if row.get('situation', '').strip() == situation:
                team_abbr = row.get('team', '').strip()
                if not team_abbr:
                    continue
                
                # Include ALL fields from MoneyPuck teams.csv
                team_metrics = {}
                
                # Copy all fields, converting types appropriately
                for key, value in row.items():
                    if key == 'team':
                        team_metrics[key] = value
                    elif key in ['season', 'name', 'position', 'situation']:
                        team_metrics[key] = value
                    elif 'percentage' in key.lower() or 'pct' in key.lower():
                        # Convert percentages (0-1 scale) to 0-100 scale
                        team_metrics[key] = safe_float(value) * 100
                    elif key in ['iceTime', 'xGoalsFor', 'xGoalsAgainst', 'xOnGoalFor', 'xOnGoalAgainst',
                                'xReboundsFor', 'xReboundsAgainst', 'xFreezeFor', 'xFreezeAgainst',
                                'flurryAdjustedxGoalsFor', 'flurryAdjustedxGoalsAgainst',
                                'scoreVenueAdjustedxGoalsFor', 'scoreVenueAdjustedxGoalsAgainst',
                                'flurryScoreVenueAdjustedxGoalsFor', 'flurryScoreVenueAdjustedxGoalsAgainst',
                                'xGoalsFromxReboundsOfShotsFor', 'xGoalsFromxReboundsOfShotsAgainst',
                                'xGoalsFromActualReboundsOfShotsFor', 'xGoalsFromActualReboundsOfShotsAgainst',
                                'reboundxGoalsFor', 'reboundxGoalsAgainst',
                                'totalShotCreditFor', 'totalShotCreditAgainst',
                                'scoreAdjustedTotalShotCreditFor', 'scoreAdjustedTotalShotCreditAgainst',
                                'scoreFlurryAdjustedTotalShotCreditFor', 'scoreFlurryAdjustedTotalShotCreditAgainst',
                                'lowDangerxGoalsFor', 'mediumDangerxGoalsFor', 'highDangerxGoalsFor',
                                'lowDangerxGoalsAgainst', 'mediumDangerxGoalsAgainst', 'highDangerxGoalsAgainst',
                                'scoreAdjustedShotsAttemptsFor', 'scoreAdjustedShotsAttemptsAgainst',
                                'scoreAdjustedUnblockedShotAttemptsFor', 'scoreAdjustedUnblockedShotAttemptsAgainst']:
                        team_metrics[key] = safe_float(value)
                    else:
                        # Try int first, fall back to float
                        try:
                            if value and '.' not in str(value):
                                team_metrics[key] = safe_int(value)
                            else:
                                team_metrics[key] = safe_float(value)
                        except:
                            team_metrics[key] = value
                
                # Add legacy/compatibility fields
                team_metrics['xg'] = safe_float(row.get('xGoalsFor'))
                team_metrics['hdc'] = safe_int(row.get('highDangerShotsFor'))
                team_metrics['hdca'] = safe_int(row.get('highDangerShotsAgainst'))
                team_metrics['shots'] = safe_int(row.get('shotsOnGoalFor'))
                team_metrics['goals'] = safe_int(row.get('goalsFor'))
                team_metrics['ga_gp'] = safe_int(row.get('goalsAgainst'))
                team_metrics['corsi_pct'] = safe_float(row.get('corsiPercentage')) * 100
                team_metrics['hits'] = safe_int(row.get('hitsFor'))
                team_metrics['blocks'] = safe_int(row.get('blockedShotAttemptsFor'))
                team_metrics['giveaways'] = safe_int(row.get('giveawaysFor'))
                team_metrics['takeaways'] = safe_int(row.get('takeawaysFor'))
                team_metrics['pim'] = safe_int(row.get('penaltyMinutesFor'))
                
                metrics[team_abbr] = team_metrics
        
        print(f"Successfully fetched MoneyPuck team data for {len(metrics)} teams (situation={situation})")
    
    # Cache the results
    _team_metrics_cache = metrics
    _team_metrics_cache_time = current_time
    
    return jsonify(metrics)
        
    except Exception as e:
        print(f"Error fetching MoneyPuck team data: {e}")
        import traceback
        traceback.print_exc()
        # Fallback to local file - return empty dict if fallback fails
        try:
            filename = 'season_2025_2026_team_stats.json'
            data = load_json(filename)
            teams = data.get('teams', data)
            # Return simplified fallback
            metrics = {}
            for team_abbrev, team_data in teams.items():
                metrics[team_abbrev] = team_data if isinstance(team_data, dict) else {}
            _team_metrics_cache = metrics
            _team_metrics_cache_time = current_time
            return jsonify(metrics)
        except Exception as fallback_error:
            print(f"Fallback also failed: {fallback_error}")
            return jsonify({})

@app.route('/api/team-heatmap/<team_abbr>', methods=['GET'])
def get_team_heatmap(team_abbr):
    """Get aggregated shot data for team heatmap"""
    try:
        from nhl_api_client import NHLAPIClient
        client = NHLAPIClient()
        
        # ----- XG model import with fallback -----
        use_xg_model = False
        xg_model = None
        try:
            import sys
            import os
            # Add the project root to path if not already there
            project_root = os.path.abspath(os.path.dirname(__file__))
            if project_root not in sys.path:
                sys.path.insert(0, project_root)
            
            # Also try adding the automated-post-game-reports subdir
            reports_dir = os.path.join(project_root, 'automated-post-game-reports')
            if os.path.exists(reports_dir) and reports_dir not in sys.path:
                sys.path.insert(0, reports_dir)

            from improved_xg_model import ImprovedXGModel
            xg_model = ImprovedXGModel()
            use_xg_model = True
        except Exception as e:
            print(f"Could not load ImprovedXGModel: {e} – using distance-based fallback")

        # Team ID mapping (copied from client for reliability)
        team_ids = {
            'FLA': 13, 'EDM': 22, 'BOS': 6, 'TOR': 10, 'MTL': 8, 'OTT': 9,
            'BUF': 7, 'DET': 17, 'TBL': 14, 'CAR': 12, 'WSH': 15, 'PIT': 5,
            'NYR': 3, 'NYI': 2, 'NJD': 1, 'PHI': 4, 'CBJ': 29, 'NSH': 18,
            'STL': 19, 'MIN': 30, 'WPG': 52, 'COL': 21, 'ARI': 53, 'VGK': 54,
            'SJS': 28, 'LAK': 26, 'ANA': 24, 'CGY': 20, 'VAN': 23, 'SEA': 55,
            'CHI': 16, 'DAL': 25, 'UTA': 59
        }
        target_team_id = team_ids.get(team_abbr.upper())
        
        # Get recent games (limit 10)
        game_ids = client.get_team_recent_games(team_abbr, limit=10)
        
        shots_for = []
        goals_for = []
        shots_against = []
        goals_against = []
        
        for game_id in game_ids:
            # Get play-by-play and game center for each game
            pbp = client.get_play_by_play(game_id)
            game_center = client.get_game_center(game_id)
            
            # Robust check for game_center data
            home_team_id = None
            away_team_id = None
            if game_center:
                home_team_id = game_center.get('homeTeam', {}).get('id')
                away_team_id = game_center.get('awayTeam', {}).get('id')
            
            # Determine if target team is home or away
            is_home_team = False
            if home_team_id and target_team_id:
                is_home_team = (int(home_team_id) == int(target_team_id))
            
            if not pbp or 'plays' not in pbp:
                continue
                
            for play_index, play in enumerate(pbp.get('plays', [])):
                details = play.get('details', {})
                if not details:
                    continue
                    
                x = details.get('xCoord')
                y = details.get('yCoord')
                event_owner_id = details.get('eventOwnerTeamId')
                period = play.get('periodDescriptor', {}).get('number', 1)
                
                if x is None or y is None or event_owner_id is None:
                    continue
                
                is_for = (int(event_owner_id) == int(target_team_id)) if target_team_id else True
                
                # Normalize coordinates so target team always shoots right (positive x)
                normalized_x = x
                normalized_y = y
                
                if is_home_team:
                    # Home team: in odd periods shoots right, even periods shoots left
                    if period % 2 == 0:  # Even period - flip
                        normalized_x = -x
                        normalized_y = -y
                else:
                    # Away team: in odd periods shoots left, even periods shoots right  
                    if period % 2 == 1:  # Odd period - flip
                        normalized_x = -x
                        normalized_y = -y
                    
                # Helper for xG calculation
                def _calc_xg(event_type):
                    if use_xg_model and xg_model:
                        try:
                            previous = pbp.get('plays', [])[max(0, play_index-10):play_index]
                            shot_data = {
                                'x_coord': x,
                                'y_coord': y,
                                'shot_type': details.get('shotType', 'wrist').lower(),
                                'event_type': event_type,
                                'time_in_period': play.get('timeInPeriod', '00:00'),
                                'period': period,
                                'strength_state': 'even',
                                'score_differential': 0,
                                'team_id': event_owner_id,
                            }
                            return xg_model.calculate_xg(shot_data, previous)
                        except Exception as e:
                            print(f"xG model error: {e}")
                    
                    # Fallback distance-based xG
                    import math
                    distance = math.sqrt(x**2 + y**2)
                    if event_type == 'goal':
                        return max(0.1, min(0.8, 1.0 - (distance / 100)))
                    return max(0.01, min(0.5, 1.0 - (distance / 100)))

                # Common point data
                shooter_name = None
                shooter_id = details.get('shootingPlayerId') or details.get('scoringPlayerId')
                
                if shooter_id and 'rosterSpots' in pbp:
                    for spot in pbp['rosterSpots']:
                        if spot.get('playerId') == shooter_id:
                            shooter_name = spot.get('firstName', {}).get('default', '') + ' ' + spot.get('lastName', {}).get('default', '')
                            break
                
                # Determine movement type based on previous events
                movement = None
                if play_index > 0:
                    prev_play = pbp['plays'][play_index - 1]
                    prev_type = prev_play.get('typeDescKey', '')
                    if 'faceoff' in prev_type:
                        movement = 'rush'
                    elif 'hit' in prev_type or 'takeaway' in prev_type:
                        movement = 'forecheck'
                    elif prev_play.get('details', {}).get('zoneCode') != play.get('details', {}).get('zoneCode'):
                        movement = 'transition'

                point = {
                    'x': normalized_x,
                    'y': normalized_y,
                    'shooter': shooter_name,
                    'shotType': details.get('shotType'),
                    'movement': movement
                }

                if play.get('typeDescKey') == 'shot-on-goal':
                    point['xg'] = _calc_xg('shot-on-goal')
                    if is_for:
                        shots_for.append(point)
                    else:
                        shots_against.append(point)
                elif play.get('typeDescKey') == 'goal':
                    point['xg'] = _calc_xg('goal')
                    if is_for:
                        goals_for.append(point)
                    else:
                        goals_against.append(point)
        
        heatmap = {
            'shots_for': shots_for,
            'goals_for': goals_for,
            'shots_against': shots_against,
            'goals_against': goals_against
        }
        
        return jsonify(heatmap)

    except Exception as e:
        print(f"Error generating heatmap for {team_abbr}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

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
    """Get today's game predictions using the self-learning model"""
    try:
        # First, try to read from the predictions file
        predictions_file = os.path.join('automated-post-game-reports', 'win_probability_predictions_v2.json')
        today = datetime.now().strftime('%Y-%m-%d')
        
        try:
            with open(predictions_file, 'r') as f:
                data = json.load(f)
                all_predictions = data.get('predictions', [])
                
                print(f"📊 Total predictions in file: {len(all_predictions)}")
                
                # Filter for today's predictions
                todays_predictions = []
                for pred in all_predictions:
                    # Show all of today's games (even if they already have a winner)
                    if pred.get('date') == today:
                        # Values are already in decimal format (0.47) in the file
                        away_prob = pred.get('predicted_away_win_prob', 0.5)
                        home_prob = pred.get('predicted_home_win_prob', 0.5)
                        
                        todays_predictions.append({
                            'game_id': pred.get('game_id'),
                            'away_team': pred.get('away_team'),
                            'home_team': pred.get('home_team'),
                            'away_win_prob': away_prob,
                            'home_win_prob': home_prob,
                            'favorite': pred.get('home_team') if home_prob > away_prob else pred.get('away_team'),
                            'spread': abs(home_prob - away_prob),
                            'confidence': max(away_prob, home_prob),
                            'actual_winner': pred.get('actual_winner')  # Include for reference
                        })
                
                if todays_predictions:
                    print(f"✅ Found {len(todays_predictions)} predictions for today ({today}) from file")
                    for p in todays_predictions:
                        status = f"(FINAL: {p['actual_winner']})" if p.get('actual_winner') else "(UPCOMING)"
                        print(f"   {p['away_team']} @ {p['home_team']}: {p['away_win_prob']:.1%} / {p['home_win_prob']:.1%} {status}")
                    return jsonify(todays_predictions)
                else:
                    print(f"⚠️  No predictions found for today ({today}) in file")
        except Exception as file_error:
            print(f"Could not read predictions file: {file_error}")
        
        # Fallback: Try to use the actual prediction model
        try:
            from prediction_interface import PredictionInterface
            predictor = PredictionInterface()
            predictions = predictor.get_todays_predictions()
            
            # Format for frontend
            formatted_predictions = []
            for pred in predictions:
                formatted_predictions.append({
                    'game_id': pred.get('game_id'),
                    'away_team': pred.get('away_team'),
                    'home_team': pred.get('home_team'),
                    'away_win_prob': pred.get('predicted_away_win_prob', 0.5),
                    'home_win_prob': pred.get('predicted_home_win_prob', 0.5),
                    'favorite': pred.get('favorite'),
                    'spread': pred.get('spread', 0),
                    'confidence': pred.get('prediction_confidence', 0.5)
                })
            
            return jsonify(formatted_predictions)
            
        except Exception as model_error:
            print(f"Error using prediction model: {model_error}")
            # Final fallback to simple calculation
            
            import requests
            url = f"https://api-web.nhle.com/v1/schedule/{today}"
            response = requests.get(url, timeout=5)
            if response.status_code != 200:
                return jsonify([])
                
            schedule_data = response.json()
            if not schedule_data.get('gameWeek') or not schedule_data['gameWeek'][0].get('games'):
                return jsonify([])
                
            games = schedule_data['gameWeek'][0]['games']
            
            # Load team stats for calculation
            team_stats = {}
            try:
                with open(os.path.join(DATA_DIR, 'season_2025_2026_team_stats.json'), 'r') as f:
                    data = json.load(f)
                    team_stats = data.get('teams', {})
            except Exception as e:
                print(f"Error loading team stats: {e}")
                
            predictions = []
            
            for game in games:
                away_abbr = game['awayTeam']['abbrev']
                home_abbr = game['homeTeam']['abbrev']
                
                # Calculate win probability based on team stats
                away_metrics = team_stats.get(away_abbr, {}).get('away', {})
                home_metrics = team_stats.get(home_abbr, {}).get('home', {})
                
                # Default probability if no stats
                home_prob = 0.55 
                
                if away_metrics and home_metrics:
                    # Use xG and Corsi as factors
                    home_xg = sum(home_metrics.get('xg', [0])) / len(home_metrics.get('xg', [1])) if home_metrics.get('xg') else 2.5
                    away_xg = sum(away_metrics.get('xg', [0])) / len(away_metrics.get('xg', [1])) if away_metrics.get('xg') else 2.5
                    
                    home_corsi = sum(home_metrics.get('corsi_pct', [0])) / len(home_metrics.get('corsi_pct', [1])) if home_metrics.get('corsi_pct') else 50
                    away_corsi = sum(away_metrics.get('corsi_pct', [0])) / len(away_metrics.get('corsi_pct', [1])) if away_metrics.get('corsi_pct') else 50
                    
                    # Weighted calculation
                    xg_factor = (home_xg / (home_xg + away_xg)) * 0.6
                    corsi_factor = (home_corsi / (home_corsi + away_corsi)) * 0.4
                    
                    home_prob = xg_factor + corsi_factor
                
                away_prob = 1 - home_prob
                
                predictions.append({
                    'game_id': game.get('id'),
                    'away_team': away_abbr,
                    'home_team': home_abbr,
                    'away_win_prob': away_prob,
                    'home_win_prob': home_prob,
                    'favorite': home_abbr if home_prob > away_prob else away_abbr,
                    'spread': abs(home_prob - away_prob),
                    'confidence': max(home_prob, away_prob)
                })
                
            return jsonify(predictions)
            
    except Exception as e:
        print(f"Error getting predictions: {e}")
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

@app.route('/api/lines/<team_abbrev>', methods=['GET'])
def get_team_lines(team_abbrev):
    """Get lines and pairings from MoneyPuck"""
    try:
        url = "https://moneypuck.com/moneypuck/playerData/seasonSummary/2025/regular/lines.csv"
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch lines'}), 500
        
        lines_data = []
        # Decode content to string
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        for row in csv_reader:
            if row['team'] == team_abbrev.upper() and row['situation'] == '5on5':
                # Parse players
                players = row['name'].split('-')
                
                line_item = {
                    'players': [{'name': p} for p in players],
                    'position': row['position'], # 'line' or 'pairing'
                    'icetime': float(row['icetime']),
                    'games_played': int(row['games_played']),
                    'xg_pct': float(row['xGoalsPercentage']) if row['xGoalsPercentage'] else 0.0,
                    'goals_for': float(row['goalsFor']) if row['goalsFor'] else 0.0,
                    'goals_against': float(row['goalsAgainst']) if row['goalsAgainst'] else 0.0
                }
                lines_data.append(line_item)
        
        # Sort by icetime descending
        lines_data.sort(key=lambda x: x['icetime'], reverse=True)
        
        # Separate into forwards and defense
        forwards = [l for l in lines_data if l['position'] == 'line'][:4]
        defense = [l for l in lines_data if l['position'] == 'pairing'][:3]
        
        return jsonify({
            'forwards': forwards,
            'defense': defense
        })
        
    except Exception as e:
        print(f"Error fetching lines for {team_abbrev}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/team-data', methods=['GET'])
def get_team_data():
    """Get team-level data from MoneyPuck teams.csv"""
    try:
        season = request.args.get('season', '2025')
        game_type = request.args.get('type', 'regular')
        situation = request.args.get('situation', '5on5')  # 5on5, all, etc
        
        url = f"https://moneypuck.com/moneypuck/playerData/seasonSummary/{season}/{game_type}/teams.csv"
        response = requests.get(url, timeout=15)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch team data'}), 500
        
        teams_data = {}
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        for row in csv_reader:
            if row['situation'] == situation:
                team_abbr = row['team']
                if team_abbr not in teams_data:
                    teams_data[team_abbr] = {}
                
                # Add all relevant fields
                def safe_float(val, default=0.0):
                    try:
                        return float(val) if val else default
                    except:
                        return default
                
                def safe_int(val, default=0):
                    try:
                        return int(float(val)) if val else default
                    except:
                        return default
                
                teams_data[team_abbr] = {
                    'team': team_abbr,
                    'situation': situation,
                    'games_played': safe_int(row.get('games_played')),
                    'xGoalsPercentage': safe_float(row.get('xGoalsPercentage')) * 100,
                    'corsiPercentage': safe_float(row.get('corsiPercentage')) * 100,
                    'fenwickPercentage': safe_float(row.get('fenwickPercentage')) * 100,
                    'iceTime': safe_float(row.get('iceTime')),
                    'xGoalsFor': safe_float(row.get('xGoalsFor')),
                    'xGoalsAgainst': safe_float(row.get('xGoalsAgainst')),
                    'goalsFor': safe_int(row.get('goalsFor')),
                    'goalsAgainst': safe_int(row.get('goalsAgainst')),
                    'shotsOnGoalFor': safe_int(row.get('shotsOnGoalFor')),
                    'shotsOnGoalAgainst': safe_int(row.get('shotsOnGoalAgainst')),
                    'highDangerShotsFor': safe_int(row.get('highDangerShotsFor')),
                    'highDangerShotsAgainst': safe_int(row.get('highDangerShotsAgainst')),
                    'highDangerxGoalsFor': safe_float(row.get('highDangerxGoalsFor')),
                    'highDangerxGoalsAgainst': safe_float(row.get('highDangerxGoalsAgainst')),
                    'reboundsFor': safe_int(row.get('reboundsFor')),
                    'reboundGoalsFor': safe_int(row.get('reboundGoalsFor')),
                    'xGoalsFromxReboundsOfShotsFor': safe_float(row.get('xGoalsFromxReboundsOfShotsFor')),
                    'xGoalsFromActualReboundsOfShotsFor': safe_float(row.get('xGoalsFromActualReboundsOfShotsFor')),
                    'reboundxGoalsFor': safe_float(row.get('reboundxGoalsFor')),
                    'playContinuedInZoneFor': safe_int(row.get('playContinuedInZoneFor')),
                    'playContinuedOutsideZoneFor': safe_int(row.get('playContinuedOutsideZoneFor')),
                    'playStoppedFor': safe_int(row.get('playStoppedFor')),
                    'reboundsAgainst': safe_int(row.get('reboundsAgainst')),
                    'reboundGoalsAgainst': safe_int(row.get('reboundGoalsAgainst')),
                    'playContinuedInZoneAgainst': safe_int(row.get('playContinuedInZoneAgainst')),
                }
        
        return jsonify(teams_data)
        
    except Exception as e:
        print(f"Error fetching team data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/player-stats', methods=['GET'])
def get_player_stats():
    """Get player stats from MoneyPuck"""
    try:
        season = request.args.get('season', '2025')
        game_type = request.args.get('type', 'regular')
        situation = request.args.get('situation', 'all')  # all, 5on5, etc
        
        url = f"https://moneypuck.com/moneypuck/playerData/seasonSummary/{season}/{game_type}/skaters.csv"
        response = requests.get(url, timeout=15)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch player stats'}), 500
        
        players_data = []
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        for row in csv_reader:
            # Filter by situation if specified (handle different formats)
            row_situation = row.get('situation', '').strip()
            requested_situation = situation.strip() if situation else 'all'
            
            # Map common variations - MoneyPuck uses exact values like '5on5', 'all', 'other', etc.
            situation_map = {
                '5v5': '5on5',
                '5on5': '5on5',
                'all': 'all',
                'other': 'other'
            }
            requested_situation = situation_map.get(requested_situation.lower(), requested_situation)
            
            # Match situation (case-insensitive comparison)
            if requested_situation.lower() == 'all' or row_situation.lower() == requested_situation.lower():
                # Helper functions to safely parse values
                def safe_int(val, default=0):
                    try:
                        return int(float(val)) if val else default
                    except:
                        return default
                
                def safe_float(val, default=0.0):
                    try:
                        return round(float(val), 2) if val else default
                    except:
                        return default
                
                def safe_pct(val, default=0.0):
                    try:
                        return round(float(val) * 100, 1) if val else default
                    except:
                        return default
                
                # Return all available columns from MoneyPuck
                player = {}
                
                # Copy all fields from the row, converting numeric values appropriately
                for key, value in row.items():
                    if key in ['name', 'team', 'position', 'situation']:
                        player[key] = value
                    elif 'percentage' in key.lower() or 'pct' in key.lower():
                        player[key] = safe_pct(value)
                    elif key in ['icetime', 'gameScore', 'I_F_xGoals', 'onIce_F_xGoals', 'onIce_A_xGoals']:
                        player[key] = safe_float(value)
                    elif key.startswith('I_F_') or key.startswith('onIce_') or key.startswith('OnIce_') or key in ['games_played', 'offensiveZoneStarts', 'defensiveZoneStarts', 'neutralZoneStarts']:
                        # Try to parse as int first, fall back to float
                        try:
                            if '.' in str(value):
                                player[key] = safe_float(value)
                            else:
                                player[key] = safe_int(value)
                        except:
                            player[key] = value
                    else:
                        # Keep as string or try to parse
                        try:
                            if value and value.replace('.', '').replace('-', '').isdigit():
                                player[key] = safe_float(value) if '.' in value else safe_int(value)
                            else:
                                player[key] = value
                        except:
                            player[key] = value
                
                # Add computed fields for convenience
                player['goals'] = safe_int(row.get('I_F_goals'))
                player['assists'] = safe_int(row.get('I_F_primaryAssists', 0)) + safe_int(row.get('I_F_secondaryAssists', 0))
                player['points'] = safe_int(row.get('I_F_points'))
                player['shots'] = safe_int(row.get('I_F_shotsOnGoal'))
                player['game_score'] = safe_float(row.get('gameScore'))
                player['xgoals'] = safe_float(row.get('I_F_xGoals'))
                player['corsi_pct'] = safe_pct(row.get('onIce_corsiPercentage'))
                player['xgoals_pct'] = safe_pct(row.get('onIce_xGoalsPercentage'))
                
                players_data.append(player)
        
        return jsonify(players_data)
        
    except Exception as e:
        print(f"Error fetching player stats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/team-top-performers/<team_abbr>', methods=['GET'])
def get_team_top_performers(team_abbr):
    """Get top performers from team's recent games (for pre-game display)"""
    try:
        from nhl_api_client import NHLAPIClient
        client = NHLAPIClient()
        
        # Get recent games (last 5)
        game_ids = client.get_team_recent_games(team_abbr, limit=5)
        
        if not game_ids:
            return jsonify([])
        
        # Aggregate player stats across games
        player_stats = {}  # player_id -> {name, position, sweaterNumber, total_gs, games, goals, assists, points, shots}
        
        for game_id in game_ids:
            try:
                game_data = client.get_game_center(game_id)
                if not game_data or 'boxscore' not in game_data:
                    continue
                
                boxscore = game_data['boxscore']
                player_by_game_stats = boxscore.get('playerByGameStats', {})
                
                # Determine which team's players to process
                away_team = boxscore.get('awayTeam', {})
                home_team = boxscore.get('homeTeam', {})
                
                team_player_stats = None
                if away_team.get('abbrev') == team_abbr.upper():
                    team_player_stats = player_by_game_stats.get('awayTeam', {})
                elif home_team.get('abbrev') == team_abbr.upper():
                    team_player_stats = player_by_game_stats.get('homeTeam', {})
                
                if not team_player_stats:
                    continue
                
                # Process all player groups
                for group in ['forwards', 'defense', 'goalies']:
                    players = team_player_stats.get(group, [])
                    for player in players:
                        # Try multiple possible ID fields
                        player_id = player.get('playerId') or player.get('id') or player.get('playerID')
                        if not player_id:
                            continue
                        
                        # Get name - could be in 'name' field (as object or string) or constructed from firstName/lastName
                        name = ''
                        name_field = player.get('name', '')
                        if isinstance(name_field, dict):
                            name = name_field.get('default', '')
                        elif isinstance(name_field, str):
                            name = name_field
                        
                        if not name:
                            firstName = player.get('firstName', {}).get('default', '') if isinstance(player.get('firstName'), dict) else player.get('firstName', '')
                            lastName = player.get('lastName', {}).get('default', '') if isinstance(player.get('lastName'), dict) else player.get('lastName', '')
                            name = f"{firstName} {lastName}".strip()
                        
                        if not name:
                            continue
                        
                        # Get position
                        position = player.get('position', '') or player.get('positionCode', '')
                        
                        # Stats are directly on the player object, not in a nested 'stats' field
                        stats = player.get('stats', {}) if player.get('stats') else player
                        
                        # Calculate Game Score
                        goals = stats.get('goals', 0) or 0
                        assists = stats.get('assists', 0) or 0
                        shots = stats.get('shots', 0) or stats.get('sog', 0) or stats.get('shotsOnGoal', 0) or 0
                        blocked_shots = stats.get('blockedShots', 0) or 0
                        pim = stats.get('pim', 0) or 0
                        plus_minus = stats.get('plusMinus', 0) or 0
                        
                        # Simplified Game Score calculation
                        game_score = (
                            0.75 * goals +
                            0.7 * assists +  # Simplified - not distinguishing primary/secondary
                            0.075 * shots +
                            0.05 * blocked_shots +
                            0.15 * (plus_minus if plus_minus > 0 else 0) -
                            0.15 * (abs(plus_minus) if plus_minus < 0 else 0)
                        )
                        
                        if player_id not in player_stats:
                            # Generate headshot URL from player ID
                            headshot_url = f"https://assets.nhle.com/mugs/nhl/20242025/{player_id}.jpg"
                            
                            player_stats[player_id] = {
                                'name': name,
                                'position': position,
                                'sweaterNumber': player.get('sweaterNumber', ''),
                                'playerId': player_id,
                                'headshot': headshot_url,
                                'total_gs': 0,
                                'games': 0,
                                'goals': 0,
                                'assists': 0,
                                'points': 0,
                                'shots': 0
                            }
                        
                        player_stats[player_id]['total_gs'] += game_score
                        player_stats[player_id]['games'] += 1
                        player_stats[player_id]['goals'] += goals
                        player_stats[player_id]['assists'] += assists
                        player_stats[player_id]['points'] += (goals + assists)
                        player_stats[player_id]['shots'] += shots
                        
            except Exception as e:
                print(f"Error processing game {game_id}: {e}")
                continue
        
        # Convert to list and calculate GS/GP
        performers = []
        for player_id, stats in player_stats.items():
            if stats['games'] > 0:
                performers.append({
                    'name': stats['name'],
                    'team': team_abbr.upper(),
                    'position': stats['position'],
                    'sweaterNumber': stats['sweaterNumber'],
                    'playerId': stats.get('playerId', player_id),
                    'headshot': stats.get('headshot', f"https://assets.nhle.com/mugs/nhl/20242025/{player_id}.jpg"),
                    'gsPerGame': stats['total_gs'] / stats['games'],
                    'goals': stats['goals'],
                    'assists': stats['assists'],
                    'points': stats['points'],
                    'shots': stats['shots']
                })
        
        # Sort by GS/GP and return top 5
        performers.sort(key=lambda x: x['gsPerGame'], reverse=True)
        return jsonify(performers[:5])
        
    except Exception as e:
        print(f"Error fetching team top performers: {e}")
        return jsonify({'error': str(e)}), 500

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
        
        # Remove any existing period_stats from prediction - we'll format it ourselves
        if 'period_stats' in prediction:
            del prediction['period_stats']
            
        # Transform the response to match frontend expectations
        # Frontend expects: advanced_metrics.xg.away_total, advanced_metrics.corsi.away, etc.
        # predict_live_game returns everything at top level (no 'live_metrics' key)
        # So live_data IS the prediction dict itself
        if 'live_metrics' in prediction:
            live_data = prediction['live_metrics']
        else:
            # predict_live_game returns everything at top level, so use prediction itself
            live_data = prediction
        
        # Initialize period_stats early to ensure it's always set
        prediction['period_stats'] = []
        
        # FORCE period_stats formatting - this MUST execute
        if live_data and isinstance(live_data, dict):
            print(f"🔍 Processing live_data for period_stats...")
            print(f"🔍 live_data keys: {list(live_data.keys())[:15]}")
            # Build the advanced_metrics structure the frontend expects
            advanced_metrics = {
                'xg': {
                    'away_total': live_data.get('away_xg', 0),
                    'home_total': live_data.get('home_xg', 0)
                },
                'corsi': {
                    'away': live_data.get('away_corsi_pct', 0),
                    'home': live_data.get('home_corsi_pct', 0)
                },
                'shot_quality': {
                    'high_danger_shots': {
                        'away': live_data.get('away_hdc', 0),
                        'home': live_data.get('home_hdc', 0)
                    },
                    'shooting_percentage': {
                        'away': (live_data.get('away_score', 0) / live_data.get('away_shots', 1) * 100) if live_data.get('away_shots', 0) > 0 else 0,
                        'home': (live_data.get('home_score', 0) / live_data.get('home_shots', 1) * 100) if live_data.get('home_shots', 0) > 0 else 0
                    }
                },
                'pressure': {
                    'oz_shots': {
                        'away': live_data.get('away_ozs', 0),
                        'home': live_data.get('home_ozs', 0)
                    },
                    'rush_shots': {
                        'away': live_data.get('away_rush', 0),
                        'home': live_data.get('home_rush', 0)
                    },
                    'sustained_pressure': {
                        'away': live_data.get('away_fc', 0),
                        'home': live_data.get('home_fc', 0)
                    }
                },
                'shots': {
                    'away': live_data.get('away_shots', 0),
                    'home': live_data.get('home_shots', 0)
                }
            }
            
            # Add advanced_metrics to the prediction response
            prediction['advanced_metrics'] = advanced_metrics
            
            # Create proper live_metrics structure for frontend
            # Frontend expects liveData.period_stats, so ensure live_metrics exists
            if 'live_metrics' not in prediction:
                prediction['live_metrics'] = {}
            
            # Copy all live metrics fields into live_metrics for frontend access
            live_metrics_fields = [
                'away_period_stats', 'home_period_stats', 'away_period_goals', 'home_period_goals',
                'away_xg_by_period', 'home_xg_by_period', 'away_zone_metrics', 'home_zone_metrics',
                'away_xg', 'home_xg', 'away_shots', 'home_shots', 'away_corsi_pct', 'home_corsi_pct',
                'away_hdc', 'home_hdc', 'away_ozs', 'home_ozs', 'away_rush', 'home_rush', 
                'away_fc', 'home_fc', 'shots_data', 'away_score', 'home_score', 'current_period',
                'time_remaining', 'away_team', 'home_team'
            ]
            for key in live_metrics_fields:
                if key in live_data:
                    prediction['live_metrics'][key] = live_data[key]
            
            # Also add shots_data if available
            if 'shots_data' in live_data:
                prediction['shots_data'] = live_data['shots_data']
            
            # Format period_stats for the frontend PeriodStatsTable component
            # Frontend expects: liveData.period_stats
            # PeriodStatsTable expects: [{ period: '1', away_stats: {...}, home_stats: {...} }, ...]
            # CRITICAL: These come from play-by-play data via _calculate_real_period_stats
            # Get period_stats from live_metrics (where we just copied them) or from live_data as fallback
            # CRITICAL: Get directly from live_data since that's where predict_live_game puts them
            away_period_stats = live_data.get('away_period_stats', {})
            home_period_stats = live_data.get('home_period_stats', {})
            
            # SIMPLE: Extract from play-by-play data and format
            if away_period_stats and home_period_stats and isinstance(away_period_stats, dict) and isinstance(home_period_stats, dict):
                print(f"✅ Formatting period_stats from play-by-play data...")
                # Get period goals
                away_period_goals = live_data.get('away_period_goals', [0, 0, 0])
                home_period_goals = live_data.get('home_period_goals', [0, 0, 0])
                
                # Get xG by period
                away_xg_by_period = live_data.get('away_xg_by_period', [0, 0, 0])
                home_xg_by_period = live_data.get('home_xg_by_period', [0, 0, 0])
                
                # Get zone metrics per period if available
                away_zone_metrics = live_data.get('away_zone_metrics', {})
                home_zone_metrics = live_data.get('home_zone_metrics', {})
                
                # Build period stats array
                period_stats_array = []
                for period_num in range(1, 4):  # Periods 1, 2, 3
                    period_idx = period_num - 1
                    
                    # Get zone metrics per period if available
                    away_ozs_period = away_zone_metrics.get('oz_originating_shots', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('oz_originating_shots', [])) else 0
                    away_dzs_period = away_zone_metrics.get('dz_originating_shots', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('dz_originating_shots', [])) else 0
                    away_nzs_period = away_zone_metrics.get('nz_originating_shots', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('nz_originating_shots', [])) else 0
                    away_nzt_period = away_zone_metrics.get('nz_turnovers', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('nz_turnovers', [])) else 0
                    away_nztsa_period = away_zone_metrics.get('nz_turnovers_to_shots', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('nz_turnovers_to_shots', [])) else 0
                    away_rush_period = away_zone_metrics.get('rush_sog', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('rush_sog', [])) else 0
                    away_fc_period = away_zone_metrics.get('fc_cycle_sog', [0, 0, 0])[period_idx] if isinstance(away_zone_metrics, dict) and period_idx < len(away_zone_metrics.get('fc_cycle_sog', [])) else 0
                    
                    home_ozs_period = home_zone_metrics.get('oz_originating_shots', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('oz_originating_shots', [])) else 0
                    home_dzs_period = home_zone_metrics.get('dz_originating_shots', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('dz_originating_shots', [])) else 0
                    home_nzs_period = home_zone_metrics.get('nz_originating_shots', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('nz_originating_shots', [])) else 0
                    home_nzt_period = home_zone_metrics.get('nz_turnovers', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('nz_turnovers', [])) else 0
                    home_nztsa_period = home_zone_metrics.get('nz_turnovers_to_shots', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('nz_turnovers_to_shots', [])) else 0
                    home_rush_period = home_zone_metrics.get('rush_sog', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('rush_sog', [])) else 0
                    home_fc_period = home_zone_metrics.get('fc_cycle_sog', [0, 0, 0])[period_idx] if isinstance(home_zone_metrics, dict) and period_idx < len(home_zone_metrics.get('fc_cycle_sog', [])) else 0
                    
                    # Get goals against (opposite team's goals for)
                    away_ga = home_period_goals[period_idx] if period_idx < len(home_period_goals) else 0
                    home_ga = away_period_goals[period_idx] if period_idx < len(away_period_goals) else 0
                    
                    # Get xG against (opposite team's xG for)
                    away_xga = home_xg_by_period[period_idx] if period_idx < len(home_xg_by_period) else 0
                    home_xga = away_xg_by_period[period_idx] if period_idx < len(away_xg_by_period) else 0
                    
                    period_stats_array.append({
                        'period': str(period_num),
                        'away_stats': {
                            'goals': away_period_goals[period_idx] if period_idx < len(away_period_goals) else 0,
                            'ga': away_ga,
                            'shots': away_period_stats.get('shots', [0, 0, 0])[period_idx] if period_idx < len(away_period_stats.get('shots', [])) else 0,
                            'corsi': away_period_stats.get('corsi_pct', [50, 50, 50])[period_idx] if period_idx < len(away_period_stats.get('corsi_pct', [])) else 50,
                            'xg': away_xg_by_period[period_idx] if period_idx < len(away_xg_by_period) else 0,
                            'xga': away_xga,
                            'hits': away_period_stats.get('hits', [0, 0, 0])[period_idx] if period_idx < len(away_period_stats.get('hits', [])) else 0,
                            'faceoff_pct': away_period_stats.get('fo_pct', [50, 50, 50])[period_idx] if period_idx < len(away_period_stats.get('fo_pct', [])) else 50,
                            'pim': away_period_stats.get('pim', [0, 0, 0])[period_idx] if period_idx < len(away_period_stats.get('pim', [])) else 0,
                            'blocked_shots': away_period_stats.get('bs', [0, 0, 0])[period_idx] if period_idx < len(away_period_stats.get('bs', [])) else 0,
                            'giveaways': away_period_stats.get('gv', [0, 0, 0])[period_idx] if period_idx < len(away_period_stats.get('gv', [])) else 0,
                            'takeaways': away_period_stats.get('tk', [0, 0, 0])[period_idx] if period_idx < len(away_period_stats.get('tk', [])) else 0,
                            'nzt': away_nzt_period,
                            'nztsa': away_nztsa_period,
                            'ozs': away_ozs_period,
                            'dzs': away_dzs_period,
                            'nzs': away_nzs_period,
                            'rush': away_rush_period,
                            'fc': away_fc_period
                        },
                        'home_stats': {
                            'goals': home_period_goals[period_idx] if period_idx < len(home_period_goals) else 0,
                            'ga': home_ga,
                            'shots': home_period_stats.get('shots', [0, 0, 0])[period_idx] if period_idx < len(home_period_stats.get('shots', [])) else 0,
                            'corsi': home_period_stats.get('corsi_pct', [50, 50, 50])[period_idx] if period_idx < len(home_period_stats.get('corsi_pct', [])) else 50,
                            'xg': home_xg_by_period[period_idx] if period_idx < len(home_xg_by_period) else 0,
                            'xga': home_xga,
                            'hits': home_period_stats.get('hits', [0, 0, 0])[period_idx] if period_idx < len(home_period_stats.get('hits', [])) else 0,
                            'faceoff_pct': home_period_stats.get('fo_pct', [50, 50, 50])[period_idx] if period_idx < len(home_period_stats.get('fo_pct', [])) else 50,
                            'pim': home_period_stats.get('pim', [0, 0, 0])[period_idx] if period_idx < len(home_period_stats.get('pim', [])) else 0,
                            'blocked_shots': home_period_stats.get('bs', [0, 0, 0])[period_idx] if period_idx < len(home_period_stats.get('bs', [])) else 0,
                            'giveaways': home_period_stats.get('gv', [0, 0, 0])[period_idx] if period_idx < len(home_period_stats.get('gv', [])) else 0,
                            'takeaways': home_period_stats.get('tk', [0, 0, 0])[period_idx] if period_idx < len(home_period_stats.get('tk', [])) else 0,
                            'nzt': home_nzt_period,
                            'nztsa': home_nztsa_period,
                            'ozs': home_ozs_period,
                            'dzs': home_dzs_period,
                            'nzs': home_nzs_period,
                            'rush': home_rush_period,
                            'fc': home_fc_period
                        }
                    })
                
                # CRITICAL: Set period_stats at top level AND in live_metrics for frontend
                prediction['period_stats'] = period_stats_array
                # Ensure live_metrics exists and set period_stats there
                if 'live_metrics' not in prediction:
                    prediction['live_metrics'] = {}
                prediction['live_metrics']['period_stats'] = period_stats_array
            else:
                print(f"⚠️ Missing period stats: away={bool(away_period_stats)}, home={bool(home_period_stats)}")
                # Still set empty array so frontend knows to show "No period stats available"
                if 'period_stats' not in prediction:
                    prediction['period_stats'] = []
        else:
            print(f"⚠️ No live_data found in prediction. Prediction keys: {list(prediction.keys()) if isinstance(prediction, dict) else 'Not a dict'}")
            prediction['period_stats'] = []
        
        # Always ensure period_stats key exists - CRITICAL for frontend
        if 'period_stats' not in prediction or prediction.get('period_stats') is None:
            prediction['period_stats'] = []
        elif not isinstance(prediction.get('period_stats'), list):
            prediction['period_stats'] = []
        
        # Ensure live_metrics.period_stats also exists for frontend
        if 'live_metrics' not in prediction:
            prediction['live_metrics'] = {}
        if 'period_stats' not in prediction['live_metrics']:
            prediction['live_metrics']['period_stats'] = prediction.get('period_stats', [])
        
        print(f"✅ Returning period_stats: length={len(prediction.get('period_stats', []))}")
        print(f"✅ live_metrics.period_stats: length={len(prediction.get('live_metrics', {}).get('period_stats', []))}")
            
        return jsonify(prediction)
    except Exception as e:
        print(f"Error in live-game endpoint: {e}")
        import traceback
        traceback.print_exc()
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
