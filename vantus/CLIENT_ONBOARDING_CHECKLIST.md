# Client Onboarding Checklist - Pre-Signup Requirements

**Purpose:** Complete checklist of everything that must be done before signing up Client #1

**Status:** ⚠️ **DO NOT SIGN CLIENT** until all items are completed

---

## 📋 TABLE OF CONTENTS

1. [Authentication & Identity](#1-authentication--identity)
2. [Configuration & Environment](#2-configuration--environment)
3. [Baseline Calibration Setup](#3-baseline-calibration-setup)
4. [Model Training & Integration](#4-model-training--integration)
5. [Department-Specific Customization](#5-department-specific-customization)
6. [Integration Points](#6-integration-points)
7. [Data & Sample Data](#7-data--sample-data)
8. [Security & Compliance](#8-security--compliance)
9. [Testing & Validation](#9-testing--validation)
10. [Documentation](#10-documentation)
11. [Deployment Preparation](#11-deployment-preparation)

---

## 1. AUTHENTICATION & IDENTITY

### 1.1 Department Roster Integration ⚠️ CRITICAL

**Current State:**
- ✅ Demo badge numbers: `['12345', '67890', '11111', '22222']`
- ✅ Hardcoded in `vantus-app/components/AuthenticationScreen.js` line 52
- ✅ PIN validation accepts any 4+ digit PIN

**Required Actions:**
- [ ] **Replace demo badge validation** with real department roster API
- [ ] **Set up department roster database/API**
  - Officer badge numbers
  - Officer names
  - Officer units/divisions
  - PIN hashes (secure storage)
  - Role assignments (officer, supervisor, admin)
- [ ] **Implement secure PIN verification**
  - Hash comparison (not plain text)
  - Failed attempt tracking
  - Account lockout after N failed attempts
- [ ] **Add officer metadata to roster**
  - Badge number
  - Full name
  - Unit/division
  - Rank
  - Department ID
  - Active status
  - Hire date (for baseline calibration period)

**Files to Modify:**
- `vantus-app/components/AuthenticationScreen.js` - Replace `verifyIdentity()` function
- Create: `vantus-app/services/rosterService.js` - New service for roster API calls

**API Endpoint Required:**
```javascript
POST /api/officers/verify
{
  "badgeNumber": "12345",
  "pin": "****"
}

Response:
{
  "valid": true,
  "officer": {
    "badgeNumber": "12345",
    "name": "John Doe",
    "unit": "Patrol-7",
    "rank": "Officer",
    "department": "WPS",
    "id": "WPS-12345"
  }
}
```

**Testing:**
- [ ] Test with real badge numbers from client
- [ ] Test PIN verification
- [ ] Test failed authentication handling
- [ ] Test account lockout
- [ ] Test biometric fallback

---

### 1.2 Biometric Authentication

**Current State:**
- ✅ Biometric detection implemented
- ✅ Fallback to PIN available

**Required Actions:**
- [ ] **Test biometric on target devices**
  - iOS: Face ID / Touch ID
  - Android: Fingerprint / Face unlock
- [ ] **Configure biometric requirements**
  - Required vs optional
  - Fallback behavior
- [ ] **Test biometric + badge number flow**

**Files:**
- `vantus-app/components/AuthenticationScreen.js` - Already implemented

---

## 2. CONFIGURATION & ENVIRONMENT

### 2.1 Server URLs & Endpoints ⚠️ CRITICAL

**Current State:**
- ✅ Hardcoded: `'http://localhost:3001'` in multiple files
- ✅ Environment variables partially used

**Required Actions:**
- [ ] **Set up production bridge server**
  - Domain/hostname
  - SSL certificate (HTTPS required)
  - Port configuration
- [ ] **Update all server URLs:**
  - [ ] `vantus-app/App.js` line 23: `BRIDGE_SERVER_URL`
  - [ ] `vantus-dashboard/pages/index.tsx` line 6: `NEXT_PUBLIC_BRIDGE_URL`
  - [ ] `vantus-admin/components/AnalyticsDashboard.tsx` line 5: `BRIDGE_SERVER_URL`
- [ ] **Create environment configuration files:**
  - [ ] `.env.production` for mobile app
  - [ ] `.env.local` for dashboard
  - [ ] `.env.local` for admin portal
  - [ ] Bridge server environment variables

**Files to Modify:**
- `vantus-app/App.js`
- `vantus-dashboard/pages/index.tsx`
- `vantus-admin/components/AnalyticsDashboard.tsx`
- `bridge-server/server.js` (if needed)

**Configuration Template:**
```env
# Production Bridge Server
BRIDGE_SERVER_URL=https://bridge.vantus.example.com
NEXT_PUBLIC_BRIDGE_URL=https://bridge.vantus.example.com

# Department API
DEPARTMENT_API_URL=https://api.department.example.com
DEPARTMENT_API_KEY=xxx

# CAD System
CAD_API_URL=https://cad.department.example.com
CAD_API_KEY=xxx
```

---

### 2.2 GPS Coordinates & Map Center

**Current State:**
- ✅ Hardcoded: Winnipeg coordinates `{ lat: 49.8951, lng: -97.1384 }`
- ✅ Used in map projection calculations

**Required Actions:**
- [ ] **Get client's primary jurisdiction coordinates**
  - City center or operations center
  - Jurisdiction boundaries (for map bounds)
- [ ] **Update map center coordinates:**
  - [ ] `vantus-app/App.js` line 26: `SIMULATED_GPS`
  - [ ] `vantus-dashboard/pages/index.tsx` lines 216-217: `baseLat`, `baseLng`
- [ ] **Adjust map projection scale** if needed
  - Current: `0.1` multiplier (line 141-142 in dashboard)
  - May need adjustment for different latitudes

**Files to Modify:**
- `vantus-app/App.js`
- `vantus-dashboard/pages/index.tsx`

**Testing:**
- [ ] Verify map displays correct area
- [ ] Test GPS coordinates display correctly
- [ ] Test officer markers position correctly

---

### 2.3 Department Branding

**Current State:**
- ✅ Generic "VANTUS" branding
- ✅ Generic colors and styling

**Required Actions:**
- [ ] **Get department branding assets:**
  - Logo (for mobile app, dashboard, admin portal)
  - Color scheme (primary, secondary, accent)
  - Department name
  - Department abbreviation
- [ ] **Update branding in:**
  - [ ] Mobile app splash screen
  - [ ] Dashboard header
  - [ ] Admin portal
  - [ ] Email templates (if any)
- [ ] **Update department name references:**
  - [ ] "VANTUS" → Client department name
  - [ ] Officer ID format (e.g., "WPS-4472" vs "OFFICER_12345")

**Files to Modify:**
- `vantus-app/App.js` - Title/branding
- `vantus-dashboard/pages/index.tsx` - Header title
- `vantus-admin/app/page.tsx` - Admin portal title
- CSS files for color scheme updates

---

## 3. BASELINE CALIBRATION SETUP

### 3.1 Baseline Storage ⚠️ CRITICAL

**Current State:**
- ✅ In-memory storage only (`Map()` objects)
- ✅ Baselines lost on app restart
- ✅ No persistence between sessions

**Required Actions:**
- [ ] **Implement persistent baseline storage**
  - [ ] Database schema for baselines
  - [ ] Per-officer baseline tables
  - [ ] Per-context baseline storage
  - [ ] Baseline versioning/history
- [ ] **Migration strategy:**
  - [ ] How to handle existing baselines
  - [ ] Baseline backup/restore
  - [ ] Baseline export for compliance
- [ ] **Baseline initialization:**
  - [ ] Default baseline values for new officers
  - [ ] Minimum data requirements before signals
  - [ ] Baseline warm-up period

**Files to Modify:**
- `vantus-app/services/baselineCalibration.js` - Add database persistence
- Create: Database schema for baselines

**Database Schema Needed:**
```sql
CREATE TABLE officer_baselines (
  id TEXT PRIMARY KEY,
  officer_id TEXT NOT NULL,
  context_key TEXT NOT NULL, -- e.g., "on_foot_day_routine"
  metric_name TEXT NOT NULL, -- e.g., "avg_speed"
  metric_value REAL,
  last_updated TIMESTAMP,
  data_points INTEGER,
  UNIQUE(officer_id, context_key, metric_name)
);

CREATE TABLE baseline_history (
  id TEXT PRIMARY KEY,
  officer_id TEXT NOT NULL,
  context_key TEXT NOT NULL,
  session_id TEXT,
  timestamp TIMESTAMP,
  metrics JSON, -- All metrics from session
  FOREIGN KEY (officer_id) REFERENCES officers(id)
);
```

---

### 3.2 Baseline Adjustment & Tuning

**Current State:**
- ✅ Baseline algorithm implemented
- ✅ EMA update with 10% cap
- ✅ Context segmentation working

**Required Actions:**
- [ ] **Collect sample baseline data:**
  - [ ] 2-4 weeks of officer activity data
  - [ ] Multiple officers (5-10 minimum)
  - [ ] Various contexts (on foot, in vehicle, day, night)
  - [ ] Various operational contexts (traffic stops, routine patrol)
- [ ] **Analyze baseline patterns:**
  - [ ] Typical speed ranges
  - [ ] Typical stop durations
  - [ ] Typical speech rates
  - [ ] Typical routine durations
- [ ] **Adjust baseline thresholds if needed:**
  - [ ] Movement speed thresholds (currently 5 m/s for vehicle detection)
  - [ ] Stationary duration thresholds
  - [ ] Context segmentation thresholds
- [ ] **Validate baseline accuracy:**
  - [ ] Baselines reflect actual officer behavior
  - [ ] No false positives from baseline issues
  - [ ] Signals are meaningful deviations

**Files to Review:**
- `vantus-app/services/baselineCalibration.js`
- `vantus-app/services/baselineRelativeSignals.js`

**Testing:**
- [ ] Generate baselines from sample data
- [ ] Verify baselines are reasonable
- [ ] Test signal generation with baselines
- [ ] Verify no false positives

---

### 3.3 Context Segmentation Tuning

**Current State:**
- ✅ Context determined by speed (>5 m/s = vehicle)
- ✅ Time of day (6am-6pm = day)
- ✅ Operational context from markers

**Required Actions:**
- [ ] **Validate context detection:**
  - [ ] Speed threshold appropriate for client's vehicles?
  - [ ] Time of day boundaries match client's shift patterns?
  - [ ] Marker event types match client's operations?
- [ ] **Add client-specific contexts if needed:**
  - [ ] Special operations
  - [ ] Different vehicle types
  - [ ] Different shift patterns
- [ ] **Test context switching:**
  - [ ] Officer transitions between contexts
  - [ ] Baselines switch correctly
  - [ ] No signal loss during context switch

**Files to Modify:**
- `vantus-app/services/baselineCalibration.js` - `determineContext()` method

---

## 4. MODEL TRAINING & INTEGRATION

### 4.1 Weapon Detection Model (YOLOv8-nano) ⚠️ CRITICAL

**Current State:**
- ✅ Model registry configured
- ✅ Detection service ready
- ✅ Placeholder function in place
- ❌ **Model not trained or loaded**

**Required Actions:**
- [ ] **Collect training data:**
  - [ ] Handgun: 5,000+ images
  - [ ] Rifle/Shotgun: 2,000+ images
  - [ ] Knife/Blade: 3,000+ images
  - [ ] Blunt weapon: 1,000+ images
  - [ ] Negative examples: 10,000+ images
- [ ] **Annotate training data:**
  - [ ] YOLO format annotations
  - [ ] Bounding boxes for all weapons
  - [ ] Class labels
  - [ ] Quality control review
- [ ] **Train YOLOv8-nano model:**
  - [ ] Split: 80% train, 10% val, 10% test
  - [ ] Train with client-specific data
  - [ ] Validate accuracy (target: >85% mAP)
  - [ ] Test on unseen data
- [ ] **Convert to TensorFlow.js:**
  - [ ] Export model to TF.js format
  - [ ] Optimize for mobile (quantization)
  - [ ] Test inference speed
  - [ ] Verify model size (<50MB)
- [ ] **Integrate model:**
  - [ ] Update model path in `modelLoader.js`
  - [ ] Uncomment inference code in `multiModelDetection.js`
  - [ ] Replace placeholder function
  - [ ] Test detection accuracy on real images
- [ ] **Validate confidence threshold:**
  - [ ] Current: 70%
  - [ ] Adjust based on validation results
  - [ ] Balance false positives vs false negatives

**Files to Modify:**
- `vantus-app/services/modelLoader.js` - Add model path
- `vantus-app/services/multiModelDetection.js` - Implement `runWeaponDetection()`

**Testing:**
- [ ] Test with real weapon images (safely)
- [ ] Test with negative examples (phones, wallets, etc.)
- [ ] Verify no false positives on common objects
- [ ] Test inference performance on target devices
- [ ] Verify battery impact is acceptable

---

### 4.2 Stance Detection Model (MoveNet + Custom Logic) ⚠️ CRITICAL

**Current State:**
- ✅ MoveNet integration structure ready
- ✅ Custom logic placeholder
- ❌ **MoveNet not loaded, custom logic not implemented**

**Required Actions:**
- [ ] **Load MoveNet model:**
  - [ ] Download MoveNet model (TensorFlow.js)
  - [ ] Test pose estimation accuracy
  - [ ] Verify 17 keypoints detection
- [ ] **Develop custom stance logic:**
  - [ ] Collect stance training sequences:
    - [ ] Bladed stance: 500+ sequences
    - [ ] Fighting stance: 500+ sequences
    - [ ] Normal stance: 1,000+ sequences
  - [ ] Analyze keypoint patterns for each stance
  - [ ] Implement classification algorithm
  - [ ] Validate accuracy (target: >80%)
- [ ] **Integrate stance detection:**
  - [ ] Update `runStanceDetection()` function
  - [ ] Implement `analyzeStance()` helper
  - [ ] Test on real video frames
- [ ] **Validate confidence threshold:**
  - [ ] Current: 65%
  - [ ] Adjust based on validation

**Files to Modify:**
- `vantus-app/services/modelLoader.js` - Load MoveNet
- `vantus-app/services/multiModelDetection.js` - Implement stance logic

---

### 4.3 Hands Detection Model (MoveNet + Custom Logic) ⚠️ CRITICAL

**Current State:**
- ✅ MoveNet integration structure ready
  - [ ] Custom logic placeholder
- ❌ **MoveNet not loaded, custom logic not implemented**

**Required Actions:**
- [ ] **Load MoveNet model** (can share with stance)
- [ ] **Develop custom hands logic:**
  - [ ] Collect training sequences:
    - [ ] Hands hidden: 500+ sequences
    - [ ] Waistband reach: 500+ sequences
    - [ ] Normal hand positions: 1,000+ sequences
  - [ ] Analyze hand keypoint patterns
  - [ ] Implement proximity calculations (waistband)
  - [ ] Implement visibility detection (hands hidden)
  - [ ] Validate accuracy (target: >75%)
- [ ] **Integrate hands detection:**
  - [ ] Update `runHandsDetection()` function
  - [ ] Implement `analyzeHands()` helper
  - [ ] Test on real video frames
- [ ] **Validate confidence threshold:**
  - [ ] Current: 60%
  - [ ] Adjust based on validation

**Files to Modify:**
- `vantus-app/services/multiModelDetection.js` - Implement hands logic

---

### 4.4 Audio Classification Model ⚠️ CRITICAL

**Current State:**
- ✅ Audio classifier structure ready
- ✅ Placeholder function
- ❌ **Model not trained or loaded**

**Required Actions:**
- [ ] **Collect training audio data:**
  - [ ] Aggressive vocal patterns: 2,000+ samples
  - [ ] Screaming: 1,000+ samples
  - [ ] Normal speech: 5,000+ samples
  - [ ] Diverse speakers, environments
- [ ] **Extract audio features:**
  - [ ] MFCC coefficients
  - [ ] Spectral features
  - [ ] Prosodic features (pitch, tempo)
  - [ ] Optional: Transcript text features
- [ ] **Train audio classifier:**
  - [ ] Split: 80% train, 10% val, 10% test
  - [ ] Train model (TensorFlow/Keras)
  - [ ] Validate accuracy (target: >80%)
- [ ] **Convert to TensorFlow.js:**
  - [ ] Export to TF.js format
  - [ ] Optimize for mobile
  - [ ] Test inference speed
- [ ] **Integrate model:**
  - [ ] Update model path
  - [ ] Implement `runAudioDetection()`
  - [ ] Implement `extractAudioFeatures()`
  - [ ] Test on real audio samples
- [ ] **Validate confidence threshold:**
  - [ ] Current: 70%
  - [ ] Adjust based on validation

**Files to Modify:**
- `vantus-app/services/modelLoader.js` - Load audio model
- `vantus-app/services/multiModelDetection.js` - Implement audio detection

---

### 4.5 Biometric Detection (Wearable Integration) ⚠️ CRITICAL

**Current State:**
- ✅ Baseline comparison logic implemented
- ✅ 40% threshold configured
- ❌ **Wearable integration not implemented**
- ❌ **Heart rate capture simulated**

**Required Actions:**
- [ ] **Choose wearable platform:**
  - [ ] Apple Watch (HealthKit)
  - [ ] Android Wear (Google Fit)
  - [ ] Third-party (Fitbit, Garmin, etc.)
- [ ] **Implement wearable SDK integration:**
  - [ ] Request permissions
  - [ ] Subscribe to heart rate data
  - [ ] Handle connection/disconnection
  - [ ] Battery level monitoring
- [ ] **Test heart rate capture:**
  - [ ] Real-time heart rate during calibration
  - [ ] Continuous monitoring during sessions
  - [ ] Accuracy validation
- [ ] **Validate 40% threshold:**
  - [ ] Test with real heart rate spikes
  - [ ] Verify threshold is appropriate
  - [ ] Adjust if needed based on data

**Files to Modify:**
- `vantus-app/components/CalibrationScreen.js` - Real heart rate capture
- `vantus-app/App.js` - Continuous heart rate monitoring
- Create: `vantus-app/services/wearableService.js` - Wearable integration

**SDK Requirements:**
- iOS: `react-native-health` or `expo-health`
- Android: `react-native-google-fit` or similar

---

## 5. DEPARTMENT-SPECIFIC CUSTOMIZATION

### 5.1 Officer ID Format

**Current State:**
- ✅ Format: `OFFICER_{badgeNumber}`
- ✅ Example: `OFFICER_12345`

**Required Actions:**
- [ ] **Get client's officer ID format:**
  - [ ] Format specification (e.g., "WPS-4472")
  - [ ] Prefix/suffix requirements
  - [ ] Validation rules
- [ ] **Update officer ID generation:**
  - [ ] Replace `OFFICER_${badgeNumber}` with client format
  - [ ] Update all references in code
  - [ ] Update database schema if needed

**Files to Modify:**
- `vantus-app/App.js` - Multiple locations using `OFFICER_${badgeNumber}`
- `vantus-app/services/telemetryService.js`
- `vantus-app/services/baselineCalibration.js`
- All files using officer names

**Search & Replace:**
```javascript
// Find all instances of:
`OFFICER_${badgeNumber}`

// Replace with client format, e.g.:
`${departmentPrefix}-${badgeNumber}` // "WPS-12345"
```

---

### 5.2 Marker Event Types

**Current State:**
- ✅ Hardcoded: `'traffic_stop'`, `'suspicious_activity'`, `'checkpoint'`

**Required Actions:**
- [ ] **Get client's operational event types:**
  - [ ] List of all marker event types
  - [ ] Definitions for each type
  - [ ] Expected durations for each
- [ ] **Update marker event types:**
  - [ ] Replace hardcoded types
  - [ ] Add client-specific types
  - [ ] Update UI buttons
- [ ] **Configure routine duration baselines:**
  - [ ] Expected duration for each event type
  - [ ] Thresholds for "extended" duration

**Files to Modify:**
- `vantus-app/App.js` - Marker event buttons
- `vantus-app/services/baselineCalibration.js` - Event type handling
- `vantus-app/services/baselineRelativeSignals.js` - Routine duration logic

---

### 5.3 Operational Contexts

**Current State:**
- ✅ Contexts: `traffic_stop`, `checkpoint`, `routine`

**Required Actions:**
- [ ] **Get client's operational contexts:**
  - [ ] All routine operations
  - [ ] Special operations
  - [ ] Context definitions
- [ ] **Update context handling:**
  - [ ] Add client-specific contexts
  - [ ] Update baseline context keys
  - [ ] Test context switching

**Files to Modify:**
- `vantus-app/services/baselineCalibration.js` - `determineContext()` method

---

### 5.4 Voice Advisory Messages

**Current State:**
- ✅ Generic messages implemented
- ✅ All message types defined

**Required Actions:**
- [ ] **Review voice messages with client:**
  - [ ] Verify messages are appropriate
  - [ ] Check terminology matches department
  - [ ] Verify no confusing language
- [ ] **Customize if needed:**
  - [ ] Department-specific terminology
  - [ ] Regional language preferences
  - [ ] Message clarity improvements

**Files to Review:**
- `vantus-app/services/voiceAdvisory.js` - All message strings

---

## 6. INTEGRATION POINTS

### 6.1 CAD System Integration ⚠️ CRITICAL

**Current State:**
- ✅ Dispatch payload format defined
- ✅ Event structure matches CAD requirements
- ❌ **No actual CAD API integration**

**Required Actions:**
- [ ] **Get CAD system API documentation:**
  - [ ] API endpoint URLs
  - [ ] Authentication method
  - [ ] Request/response formats
  - [ ] Error handling
- [ ] **Implement CAD API client:**
  - [ ] Create `bridge-server/services/cadService.js`
  - [ ] Handle authentication
  - [ ] Send dispatch payloads
  - [ ] Handle responses
  - [ ] Error handling and retries
- [ ] **Test CAD integration:**
  - [ ] Test dispatch payload format
  - [ ] Test authentication
  - [ ] Test error scenarios
  - [ ] Verify CAD receives dispatches

**Files to Create:**
- `bridge-server/services/cadService.js`

**Integration Points:**
- `bridge-server/server.js` - Call CAD service on `EMERGENCY_DISPATCH` event

**CAD Payload Format (Already Defined):**
```json
{
  "type": "EMERGENCY_BACKUP",
  "timestamp": "2025-01-08T14:32:45Z",
  "officer": {
    "id": "WPS-4472",
    "name": "Chen, Sarah",
    "unit": "Patrol-7"
  },
  "location": {
    "lat": 49.2827,
    "lng": -123.1207,
    "accuracy": 5,
    "address": "1847 Marine Drive, West Vancouver, BC"
  },
  "situation": {
    "threat_type": "WEAPON_DETECTED",
    "confidence": 0.87,
    "biometric_state": "ELEVATED",
    "heart_rate": 145,
    "duration_seconds": 34
  },
  "context": {
    "call_type": "TRAFFIC_STOP",
    "original_cad_id": "2025-0108-4421",
    "time_on_scene": 180
  }
}
```

---

### 6.2 Reverse Geocoding (Address Lookup)

**Current State:**
- ✅ Location coordinates captured
- ❌ **Address field is `null` in dispatch payload**

**Required Actions:**
- [ ] **Choose geocoding service:**
  - [ ] Google Maps Geocoding API
  - [ ] OpenStreetMap Nominatim
  - [ ] Department's own geocoding
- [ ] **Implement reverse geocoding:**
  - [ ] Convert lat/lng to address
  - [ ] Cache results (reduce API calls)
  - [ ] Handle errors gracefully
- [ ] **Update dispatch payload:**
  - [ ] Include address in location object
  - [ ] Fallback to coordinates if geocoding fails

**Files to Create:**
- `bridge-server/services/geocodingService.js`

**Integration:**
- `bridge-server/services/autoDispatch.js` (via bridge server)

---

### 6.3 Video Recording API

**Current State:**
- ✅ Video buffer structure implemented
- ✅ Clip saving logic ready
- ❌ **Actual video recording not implemented**
- ❌ **Video combining not implemented**

**Required Actions:**
- [ ] **Implement video recording:**
  - [ ] Use `expo-av` Recording API
  - [ ] Or native recording API
  - [ ] Test 30-second buffer recording
  - [ ] Test 30-second post-trigger recording
- [ ] **Implement video combining:**
  - [ ] FFmpeg integration
  - [ ] Combine pre + post trigger videos
  - [ ] Test output quality
  - [ ] Verify 60-second total length
- [ ] **Test video buffer:**
  - [ ] Rolling buffer works
  - [ ] Clip saves on trigger
  - [ ] Video quality acceptable
  - [ ] File size reasonable

**Files to Modify:**
- `vantus-app/services/videoBuffer.js` - Implement actual recording

**Dependencies:**
- May need: `expo-av` Recording API
- May need: FFmpeg library for combining

---

### 6.4 Video Encryption

**Current State:**
- ✅ Encryption placeholder implemented
- ❌ **AES-256 not fully implemented**

**Required Actions:**
- [ ] **Implement AES-256 encryption:**
  - [ ] Use proper encryption library
  - [ ] Generate secure keys
  - [ ] Encrypt video files
  - [ ] Test encryption/decryption
- [ ] **Secure key management:**
  - [ ] Key storage (secure keychain/keystore)
  - [ ] Key rotation policy
  - [ ] Key backup/recovery
- [ ] **Test encryption:**
  - [ ] Verify files are encrypted
  - [ ] Test decryption for authorized access
  - [ ] Verify keys are secure

**Files to Modify:**
- `vantus-app/services/videoBuffer.js` - `encryptClipData()` method

---

### 6.5 Voice Recognition (Officer Down Command)

**Current State:**
- ✅ Voice response handling structure
- ❌ **Voice recognition not implemented**

**Required Actions:**
- [ ] **Choose voice recognition:**
  - [ ] Speech-to-text API (Google, Azure, etc.)
  - [ ] On-device recognition
  - [ ] Keyword spotting
- [ ] **Implement "Officer down" detection:**
  - [ ] Background audio processing
  - [ ] Keyword detection
  - [ ] Trigger auto-dispatch
- [ ] **Implement "I'm okay" response:**
  - [ ] Voice response to welfare check
  - [ ] Clear welfare check on detection

**Files to Create/Modify:**
- Create: `vantus-app/services/voiceRecognition.js`
- `vantus-app/services/welfareCheck.js` - Integrate voice recognition

---

## 7. DATA & SAMPLE DATA

### 7.1 Sample Baseline Data

**Required Actions:**
- [ ] **Generate sample baseline data:**
  - [ ] 2-4 weeks of officer activity
  - [ ] Multiple officers (5-10)
  - [ ] All contexts (on foot, vehicle, day, night)
  - [ ] Various operational contexts
- [ ] **Import sample baselines:**
  - [ ] Load into baseline storage
  - [ ] Verify baselines are reasonable
  - [ ] Test signal generation with sample baselines

**Data Format:**
```json
{
  "officer_id": "WPS-12345",
  "context": "on_foot_day_routine",
  "metrics": {
    "avg_speed": 1.2,
    "speed_std": 0.5,
    "avg_deceleration": 0.8,
    "deceleration_std": 0.3,
    "stop_duration_median": 6.5,
    "stop_duration_IQR": 2.1,
    // ... other metrics
  }
}
```

---

### 7.2 Sample Signal Data

**Required Actions:**
- [ ] **Generate sample signals:**
  - [ ] Various signal types
  - [ ] Different probability levels
  - [ ] Different contexts
  - [ ] Realistic scenarios
- [ ] **Test dashboard with sample signals:**
  - [ ] Verify signal display
  - [ ] Test signal detail panes
  - [ ] Test flagging functionality
  - [ ] Test post-shift summaries

---

### 7.3 Test Officer Accounts

**Required Actions:**
- [ ] **Create test officer accounts:**
  - [ ] 5-10 test officers
  - [ ] Various roles (officer, supervisor, admin)
  - [ ] Test badge numbers
  - [ ] Test PINs (document securely)
- [ ] **Populate test data:**
  - [ ] Sample sessions
  - [ ] Sample signals
  - [ ] Sample baselines
  - [ ] Sample markers

---

## 8. SECURITY & COMPLIANCE

### 8.1 Authentication Security

**Required Actions:**
- [ ] **Implement secure PIN storage:**
  - [ ] Hash PINs (bcrypt, argon2, etc.)
  - [ ] Never store plain text
  - [ ] Salt each PIN
- [ ] **Implement session management:**
  - [ ] Secure session tokens
  - [ ] Session expiration
  - [ ] Session invalidation on logout
- [ ] **Implement rate limiting:**
  - [ ] Failed login attempts
  - [ ] API request limits
  - [ ] Prevent brute force

**Files to Modify:**
- `vantus-app/components/AuthenticationScreen.js`
- Create: `bridge-server/services/authService.js`

---

### 8.2 Data Encryption

**Required Actions:**
- [ ] **Encrypt sensitive data:**
  - [ ] Calibration data (heart rate, etc.)
  - [ ] Audio transcripts
  - [ ] Video clips
  - [ ] Officer personal information
- [ ] **Implement secure storage:**
  - [ ] iOS: Keychain
  - [ ] Android: Keystore
  - [ ] Server: Encrypted database fields
- [ ] **Test encryption:**
  - [ ] Verify data is encrypted at rest
  - [ ] Verify data is encrypted in transit (TLS)
  - [ ] Test key management

---

### 8.3 Audit Log Security

**Required Actions:**
- [ ] **Secure audit logs:**
  - [ ] Immutable storage (append-only)
  - [ ] Access controls (read-only for most)
  - [ ] Encryption of sensitive log entries
- [ ] **Implement log retention:**
  - [ ] Per client retention policy
  - [ ] Automatic deletion after retention
  - [ ] Secure deletion (overwrite)
- [ ] **Test audit logging:**
  - [ ] Verify all events logged
  - [ ] Verify logs are immutable
  - [ ] Test log export
  - [ ] Test log deletion

**Files to Review:**
- `bridge-server/services/auditLogger.js`

---

### 8.4 Role-Based Access Control

**Required Actions:**
- [ ] **Define roles:**
  - [ ] Officer (mobile app only)
  - [ ] Supervisor (dashboard access)
  - [ ] Admin (admin portal access)
  - [ ] System admin (full access)
- [ ] **Implement RBAC:**
  - [ ] Role assignment in roster
  - [ ] Permission checks in code
  - [ ] UI based on role
- [ ] **Test access controls:**
  - [ ] Officers can't access dashboard
  - [ ] Supervisors can't access admin
  - [ ] Admins have full access

**Files to Modify:**
- All dashboard/admin components
- Bridge server endpoints

---

## 9. TESTING & VALIDATION

### 9.1 End-to-End Testing

**Required Actions:**
- [ ] **Test complete officer flow:**
  - [ ] Authentication → Calibration → Standby → Session Start
  - [ ] Telemetry collection
  - [ ] Signal generation
  - [ ] Dashboard display
  - [ ] Session end → Baseline update
- [ ] **Test supervisor flow:**
  - [ ] Dashboard login
  - [ ] View officer units
  - [ ] View signals
  - [ ] Flag signals
  - [ ] Generate summaries
- [ ] **Test admin flow:**
  - [ ] Admin login
  - [ ] View analytics
  - [ ] Export logs
  - [ ] Configure policies

---

### 9.2 Model Testing

**Required Actions:**
- [ ] **Test each model:**
  - [ ] Weapon detection accuracy
  - [ ] Stance detection accuracy
  - [ ] Hands detection accuracy
  - [ ] Audio classification accuracy
  - [ ] Biometric detection accuracy
- [ ] **Test false positive rates:**
  - [ ] Verify acceptable false positive rate
  - [ ] Test with negative examples
  - [ ] Adjust thresholds if needed
- [ ] **Test performance:**
  - [ ] Inference speed on target devices
  - [ ] Battery impact
  - [ ] Memory usage
  - [ ] Model loading time

---

### 9.3 Integration Testing

**Required Actions:**
- [ ] **Test CAD integration:**
  - [ ] Dispatch payload format
  - [ ] Authentication
  - [ ] Error handling
  - [ ] Retry logic
- [ ] **Test wearable integration:**
  - [ ] Heart rate capture
  - [ ] Continuous monitoring
  - [ ] Connection handling
- [ ] **Test video recording:**
  - [ ] Buffer recording
  - [ ] Clip saving
  - [ ] Video quality
  - [ ] Encryption

---

### 9.4 Performance Testing

**Required Actions:**
- [ ] **Test with multiple officers:**
  - [ ] 10+ concurrent officers
  - [ ] Signal generation performance
  - [ ] Dashboard performance
  - [ ] Server load
- [ ] **Test data volume:**
  - [ ] Large baseline history
  - [ ] Many signals
  - [ ] Long sessions
  - [ ] Storage limits

---

## 10. DOCUMENTATION

### 10.1 Client-Specific Documentation

**Required Actions:**
- [ ] **Update all documentation:**
  - [ ] Replace demo examples with client examples
  - [ ] Update department names
  - [ ] Update officer ID formats
  - [ ] Update coordinates/locations
- [ ] **Create client-specific docs:**
  - [ ] Client onboarding guide
  - [ ] Client configuration guide
  - [ ] Client training materials
  - [ ] Client support documentation

**Files to Update:**
- All `.md` files in `docs/` directory
- README files
- User manuals

---

### 10.2 Training Materials

**Required Actions:**
- [ ] **Create officer training:**
  - [ ] App usage guide
  - [ ] Calibration process
  - [ ] Marker events
  - [ ] Emergency procedures
- [ ] **Create supervisor training:**
  - [ ] Dashboard usage
  - [ ] Signal interpretation
  - [ ] Flagging and review
- [ ] **Create admin training:**
  - [ ] Admin portal usage
  - [ ] Policy configuration
  - [ ] Analytics and reports

---

## 11. DEPLOYMENT PREPARATION

### 11.1 Infrastructure Setup

**Required Actions:**
- [ ] **Set up production servers:**
  - [ ] Bridge server hosting
  - [ ] Database hosting
  - [ ] File storage (for video clips)
  - [ ] CDN (if needed for models)
- [ ] **Configure SSL/TLS:**
  - [ ] HTTPS for all endpoints
  - [ ] Certificate management
  - [ ] Certificate renewal
- [ ] **Set up monitoring:**
  - [ ] Server health monitoring
  - [ ] Error tracking
  - [ ] Performance monitoring
  - [ ] Alerting

---

### 11.2 Database Setup

**Required Actions:**
- [ ] **Set up production database:**
  - [ ] Choose database (PostgreSQL, MongoDB, etc.)
  - [ ] Create schema
  - [ ] Set up backups
  - [ ] Configure replication (if needed)
- [ ] **Migrate baseline storage:**
  - [ ] Move from in-memory to database
  - [ ] Test migration
  - [ ] Verify data integrity

**Database Tables Needed:**
- Officers
- Baselines (per officer, per context)
- Sessions
- Signals
- Audit logs
- Video clips metadata
- Dispatch history

---

### 11.3 Mobile App Distribution

**Required Actions:**
- [ ] **Build production app:**
  - [ ] iOS: App Store build
  - [ ] Android: Play Store build
  - [ ] Or enterprise distribution
- [ ] **Configure app:**
  - [ ] Production server URLs
  - [ ] Client branding
  - [ ] App icons and splash screens
- [ ] **Test production build:**
  - [ ] Install on test devices
  - [ ] Verify all features work
  - [ ] Test with production servers

---

### 11.4 Dashboard & Admin Deployment

**Required Actions:**
- [ ] **Build production dashboard:**
  - [ ] Next.js production build
  - [ ] Configure environment variables
  - [ ] Deploy to hosting (Vercel, AWS, etc.)
- [ ] **Build production admin portal:**
  - [ ] Next.js production build
  - [ ] Configure environment variables
  - [ ] Deploy to hosting
- [ ] **Test production deployments:**
  - [ ] Verify dashboard works
  - [ ] Verify admin portal works
  - [ ] Test with production bridge server

---

## 12. CLIENT-SPECIFIC CONFIGURATION FILE

**Create:** `vantus/config/client-config.js` or `.env.client`

```javascript
// Client Configuration
export const CLIENT_CONFIG = {
  // Department Info
  departmentName: "West Vancouver Police Service",
  departmentAbbreviation: "WVPS",
  departmentId: "WVPS",
  
  // Officer ID Format
  officerIdFormat: (badgeNumber) => `WVPS-${badgeNumber}`,
  
  // Server URLs
  bridgeServerUrl: "https://bridge.vantus.wvps.ca",
  departmentApiUrl: "https://api.wvps.ca",
  cadApiUrl: "https://cad.wvps.ca",
  
  // Map Center
  mapCenter: {
    lat: 49.2827,
    lng: -123.1207,
  },
  
  // Operational Contexts
  markerEventTypes: [
    "traffic_stop",
    "checkpoint",
    "suspicious_activity",
    "welfare_check",
    "backup_requested",
  ],
  
  // Model Paths
  modelPaths: {
    weapon: "https://models.vantus.wvps.ca/weapon/model.json",
    stance: "https://models.vantus.wvps.ca/stance/model.json",
    hands: "https://models.vantus.wvps.ca/hands/model.json",
    audio: "https://models.vantus.wvps.ca/audio/model.json",
  },
  
  // Thresholds
  thresholds: {
    weapon: 0.70,
    stance: 0.65,
    hands: 0.60,
    audio: 0.70,
    biometric: 0.40, // 40% above baseline
  },
  
  // Branding
  branding: {
    logo: "/assets/wvps-logo.png",
    primaryColor: "#1a4d8c",
    secondaryColor: "#00FF41",
  },
};
```

---

## 13. PRE-SIGNUP VALIDATION CHECKLIST

### Critical Items (Must Complete)

- [ ] Department roster API integrated and tested
- [ ] All models trained and integrated
- [ ] CAD system integration working
- [ ] Baseline storage persistent (not in-memory)
- [ ] Production servers configured
- [ ] SSL certificates installed
- [ ] Database set up and tested
- [ ] Security audit completed
- [ ] End-to-end testing passed
- [ ] Client-specific configuration applied

### Important Items (Should Complete)

- [ ] Wearable integration working
- [ ] Video recording working
- [ ] Video encryption implemented
- [ ] Voice recognition working
- [ ] Sample baseline data loaded
- [ ] Documentation updated
- [ ] Training materials created

### Nice-to-Have Items

- [ ] Advanced analytics
- [ ] Custom reporting
- [ ] Additional integrations
- [ ] Performance optimizations

---

## 14. CLIENT ONBOARDING PROCESS

### Phase 1: Pre-Signup (This Checklist)
- Complete all items above
- Client review and approval
- Contract signing

### Phase 2: Setup (Week 1)
- [ ] Deploy to client infrastructure
- [ ] Configure client-specific settings
- [ ] Load initial officer roster
- [ ] Set up baseline calibration period
- [ ] Train client administrators

### Phase 3: Pilot (Weeks 2-4)
- [ ] Limited officer deployment (5-10 officers)
- [ ] Collect baseline data
- [ ] Monitor signal generation
- [ ] Adjust thresholds if needed
- [ ] Gather feedback

### Phase 4: Full Deployment (Week 5+)
- [ ] Roll out to all officers
- [ ] Ongoing monitoring
- [ ] Support and maintenance

---

## 15. RISK MITIGATION

### High-Risk Items

1. **Model Accuracy**
   - Risk: False positives/negatives
   - Mitigation: Extensive testing, threshold tuning

2. **Baseline Quality**
   - Risk: Poor baselines = poor signals
   - Mitigation: Sufficient calibration period, validation

3. **Integration Failures**
   - Risk: CAD/dispatch failures
   - Mitigation: Robust error handling, fallbacks

4. **Security Breaches**
   - Risk: Data exposure
   - Mitigation: Security audit, encryption, access controls

---

## 16. ESTIMATED TIMELINE

**Model Training:** 4-6 weeks
- Data collection: 2-3 weeks
- Training: 1-2 weeks
- Integration: 1 week

**Integration Development:** 2-3 weeks
- CAD integration: 1 week
- Wearable integration: 1 week
- Video recording: 1 week

**Configuration & Testing:** 1-2 weeks
- Client configuration: 3-5 days
- End-to-end testing: 3-5 days
- Security audit: 2-3 days

**Total Estimated Time:** 7-11 weeks before client signup

---

## 17. QUICK REFERENCE: FILES TO MODIFY

### Critical Files (Must Modify)
1. `vantus-app/components/AuthenticationScreen.js` - Roster API
2. `vantus-app/App.js` - Server URLs, officer IDs, GPS
3. `vantus-app/services/baselineCalibration.js` - Persistent storage
4. `vantus-app/services/modelLoader.js` - Model paths
5. `vantus-app/services/multiModelDetection.js` - Model inference
6. `bridge-server/server.js` - CAD integration
7. `vantus-dashboard/pages/index.tsx` - Map center, branding

### Important Files (Should Modify)
1. All service files with hardcoded values
2. Configuration files
3. Documentation files
4. Branding/assets

---

**STATUS:** ⚠️ **DO NOT SIGN CLIENT** until checklist is complete

**NEXT STEP:** Begin with highest priority items (Authentication, Models, CAD Integration)
