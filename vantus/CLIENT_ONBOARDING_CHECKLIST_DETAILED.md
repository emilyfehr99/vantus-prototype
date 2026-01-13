# Client Onboarding Checklist - Detailed Item-by-Item

**Purpose:** Detailed breakdown of every single item that must be completed before Client #1 signup

**How to Use:** Check off each item as completed. Do not proceed to client signup until ALL critical items are complete.

---

## 🔴 CRITICAL - MUST COMPLETE BEFORE SIGNUP

### AUTHENTICATION & IDENTITY

#### A1. Department Roster API Integration
**File:** `vantus-app/components/AuthenticationScreen.js`
**Line:** 52
**Current:** `const validBadges = ['12345', '67890', '11111', '22222'];`
**Action Required:**
- [ ] Remove hardcoded badge numbers
- [ ] Create `vantus-app/services/rosterService.js`
- [ ] Implement API call to department roster
- [ ] Handle authentication (API key, OAuth, etc.)
- [ ] Handle errors (network, invalid badge, etc.)
- [ ] Test with real badge numbers
- [ ] Test PIN verification
- [ ] Test failed authentication
- [ ] Test account lockout (after N failed attempts)

**API Endpoint to Create:**
```javascript
// POST /api/officers/verify
async function verifyOfficer(badgeNumber, pin) {
  const response = await fetch(`${CLIENT_CONFIG.servers.departmentApi}/officers/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLIENT_CONFIG.apiKeys.departmentApi}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ badgeNumber, pin }),
  });
  return response.json();
}
```

---

#### A2. Officer ID Format
**Files:** Multiple (search for `OFFICER_${badgeNumber}`)
**Current:** `OFFICER_12345`
**Action Required:**
- [ ] Get client's officer ID format (e.g., "WVPS-4472")
- [ ] Create helper function: `getOfficerId(badgeNumber)`
- [ ] Replace all instances of `OFFICER_${badgeNumber}` with `getOfficerId(badgeNumber)`
- [ ] Update database schema if needed
- [ ] Test officer ID generation

**Files to Search & Replace:**
- `vantus-app/App.js` - ~15 instances
- `vantus-app/services/telemetryService.js`
- `vantus-app/services/baselineCalibration.js`
- `vantus-app/services/baselineRelativeSignals.js`
- `vantus-app/services/multiModelDetection.js`
- `bridge-server/server.js`

**Search Pattern:**
```bash
grep -r "OFFICER_\${" vantus/
```

---

#### A3. Officer Metadata (Name, Unit, etc.)
**Files:** Multiple (search for `name: null`, `unit: null`)
**Current:** Hardcoded `null` values
**Action Required:**
- [ ] Get officer metadata from roster API
- [ ] Store in officer info objects
- [ ] Update dispatch payloads to include real names/units
- [ ] Update dashboard to show real names
- [ ] Test with real officer data

**Files to Modify:**
- `vantus-app/App.js` - Lines 232, 280 (officerInfo objects)
- `vantus-app/services/autoDispatch.js` - Line 245-246
- `vantus-app/services/welfareCheck.js` - Line 154-155

---

### CONFIGURATION & ENVIRONMENT

#### C1. Bridge Server URL
**Files:**
- `vantus-app/App.js` line 23
- `vantus-dashboard/pages/index.tsx` line 6
- `vantus-admin/components/AnalyticsDashboard.tsx` line 5

**Current:** `'http://localhost:3001'`
**Action Required:**
- [ ] Set up production bridge server
- [ ] Get production URL
- [ ] Update all hardcoded URLs
- [ ] Set up environment variables
- [ ] Test connection from all clients
- [ ] Verify SSL/HTTPS works

**Environment Variables:**
```env
# Mobile App
BRIDGE_SERVER_URL=https://bridge.vantus.client.com

# Dashboard
NEXT_PUBLIC_BRIDGE_URL=https://bridge.vantus.client.com

