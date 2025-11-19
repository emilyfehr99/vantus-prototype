# Discord Notification Information

## 📋 Overview

Your NHL prediction system sends daily Discord notifications with game predictions. There are two main implementations:

1. **`discord_notifier.py`** - Standalone Discord notification script
2. **`prediction_interface.py`** - Integrated Discord notification in the main prediction workflow

---

## 🔗 Discord Webhook URL

**Webhook URL:** `https://discord.com/api/webhooks/1417616260958785667/2QvzAvVoVnU3gY-_xYwTWwMsiBM4osXmI9n46n40wA5ZIVJEUyxGB-FxZ_Zx_DMF1EaT`

**Location:**
- Hardcoded in `discord_notifier.py` (line 12)
- Set as GitHub Secret `DISCORD_WEBHOOK_URL` for the workflow

---

## 📁 Files Involved

### Main Notification Files

1. **`/Users/emilyfehr8/CascadeProjects/discord_notifier.py`**
   - Standalone script for sending Discord notifications
   - Loads predictions from `win_probability_predictions_v2.json`
   - Formats predictions as Discord embeds
   - Can be run independently: `python3 discord_notifier.py`

2. **`/Users/emilyfehr8/CascadeProjects/prediction_interface.py`**
   - Main prediction interface with integrated Discord notification
   - Method: `send_discord_notification()` (lines 930-1027)
   - Uses environment variable `DISCORD_WEBHOOK_URL`
   - Called automatically in `main()` function

3. **`/Users/emilyfehr8/CascadeProjects/.github/workflows/daily-nhl-predictions.yml`**
   - GitHub Actions workflow that runs daily at 6 AM CT
   - Sets `DISCORD_WEBHOOK_URL` from GitHub Secrets (line 70)
   - Runs `prediction_interface.py` which sends Discord notifications

### Test Files

- `test_discord_webhook.py` - Test script to find Discord channel
- `test_discord_now.py` - Quick test notification
- `test_discord_notification.py` - Full test notification

---

## 🔄 How It Works

### Daily Workflow (GitHub Actions)

1. **Schedule:** Runs daily at 6:00 AM Central Time (12:00 UTC)
2. **Steps:**
   - Scrapes NHL Edge data
   - Runs `prediction_interface.py` to generate predictions
   - `prediction_interface.py` automatically sends Discord notification
   - Commits updated predictions to repository

### Notification Format

**From `prediction_interface.py`:**

```
🏒 **DAILY NHL PREDICTIONS** 🏒

**1. AWY @ HOM**
🎯 AWY 48.4% | HOM 51.6%
⭐ Favorite: HOM (+3.1%)
⚠️ Upset Risk: 15.2%

📊 **Model Performance:**
• Total Games: 342
• Accuracy: 58.0%
• Recent Accuracy: 43.3%

🤖 *Powered by Self-Learning AI Model*
```

**Discord Embed Includes:**
- Title: "🏒 Daily NHL Predictions"
- Date field
- Number of games field
- Model accuracy field
- Footer: "Self-Learning AI Model • Updated Daily"

### From `discord_notifier.py`:

- Creates individual embeds for each game (up to 10 games)
- Each embed shows:
  - Game matchup (Away @ Home)
  - Win probabilities
  - Favorite team highlighted
  - Confidence level (high/medium/low)
  - Game time
  - Color-coded (cyan for away favorite, magenta for home favorite)

---

## 🔧 Configuration

### Environment Variable

The workflow uses GitHub Secrets:
- **Secret Name:** `DISCORD_WEBHOOK_URL`
- **Value:** Your Discord webhook URL

### To Update Webhook URL:

1. **For GitHub Actions:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Update `DISCORD_WEBHOOK_URL` secret

2. **For local testing (`discord_notifier.py`):**
   - Edit line 12 in `discord_notifier.py`
   - Or set environment variable: `export DISCORD_WEBHOOK_URL="your_url"`

---

## 📊 What Gets Sent

### Included Information:

1. **Game Predictions:**
   - Away team vs Home team
   - Win probabilities (percentages)
   - Favorite team and spread
   - Upset probability (if available)

2. **Model Performance:**
   - Total games predicted
   - Overall accuracy
   - Recent accuracy (last N games)

3. **Metadata:**
   - Date
   - Number of games
   - Timestamp

---

## 🧪 Testing

### Test Discord Notification:

```bash
# Test standalone notifier
python3 discord_notifier.py

# Test via prediction interface
python3 prediction_interface.py

# Quick test
python3 test_discord_now.py
```

### Manual Trigger:

The GitHub Actions workflow can be manually triggered:
- Go to GitHub → Actions → "Daily NHL Predictions with Edge Data"
- Click "Run workflow"

---

## 📝 Notification Flow

```
GitHub Actions (6 AM CT)
    ↓
Scrape Edge Data
    ↓
Run prediction_interface.py
    ↓
Generate Predictions
    ↓
send_discord_notification()
    ↓
Format Message + Embed
    ↓
POST to Discord Webhook
    ↓
Discord Channel
```

---

## ⚠️ Important Notes

1. **Webhook Security:**
   - The webhook URL is sensitive - don't commit it to public repos
   - Currently hardcoded in `discord_notifier.py` (should use env var)

2. **Rate Limits:**
   - Discord webhooks have rate limits
   - Current implementation sends one message per day (well within limits)

3. **Message Limits:**
   - Discord message content: 2000 characters max
   - Embeds: 10 per message max
   - `discord_notifier.py` limits to 10 games

4. **Error Handling:**
   - Both implementations check for webhook URL
   - Handle HTTP errors (status codes)
   - Log errors but don't crash workflow

---

## 🔍 Troubleshooting

### Notification Not Received:

1. Check GitHub Actions logs for errors
2. Verify `DISCORD_WEBHOOK_URL` secret is set correctly
3. Test webhook URL manually:
   ```bash
   python3 test_discord_now.py
   ```
4. Check Discord server settings (webhook might be disabled)

### Wrong Format:

- Check which script is being used (`discord_notifier.py` vs `prediction_interface.py`)
- Verify prediction data structure matches expected format

### Missing Games:

- Check if games exist for today's date
- Verify predictions were generated successfully
- Check logs for filtering logic

---

## 📅 Schedule

- **Daily at 6:00 AM Central Time**
- Cron: `0 12 * * *` (UTC)
- Can be manually triggered via GitHub Actions UI

---

## 🔗 Related Files

- `/Users/emilyfehr8/CascadeProjects/discord_notifier.py`
- `/Users/emilyfehr8/CascadeProjects/prediction_interface.py` (lines 930-1027)
- `/Users/emilyfehr8/CascadeProjects/.github/workflows/daily-nhl-predictions.yml`
- `/Users/emilyfehr8/CascadeProjects/test_discord_webhook.py`
- `/Users/emilyfehr8/CascadeProjects/test_discord_now.py`

