/**
 * Bridge Server Constants
 * All hardcoded values and configuration constants
 */

module.exports = {
  // Server configuration
  SERVER: {
    DEFAULT_PORT: 3001,
    MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  },

  // Video processing
  VIDEO: {
    DEFAULT_INTERVAL: 1, // seconds between frames
    DEFAULT_QUALITY: 2, // JPEG quality (1-31, lower is better)
    SUPPORTED_FORMATS: ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'],
  },

  // Detection thresholds
  DETECTION: {
    DEFAULT_CONFIDENCE_THRESHOLD: 0.6,
    WEAPON_THRESHOLD: 0.70,
    STANCE_THRESHOLD: 0.65,
    HANDS_THRESHOLD: 0.60,
  },

  // Signal correlation
  CORRELATION: {
    TIME_WINDOW: 30, // seconds
    SIMILARITY_THRESHOLD: 0.5,
  },

  // Coordination
  COORDINATION: {
    PROXIMITY_THRESHOLD: 50, // meters
    BACKUP_TIME_WINDOW: 300, // 5 minutes
  },

  // Location
  LOCATION: {
    DEVIATION_THRESHOLD: 100, // meters
    OVERLAP_THRESHOLD: 0.5, // 50%
  },

  // Temporal
  TEMPORAL: {
    TREND_WINDOW_SIZE: 20,
    TREND_THRESHOLD: 0.2, // 20% change
  },

  // Error messages
  ERRORS: {
    INVALID_FILE_TYPE: 'Invalid file type. Only video files are allowed.',
    FILE_TOO_LARGE: 'File size exceeds maximum allowed size.',
    MISSING_REQUIRED_FIELD: 'Missing required field',
    INVALID_COORDINATES: 'Invalid coordinates',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  },

  // Event types
  EVENTS: {
    CONTEXTUAL_SIGNALS: 'CONTEXTUAL_SIGNALS',
    ENHANCED_AUDIO_SIGNAL: 'ENHANCED_AUDIO_SIGNAL',
    COORDINATION_SIGNAL: 'COORDINATION_SIGNAL',
    LOCATION_SIGNAL: 'LOCATION_SIGNAL',
    SIGNAL_CORRELATION: 'SIGNAL_CORRELATION',
    VIDEO_BATCH_PROGRESS: 'VIDEO_BATCH_PROGRESS',
  },
};
