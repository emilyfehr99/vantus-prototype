# Vantus Officer Safety Ecosystem

A comprehensive, AI-powered tactical platform for police departments that transforms body cameras into active safety systems with real-time threat detection, automatic backup coordination, and complete supervisory oversight.

## System Overview

Vantus consists of four integrated components:

1. **Officer Portal** (Port 19006) - Mobile tactical terminal for field officers
2. **Supervisor Dashboard** (Port 3000) - Real-time oversight for watch commanders
3. **Admin Panel** (Port 3002) - System administration and configuration
4. **Bridge Server** (Port 3001) - Backend API and WebSocket coordinator

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (for Officer Portal)

### Installation

```bash
# Clone the repository
git clone https://github.com/emilyfehr99/vantus-prototype.git
cd vantus-prototype

# Install dependencies for each component
cd bridge-server && npm install && cd ..
cd vantus-dashboard && npm install && cd ..
cd vantus-admin && npm install && cd ..
cd vantus-app && npm install && cd ..
```

### Running the System

```bash
# Terminal 1: Start Bridge Server
cd bridge-server
node server.js
# Running on port 3001

# Terminal 2: Start Supervisor Dashboard
cd vantus-dashboard
npm run dev -- -p 3000
# Access at http://localhost:3000

# Terminal 3: Start Admin Panel  
cd vantus-admin
npm run dev -- -p 3002
# Access at http://localhost:3002

# Terminal 4: Start Officer Portal
cd vantus-app
npm run web
# Access at http://localhost:19006
```

## System Architecture

```
┌─────────────────┐
│ Officer Portal  │ (Mobile - React Native/Expo)
│  Port: 19006    │ - Live camera feed with AI analysis
└────────┬────────┘ - Threat detection & triage gate
         │          - Tactical map & deployment status
         │
         ▼
┌─────────────────┐
│  Bridge Server  │ (Node.js + Express + Socket.IO)
│   Port: 3001    │ - WebSocket coordinator
└────────┬────────┘ - Signal aggregation & distribution
         │          - Triage countdown orchestration
         │
         ├──────────────────┬─────────────────┐
         ▼                  ▼                 ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supervisor    │  │ Admin Panel  │  │  External    │
│   Dashboard     │  │ Port: 3002   │  │ Integrations │
│  Port: 3000     │  │              │  │              │
│                 │  │ - License    │  │ - CAD System │
│ - Live map      │  │   mgmt       │  │ - RMS        │
│ - Officer       │  │ - Policy     │  │ - Wearables  │
│   monitoring    │  │   config     │  │              │
│ - Triage veto   │  │ - Officer    │  │              │
│ - Analytics     │  │   admin      │  │              │
└─────────────────┘  └──────────────┘  └──────────────┘
```

## Key Features

### Officer Portal
- **AI Threat Detection**: Real-time analysis of body camera feeds
- **Triage Gate System**: Automatic 10-33 (backup) countdown with supervisor veto
- **Tactical Map**: Shows officer position, backup units, and cordon perimeters
- **Event Timeline**: Auto-generated incident log from detected signals
- **AI Advisor**: Real-time de-escalation recommendations

### Supervisor Dashboard
- **Live Operations**: Real-time map showing all active officers and their signals
- **Officer Status**: Complete roster with status, sessions, and GPS tracking
- **Intelligence**: Aggregated analytics with signal activity feed
- **Settings**: Notification preferences and dashboard configuration
- **Triage Oversight**: Instant alerts with one-click veto authority

### Admin Panel
- **Department Overview**: System health and license status
- **Officer Management**: Equipment tracking (battery, GPS, wearables)
- **Policy Control**: Configure AI detection thresholds
- **License Management**: Seat usage and expiration tracking
- **Integrations**: Connect CAD, RMS, and wearable devices

## Technology Stack

- **Frontend**: Next.js 14, React Native (Expo), TypeScript
- **Backend**: Node.js, Express, Socket.IO
- **Styling**: Inline CSS (for guaranteed cross-platform compatibility)
- **Real-time**: WebSocket connections for live data
- **State Management**: React hooks and context

## Design Philosophy

**Premium Dark Mode Tactical Aesthetic**:
- Deep black backgrounds (#000000)
- Neon green accents (#00FF41) for active states
- Monospace typography (JetBrains Mono) for data
- Glowing borders and pulsing animations
- Scanline effects and noise grain for tactical feel

## Documentation

See [VANTUS_SYSTEM_GUIDE.md](./VANTUS_SYSTEM_GUIDE.md) for:
- Complete feature documentation
- Sales positioning for police departments
- Technical implementation details
- Screenshots and visual examples
- Deployment instructions

## Development Notes

### Important: Styling Implementation
The Supervisor Dashboard uses **inline CSS styles** instead of Tailwind CSS to ensure reliable rendering. Tailwind was never installed in the `vantus-dashboard` project, so all grid layouts and styling use explicit inline styles.

### WebSocket Events
The Bridge Server coordinates the following real-time events:
- `CONTEXTUAL_SIGNALS_UPDATE`: AI-detected threat signals
- `TRIAGE_GATE_COUNTDOWN`: 10-33 backup countdown initiated
- `TRIAGE_GATE_UPDATE`: Countdown tick updates
- `TRIAGE_GATE_VETOED`: Supervisor override
- `LIVE_FEED_HANDOFF`: Camera stream sharing
- `LIVE_FEED_ENDED`: Stream termination

## Project Status

✅ **Production Ready** - All three portals fully implemented with:
- Premium Dark Mode UI across all platforms
- Real-time WebSocket connectivity
- Full feature parity with design specifications
- Comprehensive tab navigation
- Mobile-optimized Officer Portal
- Desktop-optimized Supervisor and Admin dashboards

## License

Proprietary - All rights reserved

## Support

For questions or support, contact the development team.

---

**Built for police departments to keep officers safe through AI-powered situational awareness and automatic backup coordination.**
