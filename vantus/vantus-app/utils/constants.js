/**
 * VANTUS CONSTANTS
 * All hardcoded values, magic numbers, and configuration constants
 * These will be replaced with client-specific values during onboarding
 */

// ============================================
// SERVER CONFIGURATION
// ============================================
export const SERVER_URLS = {
  BRIDGE_SERVER: process.env.BRIDGE_SERVER_URL || 'http://localhost:3001',
  DEPARTMENT_API: process.env.DEPARTMENT_API_URL || null,
  CAD_API: process.env.CAD_API_URL || null,
  GEOCODING_API: process.env.GEOCODING_API_URL || null,
};

// ============================================
// GPS & MAP CONFIGURATION
// ============================================
export const MAP_CONFIG = {
  // Default coordinates (Winnipeg) - REPLACE with client jurisdiction
  DEFAULT_CENTER: {
    lat: 49.8951,
    lng: -97.1384,
  },
  // Map projection scale
  PROJECTION_SCALE: 0.1,
};

// ============================================
// OFFICER ID CONFIGURATION
// ============================================
export const OFFICER_ID = {
  // Default format - REPLACE with client format
  DEFAULT_PREFIX: 'OFFICER',
  // Format function (will be replaced with client-specific format)
  format: (badgeNumber) => {
    if (!badgeNumber) return 'UNKNOWN';
    return `${OFFICER_ID.DEFAULT_PREFIX}_${badgeNumber}`;
  },
};

// ============================================
// BASELINE CALIBRATION THRESHOLDS
// ============================================
export const BASELINE_CONFIG = {
  // Vehicle detection threshold (m/s)
  VEHICLE_SPEED_THRESHOLD: 5.0, // ~18 km/h
  // Day/night boundaries (24-hour format)
  DAY_TIME_START: 6,
  DAY_TIME_END: 18,
  // Minimum data points before generating signals
  MIN_DATA_POINTS: 20,
  // Baseline update parameters
  EMA_ALPHA: 0.1, // Exponential moving average smoothing
  MAX_UPDATE_PERCENT: 0.10, // 10% cap per update
  // Data retention (days)
  MID_TERM_DAYS: 14, // Primary baseline window
  LONG_TERM_DAYS: 90, // Long-term window
};

// ============================================
// MODEL CONFIDENCE THRESHOLDS
// ============================================
export const MODEL_THRESHOLDS = {
  WEAPON: 0.70, // 70%
  STANCE: 0.65, // 65%
  HANDS: 0.60, // 60%
  AUDIO: 0.70, // 70%
  BIOMETRIC: 0.40, // 40% above baseline
};

// ============================================
// AUTO-DISPATCH THRESHOLDS
// ============================================
export const DISPATCH_CONFIG = {
  // Heart rate thresholds
  ELEVATED_HEART_RATE: 160, // BPM
  ELEVATED_HR_DURATION: 10, // seconds
  // No movement + elevated HR
  NO_MOVEMENT_ELEVATED_HR_DURATION: 30, // seconds
  // Threat level critical
  CRITICAL_WEAPON_CONFIDENCE: 0.85, // 85%
  CRITICAL_THREAT_COUNT: 2, // Multiple threat indicators
};

// ============================================
// WELFARE CHECK CONFIGURATION
// ============================================
export const WELFARE_CHECK_CONFIG = {
  // Start periodic checks after this many minutes of active session
  PERIODIC_CHECK_INTERVAL: 10, // minutes
  // Response window
  RESPONSE_WINDOW_SECONDS: 30,
};

// ============================================
// VIDEO BUFFER CONFIGURATION
// ============================================
export const VIDEO_CONFIG = {
  BUFFER_DURATION: 30000, // 30 seconds (milliseconds)
  POST_TRIGGER_DURATION: 30000, // 30 seconds
  RESOLUTION: {
    width: 854,
    height: 480, // 480p
  },
  FRAME_RATE: 15, // FPS
};

// ============================================
// OPERATIONAL CONTEXTS
// ============================================
export const MARKER_EVENT_TYPES = {
  TRAFFIC_STOP: 'traffic_stop',
  CHECKPOINT: 'checkpoint',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  WELFARE_CHECK: 'welfare_check',
  BACKUP_REQUESTED: 'backup_requested',
};

// Expected durations for routine operations (seconds)
export const ROUTINE_DURATIONS = {
  [MARKER_EVENT_TYPES.TRAFFIC_STOP]: 300, // 5 minutes average
  [MARKER_EVENT_TYPES.CHECKPOINT]: 600, // 10 minutes average
  [MARKER_EVENT_TYPES.SUSPICIOUS_ACTIVITY]: 180, // 3 minutes average
};

// ============================================
// BRANDING
// ============================================
export const BRANDING = {
  APP_NAME: 'VANTUS', // REPLACE with client name
  PRIMARY_COLOR: '#00FF41', // Green
  SECONDARY_COLOR: '#FFAA00', // Orange
  LOGO_PATH: '/assets/logo.png',
};

// ============================================
// DATA RETENTION
// ============================================
export const DATA_RETENTION = {
  DEFAULT_DAYS: 90,
  MIN_DAYS: 1,
  MAX_DAYS: 365,
  AUTO_DELETE: true,
};

// ============================================
// DEMO/TEST DATA (REMOVE IN PRODUCTION)
// ============================================
export const DEMO_BADGES = ['12345', '67890', '11111', '22222'];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get officer ID from badge number
 * Uses configured format (default: OFFICER_${badgeNumber})
 * @param {string} badgeNumber - Officer badge number
 * @returns {string} Formatted officer ID
 */
export const getOfficerId = (badgeNumber) => {
  return OFFICER_ID.format(badgeNumber);
};

/**
 * Get server URL by type
 * @param {string} serverType - 'bridge' | 'department' | 'cad' | 'geocoding'
 * @returns {string|null} Server URL or null if not configured
 */
export const getServerUrl = (serverType) => {
  const urlMap = {
    bridge: SERVER_URLS.BRIDGE_SERVER,
    department: SERVER_URLS.DEPARTMENT_API,
    cad: SERVER_URLS.CAD_API,
    geocoding: SERVER_URLS.GEOCODING_API,
  };
  return urlMap[serverType] || null;
};

/**
 * Get model path by type
 * @param {string} modelType - 'weapon' | 'stance' | 'hands' | 'audio'
 * @returns {string|null} Model path or null if not configured
 */
export const getModelPath = (modelType) => {
  // Will be populated from config when models are ready
  return process.env[`${modelType.toUpperCase()}_MODEL_PATH`] || null;
};
