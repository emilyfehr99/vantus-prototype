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
