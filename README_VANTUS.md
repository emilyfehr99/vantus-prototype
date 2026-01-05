# Vantus Prototype: Local-Link Architecture

A 3-part real-time situational overwatch system demonstrating threat detection and alerting without a database.

## System Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Mobile App    │────────▶│ Bridge Server│────────▶│   Dashboard     │
│  (React Native) │         │  (Node.js)   │         │   (Next.js)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Components

### 1. Bridge Server (`/bridge-server`)
- **Technology**: Node.js + Socket.io
- **Port**: 3001
- **Function**: Relays `THREAT_DETECTED` events from mobile clients to dashboard clients
- **Events**:
  - Receives: `THREAT_DETECTED`, `ALERT_CLEARED`
  - Broadcasts: `DASHBOARD_ALERT`, `DASHBOARD_CLEAR`

### 2. Mobile App (`/vantus-app`)
- **Technology**: React Native Expo
- **Features**:
  - Privacy Mode (black background)
  - Live camera feed
  - Threat detection (simplified - detects 'cell phone' as proxy)
  - Vibration alerts
  - Socket.io client connection
  - Simulated GPS: Winnipeg (49.8951, -97.1384)

### 3. Dashboard (`/vantus-dashboard`)
- **Technology**: Next.js
- **Port**: 3000
- **Features**:
  - Real-time alert display
  - Red flash animation on threat
  - Audio alert sound
  - Secure state (green) when no threats
  - Displays officer name, GPS, timestamp

## Quick Start

### Prerequisites
- Node.js 18+ installed
- For mobile app: Expo CLI (`npm install -g expo-cli`) or Expo Go app on device

### Step 1: Start Bridge Server

```bash
cd bridge-server
npm install
npm start
```

Server will run on `http://localhost:3001`

### Step 2: Start Dashboard

In a new terminal:

```bash
cd vantus-dashboard
npm install
npm run dev
```

Dashboard will be available at `http://localhost:3000`

### Step 3: Start Mobile App

In a new terminal:

```bash
cd vantus-app
npm install
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

**Note**: If using a physical device, update `BRIDGE_SERVER_URL` in `App.js` to use your computer's local IP address instead of `localhost`.

## Testing the System

1. Ensure all three components are running
2. Open the dashboard in your browser (should show green "SYSTEM SECURE")
3. In the mobile app, tap "TEST THREAT" button
4. Watch the dashboard flash red and display the alert
5. Tap "STOP" in the mobile app to clear the alert

## Configuration

### Bridge Server URL

Update the following files if your bridge server is not on `localhost:3001`:

- **Mobile App**: `vantus-app/App.js` - Update `BRIDGE_SERVER_URL`
- **Dashboard**: `vantus-dashboard/pages/index.tsx` - Update `BRIDGE_SERVER_URL` or set `NEXT_PUBLIC_BRIDGE_URL` env variable

### For Physical Devices

When running the mobile app on a physical device:
1. Find your computer's local IP address:
   - Mac/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
2. Update `BRIDGE_SERVER_URL` in `vantus-app/App.js` to use your IP:
   ```javascript
   const BRIDGE_SERVER_URL = 'http://192.168.1.XXX:3001';
   ```
3. Ensure your device and computer are on the same network

## Event Flow

1. **Threat Detected**:
   - Mobile app detects threat → emits `THREAT_DETECTED`
   - Bridge server receives → logs event → broadcasts `DASHBOARD_ALERT`
   - Dashboard receives → flashes red, plays sound, displays alert

2. **Alert Cleared**:
   - Mobile app user taps "STOP" → emits `ALERT_CLEARED`
   - Bridge server receives → logs event → broadcasts `DASHBOARD_CLEAR`
   - Dashboard receives → returns to secure (green) state

## Development Notes

- The mobile app uses a simplified detection system. In production, integrate TensorFlow.js or similar ML framework for actual object detection.
- The dashboard uses a placeholder audio URL. Replace with your own alert sound file.
- All GPS coordinates are simulated (Winnipeg, Canada).
- No database is used - all communication is real-time via Socket.io.

## Troubleshooting

**Mobile app can't connect to bridge server:**
- Check that bridge server is running
- Verify `BRIDGE_SERVER_URL` is correct
- For physical devices, use local IP instead of `localhost`
- Check firewall settings

**Dashboard not receiving alerts:**
- Verify bridge server is running and connected
- Check browser console for connection errors
- Ensure Socket.io connection is established (check bridge server logs)

**Camera not working:**
- Grant camera permissions when prompted
- On iOS simulator, camera may not work - use physical device or Android emulator

