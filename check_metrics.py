import json

# Load the JSON file
with open('/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json', 'r') as f:
    data = json.load(f)

# Get teams
teams = data.get('teams', {})
edm = teams.get('EDM', {})
home = edm.get('home', {})

print("Checking which metrics have actual data (non-zero values):\n")

metrics_to_check = [
    'gs', 'xg', 'hdc', 'shots', 'goals', 'lateral', 'longitudinal',
    'ozs', 'nzs', 'fc', 'rush', 'nzt', 'nztsa', 'corsi_pct',
    'hits', 'blocked_shots', 'giveaways', 'takeaways', 'penalty_minutes',
    'power_play_pct', 'penalty_kill_pct', 'faceoff_pct'
]

for metric in metrics_to_check:
    vals = home.get(metric, [])
    if isinstance(vals, list) and len(vals) > 0:
        numeric_vals = [v for v in vals if isinstance(v, (int, float))]
        if numeric_vals:
            has_nonzero = any(v != 0 and v != 0.0 for v in numeric_vals)
            avg_val = sum(numeric_vals) / len(numeric_vals)
            status = "✓ HAS DATA" if has_nonzero else "✗ ALL ZEROS"
            print(f"{metric:20s} {status:15s} avg={avg_val:.2f} sample={numeric_vals[:3]}")
        else:
            print(f"{metric:20s} ✗ NO NUMERIC VALUES")
    else:
        print(f"{metric:20s} ✗ NOT A LIST or EMPTY")
