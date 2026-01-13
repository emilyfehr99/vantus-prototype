# Client Onboarding Checklist - Notion Format

## AUTHENTICATION & IDENTITY

- [ ] Remove demo badge numbers from AuthenticationScreen.js (line 52)
- [ ] Create department roster API integration service
- [ ] Implement secure PIN hashing (bcrypt/argon2)
- [ ] Replace OFFICER_${badgeNumber} format with client format (15+ instances)
- [ ] Update all officer ID references in App.js
- [ ] Update all officer ID references in telemetryService.js
- [ ] Update all officer ID references in baselineCalibration.js
- [ ] Update all officer ID references in baselineRelativeSignals.js
- [ ] Update all officer ID references in multiModelDetection.js
- [ ] Update all officer ID references in bridge-server/server.js
- [ ] Get officer metadata (name, unit) from roster API
- [ ] Replace name: null with real officer names
- [ ] Replace unit: null with real officer units
- [ ] Test authentication with real badge numbers
- [ ] Test PIN verification
- [ ] Test failed authentication handling
- [ ] Implement account lockout after N failed attempts
- [ ] Test biometric authentication fallback

## CONFIGURATION & ENVIRONMENT

- [ ] Replace localhost:3001 in vantus-app/App.js (line 23)
- [ ] Replace localhost:3001 in vantus-dashboard/pages/index.tsx (line 6)
- [ ] Replace localhost:3001 in vantus-admin/components/AnalyticsDashboard.tsx (line 5)
- [ ] Set up production bridge server
- [ ] Configure SSL/HTTPS certificates
- [ ] Set up environment variables for all server URLs
- [ ] Replace Winnipeg GPS coordinates in App.js (line 26)
- [ ] Replace Winnipeg GPS coordinates in dashboard (lines 216-217)
- [ ] Update map center for client jurisdiction
- [ ] Adjust map projection scale if needed
- [ ] Replace "VANTUS" branding with client department name
- [ ] Update department colors in CSS files
- [ ] Add client logo to mobile app
- [ ] Add client logo to dashboard
- [ ] Add client logo to admin portal
- [ ] Create client-config.js from template
- [ ] Import config in all relevant files
- [ ] Test configuration loading

## BASELINE CALIBRATION

- [ ] Design baseline database schema
- [ ] Create baseline storage tables
- [ ] Replace Map() with database calls in baselineCalibration.js
- [ ] Implement baseline persistence functions
- [ ] Implement baseline retrieval functions
- [ ] Test baseline save/load
- [ ] Test baseline updates
- [ ] Implement baseline backup/restore
- [ ] Generate 2-4 weeks of sample baseline data
- [ ] Collect data from 5-10 officers minimum
- [ ] Include all contexts (on foot, vehicle, day, night)
- [ ] Include various operational contexts
- [ ] Import sample baselines into system
- [ ] Validate baseline quality
- [ ] Test signal generation with sample baselines
- [ ] Verify vehicle detection threshold (5 m/s) is appropriate
- [ ] Verify day/night boundaries (6am-6pm) match shift patterns
- [ ] Replace routine duration placeholder (300 seconds) with real calculation

## MODEL TRAINING - WEAPON DETECTION

- [ ] Collect 5,000+ handgun images
- [ ] Collect 2,000+ rifle/shotgun images
- [ ] Collect 3,000+ knife/blade images
- [ ] Collect 1,000+ blunt weapon images
- [ ] Collect 10,000+ negative examples (phones, wallets, etc.)
- [ ] Annotate all images in YOLO format
- [ ] Quality control review of annotations
- [ ] Split data: 80% train, 10% val, 10% test
- [ ] Train YOLOv8-nano model
- [ ] Validate accuracy (target: >85% mAP)
- [ ] Test on unseen data
- [ ] Convert model to TensorFlow.js format
- [ ] Optimize model for mobile (quantization)
- [ ] Test inference speed on target devices
- [ ] Verify model size (<50MB)
- [ ] Update model path in modelLoader.js
- [ ] Implement runWeaponDetection() function
- [ ] Replace placeholder with actual inference code
- [ ] Test detection accuracy with real images
- [ ] Adjust confidence threshold if needed (currently 70%)
- [ ] Test false positive rate
- [ ] Verify battery impact is acceptable

## MODEL TRAINING - STANCE DETECTION

- [ ] Collect 500+ bladed stance sequences
- [ ] Collect 500+ fighting stance sequences
- [ ] Collect 1,000+ normal stance sequences
- [ ] Download MoveNet model (TensorFlow.js)
- [ ] Load MoveNet model in modelLoader.js
- [ ] Test pose estimation (17 keypoints)
- [ ] Develop custom stance classification algorithm
- [ ] Analyze keypoint patterns for each stance type
- [ ] Implement analyzeStance() function
- [ ] Implement runStanceDetection() function
- [ ] Test stance detection accuracy
- [ ] Adjust confidence threshold if needed (currently 65%)
- [ ] Test on real video frames

