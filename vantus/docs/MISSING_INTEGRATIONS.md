# Missing Integrations - Complete List

**Status:** Backend complete, frontend integration needed

---

## 🔴 Critical Missing Integrations

### 1. Mobile App → New Features (NOT INTEGRATED)

#### ❌ Peripheral Overwatch
- **Service:** ✅ Exists on server
- **API:** ✅ `POST /api/peripheral/scan`
- **Missing:**
  - Mobile app doesn't call peripheral scan during video processing
  - No Socket.io event handler for peripheral threats
  - Not integrated into `realtimeVideoProcessor.js`

#### ❌ Kinematic Intent Prediction
- **Service:** ✅ Exists on server
- **API:** ✅ `POST /api/kinematic/predict`
- **Missing:**
  - Mobile app doesn't send movement data for prediction
  - Not called from `analyzeAndSendSignals()` in `App.js`
  - No Socket.io event for predictions

#### ❌ De-escalation Referee
- **Service:** ✅ Exists on server
- **API:** ✅ `POST /api/de-escalation/check`
- **Missing:**
  - Mobile app doesn't monitor stabilization during sessions
  - Not integrated into auto-dispatch flow
  - No Socket.io event for de-escalation status

#### ❌ Fact Anchoring
- **Service:** ✅ Exists on server
- **API:** ✅ `POST /api/facts/anchor`, `GET /api/facts/log`
- **Missing:**
  - Mobile app doesn't anchor facts from detection events
  - Not connected to movement events (flee, pursuit, etc.)
  - Not connected to use-of-force events
  - No Socket.io event for fact anchoring

#### ❌ Dictation Overlay
- **Service:** ✅ Exists on server
- **API:** ✅ `POST /api/dictation/command`
- **Missing:**
  - Mobile app doesn't process voice commands
  - No voice recognition integration
  - No wake word detection ("Vantus")
  - No command feedback to officer

---

### 2. Socket.io Events (MISSING)

#### ❌ Missing Event Handlers (Mobile → Server)
- `PERIPHERAL_SCAN_REQUEST` - Request peripheral scan
- `KINEMATIC_PREDICTION_REQUEST` - Request kinematic prediction
- `DE_ESCALATION_CHECK_REQUEST` - Request de-escalation check
- `FACT_ANCHOR` - Anchor a fact
- `DICTATION_COMMAND` - Process voice command

#### ❌ Missing Event Emissions (Server → Dashboard)
- `PERIPHERAL_THREAT` - Peripheral threat detected
- `KINEMATIC_PREDICTION` - Attack prediction
- `DE_ESCALATION_STATUS` - Stabilization status
- `FACT_ANCHORED` - Fact was anchored
- `DICTATION_COMMAND_PROCESSED` - Command was processed

---

### 3. Dashboard Integration (MISSING)

#### ❌ Missing UI Components
- **Peripheral Threat Display** - Show "six" threats and periphery
- **Kinematic Prediction Alert** - Show 500ms attack predictions
- **De-escalation Status Indicator** - Show stabilization status
- **Fact Timeline View** - Display anchored facts
- **Dictation Command Log** - Show voice commands

#### ❌ Missing Signal Type Displays
- Enhanced audio signals (multi-speaker, communication patterns)
- Coordination signals (officer proximity)
- Location signals (location type, route deviation)
- Temporal signals (time-of-day patterns)
- Correlation signals (multi-signal correlations)

---

### 4. Enhanced Services Integration (PARTIAL)

#### ⚠️ Enhanced Audio Analysis
- **Status:** Socket.io handler exists, but mobile app doesn't emit
- **Missing:** Mobile app doesn't send `ENHANCED_AUDIO_ANALYSIS` events

#### ⚠️ Location Intelligence
- **Status:** Socket.io handler exists, but mobile app doesn't emit
- **Missing:** Mobile app doesn't send `LOCATION_ANALYSIS` events on GPS updates

#### ⚠️ Coordination Analysis
- **Status:** Socket.io handler exists, but mobile app doesn't emit
- **Missing:** Mobile app doesn't send `COORDINATION_ANALYSIS` events

#### ⚠️ Signal Correlation
- **Status:** Socket.io handler exists, but mobile app doesn't emit
- **Missing:** Mobile app doesn't send `SIGNAL_CORRELATION_REQUEST` events

---

## 📋 Integration Checklist

### Mobile App (`vantus/vantus-app/App.js`)

