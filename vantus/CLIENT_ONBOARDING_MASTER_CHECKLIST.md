# Client Onboarding Master Checklist

**⚠️ DO NOT SIGN CLIENT #1 UNTIL ALL ITEMS BELOW ARE COMPLETE**

This is your master checklist. Every single item must be checked off before client signup.

---

## 📊 PROGRESS TRACKER

**Total Items:** 100+  
**Critical Items:** 25  
**Important Items:** 40  
**Nice-to-Have Items:** 35+

**Current Status:** 🔴 **NOT READY FOR CLIENT**

---

## 🔴 CRITICAL PATH (Must Complete)

### PHASE 1: Authentication & Identity (Week 1)

- [ ] **A1.1** Remove demo badge numbers (`AuthenticationScreen.js:52`)
- [ ] **A1.2** Create department roster API integration
- [ ] **A1.3** Implement secure PIN hashing
- [ ] **A1.4** Test authentication with real badge numbers
- [ ] **A1.5** Replace `OFFICER_${badgeNumber}` format (15+ instances)
- [ ] **A1.6** Get officer metadata (name, unit) from roster
- [ ] **A1.7** Update all officer ID references

**Files:** `AuthenticationScreen.js`, `App.js`, all service files

---

### PHASE 2: Configuration (Week 1-2)

- [ ] **C2.1** Replace `localhost:3001` URLs (3 files)
- [ ] **C2.2** Set up production bridge server
- [ ] **C2.3** Configure SSL/HTTPS
- [ ] **C2.4** Replace Winnipeg GPS coordinates (2 files)
- [ ] **C2.5** Update map center for client jurisdiction
- [ ] **C2.6** Replace "VANTUS" branding with client name
- [ ] **C2.7** Update department colors/logos
- [ ] **C2.8** Create `client-config.js` from template
- [ ] **C2.9** Import config in all files

**Files:** `App.js`, `index.tsx`, `AnalyticsDashboard.tsx`, all branding files

---

### PHASE 3: Baseline Storage (Week 2)

- [ ] **B3.1** Design baseline database schema
- [ ] **B3.2** Create baseline tables
- [ ] **B3.3** Replace `Map()` with database calls
- [ ] **B3.4** Implement baseline persistence
- [ ] **B3.5** Test baseline save/load
- [ ] **B3.6** Generate 2-4 weeks sample baseline data
- [ ] **B3.7** Import sample baselines
- [ ] **B3.8** Validate baseline quality
- [ ] **B3.9** Test signal generation with baselines

**Files:** `baselineCalibration.js`, database schema

---

### PHASE 4: Model Training (Weeks 3-8) ⚠️ LONGEST PHASE

#### Weapon Detection Model
- [ ] **M4.1** Collect 5,000+ handgun images
- [ ] **M4.2** Collect 2,000+ rifle/shotgun images
- [ ] **M4.3** Collect 3,000+ knife/blade images
- [ ] **M4.4** Collect 1,000+ blunt weapon images
- [ ] **M4.5** Collect 10,000+ negative examples
- [ ] **M4.6** Annotate all images (YOLO format)
- [ ] **M4.7** Train YOLOv8-nano model
- [ ] **M4.8** Validate accuracy (>85% mAP)
- [ ] **M4.9** Convert to TensorFlow.js
- [ ] **M4.10** Optimize for mobile
- [ ] **M4.11** Update model path in `modelLoader.js`
- [ ] **M4.12** Implement `runWeaponDetection()`
- [ ] **M4.13** Test detection accuracy
- [ ] **M4.14** Adjust confidence threshold if needed

#### Stance Detection Model
- [ ] **M4.15** Collect 500+ bladed stance sequences
- [ ] **M4.16** Collect 500+ fighting stance sequences
- [ ] **M4.17** Collect 1,000+ normal stance sequences
- [ ] **M4.18** Load MoveNet model
- [ ] **M4.19** Develop custom stance logic
- [ ] **M4.20** Implement `analyzeStance()`
- [ ] **M4.21** Implement `runStanceDetection()`
- [ ] **M4.22** Test stance detection accuracy

#### Hands Detection Model
- [ ] **M4.23** Collect 500+ hands hidden sequences
- [ ] **M4.24** Collect 500+ waistband reach sequences
- [ ] **M4.25** Collect 1,000+ normal hand sequences
- [ ] **M4.26** Develop custom hands logic
- [ ] **M4.27** Implement `analyzeHands()`
- [ ] **M4.28** Implement `runHandsDetection()`
- [ ] **M4.29** Test hands detection accuracy

#### Audio Classification Model
- [ ] **M4.30** Collect 2,000+ aggressive audio samples
- [ ] **M4.31** Collect 1,000+ screaming samples
- [ ] **M4.32** Collect 5,000+ normal speech samples
- [ ] **M4.33** Implement feature extraction
- [ ] **M4.34** Train audio classifier
- [ ] **M4.35** Convert to TensorFlow.js
- [ ] **M4.36** Implement `extractAudioFeatures()`
- [ ] **M4.37** Implement `runAudioDetection()`
- [ ] **M4.38** Test audio classification accuracy

**Files:** `modelLoader.js`, `multiModelDetection.js`, training data

---

### PHASE 5: Wearable Integration (Week 3-4)

- [ ] **W5.1** Choose wearable platform
- [ ] **W5.2** Get SDK documentation
- [ ] **W5.3** Create `wearableService.js`
- [ ] **W5.4** Implement heart rate capture
- [ ] **W5.5** Update `CalibrationScreen.js` (remove simulation)
- [ ] **W5.6** Implement continuous HR monitoring
- [ ] **W5.7** Test real-time heart rate
- [ ] **W5.8** Validate 40% threshold with real data