## MODEL TRAINING - HANDS DETECTION

- [ ] Collect 500+ hands hidden sequences
- [ ] Collect 500+ waistband reach sequences
- [ ] Collect 1,000+ normal hand position sequences
- [ ] Develop custom hands classification algorithm
- [ ] Analyze hand keypoint patterns
- [ ] Implement proximity calculations (waistband)
- [ ] Implement visibility detection (hands hidden)
- [ ] Implement analyzeHands() function
- [ ] Implement runHandsDetection() function
- [ ] Test hands detection accuracy
- [ ] Adjust confidence threshold if needed (currently 60%)
- [ ] Test on real video frames

## MODEL TRAINING - AUDIO CLASSIFICATION

- [ ] Collect 2,000+ aggressive vocal pattern samples
- [ ] Collect 1,000+ screaming samples
- [ ] Collect 5,000+ normal speech samples
- [ ] Implement MFCC feature extraction
- [ ] Implement spectral feature extraction
- [ ] Implement prosodic feature extraction
- [ ] Split data: 80% train, 10% val, 10% test
- [ ] Train audio classifier model
- [ ] Validate accuracy (target: >80%)
- [ ] Convert model to TensorFlow.js format
- [ ] Implement extractAudioFeatures() function
- [ ] Implement runAudioDetection() function
- [ ] Test audio classification accuracy
- [ ] Adjust confidence threshold if needed (currently 70%)
- [ ] Test on real audio samples

## WEARABLE INTEGRATION

- [ ] Choose wearable platform (Apple Watch, Android Wear, etc.)
- [ ] Get wearable SDK documentation
- [ ] Create wearableService.js
- [ ] Implement heart rate capture from wearable
- [ ] Request wearable permissions
- [ ] Subscribe to heart rate data stream
- [ ] Handle wearable connection/disconnection
- [ ] Update CalibrationScreen.js to use real wearable (remove simulation)
- [ ] Test real-time heart rate capture during calibration
- [ ] Implement continuous heart rate monitoring in App.js
- [ ] Test continuous monitoring during sessions
- [ ] Validate 40% threshold with real heart rate data
- [ ] Test heart rate spike detection
- [ ] Verify battery impact is acceptable

## CAD SYSTEM INTEGRATION

- [ ] Get CAD system API documentation
- [ ] Get CAD API credentials
- [ ] Create bridge-server/services/cadService.js
- [ ] Implement CAD authentication
- [ ] Implement dispatch payload sending to CAD
- [ ] Handle CAD API responses
- [ ] Implement error handling for CAD failures
- [ ] Implement retry logic for failed dispatches
- [ ] Test CAD integration with test environment
- [ ] Verify dispatches are received by CAD system
- [ ] Test error scenarios (network failures, etc.)

## REVERSE GEOCODING

- [ ] Choose geocoding service (Google Maps, OSM, etc.)
- [ ] Get geocoding API key
- [ ] Create bridge-server/services/geocodingService.js
- [ ] Implement reverse geocoding function
- [ ] Add geocoding result caching
- [ ] Update autoDispatch.js to include address in payload
- [ ] Test geocoding accuracy
- [ ] Test geocoding error handling

## VIDEO RECORDING

- [ ] Implement actual video recording API (expo-av or native)
- [ ] Test 30-second rolling buffer recording
- [ ] Test 30-second post-trigger recording
- [ ] Implement video combining (FFmpeg or similar)
- [ ] Test combining pre + post trigger videos
- [ ] Verify total clip length is 60 seconds
- [ ] Test video quality (480p, 15 FPS)
- [ ] Test file sizes are reasonable
- [ ] Verify clips save to permanent storage

## VIDEO ENCRYPTION

- [ ] Implement AES-256 encryption for video clips
- [ ] Test encryption/decryption
- [ ] Implement secure key management
- [ ] Store keys in secure keychain/keystore
- [ ] Test key storage security
- [ ] Verify encrypted files cannot be read without key
- [ ] Test key rotation policy

## VOICE RECOGNITION

- [ ] Choose voice recognition service
- [ ] Implement "Officer down" keyword detection
- [ ] Implement "I'm okay" response detection
- [ ] Test keyword detection accuracy
- [ ] Test background audio processing
- [ ] Integrate with welfare check system

## DATA & SAMPLE DATA

