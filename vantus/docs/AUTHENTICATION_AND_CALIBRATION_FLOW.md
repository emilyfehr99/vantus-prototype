# Authentication & Calibration Flow

## ✅ Implementation Complete

The Vantus mobile app now includes a complete authentication and calibration flow before officers can begin their shift.

---

## Flow Overview

### 1. Officer Opens App at Start of Shift ✅

**Implementation:** App starts in authentication mode

**File:** `vantus-app/App.js`

---

### 2. Enters Badge Number + PIN (or Biometric) ✅

**Implementation:** `AuthenticationScreen` component

**Features:**
- Badge number input (numeric keyboard)
- PIN input (secure text entry)
- Biometric authentication option (Face ID / Touch ID / Fingerprint)
- Automatic detection of biometric availability

**File:** `vantus-app/components/AuthenticationScreen.js`

**Demo Badge Numbers:**
- 12345
- 67890
- 11111
- 22222

---

### 3. App Confirms Identity with Department Roster ✅

**Implementation:** Identity verification function

**Current Behavior:**
- Validates badge number against demo roster
- Verifies PIN (if not using biometric)
- In production, would call department roster API

**File:** `vantus-app/components/AuthenticationScreen.js` - `verifyIdentity()` function

**Production Requirements:**
- Integrate with department authentication system
- Secure API endpoint for roster lookup
- Token-based authentication

---

### 4. 30-Second Calibration Begins ✅

**Implementation:** `CalibrationScreen` component

**Calibration Steps:**

#### Step 1: Stand Still (0-10 seconds)
- **Instruction:** "Stand still and breathe normally"
- **Purpose:** Prepare officer for baseline capture

#### Step 2: Heart Rate Baseline (10-20 seconds)
- **Instruction:** "Capturing resting heart rate..."
- **Duration:** 10 seconds
- **Implementation:** 
  - Checks for wearable device connection
  - Collects heart rate samples
  - Calculates average resting heart rate
  - **Note:** Currently simulated (requires wearable SDK integration)

#### Step 3: Audio Baseline (20-25 seconds)
- **Instruction:** "Capturing ambient audio levels..."
- **Duration:** 5 seconds
- **Implementation:**
  - Requests audio permissions
  - Records ambient audio
  - Captures background noise level
  - Stores baseline for future comparison

#### Step 4: Lighting Baseline (25-30 seconds)
- **Instruction:** "Capturing lighting conditions..."
- **Duration:** 5 seconds
- **Implementation:**
  - Uses camera to detect lighting conditions
  - Captures ambient light level
  - Stores baseline for context awareness

**File:** `vantus-app/components/CalibrationScreen.js`

**Visual Feedback:**
- Progress bar showing 30-second countdown
- Step-by-step instructions
- Real-time status updates
- Countdown timer

---

### 5. Calibration Complete → "Vantus Active. Stay safe." ✅

**Implementation:** Completion alert and transition to standby mode

**Message Display:**
- Alert dialog: "Calibration Complete"
- Message: "Vantus Active. Stay safe."
- Automatic transition to standby mode

**Calibration Data Stored:**
```javascript
{
  badgeNumber: "12345",
  timestamp: "2024-01-01T12:00:00Z",
  heartRateBaseline: 68, // bpm (if wearable connected)
  audioBaseline: true,   // captured
  lightingBaseline: true // captured
}
```

---

### 6. App Enters Standby Mode ✅

**Implementation:** Standby screen with session start button

**Features:**
- Displays "VANTUS ACTIVE" message
- Shows officer badge number
- "Stay safe." message
- "Standby Mode" status indicator
- "START SESSION" button

**File:** `vantus-app/App.js` - Standby mode rendering

**User Action:**
- Officer clicks "START SESSION" to begin active monitoring
- Session starts with telemetry logging
- Baseline-relative signal generation begins

---

## Component Files

### 1. AuthenticationScreen.js
**Location:** `vantus-app/components/AuthenticationScreen.js`

**Props:**
- `onAuthenticated(badgeNumber)` - Callback when authentication succeeds