# Admin
NEXT_PUBLIC_BRIDGE_URL=https://bridge.vantus.client.com
```

---

#### C2. GPS Coordinates & Map Center
**Files:**
- `vantus-app/App.js` line 26: `SIMULATED_GPS`
- `vantus-dashboard/pages/index.tsx` lines 216-217: `baseLat`, `baseLng`

**Current:** Winnipeg `{ lat: 49.8951, lng: -97.1384 }`
**Action Required:**
- [ ] Get client's primary jurisdiction center coordinates
- [ ] Update `SIMULATED_GPS` constant
- [ ] Update dashboard map center
- [ ] Test map displays correct area
- [ ] Adjust map projection scale if needed (line 141-142)
- [ ] Test officer markers position correctly

---

#### C3. Department Branding
**Files:** Multiple
**Current:** Generic "VANTUS" branding
**Action Required:**
- [ ] Get department logo
- [ ] Get department colors
- [ ] Update app name/title
- [ ] Update dashboard header
- [ ] Update admin portal
- [ ] Replace "VANTUS" with department name
- [ ] Update CSS color variables

**Files to Modify:**
- `vantus-app/App.js` - App title
- `vantus-dashboard/pages/index.tsx` - Dashboard title
- `vantus-admin/app/page.tsx` - Admin title
- All CSS files for colors

---

### BASELINE CALIBRATION

#### B1. Persistent Baseline Storage ⚠️ CRITICAL
**File:** `vantus-app/services/baselineCalibration.js`
**Line:** 10
**Current:** `this.baselines = new Map(); // In-memory storage`
**Action Required:**
- [ ] Design database schema for baselines
- [ ] Create baseline storage tables
- [ ] Implement database read/write functions
- [ ] Replace Map() with database calls
- [ ] Test baseline persistence
- [ ] Test baseline retrieval
- [ ] Test baseline updates
- [ ] Implement baseline backup/restore
- [ ] Test baseline migration (if needed)

**Database Schema:**
```sql
CREATE TABLE officer_baselines (
  id TEXT PRIMARY KEY,
  officer_id TEXT NOT NULL,
  context_key TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  last_updated TIMESTAMP,
  data_points INTEGER,
  UNIQUE(officer_id, context_key, metric_name)
);

CREATE INDEX idx_officer_context ON officer_baselines(officer_id, context_key);
```

---

#### B2. Sample Baseline Data Generation
**Action Required:**
- [ ] Collect 2-4 weeks of officer activity data
- [ ] Minimum 5-10 officers
- [ ] All contexts represented (on foot, vehicle, day, night)
- [ ] Various operational contexts
- [ ] Generate baseline metrics from data
- [ ] Validate baselines are reasonable
- [ ] Import baselines into system
- [ ] Test signal generation with sample baselines

**Data Collection Requirements:**
- GPS tracks
- Movement patterns
- Audio transcripts (if available)
- Marker events
- Session durations

---

#### B3. Baseline Threshold Tuning
**File:** `vantus-app/services/baselineCalibration.js`
**Action Required:**
- [ ] Review vehicle detection threshold (line 87: `avgSpeed > 5`)
  - [ ] Is 5 m/s (~18 km/h) appropriate for client's vehicles?
  - [ ] Test with real vehicle data
  - [ ] Adjust if needed
- [ ] Review day/night boundaries (line 75: `getTimeOfDay()`)
  - [ ] Are 6am-6pm boundaries appropriate?
  - [ ] Consider shift patterns
  - [ ] Adjust if needed
- [ ] Review context segmentation
  - [ ] Test context detection accuracy
  - [ ] Verify contexts switch correctly

---

### MODEL TRAINING & INTEGRATION

#### M1. Weapon Detection Model (YOLOv8-nano) ⚠️ CRITICAL
**File:** `vantus-app/services/multiModelDetection.js`
**Line:** 63-80 (placeholder function)
**Action Required:**

**Training Data Collection:**
- [ ] Handgun: Collect 5,000+ images
  - [ ] Various angles
  - [ ] Various lighting
  - [ ] Various backgrounds
  - [ ] Different handgun types
- [ ] Rifle/Shotgun: Collect 2,000+ images
- [ ] Knife/Blade: Collect 3,000+ images
- [ ] Blunt weapon: Collect 1,000+ images
- [ ] Negative examples: Collect 10,000+ images
  - [ ] Phones
  - [ ] Wallets
  - [ ] Keys
  - [ ] Tools
  - [ ] Empty hands

**Annotation:**
- [ ] Annotate all images in YOLO format
- [ ] Quality control review
- [ ] Verify annotation accuracy

**Training:**
- [ ] Split data: 80% train, 10% val, 10% test
- [ ] Train YOLOv8-nano model
- [ ] Validate accuracy (target: >85% mAP)
- [ ] Test on unseen data
- [ ] Adjust hyperparameters if needed

**Conversion:**
- [ ] Convert to TensorFlow.js format
- [ ] Optimize for mobile (quantization)
- [ ] Test inference speed
- [ ] Verify model size (<50MB)

**Integration:**
- [ ] Update `modelLoader.js` with model path
- [ ] Uncomment `runWeaponDetection()` in `multiModelDetection.js`
- [ ] Replace placeholder with actual inference code
- [ ] Test detection accuracy
- [ ] Adjust confidence threshold if needed (currently 70%)

**Testing:**
- [ ] Test with real weapon images (safely)
- [ ] Test with negative examples
- [ ] Verify false positive rate acceptable
- [ ] Test on target devices
- [ ] Verify battery impact acceptable

---

#### M2. Stance Detection (MoveNet + Custom Logic) ⚠️ CRITICAL
**File:** `vantus-app/services/multiModelDetection.js`
**Line:** 136-160 (placeholder)
**Action Required:**

