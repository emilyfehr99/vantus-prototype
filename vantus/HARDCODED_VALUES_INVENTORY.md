# Hardcoded Values Inventory - Complete List

**Purpose:** Complete inventory of every hardcoded value, demo data, and placeholder that must be replaced for Client #1

---

## 🔴 AUTHENTICATION & IDENTITY

### Demo Badge Numbers
**File:** `vantus-app/components/AuthenticationScreen.js`  
**Line:** 52  
**Current:**
```javascript
const validBadges = ['12345', '67890', '11111', '22222']; // Demo badges
```
**Action:** Replace with department roster API call

---

### Officer ID Format
**Files:** Multiple (15+ instances)  
**Pattern:** `OFFICER_${badgeNumber}`  
**Locations:**
- `vantus-app/App.js` - Lines 215, 250, 279, 339, 375, 414, 431, 458, 490, 539, 590, 618
- `vantus-app/services/telemetryService.js` - Line 32
- `vantus-app/services/baselineCalibration.js` - Multiple
- `vantus-app/services/baselineRelativeSignals.js` - Multiple
- `vantus-app/services/multiModelDetection.js` - Multiple
- `bridge-server/server.js` - Multiple

**Action:** Replace with client format (e.g., `WVPS-${badgeNumber}`)

---

### Officer Metadata (null values)
**Files:** Multiple  
**Current:**
```javascript
name: null, // Would come from roster
unit: null, // Would come from roster
```
**Locations:**
- `vantus-app/App.js` - Lines 232, 280
- `vantus-app/services/autoDispatch.js` - Lines 245-246
- `vantus-app/services/welfareCheck.js` - Lines 154-155

**Action:** Get from roster API and populate

---

## 🔴 CONFIGURATION & ENVIRONMENT

### Bridge Server URL (localhost)
**File:** `vantus-app/App.js`  
**Line:** 23  
**Current:**
```javascript
const BRIDGE_SERVER_URL = 'http://localhost:3001';
```
**Action:** Replace with production URL

---

**File:** `vantus-dashboard/pages/index.tsx`  
**Line:** 6  
**Current:**
```javascript
const BRIDGE_SERVER_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001';
```
**Action:** Set environment variable or replace default

---

**File:** `vantus-admin/components/AnalyticsDashboard.tsx`  
**Line:** 5  
**Current:**
```javascript
const BRIDGE_SERVER_URL = process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001';
```
**Action:** Set environment variable or replace default

---

### GPS Coordinates (Winnipeg)
**File:** `vantus-app/App.js`  
**Line:** 26  
**Current:**
```javascript
const SIMULATED_GPS = { lat: 49.8951, lng: -97.1384 };
```
**Action:** Replace with client's jurisdiction center

---

**File:** `vantus-dashboard/pages/index.tsx`  
**Lines:** 216-217  
**Current:**
```javascript
const baseLat = 49.8951;
const baseLng = -97.1384;
```
**Action:** Replace with client's map center

---

### Map Projection Scale
**File:** `vantus-dashboard/pages/index.tsx`  
**Lines:** 141-142  
**Current:**
```javascript
x: 50 + lngOffset * 0.1,
y: 50 - latOffset * 0.1,
```
**Action:** May need adjustment for different latitudes

---

## 🔴 BASELINE CALIBRATION

### In-Memory Storage
**File:** `vantus-app/services/baselineCalibration.js`  
**Line:** 10  
**Current:**
```javascript
this.baselines = new Map(); // In-memory storage (in production, this would be persistent storage)
```
**Action:** Replace with database-backed storage

---

### Vehicle Detection Threshold
**File:** `vantus-app/services/baselineCalibration.js`  
**Line:** 87  
**Current:**
```javascript
context.movement = avgSpeed > 5 ? 'in_vehicle' : 'on_foot';
```
**Action:** Verify 5 m/s (~18 km/h) is appropriate for client's vehicles

---

### Day/Night Boundaries
**File:** `vantus-app/services/baselineCalibration.js`  
**Lines:** 110-112  
**Current:**
```javascript
getTimeOfDay() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? 'day' : 'night';
}
```
**Action:** Verify 6am-6pm boundaries match client's shift patterns

---

### Routine Duration Placeholder
**File:** `vantus-app/services/baselineCalibration.js`  
**Line:** 465  
**Current:**
```javascript
durations.push(300); // Placeholder: 5 minutes average
```
**Action:** Replace with actual duration calculation from marker start/end times

---

## 🔴 MODEL INTEGRATION

### Model Paths (null)
**File:** `vantus-app/services/modelLoader.js`  
**Current:** All model paths are `null` or not set  
**Action:** Set actual model file paths/URLs

---

### Model Inference Placeholders
**File:** `vantus-app/services/multiModelDetection.js`

**Function:** `runWeaponDetection()`  
**Line:** 63  
**Current:** Returns empty array  
**Action:** Implement YOLOv8-nano inference

**Function:** `runStanceDetection()`  
**Line:** 136  
**Current:** Returns null  
**Action:** Implement MoveNet + custom logic

