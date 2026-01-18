# Bison Transport Job Monitor Setup Guide

## Overview
Automated email alert system that monitors Bison Transport's career site for analytics roles in **Winnipeg only**.

## What It Monitors
The script checks for these job titles:
- Logistics Analyst
- Tactical Analyst
- Sales Operations Analyst
- EDI Support Analyst
- Data Engineering
- Power BI
- Business Analyst
- Application Support Analyst
- Data Analyst
- Business Intelligence
- Analytics

**Location Filter:** Only **Winnipeg** postings will trigger alerts.

## How It Works
1. **Checks the Workday API** (hidden JSON feed that powers Bison's career page)
2. **Filters for keywords** matching analytics roles in Winnipeg
3. **Tracks alerted jobs** to avoid duplicate notifications
4. **Sends HTML email** when new matching jobs are found

## Files
- `bison_transport_monitor.py` - Main script
- `bison_alerted_jobs.json` - Tracks jobs you've been alerted about (auto-created)

## Usage

### Test Run (Manual)
```bash
cd /Users/emilyfehr8/CascadeProjects/job-finder-bot
python3 bison_transport_monitor.py
```

### Continuous Mode (Runs 24/7)
```bash
python3 bison_transport_monitor.py --continuous
```
This runs in the background and checks daily at 9 AM.

## Automation Options

### Option 1: macOS Launchd (Recommended for Mac)
Create a background service that runs daily at 9 AM.

1. Create the launchd plist file:
```bash
nano ~/Library/LaunchAgents/com.emilyfehr.bison-job-monitor.plist
```

2. Paste this content:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.emilyfehr.bison-job-monitor</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>/Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_transport_monitor.py</string>
    </array>
    
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    
    <key>StandardOutPath</key>
    <string>/Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_monitor.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_monitor_error.log</string>
    
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
```

3. Load the service:
```bash
launchctl load ~/Library/LaunchAgents/com.emilyfehr.bison-job-monitor.plist
```

4. Check if it's loaded:
```bash
launchctl list | grep bison-job-monitor
```

**To stop/unload:**
```bash
launchctl unload ~/Library/LaunchAgents/com.emilyfehr.bison-job-monitor.plist
```

### Option 2: Cron Job (Alternative)
Run daily at 9 AM using cron.

1. Edit your crontab:
```bash
crontab -e
```

2. Add this line:
```
0 9 * * * /usr/local/bin/python3 /Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_transport_monitor.py >> /Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_monitor.log 2>&1
```

### Option 3: GitHub Actions (Free Cloud Hosting)
Run the script in the cloud without keeping your computer on.

1. Create a GitHub repository for the script
2. Add your files
3. Create `.github/workflows/daily-check.yml`:

```yaml
name: Daily Bison Job Check

on:
  schedule:
    # Runs at 9 AM CST (3 PM UTC)
    - cron: '0 15 * * *'
  workflow_dispatch: # Allows manual triggering

jobs:
  check-jobs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: pip install requests
      
      - name: Run job monitor
        run: python bison_transport_monitor.py
```

4. Add your email credentials as GitHub Secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add `MY_EMAIL` and `APP_PASSWORD`
   - Update the script to use: `os.environ.get('MY_EMAIL')` and `os.environ.get('APP_PASSWORD')`

## Email Alert Example
When a matching job is found, you'll receive an HTML email with:
- Job title
- Location
- Posted date
- Direct "Apply" link

## Troubleshooting

### No alerts received?
1. Check that the script is running: `launchctl list | grep bison-job-monitor`
2. Check logs: `cat /Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_monitor.log`
3. Test email manually: `python3 bison_transport_monitor.py`

### Clear alerted jobs (to re-test):
```bash
rm /Users/emilyfehr8/CascadeProjects/job-finder-bot/bison_alerted_jobs.json
```

### Check Python path:
```bash
which python3
```
Update the launchd plist if your Python is in a different location.

## Security Note
Your Gmail app password is stored in the script. Make sure to:
- Keep the script file permissions restricted: `chmod 700 bison_transport_monitor.py`
- Never commit this to a public GitHub repository
- If using GitHub Actions, use Secrets (never hardcode passwords)

## Next Steps
1. ✅ Script is created and tested
2. Choose your automation method (launchd recommended for Mac)
3. Set it up and forget it!
4. You'll get email alerts whenever matching Winnipeg analytics jobs appear

Good luck with your job search! 🎯
