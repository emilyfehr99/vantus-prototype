# Vantus Lieutenant Dashboard

High-tech tactical command dashboard for real-time threat monitoring. Features a tactical map with officer tracking and a live activity feed.

## Features

- **Tactical Map View**: 
  - Grid overlay for tactical reference
  - Real-time officer position markers
  - GPS coordinate display
  - Alert visualization with pulsing markers
  - Operations center marker

- **Live Activity Feed**:
  - Real-time event stream
  - Color-coded entries (Alerts, Clears, Status)
  - Timestamped entries
  - Officer location details
  - System statistics

- **Real-time Alerts**:
  - Visual alert overlays on map
  - Audio alerts
  - Pulsing markers for threats
  - Critical alert banner

- **System Status**:
  - Connection status indicator
  - System time display
  - Active officer count
  - Alert statistics

## Design

The dashboard features a high-tech tactical military aesthetic:
- Dark theme with green terminal colors (#00ff00)
- Monospace font (Courier New) for technical feel
- Grid overlay on map
- Pulsing animations for active elements
- Professional tactical UI elements

## Installation

```bash
npm install
```

## Configuration

Set the bridge server URL via environment variable or update the default in `pages/index.tsx`:

```bash
NEXT_PUBLIC_BRIDGE_URL=http://localhost:3001 npm run dev
```

Or create a `.env.local` file:
```
NEXT_PUBLIC_BRIDGE_URL=http://localhost:3001
```

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Layout

### Left Side: Tactical Map
- Full-screen tactical map with grid overlay
- Officer markers with pulsing indicators
- Alert markers flash red when threat detected
- GPS coordinates displayed in bottom-left
- Operations center marker at map center

### Right Side: Activity Feed
- Live scrolling feed of all events
- Color-coded by type:
  - 🚨 **Red**: Critical alerts
  - ✅ **Green**: Alert clears
  - ℹ️ **Blue**: Status updates
- Statistics footer showing:
  - Active officers
  - Alerts today
  - System status

### Header
- System title: "VANTUS TACTICAL COMMAND"
- Connection status (ONLINE/OFFLINE)
- System time
- Alert banner (shows "CRITICAL ALERT ACTIVE" or "SYSTEM SECURE")

## Events

### Received from Bridge Server:
- **DASHBOARD_ALERT**: Triggers map alert, adds to feed, plays sound
  - Data: `{ officerName, location: { lat, lng }, timestamp }`

- **DASHBOARD_CLEAR**: Clears alert, updates feed
  - Data: `{}`

## Map Features

- **Grid Overlay**: Tactical grid for reference
- **Officer Markers**: Show all active officers on map
- **Alert Visualization**: 
  - Red pulsing markers for officers in alert
  - Alert overlay with threat information
  - Ripple effects on alert markers
- **GPS Display**: Shows current threat location or default operations center

## Feed Features

- **Real-time Updates**: Newest entries appear at top
- **Entry Types**:
  - Alert entries (red border)
  - Clear entries (green border)
  - Status entries (blue border)
- **Details**: Each entry shows timestamp, type, message, and officer info
- **Auto-scroll**: Feed automatically scrolls to show latest entries
- **History**: Keeps last 50 entries

## Alert Sound

The dashboard uses a placeholder audio URL. Replace the `src` in `pages/index.tsx` with your own high-intensity alert sound:

```tsx
<audio
  ref={audioRef}
  src="YOUR_ALERT_SOUND_URL.mp3"
  loop
  preload="auto"
>
```

## Responsive Design

The dashboard is responsive:
- Desktop: Map on left, feed on right (400px)
- Tablet: Same layout, smaller feed (350px)
- Mobile: Stacked layout, feed below map

## Customization

### Colors
Edit `Dashboard.module.css` to customize:
- Primary color: `#00ff00` (green)
- Alert color: `#ff0000` (red)
- Background: `#0a0a0a` / `#000`

### Map Projection
The map uses a simple projection for the Winnipeg area. To adjust:
- Edit `getMapPosition()` function in `pages/index.tsx`
- Modify base coordinates and scale factors

### Feed Size
Adjust feed panel width in `Dashboard.module.css`:
```css
.feedPanel {
  width: 400px; /* Change this */
}
```
