# NHL Analytics - Fast Deployment Guide (Always Running 24/7)

## Option 1: Render (Recommended - Free Tier Available)

### Why Render?
- **Always running** - No cold starts on paid plan ($7/month per service)
- **Fast** - Better performance than Vercel for full-stack apps
- **No cron jobs needed** - Services stay alive
- **Free tier** - Spins down after 15 min inactivity (but free!)

### Deploy to Render:

1. **Push code to GitHub** (if not already done):
   ```bash
   cd /Users/emilyfehr8/CascadeProjects
   git add .
   git commit -m "Add Render deployment config"
   git push origin main
   ```

2. **Create Render account**: https://render.com

3. **Deploy using render.yaml**:
   - Click "New +" → "Blueprint"
   - Connect your GitHub repo
   - Render will automatically detect `render.yaml`
   - Click "Apply" to deploy both services

4. **Upgrade to paid plan** (for always-on):
   - Go to each service → Settings → Instance Type
   - Select "Starter" ($7/month) or higher
   - This keeps services running 24/7 with no cold starts

### Environment Variables:
- Backend: Automatically configured
- Frontend: `VITE_API_URL` will point to your backend URL

---

## Option 2: Railway (Fastest, Always Running)

### Why Railway?
- **Extremely fast** - Best performance
- **Always running** - No cold starts
- **Simple pricing** - Pay for what you use (~$5-10/month)
- **Zero config** - Auto-detects everything

### Deploy to Railway:

1. **Create Railway account**: https://railway.app

2. **Deploy backend**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Deploy backend
   cd /Users/emilyfehr8/CascadeProjects
   railway init
   railway up
   ```

3. **Deploy frontend**:
   ```bash
   cd automated-post-game-reports/nhl-analytics
   railway init
   railway up
   ```

4. **Set environment variables**:
   - In Railway dashboard, add `VITE_API_URL` to frontend service
   - Point it to your backend Railway URL

---

## Option 3: DigitalOcean App Platform (Most Control)

### Why DigitalOcean?
- **Predictable pricing** - $5/month for basic apps
- **Always running** - No cold starts
- **More control** - Can scale easily

### Deploy:

1. Create DigitalOcean account
2. Go to App Platform
3. Connect GitHub repo
4. Configure:
   - Backend: Python app, start command: `gunicorn -w 4 -b 0.0.0.0:$PORT api_server:app`
   - Frontend: Static site, build: `npm run build`, output: `dist`
5. Deploy

---

## Performance Optimizations Included:

✅ **Backend caching** - Team metrics cached for 1 hour
✅ **Gunicorn** - Multi-worker production server
✅ **Static build** - Frontend optimized and minified
✅ **Health checks** - `/api/health` endpoint for monitoring

## Recommended: Render Paid Plan
**Cost**: $14/month (2 services × $7)
**Benefits**:
- Always running 24/7
- No cold starts
- Fast global CDN
- Automatic SSL
- Easy GitHub integration

## Next Steps:
1. Choose your platform (Render recommended)
2. Push code to GitHub
3. Deploy using instructions above
4. Upgrade to paid plan for 24/7 uptime
5. Your site will be live and fast!
