# Vantus Prototype: Local-Link Architecture

A 3-part real-time situational overwatch system demonstrating threat detection and alerting without a database.

## 🎯 Overview

Vantus is a prototype system that provides real-time threat detection and alerting for tactical operations. The system consists of three interconnected components that communicate via Socket.io for real-time event streaming.

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Mobile App    │────────▶│ Bridge Server│────────▶│   Dashboard     │
│  (React Native) │         │  (Node.js)   │         │   (Next.js)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## 📦 Components

### 1. Bridge Server (`/bridge-server`)
**Technology**: Node.js + Socket.io  
**Port**: 3001

Real-time event bridge that relays threat alerts between mobile clients and dashboard clients.

**Features**:
- Listens for `THREAT_DETECTED` events from mobile clients
- Broadcasts `DASHBOARD_ALERT` events to all connected dashboard clients
- Handles `ALERT_CLEARED` events
- Logs all events with timestamps
- Health check endpoint

### 2. Mobile App (`/vantus-app`)
**Technology**: React Native Expo  
**Platform**: iOS, Android, Web

Mobile application for threat detection with camera-based object detection.

**Features**:
- Privacy Mode (black background interface)
- Live camera feed using expo-camera
- Real-time threat detection using TensorFlow.js + COCO-SSD
- Simulated threat button for testing
- Vibration alerts on threat detection
- Socket.io client connection
- GPS simulation (Winnipeg coordinates)

### 3. Dashboard (`/vantus-dashboard`)
**Technology**: Next.js  
**Port**: 3000

High-tech tactical command dashboard for real-time threat monitoring.

**Features**:
- Tactical map view with grid overlay
- Real-time officer position markers
- Live activity feed with color-coded entries
- Visual and audio alert system
- System status indicators
- Professional tactical UI design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- For mobile app: Expo CLI or Expo Go app

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vantus
   ```

2. **Install Bridge Server dependencies**
   ```bash
   cd bridge-server
   npm install
   ```

3. **Install Dashboard dependencies**
   ```bash
   cd ../vantus-dashboard
   npm install
   ```

4. **Install Mobile App dependencies**
   ```bash
   cd ../vantus-app
   npm install
   ```

### Running the System

1. **Start Bridge Server** (Terminal 1)
   ```bash
   cd bridge-server
   npm start
   ```
   Server runs on `http://localhost:3001`

2. **Start Dashboard** (Terminal 2)
   ```bash
   cd vantus-dashboard
   npm run dev
   ```
   Dashboard available at `http://localhost:3000`

3. **Start Mobile App** (Terminal 3)
   ```bash
   cd vantus-app
   npm start
   ```
   Then:
   - Press `w` for web browser
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## 🧪 Testing

### Test Simulated Threat
1. Open the mobile app
2. Grant camera permissions
3. Tap "SIMULATED THREAT" button
4. Watch dashboard for alert

### Test Real Detection
1. Wait for detection model to load
2. Tap "START DETECTION"
3. Point camera at a cell phone
4. Alert triggers automatically when detected

## 📡 Event Flow

### Threat Detection Flow
1. Mobile app detects threat → emits `THREAT_DETECTED`
2. Bridge server receives → logs event → broadcasts `DASHBOARD_ALERT`
3. Dashboard receives → flashes red, plays sound, displays alert

### Alert Clear Flow
1. Mobile app user taps "STOP" → emits `ALERT_CLEARED`
2. Bridge server receives → logs event → broadcasts `DASHBOARD_CLEAR`
3. Dashboard receives → returns to secure state

## 🎨 Design

The dashboard features a high-tech tactical military aesthetic:
- Dark theme with safety green (#00FF41) accents
- Inter font for body text, JetBrains Mono for technical data
- Grid overlay on tactical map
- Scanline and noise effects
- Professional tactical UI elements

## 📁 Project Structure

```
vantus/
├── bridge-server/          # Socket.io bridge server
│   ├── server.js
│   ├── package.json
│   └── README.md
├── vantus-app/             # React Native mobile app
│   ├── App.js
│   ├── services/
│   │   └── detectionService.js
│   ├── package.json
│   └── README.md
├── vantus-dashboard/        # Next.js tactical dashboard
│   ├── pages/
│   │   └── index.tsx
│   ├── styles/
│   │   └── Dashboard.module.css
│   ├── package.json
│   └── README.md
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Bridge Server URL
Update in:
- `vantus-app/App.js`: `BRIDGE_SERVER_URL`
- `vantus-dashboard/pages/index.tsx`: `BRIDGE_SERVER_URL` or `NEXT_PUBLIC_BRIDGE_URL` env var

For physical devices, use your computer's local IP address instead of `localhost`.

## 🛠️ Technology Stack

- **Bridge Server**: Node.js, Express, Socket.io
- **Mobile App**: React Native, Expo, TensorFlow.js, COCO-SSD
- **Dashboard**: Next.js, TypeScript, Socket.io Client

## 📝 License

This is a prototype demonstration project.

## 🤝 Contributing

This is a prototype project. For production use, additional security, error handling, and testing would be required.

## 📧 Contact

For questions or feedback about this prototype, please refer to the project documentation.

