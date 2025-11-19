#!/usr/bin/env python3
"""
Fix team stats data issues:
1. Remove duplicate game dates
2. Identify games with missing metrics
3. Report data quality issues
"""

import json
from pathlib import Path
from collections import Counter

def fix_team_stats():
    """Fix duplicate dates and report missing metrics"""
    team_stats_file = Path('season_2025_2026_team_stats.json')
    
    if not team_stats_file.exists():
        print(f"❌ File not found: {team_stats_file}")
        return
    
    print("=" * 70)
    print("FIXING TEAM STATS DATA")
    print("=" * 70)
    
    with open(team_stats_file, 'r') as f:
        team_stats = json.load(f)
    
    teams_data = team_stats.get('teams', {})
    
    # Expected NHL teams
    expected_teams = [
        'ANA', 'BOS', 'BUF', 'CGY', 'CAR', 'CHI', 'COL',
        'CBJ', 'DAL', 'DET', 'EDM', 'FLA', 'LAK', 'MIN', 'MTL',
        'NSH', 'NJD', 'NYI', 'NYR', 'OTT', 'PHI', 'PIT', 'SJS',
        'SEA', 'STL', 'TBL', 'TOR', 'UTA', 'VAN', 'VGK', 'WSH', 'WPG'
    ]
    
    total_fixed = 0
    total_removed = 0
    
    for team in expected_teams:
        if team not in teams_data:
            continue
        
        team_data = teams_data[team]
        
        for venue in ['home', 'away']:
            if venue not in team_data:
                continue
            
            venue_data = team_data[venue]
            games = venue_data.get('games', [])
            
            if not games:
                continue
            
            # Find duplicates
            game_counts = Counter(games)
            duplicates = {date: count for date, count in game_counts.items() if count > 1}
            
            if duplicates:
                print(f"\n⚠️  {team} {venue}: Found {len(duplicates)} duplicate dates")
                
                # Create mapping of date -> indices
                date_to_indices = {}
                for idx, date in enumerate(games):
                    if date not in date_to_indices:
                        date_to_indices[date] = []
                    date_to_indices[date].append(idx)
                
                # Keep only first occurrence of each date
                seen_dates = set()
                indices_to_keep = []
                indices_to_remove = []
                
                for idx, date in enumerate(games):
                    if date not in seen_dates:
                        seen_dates.add(date)
                        indices_to_keep.append(idx)
                    else:
                        indices_to_remove.append(idx)
                
                # Remove duplicates from all arrays
                # Use games array length as reference
                games_len = len(games)
                
                for key in venue_data.keys():
                    # Skip non-list fields
                    if not isinstance(venue_data[key], list):
                        continue
                    
                    original_len = len(venue_data[key])
                    
                    # Only process if array length matches games array
                    if original_len == games_len:
                        venue_data[key] = [venue_data[key][i] for i in indices_to_keep]
                        removed = original_len - len(venue_data[key])
                        if removed > 0:
                            total_removed += removed
                    # If array is shorter, pad with default values to match games length first
                    elif original_len < games_len:
                        # Pad with default values based on key type
                        if key == 'opponents':
                            # opponents is a list of strings (team abbrevs)
                            venue_data[key].extend([''] * (games_len - original_len))
                        elif key in ['period_shots', 'period_corsi_pct', 'period_pp_goals', 'period_pp_attempts',
                                     'period_pim', 'period_hits', 'period_fo_pct', 'period_blocks',
                                     'period_giveaways', 'period_takeaways', 'period_gs', 'period_xg',
                                     'period_nzt', 'period_nztsa', 'period_ozs', 'period_nzs',
                                     'period_dzs', 'period_fc', 'period_rush']:
                            # Period arrays are lists of [p1, p2, p3]
                            venue_data[key].extend([[0, 0, 0] for _ in range(games_len - original_len)])
                        else:
                            # Default numeric/boolean values
                            default_value = 0.0 if 'pct' in key or 'xg' in key.lower() or 'gs' in key.lower() else 0
                            venue_data[key].extend([default_value] * (games_len - original_len))
                        
                        # Now remove duplicates
                        venue_data[key] = [venue_data[key][i] for i in indices_to_keep]
                        removed = games_len - len(venue_data[key])
                        if removed > 0:
                            total_removed += removed
                
                print(f"   Removed {len(indices_to_remove)} duplicate entries")
                print(f"   Kept {len(indices_to_keep)} unique games")
                total_fixed += 1
    
    # Check for metric completeness
    print(f"\n" + "=" * 70)
    print("CHECKING METRIC COMPLETENESS")
    print("=" * 70)
    
    issues_summary = {}
    
    for team in expected_teams:
        if team not in teams_data:
            continue
        
        team_data = teams_data[team]
        team_issues = []
        
        for venue in ['home', 'away']:
            if venue not in team_data:
                continue
            
            venue_data = team_data[venue]
            games = venue_data.get('games', [])
            
            if not games:
                continue
            
            games_count = len(games)
            
            # Check critical metrics
            critical_metrics = {
                'xg': venue_data.get('xg', []),
                'hdc': venue_data.get('hdc', []),
                'gs': venue_data.get('gs', []),
                'power_play_pct': venue_data.get('power_play_pct', []),
            }
            
            for metric_name, metric_data in critical_metrics.items():
                if len(metric_data) != games_count:
                    team_issues.append(f"{venue}: {metric_name} count mismatch ({len(metric_data)} vs {games_count})")
                elif all(v == 0 or v == 0.0 for v in metric_data):
                    # Check if it's legitimately zero or missing data
                    if metric_name in ['xg', 'hdc', 'gs'] and games_count > 0:
                        team_issues.append(f"{venue}: {metric_name} all zeros ({games_count} games)")
            
            # Check zone metrics
            zone_metrics = {
                'nzt': venue_data.get('nzt', []),
                'nztsa': venue_data.get('nztsa', []),
                'ozs': venue_data.get('ozs', []),
            }
            
            for metric_name, metric_data in zone_metrics.items():
                if len(metric_data) != games_count:
                    team_issues.append(f"{venue}: {metric_name} count mismatch ({len(metric_data)} vs {games_count})")
        
        if team_issues:
            issues_summary[team] = team_issues
    
    if issues_summary:
        print(f"\n⚠️  Found issues in {len(issues_summary)} teams:")
        for team, issues in list(issues_summary.items())[:10]:  # Show first 10
            print(f"\n  {team}:")
            for issue in issues[:5]:  # Show first 5 issues per team
                print(f"    - {issue}")
            if len(issues) > 5:
                print(f"    ... and {len(issues) - 5} more")
    else:
        print("\n✅ No metric completeness issues found!")
    
    # Save fixed data
    if total_fixed > 0:
        print(f"\n" + "=" * 70)
        print(f"SAVING FIXED DATA")
        print("=" * 70)
        
        # Create backup
        backup_file = Path('season_2025_2026_team_stats.json.backup')
        if not backup_file.exists():
            with open(backup_file, 'w') as f:
                json.dump(team_stats, f, indent=2)
            print(f"✅ Created backup: {backup_file}")
        
        # Save fixed data
        with open(team_stats_file, 'w') as f:
            json.dump(team_stats, f, indent=2)
        
        print(f"✅ Fixed {total_fixed} teams")
        print(f"✅ Removed {total_removed} duplicate entries")
        print(f"✅ Saved fixed data to {team_stats_file}")
    else:
        print("\n✅ No duplicates found - data is clean!")
    
    # Summary statistics
    print(f"\n" + "=" * 70)
    print("SUMMARY STATISTICS")
    print("=" * 70)
    
    total_games = {}
    for team in expected_teams:
        if team in teams_data:
            home_games = len(teams_data[team].get('home', {}).get('games', []))
            away_games = len(teams_data[team].get('away', {}).get('games', []))
            total_games[team] = home_games + away_games
    
    if total_games:
        avg_games = sum(total_games.values()) / len(total_games)
        print(f"Average games per team: {avg_games:.1f}")
        print(f"Min games: {min(total_games.values())} ({min(total_games, key=total_games.get)})")
        print(f"Max games: {max(total_games.values())} ({max(total_games, key=total_games.get)})")
    
    print("\n" + "=" * 70)
    print("NOTE: Games with missing metrics (all zeros) may need to be")
    print("recalculated using recalculate_advanced_metrics.py")
    print("=" * 70)

if __name__ == "__main__":
    fix_team_stats()

