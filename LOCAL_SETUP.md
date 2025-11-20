# NHL Analytics - Local Development Guide

## Quick Start (Run Locally)

### Option 1: Use the Startup Script (Recommended)
```bash
cd /Users/emilyfehr8/CascadeProjects
./start_nhl_analytics.sh
```

This script will:
- ✅ Check if servers are already running
- ✅ Start backend API (port 5002)
- ✅ Start frontend dev server (port 5173)
- ✅ Verify both servers are healthy
- ✅ Show you the URLs to access

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd /Users/emilyfehr8/CascadeProjects
python3 api_server.py

# Terminal 2 - Frontend
cd /Users/emilyfehr8/CascadeProjects/automated-post-game-reports/nhl-analytics
npm run dev
```

## Access the App
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5002

## Stop the Servers
```bash
pkill -f api_server.py
pkill -f vite
```

## Auto-Start on Mac Login (Optional)

To have the servers start automatically when you log in:

1. Open **Automator** (search in Spotlight)
2. Create a new **Application**
3. Add "Run Shell Script" action
4. Paste this:
   ```bash
   /Users/emilyfehr8/CascadeProjects/start_nhl_analytics.sh
   ```
5. Save as "NHL Analytics" in Applications
6. Go to **System Settings** → **General** → **Login Items**
7. Click **+** and add "NHL Analytics"

Now the app will start automatically every time you log in!

## Troubleshooting

### Backend not responding
```bash
# Check if it's running
ps aux | grep api_server.py

# View logs
tail -f /Users/emilyfehr8/CascadeProjects/backend.log

# Restart
pkill -f api_server.py
python3 /Users/emilyfehr8/CascadeProjects/api_server.py &
```

### Frontend not responding
```bash
# Check if it's running
ps aux | grep vite

# View logs
tail -f /Users/emilyfehr8/CascadeProjects/automated-post-game-reports/nhl-analytics/frontend.log

# Restart
cd /Users/emilyfehr8/CascadeProjects/automated-post-game-reports/nhl-analytics
pkill -f vite
npm run dev &
```

### Port already in use
```bash
# Find what's using port 5002
lsof -ti:5002 | xargs kill -9

# Find what's using port 5173
lsof -ti:5173 | xargs kill -9
```

## Features Working

✅ **Game Details Page**
- Period-by-period breakdown with goals and xG
- Shot chart with interactive tooltips (hover shows shooter, shot type, xG)
- Comprehensive post-game metrics
- Live game tracking

✅ **Team Details Page**
- Full roster with player cards
- Advanced team metrics (NZS, NZTSA, HDC, HDCA, LAT, Long Movement)
- Auto-updates every 30 seconds

✅ **Today's Action**
- Live game predictions
- Real-time updates

✅ **Metrics & Standings**
- Team advanced metrics
- League leaders
- Playoff predictions

## Free Hosting (No $7/month)

Since you want to run it locally for free, the startup script is your best option. For occasional remote access, you could use:

### ngrok (Free Tier)
```bash
# Install ngrok
brew install ngrok

# Start your servers with the startup script
./start_nhl_analytics.sh

# In another terminal, expose frontend
ngrok http 5173
```

This gives you a public URL like `https://abc123.ngrok.io` that you can access from anywhere. Free tier limitations:
- URL changes each time you restart
- 40 connections/minute limit
- Good for occasional remote access

### LocalTunnel (Free, No Account)
```bash
# Install
npm install -g localtunnel

# Start servers
./start_nhl_analytics.sh

# Expose frontend
lt --port 5173
```

Gets you a public URL instantly, no signup required!