**Features:**
- Badge number input
- PIN input (optional if using biometric)
- Biometric authentication toggle
- Department roster verification
- Loading states

---

### 2. CalibrationScreen.js
**Location:** `vantus-app/components/CalibrationScreen.js`

**Props:**
- `badgeNumber` - Officer's badge number
- `onCalibrationComplete(calibrationData)` - Callback when calibration finishes

**Features:**
- 30-second calibration process
- Step-by-step instructions
- Progress bar and countdown
- Heart rate baseline capture
- Audio baseline capture
- Lighting baseline capture
- Real-time status updates

---

## App Flow States

The app now has four distinct modes:

1. **`auth`** - Authentication screen
2. **`calibration`** - Calibration screen
3. **`standby`** - Standby mode (ready to start session)
4. **`active`** - Active session (monitoring and telemetry)

**State Management:** `appMode` state variable in `App.js`

---

## Integration Points

### Department Roster API (Production)

**Current:** Demo validation with hardcoded badge numbers

**Production Requirements:**
```javascript
// Example API call
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
    "department": "Patrol",
    "rank": "Officer"
  }
}
```

---

### Wearable Device Integration (Production)

**Current:** Simulated heart rate capture

**Production Requirements:**
- Apple HealthKit integration (iOS)
- Google Fit integration (Android)
- Third-party wearable SDKs (Fitbit, Garmin, etc.)

**Example Integration:**
```javascript
// iOS HealthKit
import HealthKit from 'react-native-health';

const heartRate = await HealthKit.getHeartRateSamples({
  startDate: new Date(Date.now() - 10000),
  endDate: new Date(),
});
```

---

## Security Considerations

### Authentication
- ✅ Badge number validation
- ✅ PIN verification (or biometric)
- ✅ Department roster confirmation
- ⚠️ **Production:** Add secure token storage
- ⚠️ **Production:** Add session timeout
- ⚠️ **Production:** Add biometric fallback

### Calibration Data
- ✅ Stored locally (in-memory)
- ⚠️ **Production:** Encrypt calibration data
- ⚠️ **Production:** Store in secure keychain/keystore
- ⚠️ **Production:** Sync with backend (optional)

---

## Testing Checklist

- [x] Authentication screen displays on app start
- [x] Badge number input works
- [x] PIN input works (secure text entry)
- [x] Biometric authentication available check
- [x] Biometric authentication flow
- [x] Department roster verification (demo)
- [x] Calibration screen displays after authentication
- [x] 30-second calibration countdown
- [x] Heart rate baseline capture (simulated)
- [x] Audio baseline capture
- [x] Lighting baseline capture
- [x] Calibration completion message
- [x] Standby mode display
- [x] Session start from standby mode
- [ ] Production: Real department roster API
- [ ] Production: Real wearable device integration
- [ ] Production: Secure data storage

---

## Dependencies Added

```json
{
  "expo-local-authentication": "~13.0.1",  // Biometric auth
  "expo-sensors": "~12.7.1"              // Heart rate (future)
}
```

---

## User Experience Flow

1. **Officer opens app** → Authentication screen
2. **Enters badge + PIN** → Identity verification
3. **Verification success** → Calibration screen
4. **30-second calibration** → Progress shown, baselines captured
5. **Calibration complete** → "Vantus Active. Stay safe." alert
6. **Standby mode** → Ready to start session
7. **Start session** → Active monitoring begins

---

## Production Enhancements Needed

1. **Department Roster Integration**
   - Real API endpoint
   - Secure authentication
   - Token management

2. **Wearable Device Integration**
   - HealthKit / Google Fit
   - Third-party SDKs
   - Permission handling

3. **Secure Storage**
   - Encrypted calibration data
   - Secure keychain/keystore
   - Session token management

4. **Error Handling**
   - Network failures
   - Device permission denials
   - Calibration failures

5. **Offline Support**
   - Cached authentication
   - Offline calibration
   - Sync when online

---

**Status:** ✅ Core flow implemented and ready for testing

**Next Steps:** Integrate with production APIs and wearable devices
