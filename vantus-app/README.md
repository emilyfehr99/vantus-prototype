# Vantus Mobile App

React Native Expo app for threat detection and alerting. Features privacy mode with black background and real-time threat detection using TensorFlow.js and COCO-SSD.

## Features

- **Privacy Mode**: Black background interface
- **Live Camera Feed**: Background camera monitoring using expo-camera
- **Real-time Threat Detection**: Uses TensorFlow.js with COCO-SSD pre-trained model to detect 'cell phone' objects
- **Simulated Threat Button**: Manual button to test threat detection without camera
- **Vibration Alert**: Loud vibration when threat is detected
- **Real-time Communication**: Socket.io client connects to Bridge Server
- **GPS Simulation**: Hardcoded Winnipeg coordinates (49.8951, -97.1384)
- **Stop Button**: Clear alerts manually

## Installation

```bash
npm install
```

## Configuration

Update the `BRIDGE_SERVER_URL` in `App.js` to match your bridge server address:

```javascript
const BRIDGE_SERVER_URL = 'http://localhost:3001';
```

For physical devices, use your computer's local IP address instead of `localhost`.

## Running

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on physical device

## Threat Detection

### Simulated Threat Mode
- Tap "SIMULATED THREAT" button to manually trigger a threat alert
- Useful for testing the alert system without camera detection

### Real Camera Detection
- Tap "START DETECTION" to begin continuous camera monitoring
- The app uses TensorFlow.js with COCO-SSD model to detect objects
- Specifically looks for 'cell phone' class (class 67 in COCO dataset)
- Detection runs every 2 seconds when active
- When a cell phone is detected with confidence > 0.5, an alert is triggered

### Detection Model
- **Model**: COCO-SSD (MobileNet v2 base)
- **Target Class**: Cell phone (used as proxy for weapon detection)
- **Confidence Threshold**: 0.5 (50%)
- **Detection Interval**: 2 seconds

**Note**: The detection model loads on app startup. You'll see a loading indicator while the model initializes. The model works best in web mode (Expo web). For native iOS/Android, additional TensorFlow.js React Native setup may be required.

## Events

- **THREAT_DETECTED**: Emitted to bridge server when threat is detected
  - Data: `{ officerName, location: { lat, lng }, timestamp }`

- **ALERT_CLEARED**: Emitted when alert is manually cleared

## Troubleshooting

**Model not loading:**
- Ensure you have internet connection (model downloads from CDN)
- Check console for error messages
- Try running in web mode first: `npm start` then press `w`

**Detection not working:**
- Make sure camera permissions are granted
- Ensure model has finished loading (check for "Detection model ready" in console)
- Try simulated threat button first to verify alert system works
- Check that "START DETECTION" button is enabled (not grayed out)

**Camera issues:**
- Grant camera permissions when prompted
- On iOS simulator, camera may not work - use physical device or Android emulator

