# Client Data Requirements - What to Collect Before Signup

**Purpose:** List of all data, information, and assets needed from client before onboarding can begin.

---

## 1. DEPARTMENT INFORMATION

### Basic Info
- [ ] **Department Name** (full official name)
- [ ] **Department Abbreviation** (e.g., "WVPS", "NYPD")
- [ ] **Department ID** (unique identifier)
- [ ] **Jurisdiction** (city, state/province, country)
- [ ] **Primary Operations Center Address**
- [ ] **Contact Information**
  - [ ] Primary contact name
  - [ ] Email
  - [ ] Phone
  - [ ] Technical contact (if different)

### Officer Information
- [ ] **Total Number of Officers**
- [ ] **Officer ID Format** (e.g., "WVPS-4472", "NYPD-12345")
- [ ] **Badge Number Format** (numeric, alphanumeric, length)
- [ ] **PIN Requirements** (length, complexity rules)
- [ ] **Officer Metadata Fields Needed:**
  - [ ] Full name
  - [ ] Unit/division
  - [ ] Rank
  - [ ] Hire date
  - [ ] Active status

---

## 2. INFRASTRUCTURE & SERVERS

### Server Requirements
- [ ] **Bridge Server Hosting Preference**
  - [ ] Cloud provider (AWS, Azure, GCP)
  - [ ] On-premises
  - [ ] Hybrid
- [ ] **Domain/Hostname** for bridge server
- [ ] **SSL Certificate** (or preference for certificate management)
- [ ] **Database Preference**
  - [ ] PostgreSQL
  - [ ] MongoDB
  - [ ] SQL Server
  - [ ] Other
- [ ] **File Storage** (for video clips)
  - [ ] Cloud storage (S3, Azure Blob, etc.)
  - [ ] On-premises storage
  - [ ] Storage capacity requirements

### Network & Security
- [ ] **Firewall Rules** (if on-premises)
- [ ] **VPN Requirements** (if needed)
- [ ] **IP Whitelisting** (if required)
- [ ] **Security Compliance Requirements**
  - [ ] SOC 2
  - [ ] HIPAA
  - [ ] PCI DSS
  - [ ] Other

---

## 3. INTEGRATION REQUIREMENTS

### CAD System
- [ ] **CAD System Type** (e.g., Spillman, Versaterm, etc.)
- [ ] **CAD API Documentation**
- [ ] **CAD API Endpoints**
- [ ] **CAD Authentication Method**
  - [ ] API Key
  - [ ] OAuth
  - [ ] Certificate
  - [ ] Other
- [ ] **CAD API Credentials** (secure storage method)
- [ ] **CAD Dispatch Payload Format** (verify matches our format)
- [ ] **CAD Test Environment** (for integration testing)

### Department Roster System
- [ ] **Roster System Type** (custom, commercial, etc.)
- [ ] **Roster API Documentation**
- [ ] **Roster API Endpoints**
- [ ] **Roster Authentication Method**
- [ ] **Roster API Credentials**
- [ ] **Roster Data Format**
- [ ] **Roster Update Frequency** (real-time, batch, etc.)

### Geocoding Service
- [ ] **Preference:**
  - [ ] Google Maps Geocoding API
  - [ ] OpenStreetMap Nominatim
  - [ ] Department's own service
  - [ ] Other
- [ ] **API Credentials** (if commercial service)

### Wearable Devices
- [ ] **Wearable Platform Preference:**
  - [ ] Apple Watch (HealthKit)
  - [ ] Android Wear (Google Fit)
  - [ ] Fitbit
  - [ ] Garmin
  - [ ] Other
- [ ] **Device Models** (specific models used)
- [ ] **Device Distribution** (all officers, select units, etc.)
- [ ] **Heart Rate Data Access** (permissions, APIs)

---

## 4. OPERATIONAL DATA

### Operational Contexts
- [ ] **List of Marker Event Types Used:**
  - [ ] Traffic stop
  - [ ] Checkpoint
  - [ ] Suspicious activity
  - [ ] Welfare check
  - [ ] Backup requested
  - [ ] Other (specify)
