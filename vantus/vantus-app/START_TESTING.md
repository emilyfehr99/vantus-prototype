# Quick Start Testing Guide

## ✅ Current Status

- **Bridge Server**: ✅ Running and healthy on http://localhost:3001
- **Expo App**: Starting up...

## How to Test

### Option 1: Web Browser (Recommended)

1. **Start Expo** (if not already running):
   ```bash
   cd vantus-app
   npx expo start --web
   ```

2. **Open Browser**: 
   - Expo will show a URL like `http://localhost:19006` or `http://localhost:8081`
   - Open that URL in your browser
   - Or press `w` in the Expo terminal

3. **Grant Camera Permission**: 
   - Browser will ask for camera access
   - Click "Allow" to proceed

### Option 2: Physical Device

1. **Install Expo Go**:
   - iOS: App Store → "Expo Go"
   - Android: Play Store → "Expo Go"

2. **Start Expo**:
   ```bash
   cd vantus-app
   npx expo start
   ```

3. **Scan QR Code**: 
   - Open Expo Go app
   - Scan the QR code shown in terminal
   - **Important**: Update `BRIDGE_SERVER_URL` in `App.js` to use your computer's IP address instead of `localhost`

## Testing Steps

### Test 1: Simulated Threat ✅

1. Open the app in browser/device
2. Grant camera permission
3. Look for **"SIMULATED THREAT"** button (gray button with white border)
4. Click/Tap it
5. **Expected**:
   - Screen shows red "THREAT DETECTED" message
   - Vibration/feedback (if on device)
   - Check bridge server terminal - should see logs:
     ```
     [TIMESTAMP] THREAT_DETECTED received from [socket-id]
     [TIMESTAMP] DASHBOARD_ALERT broadcasted
     ```
6. Click/Tap **"STOP"** button to clear alert

### Test 2: Real Detection 🔍

1. **Wait for Model**:
   - Look for "Loading detection model..." message
   - Wait until it disappears or shows "Detection model ready"
   - "START DETECTION" button should become enabled (blue)

2. **Start Detection**:
   - Click/Tap **"START DETECTION"** button
   - Status should change to "Detection Active..."

3. **Point Camera**:
   - Hold a cell phone in front of camera
   - App processes frames every 2 seconds
   - Check browser console (F12) for logs

4. **When Detected**:
   - Console shows: "THREAT DETECTED! Cell phone found: [...]"
   - Alert triggers automatically
   - Same behavior as simulated threat

5. **Stop Detection**:
   - Click/Tap **"STOP DETECTION"** button

## Verify Bridge Server

Test the bridge server is working:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

**Can't see Expo URL?**
- Check terminal output for the actual URL
- Try: `http://localhost:19006` or `http://localhost:8081`
- Or press `w` in Expo terminal

**Camera not working?**
- Grant permissions when prompted
- On web: Use HTTPS or localhost (some browsers require this)
- iOS Simulator: Camera may not work - use physical device

**Model not loading?**
- Check internet connection (model downloads from CDN)
- Open browser console (F12) for errors
- Try refreshing the page

**Bridge server connection failed?**
- Verify bridge server is running: `cd bridge-server && npm start`
- Check port 3001 is accessible
- For physical devices: Update `BRIDGE_SERVER_URL` in `App.js`

## Quick Commands

```bash
# Start bridge server
cd bridge-server && npm start

# Start Expo (web)
cd vantus-app && npx expo start --web

# Start Expo (all platforms)
cd vantus-app && npx expo start

# Check bridge server health
curl http://localhost:3001/health
```