**MoveNet Integration:**
- [ ] Download MoveNet model (TensorFlow.js)
- [ ] Load model in `modelLoader.js`
- [ ] Test pose estimation (17 keypoints)
- [ ] Verify keypoint accuracy

**Custom Logic Development:**
- [ ] Collect training sequences:
  - [ ] Bladed stance: 500+ sequences
  - [ ] Fighting stance: 500+ sequences
  - [ ] Normal stance: 1,000+ sequences
- [ ] Analyze keypoint patterns
- [ ] Develop classification algorithm
- [ ] Implement `analyzeStance()` function
- [ ] Validate accuracy (target: >80%)

**Integration:**
- [ ] Update `runStanceDetection()` function
- [ ] Test on real video frames
- [ ] Adjust confidence threshold if needed (currently 65%)

---

#### M3. Hands Detection (MoveNet + Custom Logic) ⚠️ CRITICAL
**File:** `vantus-app/services/multiModelDetection.js`
**Line:** 219-243 (placeholder)
**Action Required:**

**Custom Logic Development:**
- [ ] Collect training sequences:
  - [ ] Hands hidden: 500+ sequences
  - [ ] Waistband reach: 500+ sequences
  - [ ] Normal hand positions: 1,000+ sequences
- [ ] Analyze hand keypoint patterns
- [ ] Implement proximity calculations
- [ ] Implement visibility detection
- [ ] Develop classification algorithm
- [ ] Implement `analyzeHands()` function
- [ ] Validate accuracy (target: >75%)

**Integration:**
- [ ] Update `runHandsDetection()` function
- [ ] Test on real video frames
- [ ] Adjust confidence threshold if needed (currently 60%)

---

#### M4. Audio Classification ⚠️ CRITICAL
**File:** `vantus-app/services/multiModelDetection.js`
**Line:** 371-395 (placeholder)
**Action Required:**

**Training Data Collection:**
- [ ] Aggressive vocal patterns: 2,000+ samples
- [ ] Screaming: 1,000+ samples
- [ ] Normal speech: 5,000+ samples
- [ ] Diverse speakers, environments, languages

**Feature Extraction:**
- [ ] Implement MFCC extraction
- [ ] Implement spectral features
- [ ] Implement prosodic features
- [ ] Test feature extraction

**Training:**
- [ ] Split data: 80% train, 10% val, 10% test
- [ ] Train audio classifier
- [ ] Validate accuracy (target: >80%)
- [ ] Convert to TensorFlow.js

**Integration:**
- [ ] Update `runAudioDetection()` function
- [ ] Implement `extractAudioFeatures()` function
- [ ] Test on real audio samples
- [ ] Adjust confidence threshold if needed (currently 70%)

---

#### M5. Biometric Detection (Wearable Integration) ⚠️ CRITICAL
**File:** `vantus-app/components/CalibrationScreen.js`
**Line:** 111 (simulated)
**Action Required:**

**Wearable Platform Selection:**
- [ ] Choose platform (Apple Watch, Android Wear, etc.)
- [ ] Get SDK documentation
- [ ] Test SDK availability

**Integration:**
- [ ] Implement wearable SDK
- [ ] Request permissions
- [ ] Subscribe to heart rate data
- [ ] Handle connection/disconnection
- [ ] Test real-time heart rate capture
- [ ] Test continuous monitoring

**Calibration:**
- [ ] Update `captureHeartRateBaseline()` to use real wearable
- [ ] Test baseline capture
- [ ] Verify accuracy

**Continuous Monitoring:**
- [ ] Update `App.js` to get real-time HR from wearable
- [ ] Test HR spike detection
- [ ] Validate 40% threshold with real data

**Files to Create/Modify:**
- Create: `vantus-app/services/wearableService.js`
- Modify: `vantus-app/components/CalibrationScreen.js`
- Modify: `vantus-app/App.js`

---

### INTEGRATION POINTS

#### I1. CAD System Integration ⚠️ CRITICAL
**File:** `bridge-server/server.js`
**Line:** 149 (EMERGENCY_DISPATCH handler)
**Action Required:**
- [ ] Get CAD API documentation
- [ ] Get API credentials
- [ ] Create `bridge-server/services/cadService.js`
- [ ] Implement authentication
- [ ] Implement dispatch payload sending
- [ ] Handle responses
- [ ] Implement error handling
- [ ] Implement retry logic
- [ ] Test with CAD system
- [ ] Verify dispatches are received

**CAD Service Structure:**
```javascript
// bridge-server/services/cadService.js
class CADService {
  async dispatchBackup(dispatchPayload) {
    // Send to CAD API
    // Handle response
    // Log result
  }
}
```

---

