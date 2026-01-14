/**
 * VALIDATION UTILITY FUNCTIONS
 * Data validation and sanitization utilities
 */

/**
 * Validate badge number format
 * @param {string} badgeNumber - Badge number to validate
 * @returns {boolean} True if valid
 */
export function isValidBadgeNumber(badgeNumber) {
  if (!badgeNumber || typeof badgeNumber !== 'string') return false;
  // Allow alphanumeric, at least 3 characters
  return /^[A-Z0-9]{3,}$/i.test(badgeNumber.trim());
}

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @param {number} minLength - Minimum length (default: 4)
 * @returns {boolean} True if valid
 */
export function isValidPIN(pin, minLength = 4) {
  if (!pin || typeof pin !== 'string') return false;
  return /^\d+$/.test(pin) && pin.length >= minLength;
}

/**
 * Validate GPS coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
export function isValidGPS(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Validate timestamp string
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {boolean} True if valid
 */
export function isValidTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'string') return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Validate heart rate value
 * @param {number} heartRate - Heart rate in BPM
 * @returns {boolean} True if valid
 */
export function isValidHeartRate(heartRate) {
  if (typeof heartRate !== 'number' || isNaN(heartRate)) return false;
  return heartRate > 0 && heartRate <= 250; // Reasonable range
}

/**
 * Validate probability value (0 to 1)
 * @param {number} probability - Probability value
 * @returns {boolean} True if valid
 */
export function isValidProbability(probability) {
  if (typeof probability !== 'number' || isNaN(probability)) return false;
  return probability >= 0 && probability <= 1;
}

/**
 * Validate speed value (m/s)
 * @param {number} speed - Speed in m/s
 * @returns {boolean} True if valid
 */
export function isValidSpeed(speed) {
  if (typeof speed !== 'number' || isNaN(speed)) return false;
  return speed >= 0 && speed < 100; // Reasonable max (360 km/h)
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
export function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Validate officer ID format
 * @param {string} officerId - Officer ID
 * @returns {boolean} True if valid
 */
export function isValidOfficerId(officerId) {
  if (!officerId || typeof officerId !== 'string') return false;
  return officerId.length > 0 && officerId !== 'UNKNOWN';
}

/**
 * Validate session ID format
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if valid
 */
export function isValidSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return false;
  // UUID format or custom format (alphanumeric with dashes/underscores)
  return /^[a-zA-Z0-9_-]+$/.test(sessionId) && sessionId.length >= 10;
}

/**
 * Validate signal type
 * @param {string} signalType - Signal type
 * @returns {boolean} True if valid
 */
export function isValidSignalType(signalType) {
  const validTypes = [
    'movement_anomaly',
    'vocal_stress',
    'contextual_drift',
  ];
  return validTypes.includes(signalType);
}

/**
 * Validate marker event type
 * @param {string} eventType - Marker event type
 * @returns {boolean} True if valid
 */
export function isValidMarkerEventType(eventType) {
  const validTypes = [
    'traffic_stop',
    'suspicious_activity',
    'checkpoint',
    'backup_requested',
    'other',
  ];
  return validTypes.includes(eventType);
}

/**
 * Validate context object
 * @param {Object} context - Context object
 * @returns {boolean} True if valid
 */
export function isValidContext(context) {
  if (!context || typeof context !== 'object') return false;
  
  const validMovement = ['on_foot', 'in_vehicle', 'unknown'];
  const validTimeOfDay = ['day', 'night'];
  const validOperational = ['routine', 'traffic_stop', 'checkpoint', 'other'];
  
  return (
    (!context.movement || validMovement.includes(context.movement)) &&
    (!context.timeOfDay || validTimeOfDay.includes(context.timeOfDay)) &&
    (!context.operational || validOperational.includes(context.operational))
  );
}

/**
 * Validate telemetry data point
 * @param {Object} telemetry - Telemetry data point
 * @returns {boolean} True if valid
 */
export function isValidTelemetryPoint(telemetry) {
  if (!telemetry || typeof telemetry !== 'object') return false;
  
  // Required fields
  if (!telemetry.latitude || !telemetry.longitude || !telemetry.timestamp) {
    return false;
  }
  
  // Validate GPS
  if (!isValidGPS(telemetry.latitude, telemetry.longitude)) {
    return false;
  }
  
  // Validate timestamp
  if (!isValidTimestamp(telemetry.timestamp)) {
    return false;
  }
  
  // Validate optional fields if present
  if (telemetry.speed !== undefined && !isValidSpeed(telemetry.speed)) {
    return false;
  }
  
  return true;
}

/**
 * Validate baseline data structure
 * @param {Object} baseline - Baseline data
 * @returns {boolean} True if valid
 */
export function isValidBaseline(baseline) {
  if (!baseline || typeof baseline !== 'object') return false;
  
  // Check required metadata fields
  if (!baseline.officerId || !baseline.context) {
    return false;
  }
  
  // Validate context
  if (!isValidContext(baseline.context)) {
    return false;
  }
  
  return true;
}

/**
 * Validate signal data structure
 * @param {Object} signal - Signal data
 * @returns {boolean} True if valid
 */
export function isValidSignal(signal) {
  if (!signal || typeof signal !== 'object') return false;
  
  // Required fields
  if (!signal.signalType || !signal.category || !signal.timestamp || 
      signal.probability === undefined || !signal.explanation) {
    return false;
  }
  
  // Validate types
  if (!isValidSignalType(signal.signalType)) {
    return false;
  }
  
  if (!isValidProbability(signal.probability)) {
    return false;
  }
  
  if (!isValidTimestamp(signal.timestamp)) {
    return false;
  }
  
  return true;
}

/**
 * Validate array of values
 * @param {Array} values - Array to validate
 * @param {Function} validator - Validator function for each element
 * @returns {boolean} True if all elements are valid
 */
export function validateArray(values, validator) {
  if (!Array.isArray(values)) return false;
  return values.every(validator);
}

/**
 * Validate number is within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} True if valid
 */
export function isInRange(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validate email format (for admin users)
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
