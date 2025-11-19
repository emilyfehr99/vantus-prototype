import json

# Load the JSON file
with open('/Users/emilyfehr8/CascadeProjects/season_2025_2026_team_stats.json', 'r') as f:
    data = json.load(f)

# Get teams
teams = data.get('teams', {})
print(f"Total teams: {len(teams)}")

# Get EDM as sample
edm = teams.get('EDM', {})
print(f"\nEDM top-level keys: {list(edm.keys())}")

# Get home stats
home = edm.get('home', {})
print(f"\nEDM home stats keys:")
for key in sorted(home.keys()):
    value = home[key]
    if isinstance(value, (int, float)):
        print(f"  {key}: {value}")
    elif isinstance(value, list):
        print(f"  {key}: list with {len(value)} items")
    else:
        print(f"  {key}: {type(value).__name__}")
