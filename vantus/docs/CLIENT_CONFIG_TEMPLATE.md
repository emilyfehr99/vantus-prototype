# Client Configuration Template

**Purpose:** Template for configuring a new client. Copy and update values for each client.

---

## Mobile App Configuration

**File:** `vantus-app/utils/client-config.js`

```javascript
const CLIENT_CONFIG = {
  // Client Information
  department: {
    name: 'Winnipeg Police Service', // Replace with client name
    abbreviation: 'WPS', // Replace with client abbreviation
    jurisdiction: {
      center: {
        lat: 49.8951, // Replace with client jurisdiction center latitude
        lng: -97.1384, // Replace with client jurisdiction center longitude
      },
      bounds: {
        north: 49.95, // Replace with client jurisdiction bounds
        south: 49.85,
        east: -97.05,
        west: -97.25,
      },
    },
  },

  // Server URLs
  servers: {
    bridge: 'https://bridge.wps.vantus.com', // Replace with production URL
    dashboard: 'https://dashboard.wps.vantus.com',
    admin: 'https://admin.wps.vantus.com',
  },

  // Officer ID Format
  officerId: {
    format: 'WPS-{badge}', // Replace with client format (e.g., 'WPS-12345')
    prefix: 'WPS-',
    separator: '-',
  },

  // Authentication
  authentication: {
    useDemoBadges: false, // Set to false for production
    demoBadges: [], // Empty array for production
    pinMinLength: 4,
    maxFailedAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    useRosterAPI: true, // Set to true when roster API is integrated
    rosterAPIUrl: 'https://api.wps.gov/roster', // Replace with client roster API
  },

  // Baseline Calibration
  baseline: {
    storageType: 'database', // 'database' for production
    databaseUrl: process.env.BASELINE_DB_URL || 'postgresql://...',
    minCalibrationDuration: 300, // seconds
    contexts: ['on_foot', 'vehicle', 'day', 'night'],
  },

  // Model Configuration
  models: {
    weapon: {
      enabled: true,
      confidenceThreshold: 0.70,
      modelPath: '/models/weapon-detection.tflite', // Replace with actual model path
    },
    stance: {
      enabled: true,
      confidenceThreshold: 0.65,
      modelPath: '/models/stance-detection.tflite',
    },
    hands: {
      enabled: true,
      confidenceThreshold: 0.60,
      modelPath: '/models/hands-detection.tflite',
    },
    audio: {
      enabled: true,
      confidenceThreshold: 0.70,
      modelPath: '/models/audio-classification.tflite',
    },
  },

  // Video Recording
  video: {
    preTriggerDuration: 30, // seconds
    postTriggerDuration: 30, // seconds
    quality: '480p',
    fps: 15,
    encryptionEnabled: true,
    encryptionAlgorithm: 'AES-256',
  },

  // CAD Integration
  cad: {
    enabled: true, // Set to true when CAD is integrated
    apiUrl: 'https://api.wps.gov/cad', // Replace with client CAD API
    apiKey: process.env.CAD_API_KEY, // Set in environment variables
    timeout: 5000, // milliseconds
  },

  // Geocoding
  geocoding: {
    provider: 'google', // 'google', 'osm', 'mapbox'
    apiKey: process.env.GEOCODING_API_KEY, // Set in environment variables
    cacheEnabled: true,
    cacheTTL: 3600, // seconds
  },

  // Wearable Integration
  wearable: {
    enabled: true, // Set to true when wearable is integrated
    platform: 'apple_watch', // 'apple_watch', 'android_wear'
    heartRateThreshold: 0.40, // 40% increase from baseline
  },

  // Operational Parameters
  operational: {
    routineDuration: 300, // seconds (replace with real calculation)
    dayNightBoundary: {
      dayStart: 6, // 6 AM
      dayEnd: 18, // 6 PM
    },
    vehicleSpeedThreshold: 5, // m/s
    markerEventTypes: [
      'traffic_stop',
      'domestic_dispute',
      'suspicious_activity',
      'welfare_check',
      'arrest',
      'investigation',
    ],
  },

  // Branding
  branding: {
    appName: 'WPS Vantus', // Replace with client app name
    departmentName: 'Winnipeg Police Service',
    primaryColor: '#1E40AF', // Replace with client colors
    secondaryColor: '#3B82F6',
    logoPath: '/assets/wps-logo.png', // Replace with client logo path
  },

  // Data Retention
  retention: {
    videoClips: 90, // days
    audioTranscripts: 90, // days
    calibrationData: 365, // days
    signalData: 30, // days
    auditLogs: 2555, // days (7 years)
  },

  // Security
  security: {
    pinHashing: 'bcrypt', // 'bcrypt' or 'argon2'
    encryptionAtRest: true,
    secureStorage: true,
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  },
};
```

---

## Dashboard Configuration

**File:** `vantus-dashboard/utils/client-config.ts`

Set environment variables in `.env.local`:

```bash
NEXT_PUBLIC_DEPARTMENT_NAME="Winnipeg Police Service"
NEXT_PUBLIC_DEPARTMENT_ABBREV="WPS"
NEXT_PUBLIC_MAP_CENTER_LAT="49.8951"
NEXT_PUBLIC_MAP_CENTER_LNG="-97.1384"
NEXT_PUBLIC_BRIDGE_URL="https://bridge.wps.vantus.com"
NEXT_PUBLIC_OFFICER_ID_FORMAT="WPS-{badge}"
NEXT_PUBLIC_OFFICER_ID_PREFIX="WPS-"
NEXT_PUBLIC_OFFICER_ID_SEPARATOR="-"
NEXT_PUBLIC_APP_NAME="WPS Vantus"
NEXT_PUBLIC_PRIMARY_COLOR="#1E40AF"
NEXT_PUBLIC_SECONDARY_COLOR="#3B82F6"
```

---

## Admin Portal Configuration

**File:** `vantus-admin/utils/client-config.ts`

Same environment variables as dashboard.

---

## Bridge Server Configuration

**File:** `bridge-server/utils/client-config.js`

Set environment variables:

```bash
DEPARTMENT_NAME="Winnipeg Police Service"
DEPARTMENT_ABBREV="WPS"
BRIDGE_SERVER_URL="https://bridge.wps.vantus.com"
OFFICER_ID_FORMAT="WPS-{badge}"
OFFICER_ID_PREFIX="WPS-"
OFFICER_ID_SEPARATOR="-"
CAD_ENABLED="true"
CAD_API_URL="https://api.wps.gov/cad"
CAD_API_KEY="your-cad-api-key"
GEOCODING_PROVIDER="google"
GEOCODING_API_KEY="your-geocoding-api-key"
DATABASE_URL="postgresql://user:pass@host:5432/vantus"
SESSION_SECRET="your-session-secret"
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="your-encryption-key"
```

---

## Installation Checklist

1. **Update Config Files** with client-specific values
2. **Set Environment Variables** for all services
3. **Install Production Libraries:**
   ```bash
   cd vantus-app
   npm install react-native-bcrypt expo-secure-store crypto-js
   # OR
   npm install react-native-argon2 expo-secure-store crypto-js
   ```
4. **Replace Security Files:**
   - Copy `pinSecurityProduction.js` to `pinSecurity.js`
   - Copy `videoEncryptionProduction.js` to `videoEncryption.js`
5. **Deploy Database Schema** (see `database/deploy.sh`)
6. **Test Configuration** with client data
7. **Security Audit** before go-live

---

## Notes

- Never commit API keys or secrets to git
- Use environment variables for all sensitive data
- Test all configurations in staging before production
- Keep config files in `.gitignore` if they contain sensitive data