#### Video Processing Integration
- [ ] Add peripheral overwatch scan to `realtimeVideoProcessor.js`
- [ ] Call `/api/peripheral/scan` during frame processing
- [ ] Emit `PERIPHERAL_SCAN_REQUEST` Socket.io event

#### Movement Data Integration
- [ ] Send movement data to `/api/kinematic/predict`
- [ ] Call kinematic prediction in `analyzeAndSendSignals()`
- [ ] Emit `KINEMATIC_PREDICTION_REQUEST` Socket.io event

#### De-escalation Monitoring
- [ ] Call `/api/de-escalation/check` during active sessions
- [ ] Monitor stabilization status
- [ ] Halt auto-dispatch when stabilizing
- [ ] Emit `DE_ESCALATION_CHECK_REQUEST` Socket.io event

#### Fact Anchoring
- [ ] Anchor facts from detection events
- [ ] Anchor facts from movement events (flee, pursuit)
- [ ] Anchor facts from use-of-force events
- [ ] Call `/api/facts/anchor` for each event
- [ ] Emit `FACT_ANCHOR` Socket.io event

#### Voice Commands
- [ ] Add voice recognition (expo-speech or similar)
- [ ] Detect wake word "Vantus"
- [ ] Process commands and send to `/api/dictation/command`
- [ ] Emit `DICTATION_COMMAND` Socket.io event
- [ ] Provide feedback to officer

#### Enhanced Services
- [ ] Send audio transcripts to `ENHANCED_AUDIO_ANALYSIS` event
- [ ] Send GPS updates to `LOCATION_ANALYSIS` event
- [ ] Send officer positions to `COORDINATION_ANALYSIS` event
- [ ] Send signals to `SIGNAL_CORRELATION_REQUEST` event

---

### Bridge Server (`vantus/bridge-server/server.js`)

#### Socket.io Event Handlers
- [ ] Add `PERIPHERAL_SCAN_REQUEST` handler
- [ ] Add `KINEMATIC_PREDICTION_REQUEST` handler
- [ ] Add `DE_ESCALATION_CHECK_REQUEST` handler
- [ ] Add `FACT_ANCHOR` handler
- [ ] Add `DICTATION_COMMAND` handler

#### Socket.io Event Emissions
- [ ] Emit `PERIPHERAL_THREAT` to dashboards
- [ ] Emit `KINEMATIC_PREDICTION` to dashboards
- [ ] Emit `DE_ESCALATION_STATUS` to dashboards
- [ ] Emit `FACT_ANCHORED` to dashboards
- [ ] Emit `DICTATION_COMMAND_PROCESSED` to dashboards

---

### Dashboard (`vantus/vantus-dashboard/pages/index.tsx`)

#### Socket.io Listeners
- [ ] Listen for `PERIPHERAL_THREAT` events
- [ ] Listen for `KINEMATIC_PREDICTION` events
- [ ] Listen for `DE_ESCALATION_STATUS` events
- [ ] Listen for `FACT_ANCHORED` events
- [ ] Listen for `DICTATION_COMMAND_PROCESSED` events

#### UI Components
- [ ] Add peripheral threat display component
- [ ] Add kinematic prediction alert component
- [ ] Add de-escalation status indicator
- [ ] Add fact timeline view (enhance PatternTimeline)
- [ ] Add dictation command log
- [ ] Display enhanced audio signals
- [ ] Display coordination signals
- [ ] Display location signals
- [ ] Display temporal signals
- [ ] Display correlation signals

---

## 🎯 Priority Order

### Week 1: Critical Integrations
1. **Fact Anchoring** - Most important for documentation
2. **Peripheral Overwatch** - Critical for safety
3. **De-escalation Referee** - Prevents false dispatches
4. **Socket.io Events** - Enable real-time communication

### Week 2: Enhanced Features
5. **Kinematic Prediction** - Advanced feature
6. **Dictation Overlay** - Voice commands
7. **Enhanced Services** - Audio, location, coordination
8. **Dashboard Display** - UI components

---

## 📊 Summary

**Backend Status:** ✅ 100% Complete
- All services implemented
- All API endpoints created
- All core logic functional

**Frontend Status:** ⚠️ ~30% Complete
- Mobile app: Basic integration only
- Dashboard: Basic display only
- Missing: 15+ integration points

**Estimated Work:**
- Mobile App Integration: 3-4 days
- Socket.io Events: 1 day
- Dashboard Integration: 2-3 days
- **Total: ~1 week**

---

**Next Step:** Start with fact anchoring integration (highest priority for documentation compliance)
