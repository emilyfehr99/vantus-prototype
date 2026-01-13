# Vantus App Testing Guide

## Current Status

✅ **Dependencies Installed**: All npm packages have been installed successfully
✅ **Expo Server Running**: Development server is running in the background
✅ **Bridge Server Running**: Socket.io bridge server is running on port 3001

## How to Access the App

The Expo development server should be running. You can access the app in several ways:

1. **Web Browser** (Easiest for testing):
   - Open your browser and go to the URL shown in the Expo output (usually `http://localhost:8081`)
   - Or press `w` in the terminal where Expo is running

2. **iOS Simulator**:
   - Press `i` in the terminal where Expo is running
   - Requires Xcode to be installed

3. **Android Emulator**:
   - Press `a` in the terminal where Expo is running
   - Requires Android Studio to be installed

4. **Physical Device**:
   - Install "Expo Go" app from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in the terminal
   - Make sure your device and computer are on the same network

## Testing Steps

### Prerequisites
- Bridge server should be running on `http://localhost:3001`
- If testing on a physical device, update `BRIDGE_SERVER_URL` in `App.js` to use your computer's local IP address

### Test 1: Simulated Threat Detection

1. **Open the app** in your chosen platform (web browser recommended for quick testing)

2. **Grant camera permissions** when prompted (required even for simulated mode)

3. **Look for the "SIMULATED THREAT" button** on the screen

4. **Tap/Click the "SIMULATED THREAT" button**

5. **Expected Results**:
   - Screen should show "THREAT DETECTED" in red
   - Device should vibrate (if on physical device) or show vibration feedback
   - Check bridge server terminal - you should see:
     ```
     [TIMESTAMP] THREAT_DETECTED received from [socket-id]
     [TIMESTAMP] DASHBOARD_ALERT broadcasted to all connected clients
     ```
   - If dashboard is open, it should flash red and show the alert

6. **Tap/Click "STOP" button** to clear the alert

### Test 2: Real Camera Detection

1. **Wait for model to load**:
   - You should see "Loading detection model..." indicator
   - Wait until it says "Detection model ready" or the loading indicator disappears
   - The "START DETECTION" button should become enabled (not grayed out)

2. **Start detection**:
   - Tap/Click "START DETECTION" button
   - Status should change to "Detection Active..."

3. **Point camera at a cell phone**:
   - Hold a cell phone in front of the camera
   - The app will capture frames every 2 seconds
   - Check console/logs for detection messages

4. **Expected Results**:
   - When a cell phone is detected:
     - Console should show: "THREAT DETECTED! Cell phone found: [...]"
     - Alert should trigger (same as simulated threat)
     - Bridge server should receive the alert
   - If no cell phone detected:
     - Console shows: "No threat detected. Objects found: X"

5. **Stop detection**:
   - Tap/Click "STOP DETECTION" button
   - Detection loop will stop

## Troubleshooting

### Model Not Loading
- **Issue**: "Detection model not available" message
- **Solution**: 
  - Ensure you have internet connection (model downloads from CDN)
  - Check browser/device console for errors
  - Try refreshing the app
  - For web: Open browser developer console (F12) to see detailed errors

### Camera Not Working
- **Issue**: Camera permission denied or camera not showing
- **Solution**:
  - Grant camera permissions when prompted
  - On iOS simulator, camera may not work - use physical device or Android emulator
  - On web, ensure you're using HTTPS or localhost (some browsers require this)

### Bridge Server Connection Failed
- **Issue**: "Not connected to bridge server" alert
- **Solution**:
  - Verify bridge server is running: `cd bridge-server && npm start`
  - Check that port 3001 is not blocked by firewall
  - For physical devices, update `BRIDGE_SERVER_URL` to use your computer's IP address
  - Example: `const BRIDGE_SERVER_URL = 'http://192.168.1.XXX:3001';`

### Detection Not Triggering
- **Issue**: Camera running but no detections
- **Solution**:
  - Ensure model has finished loading (button should be enabled)
  - Point camera at a clear, well-lit cell phone
  - Check console for detection logs
  - Try simulated threat first to verify alert system works
  - Detection runs every 2 seconds - be patient

## Console Logs to Watch For

**Successful Model Load**:
```
Initializing TensorFlow.js...
TensorFlow.js ready
Loading COCO-SSD model...
COCO-SSD model loaded successfully
Detection model ready
```

**Successful Detection**:
```
Processing frame for detection...
THREAT_DETECTED! Cell phone found: [...]
```

**Connection Status**:
```
Connected to bridge server
THREAT_DETECTED emitted: {...}
```

## Next Steps

After testing:
1. If everything works, you can integrate with the dashboard
2. To improve detection accuracy, you can:
   - Adjust `MIN_CONFIDENCE` in `detectionService.js`
   - Change detection interval in `App.js` (currently 2000ms)
   - Use a custom trained model for better weapon detection

