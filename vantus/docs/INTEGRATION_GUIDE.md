# Integration Guide - Connecting New Features

**Purpose:** Step-by-step guide to integrate all new features into the system

---

## Quick Start

1. **Bridge Server**: Copy code from `server-integration.js` into `server.js`
2. **Mobile App**: Add service calls in signal generation flow
3. **Dashboard**: Import and add PatternTimeline component

---

## Detailed Integration Steps

### Step 1: Bridge Server Integration

#### 1.1 Add Service Imports
Add to top of `vantus/bridge-server/server.js`:

```javascript
const enhancedAudioAnalysis = require('./services/enhancedAudioAnalysis');
const coordinationAnalysis = require('./services/coordinationAnalysis');
const locationIntelligence = require('./services/locationIntelligence');
const temporalAnalysis = require('./services/temporalAnalysis');
const signalCorrelation = require('./services/signalCorrelation');
const videoBatchProcessor = require('./services/videoBatchProcessor');
const integrationFramework = require('./services/integrationFramework');
const trainingMode = require('./services/trainingMode');
const patternLearning = require('./services/patternLearning');
```

#### 1.2 Initialize Services
Add after existing service initialization (around line 88):

```javascript
// Enhanced Audio Analysis
enhancedAudioAnalysis.initialize(null); // or pass LLM service if available
logger.info('Enhanced Audio Analysis initialized');

// Integration Framework
if (process.env.CAD_API_URL) {
  integrationFramework.initializeCAD({
    apiUrl: process.env.CAD_API_URL,
    apiKey: process.env.CAD_API_KEY,
  });
}
```

#### 1.3 Add API Endpoints
Copy all endpoints from `server-integration.js` section 3 into `server.js` after existing endpoints.

#### 1.4 Add Socket.io Events
Copy all socket handlers from `server-integration.js` section 4 into the socket connection handler.

---

### Step 2: Mobile App Integration

#### 2.1 Enhanced Audio Analysis
In `vantus/vantus-app/App.js`, in the `analyzeAndSendSignals` function, add:

```javascript
// Enhanced audio analysis
if (audioTranscripts && audioTranscripts.length > 0) {
  const latestTranscript = audioTranscripts[audioTranscripts.length - 1].transcript;
  
  // Send to bridge server for enhanced analysis
  socket.emit('ENHANCED_AUDIO_ANALYSIS', {
    officerName: getOfficerId(badgeNumber),
    transcript: latestTranscript,
    options: {},
  });
}
```

#### 2.2 Location Intelligence
In GPS position update handler, add:

```javascript
// Location classification
if (currentLocation) {
  socket.emit('LOCATION_ANALYSIS', {
    officerName: getOfficerId(badgeNumber),
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    options: {},
  });
}
```

#### 2.3 Coordination Analysis
When receiving other officer positions, add:

```javascript
// Get all officer positions from bridge server
const otherOfficers = await fetch(`${BRIDGE_SERVER_URL}/api/officers`)
  .then(res => res.json())
  .then(data => data.officers.filter(o => o.officerName !== getOfficerId(badgeNumber)));

socket.emit('COORDINATION_ANALYSIS', {
  officerName: getOfficerId(badgeNumber),
  lat: currentLocation.lat,
  lng: currentLocation.lng,
  otherOfficers: otherOfficers.map(o => ({
    name: o.officerName,
    lat: o.location?.lat,
    lng: o.location?.lng,
    timestamp: o.lastContact,
  })),
});
```

---

### Step 3: Dashboard Integration

#### 3.1 Add PatternTimeline Component
In `vantus/vantus-dashboard/pages/index.tsx`:

```tsx
import PatternTimeline from '../components/PatternTimeline';

// In the render, add after signals panel:
{selectedOfficerData && (
  <div className={styles.timelineSection}>
    <PatternTimeline 
      signals={selectedOfficerData.signals} 
      officerName={selectedOfficerData.officerName}
    />
  </div>
)}
```

#### 3.2 Listen for New Signal Types
Add socket listeners:

```tsx
// Enhanced audio signals
newSocket.on('ENHANCED_AUDIO_SIGNAL', (data) => {
  // Add to officer signals
  setOfficers(prev => {
    const updated = new Map(prev);
    const officer = updated.get(data.officerName);
    if (officer) {
      officer.signals.push({
        signalType: data.signalType,
        signalCategory: data.signal.category,
        probability: data.signal.confidence,
        timestamp: data.timestamp,
        explanation: {
          description: data.signal.description,
          originData: data.signal,
          traceability: { source: 'enhanced_audio' },
        },
      });
    }
    return updated;
  });
});

// Add similar listeners for:
// - COORDINATION_SIGNAL
// - LOCATION_SIGNAL
// - SIGNAL_CORRELATION
```

---

## Testing Checklist

After integration:

- [ ] Bridge server starts without errors
- [ ] All services initialize correctly
- [ ] API endpoints respond correctly
- [ ] Socket.io events work
- [ ] Mobile app sends new signals
- [ ] Dashboard displays new signals
- [ ] PatternTimeline component renders
- [ ] No console errors

---

## Environment Variables

Add to `.env`:

```bash
# Enhanced Audio (optional - uses local analysis if not set)
LLM_PROVIDER=ollama
LLM_API_KEY=dummy
LLM_API_URL=http://localhost:11434/v1/chat/completions

# CAD Integration (optional)
CAD_API_URL=https://cad.example.com/api
CAD_API_KEY=your-cad-key

# Wearable Integration (optional)
WEARABLE_API_URL=https://wearable.example.com/api
WEARABLE_API_KEY=your-wearable-key
```

---

## Troubleshooting

### Services not initializing
- Check service files exist in `bridge-server/services/`
- Check for syntax errors in service files
- Check logger output for initialization messages

### API endpoints not working
- Verify endpoints are added to `server.js`
- Check route order (more specific routes first)
- Test with curl or Postman

### Socket.io events not firing
- Verify socket handlers are in connection handler
- Check event names match between client and server
- Check socket connection status

### Dashboard not showing signals
- Verify socket listeners are added
- Check signal data structure matches expected format
- Check browser console for errors

---

## Next Steps After Integration

1. Test with real data
2. Monitor performance
3. Adjust thresholds based on feedback
4. Add UI polish
5. Update documentation