- [ ] Create 5-10 test officer accounts
- [ ] Assign test badge numbers
- [ ] Create test PINs (document securely)
- [ ] Generate sample baseline data
- [ ] Generate sample signal data
- [ ] Populate test data in system
- [ ] Test dashboard with sample signals
- [ ] Test signal detail panes
- [ ] Test flagging functionality
- [ ] Test post-shift summaries

## SECURITY & COMPLIANCE

- [ ] Implement secure PIN storage (hashing)
- [ ] Never store plain text PINs
- [ ] Implement session management
- [ ] Add session expiration
- [ ] Implement rate limiting for login attempts
- [ ] Encrypt calibration data at rest
- [ ] Encrypt audio transcripts at rest
- [ ] Encrypt video clips at rest
- [ ] Implement secure storage (keychain/keystore)
- [ ] Secure audit logs (immutable, append-only)
- [ ] Implement audit log access controls
- [ ] Configure data retention policies
- [ ] Implement automatic data deletion
- [ ] Test secure deletion (overwrite)
- [ ] Implement role-based access control
- [ ] Define roles (officer, supervisor, admin)
- [ ] Test access controls for each role
- [ ] Security audit review

## OPERATIONAL CUSTOMIZATION

- [ ] Verify marker event types match client operations
- [ ] Add client-specific marker event types if needed
- [ ] Set expected durations for each event type
- [ ] Update routine duration calculations
- [ ] Verify shift patterns match day/night boundaries
- [ ] Customize voice advisory messages if needed
- [ ] Review all voice messages with client
- [ ] Update department-specific terminology

## TESTING

- [ ] End-to-end testing: Authentication → Calibration → Session → Dashboard
- [ ] Test complete officer flow
- [ ] Test supervisor dashboard flow
- [ ] Test admin portal flow
- [ ] Test weapon detection model accuracy
- [ ] Test stance detection model accuracy
- [ ] Test hands detection model accuracy
- [ ] Test audio classification model accuracy
- [ ] Test biometric detection accuracy
- [ ] Test false positive rates for all models
- [ ] Test CAD integration end-to-end
- [ ] Test wearable integration end-to-end
- [ ] Test video recording end-to-end
- [ ] Test video encryption/decryption
- [ ] Performance testing with 10+ concurrent officers
- [ ] Load testing with large baseline history
- [ ] Security testing
- [ ] Device testing (iOS and Android)
- [ ] Test on multiple device models
- [ ] Test on multiple iOS versions
- [ ] Test on multiple Android versions

## DEPLOYMENT PREPARATION

- [ ] Set up production bridge server hosting
- [ ] Set up production database hosting
- [ ] Set up file storage for video clips
- [ ] Configure SSL/TLS certificates
- [ ] Set up certificate auto-renewal
- [ ] Configure server monitoring
- [ ] Set up error tracking
- [ ] Set up performance monitoring
- [ ] Configure alerting
- [ ] Create production database schema
- [ ] Migrate baseline storage to database
- [ ] Test database migration
- [ ] Build production iOS app
- [ ] Build production Android app
- [ ] Configure app with production URLs
- [ ] Add client branding to app
- [ ] Test production app build
- [ ] Build production dashboard (Next.js)
- [ ] Deploy dashboard to hosting
- [ ] Build production admin portal
- [ ] Deploy admin portal to hosting
- [ ] Test production deployments
- [ ] Final configuration review

## DOCUMENTATION

- [ ] Update all documentation with client examples
- [ ] Replace demo examples with client examples
- [ ] Update department names in all docs
- [ ] Update officer ID formats in all docs
- [ ] Update coordinates/locations in all docs
- [ ] Create client-specific onboarding guide
- [ ] Create client-specific configuration guide
- [ ] Create officer training materials
- [ ] Create supervisor training materials
- [ ] Create admin training materials
- [ ] Create user manuals
- [ ] Create quick reference guides

## CLIENT DATA COLLECTION

- [ ] Get department name and abbreviation
- [ ] Get department jurisdiction boundaries
- [ ] Get officer ID format specification
- [ ] Get badge number format
- [ ] Get PIN requirements
- [ ] Get server hosting preferences
- [ ] Get database preferences
- [ ] Get CAD system type and API docs
- [ ] Get roster system API docs
- [ ] Get wearable device preferences
- [ ] Get marker event types used
- [ ] Get expected routine durations
- [ ] Get shift patterns
- [ ] Get department logo
- [ ] Get department color scheme
- [ ] Get data retention requirements
- [ ] Get compliance requirements
- [ ] Get training data availability
- [ ] Get go-live date
- [ ] Get pilot phase requirements

## FINAL SIGN-OFF

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
- [ ] No demo/placeholder data remaining
- [ ] All hardcoded values replaced
- [ ] All placeholder functions implemented
- [ ] Baseline storage persistent
- [ ] All API integrations tested