**Files:** `CalibrationScreen.js`, `App.js`, new `wearableService.js`

---

### PHASE 6: Integration Development (Weeks 5-7)

#### CAD Integration
- [ ] **I6.1** Get CAD API documentation
- [ ] **I6.2** Get CAD API credentials
- [ ] **I6.3** Create `cadService.js`
- [ ] **I6.4** Implement authentication
- [ ] **I6.5** Implement dispatch sending
- [ ] **I6.6** Test with CAD system
- [ ] **I6.7** Verify dispatches received

#### Reverse Geocoding
- [ ] **I6.8** Choose geocoding service
- [ ] **I6.9** Create `geocodingService.js`
- [ ] **I6.10** Implement reverse geocoding
- [ ] **I6.11** Add caching
- [ ] **I6.12** Update dispatch payloads

#### Video Recording
- [ ] **I6.13** Implement video recording API
- [ ] **I6.14** Test 30-second buffer
- [ ] **I6.15** Test post-trigger recording
- [ ] **I6.16** Implement video combining (FFmpeg)
- [ ] **I6.17** Test video quality

#### Video Encryption
- [ ] **I6.18** Implement AES-256 encryption
- [ ] **I6.19** Implement key management
- [ ] **I6.20** Test encryption/decryption

#### Voice Recognition
- [ ] **I6.21** Choose voice recognition service
- [ ] **I6.22** Implement "Officer down" detection
- [ ] **I6.23** Implement "I'm okay" response

**Files:** `bridge-server/services/`, `videoBuffer.js`, `welfareCheck.js`

---

### PHASE 7: Testing & Validation (Week 8)

- [ ] **T7.1** End-to-end testing
- [ ] **T7.2** Model accuracy testing
- [ ] **T7.3** Integration testing
- [ ] **T7.4** Performance testing
- [ ] **T7.5** Security testing
- [ ] **T7.6** Load testing
- [ ] **T7.7** Device testing (iOS/Android)

---

### PHASE 8: Deployment Prep (Week 9)

- [ ] **D8.1** Set up production servers
- [ ] **D8.2** Configure databases
- [ ] **D8.3** Set up SSL certificates
- [ ] **D8.4** Build production mobile app
- [ ] **D8.5** Deploy dashboard
- [ ] **D8.6** Deploy admin portal
- [ ] **D8.7** Final configuration
- [ ] **D8.8** Documentation update

---

## 🟡 IMPORTANT ITEMS

### Data & Sample Data
- [ ] Create test officer accounts (5-10)
- [ ] Generate sample signals
- [ ] Populate test data
- [ ] Create baseline examples

### Security Enhancements
- [ ] Implement session management
- [ ] Add rate limiting
- [ ] Secure audit logs
- [ ] Role-based access control

### Customization
- [ ] Verify marker event types
- [ ] Set routine durations
- [ ] Customize voice messages (if needed)
- [ ] Adjust thresholds based on validation

---

## 📝 DETAILED CHECKLISTS

For detailed breakdowns, see:
1. **`CLIENT_ONBOARDING_CHECKLIST.md`** - Comprehensive checklist by category
2. **`CLIENT_ONBOARDING_CHECKLIST_DETAILED.md`** - Item-by-item breakdown
3. **`CLIENT_ONBOARDING_QUICK_REFERENCE.md`** - Quick search & replace guide

---

## 🎯 ESTIMATED TIMELINE

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Authentication & Config | 1-2 weeks | None |
| Baseline Storage | 1 week | Database setup |
| Model Training | 4-6 weeks | Data collection |
| Wearable Integration | 1-2 weeks | SDK availability |
| Integration Development | 2-3 weeks | API access |
| Testing | 1-2 weeks | All above |
| Deployment Prep | 1 week | Infrastructure |
| **TOTAL** | **11-17 weeks** | |

---

## ⚠️ BLOCKERS

These items block other work:

1. **Department Roster API** - Blocks authentication testing
2. **Model Training Data** - Blocks model integration
3. **CAD API Access** - Blocks dispatch testing
4. **Wearable SDK** - Blocks biometric testing
5. **Database Setup** - Blocks baseline persistence

**Action:** Get these items started ASAP as they have longest timelines.

---

## ✅ SIGN-OFF CHECKLIST

Before client signup, verify:

- [ ] All critical items complete
- [ ] All models trained and integrated
- [ ] All integrations working
- [ ] End-to-end testing passed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Client configuration applied
- [ ] Production infrastructure ready
- [ ] Support team trained
- [ ] Client approval received

---

## 📞 CLIENT REQUIREMENTS GATHERING

Before starting, gather from client:

1. **Department Info:**
   - [ ] Department name
   - [ ] Department abbreviation
   - [ ] Officer ID format
   - [ ] Jurisdiction boundaries

2. **Infrastructure:**
   - [ ] Server preferences
   - [ ] Database preferences
   - [ ] Security requirements

3. **Integration:**
   - [ ] CAD system type
   - [ ] CAD API documentation
   - [ ] Wearable device preferences
   - [ ] Existing systems to integrate

4. **Operations:**
   - [ ] Marker event types used
   - [ ] Typical routine durations
   - [ ] Shift patterns
   - [ ] Operational contexts

5. **Branding:**
   - [ ] Logo files
   - [ ] Color scheme
   - [ ] Naming preferences

---

**STATUS:** 🔴 **NOT READY** - Complete checklist before proceeding

**NEXT ACTION:** Start with Phase 1 (Authentication & Identity)
