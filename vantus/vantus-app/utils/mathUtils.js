/**
 * MATHEMATICAL UTILITY FUNCTIONS
 * Statistical calculations and mathematical helpers used across the system
 * All functions are pure and explainable (no black-box ML)
 */

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sigmoid function for probability calculations
 * @param {number} x - Input value
 * @returns {number} Sigmoid output (0 to 1)
 */
export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate Z-score (standard score)
 * @param {number} value - Current value
 * @param {number} mean - Mean of distribution
 * @param {number} stdDev - Standard deviation
 * @returns {number} Z-score
 */
export function zScore(value, mean, stdDev) {
  if (stdDev === 0 || !stdDev) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate mean (average) of an array
 * @param {number[]} values - Array of numbers
 * @returns {number} Mean value
 */
export function mean(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/**
 * Calculate median of an array
 * @param {number[]} values - Array of numbers
 * @returns {number} Median value
 */
export function median(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 * @param {number[]} values - Array of numbers
 * @param {number} meanValue - Pre-calculated mean (optional, will calculate if not provided)
 * @returns {number} Standard deviation
 */
export function standardDeviation(values, meanValue = null) {
  if (!values || values.length === 0) return 0;
  const avg = meanValue !== null ? meanValue : mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calculate Interquartile Range (IQR)
 * @param {number[]} values - Array of numbers
 * @returns {number} IQR value
 */
export function iqr(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  return q3 - q1;
}

/**
 * Calculate Median Absolute Deviation (MAD)
 * @param {number[]} values - Array of numbers
 * @returns {number} MAD value
 */
export function mad(values) {
  if (!values || values.length === 0) return 0;
  const med = median(values);
  const deviations = values.map(v => Math.abs(v - med));
  return median(deviations);
}

/**
 * Calculate statistics for an array (mean, median, std, IQR, MAD)
 * @param {number[]} values - Array of numbers
 * @returns {Object} Statistics object
 */
export function calculateStats(values) {
  if (!values || values.length === 0) {
    return {
      mean: 0,
      median: 0,
      std: 0,
      iqr: 0,
      mad: 0,
    };
  }

  const meanValue = mean(values);
  const medianValue = median(values);
  const std = standardDeviation(values, meanValue);
  const iqrValue = iqr(values);
  const madValue = mad(values);

  return {
    mean: meanValue,
    median: medianValue,
    std: std,
    iqr: iqrValue,
    mad: madValue,
  };
}

/**
 * Calculate probability from Z-score using sigmoid
 * @param {number} zScore - Z-score value
 * @param {number} scale - Scaling factor (default: 2)
 * @param {number} minProb - Minimum probability (default: 0.05)
 * @param {number} maxProb - Maximum probability (default: 0.95)
 * @returns {number} Probability (0 to 1)
 */
export function probabilityFromZScore(zScore, scale = 2, minProb = 0.05, maxProb = 0.95) {
  const sigmoidValue = sigmoid(zScore / scale);
  return clamp(sigmoidValue, minProb, maxProb);
}

/**
 * Calculate probability from deviation score
 * @param {number} score - Deviation score
 * @param {number} divisor - Divisor for normalization (default: 4)
 * @param {number} minProb - Minimum probability (default: 0.1)
 * @param {number} maxProb - Maximum probability (default: 0.9)
 * @returns {number} Probability (0 to 1)
 */
export function probabilityFromScore(score, divisor = 4, minProb = 0.1, maxProb = 0.9) {
  const normalized = score / divisor;
  return clamp(normalized, minProb, maxProb);
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate speed from distance and time
 * @param {number} distance - Distance in meters
 * @param {number} timeSeconds - Time in seconds
 * @returns {number} Speed in m/s
 */
export function calculateSpeed(distance, timeSeconds) {
  if (timeSeconds === 0 || !timeSeconds) return 0;
  return distance / timeSeconds;
}

/**
 * Calculate acceleration from speed change
 * @param {number} initialSpeed - Initial speed in m/s
 * @param {number} finalSpeed - Final speed in m/s
 * @param {number} timeSeconds - Time in seconds
 * @returns {number} Acceleration in m/s²
 */
export function calculateAcceleration(initialSpeed, finalSpeed, timeSeconds) {
  if (timeSeconds === 0 || !timeSeconds) return 0;
  return (finalSpeed - initialSpeed) / timeSeconds;
}

/**
 * Calculate deceleration (negative acceleration)
 * @param {number} initialSpeed - Initial speed in m/s
 * @param {number} finalSpeed - Final speed in m/s
 * @param {number} timeSeconds - Time in seconds
 * @returns {number} Deceleration in m/s² (positive value)
 */
export function calculateDeceleration(initialSpeed, finalSpeed, timeSeconds) {
  const accel = calculateAcceleration(initialSpeed, finalSpeed, timeSeconds);
  return Math.abs(accel);
}
