# Vantus Bridge Server

Real-time event bridge server for the Vantus Prototype system. Relays threat alerts between mobile clients and dashboard clients using Socket.io.

## Features

- Listens for `THREAT_DETECTED` events from mobile clients
- Broadcasts `DASHBOARD_ALERT` events to all connected dashboard clients
- Handles `ALERT_CLEARED` events to clear alerts
- Logs all events with timestamps
- CORS enabled for cross-origin connections

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

The server will start on port 3001 (or the port specified in the PORT environment variable).

## Events

### From Mobile Clients:
- `THREAT_DETECTED`: Emitted when a threat is detected
  - Data: `{ officerName, location: { lat, lng }, timestamp }`

- `ALERT_CLEARED`: Emitted when alert is cleared
  - No data required

### To Dashboard Clients:
- `DASHBOARD_ALERT`: Broadcasted when a threat is detected
  - Data: Same as THREAT_DETECTED

- `DASHBOARD_CLEAR`: Broadcasted when alert is cleared
  - Data: `{}`

## Health Check

GET `/health` - Returns server status and timestamp

