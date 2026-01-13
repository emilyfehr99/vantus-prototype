/**
 * DATE & TIME UTILITY FUNCTIONS
 * Date manipulation and formatting utilities
 */

/**
 * Get current timestamp in ISO format
 * @returns {string} ISO 8601 timestamp
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Get timestamp from Date object
 * @param {Date} date - Date object
 * @returns {string} ISO 8601 timestamp
 */
export function toTimestamp(date) {
  return date.toISOString();
}

/**
 * Parse timestamp string to Date object
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {Date} Date object
 */
export function parseTimestamp(timestamp) {
  return new Date(timestamp);
}

/**
 * Get time difference in seconds
 * @param {string|Date} startTime - Start time (ISO string or Date)
 * @param {string|Date} endTime - End time (ISO string or Date)
 * @returns {number} Difference in seconds
 */
export function getTimeDifferenceSeconds(startTime, endTime) {
  const start = typeof startTime === 'string' ? parseTimestamp(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseTimestamp(endTime) : endTime;
  return (end - start) / 1000;
}

/**
 * Get time difference in milliseconds
 * @param {string|Date} startTime - Start time (ISO string or Date)
 * @param {string|Date} endTime - End time (ISO string or Date)
 * @returns {number} Difference in milliseconds
 */
export function getTimeDifferenceMs(startTime, endTime) {
  const start = typeof startTime === 'string' ? parseTimestamp(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseTimestamp(endTime) : endTime;
  return end - start;
}

/**
 * Check if timestamp is within last N seconds
 * @param {string|Date} timestamp - Timestamp to check
 * @param {number} seconds - Number of seconds
 * @returns {boolean} True if within time window
 */
export function isWithinLastSeconds(timestamp, seconds) {
  const time = typeof timestamp === 'string' ? parseTimestamp(timestamp) : timestamp;
  const now = new Date();
  const diff = (now - time) / 1000;
  return diff >= 0 && diff <= seconds;
}

/**
 * Check if timestamp is within last N minutes
 * @param {string|Date} timestamp - Timestamp to check
 * @param {number} minutes - Number of minutes
 * @returns {boolean} True if within time window
 */
export function isWithinLastMinutes(timestamp, minutes) {
  return isWithinLastSeconds(timestamp, minutes * 60);
}

/**
 * Format duration in seconds to human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted string (e.g., "5m 30s")
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get current hour (24-hour format)
 * @returns {number} Hour (0-23)
 */
export function getCurrentHour() {
  return new Date().getHours();
}

/**
 * Check if current time is day or night
 * @param {number} dayStart - Hour when day starts (default: 6)
 * @param {number} dayEnd - Hour when day ends (default: 18)
 * @returns {string} 'day' or 'night'
 */
export function getTimeOfDay(dayStart = 6, dayEnd = 18) {
  const hour = getCurrentHour();
  return (hour >= dayStart && hour < dayEnd) ? 'day' : 'night';
}