#### I2. Reverse Geocoding
**File:** `bridge-server/services/autoDispatch.js`
**Line:** 252 (address: null)
**Action Required:**
- [ ] Choose geocoding service
- [ ] Get API key
- [ ] Create `bridge-server/services/geocodingService.js`
- [ ] Implement reverse geocoding
- [ ] Add caching (reduce API calls)
- [ ] Update dispatch payload to include address
- [ ] Test geocoding accuracy

---

#### I3. Video Recording
**File:** `vantus-app/services/videoBuffer.js`
**Line:** 52 (placeholder)
**Action Required:**
- [ ] Implement actual video recording
  - [ ] Use `expo-av` Recording API
  - [ ] Or native recording API
- [ ] Test 30-second buffer recording
- [ ] Test 30-second post-trigger recording
- [ ] Implement video combining (FFmpeg)
- [ ] Test video quality
- [ ] Test file sizes
- [ ] Verify clips are 60 seconds total

---

#### I4. Video Encryption
**File:** `vantus-app/services/videoBuffer.js`
**Line:** 131 (placeholder encryption)
**Action Required:**
- [ ] Implement AES-256 encryption
- [ ] Test encryption/decryption
- [ ] Implement secure key management
- [ ] Test key storage
- [ ] Verify encrypted files cannot be read without key

---

#### I5. Voice Recognition
**File:** `vantus-app/services/welfareCheck.js`
**Action Required:**
- [ ] Choose voice recognition service
- [ ] Implement "Officer down" detection
- [ ] Implement "I'm okay" response detection
- [ ] Test keyword detection accuracy
- [ ] Test background audio processing

---

## 🟡 IMPORTANT - SHOULD COMPLETE

### DATA & SAMPLE DATA

#### D1. Sample Baseline Data
- [ ] Generate 2-4 weeks of sample data
- [ ] Import into baseline storage
- [ ] Verify baselines are reasonable
- [ ] Test signal generation

#### D2. Test Officer Accounts
- [ ] Create 5-10 test officers
- [ ] Assign test badge numbers
- [ ] Create test PINs (document securely)
- [ ] Populate test data

---

### SECURITY

#### S1. PIN Security
- [ ] Implement PIN hashing
- [ ] Never store plain text
- [ ] Test PIN verification

#### S2. Data Encryption
- [ ] Encrypt calibration data
- [ ] Encrypt audio transcripts
- [ ] Encrypt video clips
- [ ] Test encryption

#### S3. Secure Storage
- [ ] Implement keychain/keystore
- [ ] Test secure storage
- [ ] Verify keys are secure

---

## 🟢 NICE-TO-HAVE

### Documentation
- [ ] Update all docs with client examples
- [ ] Create client-specific training materials

### Performance
- [ ] Optimize model inference
- [ ] Optimize database queries
- [ ] Load testing

---

## QUICK REFERENCE: SEARCH & REPLACE

### Find All Hardcoded Values

```bash
# Demo badge numbers
grep -r "12345\|67890\|11111\|22222" vantus/

# Localhost URLs
grep -r "localhost\|127.0.0.1" vantus/

# Winnipeg coordinates
grep -r "49.8951\|-97.1384" vantus/

# OFFICER_ prefix
grep -r "OFFICER_\${" vantus/

# TODO comments (model integration)
grep -r "TODO.*model\|TODO.*integrate" vantus/

# Placeholder comments
grep -r "placeholder\|simulated\|demo" vantus/ -i
```

---

## CONFIGURATION FILE SETUP

**Create:** `vantus/config/client-config.js` (use template)

**Steps:**
1. Copy `config/client-config.template.js` to `config/client-config.js`
2. Fill in all client-specific values
3. Update all files to import from `client-config.js`
4. Test configuration loading
5. Verify all hardcoded values replaced

---

## ESTIMATED EFFORT BY CATEGORY

| Category | Items | Estimated Time |
|----------|-------|----------------|
| Authentication | 3 | 1 week |
| Configuration | 3 | 2-3 days |
| Baseline Storage | 3 | 1 week |
| Model Training | 5 | 4-6 weeks |
| Integration | 5 | 2-3 weeks |
| Security | 3 | 1 week |
| Testing | Multiple | 1-2 weeks |
| **TOTAL** | **25+** | **7-11 weeks** |

---

## PRIORITY ORDER

1. **Week 1-2:** Authentication & Configuration
2. **Week 3-4:** Baseline Storage & Sample Data
3. **Week 5-10:** Model Training (can overlap with other work)
4. **Week 11-13:** Integration Development
5. **Week 14:** Testing & Validation
6. **Week 15:** Final Configuration & Deployment Prep

---

**⚠️ DO NOT PROCEED TO CLIENT SIGNUP UNTIL ALL CRITICAL ITEMS COMPLETE**

**Last Updated:** [Date]
**Status:** In Progress