- [ ] **Expected Durations for Each Event Type:**
  - [ ] Traffic stop: ___ minutes (average)
  - [ ] Checkpoint: ___ minutes (average)
  - [ ] Other: ___ minutes (average)

### Shift Patterns
- [ ] **Day Shift Hours** (start/end)
- [ ] **Night Shift Hours** (start/end)
- [ ] **Shift Rotation Schedule** (if applicable)
- [ ] **Weekend/Holiday Patterns**

### Vehicle Types
- [ ] **Types of Vehicles Used:**
  - [ ] Patrol cars
  - [ ] Motorcycles
  - [ ] Bicycles
  - [ ] On foot
  - [ ] Other
- [ ] **Typical Speeds:**
  - [ ] On foot: ___ km/h average
  - [ ] In vehicle: ___ km/h average
  - [ ] (Used to tune vehicle detection threshold)

---

## 5. BASELINE CALIBRATION DATA

### Sample Activity Data
- [ ] **2-4 Weeks of Historical Data** (if available)
  - [ ] GPS tracks
  - [ ] Movement patterns
  - [ ] Session durations
  - [ ] Marker events
- [ ] **Minimum 5-10 Officers** for baseline generation
- [ ] **All Contexts Represented:**
  - [ ] On foot patrols
  - [ ] Vehicle patrols
  - [ ] Day shifts
  - [ ] Night shifts
  - [ ] Various operational contexts

### Baseline Validation
- [ ] **Typical Speed Ranges** (for validation)
- [ ] **Typical Stop Durations** (for validation)
- [ ] **Typical Routine Durations** (for validation)

---

## 6. MODEL TRAINING DATA

### Weapon Detection Training Images
- [ ] **Handgun Images:** 5,000+ needed
  - [ ] Can provide: Yes/No
  - [ ] Source: Department photos, training materials, etc.
- [ ] **Rifle/Shotgun Images:** 2,000+ needed
- [ ] **Knife/Blade Images:** 3,000+ needed
- [ ] **Blunt Weapon Images:** 1,000+ needed
- [ ] **Negative Examples:** 10,000+ needed
  - [ ] Phones, wallets, keys, tools, empty hands

### Stance Detection Training Sequences
- [ ] **Bladed Stance:** 500+ sequences
- [ ] **Fighting Stance:** 500+ sequences
- [ ] **Normal Stance:** 1,000+ sequences

### Hands Detection Training Sequences
- [ ] **Hands Hidden:** 500+ sequences
- [ ] **Waistband Reach:** 500+ sequences
- [ ] **Normal Hand Positions:** 1,000+ sequences

### Audio Classification Training Samples
- [ ] **Aggressive Vocal Patterns:** 2,000+ samples
- [ ] **Screaming:** 1,000+ samples
- [ ] **Normal Speech:** 5,000+ samples

**Note:** If client cannot provide training data, we'll need to:
- Use public datasets (Open Images, COCO)
- Collect data during pilot phase
- Use synthetic data generation

---

## 7. BRANDING ASSETS

### Visual Assets
- [ ] **Department Logo**
  - [ ] High-resolution PNG/SVG
  - [ ] Transparent background preferred
  - [ ] Multiple sizes (icon, standard, large)
- [ ] **Color Scheme:**
  - [ ] Primary color (hex code)
  - [ ] Secondary color (hex code)
  - [ ] Accent colors (if any)
- [ ] **App Icon** (if custom design needed)
- [ ] **Splash Screen Image** (if custom design needed)

### Branding Guidelines
- [ ] **Department Name Usage** (full name vs abbreviation)
- [ ] **Naming Preferences** (e.g., "Vantus" vs department-specific name)
- [ ] **Style Guide** (if available)

---

## 8. COMPLIANCE & LEGAL

### Compliance Requirements
- [ ] **Data Retention Policy**
  - [ ] Required retention period
  - [ ] Legal requirements
  - [ ] Department policies