**Function:** `analyzeStance()`  
**Line:** 160  
**Current:** Returns `{ type: null, confidence: 0 }`  
**Action:** Implement stance analysis algorithm

**Function:** `runHandsDetection()`  
**Line:** 219  
**Current:** Returns null  
**Action:** Implement MoveNet + custom logic

**Function:** `analyzeHands()`  
**Line:** 243  
**Current:** Returns `{ type: null, confidence: 0 }`  
**Action:** Implement hands analysis algorithm

**Function:** `runAudioDetection()`  
**Line:** 371  
**Current:** Returns null  
**Action:** Implement audio classifier inference

**Function:** `extractAudioFeatures()`  
**Line:** 395  
**Current:** Returns empty array  
**Action:** Implement audio feature extraction

---

## 🔴 INTEGRATION POINTS

### Heart Rate (Simulated)
**File:** `vantus-app/components/CalibrationScreen.js`  
**Line:** 111  
**Current:**
```javascript
const simulatedHeartRate = 65 + Math.floor(Math.random() * 10); // 65-75 bpm
setHeartRate(simulatedHeartRate);
```
**Action:** Replace with real wearable API call

---

### CAD Integration (Missing)
**File:** `bridge-server/server.js`  
**Line:** 149  
**Current:** Logs dispatch but doesn't send to CAD  
**Action:** Create `cadService.js` and integrate

---

### Reverse Geocoding (null)
**File:** `bridge-server/services/autoDispatch.js`  
**Line:** 252  
**Current:**
```javascript
address: null, // Would be reverse geocoded in production
```
**Action:** Implement reverse geocoding service

---

### Video Recording (Placeholder)
**File:** `vantus-app/services/videoBuffer.js`  
**Line:** 52  
**Current:** Placeholder comments, no actual recording  
**Action:** Implement actual video recording API

---

### Video Encryption (Placeholder)
**File:** `vantus-app/services/videoBuffer.js`  
**Line:** 131  
**Current:** Base64 encoding (not real encryption)  
**Action:** Implement AES-256 encryption

---

## 🟡 CONFIGURATION VALUES

### Confidence Thresholds
**File:** `vantus-app/services/modelRegistry.js`  
**Current:**
- Weapon: 0.70 (70%)
- Stance: 0.65 (65%)
- Hands: 0.60 (60%)
- Audio: 0.70 (70%)
- Biometric: 0.40 (40% above baseline)

**Action:** Adjust based on model validation results

---

### Auto-Dispatch Thresholds
**File:** `vantus-app/services/autoDispatch.js`  
**Current:**
- Elevated HR: 160 BPM
- Elevated HR Duration: 10 seconds
- No Movement + Elevated HR: 30 seconds
- Critical Weapon Confidence: 0.85 (85%)

**Action:** Verify thresholds are appropriate for client

---

### Video Buffer Settings
**File:** `vantus-app/services/videoBuffer.js`  
**Current:**
- Buffer: 30 seconds
- Post-trigger: 30 seconds
- Resolution: 480p (854x480)
- Frame rate: 15 FPS

**Action:** Verify settings are appropriate (may be fine as-is)

---

### Welfare Check Settings
**File:** `vantus-app/services/welfareCheck.js`  
**Current:**
- Periodic check interval: 10 minutes
- Response window: 30 seconds

**Action:** Verify settings are appropriate (may be fine as-is)

---

## 🟡 BRANDING & CUSTOMIZATION

### Department Name
**Files:** Multiple  
**Current:** "VANTUS"  
**Action:** Replace with client department name

---

### Marker Event Types
**File:** `vantus-app/App.js`  
**Lines:** 757-771  
**Current:**
- `'traffic_stop'`
- `'suspicious_activity'`
- `'checkpoint'`

**Action:** Verify/add client-specific event types

---

### Branding Colors
**Files:** CSS files  
**Current:** Generic green (#00FF41), orange (#FFAA00)  
**Action:** Replace with client colors

---

## 📊 SUMMARY STATISTICS

- **Total Hardcoded Values:** 30+
- **Files Requiring Changes:** 15+
- **Placeholder Functions:** 7
- **Demo Data Locations:** 5
- **Configuration Values:** 10+

---

## 🔍 SEARCH COMMANDS

Use these to find all instances:

```bash
# Demo badge numbers
grep -r "12345\|67890\|11111\|22222" vantus/

# Localhost URLs
grep -r "localhost:3001" vantus/

# Winnipeg coordinates
grep -r "49.8951\|-97.1384" vantus/

# OFFICER_ prefix
grep -r "OFFICER_\${" vantus/

# TODO comments
grep -r "TODO" vantus/ --include="*.js" --include="*.tsx" --include="*.ts"

# Placeholder/simulated
grep -r "placeholder\|simulated\|demo" vantus/ -i --include="*.js" --include="*.tsx" --include="*.ts"

# null values for officer info
grep -r "name: null\|unit: null" vantus/
```

---

## ✅ REPLACEMENT CHECKLIST

For each item above:
- [ ] Identified
- [ ] Replacement value determined
- [ ] Code updated
- [ ] Tested
- [ ] Documented

---

**Last Updated:** [Date]  
**Status:** Complete inventory - Ready for replacement work
