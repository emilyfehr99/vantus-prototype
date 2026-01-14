/**
 * Data Utilities
 * Common data processing and transformation functions
 */

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate z-score
 */
function calculateZScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate sigmoid function
 */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Normalize value to 0-1 range
 */
function normalize(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate exponential moving average
 */
function exponentialMovingAverage(current, previous, alpha) {
  return alpha * current + (1 - alpha) * previous;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format duration (seconds to human readable)
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get time of day category
 */
function getTimeOfDayCategory(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate similarity between two arrays (Jaccard similarity)
 */
function calculateSimilarity(arr1, arr2) {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Group items by key
 */
function groupBy(array, keyFn) {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Calculate statistics (mean, std dev, min, max)
 */
function calculateStatistics(values) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
  }
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return { mean, stdDev, min, max, count: values.length };
}

module.exports = {
  calculateDistance,
  calculateZScore,
  sigmoid,
  normalize,
  clamp,
  exponentialMovingAverage,
  formatTimestamp,
  formatDuration,
  getTimeOfDayCategory,
  calculateSimilarity,
  groupBy,
  calculateStatistics,
};
