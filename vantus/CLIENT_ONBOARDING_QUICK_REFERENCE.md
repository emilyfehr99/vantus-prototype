# Client Onboarding - Quick Reference

**Quick checklist of all hardcoded values and placeholders that MUST be replaced before client signup.**

---

## 🔴 CRITICAL - Must Replace

### 1. Authentication (Demo Badge Numbers)
**File:** `vantus-app/components/AuthenticationScreen.js:52`
```javascript
// REPLACE THIS:
const validBadges = ['12345', '67890', '11111', '22222'];

// WITH:
// Real department roster API call
```

---

### 2. Server URLs (localhost)
**Files:**
- `vantus-app/App.js:23` → `'http://localhost:3001'`
- `vantus-dashboard/pages/index.tsx:6` → `'http://localhost:3001'`
- `vantus-admin/components/AnalyticsDashboard.tsx:5` → `'http://localhost:3001'`

**Replace with:** Production server URLs

---

### 3. GPS Coordinates (Winnipeg)
**Files:**
- `vantus-app/App.js:26` → `{ lat: 49.8951, lng: -97.1384 }`
- `vantus-dashboard/pages/index.tsx:216-217` → `baseLat: 49.8951, baseLng: -97.1384`

**Replace with:** Client's jurisdiction center

---

### 4. Officer ID Format
**Search for:** `OFFICER_${badgeNumber}` (15+ instances)
**Files:** Multiple (App.js, services, etc.)

**Replace with:** Client format (e.g., `WVPS-${badgeNumber}`)

---

### 5. Baseline Storage (In-Memory)
**File:** `vantus-app/services/baselineCalibration.js:10`
```javascript
// REPLACE THIS:
this.baselines = new Map(); // In-memory storage

// WITH:
// Database-backed storage
```

---

### 6. Model Paths (null)
**File:** `vantus-app/services/modelLoader.js`
**Current:** All model paths are `null`
**Replace with:** Actual model file paths/URLs

---

### 7. Model Inference (Placeholders)
**File:** `vantus-app/services/multiModelDetection.js`
**Functions to implement:**
- `runWeaponDetection()` - Line 63
- `runStanceDetection()` - Line 136
- `analyzeStance()` - Line 160
- `runHandsDetection()` - Line 219
- `analyzeHands()` - Line 243
- `runAudioDetection()` - Line 371
- `extractAudioFeatures()` - Line 395

---

### 8. Heart Rate (Simulated)
**File:** `vantus-app/components/CalibrationScreen.js:111`
```javascript
// REPLACE THIS:
const simulatedHeartRate = 65 + Math.floor(Math.random() * 10);

// WITH:
// Real wearable API call
```

---

### 9. CAD Integration (Missing)
**File:** `bridge-server/server.js:149`
**Current:** Logs dispatch but doesn't send to CAD
**Action:** Create `bridge-server/services/cadService.js` and integrate

---

### 10. Video Recording (Placeholder)
**File:** `vantus-app/services/videoBuffer.js:52`
**Current:** Placeholder comments
**Action:** Implement actual video recording

---

### 11. Video Encryption (Placeholder)
**File:** `vantus-app/services/videoBuffer.js:131`
**Current:** Base64 encoding (not real encryption)
**Action:** Implement AES-256 encryption

---

### 12. Reverse Geocoding (null)
**File:** `bridge-server/services/autoDispatch.js:252`
**Current:** `address: null`
**Action:** Implement reverse geocoding service

---

### 13. Officer Name/Unit (null)
**Files:** Multiple
**Current:** `name: null, unit: null`
**Action:** Get from roster API

---

## 🟡 IMPORTANT - Should Replace

### 14. Department Name
**Files:** Multiple
**Current:** "VANTUS"
**Replace with:** Client department name

### 15. Branding Colors
**Files:** CSS files
**Current:** Generic green/orange
**Replace with:** Client colors

### 16. Marker Event Types
**File:** `vantus-app/App.js:757-771`
**Current:** `'traffic_stop'`, `'suspicious_activity'`, `'checkpoint'`
**Action:** Verify/add client-specific types

### 17. Routine Durations
**File:** `vantus-app/services/baselineCalibration.js:465`
**Current:** `300` seconds placeholder
**Action:** Set real expected durations per event type

---

## CONFIGURATION VALUES TO SET

### Baseline Calibration Thresholds
**File:** `vantus-app/services/baselineCalibration.js`
- Line 87: `avgSpeed > 5` (vehicle detection) - Verify appropriate
- Line 75: `getTimeOfDay()` - Day/night boundaries (6am-6pm) - Verify appropriate

### Auto-Dispatch Thresholds
**File:** `vantus-app/services/autoDispatch.js`
- Line 45: `elevatedThreshold = 160` BPM - Verify appropriate
- Line 46: `durationThreshold = 10000` (10 seconds) - Verify appropriate
- Line 229: `threshold = 0.40` (40% above baseline) - Verify appropriate

### Model Confidence Thresholds
**File:** `vantus-app/services/modelRegistry.js`
- Weapon: 0.70 (70%) - Adjust after validation
- Stance: 0.65 (65%) - Adjust after validation
- Hands: 0.60 (60%) - Adjust after validation
- Audio: 0.70 (70%) - Adjust after validation

---

## FILES THAT NEED CLIENT-SPECIFIC VALUES

1. ✅ `vantus-app/components/AuthenticationScreen.js` - Roster API
2. ✅ `vantus-app/App.js` - URLs, GPS, officer IDs
3. ✅ `vantus-app/services/baselineCalibration.js` - Storage, thresholds
4. ✅ `vantus-app/services/modelLoader.js` - Model paths
5. ✅ `vantus-app/services/multiModelDetection.js` - Model inference
6. ✅ `vantus-app/components/CalibrationScreen.js` - Heart rate
7. ✅ `vantus-app/services/videoBuffer.js` - Recording, encryption
8. ✅ `bridge-server/server.js` - CAD integration
9. ✅ `bridge-server/services/autoDispatch.js` - Geocoding
10. ✅ `vantus-dashboard/pages/index.tsx` - Map center, branding
11. ✅ `vantus-admin/app/page.tsx` - Branding

---

## TESTING CHECKLIST

Before client signup, test:
- [ ] Authentication with real badge numbers
- [ ] All models detect correctly
- [ ] Baselines persist between sessions
- [ ] CAD receives dispatches
- [ ] Video clips save correctly
- [ ] Heart rate captures from wearable
- [ ] All integrations work end-to-end

---

**Use this as a quick reference. See `CLIENT_ONBOARDING_CHECKLIST_DETAILED.md` for full details.**
