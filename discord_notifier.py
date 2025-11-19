"""
Discord Notification Service for NHL Predictions
Sends formatted game predictions to Discord webhook
"""

import os
import requests
import json
from datetime import datetime

# Discord webhook URL
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1417616260958785667/2QvzAvVoVnU3gY-_xYwTWwMsiBM4osXmI9n46n40wA5ZIVJEUyxGB-FxZ_Zx_DMF1EaT"

def load_predictions():
    """Load today's predictions from JSON file"""
    try:
        with open('/Users/emilyfehr8/CascadeProjects/win_probability_predictions_v2.json', 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        print("❌ Predictions file not found")
        return None
    except json.JSONDecodeError:
        print("❌ Invalid JSON in predictions file")
        return None

def format_prediction_embed(game):
    """Format a single game prediction as Discord embed"""
    away_team = game.get('away_team', 'TBD')
    home_team = game.get('home_team', 'TBD')
    away_prob = game.get('away_win_prob', 0) * 100
    home_prob = game.get('home_win_prob', 0) * 100
    confidence = game.get('confidence', 'medium')
    game_time = game.get('start_time', 'TBD')
    
    # Determine favorite
    if away_prob > home_prob:
        favorite = f"**{away_team}** ({away_prob:.1f}%)"
        underdog = f"{home_team} ({home_prob:.1f}%)"
        color = 0x00D9FF  # Cyan for away
    else:
        favorite = f"**{home_team}** ({home_prob:.1f}%)"
        underdog = f"{away_team} ({away_prob:.1f}%)"
        color = 0xFF00D9  # Magenta for home
    
    # Confidence emoji
    confidence_emoji = {
        'high': '🔥',
        'medium': '⚡',
        'low': '💭'
    }.get(confidence, '⚡')
    
    embed = {
        "title": f"{away_team} @ {home_team}",
        "description": f"**Prediction:** {favorite}\n**Underdog:** {underdog}\n\n{confidence_emoji} Confidence: {confidence.upper()}",
        "color": color,
        "fields": [
            {
                "name": "Game Time",
                "value": game_time,
                "inline": True
            },
            {
                "name": "Win Probabilities",
                "value": f"{away_team}: {away_prob:.1f}%\n{home_team}: {home_prob:.1f}%",
                "inline": True
            }
        ],
        "footer": {
            "text": "NHL Prediction Model v2 | Powered by Advanced Analytics"
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return embed

def send_discord_notification(predictions):
    """Send predictions to Discord"""
    if not DISCORD_WEBHOOK_URL:
        print("❌ Discord webhook URL not configured")
        return False
    
    if not predictions:
        print("ℹ️  No predictions to send")
        return False
    
    # Get today's date
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Filter predictions for today
    today_games = []
    if isinstance(predictions, dict):
        # Handle different prediction file structures
        if 'predictions' in predictions:
            today_games = [p for p in predictions['predictions'] if p.get('date') == today]
        elif 'games' in predictions:
            today_games = [p for p in predictions['games'] if p.get('date') == today]
        else:
            # Assume it's a flat dict of games
            today_games = [v for k, v in predictions.items() if isinstance(v, dict) and v.get('date') == today]
    elif isinstance(predictions, list):
        today_games = [p for p in predictions if p.get('date') == today]
    
    if not today_games:
        print(f"ℹ️  No games found for {today}")
        return False
    
    # Create embeds for each game
    embeds = [format_prediction_embed(game) for game in today_games[:10]]  # Limit to 10 games
    
    # Discord webhook payload
    payload = {
        "content": f"🏒 **NHL Game Predictions for {today}**\n{len(today_games)} games today",
        "embeds": embeds,
        "username": "NHL Prediction Bot",
        "avatar_url": "https://cdn-icons-png.flaticon.com/512/33/33736.png"
    }
    
    try:
        print(f"📤 Sending {len(today_games)} predictions to Discord...")
        response = requests.post(DISCORD_WEBHOOK_URL, json=payload)
        
        if response.status_code == 204:
            print("✅ Discord notification sent successfully!")
            return True
        else:
            print(f"❌ Discord notification failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error sending Discord notification: {e}")
        return False

def main():
    """Main function to send today's predictions"""
    print("🏒 NHL Discord Prediction Notifier")
    print("=" * 50)
    
    # Load predictions
    predictions = load_predictions()
    
    if not predictions:
        print("❌ Failed to load predictions")
        return
    
    # Send to Discord
    success = send_discord_notification(predictions)
    
    if success:
        print("\n✅ Predictions sent to Discord!")
        print("   Check your Discord channel for the notification")
    else:
        print("\n❌ Failed to send predictions")

if __name__ == "__main__":
    main()