- [ ] **Privacy Requirements**
  - [ ] Local privacy laws
  - [ ] Department privacy policies
  - [ ] Data sharing restrictions
- [ ] **Audit Requirements**
  - [ ] Audit log retention
  - [ ] Audit log format
  - [ ] Export requirements

### Legal Documents
- [ ] **Data Processing Agreement** (if required)
- [ ] **Service Level Agreement** (SLA requirements)
- [ ] **Liability Requirements**
- [ ] **Insurance Requirements**

---

## 9. TESTING REQUIREMENTS

### Test Environment
- [ ] **Test Server Access** (if on-premises)
- [ ] **Test CAD System Access**
- [ ] **Test Roster System Access**
- [ ] **Test Devices:**
  - [ ] iOS devices (models, iOS versions)
  - [ ] Android devices (models, Android versions)
  - [ ] Wearable devices (models)

### Test Data
- [ ] **Test Officer Accounts** (5-10 officers)
- [ ] **Test Badge Numbers**
- [ ] **Test PINs** (document securely)
- [ ] **Test Scenarios** (specific use cases to test)

---

## 10. TRAINING & SUPPORT

### Training Requirements
- [ ] **Number of Officers to Train**
- [ ] **Number of Supervisors to Train**
- [ ] **Number of Administrators to Train**
- [ ] **Training Schedule Preferences**
- [ ] **Training Materials Needed:**
  - [ ] User manuals
  - [ ] Video tutorials
  - [ ] Quick reference guides

### Support Requirements
- [ ] **Support Contact Method** (email, phone, ticket system)
- [ ] **Support Hours** (business hours, 24/7, etc.)
- [ ] **Escalation Process**
- [ ] **Emergency Contact** (for critical issues)

---

## 11. DEPLOYMENT PREFERENCES

### Deployment Timeline
- [ ] **Desired Go-Live Date**
- [ ] **Pilot Phase Duration** (if applicable)
- [ ] **Rollout Strategy** (all at once, phased, etc.)

### Deployment Approach
- [ ] **Mobile App Distribution:**
  - [ ] App Store (iOS)
  - [ ] Play Store (Android)
  - [ ] Enterprise distribution
  - [ ] MDM (Mobile Device Management)
- [ ] **Dashboard/Admin Access:**
  - [ ] Public URL
  - [ ] VPN access
  - [ ] Internal network only

---

## 12. CUSTOMIZATION REQUIREMENTS

### Custom Features
- [ ] **Additional Marker Event Types** (beyond standard)
- [ ] **Custom Signal Types** (if needed)
- [ ] **Custom Reports** (if needed)
- [ ] **Custom Integrations** (beyond CAD/roster)

### Workflow Customization
- [ ] **Approval Workflows** (if needed)
- [ ] **Notification Preferences**
- [ ] **Alert Thresholds** (if different from defaults)

---

## DATA COLLECTION TEMPLATE

Use this template when meeting with client:

```markdown
# Client Data Collection - [Department Name]

## Department Info
- Name: ___________
- Abbreviation: ___________
- Jurisdiction: ___________

## Officer Info
- Total Officers: ___________
- ID Format: ___________
- Badge Format: ___________

## Infrastructure
- Server Preference: ___________
- Database: ___________

## Integrations
- CAD System: ___________
- Roster System: ___________
- Wearable: ___________

## Operations
- Marker Events: ___________
- Shift Hours: ___________

## Training Data
- Can Provide: Yes/No
- Available: ___________

## Timeline
- Go-Live Date: ___________
- Pilot Duration: ___________
```

---

## PRIORITY ORDER FOR DATA COLLECTION

1. **Week 1:** Department info, infrastructure preferences
2. **Week 1:** Integration requirements (CAD, roster APIs)
3. **Week 2:** Operational data, shift patterns
4. **Week 2:** Branding assets
5. **Week 3:** Training data availability
6. **Week 3:** Compliance requirements
7. **Week 4:** Testing requirements, deployment preferences

---

**ACTION:** Schedule client meeting to collect all above information before starting development work.
